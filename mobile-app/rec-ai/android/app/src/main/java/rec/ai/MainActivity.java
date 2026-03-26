package rec.ai;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;

import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before super.onCreate()
        registerPlugin(DownloaderPlugin.class);
        registerPlugin(RecordingServicePlugin.class);

        super.onCreate(savedInstanceState);

        // Override the WebChromeClient so that the WebView's microphone permission
        // is always in sync with the Android OS RECORD_AUDIO permission.
        //
        // Problem: Android WebView caches per-origin permission decisions in
        // WebViewDatabase. If the user previously denied the in-app prompt, the
        // WebView keeps that denial cached and never calls onPermissionRequest again
        // — even after the user grants RECORD_AUDIO in Android Settings. This means
        // getUserMedia() keeps throwing NotAllowedError despite the OS permission
        // being granted.
        //
        // Fix: intercept onPermissionRequest and directly grant RESOURCE_AUDIO_CAPTURE
        // whenever RECORD_AUDIO is already granted at the Android OS level.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                java.util.List<String> toGrant = new java.util.ArrayList<>();
                boolean fallbackToSuper = false;

                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                        if (ContextCompat.checkSelfPermission(
                                MainActivity.this,
                                Manifest.permission.RECORD_AUDIO
                        ) == PackageManager.PERMISSION_GRANTED) {
                            // OS permission is granted — bypass the stale WebView cache
                            // and grant the WebView permission directly.
                            toGrant.add(resource);
                        } else {
                            // OS permission not yet granted — let Capacitor's bridge
                            // handle it (will show the Android runtime permission dialog).
                            fallbackToSuper = true;
                        }
                    } else {
                        // Non-audio resources (e.g. camera) — let bridge handle normally.
                        fallbackToSuper = true;
                    }
                }

                if (fallbackToSuper) {
                    super.onPermissionRequest(request);
                } else {
                    request.grant(toGrant.toArray(new String[0]));
                }
            }
        });
    }
}
