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
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

public class ForegroundService extends Service implements SensorEventListener{
    public static final String CHANNEL_ID = "ForegroundServiceChannel";
    private long startTime;
    private Handler handler;
    private Runnable updateNotificationRunnable;
    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private long stepCount = 0;
    private long initialStepCount = -1;

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

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (stepCounterSensor != null) {
            sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL);
        } else {
            Log.e(TAG, "Contapassi non supportato");
        }

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

    /*
    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(updateNotificationRunnable); // Rimuovi i callback quando il servizio viene distrutto
        Log.d(TAG, "Servizio fermato");
    }*/

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Il servizio non è legato a un client, quindi ritorna null
    }

    // Metodo per aggiornare la notifica con il tempo trascorso
    private void updateNotification(PendingIntent pendingIntent) {
        long elapsedTimeMillis = System.currentTimeMillis() - startTime;
        String elapsedTime = formatElapsedTime(elapsedTimeMillis / 1000);

        // Mostra i dati dell'attività
        double distance = stepCount * 0.00078;
        double calories = stepCount * 0.05;

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Attività in corso")
                .setContentText("Tempo: " + elapsedTime + " | Passi: " + stepCount + " | Distanza: " + String.format("%.2f", distance) + " km | Calorie: " + String.format("%.2f", calories) + " kcal")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();

        startForeground(1, notification);
    }



    // Metodo per formattare il tempo trascorso (HH:MM:SS)
    private String formatElapsedTime(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long remainingSeconds = seconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, remainingSeconds);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            if (initialStepCount == -1) {
                initialStepCount = (long) event.values[0];
            }
            stepCount = (long) event.values[0] - initialStepCount;

            // Puoi calcolare distanza e calorie qui:
            double distance = stepCount * 0.00078; // Passo medio in km
            double calories = stepCount * 0.05; // Stima calorica

            Log.d(TAG, "Passi: " + stepCount + ", Distanza: " + distance + " km, Calorie: " + calories + " kcal");
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Non necessario per questa implementazione
    }



}
