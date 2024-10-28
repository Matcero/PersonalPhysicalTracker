package io.ionic.starter;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.net.Uri;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;
import io.ionic.backgroundrunner.plugin.BackgroundRunnerPlugin;

public class MainActivity extends BridgeActivity {
  private PowerManager.WakeLock wakeLock;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    registerPlugin(BackgroundRunnerPlugin.class);

    // Verifica la versione API prima di chiamare i metodi
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      requestIgnoreBatteryOptimizations();
    }

    // Aggiungi il WakeLock
    PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
    wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MyApp::MyWakelockTag");
    wakeLock.acquire();
  }

  private void requestIgnoreBatteryOptimizations() {
    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
    if (!pm.isIgnoringBatteryOptimizations(getPackageName())) {
      Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
      intent.setData(Uri.parse("package:" + getPackageName()));
      startActivity(intent);
    }
  }

  // Metodo per avviare il servizio
  public void startForegroundService() {
    Intent serviceIntent = new Intent(this, ForegroundService.class);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      startForegroundService(serviceIntent);
    } else {
      startService(serviceIntent);
    }
  }

  // Metodo per interrompere il servizio
  public void stopForegroundService() {
    Intent stopIntent = new Intent(this, ForegroundService.class);
    stopService(stopIntent);
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    if (wakeLock != null && wakeLock.isHeld()) {
      wakeLock.release();
    }
  }
}
