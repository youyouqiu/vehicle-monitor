package com.zwf3lbs.map;

import android.util.Log;

import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.search.core.SearchResult;
import com.baidu.mapapi.search.geocode.GeoCodeResult;
import com.baidu.mapapi.search.geocode.GeoCoder;
import com.baidu.mapapi.search.geocode.OnGetGeoCoderResultListener;
import com.baidu.mapapi.search.geocode.ReverseGeoCodeOption;
import com.baidu.mapapi.search.geocode.ReverseGeoCodeResult;
import com.facebook.react.bridge.ReactContext;
import com.zwf3lbs.map.util.EventInitMethod;

public class MapGeoCoder {
    private static final ReverseGeoCodeOption geoCodeOption = new ReverseGeoCodeOption()
            .newVersion(1)
            .radius(50);

    private final ReactContext context;
    private GeoCoder geoCoder;

    public MapGeoCoder(ReactContext context) {
        this.context = context;
    }

    public void reversePoint(int viewId, LatLng point) {
        if (geoCoder != null) {
            geoCoder.destroy();
        }
        this.geoCoder = GeoCoder.newInstance();
        this.geoCoder.setOnGetGeoCodeResultListener(new PointListener(context, viewId));

        geoCodeOption.location(point);
        this.geoCoder.reverseGeoCode(geoCodeOption);
    }

    public void reverseStopPoint(int viewId, double lat, double lng, int pointIndex) {
        if (geoCoder != null) {
            geoCoder.destroy();
        }
        this.geoCoder = GeoCoder.newInstance();
        StopPointListener listener = new StopPointListener(context, viewId);
        listener.setPointIndex(pointIndex);
        this.geoCoder.setOnGetGeoCodeResultListener(listener);

        geoCodeOption.location(new LatLng(lat, lng));
        this.geoCoder.reverseGeoCode(geoCodeOption);
    }

    private static void handleError(ReverseGeoCodeResult result) {
        String errorMsg = "逆地理编码报错";
        if (result != null) {
            errorMsg += ", error: " + result.error.name();
        }
        Log.e("MapGeoCoder", errorMsg);
    }

    private static class PointListener implements OnGetGeoCoderResultListener {
        private final ReactContext ctx;
        private final int viewId;

        private PointListener(ReactContext ctx, int viewId) {
            this.ctx = ctx;
            this.viewId = viewId;
        }

        public void onGetGeoCodeResult(GeoCodeResult result) {
        }

        public void onGetReverseGeoCodeResult(ReverseGeoCodeResult result) {
            if (result == null || result.error != SearchResult.ERRORNO.NO_ERROR) {
                handleError(result);
                return;
            }
            String address = result.getAddress() + result.getSematicDescription();
            EventInitMethod.onAddress(this.ctx, viewId, address);
        }
    }

    private static class StopPointListener implements OnGetGeoCoderResultListener {
        private final ReactContext ctx;
        private final int viewId;
        private int pointIndex;

        private StopPointListener(ReactContext ctx, int viewId) {
            this.ctx = ctx;
            this.viewId = viewId;
        }

        public void setPointIndex(int pointIndex) {
            this.pointIndex = pointIndex;
        }

        public void onGetGeoCodeResult(GeoCodeResult result) {
        }

        public void onGetReverseGeoCodeResult(ReverseGeoCodeResult result) {
            if (result == null || result.error != SearchResult.ERRORNO.NO_ERROR) {
                return;
            }
            String address = result.getAddress() + result.getSematicDescription();
            EventInitMethod.onStopPointData(this.ctx, viewId, address, pointIndex);
        }
    }
}
