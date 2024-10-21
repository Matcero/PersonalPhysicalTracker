package com.example.personalphysicaltracker;

import static android.content.ContentValues.TAG;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import android.util.Log;

public class ForegroundService extends Service {
    public static final String CHANNEL_ID = "ForegroundServiceChannel";
    private long startTime;
    private Handler handler;
    private Runnable updateNotificationRunnable;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Servizio creato");
        startTime = System.currentTimeMillis(); // Salva il tempo di inizio dell'attività
        handler = new Handler();
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

        // Avvia il runnable che aggiorna la notifica ogni secondo
        updateNotificationRunnable = new Runnable() {
            @Override
            public void run() {
                updateNotification(pendingIntent); // Aggiorna la notifica con il tempo trascorso
                handler.postDelayed(this, 1000); // Aggiorna ogni secondo
            }
        };
        handler.post(updateNotificationRunnable); // Avvia il runnable

        return START_STICKY; // Assicura che il servizio venga riavviato automaticamente in caso di chiusura
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(updateNotificationRunnable); // Rimuovi i callback quando il servizio viene distrutto
        Log.d(TAG, "Servizio fermato");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Il servizio non è legato a un client, quindi ritorna null
    }

    // Metodo per aggiornare la notifica con il tempo trascorso
    private void updateNotification(PendingIntent pendingIntent) {
        long elapsedTimeMillis = System.currentTimeMillis() - startTime; // Calcola dal tempo di inizio dell'attività
        String elapsedTime = formatElapsedTime(elapsedTimeMillis / 1000); // Converti millisecondi in secondi

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Attività in corso")
                .setContentText("Tempo trascorso: " + elapsedTime) // Mostra il tempo in tempo reale
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true) // Notifica persistente
                .build();

        startForeground(1, notification); // Aggiorna la notifica
    }


    // Metodo per formattare il tempo trascorso (HH:MM:SS)
    private String formatElapsedTime(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long remainingSeconds = seconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, remainingSeconds);
    }
}
