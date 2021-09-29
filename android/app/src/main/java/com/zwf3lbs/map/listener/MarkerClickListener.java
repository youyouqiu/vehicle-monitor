package com.zwf3lbs.map.listener;

import android.os.Bundle;
import android.util.Log;

import com.alibaba.fastjson.JSON;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.TextureMapView;
import com.facebook.react.bridge.ReactContext;
import com.zwf3lbs.map.BaiduMapViewManager;
import com.zwf3lbs.map.util.CommonUtil;
import com.zwf3lbs.map.util.EventInitMethod;
import com.zwf3lbs.map.MapGeoCoder;
import com.zwf3lbs.map.entity.VehicleParkEntity;

public class MarkerClickListener implements BaiduMap.OnMarkerClickListener {
    private final TextureMapView mapView;
    private final MapGeoCoder mapGeoCoder;
    private final ReactContext reactContext;

    public MarkerClickListener(TextureMapView mapView, MapGeoCoder mapGeoCoder, ReactContext reactContext) {
        this.mapView = mapView;
        this.mapGeoCoder = mapGeoCoder;
        this.reactContext = reactContext;
    }

    @Override
    public boolean onMarkerClick(Marker marker) {
        Log.i("===marker===","执行marker点击事件");
        Bundle extraInfo = marker.getExtraInfo();
        if (extraInfo == null) {
            Log.i("===marker===","marker数据为空");
            return false;
        }
        String monitorInfos = extraInfo.getString("monitorInfos");
        String markerId = extraInfo.getString("marketId");
        String vehicleParkEntityStr = extraInfo.getString("vehicleParkEntity");

        int viewId = mapView.getId();
        if (markerId != null && !markerId.equals("")) {
            EventInitMethod.onPointClick(reactContext, viewId, markerId);
            //  取消页面聚焦状态
            EventInitMethod.onMonitorLoseFocus(reactContext, viewId);
            Log.i("===marker===","取消页面聚焦");
        }

        if (monitorInfos != null && !monitorInfos.equals("")) {
            Log.i("===marker===","响应marker点击事件");
            EventInitMethod.onClustersClick(reactContext, viewId, monitorInfos);
        }

        if (vehicleParkEntityStr != null && !vehicleParkEntityStr.equals("")) {
            Log.i("===marker===","onStopPointIndex事件");
            Marker oldMarker =  BaiduMapViewManager.historyPark.get(BaiduMapViewManager.parkIndex);
            if (oldMarker != null) {
                oldMarker.setIcon(CommonUtil.createParkIco(reactContext));
            }
            marker.setIcon(CommonUtil.createCheckParkIco(reactContext));
            marker.setToTop();

            VehicleParkEntity entity = JSON.parseObject(vehicleParkEntityStr, VehicleParkEntity.class);
            mapGeoCoder.reverseStopPoint(viewId, entity.getLatitude(), entity.getLongitude(), entity.getNumber());
            EventInitMethod.onStopPointIndex(reactContext, viewId, entity.getNumber());
        }

        return false;
    }
}
