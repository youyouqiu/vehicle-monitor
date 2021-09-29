package com.zwf3lbs.map.service;

import android.graphics.Point;
import android.util.Log;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.model.LatLng;

import java.util.Timer;
import java.util.TimerTask;

/**
 * 聚焦监听服务
 */
public class FocusListenerService {

    private static final String TAG = "FocusListenerService";
    /**
     * 定时器
     */
    private Timer mTimer = null;
    /**
     * 定时器任务
     */
    private TimerTask mTimerTask = null;

    /**
     * 百度地图marker
     */
    private Marker marker = null;

    /**
     * 百度地图
     */
    private BaiduMap map = null;

    /**
     * 范围
     */
    private double lengthLimit = 120 * 120d;

    /**
     * 起始点
     */
    private Point point = null;

    public Marker getMarker() {
        return marker;
    }

    public void setMarker(Marker marker) {
        this.marker = marker;
    }


    public void setPoint(Point point) {
        this.point = point;
    }

    public void setMap(BaiduMap map) {
        this.map = map;
    }

    public void startFocus() {
        if (mTimer == null) {
            mTimer = new Timer();
        }
        if (mTimerTask == null) {
            mTimerTask = new TimerTask() {
                @Override
                public void run() {
                    if (marker != null && point != null) {
                        if (includePoint(point)) {
                            locationMapMarker();
                        }
                    }
                }
            };
        }

        if (mTimer != null) {
            try {
                mTimer.schedule(mTimerTask, 0, 500);
            } catch (Exception e) {
                Log.e("聚焦启动异常", e.getMessage());
            }

        }
    }

    public void stopFocus() {
        if (mTimer != null) {
            mTimer.cancel();
            mTimer = null;
        }

        if (mTimerTask != null) {
            mTimerTask.cancel();
            mTimerTask = null;
        }
    }

    /**
     * 重新拉回定位使地图的中心定位marker的坐标位置
     */
    private void locationMapMarker() {
        LatLng position = marker.getPosition();
        float zoom = 19;
        try {
            zoom = map.getMapStatus().zoom;
        } catch (Exception ignored) {
        }
        MapStatus build = new MapStatus.Builder().zoom(zoom).target(position).build();
        MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(build);
        map.animateMapStatus(mMapStatusUpdate);
    }


    /**
     * 判断是否超出范围之内
     */
    private boolean includePoint(Point startPoint) {
        if (marker != null) {
            try{
                int x = startPoint.x;
                int y = startPoint.y;
                int endX = map.getProjection().toScreenLocation(marker.getPosition()).x;
                int endY = map.getProjection().toScreenLocation(marker.getPosition()).y;
                double absX = Math.abs(endX - x);
                double absY = Math.abs(endY - y);
                double length = absX * absX + absY * absY;
                if (length > lengthLimit) {
                    return true;
                } else {
                    return false;
                }
            }catch (Exception e){
                Log.e("TAG",e.getMessage());
                e.printStackTrace();
                return false;
            }

        }
        return false;
    }
}
