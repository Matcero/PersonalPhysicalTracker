package com.example.personalphysicaltracker;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class ForegroundService extends Service {
    public static final String CHANNEL_ID = "ForegroundServiceChannel";

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE  // Aggiunto FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Attività in corso")
                .setContentText("La tua attività fisica è in corso")
                .setSmallIcon(android.R.drawable.ic_dialog_info) // Usa una icona di default temporaneamente
                .setContentIntent(pendingIntent)
                .build();

        startForeground(1, notification);

        // Se vuoi fare qualcosa in background, puoi farlo qui

        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
