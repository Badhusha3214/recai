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

    private static final String MIME_TYPE = "audio/mp4";
    private static final int DEFAULT_CHUNK_SIZE = 256 * 1024;

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

            // Delete stale temp files from previous sessions to free cache space.
            File[] stale = dir.listFiles();
            if (stale != null) {
                for (File f : stale) f.delete();
            }

            // Require at least 50 MB free to avoid write failures mid-recording.
            long freeBytes = dir.getFreeSpace();
            if (freeBytes < 50L * 1024 * 1024) {
                call.reject("Not enough storage space to record (" + (freeBytes / 1024 / 1024) + " MB free). Please free up space and try again.");
                return;
            }

            currentFile = File.createTempFile("recording_", ".m4a", dir);
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
        mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
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
            call.reject("Recording failed: " + (error.getMessage() != null ? error.getMessage() : "MediaRecorder.stop() threw"), error);
            return;
        } finally {
            releaseRecorder();
        }

        currentFile = null;
        long durationMs = Math.max(0L, stoppedAtMs - startedAtMs - pausedTotalMs);

        // MPEG_4 muxer writes the moov atom last. On some Android/F2FS devices the OS
        // delays flushing it even after stop() returns. Poll until moov appears (or 5s),
        // fsyncing each iteration to force pending page-cache writes to the inode.
        long deadline = System.currentTimeMillis() + 5000;
        while (!hasMoovAtom(finishedFile) && System.currentTimeMillis() < deadline) {
            try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(finishedFile, "rw")) {
                raf.getChannel().force(true);
            } catch (IOException ignored) {}
            try { Thread.sleep(100); } catch (InterruptedException ignored) {}
        }

        JSObject result = fileResult(finishedFile, durationMs);
        result.put("freeSpaceBytes", finishedFile.getParentFile() != null ? finishedFile.getParentFile().getFreeSpace() : -1L);
        call.resolve(result);
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

            // Read until buffer is full or EOF — single read() is not guaranteed to fill buffer
            int totalRead = 0;
            while (totalRead < safeSize) {
                int n = input.read(buffer, totalRead, safeSize - totalRead);
                if (n < 0) break;
                totalRead += n;
            }

            byte[] exact = new byte[totalRead];
            System.arraycopy(buffer, 0, exact, 0, totalRead);

            // done = we hit EOF before filling the buffer (don't trust file.length() — it can be stale)
            boolean done = totalRead < safeSize;

            JSObject result = new JSObject();
            result.put("base64", Base64.encodeToString(exact, Base64.NO_WRAP));
            result.put("bytesRead", totalRead);
            result.put("nextOffset", offset + totalRead);
            result.put("done", done);
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

    /** Walk the top-level MP4 atom list and return true if a 'moov' atom is present. */
    private boolean hasMoovAtom(File file) {
        long len = file.length();
        if (len < 8) return false;
        try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(file, "r")) {
            while (raf.getFilePointer() + 8 <= len) {
                byte[] header = new byte[8];
                raf.readFully(header);
                long size = ((header[0] & 0xFFL) << 24) | ((header[1] & 0xFFL) << 16)
                          | ((header[2] & 0xFFL) << 8) | (header[3] & 0xFFL);
                if (header[4] == 'm' && header[5] == 'o' && header[6] == 'o' && header[7] == 'v') {
                    return true;
                }
                if (size < 8) break; // malformed
                // Seek past atom body (size includes the 8-byte header already read)
                raf.seek(raf.getFilePointer() + size - 8);
            }
        } catch (IOException ignored) {}
        return false;
    }

    private void releaseRecorder() {
        if (recorder != null) {
            recorder.reset();
            recorder.release();
            recorder = null;
        }
    }
}
