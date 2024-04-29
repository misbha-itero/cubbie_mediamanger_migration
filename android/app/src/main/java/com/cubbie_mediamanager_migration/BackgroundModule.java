package com.cubbie_mediamanager_migration;

import android.content.Intent;
import android.app.ActivityManager;
import android.content.Context;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.util.Log;
import javax.annotation.Nonnull;
import java.util.List;
import com.facebook.react.bridge.Promise;

public class BackgroundModule extends ReactContextBaseJavaModule {

   public static final String REACT_CLASS = "Background";

   private static ReactApplicationContext reactContext;

   public BackgroundModule(@Nonnull ReactApplicationContext reactContext) {

       super(reactContext);

       this.reactContext = reactContext;

   }

   @Nonnull

   @Override

   public String getName() {

       return REACT_CLASS;

   }

   @ReactMethod

   public void startService() {

       this.reactContext.startService(new Intent(this.reactContext, BackgroundService.class));

   }

   @ReactMethod

   public void stopService() {

       this.reactContext.stopService(new Intent(this.reactContext, BackgroundService.class));

   }

   @ReactMethod
public void isServiceRunning(Promise promise) {
    boolean isRunning = isServiceRunningByClassName("com.cubbie_mediamanager_migration.BackgroundService");
    promise.resolve(isRunning);
}


   private boolean isServiceRunningByClassName(String serviceClassName) {
       ActivityManager manager = (ActivityManager) reactContext.getSystemService(Context.ACTIVITY_SERVICE);
       if (manager != null) {
           List<ActivityManager.RunningServiceInfo> services = manager.getRunningServices(Integer.MAX_VALUE);
           if (services != null) {
               for (ActivityManager.RunningServiceInfo service : services) {
                   if (serviceClassName.equals(service.service.getClassName())) {
                       return true;
                   }
               }
           }
       }
       return false;
   }

}