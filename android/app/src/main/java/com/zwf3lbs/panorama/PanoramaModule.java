package com.zwf3lbs.panorama;

import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

import com.baidu.lbsapi.BMapManager;
import com.baidu.lbsapi.MKGeneralListener;
import com.baidu.lbsapi.model.BaiduPanoData;
import com.baidu.lbsapi.panoramaview.PanoramaRequest;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.zwf3lbs.BaseModule;
import com.zwf3lbs.map.util.EventInitMethod;

import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class PanoramaModule extends BaseModule {
    /**
     * 应用上下文
     */
    private final ReactApplicationContext context;

    /**
     * react类标记
     */
    private static final String REACT_CLASS = "MyPanoramaView";

    /**
     * 日志tag
     */
    private static final String TAG = "PanoramaModule";

    public BMapManager mBMapManager = null;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    public PanoramaModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
        initEngineManager(reactContext);
    }

    private void initEngineManager(ReactApplicationContext reactContext) {
        if (mBMapManager == null) {
            mBMapManager = new BMapManager(reactContext.getApplicationContext());
        }

        if (!mBMapManager.init(new MyGeneralListener())) {
            Log.e(TAG, "BMapManager  初始化错误");
        }
    }

    // 常用事件监听，用来处理通常的网络错误，授权验证错误等
    private static class MyGeneralListener implements MKGeneralListener {

        @Override
        public void onGetPermissionState(int iError) {
            // 非零值表示key验证未通过
            if (iError != 0) {
                // 授权Key错误：
                Log.e(TAG, "请在AndoridManifest.xml中输入正确的授权Key,并检查您的网络连接是否正常！error: " + iError);
            }
        }
    }

    /**
     * 初始化全景地图
     */
    @ReactMethod
    public void customPanoView(ReadableMap readableMap) {
        Log.i(TAG, "customPanoView" + readableMap);
        if (readableMap == null) {
            return;
        }
        double lat = readableMap.getDouble("latitude");
        double lon = readableMap.getDouble("longitude");
        final String title = readableMap.getString("title");
        PanoramaRequest instance = PanoramaRequest.getInstance(context);
        BaiduPanoData panoramaInfoByLatLon = instance.getPanoramaInfoByLatLon(lon, lat);
        if (!panoramaInfoByLatLon.hasStreetPano()){
            EventInitMethod.onPanoramaFailed(context);
            return;
        }


        Intent intent = new Intent(context, PanoramaActivity.class);
        intent.setFlags(FLAG_ACTIVITY_NEW_TASK);
        intent.putExtra("brand", title);
        intent.putExtra("lat", lat);
        intent.putExtra("lon", lon);
        context.startActivity(intent);
    }
}
