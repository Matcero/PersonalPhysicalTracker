package io.ionic.starter;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import android.util.Log;


public class ForegroundService extends Service implements SensorEventListener {
  private static final String CHANNEL_ID = "ForegroundServiceChannel";
  private SensorManager sensorManager;
  private Sensor stepSensor;
  private int stepCount = 0;
  private Handler handler;
  private Runnable runnable;

  @Override
  public void onCreate() {
    super.onCreate();

    // Creazione del canale di notifica
    createNotificationChannel();

    // Configurazione del sensore per il contapassi
    sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
    if (sensorManager != null) {
      stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
      if (stepSensor != null) {
        sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
      }
    }


    handler = new Handler();
    runnable = new Runnable() {
      @Override
      public void run() {
        sendNotification();
        handler.postDelayed(this, 20000);
      }
    };
    handler.post(runnable);
  }


  private void sendNotification() {
    if (handler != null) {
      Intent notificationIntent = new Intent(this, MainActivity.class);
      PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

      Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("Promemoria Attività")
        .setContentText("Siamo un po' statici qui? fai una bella attività!")
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentIntent(pendingIntent)
        .build();

      startForeground(1, notification);
    }
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel serviceChannel = new NotificationChannel(
        CHANNEL_ID,
        "Foreground Service Channel",
        NotificationManager.IMPORTANCE_DEFAULT
      );

      NotificationManager manager = getSystemService(NotificationManager.class);
      if (manager != null) {
        manager.createNotificationChannel(serviceChannel);
      }
    }
  }

  public void stopNotification() {
    handler.removeCallbacks(runnable);
    stopForeground(true); // Ferma il servizio foreground
  }


  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null && intent.getBooleanExtra("stopService", false)) {
      stopSelf();
      return START_NOT_STICKY;
    }

    // Inizia a inviare notifiche solo quando il servizio è attivo
    handler.post(runnable);
    return START_STICKY;
  }


  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    handler.removeCallbacks(runnable);
    if (sensorManager != null) {
      sensorManager.unregisterListener(this);
    }
  }

  // Gestisci gli eventi del contapassi
  @Override
  public void onSensorChanged(SensorEvent event) {
    if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
      stepCount = (int) event.values[0]; // Incrementa i passi
      Log.d("ForegroundService", "Passi aggiornati: " + stepCount);
    }
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {

  }
}
