package com.zwf3lbs.map.listener;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.MapPoi;
import com.baidu.mapapi.map.TextureMapView;
import com.baidu.mapapi.model.LatLng;
import com.facebook.react.bridge.ReactContext;
import com.zwf3lbs.map.util.EventInitMethod;

public class MapClickListener implements BaiduMap.OnMapClickListener {
    private final TextureMapView mapView;
    private final ReactContext reactContext;

    public MapClickListener(TextureMapView mapView, ReactContext reactContext) {
        this.mapView = mapView;
        this.reactContext = reactContext;
    }

    @Override
    public void onMapClick(LatLng latLng) {
        int viewId = mapView.getId();
        EventInitMethod.onMapClick(reactContext, viewId, "json");
        //停止点点击地图时关闭
        EventInitMethod.onStopPointIndex(reactContext, viewId, -1);
    }

//    @Override
//    public boolean onMapPoiClick(MapPoi mapPoi) {
//        return false;
//    }
    public void onMapPoiClick(MapPoi mapPoi) {

    }

}
