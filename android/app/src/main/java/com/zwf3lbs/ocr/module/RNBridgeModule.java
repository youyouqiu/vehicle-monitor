package com.zwf3lbs.ocr.module;

import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.zwf3lbs.ocr.activity.person.OcrPersonMainActivity;
import com.zwf3lbs.ocr.activity.vehicle.OcrVehicleMainActivity;
import com.zwf3lbs.BaseModule;
import com.zwf3lbs.zwf3lbsapp.MainApplication;

public class RNBridgeModule extends BaseModule {

    private static final String REACT_CLASS = "RNBridgeModule";
    private static RNBridgeModule instance;
    public static ReactApplicationContext reactContext;

    public RNBridgeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        RNBridgeModule.reactContext = reactContext;
        context = reactContext;
    }

    public static RNBridgeModule getInstance() {
        if (instance == null) {
            instance = new RNBridgeModule(reactContext);
        }
        return instance;
    }

    public @NonNull String getName() {
        return REACT_CLASS;
    }

    /**
     * 提供给前端 用于进行ocr功能
     *
     */
    @ReactMethod
    public void backToViewController(final ReadableMap options) {
        ReactApplicationContext applicationContext = getReactApplicationContext();
        MainApplication applicationData = (MainApplication) applicationContext.getApplicationContext();
        applicationData.setAccess_token(options.getString("token"));
        applicationData.setServiceAddress(options.getString("http"));
        applicationData.setFASTDFS_ADDRESS(options.getString("imageWebUrl"));
        applicationData.setMonitorId(options.getString("monitorId"));
        applicationData.setMonitorName(options.getString("monitorName"));
        applicationData.setPlatform(options.getString("platform"));
        applicationData.setVersion(options.getInt("version")+"");
        Class<?> activityType;
        if(options.getString("monitorType").equals("1"))  {
            activityType = OcrPersonMainActivity.class;
        } else {
            activityType = OcrVehicleMainActivity.class;
        }
        Intent intent = new Intent(applicationContext, activityType);
        getCurrentActivity().startActivity(intent);

        //告诉js端已经进入了OCR
       onEnterOCR();
    }

    public void onEnterOCR(){
        //告诉js端已经进入了OCR
        WritableMap params = Arguments.createMap();
        params.putString("data", "1");
        sendEvent("onEnterOCR", params);
    }

    public void onExitOCR(){
        //告诉js端已经进入了OCR
        WritableMap params = Arguments.createMap();
        params.putString("data", "0");
        sendEvent("onExitOCR", params);
    }



}
