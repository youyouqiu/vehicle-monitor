/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.map.clusterutil.clustering;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.drawable.GradientDrawable;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.RequiresApi;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.BitmapDescriptorFactory;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.MarkerOptions;
import com.baidu.mapapi.map.TextureMapView;
import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.model.LatLngBounds;
import com.bumptech.glide.Glide;
import com.bumptech.glide.RequestManager;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.target.Target;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.uimanager.ThemedReactContext;
import com.zwf3lbs.map.BaiduMapViewManager;
import com.zwf3lbs.map.MyItem;
import com.zwf3lbs.map.clusterutil.MarkerManager;
import com.zwf3lbs.map.clusterutil.clustering.algo.Algorithm;
import com.zwf3lbs.map.clusterutil.clustering.algo.NonHierarchicalDistanceBasedAlgorithm;
import com.zwf3lbs.map.clusterutil.clustering.algo.PreCachingAlgorithmDecorator;
import com.zwf3lbs.map.clusterutil.clustering.view.ClusterRenderer;
import com.zwf3lbs.map.clusterutil.clustering.view.DefaultClusterRenderer;
import com.zwf3lbs.map.entity.MonitorInfo;
import com.zwf3lbs.map.entity.VehicleEntity;
import com.zwf3lbs.map.service.FocusListenerService;
import com.zwf3lbs.map.service.ScaleService;
import com.zwf3lbs.map.thread.BaiduMoveCarThread;
import com.zwf3lbs.map.util.CommonMapUtil;
import com.zwf3lbs.map.util.CommonUtil;
import com.zwf3lbs.map.util.EventInitMethod;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * 聚合marker的管理类
 */
