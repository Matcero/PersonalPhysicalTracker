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
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import io.ionic.backgroundrunner.plugin.BackgroundRunnerPlugin;

@CapacitorPlugin(name = "App")
public class MainActivity extends BridgeActivity {
  private PowerManager.WakeLock wakeLock;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    registerPlugin(BackgroundRunnerPlugin.class);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      requestIgnoreBatteryOptimizations();
    }

    PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
    wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MyApp::MyWakelockTag");
    wakeLock.acquire();
  }

  @Override
  public void onStart() {
    super.onStart();
    // Interrompe il servizio quando l'app è in primo piano
    stopForegroundService();
    this.getBridge().triggerWindowJSEvent("appOnStart");
  }

  @Override
  public void onStop() {
    super.onStop();
    this.getBridge().triggerWindowJSEvent("appOnStop");
  }


  private void requestIgnoreBatteryOptimizations() {
    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
    if (!pm.isIgnoringBatteryOptimizations(getPackageName())) {
      Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
      intent.setData(Uri.parse("package:" + getPackageName()));
      startActivity(intent);
    }
  }

  @PluginMethod
  public void startForegroundService(PluginCall call) {
    Intent serviceIntent = new Intent(this, ForegroundService.class);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      startForegroundService(serviceIntent);
    } else {
      startService(serviceIntent);
    }
    call.resolve();
  }

  public void stopForegroundService() {
    Intent stopIntent = new Intent(this, ForegroundService.class);
    stopService(stopIntent);
  }


  @Override
  public void onDestroy() {
    super.onDestroy();
    this.getBridge().triggerWindowJSEvent("appOnStop");
    if (wakeLock != null && wakeLock.isHeld()) {
      wakeLock.release();
    }
  }
}
