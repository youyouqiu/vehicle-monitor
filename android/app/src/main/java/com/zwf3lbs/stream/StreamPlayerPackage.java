package com.zwf3lbs.stream;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

/**
自定义组件模块注册类
 */
public class StreamPlayerPackage implements ReactPackage {
    /**
     * 创建原生模块
     */
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    /**
     * 创建原生UI组件控制器
     */
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.<ViewManager>singletonList(
            new StreamPlayerManager()
        );
    }
}