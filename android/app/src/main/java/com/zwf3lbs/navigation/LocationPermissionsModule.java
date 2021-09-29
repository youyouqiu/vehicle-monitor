package com.zwf3lbs.navigation;

import android.location.LocationManager;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.hjq.permissions.Permission;
import com.hjq.permissions.XXPermissions;
import com.zwf3lbs.BaseModule;

public class LocationPermissionsModule extends BaseModule {

    private static final String REACT_CLASS = "LocationPermissionsModule";

    private static final String TAG = "LocationPermissionsMod";

    public LocationPermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @ReactMethod
    public void getLocationState(String module, Promise promise) {
        boolean hasPermission = XXPermissions.isHasPermission(context, Permission.Group.LOCATION);
        boolean react = locationService(context);
        if (react && hasPermission) {
            promise.resolve(1);
        } else {
            promise.resolve(0);
        }
    }

    public boolean locationService(ReactApplicationContext reactContext){
        LocationManager locationManager;
        try {
            locationManager = (LocationManager) reactContext.getSystemService(ReactApplicationContext.LOCATION_SERVICE);
        } catch (Exception e) {
            Log.e(TAG, "locationService: " + "获取locationManager失败");
            return false;
        }
        if (locationManager == null) {
            return false;
        }
        // 通过GPS卫星定位，定位级别可以精确到街（通过24颗卫星定位，在室外和空旷的地方定位准确、速度快）
        boolean gps = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        // 通过WLAN或移动网络(3G/2G)确定的位置（也称作AGPS，辅助GPS定位。主要用于在室内或遮盖物（建筑群或茂密的深林等）密集的地方定位）
        boolean network = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        return gps || network;
    }
}
