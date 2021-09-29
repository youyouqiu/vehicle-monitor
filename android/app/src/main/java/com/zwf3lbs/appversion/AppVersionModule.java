package com.zwf3lbs.appversion;

import android.content.Context;
import android.os.Environment;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.zwf3lbs.BaseModule;

import java.io.File;

import static com.facebook.react.common.ReactConstants.TAG;

public class AppVersionModule extends BaseModule {
    private static final String REACT_CLASS = "AppVersionModule";
    private static AppVersionModule instance;
    private static ReactApplicationContext reacContext;

    public AppVersionModule(ReactApplicationContext reactContext) {
        super(reactContext);
        AppVersionModule.reacContext = reactContext;
        context = reactContext;
    }

    public static AppVersionModule getInstance() {
        if (instance == null) {
            instance = new AppVersionModule(reacContext);
        }
        return instance;
    }

    public String getName() {
        return REACT_CLASS;
    }

    /**
     * 提供给前端 用于进行版本判定
     *
     * @param num 随机数 防止react没有请求
     * @return 0:表示当前版本已是最新版本 1:表示立即更新 2:表示立即安装 3:表示立即安装
     */
    @ReactMethod
    public void judgeUpdate(double num, Integer version) {
        Log.i(TAG, "AppVersionModule:" + num);
        String stateValue = UpdateHelper.getInstance().judgeUpdate(version);
        onHandleResult(stateValue);
    }

    /**
     * 立即更新
     *
     * @param num 随机数 防止react没有请求
     * @return
     */
    @ReactMethod
    public void updateApp(double num, Integer version,String file) {
        Log.i(TAG, "AppVersion" + version);
        if(null==file||"".equals(file)) {
            file = "http://120.220.247.11:53990/F3/app/f3.apk";
        }
        Context context = UpdateHelper.getInstance().getContext();
        UpdateHelper.getInstance().createDownloadTask(context, file);
    }

    /**
     * 立即安装
     *
     * @param num 随机数 防止react没有请求
     * @return
     */
    @ReactMethod
    public void installApp(double num) {
        Log.i(TAG, "AppVersionModule:" + num);
        File file = new File(Environment.getExternalStorageDirectory().getAbsolutePath() + File.separator + "Download" + File.separator + "f3.apk");
        UpdateHelper.getInstance().installAppVersion26(UpdateHelper.getInstance().getActivity(), file);
    }

    public void onHandleResult(String barcodeData) {
        WritableMap params = Arguments.createMap();
        params.putString("result", barcodeData);
        sendEvent("onScanningResult", params);
    }
}