public class ClusterManager<T extends ClusterItem> implements
        BaiduMap.OnMapStatusChangeListener, BaiduMap.OnMarkerClickListener, BaiduMap.OnMapLoadedCallback {
    private final static String TAG = "ClusterManager";
    private final MarkerManager mMarkerManager;
    private final MarkerManager.Collection mMarkers;
    private final MarkerManager.Collection mClusterMarkers;
    /**
     * 记录地图旋转角度
     */
    public static float mapstatusRotate = 0;
    private final Algorithm<T> mAlgorithm;

    public Algorithm<T> getmAlgorithm() {
        return mAlgorithm;
    }

    private final ReadWriteLock mAlgorithmLock = new ReentrantReadWriteLock();
    private ClusterRenderer<T> mRenderer;

    private final BaiduMap mMap;
    private ClusterTask<T> mClusterTask;
    private final ReadWriteLock mClusterTaskLock = new ReentrantReadWriteLock();

    private OnClusterItemClickListener<T> mOnClusterItemClickListener;
    private OnClusterInfoWindowClickListener<T> mOnClusterInfoWindowClickListener;
    private OnClusterItemInfoWindowClickListener<T> mOnClusterItemInfoWindowClickListener;
    private OnClusterClickListener<T> mOnClusterClickListener;
    private String markerId;
    private String centerMarketId;
    private Integer aggrNum = 50;
    private FocusListenerService focusListenerService;
    private boolean focusListenerServiceFlag = false;

    /**
     * 当前聚焦的markerId
     */
    private String focusMarkerId;
    private String focusMarkerIdV2;

    public void setFocusMarkerIdV2(String focusMarkerIdV2) {
        this.focusMarkerIdV2 = focusMarkerIdV2;
    }

    public void setFocusMarkerId(String focusMarkerId) {
        this.focusMarkerId = focusMarkerId;
    }

    /**
     * 是否聚合
     */
    private boolean cLusterFlag = false;

    public boolean iscLusterFlag() {
        return cLusterFlag;
    }

    public void setCenterMarketId(String centerMarketId) {
        this.centerMarketId = centerMarketId;
    }

    public String getMarkerId() {
        return markerId;
    }

    public void setMarkerId(String markerId) {
        this.markerId = markerId;
    }

    /**
     * react上下文
     */
    private ThemedReactContext mReactContext;

    /**
     * 当前动作状态 1:marker功能 2:定位 3:拖拽 4:缩放
     */
    private Integer actionStatus;

    /**
     * 车辆全局A对象
     */
    public static Map<String, VehicleEntity> vehicleEntityListAll = new HashMap<>();

    /**
     * 当前屏幕范围内B对象
     */
    public static HashMap<String, Object> vehicleEntityListScreen = new HashMap<>();

    /**
     * 当前页面 0:主页 1:历史轨迹 2:实时尾迹 3:实时视频
     */
    private int currentView = 0;

    /**
     * markerHash数组
     */
    private final HashMap<String, List<Marker>> markerHashMap = new HashMap<>();

    public static HashMap<String, BaiduMoveCarThread> movingCars = new HashMap<>();

    /**
     * markerHashTemp数组
     */
    private final HashMap<String, List<Marker>> tempHashMap = new HashMap<>();

    public HashMap<String, List<Marker>> getTempHashMap() {
        return tempHashMap;
    }

    /**
     * 应用上下文
     */
    private Context context;

    /**
     * 视图view
     */
    private TextureMapView mapView;

    public void setFocusListenerService(FocusListenerService focusListenerService) {
        this.focusListenerService = focusListenerService;
    }

    public void setmReactContext(ThemedReactContext mReactContext) {
        this.mReactContext = mReactContext;
    }

    public void setActionStatus(Integer actionStatus) {
        this.actionStatus = actionStatus;
    }

    public void setCurrentView(int currentView) {
        this.currentView = currentView;
    }

    public int getCurrentView() {
        return currentView;
    }

    public HashMap<String, List<Marker>> getMarkerHashMap() {
        return markerHashMap;
    }

    public Context getContext() {
        return context;
    }

    public void setContext(Context context) {
        this.context = context;
    }

    public TextureMapView getMapView() {
        return mapView;
    }

    public void setMapView(TextureMapView mapView) {
        this.mapView = mapView;
    }

    public Map<String, VehicleEntity> getVehicleEntityListAll() {
        return vehicleEntityListAll;
    }

    public HashMap<String, Object> getVehicleEntityListScreen() {
        return vehicleEntityListScreen;
    }

    public HashMap<String, BaiduMoveCarThread> getMovingCars() {
        return movingCars;
    }

    public ClusterManager(Context context, BaiduMap map) {
        this(context, map, new MarkerManager(map));
    }

    private ClusterManager(Context context, BaiduMap map, MarkerManager markerManager) {
        mMap = map;
        mMarkerManager = markerManager;
        mClusterMarkers = markerManager.newCollection();
        mMarkers = markerManager.newCollection();
        mRenderer = new DefaultClusterRenderer<>(context, map, this);
        mAlgorithm = new PreCachingAlgorithmDecorator<>(new NonHierarchicalDistanceBasedAlgorithm<T>());
        mClusterTask = new ClusterTask<>(mAlgorithmLock, mAlgorithm, mRenderer);
        //mRenderer.onAdd();
    }

    public MarkerManager.Collection getMarkerCollection() {
        return mMarkers;
    }

    public MarkerManager.Collection getClusterMarkerCollection() {
        return mClusterMarkers;
    }

    public MarkerManager getMarkerManager() {
        return mMarkerManager;
    }

    public void setRenderer(ClusterRenderer<T> view) {
        mRenderer.setOnClusterClickListener(null);
        mRenderer.setOnClusterItemClickListener(null);
        mClusterMarkers.clear();
        mMarkers.clear();
        mRenderer.onRemove();
        mRenderer = view;
        mRenderer.onAdd();
        mRenderer.setOnClusterClickListener(mOnClusterClickListener);
        mRenderer.setOnClusterInfoWindowClickListener(mOnClusterInfoWindowClickListener);
        mRenderer.setOnClusterItemClickListener(mOnClusterItemClickListener);
        mRenderer.setOnClusterItemInfoWindowClickListener(mOnClusterItemInfoWindowClickListener);
        cluster();
    }

    public void clearItems() {
        mAlgorithmLock.writeLock().lock();
        try {
            mAlgorithm.clearItems();
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }
    }

    public void addItems(Set<T> items) {
        mAlgorithmLock.writeLock().lock();
        try {
            mAlgorithm.addItems(items);
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }
    }

    public void removeItem(T item) {
        mAlgorithmLock.writeLock().lock();
        try {
            mAlgorithm.removeItem(item);
        } finally {
            mAlgorithmLock.writeLock().unlock();
        }
    }

    /**
     * Force a re-cluster. You may want to call this after adding new item(s).
     */
    public void cluster() {
        mClusterTaskLock.writeLock().lock();
        try {
            // Attempt to cancel the in-flight request.
            mClusterTask.cancel(true);
            mClusterTask = new ClusterTask<>(mAlgorithmLock, mAlgorithm, mRenderer);

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.HONEYCOMB) {
                mClusterTask.execute(mMap.getMapStatus().zoom);
            } else {
                mClusterTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, mMap.getMapStatus().zoom);
            }
        } finally {
            mClusterTaskLock.writeLock().unlock();
        }
    }

    /**
     * Force a re-cluster. You may want to call this after adding new item(s).
     */
    public void stopCluster() {
        mClusterTaskLock.writeLock().lock();
        try {
            // Attempt to cancel the in-flight request.
            mClusterTask.cancel(true);
        } finally {
            mClusterTaskLock.writeLock().unlock();
        }
    }


    @Override
    public void onMapStatusChangeStart(MapStatus mapStatus) {

    }

    @Override
    public void onMapStatusChangeStart(MapStatus status, int reason) {

    }

    @Override
    public void onMapStatusChange(MapStatus mapStatus) {
    }


    @RequiresApi(api = Build.VERSION_CODES.JELLY_BEAN_MR1)
    @Override
    public void onMapStatusChangeFinish(MapStatus mapStatus) {
        // 发送比例尺信息
        if (mapView.getMap().getMapStatus() != null) {
            EventInitMethod.onMyScale(mReactContext, mapView.getId(), ScaleService.getScaleInfo(mapView.getMap()));
        }

        mapstatusRotate = mapStatus.rotate;

        if (currentView == 0) {
            if (mapStatus.zoom < 19 && (mapStatus.zoom <= 14 || loadScreen(mapStatus).size() > aggrNum)) {
                cLusterFlag = true;
                if (markerHashMap.size() > 0) {
                    for (Map.Entry<String, List<Marker>> next : markerHashMap.entrySet()) {
                        if (next.getValue().isEmpty()) {
                            continue;
                        }
                        List<Marker> value = next.getValue();
                        for (Marker marker : value) {
                            marker.remove();
                        }
                    }
                    markerHashMap.clear();
                }

                if (tempHashMap.size() > 0) {
                    for (Map.Entry<String, List<Marker>> next : tempHashMap.entrySet()) {
                        List<Marker> value = next.getValue();
                        for (Marker marker : value) {
                            marker.remove();
                        }
                    }
                    tempHashMap.clear();
                }
                if (mRenderer instanceof BaiduMap.OnMapStatusChangeListener) {
                    ((BaiduMap.OnMapStatusChangeListener) mRenderer).onMapStatusChange(mapStatus);
                }
                cluster();
                // 取消聚焦服务
                focusListenerService.stopFocus();
                // 取消聚焦服务后 取消页面聚焦状态
                EventInitMethod.onMonitorLoseFocus(mReactContext, mapView.getId());
                return;
            }
            if (mapStatus.zoom > 14) {
                cLusterFlag = false;

                if (mClusterTask.getStatus().compareTo(AsyncTask.Status.RUNNING) == 0) {
                    mClusterTask.cancel(true);
                }

                if (this.mClusterMarkers.getMarkers() != null && this.mClusterMarkers.getMarkers().size() > 0) {
                    this.mClusterMarkers.clear();
                }

                if (actionStatus == null) {
                    return;
                }
                // 当前操作页是主页
                if (vehicleEntityListAll.size() != 0 && currentView == 0) {
                    // marker渲染引起的
                    if (actionStatus == 1) {
                        // 1.加载屏幕以及确定屏幕范围内的点
                        loadScreen(mapStatus);
                        // 2.加载屏幕marker
                        markerScreen();
                        // 3.事件推送
                        WritableArray writableArray = new WritableNativeArray();
                        for (Map.Entry<String, Object> next : vehicleEntityListScreen.entrySet()) {
                            String key = next.getKey();
                            writableArray.pushString(key);
                        }
                        vehicleEntityListScreen.size();
                        EventInitMethod.onInAreaOptions(mReactContext, mapView.getId(), writableArray);
                    }
                }
            }

            List<Marker> markers = markerHashMap.get(focusMarkerIdV2);

            if (markers != null && markers.size() > 1 && focusListenerService.getMarker() != markers.get(1)) {
                focusListenerService.setMarker(markers.get(1));
            }

            if (focusListenerServiceFlag) {
                focusListenerServiceFlag = false;
                focusListenerService.setPoint(CommonMapUtil.getScreenPoint());
                focusListenerService.setMap(mapView.getMap());
                focusListenerService.stopFocus();
                focusListenerService.startFocus();
            }
        } else {
            //实时尾迹
            Marker carMarker = (Marker) BaiduMapViewManager.wakeMap.get("carMarker");
            Marker tempCarMarker = (Marker) BaiduMapViewManager.wakeMap.get("tempCarMarker");
            if (carMarker != null && carMarker.getExtraInfo() != null) {
                int angle = carMarker.getExtraInfo().getInt("wakeDataAngle");
                CommonUtil.routeCarMarker(carMarker, (int) (angle + mapstatusRotate));
            }

            if (tempCarMarker != null && tempCarMarker.getExtraInfo() != null) {
                int angle = tempCarMarker.getExtraInfo().getInt("wakeDataAngle");
                CommonUtil.routeCarMarker(tempCarMarker, (int) (angle + mapstatusRotate));
            }

            //实时追踪
            Marker activeMarker = BaiduMapViewManager.activeMarker;
            if (activeMarker != null) {
                int routePlanAngle = activeMarker.getExtraInfo().getInt("routePlanAngle");
                CommonUtil.routeCarMarker(activeMarker, (int) (routePlanAngle + mapstatusRotate));
            }

            //历史轨迹
            Marker historyMarker = (Marker) BaiduMapViewManager.historyMap.get("newMarker");
            if (historyMarker != null) {
                int historyAngle = historyMarker.getExtraInfo().getInt("historyAngle");
                CommonUtil.routeCarMarker(historyMarker, (int) (historyAngle + mapstatusRotate));
            }

            //视频模块
            Marker videoMarker = (Marker) BaiduMapViewManager.histMap.get("carMarker");
            if (videoMarker != null) {
                int videoAngle = videoMarker.getExtraInfo().getInt("videoAngle");
                CommonUtil.routeCarMarker(videoMarker, (int) (videoAngle + mapstatusRotate));
            }

        }
    }

    @Override
    public boolean onMarkerClick(Marker marker) {
        return getMarkerManager().onMarkerClick(marker);
    }

    @Override
    public void onMapLoaded() {
        Log.i(TAG, "比例尺的高度,宽度:" + mapView.getScaleControlViewHeight() + ":" + mapView.getScaleControlViewWidth() + ":" + mapView.getMapLevel());
        //地图初始化成功事件
        EventInitMethod.onMapInitFinish(mReactContext, mapView.getId());
    }

    public void setAggrNum(Integer aggrNum) {
        this.aggrNum = aggrNum;
    }

    public void startFocusListenerService(boolean flag) {
        this.focusListenerServiceFlag = flag;
    }

    /**
     * Runs the clustering algorithm in a background thread, then re-paints when results come back.
     */
    private static class ClusterTask<T extends ClusterItem> extends AsyncTask<Float, Void, Set<? extends Cluster<T>>> {
        private final ReadWriteLock lock;
        private final Algorithm<T> algorithm;
        private final ClusterRenderer<T> renderer;

        ClusterTask(ReadWriteLock lock, Algorithm<T> algorithm, ClusterRenderer<T> renderer) {
            this.lock = lock;
            this.algorithm = algorithm;
            this.renderer = renderer;
        }

        @Override
        protected Set<? extends Cluster<T>> doInBackground(Float... zoom) {
            lock.readLock().lock();
            try {
                return algorithm.getClusters(zoom[0]);
            } finally {
                lock.readLock().unlock();
            }
        }

        @Override
        protected void onPostExecute(Set<? extends Cluster<T>> clusters) {
            renderer.onClustersChanged(clusters);
        }
    }

    /**
     * Sets a callback that's invoked when a Cluster is tapped. Note: For this listener to function,
     * the ClusterManager must be added as a click listener to the map.
     */
    public void setOnClusterClickListener(OnClusterClickListener<T> listener) {
        mOnClusterClickListener = listener;
        mRenderer.setOnClusterClickListener(listener);
    }

    /**
     * Sets a callback that's invoked when a Cluster is tapped. Note: For this listener to function,
     * the ClusterManager must be added as a info window click listener to the map.
     */
    public void setOnClusterInfoWindowClickListener(OnClusterInfoWindowClickListener<T> listener) {
        mOnClusterInfoWindowClickListener = listener;
        mRenderer.setOnClusterInfoWindowClickListener(listener);
    }

    /**
     * Sets a callback that's invoked when an individual ClusterItem is tapped. Note: For this
     * listener to function, the ClusterManager must be added as a click listener to the map.
     */
    public void setOnClusterItemClickListener(OnClusterItemClickListener<T> listener) {
        mOnClusterItemClickListener = listener;
        mRenderer.setOnClusterItemClickListener(listener);
    }

    /**
     * Sets a callback that's invoked when an individual ClusterItem's Info Window is tapped. Note: For this
     * listener to function, the ClusterManager must be added as a info window click listener to the map.
     */
    public void setOnClusterItemInfoWindowClickListener(OnClusterItemInfoWindowClickListener<T> listener) {
        mOnClusterItemInfoWindowClickListener = listener;
        mRenderer.setOnClusterItemInfoWindowClickListener(listener);
    }

    /**
     * Called when a Cluster is clicked.
     */
    public interface OnClusterClickListener<T extends ClusterItem> {
        boolean onClusterClick(Cluster<T> cluster);
    }

    /**
     * Called when a Cluster's Info Window is clicked.
     */
    public interface OnClusterInfoWindowClickListener<T extends ClusterItem> {
        void onClusterInfoWindowClick(Cluster<T> cluster);
    }

    /**
     * Called when an individual ClusterItem is clicked.
     */
    public interface OnClusterItemClickListener<T extends ClusterItem> {
        boolean onClusterItemClick(T item);
    }

    /**
     * Called when an individual ClusterItem's Info Window is clicked.
     */
    public interface OnClusterItemInfoWindowClickListener<T extends ClusterItem> {
        void onClusterItemInfoWindowClick(T item);
    }

    /**
     * 获取当前屏幕范围内的点
     */
    private HashMap<String, Object> loadScreen(MapStatus mapStatus) {
        vehicleEntityListScreen.clear();
        LatLngBounds bound = mapStatus.bound;

        Collection<VehicleEntity> vehicleEntities = vehicleEntityListAll.values();
        for (VehicleEntity vehicleEntity : vehicleEntities) {
            LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
            if (markerHashMap.get(vehicleEntity.getMarkerId()) != null) {
                List<Marker> markers = markerHashMap.get(vehicleEntity.getMarkerId());
                latLng = markers.get(1).getPosition();
            }
            if (bound.contains(latLng)) {
                VehicleEntity vehicle = new VehicleEntity();
                vehicle.setTitle(vehicleEntity.getTitle());
                vehicle.setStatus(vehicleEntity.getStatus());
                vehicle.setSpeed(vehicleEntity.getSpeed());
                vehicle.setIco(vehicleEntity.getIco());
                vehicle.setMarkerId(vehicleEntity.getMarkerId());
                vehicle.setLatitude(vehicleEntity.getLatitude());
                vehicle.setLongitude(vehicleEntity.getLongitude());
                vehicle.setAngle(vehicleEntity.getAngle());
                vehicle.setTime(vehicleEntity.getTime());
                vehicleEntityListScreen.put(vehicle.getMarkerId(), vehicle);
            }
            if (vehicleEntity.getMarkerId().equals(focusMarkerId)) {
                vehicleEntityListScreen.put(focusMarkerId, vehicleEntity);
            }
        }
        Iterator<Map.Entry<String, List<Marker>>> iterator = markerHashMap.entrySet().iterator();
        if (iterator != null) {
            while (iterator.hasNext()) {
                if (vehicleEntityListScreen.size() == 0) {
                    Map.Entry<String, List<Marker>> next = iterator.next();
                    if (next.getValue().isEmpty()) {
                        continue;
                    }
                    for (Marker marker : next.getValue()) {
                        marker.remove();
                    }
                    iterator.remove();
                } else {
                    Map.Entry<String, List<Marker>> next = iterator.next();
                    if (next.getValue().isEmpty()) {
                        continue;
                    }
                    if (vehicleEntityListScreen.get(next.getKey()) == null) {
                        for (Marker marker : next.getValue()) {
                            if (!mapView.getMap().getMapStatus().bound.contains(marker.getPosition())) {
                                marker.remove();
                            }
                        }
                        iterator.remove();
                    } else {
                        if (centerMarketId != null) {
                            if (next.getKey().equals(centerMarketId) && !next.getValue().isEmpty()) {
                                for (Marker marker : next.getValue()) {
                                    marker.setToTop();
                                }
                            }
                        }
                    }
                }
            }
        }

        return vehicleEntityListScreen;
    }

    /**
     * 打印当前屏幕上的点
     */
    @RequiresApi(api = Build.VERSION_CODES.JELLY_BEAN_MR1)
    private void markerScreen() {
        final ArrayList<VehicleEntity> vehicleEntities = new ArrayList<>();
        for (Map.Entry<String, Object> next : vehicleEntityListScreen.entrySet()) {
            if (!markerHashMap.containsKey(next.getKey())) {
                vehicleEntities.add((VehicleEntity) next.getValue());
            } else {
                //地图旋转时车的方向跟着旋转
                List<Marker> markers = markerHashMap.get(next.getKey());
                Marker marker = markers.get(1);
                int angle = marker.getExtraInfo().getInt("BaiduMoveCarThreadAngle");
                CommonUtil.routeCarMarker(marker, (int) (angle + mapstatusRotate));
            }
        }
        if (!isValidContextForGlide(mReactContext)) {
            Log.e(TAG, "markerScreen: mReactContext已经被销毁");
            return;
        }
        RequestManager requestManager = Glide.with(mReactContext);
        for (final VehicleEntity vehicleEntitys : vehicleEntities) {
            requestManager
                    .load(vehicleEntitys.getIco())
                    .asBitmap().diskCacheStrategy(DiskCacheStrategy.SOURCE)
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            View inflate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon_test, null);
                            Button button = inflate.findViewById(R.id.onButton);
                            TextView textView = inflate.findViewById(R.id.onTextView);
                            final LatLng latLng = new LatLng(vehicleEntitys.getLatitude().doubleValue(), vehicleEntitys.getLongitude().doubleValue());
                            GradientDrawable background = (GradientDrawable) button.getBackground();
                            background.setColor(CommonUtil.statusToColour(vehicleEntitys.getStatus()));
                            textView.setText(vehicleEntitys.getTitle());
                            textView.getPaint().setFakeBoldText(true);
                            // 设置车辆s
                            // 设置车辆的偏转方向
                            BitmapDescriptor textImg = BitmapDescriptorFactory.fromView(inflate);
                            View imgFlate = LayoutInflater.from(context).inflate(R.layout.vehicle_icon, null);
                            BitmapDescriptor bitMap = CommonUtil.getBitMapV2(textImg);
                            ((ImageView) imgFlate.findViewById(R.id.imgTest)).setImageBitmap(resource);
                            BitmapDescriptor carImg = BitmapDescriptorFactory.fromView(imgFlate);
                            MarkerOptions textOptions = new MarkerOptions().icon(bitMap).position(latLng);
                            MarkerOptions carOptions = new MarkerOptions().icon(carImg).position(latLng).anchor(0.5f, 0.5f);
                            if (markerHashMap.containsKey(vehicleEntitys.getMarkerId())) {
                                return;
                            }
                            Marker textMarker = (Marker) mapView.getMap().addOverlay(textOptions);
                            Marker carMarker = (Marker) mapView.getMap().addOverlay(carOptions);
                            CommonUtil.routeCarMarker(carMarker, (int) (vehicleEntitys.getAngle() + mapstatusRotate));
                            Bundle bundle = new Bundle();
                            bundle.putString("marketId", vehicleEntitys.getMarkerId());
                            bundle.putInt("time", vehicleEntitys.getTime());
                            bundle.putInt("BaiduMoveCarThreadAngle", vehicleEntitys.getAngle().intValue());
                            carMarker.setExtraInfo(bundle);
                            ArrayList<Marker> markers = new ArrayList<>();
                            if (centerMarketId != null && centerMarketId.equals(vehicleEntitys.getMarkerId())) {
                                textMarker.setToTop();
                                carMarker.setToTop();
                            }
                            markers.add(textMarker);
                            markers.add(carMarker);
                            if (markerId != null && !"".equals(markerId) && vehicleEntitys.getMarkerId().equals(markerId)) {
                                textMarker.setToTop();
                                carMarker.setToTop();
                            }

                            BaiduMoveCarThread baiduMoveCarThread = movingCars.get(vehicleEntitys.getMarkerId());
                            if (baiduMoveCarThread != null) {
                                List<Marker> markerList = baiduMoveCarThread.getMoveMarker();
                                for (Marker marker : markerList) {
                                    marker.remove();
                                }
                                baiduMoveCarThread.stopMove();
                                movingCars.remove(vehicleEntitys.getMarkerId());
                            }

                            //将车加入聚合的集合里
                            Set<MyItem> items = (Set<MyItem>) mAlgorithm.getItems();
                            MyItem myItem = new MyItem(latLng);
                            MonitorInfo monitorInfo = new MonitorInfo();
                            monitorInfo.setMonitorId(vehicleEntitys.getMarkerId());
                            monitorInfo.setName(vehicleEntitys.getTitle());
                            monitorInfo.setStatus(vehicleEntitys.getStatus());
                            monitorInfo.setTime(vehicleEntitys.getTime());
                            myItem.setMarkerId(vehicleEntitys.getMarkerId());
                            myItem.setMonitorInfo(monitorInfo);

                            if (!items.contains(myItem)) {
                                clearItems();
                                items.add(myItem);
                                addItems((Set<T>) items);
                            }

                            markerHashMap.put(vehicleEntitys.getMarkerId(), markers);

                            if (vehicleEntitys.getMarkerId().equals(focusMarkerIdV2)) {
                                focusListenerService.setMarker(carMarker);
                            }
                        }
                    });
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.JELLY_BEAN_MR1)
    private static boolean isValidContextForGlide(final Context context) {
        if (context == null) {
            return false;
        }
        if (context instanceof Activity) {
            final Activity activity = (Activity) context;
            if (isAcitityDestroyed(activity)) {
                return false;
            }
        }

        if (context instanceof ThemedReactContext) {
            final Context baseContext = ((ThemedReactContext) context).getBaseContext();
            if (baseContext instanceof Activity) {
                final Activity baseActivity = (Activity) baseContext;
                return !isAcitityDestroyed(baseActivity);
            }
        }

        return true;
    }

    @RequiresApi(api = Build.VERSION_CODES.JELLY_BEAN_MR1)
    private static boolean isAcitityDestroyed(Activity activity) {
        return activity.isDestroyed() || activity.isFinishing();
    }
}