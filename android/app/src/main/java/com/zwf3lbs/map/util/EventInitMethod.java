package com.zwf3lbs.map.util;

import com.baidu.mapapi.map.TextureMapView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.zwf3lbs.map.BaiduMapViewManager;

/**
 * 事件方法初始化
 */
public class EventInitMethod {

    private TextureMapView mapView;

    private final ReactContext mReactContext;

    public EventInitMethod(TextureMapView mapView, ReactContext mReactContext) {
        this.mapView = mapView;
        this.mReactContext = mReactContext;
    }

    public  EventInitMethod(ReactContext reactContext) {
        this.mReactContext = reactContext;
    }

    public ReactContext getReactContext(){
        return this.mReactContext;
    }

    public final TextureMapView getMapView() {
        return this.mapView;
    }

    /**
     * 定位权限发送到页面
     */
    public static void onLocation(ReactContext ctx, int viewId) {
        onData(ctx, viewId, "location", "location");
    }

    /**
     * 地图可视区域范围内的监控对象信息
     */
    public static void onInAreaOptions(ReactContext ctx, int viewId, WritableArray data) {
        WritableMap event = Arguments.createMap();
        event.putArray("data", data);
        ctx.getJSModule(RCTEventEmitter.class).receiveEvent(viewId, "onInAreaOptionsAPP", event);
    }

    /**
     * 逆地址查询
     */
    public static void onAddress(ReactContext ctx, int viewId, String data) {
        onData(ctx, viewId, data, "onAddressAPP");
    }

    /**
     * 地图点击后触发事件
     */
    public static void onMapClick(ReactContext ctx, int viewId, String data) {
        onData(ctx, viewId, data, "onMapClickAPP");
    }

    /**
     * 地图初始化成功事件
     */
    public static void onMapInitFinish(ReactContext ctx, int viewId) {
        onData(ctx, viewId, "", "onMapInitFinishAPP");
    }

    /**
     * 路径规划距离返回
     */
    public static void onPlanDistance(ReactContext ctx, int viewId, String data) {
        onData(ctx, viewId, data, "onPlanDistanceAPP");
    }

    /**
     * 定位成功或失败事件
     */
    public static void onLocationSuccess(ReactContext ctx, int viewId, String data) {
        onData(ctx, viewId, data, "onLocationSuccessAPP");
    }

    /**
     * 地图标注物点击事件（返回当前点击的监控对象id）
     */
    public static void onPointClick(ReactContext ctx, int viewId, String data) {
        onData(ctx, viewId, data, "onPointClickEventAPP");
    }

    /**
     * 地图聚合图标点击事件（返回当前点击的聚合的监控对象id，名字，状态）
     */
    public static void onClustersClick(ReactContext ctx, int viewId, String data) {
        onData(ctx, viewId, data, "onClustersClickEventAPP");
    }

    /**
     * 取消聚焦
     */
    public static void onMonitorLoseFocus(ReactContext ctx, int viewId) {
        onData(ctx, viewId, "true", "onMonitorLoseFocusAPP");
    }

    public static void onStopPointIndex(ReactContext ctx, int viewId, int stopIndex) {
        WritableMap params = Arguments.createMap();
        params.putInt("index", stopIndex);
        ctx.getJSModule(RCTEventEmitter.class).receiveEvent(viewId, "onStopPointIndexEventAPP", params);
    }

    /**
     * 历史轨迹停止点点击事件（返回该停止点的数据）
     */
    public static void onStopPointData(ReactContext ctx, int viewId, String address, int index) {
        WritableMap params = Arguments.createMap();
        params.putString("address", address);
        params.putInt("index", index);
        BaiduMapViewManager.parkIndex = index;
        ctx.getJSModule(RCTEventEmitter.class).receiveEvent(viewId, "onStopPointDataEventAPP", params);
    }

    /**
     * 比例尺相关信息
     */
    public static void onMyScale(ReactContext ctx, int viewId, String data) {
        onData(ctx, viewId, data, "onMyScaleAPP");
    }

    /**
     * 全景视图关闭
     */
    public static void onPanoramaClose(ReactContext ctx) {
        sendEvent(ctx,  "onPanoramaClose");
    }
    /**
     * 全景视图加载成功
     */
    public static void onPanoramaSuccess(ReactContext ctx) {
        sendEvent(ctx,  "onPanoramaSuccess");
    }
    /**
     * 全景视图加载失败
     */
    public static void onPanoramaFailed(ReactContext ctx) {
        sendEvent(ctx,  "onPanoramaFailed");
    }

    private static void sendEvent(ReactContext ctx, String eventName) {
        WritableMap params = Arguments.createMap();
        params.putString("data", "true");
        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }

    private static void onData(ReactContext ctx, int viewId, String value, String eventName) {
        WritableMap params = Arguments.createMap();
        params.putString("data", value);
        ctx.getJSModule(RCTEventEmitter.class).receiveEvent(viewId, eventName, params);
    }
}
