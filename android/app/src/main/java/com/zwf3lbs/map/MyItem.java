package com.zwf3lbs.map;

import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.BitmapDescriptorFactory;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.map.clusterutil.clustering.ClusterItem;
import com.zwf3lbs.map.entity.MonitorInfo;
import com.zwf3lbs.zwf3lbsapp.R;

/**
 * 每个Marker点，包含Marker点坐标以及图标
 */
public class MyItem implements ClusterItem {
    private final LatLng mPosition;

    private String markerId;

    private MonitorInfo monitorInfo;

    public String getMarkerId() {
        return markerId;
    }

    public void setMarkerId(String markerId) {
        this.markerId = markerId;
    }

    public MonitorInfo getMonitorInfo() {
        return monitorInfo;
    }

    public void setMonitorInfo(MonitorInfo monitorInfo) {
        this.monitorInfo = monitorInfo;
    }

    public MyItem(LatLng latLng) {
        mPosition = latLng;
    }

    @Override
    public LatLng getPosition() {
        return mPosition;
    }

    @Override
    public String getInfoMarkerId() {
        return markerId;
    }

    @Override
    public BitmapDescriptor getBitmapDescriptor() {
        return BitmapDescriptorFactory
                .fromResource(R.drawable.icon_gcoding);
    }

    @Override
    public MonitorInfo getInfoMonitor() {
        return monitorInfo;
    }


    @Override
    public int hashCode() {
        if (this.markerId != null) {
            return this.markerId.hashCode();
        } else {
            return this.monitorInfo.getMonitorId().hashCode();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null) {
            return false;
        }
        if (this.getClass() != o.getClass()) {
            return false;
        }
        MyItem wo = (MyItem) o;
        if (!wo.markerId.equals(this.markerId)) {
            return false;
        }
        return true;
    }
}