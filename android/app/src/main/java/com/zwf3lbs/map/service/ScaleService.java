package com.zwf3lbs.map.service;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.model.LatLng;

public class ScaleService {

    /**
     * 百度地图最大缩放级别
     */
    private static final int MAX_LEVEL = 21;

    /**
     * 各级比例尺分母值数组
     */
    private static final int[] SCALES = {5,10,20, 50, 100, 200, 500, 1000, 2000,
            5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000
    };

    /**
     * 各级比例尺文字数组
     */
    private static final String[] SCALE_DESCS = {"5米","10米","20米", "50米", "100米", "200米",
            "500米", "1公里", "2公里", "5公里", "10公里", "20公里", "25公里", "50公里",
            "100公里", "200公里", "500公里", "1000公里"};

    /**
     * 根据缩放级别，得到对应比例尺在SCALES数组中的位置（索引）
     */
    private static int getScaleIndex(int zoomLevel) {
        return Math.max((MAX_LEVEL - zoomLevel), 0);
    }
    /**
     * 根据缩放级别，得到对应比例尺
     */
    public static int getScale(int zoomLevel) {
        return SCALES[getScaleIndex(zoomLevel)];
    }

    /**
     *  根据缩放级别，得到对应比例尺文字
     */
    public static String getScaleDesc(int zoomLevel) {
        return SCALE_DESCS[getScaleIndex(zoomLevel)];
    }

    /**
     * 根据地图当前中心位置的纬度，当前比例尺，得出比例尺图标应该显示多长（多少像素）
     */
    public static int meterToPixels(BaiduMap map, int scale) {
        // 得到当前中心位置对象
        LatLng target = map.getMapStatus().target;
        // 得到当前中心位置纬度
        double latitude = target.latitudeE6 / 1E6;
        // 得到象素数，比如当前比例尺是1/10000，比如scale=10000，对应在该纬度应在地图中绘多少象素
        // 参考http://rainbow702.iteye.com/blog/1124244
        if(map.getProjection()!=null) {
            return (int) (map.getProjection().metersToEquatorPixels(scale) / (Math
                    .cos(Math.toRadians(latitude))));
        }else {
            return 200;
        }
    }

    /**
     * 获取比例尺信息
     */
    public static String getScaleInfo(BaiduMap map){
        float zoom = map.getMapStatus().zoom;
        // 比例尺文字
        String scaleDesc = getScaleDesc((int) zoom);
        // 比例尺值
        int scale = getScale((int) zoom);
        int length = meterToPixels(map, scale);
        return scaleDesc + "," + length;
    }
}
