package com.zwf3lbs.map.entity;

import java.io.Serializable;

public class VehicleParkEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 唯一标识id
     */
    private String markerId;

    /**
     * 停止点
     */
    private Integer number;

    /**
     * 停止的位置
     */
    private String address;

    /**
     * 经度
     */
    private Double longitude;

    /**
     * 纬度
     */
    private Double latitude;


    public String getMarkerId() {
        return markerId;
    }

    public void setMarkerId(String markerId) {
        this.markerId = markerId;
    }

    public Integer getNumber() {
        return number;
    }

    public void setNumber(Integer number) {
        this.number = number;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }


    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    @Override
    public int hashCode() {
        return this.markerId.hashCode();
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
        VehicleParkEntity wo = (VehicleParkEntity) o;
        if (!wo.markerId.equals(this.markerId)) {
            return false;
        }
        return true;
    }
}
