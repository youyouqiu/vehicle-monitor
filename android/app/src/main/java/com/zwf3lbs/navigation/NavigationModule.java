package com.zwf3lbs.navigation;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import com.baidu.mapapi.model.LatLng;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.zwf3lbs.BaseModule;
import com.zwf3lbs.navigation.util.GPS;
import com.zwf3lbs.navigation.util.GPSConverterUtils;

import static com.facebook.react.common.ReactConstants.TAG;

public class NavigationModule extends BaseModule {
    private static final String REACT_CLASS = "NavigationModule";

    private static LatLng endLatLng;

    private static LatLng startLatLng;

    public NavigationModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @ReactMethod
    public void startNavigation(double num) {
        Log.i(TAG, "开启导航:" + num);
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null || startLatLng == null || endLatLng == null) {
            Log.e(TAG, "startNavigation: 参数为空");
            return;
        }
        Intent intent = new Intent(currentActivity, GPSNaviActivity.class);
        double[] startLatLngs = {startLatLng.latitude, startLatLng.longitude};
        double[] endLatLngs = {endLatLng.latitude, endLatLng.longitude};
        intent.putExtra("startLatLng", startLatLngs);
        intent.putExtra("endLatLng", endLatLngs);
        currentActivity.startActivity(intent);
    }

    public static void dealEndLatLng(LatLng latLng){
        GPS gps = GPSConverterUtils.bd09_To_Gcj02(latLng.latitude, latLng.longitude);
        endLatLng = new LatLng(gps.getLat(),gps.getLon());
    }

    public static void dealStartLatLng(LatLng latLng){
        GPS gps = GPSConverterUtils.bd09_To_Gcj02(latLng.latitude, latLng.longitude);
        startLatLng = new LatLng(gps.getLat(),gps.getLon());
    }
}
