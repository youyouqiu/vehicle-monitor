package com.zwf3lbs.map;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.zwf3lbs.appversion.AppVersionModule;
import com.zwf3lbs.map.module.BaiduMapModule;
import com.zwf3lbs.map.module.IdleTimerModule;
import com.zwf3lbs.navigation.LocationPermissionsModule;
import com.zwf3lbs.navigation.NavigationModule;
import com.zwf3lbs.ocr.module.OCREmitterModule;
import com.zwf3lbs.ocr.module.RNBridgeModule;
import com.zwf3lbs.panorama.PanoramaModule;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class BaiduMapViewPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
                new BaiduMapModule(reactContext),
                new RNBridgeModule(reactContext),
                new OCREmitterModule(reactContext),
                new AppVersionModule(reactContext),
                new PanoramaModule(reactContext),
                new NavigationModule(reactContext),
                new IdleTimerModule(reactContext),
                new LocationPermissionsModule(reactContext)
        );
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.<ViewManager>singletonList(new BaiduMapViewManager(reactContext));
    }
}
