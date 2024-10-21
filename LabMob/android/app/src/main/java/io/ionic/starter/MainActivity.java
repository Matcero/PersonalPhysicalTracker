package io.ionic.starter;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import io.ionic.backgroundrunner.plugin.BackgroundRunnerPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Altri codici

    // Registrazione del plugin
    this.initPlugin(BackgroundRunnerPlugin.class);
  }

  private void initPlugin(Class<BackgroundRunnerPlugin> backgroundRunnerPluginClass) {
  }
}
