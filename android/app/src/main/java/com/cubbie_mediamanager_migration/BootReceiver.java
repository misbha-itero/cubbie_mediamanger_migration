// BootReceiver.java

package com.cubbie_mediamanager_migration;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.app.AlarmManager;
import android.app.PendingIntent;

public class BootReceiver extends BroadcastReceiver {

   @Override

   public void onReceive(Context context, Intent intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(new Intent(context, BackgroundService.class));
    } else {
        context.startService(new Intent(context, BackgroundService.class));
    }

    Intent i = new Intent(context, MainActivity.class);
	i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE); // CORRECT
	PendingIntent pending = PendingIntent.getActivity(context, 0, i, 0);
	manager.set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + (30 * 1000), pending);
}

}