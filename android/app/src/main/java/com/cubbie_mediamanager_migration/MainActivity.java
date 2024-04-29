package com.cubbie_mediamanager_migration;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import android.os.Bundle; 
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "cubbie_mediamanager_migration";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }

    @Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Log statement to indicate that onCreate is called
    Log.i("MainActivity", "onCreate method called");

    // Check if the device's SDK version is Oreo or higher
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        // If SDK version is Oreo or higher, start the foreground service
        startForegroundService(new Intent(this, BackgroundService.class));
    } else {
        // Log statement for devices with SDK version lower than Oreo
        Log.i("MainActivity", "onCreate method called on devices with SDK version lower than Oreo");
        
        // Start the background service
        startService(new Intent(this, BackgroundService.class));
    }
}

}
