package com.zwf3lbs.map.module;

import android.app.Activity;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.zwf3lbs.BaseModule;

import static com.facebook.react.common.ReactConstants.TAG;

public class IdleTimerModule extends BaseModule {

    private static final String REACT_CLASS = "IdleTimerModule";


    public IdleTimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }


    @ReactMethod
    public void open() {
        Log.i(TAG, "开启常亮");
        final Activity currentActivity = this.getCurrentActivity();
        if (currentActivity != null) {
            currentActivity.runOnUiThread(new Runnable() {
                public void run() {
                    Window window = currentActivity.getWindow();
                    if (window != null) {
                        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    }
                }
            });
        }
    }

    @ReactMethod
    public void close() {
        Log.i(TAG, "关闭常亮");

        final Activity currentActivity = this.getCurrentActivity();
        if (currentActivity != null) {
            currentActivity.runOnUiThread(new Runnable() {
                public void run() {
                    Window window = currentActivity.getWindow();
                    if (window != null) {
                        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    }
                }
            });
        }
    }


}
