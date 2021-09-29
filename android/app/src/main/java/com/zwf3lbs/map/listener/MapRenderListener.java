package com.zwf3lbs.map.listener;

import com.baidu.mapapi.map.BaiduMap;
import com.zwf3lbs.map.util.CommonMapUtil;

public class MapRenderListener implements BaiduMap.OnMapRenderCallback {
    private final BaiduMap map;

    public MapRenderListener(BaiduMap map) {
        this.map = map;
    }

    /**
     * 地图渲染完成回调函数
     */
    @Override
    public void onMapRenderFinished() {
        // 指南针位置    --> 初始化
        CommonMapUtil.initCompassLocation(this.map, null);
    }
}
