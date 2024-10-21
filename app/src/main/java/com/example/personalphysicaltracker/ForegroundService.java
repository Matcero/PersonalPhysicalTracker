package com.example.personalphysicaltracker;

import static android.content.ContentValues.TAG;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import android.util.Log;

public class ForegroundService extends Service {
    public static final String CHANNEL_ID = "ForegroundServiceChannel";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Servizio creato");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Servizio avviato");

        // Intent per tornare alla MainActivity quando l'utente tocca la notifica
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE
        );

        // Costruzione della notifica persistente
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Attività in corso")
                .setContentText("La tua attività fisica è in corso")
                .setSmallIcon(android.R.drawable.ic_dialog_info) // Cambia l'icona se necessario
                .setContentIntent(pendingIntent)
                .setOngoing(true) // La notifica rimarrà finché il servizio è in foreground
                .build();

        // Avvio del servizio in foreground con la notifica
        startForeground(1, notification);

        // Puoi inserire qui la logica per continuare a monitorare attività fisica, posizione o altro
        // Anche quando il telefono è in standby

        return START_STICKY; // Assicura che il servizio venga riavviato automaticamente in caso di chiusura
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Servizio fermato");
        // Puoi aggiungere logica per salvare lo stato dell'attività o rilasciare risorse
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Il servizio non è legato a un client, quindi ritorna null
    }
}
