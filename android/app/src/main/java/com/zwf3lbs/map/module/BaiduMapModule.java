package com.zwf3lbs.map.module;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.zwf3lbs.BaseModule;

import static com.facebook.react.common.ReactConstants.TAG;

public class BaiduMapModule extends BaseModule {

    private static final String REACT_CLASS = "BaiduMapModule";

    public BaiduMapModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
    }

    public String getName() {
        return REACT_CLASS;
    }

    @ReactMethod
    public void show(double num) {
        Log.i(TAG, "BaiduMapModule:" + num);
    }

}
