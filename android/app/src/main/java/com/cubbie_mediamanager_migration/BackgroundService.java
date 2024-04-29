package com.cubbie_mediamanager_migration;

import android.app.Notification;

import android.app.PendingIntent;

import android.app.Service;

import android.content.Context;

import android.content.Intent;

import android.os.Handler;

import android.os.IBinder;

import androidx.core.app.NotificationCompat;

import android.app.NotificationManager;

import android.app.NotificationChannel;

import android.os.Build;

import com.facebook.react.HeadlessJsTaskService;

public class BackgroundService extends Service {

   private static final int SERVICE_NOTIFICATION_ID = 100001;

   private static final String CHANNEL_ID = "BACKGROUND";

   private Handler handler = new Handler();

   private Runnable runnableCode = new Runnable() {

       @Override

       public void run() {

           Context context = getApplicationContext();

           Intent myIntent = new Intent(context, BackgroundEventService.class);

           context.startService(myIntent);
           HeadlessJsTaskService.acquireWakeLockNow(context);

           handler.postDelayed(this, 300000); // 5 Min

       }

   };

   @Override

   public IBinder onBind(Intent intent) {

       return null;

   }

   @Override

   public void onCreate() {

       super.onCreate();

   }

   @Override

   public void onDestroy() {

       super.onDestroy();

       this.handler.removeCallbacks(this.runnableCode);

   }

   @Override
   public int onStartCommand(Intent intent, int flags, int startId) {
    startForeground(SERVICE_NOTIFICATION_ID, createNotification());
       this.handler.post(this.runnableCode);
       
       // Start your service logic here without showing a notification
   
       return START_STICKY_COMPATIBILITY;
   }

private Notification createNotification() {
    // Create a notification for the foreground service
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Background Service", NotificationManager.IMPORTANCE_DEFAULT);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    Intent notificationIntent = new Intent(this, MainActivity.class);
    PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE); // Add FLAG_IMMUTABLE flag

    return new NotificationCompat.Builder(this, CHANNEL_ID)
            // .setContentTitle("Example Service")
            // .setContentText("Running in background")
            // .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .build();
}

}
