package rec.ai;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(
    name = "NativeFileRecorder",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class NativeFileRecorderPlugin extends Plugin {

    private static final String MIME_TYPE = "audio/aac";
    private static final int DEFAULT_CHUNK_SIZE = 1024 * 1024;

    private MediaRecorder recorder;
    private File currentFile;
    private long startedAtMs;
    private long pausedAtMs;
    private long pausedTotalMs;
    private boolean isPaused;
    private PluginCall pendingStartCall;

    @PluginMethod
    public void start(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingStartCall = call;
            requestPermissionForAlias("microphone", call, "onMicrophonePermissionResult");
            return;
        }

        startRecorder(call);
    }

    @PermissionCallback
    private void onMicrophonePermissionResult(PluginCall call) {
        PluginCall startCall = pendingStartCall != null ? pendingStartCall : call;
        pendingStartCall = null;

        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            startRecorder(startCall);
        } else {
            startCall.reject("MISSING_MICROPHONE_PERMISSION");
        }
    }

    private void startRecorder(PluginCall call) {
        if (recorder != null) {
            call.reject("ALREADY_RECORDING");
            return;
        }

        try {
            File dir = new File(getContext().getCacheDir(), "recordings");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("Failed to create recording directory");
                return;
            }

            currentFile = File.createTempFile("recording_", ".aac", dir);
            recorder = buildRecorder(currentFile);
            recorder.prepare();
            recorder.start();

            startedAtMs = System.currentTimeMillis();
            pausedAtMs = 0L;
            pausedTotalMs = 0L;
            isPaused = false;
            call.resolve();
        } catch (Exception error) {
            releaseRecorder();
            if (currentFile != null) {
                currentFile.delete();
                currentFile = null;
            }
            call.reject(error.getMessage() != null ? error.getMessage() : "Failed to start recording", error);
        }
    }

    private MediaRecorder buildRecorder(File outputFile) throws IOException {
        MediaRecorder mediaRecorder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
            ? new MediaRecorder(getContext())
            : new MediaRecorder();

        mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
        mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.AAC_ADTS);
        mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
        mediaRecorder.setAudioEncodingBitRate(64000);
        mediaRecorder.setAudioSamplingRate(44100);
        mediaRecorder.setAudioChannels(1);
        mediaRecorder.setOutputFile(outputFile.getAbsolutePath());
        return mediaRecorder;
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (recorder == null) {
            call.reject("NOT_RECORDING");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            call.resolve();
            return;
        }
        try {
            if (!isPaused) {
                recorder.pause();
                pausedAtMs = System.currentTimeMillis();
                isPaused = true;
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Failed to pause recording", error);
        }
    }

    @PluginMethod
    public void resume(PluginCall call) {
        if (recorder == null) {
            call.reject("NOT_RECORDING");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            call.resolve();
            return;
        }
        try {
            if (isPaused) {
                recorder.resume();
                pausedTotalMs += System.currentTimeMillis() - pausedAtMs;
                pausedAtMs = 0L;
                isPaused = false;
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Failed to resume recording", error);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (recorder == null || currentFile == null) {
            call.reject("NOT_RECORDING");
            return;
        }

        File finishedFile = currentFile;
        long stoppedAtMs = System.currentTimeMillis();
        if (isPaused && pausedAtMs > 0L) {
            pausedTotalMs += stoppedAtMs - pausedAtMs;
        }

        try {
            recorder.stop();
        } catch (RuntimeException error) {
            finishedFile.delete();
            releaseRecorder();
            currentFile = null;
            call.reject("Recording was too short or could not be saved", error);
            return;
        } finally {
            releaseRecorder();
        }

        currentFile = null;
        long durationMs = Math.max(0L, stoppedAtMs - startedAtMs - pausedTotalMs);
        call.resolve(fileResult(finishedFile, durationMs));
    }

    @PluginMethod
    public void readChunk(PluginCall call) {
        String path = call.getString("path");
        int offset = call.getInt("offset", 0);
        int size = call.getInt("size", DEFAULT_CHUNK_SIZE);

        if (path == null || path.trim().isEmpty()) {
            call.reject("Missing file path");
            return;
        }

        File file = new File(path);
        if (!file.exists()) {
            call.reject("Recording file not found");
            return;
        }

        int safeSize = Math.max(1, Math.min(size, 2 * 1024 * 1024));
        byte[] buffer = new byte[safeSize];

        try (FileInputStream input = new FileInputStream(file)) {
            long skipped = input.skip(Math.max(0, offset));
            while (skipped < offset) {
                long extra = input.skip(offset - skipped);
                if (extra <= 0) break;
                skipped += extra;
            }

            int read = input.read(buffer);
            if (read < 0) read = 0;

            byte[] exact = new byte[read];
            System.arraycopy(buffer, 0, exact, 0, read);

            JSObject result = new JSObject();
            result.put("base64", Base64.encodeToString(exact, Base64.NO_WRAP));
            result.put("bytesRead", read);
            result.put("nextOffset", offset + read);
            result.put("done", offset + read >= file.length());
            result.put("fileSize", file.length());
            call.resolve(result);
        } catch (IOException error) {
            call.reject("Failed to read recording chunk", error);
        }
    }

    @PluginMethod
    public void copyToData(PluginCall call) {
        String path = call.getString("path");
        String fileName = call.getString("fileName");

        if (path == null || fileName == null) {
            call.reject("Missing file path or file name");
            return;
        }

        File source = new File(path);
        File destination = new File(getContext().getFilesDir(), fileName);

        try (FileInputStream input = new FileInputStream(source);
             FileOutputStream output = new FileOutputStream(destination)) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            JSObject result = new JSObject();
            result.put("path", destination.getAbsolutePath());
            call.resolve(result);
        } catch (IOException error) {
            call.reject("Failed to copy recording", error);
        }
    }

    @PluginMethod
    public void deleteFile(PluginCall call) {
        String path = call.getString("path");
        if (path != null) {
            new File(path).delete();
        }
        call.resolve();
    }

    private JSObject fileResult(File file, long durationMs) {
        Uri uri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            file
        );

        JSObject result = new JSObject();
        result.put("path", file.getAbsolutePath());
        result.put("uri", uri.toString());
        result.put("webPath", uri.toString());
        result.put("mimeType", MIME_TYPE);
        result.put("durationMs", durationMs);
        result.put("size", file.length());
        return result;
    }

    private void releaseRecorder() {
        if (recorder != null) {
            recorder.reset();
            recorder.release();
            recorder = null;
        }
    }
}
