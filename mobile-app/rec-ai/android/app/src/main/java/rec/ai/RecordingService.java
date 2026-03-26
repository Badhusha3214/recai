package rec.ai;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

/**
 * Foreground service that keeps the app process alive while recording audio.
 *
 * Why this is needed:
 * - Without a foreground service, Android can kill/throttle the WebView process
 *   when the app goes to background or the screen turns off.
 * - A foreground service with PARTIAL_WAKE_LOCK keeps the CPU running so
 *   CapacitorVoiceRecorder's native AudioRecord thread continues uninterrupted.
 * - The visible notification is mandatory; it tells the user recording is active.
 */
public class RecordingService extends Service {

    public static final String CHANNEL_ID = "echobit_recording";
    public static final String ACTION_START = "rec.ai.ACTION_START_RECORDING";
    public static final String ACTION_STOP  = "rec.ai.ACTION_STOP_RECORDING";

    private static final int NOTIFICATION_ID = 101;

    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }

        // Acquire a partial wake lock — keeps the CPU alive with screen off
        if (wakeLock == null || !wakeLock.isHeld()) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "Echobit::RecordingWakeLock");
            wakeLock.acquire(/* 3 hours max */ 3 * 60 * 60 * 1000L);
        }

        // Bring user back to the app when they tap the notification
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Recording in progress")
                .setContentText("Echobit is recording — tap to return")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setColor(0xFF059669)           // app green
                .setColorized(true)
                .setContentIntent(pendingIntent)
                .setOngoing(true)               // cannot be dismissed by swipe
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();

        // Android 14 (API 34) requires the foreground service type in the call
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        return START_STICKY; // restart automatically if the system kills us
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // not a bound service
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Recording",
                    NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Shown while audio recording is active");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
