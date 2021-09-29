package com.zwf3lbs.map.entity;

import com.baidu.mapapi.model.LatLng;

/**
 * @description: LatLng装饰类, 添加属性速度
 * @author: chenguoguo
 * @Date: 2021/6/8 11:05
 */
public class DecLatLng {

    private Integer speed;
    private LatLng latLng;

    public Integer getSpeed() {
        return speed;
    }

    public void setSpeed(Integer speed) {
        this.speed = speed;
    }

    public LatLng getLatLng() {
        return latLng;
    }

    public void setLatLng(LatLng latLng) {
        this.latLng = latLng;
    }
}
