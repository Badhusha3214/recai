package rec.ai;

import android.Manifest;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

/**
 * Capacitor plugin that exposes start() / stop() to JavaScript so that
 * RecordPage.vue can launch and dismiss the RecordingService foreground service.
 */
@CapacitorPlugin(
    name = "RecordingService",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { "android.permission.POST_NOTIFICATIONS" }
        )
    }
)
public class RecordingServicePlugin extends Plugin {

    private PluginCall savedCall;

    @PluginMethod
    public void start(PluginCall call) {
        // On Android 13+ we need POST_NOTIFICATIONS to show the foreground notification.
        // Request it if not yet granted; proceed either way (foreground service still works).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != PermissionState.GRANTED) {
                savedCall = call;
                requestPermissionForAlias("notifications", call, "onNotificationPermissionResult");
                return;
            }
        }
        launchService(call);
    }

    @PermissionCallback
    private void onNotificationPermissionResult(PluginCall call) {
        // Whether granted or denied, still launch the service — the notification is
        // part of a foreground service so Android may still show it on some versions.
        launchService(call);
    }

    private void launchService(PluginCall call) {
        Intent intent = new Intent(getContext(), RecordingService.class);
        intent.setAction(RecordingService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), RecordingService.class);
        intent.setAction(RecordingService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }
}
