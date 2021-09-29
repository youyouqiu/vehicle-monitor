package com.zwf3lbs.map.overLine;

import android.graphics.Point;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BaiduMap.OnPolylineClickListener;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.map.OverlayOptions;
import com.baidu.mapapi.model.LatLngBounds;
import com.blankj.utilcode.util.ScreenUtils;
import com.zwf3lbs.map.util.BaiduMapVariable;

import java.util.ArrayList;
import java.util.List;

import static com.baidu.mapapi.map.BaiduMap.OnMarkerClickListener;

/**
 * 该类提供一个能够显示和管理多个Overlay的基类
 * <p>
 * 复写{@link #getOverlayOptions()} 设置欲显示和管理的Overlay列表
 * </p>
 * <p>
 * 通过
 * {@link com.baidu.mapapi.map.BaiduMap#setOnMarkerClickListener(com.baidu.mapapi.map.BaiduMap.OnMarkerClickListener)}
 * 将覆盖物点击事件传递给OverlayManager后，OverlayManager才能响应点击事件。
 * <p>
 * 复写{@link #onMarkerClick(com.baidu.mapapi.map.Marker)} 处理Marker点击事件
 * </p>
 */
public abstract class OverlayManager implements OnMarkerClickListener, OnPolylineClickListener {

    BaiduMap mBaiduMap;
    private List<OverlayOptions> mOverlayOptionList = null;

    List<Overlay> mOverlayList = null;

    /**
     * 通过一个BaiduMap 对象构造
     *
     * @param baiduMap
     */
    public OverlayManager(BaiduMap baiduMap) {
        mBaiduMap = baiduMap;
        // mBaiduMap.setOnMarkerClickListener(this);
        if (mOverlayOptionList == null) {
            mOverlayOptionList = new ArrayList<>();
        }
        if (mOverlayList == null) {
            mOverlayList = new ArrayList<>();
        }
    }

    /**
     * 覆写此方法设置要管理的Overlay列表
     *
     * @return 管理的Overlay列表
     */
    public abstract List<OverlayOptions> getOverlayOptions();

    /**
     * 将所有Overlay 添加到地图上
     */
    public final void addToMap() {
        if (mBaiduMap == null) {
            return;
        }
        removeFromMap();
        List<OverlayOptions> overlayOptions = getOverlayOptions();
        if (overlayOptions != null) {
            mOverlayOptionList.addAll(getOverlayOptions());
        }

        if(BaiduMapVariable.lastMarker!=null) {
            BaiduMapVariable.lastMarker.remove();
        }
        for (OverlayOptions option : mOverlayOptionList) {
            Overlay overlay = mBaiduMap.addOverlay(option);
            if (overlay.getExtraInfo() != null) {
                if(BaiduMapVariable.lastMarker!=null) {
                    BaiduMapVariable.lastMarker.remove();
                }
                String last = overlay.getExtraInfo().getString("last");
                if (last != null && last.equals("true")) {
                    BaiduMapVariable.lastMarker = overlay;
                }
            }
            mOverlayList.add(overlay);
        }
    }

    /**
     * 将所有Overlay 从 地图上消除
     */
    public final void removeFromMap() {
        if (mBaiduMap == null) {
            return;
        }
        for (Overlay marker : mOverlayList) {
            marker.remove();
        }
        mOverlayOptionList.clear();
        mOverlayList.clear();

    }

    /**
     * 缩放地图，使所有Overlay都在合适的视野内
     * <p>
     * 注： 该方法只对Marker类型的overlay有效
     * </p>
     */
    public void zoomToSpan() {
        if (mBaiduMap == null) {
            return;
        }
        if (mOverlayList.size() > 0) {
            LatLngBounds.Builder builder = new LatLngBounds.Builder();
            for (Overlay overlay : mOverlayList) {
                // polyline 中的点可能太多，只按marker 缩放
                if (overlay instanceof Marker) {
                    builder.include(((Marker) overlay).getPosition());
                }
            }
            int screenWidth = ScreenUtils.getScreenWidth();
            int mapHeight = ScreenUtils.getScreenHeight() - (int)BaiduMapVariable.footerHeight;
            // 移动中心点
            MapStatus mapStatus = new MapStatus.Builder()
                    .targetScreen(new Point(screenWidth / 2, mapHeight / 2 - (int)BaiduMapVariable.footerHeight/2 ))
                    .build();
            mBaiduMap.setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));
            BaiduMapVariable.builder = builder;
            MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(builder.build(), ScreenUtils.getScreenWidth(), mapHeight);
            mBaiduMap.animateMapStatus(mapStatusUpdate);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
