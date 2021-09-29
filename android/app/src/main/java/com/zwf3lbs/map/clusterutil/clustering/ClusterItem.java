/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.map.clusterutil.clustering;


import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.map.entity.MonitorInfo;

/**
 * 地图上独立的标记点(被cluster管理)
 */
public interface ClusterItem {
    /**
     * marker的位置
     *
     * @return 位置经纬度
     */
    LatLng getPosition();


    String getInfoMarkerId();

    /**
     * marker的图标
     *
     * @return 图标
     */
    BitmapDescriptor getBitmapDescriptor();

    MonitorInfo getInfoMonitor();
}