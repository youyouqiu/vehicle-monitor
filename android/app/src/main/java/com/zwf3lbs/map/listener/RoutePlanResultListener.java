package com.zwf3lbs.map.listener;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.TextureMapView;
import com.baidu.mapapi.search.core.SearchResult;
import com.baidu.mapapi.search.route.BikingRouteResult;
import com.baidu.mapapi.search.route.DrivingRouteLine;
import com.baidu.mapapi.search.route.DrivingRouteResult;
import com.baidu.mapapi.search.route.IndoorRouteResult;
import com.baidu.mapapi.search.route.MassTransitRouteResult;
import com.baidu.mapapi.search.route.OnGetRoutePlanResultListener;
import com.baidu.mapapi.search.route.TransitRouteResult;
import com.baidu.mapapi.search.route.WalkingRouteResult;
import com.facebook.react.bridge.ReactContext;
import com.zwf3lbs.map.BaiduMapViewManager;
import com.zwf3lbs.map.util.EventInitMethod;
import com.zwf3lbs.map.overLine.DrivingRouteOverlay;

public class RoutePlanResultListener implements OnGetRoutePlanResultListener {
    private TextureMapView mapView;
    private final ReactContext reactContext;

    public RoutePlanResultListener(ReactContext reactContext) {
        this.reactContext = reactContext;
    }

    public TextureMapView getMapView() {
        return mapView;
    }

    public void setMapView(TextureMapView mapView) {
        this.mapView = mapView;
    }

    @Override
    public void onGetWalkingRouteResult(WalkingRouteResult walkingRouteResult) {

    }

    @Override
    public void onGetTransitRouteResult(TransitRouteResult transitRouteResult) {

    }

    @Override
    public void onGetMassTransitRouteResult(MassTransitRouteResult massTransitRouteResult) {

    }

    /**
     * 驾车路线规划
     */
    @Override
    public void onGetDrivingRouteResult(DrivingRouteResult result) {
        if (result != null && result.error == SearchResult.ERRORNO.NO_ERROR) {
            DrivingRouteLine drivingRouteLine = result.getRouteLines().get(0);
            DrivingRouteOverlay overlay = new MyDrivingRouteOverlay(mapView.getMap());
            overlay.setData(result.getRouteLines().get(0));
            overlay.addToMap();
            overlay.zoomToSpan();
            int distance = drivingRouteLine.getDistance();
            BaiduMapViewManager.mapzoomSpanHis(mapView.getMap());
            //路径规划距离返回
            EventInitMethod.onPlanDistance(reactContext, mapView.getId(), distance + "");
        }
    }

    @Override
    public void onGetIndoorRouteResult(IndoorRouteResult indoorRouteResult) {

    }

    @Override
    public void onGetBikingRouteResult(BikingRouteResult bikingRouteResult) {

    }

    // 定制RouteOverly
    private static class MyDrivingRouteOverlay extends DrivingRouteOverlay {

        public MyDrivingRouteOverlay(BaiduMap baiduMap) {
            super(baiduMap);
        }

        @Override
        public BitmapDescriptor getStartMarker() {
            return super.getStartMarker();
        }

        @Override
        public BitmapDescriptor getTerminalMarker() {
            return super.getTerminalMarker();
        }
    }
}
