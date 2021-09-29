package com.zwf3lbs.map.entity;

import android.util.Log;

import com.facebook.react.bridge.ReadableMap;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.HashMap;

public class VehicleEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 唯一标识id
     */
    private String markerId;
    /**
     * 车辆状态
     */
    private Integer status;
    /**
     * 车辆速度
     */
    private Integer speed;

    /**
     * 车辆图片
     */
    private String ico;

    /**
     * 经度
     */
    private BigDecimal longitude;

    /**
     * 纬度
     */
    private BigDecimal latitude;

    /**
     * 时间
     */
    private Integer time = 0;

    /**
     * 车牌
     */
    private String title;

    private Integer angle;

    private String isVideoPlayback;

    public VehicleEntity() {
    }

    public VehicleEntity(String markerId, Integer status, Integer speed, String ico, BigDecimal longitude, BigDecimal latitude, String title, Integer angle) {
        this.markerId = markerId;
        this.status = status;
        this.speed = speed;
        this.ico = ico;
        this.longitude = longitude;
        this.latitude = latitude;
        this.title = title;
        this.angle = angle;
    }

    public Integer getAngle() {
        return angle;
    }

    public void setAngle(Integer angle) {
        this.angle = angle;
    }

    public static long getSerialVersionUID() {
        return serialVersionUID;
    }

    public String getMarkerId() {
        return markerId;
    }

    public void setMarkerId(String markerId) {
        this.markerId = markerId;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getSpeed() {
        return speed;
    }

    public void setSpeed(Integer speed) {
        this.speed = speed;
    }

    public String getIco() {
        return ico;
    }

    public void setIco(String ico) {
        this.ico = ico;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getTime() {
        return time;
    }

    public void setTime(Integer time) {
        this.time = time;
    }

    public String getIsVideoPlayback() {
        return isVideoPlayback;
    }

    public void setIsVideoPlayback(String isVideoPlayback) {
        this.isVideoPlayback = isVideoPlayback;
    }

    public static VehicleEntity fromVehicleEntity(VehicleEntity entity) {
        VehicleEntity newEntity = new VehicleEntity();
        newEntity.setIco(entity.getIco());
        newEntity.setSpeed(entity.getSpeed());
        newEntity.setStatus(entity.getStatus());
        newEntity.setTitle(entity.getTitle());
        newEntity.setMarkerId(entity.getMarkerId());
        newEntity.setLongitude(entity.getLongitude());
        newEntity.setLatitude(entity.getLatitude());
        newEntity.setAngle(entity.getAngle());
        newEntity.setTime(entity.getTime());
        return newEntity;
    }

    public static VehicleEntity fromReadableMap(ReadableMap map) {
        VehicleEntity entity = new VehicleEntity();

        try {
            entity.setMarkerId(map.getString("markerId"));
            entity.setIco(map.getString("ico"));
            entity.setTitle(map.getString("title"));

            entity.setStatus(getIntValue(map, "status"));
            entity.setSpeed(getIntValue(map, "speed"));

            //处理安卓车头方向不对的问题
            Integer angle = getIntValue(map, "angle");
            entity.setAngle(360 - angle);

            entity.setLongitude(getFloatValue(map, "longitude"));
            entity.setLatitude(getFloatValue(map, "latitude"));
            entity.setTime(getIntValue(map, "time"));
            return entity;
        } catch (Exception e) {
            Log.e("类型转换异常", "fromReadableMap: " + e );
            return null;
        }
    }

    public static VehicleEntity fromHashMap(HashMap map) {
        VehicleEntity entity = new VehicleEntity();

        try {
            entity.setMarkerId((String)map.get("markerId"));
            entity.setIco((String)map.get("ico"));
            entity.setTitle((String)map.get("title"));

            entity.setStatus(map.get("status")!= null ? new BigDecimal(map.get("status").toString()).intValue() : null );
            entity.setSpeed(map.get("speed")!= null ? new BigDecimal(map.get("speed").toString()).intValue() : null );

            //处理安卓车头方向不对的问题
            Integer angle = map.get("angle")!= null ? ((Double)map.get("angle")).intValue() : null;
            if (angle != null) {
                angle = 360 - angle;
            }
            entity.setAngle(angle);

            entity.setLongitude(map.get("longitude") == null ? null : new BigDecimal(map.get("longitude").toString()));
            entity.setLatitude(map.get("latitude") == null ? null : new BigDecimal(map.get("latitude").toString()));
            entity.setTime(map.get("time")!= null ? ((Double)map.get("time")).intValue() : null);

            entity.setIsVideoPlayback((String)map.get("source"));
            return entity;
        } catch (Exception e) {
            //e.printStackTrace();
            Log.e("类型转换异常", "fromHashMap: " + e );
            return null;
        }
    }



    private static int getIntValue(ReadableMap map, String fieldName) {
        if (!map.hasKey(fieldName) || map.isNull(fieldName)) {
            return 0;
        }
        return map.getInt(fieldName);
    }

    private static BigDecimal getFloatValue(ReadableMap map, String fieldName) {
        if (!map.hasKey(fieldName) || map.isNull(fieldName)) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(map.getDouble(fieldName));
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
        VehicleEntity wo = (VehicleEntity) o;
        if (!wo.markerId.equals(this.markerId)) {
            return false;
        }
        return true;
    }
}
