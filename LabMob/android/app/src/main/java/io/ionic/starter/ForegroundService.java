package io.ionic.starter;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class ForegroundService extends Service {
  private static final String CHANNEL_ID = "ForegroundServiceChannel";
  private Handler handler;
  private Runnable runnable;

  @Override
  public void onCreate() {
    super.onCreate();

    // Creazione del canale di notifica
    createNotificationChannel();

    // Impostiamo un handler per inviare notifiche ogni 20 secondi
    handler = new Handler();
    runnable = new Runnable() {
      @Override
      public void run() {
        sendNotification();
        handler.postDelayed(this, 20000); // 20 secondi
      }
    };
    handler.post(runnable); // Avvia il runnable
  }

  private void sendNotification() {
    Intent notificationIntent = new Intent(this, MainActivity.class);
    PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

    Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Promemoria Attività")
      .setContentText("Siamo un po' statici qui? fai una bella attività!")
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentIntent(pendingIntent)
      .build();

    startForeground(1, notification); // Avvia il servizio in foreground con la notifica
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

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    return START_STICKY; // Assicura che il servizio rimanga attivo
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    handler.removeCallbacks(runnable); // Rimuovi il runnable quando il servizio viene distrutto
  }
}
