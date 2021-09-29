package com.zwf3lbs.map.entity;


public class MonitorInfo {

    private String monitorId;

    private String name;

    private Integer status;

    private Integer time = 0;

    public Integer getTime() {
        return time;
    }

    public void setTime(Integer time) {
        this.time = time;
    }

    public String getMonitorId() {
        return monitorId;
    }

    public void setMonitorId(String monitorId) {
        this.monitorId = monitorId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    @Override
    public int hashCode() {
        return this.monitorId.hashCode();
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
        MonitorInfo wo = (MonitorInfo) o;
        if (!wo.monitorId.equals(this.monitorId)) {
            return false;
        }
        return true;
    }

}
