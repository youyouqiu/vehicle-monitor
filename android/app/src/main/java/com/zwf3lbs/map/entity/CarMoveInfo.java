package com.zwf3lbs.map.entity;

import com.baidu.mapapi.model.LatLng;

public class CarMoveInfo {

    private LatLng latLng;

    private  int time;//每次移动的时间间隔

    private Integer carTime;

    public LatLng getLatLng() {
        return latLng;
    }

    public void setLatLng(LatLng latLng) {
        this.latLng = latLng;
    }

    public int getTime() {
        return time;
    }

    public void setTime(int time) {
        this.time = time;
    }

    public Integer getCarTime() {
        return carTime;
    }

    public void setCarTime(Integer carTime) {
        this.carTime = carTime;
    }
}
