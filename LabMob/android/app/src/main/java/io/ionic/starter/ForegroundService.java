package io.ionic.starter;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class ForegroundService extends Service implements SensorEventListener {
  public static final String CHANNEL_ID = "ForegroundServiceChannel";
  private long startTime;
  private Handler handler;
  private Runnable updateNotificationRunnable;
  private SensorManager sensorManager;
  private Sensor stepCounterSensor;
  private long stepCount = 0;
  private long initialStepCount = -1;
  private PendingIntent pendingIntent;

  @Override
  public void onCreate() {
    super.onCreate();
    createNotificationChannel();
    Log.d("ForegroundService", "Servizio creato");

    startTime = System.currentTimeMillis();
    handler = new Handler();

    updateNotificationRunnable = new Runnable() {
      @Override
      public void run() {
        updateNotification();
        handler.postDelayed(this, 5000); // Intervallo di aggiornamento a 5 secondi
      }
    };
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    Log.d("ForegroundService", "Servizio avviato");
    // Non avviamo il tracking immediatamente
    return START_STICKY;
  }

  public void startTracking() {
    Intent notificationIntent = new Intent(this, MainActivity.class);
    pendingIntent = PendingIntent.getActivity(
      this,
      0,
      notificationIntent,
      PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
    );

    startForeground(1, getForegroundNotification("Attività in corso", "Il monitoraggio è attivo"));

    sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
    stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
    if (stepCounterSensor != null) {
      sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL);
    } else {
      Log.e("ForegroundService", "Contapassi non supportato");
    }

    handler.post(updateNotificationRunnable);
    Log.d("ForegroundService", "Tracking attività avviato.");
  }

  private Notification getForegroundNotification(String title, String text) {
    return new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(text)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .build();
  }

  @Override
  public void onDestroy() {
    super.onDestroy();

    // Disabilita l'aggiornamento della notifica
    if (handler != null && updateNotificationRunnable != null) {
      handler.removeCallbacks(updateNotificationRunnable);
    }

    // Rimuovi il listener del contapassi
    if (sensorManager != null) {
      sensorManager.unregisterListener(this);
    }
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private void updateNotification() {
    long elapsedTimeMillis = System.currentTimeMillis() - startTime;
    String elapsedTime = formatElapsedTime(elapsedTimeMillis / 1000);

    double distance = stepCount * 0.00078; // Distanza in km
    double calories = stepCount * 0.05;     // Calorie

    Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Attività in corso")
      .setContentText("Tempo: " + elapsedTime + " | Passi: " + stepCount + " | Distanza: " + String.format("%.2f", distance) + " km | Calorie: " + String.format("%.2f", calories) + " kcal")
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .build();

    startForeground(1, notification);
  }

  private String formatElapsedTime(long totalSeconds) {
    long hours = totalSeconds / 3600;
    long minutes = (totalSeconds % 3600) / 60;
    long seconds = totalSeconds % 60;
    return String.format("%02d:%02d:%02d", hours, minutes, seconds);
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel serviceChannel = new NotificationChannel(
        CHANNEL_ID,
        "Foreground Service Channel",
        NotificationManager.IMPORTANCE_HIGH // Cambiato a IMPORTANCE_HIGH
      );

      NotificationManager manager = getSystemService(NotificationManager.class);
      manager.createNotificationChannel(serviceChannel);
    }
  }

  @Override
  public void onSensorChanged(SensorEvent event) {
    if (initialStepCount == -1) {
      initialStepCount = (long) event.values[0];
    }
    stepCount = (long) event.values[0] - initialStepCount;
    Log.d("ForegroundService", "Passi: " + stepCount);
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
    // Non utilizzato
  }
}
