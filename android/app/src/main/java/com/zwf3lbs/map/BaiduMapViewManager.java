package com.zwf3lbs.map;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.Log;
import android.util.SparseArray;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baidu.location.BDAbstractLocationListener;
import com.baidu.location.BDLocation;
import com.baidu.location.LocationClient;
import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.BitmapDescriptorFactory;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.MarkerOptions;
import com.baidu.mapapi.map.MyLocationConfiguration;
import com.baidu.mapapi.map.MyLocationData;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.map.OverlayOptions;
import com.baidu.mapapi.map.Polyline;
import com.baidu.mapapi.map.PolylineOptions;
import com.baidu.mapapi.map.TextureMapView;
import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.model.LatLngBounds;
import com.baidu.mapapi.search.route.DrivingRoutePlanOption;
import com.baidu.mapapi.search.route.PlanNode;
import com.baidu.mapapi.search.route.RoutePlanSearch;
import com.baidu.mapapi.utils.DistanceUtil;
import com.blankj.utilcode.util.ScreenUtils;
import com.blankj.utilcode.util.SizeUtils;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.target.Target;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.zwf3lbs.map.clusterutil.clustering.ClusterManager;
import com.zwf3lbs.map.entity.CarMoveInfo;
import com.zwf3lbs.map.entity.DecLatLng;
import com.zwf3lbs.map.entity.MonitorInfo;
import com.zwf3lbs.map.entity.VehicleEntity;
import com.zwf3lbs.map.entity.VehicleParkEntity;
import com.zwf3lbs.map.listener.MapClickListener;
import com.zwf3lbs.map.listener.MapRenderListener;
import com.zwf3lbs.map.listener.MarkerClickListener;
import com.zwf3lbs.map.listener.RoutePlanResultListener;
import com.zwf3lbs.map.service.FocusListenerService;
import com.zwf3lbs.map.thread.BaiduMoveCarThread;
import com.zwf3lbs.map.thread.HistoryMoveCarThread;
import com.zwf3lbs.map.thread.VideoMoveCarThread;
import com.zwf3lbs.map.thread.WakeDataMoveCarThread;
import com.zwf3lbs.map.thread.WakeDataRealTimeThread;
import com.zwf3lbs.map.util.BaiduMapVariable;
import com.zwf3lbs.map.util.CommonMapUtil;
import com.zwf3lbs.map.util.CommonUtil;
import com.zwf3lbs.map.util.EventInitMethod;
import com.zwf3lbs.map.util.StringUtil;
import com.zwf3lbs.navigation.NavigationModule;
import com.zwf3lbs.zwf3lbsapp.R;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.zwf3lbs.map.util.CommonUtil.getAngle;

public class BaiduMapViewManager extends SimpleViewManager<TextureMapView> {

    private static final String REACT_CLASS = "RCTBaiduMap";
    private static final String TAG = "BaiduMapViewManager";
    private ThemedReactContext mReactContext;
    /**
     * 定位图层
     */
    private LocationClient mLocationClient;
    private ClusterManager<MyItem> mClusterManager;

    /**
     * 应用上下文
     */
    private final Context context;
    /**
     * 百度位置监听器
     */
    private BDAbstractLocationListener myListener;

    /**
     * 屏幕中心点经纬度
     */
    private LatLng centreLatLng;

    /**
     * 当前地图缩放级别
     */
    private float currentZoomSize = 15f;

    /**
     * 历史轨迹页面小车平滑移动
     */
    private HistoryMoveCarThread historyMoveCarThread;

    private static final int[] historyLine = {150, 150};

    /**
     * 历史轨迹相关信息
     */
    public static final HashMap<String, Object> historyMap = new HashMap<>();

    /**
     * 历史轨迹停止点信息
     */
    public static final SparseArray<Marker> historyPark = new SparseArray<>();

    /**
     * 停止点选中位置
     */
    public static int parkIndex = -1;

    /**
     * 实时监控车的点的间隔跳点时间s
     */
    public static int intervalsTime = 35;
    /**
     * 是否跳点
     */
    private static boolean dotType = true;
    /**
     * 跳点值
     */
    private static int dotValue = 35;
    /**
     * 是否更改轨迹线粗细
     */
    private static boolean trajectoryType = true;
    /**
     * 轨迹线粗细等级
     * 1:细 2:中等（默认） 3:粗
     */
    private static int trajectoryValue = 2;
    /**
     * 是否显示曲线图（用于控制是否跳点）
     */
    private boolean isShowChart = false;
    /**
     * 当前页面 0:主页 1:历史轨迹 2:实时尾迹 3:实时追踪
     */
    private int currentView = 0;

    private RoutePlanSearch routePlanSearch;

    private Boolean isWindowsClose = false;

    private final HashMap<String, BaiduMoveCarThread> movingCars = ClusterManager.movingCars;
    /**
     * 车辆全局A对象
     */
    private final Map<String, VehicleEntity> vehicleEntityListAll = ClusterManager.vehicleEntityListAll;
    /**
     * 当前屏幕范围内B对象
     */
    private final HashMap<String, Object> vehicleEntityListScreen = ClusterManager.vehicleEntityListScreen;
    /**
     * 实时定位的具体坐标
     */
    private LatLng locationLatLng;
    /**
     * 聚焦监听服务
     */
    private FocusListenerService focusListenerService;

    private MapGeoCoder mapGeoCoder;

    /**
     * 路线监听器
     */
    private RoutePlanResultListener listener;

    private MarkerClickListener markerClickListener;

    @Override
    public @NonNull
    String getName() {
        return REACT_CLASS;
    }

    public BaiduMapViewManager(Context context) {
        Log.i(TAG, "context初始化:" + context);
        this.context = context;
    }

    /**
     * 创建react实例
     */
    @Override
    protected @NonNull
    TextureMapView createViewInstance(@NonNull ThemedReactContext reactContext) {
        Log.i(TAG, "===createViewInstance===");
        destroy();
        BaiduMapVariable.num = -1;
        // react --> 初始化
        this.mReactContext = reactContext;
        TextureMapView mapView = new TextureMapView(reactContext);
        BaiduMap map = mapView.getMap();

        // 初始化聚焦服务
        focusListenerService = new FocusListenerService();
        focusListenerService.setMap(map);

        // 点聚合工具类 --> 初始化
        mClusterManager = new ClusterManager<>(mReactContext, map);
        mClusterManager.setContext(reactContext);
        mClusterManager.setmReactContext(reactContext);
        mClusterManager.setMapView(mapView);
        mClusterManager.setFocusListenerService(focusListenerService);

        // 指南针位置    --> 初始化
        //CommonMapUtil.initCompassLocation(map, null);
        // 近大远小效果   --> 初始化
        CommonMapUtil.initMarkerEffect(map, false);

        this.mapGeoCoder = new MapGeoCoder(reactContext);
        this.listener = new RoutePlanResultListener(reactContext);

        markerClickListener = new MarkerClickListener(mapView, mapGeoCoder, reactContext);

        // 地图监听初始化
        CommonMapUtil.initMapListener(map, mClusterManager,
                markerClickListener,
                new MapClickListener(mapView, reactContext),
                new MapRenderListener(map));
        // 地图初始位置   --> 初始化
        LatLng initPoint = CommonUtil.initLocation(mReactContext);
        CommonMapUtil.initDefaultLocation(map, initPoint);
        // 地图ui组件   --> 初始化
        CommonMapUtil.initMapController(mapView, false);
        return mapView;
    }

    private final Map<String, VehicleEntity> listAllTemp = new HashMap<>();

    @ReactProp(name = "appStateBackToForeground")
    public void setAppStateBackToForeground(TextureMapView mapView, Boolean b) {
        if (b != null) {
            isWindowsClose = b;
        }
    }

    @ReactProp(name = "minZoomState")
    public void setMinZoomState(final TextureMapView mapView, double currentZoomSize) {
        centreLatLng = new LatLng(40.664248, 105.120685);
        Log.i(TAG, "===setMinZoomState:===" + "缩放到全国地图层级以重庆为中心");
        CommonMapUtil.localCenterPoint(mapView.getMap(), new LatLng(40.664248, 105.120685), 5);
    }


    @ReactProp(name = "markers")
    public void setMarkers(final TextureMapView mapView, ReadableArray array) {
        Log.i(TAG, "===setMarkers=== " + array);
        if (array == null || array.size() == 0) return;
        mClusterManager.setActionStatus(1);
        int size = array.size();
        VehicleEntity vehicleEntity = VehicleEntity.fromReadableMap(array.getMap(0));
        if (vehicleEntity == null) return;
        if (size == 1 && vehicleEntityListAll.size() != 0 && !isContainsVehicle(vehicleEntity))
            return;
        if (size == 1 && vehicleEntityListAll.size() != 0 && !array.isNull(0)) {
            if (mClusterManager.iscLusterFlag()) {//判断是否为聚合状态
                updateClusterItemInfo(vehicleEntity);//更新当前监控对象的信息为最新信息
                return;
            }
            //获取marker字典（每一组都表示一个车牌marker和车辆marker）
            HashMap<String, List<Marker>> markerHashMap = mClusterManager.getMarkerHashMap();
            //获取marker组（包括车牌文本marker和车辆marker，0位textMarker,1为carMarker）
            List<Marker> markers = markerHashMap.get(vehicleEntity.getMarkerId());
            if (markers == null || markers.isEmpty()) return;
            //更新车牌marker信息
            updateTextMarker(vehicleEntity, markers.get(0));
            LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(),
                    vehicleEntity.getLongitude().doubleValue());
            LatLng latLng1 = markers.get(1).getPosition();
            Bundle bundle = markers.get(1).getExtraInfo();

            //判断两个点是否为同一个点
            if (latLng1.longitude == latLng.longitude && latLng1.latitude == latLng.latitude) {
                bundle.putInt("time", vehicleEntity.getTime());
                markers.get(1).setExtraInfo(bundle);
                resetLocalVehicle(vehicleEntity, markers, false);
                return;
            }
            //获取上一次的定位时间，并记录下来
            Integer newTime = bundle.getInt("time");
            Integer oldTime = newTime;

            CarMoveInfo carMove = new CarMoveInfo();
            carMove.setCarTime(vehicleEntity.getTime());
            carMove.setLatLng(latLng);

            BaiduMoveCarThread baiduMoveCarThread = movingCars.get(vehicleEntity.getMarkerId());
            if (baiduMoveCarThread != null) {
                oldTime = baiduMoveCarThread.getLastCarMoveInfo().getCarTime();
                latLng1 = baiduMoveCarThread.getLastCarMoveInfo().getLatLng();
            } else {
                baiduMoveCarThread = new BaiduMoveCarThread();
                baiduMoveCarThread.setLastCarMoveInfo(carMove);
                movingCars.put(vehicleEntity.getMarkerId(), baiduMoveCarThread);
            }

            int time;
            if (newTime == 0) {//初次获取为0
                markers.get(0).setPosition(latLng);
                markers.get(1).setPosition(latLng);
                markers.get(1).setRotate(vehicleEntity.getAngle());
                bundle.putInt("BaiduMoveCarThreadAngle", vehicleEntity.getAngle());
                bundle.putInt("time", vehicleEntity.getTime());
                markers.get(1).setExtraInfo(bundle);
                resetLocalVehicle(vehicleEntity, markers, true);
                return;
            } else {
                if (vehicleEntity.getTime() < newTime) {
                    //当前位置的定位时间小于上次定位的时间，重新设置新的marker数据
                    resetLocalVehicle(vehicleEntity, markers, false);
                    return;
                }
                //计算两个经纬度点的时间间隔
                time = vehicleEntity.getTime() - newTime;
            }
            //设置两个点移动的时间间隔
            carMove.setTime(time);
            if (dotType) intervalsTime = dotValue;//跳点时间处理
            if (baiduMoveCarThread.getDotSize() >= 2) {//压点数量大于等于2个时
                //获取当前的定位时间和队列中第一个的时间，取差值
                int interval = vehicleEntity.getTime() - baiduMoveCarThread.getBottomInfo().getCarTime();
                if (interval > intervalsTime) {//如果差值时间大于设置的时间，则执行跳点操作
                    markers.get(0).setPosition(latLng);
                    markers.get(1).setPosition(latLng);
                    markers.get(1).setRotate(vehicleEntity.getAngle());
                    bundle.putInt("BaiduMoveCarThreadAngle", vehicleEntity.getAngle());
                    bundle.putInt("time", vehicleEntity.getTime());
                    markers.get(1).setExtraInfo(bundle);
                    resetLocalVehicle(vehicleEntity, markers, true);
                    return;
                }
            } else if (baiduMoveCarThread.getDotSize() == 1) {//压点数量只有一个时
                //计算两个经纬度的距离
                double distance = DistanceUtil.getDistance(latLng, latLng1);
                double speed = (distance * 3.6) / time;
                //两点的间隔大于121秒，或者速度小于5或者速度大于230时，执行跳点
                if (speed > 230 || speed < 5 || time > 121) {
                    markers.get(0).setPosition(latLng);
                    markers.get(1).setPosition(latLng);
                    markers.get(1).setRotate(vehicleEntity.getAngle());
                    bundle.putInt("time", vehicleEntity.getTime());
                    markers.get(1).setExtraInfo(bundle);
                    resetLocalVehicle(vehicleEntity, markers, true);
                    return;
                }else {//平滑移动
                    bundle.putInt("time", vehicleEntity.getTime());
                    markers.get(1).setExtraInfo(bundle);
                }
            } else {//平滑移动
                bundle.putInt("time", vehicleEntity.getTime());
                markers.get(1).setExtraInfo(bundle);
            }
            /*if (time > intervalsTime || isWindowsClose) {
                markers.get(0).setPosition(latLng);
                markers.get(1).setPosition(latLng);
                markers.get(1).setRotate(vehicleEntity.getAngle());
                bundle.putInt("BaiduMoveCarThreadAngle", vehicleEntity.getAngle());
                bundle.putInt("time", vehicleEntity.getTime());
                markers.get(1).setExtraInfo(bundle);
                resetLocalVehicle(vehicleEntity, markers, true);
                return;
            }
            double speed = (d * 3.6) / time;
            if (speed > 230|| speed < 5 || (vehicleEntity.getTime() - newTime) < 1) {
                bundle.putInt("time", vehicleEntity.getTime());
                markers.get(1).setExtraInfo(bundle);
                resetLocalVehicle(vehicleEntity, markers, false);
                return;
            } else {
                bundle.putInt("time", vehicleEntity.getTime());
                markers.get(1).setExtraInfo(bundle);
            }*/
           /* Set<MyItem> items = mClusterManager.getmAlgorithm().getItems();
            MyItem myItem = new MyItem(latLng);
            MonitorInfo monitorInfo = new MonitorInfo();
            monitorInfo.setMonitorId(vehicleEntity.getMarkerId());
            monitorInfo.setName(vehicleEntity.getTitle());
            monitorInfo.setStatus(vehicleEntity.getStatus());
            monitorInfo.setTime(vehicleEntity.getTime());
            myItem.setMarkerId(vehicleEntity.getMarkerId());
            myItem.setMonitorInfo(monitorInfo);
            mClusterManager.clearItems();
            items.remove(myItem);
            items.add(myItem);
            mClusterManager.addItems(items);*/
            updateClusterItemInfo(vehicleEntity);
            resetLocalVehicle(vehicleEntity, markers, false);
            if (!mClusterManager.iscLusterFlag()) {
                startCarMove(vehicleEntity.getMarkerId(), markers, carMove);
            }
        } else {
            //第一次的数据，会下发所有车辆的数据
            addVehicleEntity2List(array, size);
            Collection<VehicleEntity> vehicleEntities = vehicleEntityListAll.values();
            // 默认取第一个监控对象的数据
            VehicleEntity vty = vehicleEntities.iterator().next();
            // 地图中心点
            centreLatLng = new LatLng(vty.getLatitude().doubleValue(), vty.getLongitude().doubleValue());
            Set<MyItem> listItems = new HashSet<>();
            for (VehicleEntity vehicle : vehicleEntities) {//首次下发，遍历所有车辆数据，添加到集合中
                MyItem myItem = new MyItem(new LatLng(vehicle.getLatitude().doubleValue(), vehicle.getLongitude().doubleValue()));
                myItem.setMarkerId(vehicle.getMarkerId());
                MonitorInfo monitorInfo = new MonitorInfo();
                monitorInfo.setMonitorId(vehicle.getMarkerId());
                monitorInfo.setName(vehicle.getTitle());
                monitorInfo.setStatus(vehicle.getStatus());
                monitorInfo.setTime(vehicle.getTime());
                myItem.setMonitorInfo(monitorInfo);
                listItems.add(myItem);

                listAllTemp.put(vehicle.getMarkerId(), vehicle);
            }
            mClusterManager.clearItems();
            mClusterManager.addItems(listItems);//添加所有车辆item到cluster中
            BaiduMapVariable.num = 0;
            if (centreLatLng.latitude == 1000.0 && centreLatLng.longitude == 1000.0) {
                centreLatLng = new LatLng(40.664248, 105.120685);
                CommonMapUtil.localCenterPoint(mapView.getMap(), centreLatLng, 5);
            } else {
                CommonMapUtil.localCenterPoint(mapView.getMap(), centreLatLng, 19);
            }
        }
    }

    /**
     * 更新聚合点的信息
     *
     * @param vehicleEntity 当前车辆的定位实体信息
     */
    private void updateClusterItemInfo(VehicleEntity vehicleEntity) {
        Set<MyItem> items = mClusterManager.getmAlgorithm().getItems();
        MyItem myItem = new MyItem(new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue()));
        MonitorInfo monitorInfo = new MonitorInfo();
        monitorInfo.setMonitorId(vehicleEntity.getMarkerId());
        monitorInfo.setName(vehicleEntity.getTitle());
        monitorInfo.setStatus(vehicleEntity.getStatus());
        monitorInfo.setTime(vehicleEntity.getTime());
        myItem.setMarkerId(vehicleEntity.getMarkerId());
        myItem.setMonitorInfo(monitorInfo);
        mClusterManager.clearItems();
        items.remove(myItem);
        items.add(myItem);
        mClusterManager.addItems(items);
    }

    /**
     * 更新textMarker
     *
     * @param vehicleEntity 当前监控对象的经纬度数据信息实体
     * @param textMarker    车牌号marker
     */
    private void updateTextMarker(VehicleEntity vehicleEntity, Marker textMarker) {
        View textLayout = View.inflate(context, R.layout.vehicle_icon_test, null);
        Button button = textLayout.findViewById(R.id.onButton);
        TextView textView = textLayout.findViewById(R.id.onTextView);
        GradientDrawable background = (GradientDrawable) button.getBackground();
        background.setColor(CommonUtil.statusToColour(vehicleEntity.getStatus()));
        textView.setText(vehicleEntity.getTitle());
        textView.getPaint().setFakeBoldText(true);
        BitmapDescriptor newBitMap = CommonUtil.getBitMapV2(BitmapDescriptorFactory.fromView(textLayout));
        textMarker.setIcon(newBitMap);
    }

    /**
     * 跳点设置
     */
    @ReactProp(name = "dotData")
    public void dotData(final TextureMapView mapView, ReadableMap readableMap) {
        Log.i(TAG, "===dotData===" + readableMap);
        if (readableMap == null) return;
        try {
            ReadableNativeMap map = (ReadableNativeMap) readableMap;
            dotType = map.getBoolean("dotType");
            String value = map.getString("dotValue");
            if (StringUtil.isNotEmpty(value)) dotValue = Integer.parseInt(value);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 轨迹粗细值设置
     */
    @ReactProp(name = "trajectoryData")
    public void trajectoryData(final TextureMapView mapView, ReadableMap readableMap) {
        Log.i(TAG, "===trajectoryData===" + readableMap);
        if (readableMap == null) return;
        try {
            ReadableNativeMap map = (ReadableNativeMap) readableMap;
            trajectoryType = map.getBoolean("trajectoryType");
            trajectoryValue = map.getInt("trajectoryValue");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 退出后台后车跳点到最新位置
     */
    @ReactProp(name = "goLatestPoin")
    public void goLatestPoin(final TextureMapView mapView, ReadableArray array) {
        Log.i(TAG, "===goLatestPoin===" + array);
        // JS端初始化处理 直接返回信息
        if (array == null || array.size() == 0) return;
        final BaiduMap map = mapView.getMap();
        ReadableMap readableMap = array.getMap(0);
        if (readableMap == null) return;
        String monitorId = readableMap.getString("monitorId");
        double latitude = readableMap.getDouble("latitude");
        double longitude = readableMap.getDouble("longitude");
        int status = readableMap.getInt("status");
        String title = readableMap.getString("title");
        int time = readableMap.getInt("time");
        LatLng latLng = new LatLng(latitude, longitude);

        BaiduMoveCarThread baiduMoveCarThread = movingCars.get(monitorId);
        if (baiduMoveCarThread != null) {
            List<Marker> markers = baiduMoveCarThread.getMoveMarker();
            double angle = getAngle(markers.get(0).getPosition(), latLng);
            if (angle < 0) {
                angle = 360 + angle;
            }
            markers.get(0).setPosition(latLng);
            View textLayout = View.inflate(context, R.layout.vehicle_icon_test, null);
            Button button = textLayout.findViewById(R.id.onButton);
            TextView textView = textLayout.findViewById(R.id.onTextView);
            GradientDrawable background = (GradientDrawable) button.getBackground();
            background.setColor(CommonUtil.statusToColour(status));
            textView.setText(title);
            textView.getPaint().setFakeBoldText(true);
            BitmapDescriptor newBitMap = CommonUtil.getBitMapV2(BitmapDescriptorFactory.fromView(textLayout));
            markers.get(0).setIcon(newBitMap);


            markers.get(1).setPosition(latLng);
            markers.get(1).setRotate((int) angle + ClusterManager.mapstatusRotate);
            Bundle bundle = markers.get(1).getExtraInfo();
            bundle.putInt("BaiduMoveCarThreadAngle", (int) angle);
            bundle.putInt("time", time);
            markers.get(1).setExtraInfo(bundle);

            VehicleEntity vehicleEntity = vehicleEntityListAll.get(monitorId);
            vehicleEntity.setAngle((int) angle);
            vehicleEntity.setLatitude(new BigDecimal(latLng.latitude));
            vehicleEntity.setLongitude(new BigDecimal(latLng.longitude));

            vehicleEntityListAll.put(monitorId, vehicleEntity);
            mClusterManager.getTempHashMap().put(monitorId, markers);

            baiduMoveCarThread.stopMove();
            movingCars.remove(vehicleEntity.getMarkerId());
            CommonMapUtil.localCenterPoint(map, latLng, 19);
        } else {
            CommonMapUtil.localCenterPoint(map, latLng, 19);
        }

    }

    /**
     * 重新设置新的marker数据（textMarker与carMarker）
     *
     * @param vehicleEntity 当前监控对象经纬度数据
     * @param markers       marker集合（textMarker与carMarker）
     * @param isPoint       是否停止车辆的移动
     */
    private void resetLocalVehicle(VehicleEntity vehicleEntity, List<Marker> markers, Boolean isPoint) {
        Log.i(TAG, "===resetLocalVehicle===");
        vehicleEntityListAll.put(vehicleEntity.getMarkerId(), vehicleEntity);
        mClusterManager.getTempHashMap().put(vehicleEntity.getMarkerId(), markers);
        if (isPoint) {
            BaiduMoveCarThread baiduMoveCarThread = movingCars.get(vehicleEntity.getMarkerId());
            if (baiduMoveCarThread != null) {
                baiduMoveCarThread.stopMove();
                movingCars.remove(vehicleEntity.getMarkerId());
            }
        }
    }

    /**
     * 检车列表中是否包含当前监控对象
     *
     * @param vehicleT 当前监控对象位置信息实体
     * @return 是否有包含/存储过该监控对象
     */
    private boolean isContainsVehicle(VehicleEntity vehicleT) {
        Log.i(TAG, "===isContainsVehicle===");
        boolean flag = false;
        if (vehicleT == null) return false;
        if (listAllTemp.containsKey(vehicleT.getMarkerId())) flag = true;
        if (!flag) {
            vehicleEntityListAll.put(vehicleT.getMarkerId(), vehicleT);
            MyItem myItem = new MyItem(new LatLng(vehicleT.getLatitude().doubleValue(), vehicleT.getLongitude().doubleValue()));
            myItem.setMarkerId(vehicleT.getMarkerId());
            MonitorInfo monitorInfo = new MonitorInfo();
            monitorInfo.setMonitorId(vehicleT.getMarkerId());
            monitorInfo.setName(vehicleT.getTitle());
            monitorInfo.setStatus(vehicleT.getStatus());
            monitorInfo.setTime(vehicleT.getTime());
            myItem.setMonitorInfo(monitorInfo);

            mClusterManager.getmAlgorithm().addItem(myItem);
            listAllTemp.put(vehicleT.getMarkerId(), vehicleT);
        }
        return flag;
    }

    /**
     * 添加监控对象到列表中
     *
     * @param array 经纬度列表
     * @param size  列表数量
     */
    private void addVehicleEntity2List(ReadableArray array, int size) {
        Log.i(TAG, "===addVehicleEntity2List===");
        VehicleEntity vehicleEntity;
        for (int num = 0; num < size; num++) {
            if (array.isNull(num)) continue;
            vehicleEntity = VehicleEntity.fromReadableMap(array.getMap(num));
            if (vehicleEntity == null) continue;
            if (vehicleEntity.getLongitude() != null && vehicleEntity.getLatitude() != null) {
                vehicleEntityListAll.put(vehicleEntity.getMarkerId(), vehicleEntity);
            }
        }
    }

    /**
     * 地图模式
     *
     * @param type 1. 标准地图 2.卫星地图
     */
    @ReactProp(name = "bMapType", defaultInt = 1)
    public void setBMapType(TextureMapView mapView, int type) {
        Log.i(TAG, "===setBMapType===");
        if (type == 0) return;
        mapView.getMap().setMapType(type);
    }

    /**
     * 开启定位
     */
    @ReactProp(name = "locationManager")
    public void setLocationManager(TextureMapView mapView, boolean isEnabled) {
        Log.i(TAG, "===setLocationManager===" + isEnabled);
        mapView.getMap().setMyLocationEnabled(isEnabled);
        if (isEnabled) {
            // 定位权限判断
            boolean flag = CommonUtil.checkLocationPermission(mReactContext);
            if (!flag) {
                //定位权限发送到页面
                EventInitMethod.onLocation(mReactContext, mapView.getId());
                //定位成功或失败事件
                EventInitMethod.onLocationSuccess(mReactContext, mapView.getId(), "false");
                return;
            }
        }
        // 开启定位
        if (isEnabled) {
            Log.i(TAG, "开启监听");
            // 声明locationClient类
            //if (mLocationClient == null)
            mLocationClient = new LocationClient(context.getApplicationContext());

            // 配置定位参数
            CommonMapUtil.initLocationParam(mLocationClient);
            // 注册监听函数
            myListener = new MyLocationListener(mapView);
            mLocationClient.registerLocationListener(myListener);
            mLocationClient.start();
        } else {
            if (mLocationClient != null) {
                mLocationClient.stop();
                mLocationClient.unRegisterLocationListener(myListener);
            }
        }
        // 首次初始化 isEnabled 默认值为false
        if (focusListenerService != null) {
            focusListenerService.stopFocus();
        }
    }

    /**
     * 当前是否是主页
     */
    @ReactProp(name = "isHome")
    public void setIsHome(final TextureMapView mapView, boolean flag) {
        Log.i(TAG, "===setIsHome===" + flag);
        if (flag) currentView = 0;
    }

    /**
     * 聚合最大数限制
     */
    @ReactProp(name = "aggrNum")
    public void serAgrNum(final TextureMapView mapView, Integer aggrNum) {
        Log.i(TAG, "===serAgrNum===聚合最大数限制:" + aggrNum);
        if (aggrNum == null || aggrNum == 0) return;
        mClusterManager.setAggrNum(aggrNum);
    }

    /**
     * 实时路况
     *
     * @param isEnabled true:开启 false:关闭
     */
    @ReactProp(name = "trafficEnabled")
    public void setTrafficEnabled(TextureMapView mapView, boolean isEnabled) {
        Log.i(TAG, "===setTrafficEnabled:实时路况:" + isEnabled);
        mapView.getMap().setTrafficEnabled(isEnabled);
    }


    /**
     * 监控对象切换
     *
     * @param marketId 监控对象id
     */
    @ReactProp(name = "centerPoint")
    public void setCenterPoint(final TextureMapView mapView, String marketId) {
        Log.i(TAG, "===setCenterPoint：切换监控对象:" + marketId);
        final BaiduMap map = mapView.getMap();
        currentZoomSize = 19;
        if (vehicleEntityListAll.size() == 0) {
            try {
                Thread.sleep(500);
            } catch (InterruptedException ignore) {
            }
        }
        if (marketId != null && !"".equals(marketId)) {
            if (vehicleEntityListAll.containsKey(marketId)) {
                VehicleEntity vehicleEntity = vehicleEntityListAll.get(marketId);
                LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
                if (vehicleEntity.getLongitude().toString().equals("1000") || vehicleEntity.getLatitude().toString().equals("1000")) {
                    CommonMapUtil.resetLocation(map, mReactContext);
                    return;
                }
                if (!mClusterManager.getMarkerHashMap().isEmpty()) {
                    BaiduMoveCarThread baiduMoveCarThread = movingCars.get(marketId);
                    if (baiduMoveCarThread != null) {
                        baiduMoveCarThread.stopMove();
                        movingCars.remove(marketId);
                    }
                    List<Marker> markers = mClusterManager.getMarkerHashMap().get(marketId);
                    if (markers != null) {
                        for (Marker marker : markers) {
                            marker.remove();
                        }
                    }
                    mClusterManager.getMarkerHashMap().remove(marketId);
                }
                centreLatLng = latLng;
                mClusterManager.setMarkerId(marketId);
                mClusterManager.setCenterMarketId(marketId);
                mClusterManager.setActionStatus(1);
                if (latLng.longitude != 1000.0 && latLng.latitude != 1000.0) {
                    CommonMapUtil.localCenterPoint(map, latLng, currentZoomSize);
                }
            }
        }
        // 取消监控
        focusListenerService.stopFocus();
    }

    /**
     * 底部聚焦监控对象
     */
    @ReactProp(name = "monitorFocus")
    public void setMonitorFocus(final TextureMapView mapView, ReadableArray array) {
        Log.i(TAG, "===setMonitorFocus：底部聚焦监控对象:" + array);
        if (array == null || array.size() == 0 || array.isNull(0)) {
            return;
        }
        final BaiduMap map = mapView.getMap();
        String marketId = array.getMap(0).getString("monitorId");
        currentZoomSize = 19;
        focusListenerService.stopFocus();

        List<Marker> markers = null;
        //删除正在行走的车的移动线程
        if (mClusterManager.getMarkerHashMap().get(marketId) != null) {
            markers = mClusterManager.getMarkerHashMap().get(marketId);
            try {
                BaiduMoveCarThread baiduMoveCarThread = movingCars.get(marketId);
                if (baiduMoveCarThread != null) {
                    markers = baiduMoveCarThread.getMoveMarker();
                    baiduMoveCarThread.stopMove();
                    movingCars.remove(marketId);
                }
            } catch (Exception e) {
                Log.e(TAG, "===setMonitorFocusTrack: " + "单击车辆定位时终止移动线程异常", e);
            }
        }

        if (marketId != null && !"".equals(marketId)) {
            if (vehicleEntityListAll.containsKey(marketId)) {
                VehicleEntity vehicleEntity = vehicleEntityListAll.get(marketId);
                if (vehicleEntity.getLongitude().toString().equals("1000") || vehicleEntity.getLatitude().toString().equals("1000")) {
                    CommonMapUtil.resetLocation(map, mReactContext);
                    return;
                }
                LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
                centreLatLng = latLng;
                mClusterManager.setMarkerId(marketId);
                mClusterManager.setActionStatus(1);
                if (markers != null) {
                    for (Marker marker1 : markers) {
                        marker1.remove();
                    }
                }
                mClusterManager.getMarkerHashMap().remove(marketId);
                if (latLng.latitude != 1000.0 && latLng.longitude != 1000.0) {
                    CommonMapUtil.localCenterPoint(map, latLng, currentZoomSize);
                }
            }
        } else {
            // 从其它页面跳转回主页时，监控对象为空，恢复缩放等级至默认值
            MapStatus mapStatus = new MapStatus.Builder().zoom(currentZoomSize).build();
            map.setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));
        }

    }


    /**
     * 地图放大
     */
    @ReactProp(name = "mapAmplification")
    public void setMapAmplification(final TextureMapView mapView, ReadableArray array) {
        Log.i(TAG, "===setMapAmplification: " + "地图放大");
        final BaiduMap map = mapView.getMap();
        BigDecimal zoom = new BigDecimal(map.getMapStatus().zoom);
        if (new BigDecimal("4").compareTo(zoom) <= 0
                && new BigDecimal("21").compareTo(zoom) > 0) {
            currentZoomSize = zoom.floatValue() + 1;
            if (currentZoomSize > 21) currentZoomSize = 21;
            CommonMapUtil.locationCenter(map, map.getMapStatus().target, currentZoomSize);
            mClusterManager.setActionStatus(1);
        }
        Log.i(TAG, "当前屏幕缩放级别放大:" + currentZoomSize);
    }


    /**
     * 地图缩小
     */
    @ReactProp(name = "mapNarrow")
    public void setMapNarrow(final TextureMapView mapView, ReadableArray array) {
        Log.i(TAG, "===setMapNarrow" + "地图缩小");
        final BaiduMap map = mapView.getMap();
        BigDecimal zoom = new BigDecimal(map.getMapStatus().zoom);
        if (new BigDecimal("4").compareTo(zoom) < 0
                && new BigDecimal("21").compareTo(zoom) >= 0) {
            currentZoomSize = zoom.floatValue() - 1;
            if (currentZoomSize < 4) currentZoomSize = 4;
            CommonMapUtil.locationCenter(map, map.getMapStatus().target, currentZoomSize);
            mClusterManager.setActionStatus(1);
        }
        Log.i(TAG, "当前屏幕缩放级别缩小:" + currentZoomSize);
    }

    private final List<LatLng> wakeList = new ArrayList<>();

    public static HashMap<String, Object> wakeMap = new HashMap<>();

    /***
     * 实时尾迹
     */
    private LatLng wakeStartLatLng;
    private VehicleEntity wakeVehicleEntity;
    private final List<LatLng> wakeAll = new ArrayList<>();
    private String wakeDataMarkerId;
    private WakeDataMoveCarThread wakeDataMoveCarThread;
    private boolean isCompassInit = false;

    @ReactProp(name = "wakeData")
    public void setWakeData(final TextureMapView mapView, ReadableArray array) {
        Log.d("WakeDataMoveCarThread", "===setWakeData：实时尾迹：" + array);
        final BaiduMap map = mapView.getMap();
        if (array == null || array.size() == 0 || array.isNull(0)) {
            Log.d(TAG, "实时尾迹参数为空");
            setInitWakeCurrentLocation(map);
            return;
        }
        if (!isCompassInit) {
            int screenWidth = ScreenUtils.getScreenWidth();
            int screenHeight = ScreenUtils.getScreenHeight();
            Point defaultPoint = new Point(screenWidth / 10, screenHeight / 10);
            CommonMapUtil.initCompassLocation(map, defaultPoint);
            isCompassInit = true;
        }

        mClusterManager.setCurrentView(2);
        final VehicleEntity vehicleEntity = VehicleEntity.fromHashMap(array.getMap(0).toHashMap());
        if (vehicleEntity == null) return;
        wakeVehicleEntity = VehicleEntity.fromVehicleEntity(vehicleEntity);
        final LatLng latLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());
        if (wakeDataMarkerId != null && wakeDataMarkerId.equals(wakeVehicleEntity.getMarkerId()) && wakeMap.containsKey("textMarker")) {
            // 平滑移动
            wakeList.add(latLng);
            wakeAll.add(latLng);
            wakeDataMoveLoop(wakeList, map, wakeMap);
        } else {
            wakeDataMarkerId = null;
            wakeStartLatLng = null;
            wakeAll.clear();
            wakeList.clear();
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setIsRunning(false);
                wakeDataMoveCarThread.interrupt();
                wakeDataMoveCarThread = null;
            }
            map.clear();
            wakeStartLatLng = new LatLng(wakeVehicleEntity.getLatitude().doubleValue(), wakeVehicleEntity.getLongitude().doubleValue());
            Glide.with(mReactContext)
                    .load(vehicleEntity.getIco())
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            wakeList.add(latLng);
                            wakeAll.add(latLng);
                            MarkerOptions[] markerOptions = makeMarkerOptions(mReactContext, resource, vehicleEntity, latLng);
                            int angle = vehicleEntity.getAngle();
                            if (angle < 0) {
                                angle = 360 + angle;
                            }
                            RotateAnimation rotateAnimation = new RotateAnimation(angle, angle + ClusterManager.mapstatusRotate);
                            rotateAnimation.setDuration(5);
                            rotateAnimation.setRepeatCount(0);
                            rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
                            Marker textMarker = (Marker) map.addOverlay(markerOptions[0]);
                            Marker carMarker = (Marker) map.addOverlay(markerOptions[1]);
                            Bundle bundle = new Bundle();
                            bundle.putInt("wakeDataAngle", vehicleEntity.getAngle());
                            carMarker.setExtraInfo(bundle);
                            carMarker.setAnimation(rotateAnimation);
                            carMarker.startAnimation();
                            textMarker.setToTop();
                            carMarker.setToTop();
                            wakeMap.put("textMarker", textMarker);
                            wakeMap.put("carMarker", carMarker);
                        }
                    });
            wakeDataMarkerId = wakeVehicleEntity.getMarkerId();
            MarkerOptions draggable = new MarkerOptions().icon(CommonUtil.createStartIco()).position(latLng);
            Marker overlay = (Marker) map.addOverlay(draggable);
            wakeMap.put("overlay", overlay);
            CommonMapUtil.localCenterPoint(map, latLng, 19);
        }
    }

    private MarkerOptions[] makeMarkerOptions(final ReactContext context, final Bitmap icon, final VehicleEntity entity, final LatLng point) {
        MarkerOptions[] markers = new MarkerOptions[2];
        View textLayout = View.inflate(context, R.layout.vehicle_icon_test, null);
        Button textBtn = textLayout.findViewById(R.id.onButton);
        TextView textView = textLayout.findViewById(R.id.onTextView);
        GradientDrawable background = (GradientDrawable) textBtn.getBackground();
        background.setColor(CommonUtil.statusToColour(entity.getStatus()));
        textView.setText(entity.getTitle());
        textView.getPaint().setFakeBoldText(true);
        // 设置车辆
        // 设置车辆的偏转方向
        View vehicleLayout = View.inflate(context, R.layout.vehicle_icon, null);
        BitmapDescriptor textImg = BitmapDescriptorFactory.fromView(textLayout);
        BitmapDescriptor bitMap = CommonUtil.getBitMapV2(textImg);
        final ImageView vehicleIcon = vehicleLayout.findViewById(R.id.imgTest);
        vehicleIcon.setImageBitmap(icon);
        BitmapDescriptor carImg = BitmapDescriptorFactory.fromView(vehicleLayout);
        markers[0] = new MarkerOptions().icon(bitMap).position(point);
        markers[1] = new MarkerOptions().icon(carImg).position(point).anchor(0.5f, 0.5f);
        return markers;
    }


    /**
     * 初始数据
     */
    public void setInitWakeCurrentLocation(BaiduMap map) {
        Log.i(TAG, "===实时尾迹后台切换后初始化地图:------------");
        for (Map.Entry<String, Object> next : wakeMap.entrySet()) {
            ((Marker) next.getValue()).remove();
        }
        wakeMap.clear();

        wakeDataMarkerId = null;
        wakeStartLatLng = null;
        wakeAll.clear();
        wakeList.clear();
        if (wakeDataMoveCarThread != null) {
            wakeDataMoveCarThread.interrupt();
            wakeDataMoveCarThread = null;
        }
        map.clear();
    }

    /**
     * 初始数据
     */
    @ReactProp(name = "wakeCurrentLocation")
    public void setWakeCurrentLocation(final TextureMapView mapView, boolean flag) {
        Log.i(TAG, "===setWakeCurrentLocation：初始数据:" + flag);
        final BaiduMap map = mapView.getMap();
        if (flag) {
            LatLng latLng = wakeStartLatLng;
            // 表示定位到起点
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(false);
            }
            CommonMapUtil.locationCenter(map, latLng, 19);
        } else {
            // 适应屏幕
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(false);
            }
            zoomToSpan(map);
        }
    }

    /**
     * 实时尾迹移动
     *
     * @param wakeList 最新两点经纬度
     * @param map      地图组件
     * @param wakeMap  marker存储器
     */
    private void wakeDataMoveLoop(List<LatLng> wakeList, BaiduMap map, HashMap<String, Object> wakeMap) {
        if (wakeDataMoveCarThread == null) {
            wakeDataMoveCarThread = new WakeDataMoveCarThread(wakeList, map, wakeMap);
            wakeDataMoveCarThread.start();
        } else {
            //wakeDataMoveCarThread.clearLastAnimAndDrawLine();
            wakeDataMoveCarThread.setNewData(wakeList);
        }
    }

    /**
     * 实时位置
     */
    @ReactProp(name = "wakeTargetLocation")
    public void setWakeTargetLocation(final TextureMapView mapView, boolean flag) {
        Log.i(TAG, "===wakeTargetLocation：实时位置:" + flag);
        final BaiduMap map = mapView.getMap();
        if (flag) {
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(true);
            }
            if (wakeVehicleEntity != null) {
                LatLng latLng = new LatLng(wakeVehicleEntity.getLatitude().doubleValue(), wakeVehicleEntity.getLongitude().doubleValue());
                CommonMapUtil.locationCenter(map, latLng, 19);
            }
        } else {
            if (wakeDataMoveCarThread != null) {
                wakeDataMoveCarThread.setMapFlag(false);
            }
            zoomToSpan(map);
        }
    }

    private LatLng targetLatLng;

    public static Marker activeMarker;

    @ReactProp(name = "routePlan")
    public void setRoutePlan(final TextureMapView mapView, ReadableArray array) {
        Log.i(TAG, "===setRoutePlan：实时追踪:" + array);
        if (array == null || array.size() == 0) return;
        final BaiduMap map = mapView.getMap();
        int screenWidth = ScreenUtils.getScreenWidth();
        int screenHeight = ScreenUtils.getScreenHeight();
        Point defaultPoint = new Point(screenWidth / 10, screenHeight / 10);
        CommonMapUtil.initCompassLocation(map, defaultPoint);

        currentView = 3;
        mClusterManager.setCurrentView(currentView);
        map.clear();
        //绘制终点
        final VehicleEntity vehicleEntity = VehicleEntity.fromReadableMap(array.getMap(0));
        if (vehicleEntity == null) {
            return;
        }
        final LatLng endLatLng = new LatLng(vehicleEntity.getLatitude().setScale(6, BigDecimal.ROUND_HALF_UP).doubleValue(), vehicleEntity.getLongitude().setScale(6, BigDecimal.ROUND_HALF_UP).doubleValue());
        targetLatLng = endLatLng;
        NavigationModule.dealEndLatLng(endLatLng);
        makerCarRoutePlan(mapView, locationLatLng, endLatLng);
        Glide.with(mReactContext)
                .load(vehicleEntity.getIco())
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        MarkerOptions[] markerOptions = makeMarkerOptions(mReactContext, resource, vehicleEntity, endLatLng);
                        Marker textMarker = (Marker) map.addOverlay(markerOptions[0]);
                        activeMarker = (Marker) map.addOverlay(markerOptions[1]);
                        Bundle bundle = new Bundle();
                        bundle.putInt("routePlanAngle", vehicleEntity.getAngle() == null ? 0 : vehicleEntity.getAngle());
                        activeMarker.setExtraInfo(bundle);
                        CommonUtil.routeCarMarker(activeMarker, vehicleEntity.getAngle());
                        textMarker.setToTop();
                        textMarker.setZIndex(10);
                    }
                });
        mapGeoCoder.reversePoint(mapView.getId(), locationLatLng);
    }

    /**
     * 实时追踪页面高度调整
     */
    @ReactProp(name = "trackPolyLineSpan")
    public void setTrackPolyLineSpan(final TextureMapView mapView, final float footerHeight) {
        Log.i(TAG, "===setTrackPolyLineSpan:实时追踪页面高度调整:" + footerHeight);
        if (footerHeight == 0) return;
        BaiduMapVariable.footerHeight = footerHeight;
        int screenWidth = ScreenUtils.getScreenWidth();
        int mapHeight = ScreenUtils.getScreenHeight() - (int) footerHeight;
        // 移动中心点
        MapStatus mapStatus = new MapStatus.Builder()
                .targetScreen(new Point(screenWidth / 2, mapHeight / 2 - (int) footerHeight / 2))
                .build();
        final BaiduMap map = mapView.getMap();
        map.setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));
        MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(BaiduMapVariable.builder.build(), ScreenUtils.getScreenWidth(), mapHeight);
        map.animateMapStatus(mapStatusUpdate);
        mapzoomSpanHis(map);
    }

    /**
     * 第一下定位到起始位置 第二下适屏
     */
    @ReactProp(name = "trackCurrentLocation")
    public void setTrackCurrentLocation(final TextureMapView mapView, final Boolean flag) {
        Log.i(TAG, "===setTrackCurrentLocation:定位到起始位置:" + flag);
        if (flag == null) return;
        final BaiduMap map = mapView.getMap();
        if (flag) {
            CommonMapUtil.locationCenter(map, locationLatLng, 19);
        } else {
            CommonMapUtil.adaptScreen(map);
            mapzoomSpanHis(map);
        }
    }

    /**
     * 定位到终点位置
     */
    @ReactProp(name = "trackTargetLocation")
    public void setTrackTargetLocation(final TextureMapView mapView, final Boolean flag) {
        Log.i(TAG, "===setTrackTargetLocation:定位到终点位置:" + flag);
        if (flag == null) return;
        final BaiduMap map = mapView.getMap();
        if (flag) {
            CommonMapUtil.locationCenter(map, targetLatLng, 19);
        } else {
            CommonMapUtil.adaptScreen(map);
            mapzoomSpanHis(map);
        }
    }

    /**
     * 公交路线规划方案
     */
    private void makerCarRoutePlan(TextureMapView mapView, LatLng startLatLng, LatLng endLatLng) {
        if (routePlanSearch == null) {
            routePlanSearch = RoutePlanSearch.newInstance();
        }
        listener.setMapView(mapView);
        routePlanSearch.setOnGetRoutePlanResultListener(listener);
        PlanNode startNode = PlanNode.withLocation(startLatLng);

        PlanNode endNode = PlanNode.withLocation(endLatLng);
        routePlanSearch.drivingSearch((new DrivingRoutePlanOption()).from(startNode).to(endNode));
    }

    /**
     * 轨迹回放
     */
    private final List<LatLng> sportList = new ArrayList<>();

    @ReactProp(name = "sportPath")
    public void setSportPath(final TextureMapView mapView, ReadableArray array) {
        final BaiduMap map = mapView.getMap();
        if (array == null || array.size() == 0) {
            this.sportList.clear();
            map.clear();
            return;
        }

        map.setCompassEnable(true);
        int screenWidth = ScreenUtils.getScreenWidth();
        int screenHeight = ScreenUtils.getScreenHeight();
        Point defaultPoint = new Point(screenWidth / 10, screenHeight / 10);
        CommonMapUtil.initCompassLocation(map, defaultPoint);

        this.sportList.clear();
        mClusterManager.setCurrentView(1);
        ArrayList<VehicleEntity> vehicleList = new ArrayList<>();
        VehicleEntity vehicleEntity;
        int sportIndex = 0;
        try {
            sportIndex = Integer.parseInt(array.getMap(0).getString("sportIndex"));
        } catch (Exception ignored) {
            ignored.printStackTrace();
        }

        for (int num = 0; num < array.size(); num++) {
            if (array.isNull(num)) {
                continue;
            }
            vehicleEntity = VehicleEntity.fromHashMap(array.getMap(num).toHashMap());
            vehicleList.add(vehicleEntity);
        }

        List<BitmapDescriptor> textureList = new ArrayList<>();
        textureList.add(BitmapDescriptorFactory.fromAsset("icon_road_yellow_arrow.png"));
        textureList.add(BitmapDescriptorFactory.fromAsset("icon_road_green_arrow.png"));
        textureList.add(BitmapDescriptorFactory.fromAsset("icon_road_purple_arrow.png"));

        List<Integer> textureIndexs = new ArrayList<>();
        List<LatLng> latLngs = new ArrayList<>();

        //List<LatLng> latLngAll = new ArrayList<>();
        List<DecLatLng> latLngAll = new ArrayList<>();
        List<LatLng> latLngList = new ArrayList<>();

        /**
         * 判断轨迹回放的点的经纬度是否一样
         * 若一样，地图层级放大到18
         */
        boolean isSame = true;
        LatLng point = null;

        int size = vehicleList.size();
        for (int i = 0; i < size; i++) {
            VehicleEntity vty = vehicleList.get(i);
            DecLatLng decLatLng = new DecLatLng();
            if (point != null && point.latitude != vty.getLatitude().doubleValue() && point.longitude != vty.getLongitude().doubleValue()) {
                isSame = false;
            } else {
                point = new LatLng(vty.getLatitude().doubleValue(), vty.getLongitude().doubleValue());
            }
            LatLng latLng = new LatLng(vty.getLatitude().doubleValue(), vty.getLongitude().doubleValue());
            decLatLng.setSpeed(vty.getSpeed());
            decLatLng.setLatLng(latLng);

            //latLngAll.add(latLng);
            latLngAll.add(decLatLng);
            latLngList.add(latLng);

            if (i > 0 && checkAddress(vty, vehicleList.get(i - 1))) {
                continue;
            }
            try {
                latLngs.add(latLng);
                if (vty.getSpeed() < historyLine[0]) {
                    textureIndexs.add(0);
                } else if (vty.getSpeed() >= historyLine[1]) {
                    textureIndexs.add(2);
                } else {
                    textureIndexs.add(1);
                }

            } catch (Exception e) {
                Log.e(TAG, "setSportPath2: " + e);
            }
        }
        if (size < 2) {
            latLngs.add(latLngs.get(0));
        } else {
            //移除第一个点的，线段比位置点少一个
//            if (!textureIndexs.isEmpty()) {
//                textureIndexs.remove(0);
//            }
        }
        // 存放历史轨迹
        historyMap.put("markerList", latLngAll);
        // 存放对应轨迹索引
        historyMap.put("markerIndex", 0);
        //超过两个点时才画轨迹图
        if (latLngs.size() > 2) {
            PolylineOptions options = new PolylineOptions();
            options.dottedLine(true)
                    .points(latLngs)
                    .customTextureList(textureList)
                    .textureIndex(textureIndexs);
            //开启轨迹线粗细设置开关
            options.width(trajectoryType ? trajectoryValue * 4 : 20);
            Polyline polyline = (Polyline) map.addOverlay(options);
            historyMap.put("polyline", polyline);
        }
        mClusterManager.setMapView(mapView);
        // 起点             // 终点
        final VehicleEntity vehicleStart = vehicleList.get(0);
        final LatLng startLng = new LatLng(vehicleStart.getLatitude().doubleValue(), vehicleStart.getLongitude().doubleValue());
        final LatLng carLng = new LatLng(vehicleList.get(sportIndex).getLatitude().doubleValue(), vehicleList.get(sportIndex).getLongitude().doubleValue());
        final Integer angle = vehicleList.get(sportIndex).getAngle();
        MarkerOptions startOptions = new MarkerOptions().position(startLng).icon(CommonUtil.createStartIco());
        map.addOverlay(startOptions);
        final View vehicleLayout = View.inflate(context, R.layout.vehicle_icon, null);
        final ImageView vehicleIcon = vehicleLayout.findViewById(R.id.imgTest);
        historyMap.put("num", sportIndex);
        Glide.with(mReactContext)
                .load(vehicleStart.getIco())
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        vehicleIcon.setImageBitmap(resource);
                        historyMap.put("imgView", vehicleIcon);
                        BitmapDescriptor mapDesc = BitmapDescriptorFactory.fromView(vehicleLayout);
                        MarkerOptions vehicle = new MarkerOptions().position(carLng).icon(mapDesc).anchor(0.5f, 0.5f);
                        Marker newMarker = (Marker) map.addOverlay(vehicle);
                        historyMap.put("newMarker", newMarker);
                        Bundle bundle = new Bundle();
                        bundle.putInt("historyAngle", angle == null ? 0 : angle);
                        newMarker.setExtraInfo(bundle);
                        newMarker.setRotate(angle == null ? 0 : angle);
                        if (historyMoveCarThread != null && !Thread.State.TERMINATED.equals(historyMoveCarThread.getState())) {
                            historyMoveCarThread.interrupt();
                        }
                    }

                });
        VehicleEntity vehicleEnd = vehicleList.get(size - 1);
        LatLng endLng = new LatLng(vehicleEnd.getLatitude().doubleValue(), vehicleEnd.getLongitude().doubleValue());
        MarkerOptions endOptions = new MarkerOptions().position(endLng).icon(CommonUtil.createEndIco());
        map.addOverlay(endOptions);
        //sportList.addAll(latLngAll);
        sportList.addAll(latLngList);
        if (vehicleList.get(0).getIsVideoPlayback() != null) {
            videoPlaybackZoomSpanHis(mapView, sportList);
        } else {
            zoomSpanHis(mapView, sportList, heightLength == null ? "200" : heightLength);
        }
        //if (isSame) {
        CommonMapUtil.locationCenter(mapView.getMap(), point, 19);
        //}
    }


    private boolean checkAddress(VehicleEntity v1, VehicleEntity v2) {
        return v1.getLatitude().doubleValue() == v2.getLatitude().doubleValue() && v1.getLongitude().doubleValue() == v2.getLongitude().doubleValue();
    }


    @ReactProp(name = "speedPiecewise")
    public void speedPiecewise(final TextureMapView mapView, ReadableArray array) {
        Log.e(TAG, "===speedPiecewise：轨迹回放线路颜色数据" + array);
        if (array == null) {
            return;
        }
        JSONArray re = JSON.parseArray(array.toString());
        for (int num = 0; num < re.size(); num++) {
            historyLine[num] = re.getInteger(num);
        }

    }

    /**
     * 停止点
     */
    @ReactProp(name = "stopPoints")
    public void setParkOptions(final TextureMapView mapView, ReadableArray array) {
        Log.e(TAG, "===setParkOptions:停止点数据" + array);
        if (array == null) {
            return;
        }
        BaiduMap map = mapView.getMap();
        map.clear();
        for (int i = 0, n = historyPark.size(); i < n; i++) {
            Marker marker = historyPark.get(i);
            marker.remove();
        }
        MarkerOptions markerOptions1;
        JSONArray re = JSON.parseArray(array.toString());
        VehicleParkEntity vehicleParkEntity = new VehicleParkEntity();
        for (int num = 0; num < re.size(); num++) {
            if (array.isNull(num)) {
                continue;
            }
            JSONObject startLocation = JSONObject.parseObject(re.getString(num)).getJSONObject("startLocation");
            double latitude = Double.parseDouble(startLocation.getString("latitude"));
            double longitude = Double.parseDouble(startLocation.getString("longitude"));
            LatLng latLng = new LatLng(latitude, longitude);
            markerOptions1 = new MarkerOptions().position(latLng).icon(CommonUtil.createParkIco(context)).anchor(0.5f, 0.5f);
            Bundle bundle = new Bundle();
            vehicleParkEntity.setLatitude(latitude);
            vehicleParkEntity.setLongitude(longitude);
            vehicleParkEntity.setNumber(num);
            bundle.putCharSequence("vehicleParkEntity", JSONObject.toJSONString(vehicleParkEntity));
            markerOptions1.extraInfo(bundle);
            Marker marker = (Marker) map.addOverlay(markerOptions1);
            marker.setToTop();
            historyPark.put(num, marker);
        }
    }

    /**
     * 下一个停止点
     */
    @ReactProp(name = "stopIndex")
    public void stopIndex(final TextureMapView mapView, Integer index) {
        Log.e(TAG, "===stopIndex:停止点序号" + index);
        if (index == null) {
            return;
        }
        //index为-1将选中的点还原
        if (index < 0) {
            Marker oldMarker = historyPark.get(BaiduMapViewManager.parkIndex);
            if (oldMarker != null) {
                oldMarker.setIcon(CommonUtil.createParkIco(context));
            }
            return;
        }

        Marker marker = historyPark.get(index);
        Bundle extraInfo = marker == null ? null : marker.getExtraInfo();
        if (extraInfo == null) {
            return;
        }
        String vehicleParkEntity = extraInfo.getString("vehicleParkEntity");
        if (vehicleParkEntity != null && !vehicleParkEntity.equals("")) {
            Log.e("vehicleParkEntity", vehicleParkEntity);
            Marker oldMarker = historyPark.get(BaiduMapViewManager.parkIndex);
            if (oldMarker != null) {
                oldMarker.setIcon(CommonUtil.createParkIco(mReactContext));
            }
            marker.setIcon(CommonUtil.createCheckParkIco(mReactContext));
            marker.setToTop();
            VehicleParkEntity entity = JSON.parseObject(vehicleParkEntity, VehicleParkEntity.class);
            mapGeoCoder.reverseStopPoint(mapView.getId(), entity.getLatitude(), entity.getLongitude(), entity.getNumber());
        }
    }


    private void zoomSpanHis(TextureMapView mapView, List<LatLng> list, String heightLength) {
        Log.e(TAG, "===zoomSpanHis: " + list.size() + heightLength);
        if (list.isEmpty()) {
            return;
        }
        LatLngBounds.Builder builder = new LatLngBounds.Builder();
        int allHeight = ScreenUtils.getScreenHeight();
        for (LatLng latLng : list) {
            // polyline 中的点可能太多，只按marker 缩放
            builder.include(latLng);
        }
        int bottomPadding = Double.valueOf(heightLength).intValue();
        int bottomPaddingPx = SizeUtils.dp2px(bottomPadding + 50);
        int screenWidth = ScreenUtils.getScreenWidth();
        LatLngBounds bounds = builder.build();

        int headerHeight = SizeUtils.dp2px(50);

        int mapHeight = allHeight - bottomPaddingPx - headerHeight;

        // 移动中心点
        MapStatus mapStatus = new MapStatus.Builder()
                .targetScreen(new Point(screenWidth / 2, mapHeight / 2))
                .build();
        final BaiduMap map = mapView.getMap();
        map.setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));

        // 屏幕自动适配
        MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(bounds, screenWidth, mapHeight);
        map.animateMapStatus(mapStatusUpdate);
        mapzoomSpanHis(map);
    }

    private void videoPlaybackZoomSpanHis(TextureMapView mapView, List<LatLng> list) {
        if (list.isEmpty()) {
            return;
        }
        LatLngBounds.Builder builder = new LatLngBounds.Builder();
        for (LatLng latLng : list) {
            // polyline 中的点可能太多，只按marker 缩放
            builder.include(latLng);
        }
        int screenWidth = mapView.getWidth();
        int mapHeight = mapView.getHeight();
        LatLngBounds bounds = builder.build();

        // 移动中心点
        MapStatus mapStatus = new MapStatus.Builder()
                .targetScreen(new Point(screenWidth / 2, mapHeight / 2 + 60))
                .build();
        final BaiduMap map = mapView.getMap();
        map.setMapStatus(MapStatusUpdateFactory.newMapStatus(mapStatus));

        // 屏幕自动适配
        MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(bounds, screenWidth, mapHeight - 70);
        map.animateMapStatus(mapStatusUpdate);
        mapzoomSpanHis(map);
    }

    //将适屏后的屏幕再缩小一号层级
    public static void mapzoomSpanHis(BaiduMap map) {
        try {
            float zoom = map.getMapStatus().zoom;
            if (zoom < 21) {
                MapStatus mMapStatus = new MapStatus.Builder()
                        .zoom(zoom - 1)
                        .build();
                //定义MapStatusUpdate对象，以便描述地图状态将要发生的变化
                MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(mMapStatus);
                map.animateMapStatus(mMapStatusUpdate);
            }
        } catch (Exception e) {
            Log.i(TAG, "mapzoomSpanHis: " + "适屏异常" + e);
        }
    }

    /**
     * 逆地址
     */
    @ReactProp(name = "searchAddress")
    public void setSearchAddress(final TextureMapView mapView, ReadableArray array) {
        //Log.i(HTAG, "===setSearchAddress:逆地址:" + array);
        if (array == null || array.size() == 0 || array.isNull(0)) {
            return;
        }
        ReadableMap map = array.getMap(0);
        LatLng latLng = new LatLng(map.getDouble("latitude"), map.getDouble("longitude"));
        mapGeoCoder.reversePoint(mapView.getId(), latLng);
    }

    /**
     * 音视频监控 地图markers
     */
    public static HashMap<String, Object> histMap = new HashMap<>();

    /**
     * 音视频监控
     */
    private VideoMoveCarThread videoMoveCarThread;
    private boolean vedioFlag = true;

    @ReactProp(name = "videoMarker")
    public void setVideoMarker(final TextureMapView mapView, final ReadableArray array) {
        Log.i(TAG, "===setVideoMarker：音视频marker");
        if (array == null || array.size() == 0 || array.isNull(0)) {
            Log.i(TAG, "音视频监控参数错误");
            return;
        }
        final BaiduMap map = mapView.getMap();
        Log.e(TAG, "setVideoMarker: " + array);
        mClusterManager.setCurrentView(3);
        final VehicleEntity vcEntitys = VehicleEntity.fromHashMap(array.getMap(0).toHashMap());
        if (vcEntitys == null) {
            return;
        }
        final LatLng latLng = new LatLng(vcEntitys.getLatitude().doubleValue(), vcEntitys.getLongitude().doubleValue());
        Log.i(TAG, "Glide加载:" + JSON.toJSONString(vcEntitys));
        if (vedioFlag) {
            vedioFlag = false;
            Glide.with(mReactContext)
                    .load(vcEntitys.getIco())
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            MarkerOptions[] markerOptions = makeMarkerOptions(mReactContext, resource, vcEntitys, latLng);
                            Marker textMarker = (Marker) map.addOverlay(markerOptions[0]);
                            Marker carMarker = (Marker) map.addOverlay(markerOptions[1]);
                            Bundle bundle = new Bundle();
                            int angle = vcEntitys.getAngle() == null ? 0 : vcEntitys.getAngle();
                            bundle.putInt("videoAngle", angle);
                            carMarker.setExtraInfo(bundle);
                            CommonUtil.routeCarMarker(carMarker, (int) (angle + ClusterManager.mapstatusRotate));
                            histMap.put("carMarker", carMarker);
                            histMap.put("textMarker", textMarker);
                            if (videoMoveCarThread == null) {
                                videoMoveCarThread = new VideoMoveCarThread(map, carMarker, textMarker);
                            }
                        }
                    });
            CommonMapUtil.locationCenter(map, latLng, 15);
        } else {
            videoMoveLoop(latLng);
        }
    }

    private void videoMoveLoop(LatLng point) {
        if (videoMoveCarThread == null) {
            return;
        }
        videoMoveCarThread.addPoint(point);
    }

    private final String HTAG = "HistoryMoveCarThread";

    /**
     * 设置轨迹回放播放速度
     */
    @ReactProp(name = "sportSpeed")
    public void setSportSpeed(final TextureMapView mapView, double speed) {
        Log.i(HTAG, "===sportSpeed:设置轨迹回放播放速度" + speed);
        historyMap.put("sportSpeed", speed);
        if (historyMoveCarThread != null) {
            historyMoveCarThread.setPlaySpeed(speed);
        }
    }

    /**
     * 轨迹回放点击播放 0:准备播放 1:开始播放 2:播放暂停 3:播放完成
     */
    @SuppressWarnings("unchecked")
    @ReactProp(name = "sportPathPlay")
    public void setSportPathPlay(final TextureMapView mapView, final Boolean flag) {
        Log.i(HTAG, "===setSportPathPlay:轨迹回放点击播放 " + flag);
        // 点击播放
        if (flag) {
            Integer num = (Integer) historyMap.get("num");
            Marker newMarker = (Marker) historyMap.get("newMarker");
            double speed = (Double) historyMap.get("sportSpeed");
            //List<LatLng> markerList = (List<LatLng>) historyMap.get("markerList");
            List<DecLatLng> markerList = (List<DecLatLng>) historyMap.get("markerList");
            boolean isNewCreate = false;//是否新创建
            if (historyMoveCarThread == null) {
                isNewCreate = true;
                historyMoveCarThread = new HistoryMoveCarThread(newMarker, mapView.getMap());
            }
            historyMoveCarThread.setNewList(markerList);
            historyMoveCarThread.setPlaySpeed(speed);
            historyMoveCarThread.setIndex(num);
            historyMoveCarThread.setPathWith(trajectoryType ? trajectoryValue * 4 : 20);
            historyMoveCarThread.setShowChart(isShowChart);
            if (isNewCreate) {
                historyMoveCarThread.start();
            } else {
                historyMoveCarThread.setRunning(true);
            }
        } else {
            if (historyMoveCarThread != null) {
                historyMoveCarThread.setRunning(false);
            }
        }
    }

    /**
     * 运动轨迹调整 适配
     */
    private String heightLength;

    @ReactProp(name = "fitPolyLineSpan")
    public void setFitPolyLineSpan(final TextureMapView mapView, final String stirng) {
        Log.i(HTAG, "===fitPolyLineSpan:运动轨迹调整 适配" + stirng);
        if (stirng == null) {
            return;
        }
        String[] split = stirng.split("\\|");
        String height = split[0];
        String paus = split[2];
//        heightLength = height;
        if (height != null && !"".equals(height) && sportList.size() != 0) {
            if (heightLength == null || !heightLength.equals(height)) {
                heightLength = height;
                zoomSpanHis(mapView, sportList, heightLength);
            }
        }
    }

    /**
     * 轨迹回放跳点
     */
    @SuppressWarnings("unchecked")
    @ReactProp(name = "sportIndex")
    public void setSportIndex(final TextureMapView mapView, ReadableArray array) {
        //Log.i(HTAG, "===sportIndex:轨迹回放跳点" + array);
        if (array == null || array.size() == 0 || array.isNull(0)) {
            return;
        }
        ArrayList<Object> objects = array.toArrayList();
        JSONObject jsonObject = JSONObject.parseObject(JSON.toJSONString(objects.get(0)));
        // 开始位置
        int startIndex = Integer.parseInt(jsonObject.getString("index"));
        String flag = jsonObject.getString("flag");
        isShowChart = jsonObject.getBoolean("isShowChart");
        if (flag.equals("false")) {
            //Log.i(HTAG, "未播放");
            // 手动拖拽
            Marker newMarker = (Marker) historyMap.get("newMarker");
            //List<LatLng> markerList = (List<LatLng>) historyMap.get("markerList");
            List<DecLatLng> markerList = (List<DecLatLng>) historyMap.get("markerList");
            if (newMarker == null || markerList == null) {
                return;
            }
            LatLng latLng = null;
            LatLng latLng1 = null;
            try {
                //latLng = markerList.get(startIndex);
                //latLng1 = (startIndex + 1) < markerList.size() ? markerList.get(startIndex + 1) : null;
                latLng = markerList.get(startIndex).getLatLng();
                latLng1 = (startIndex + 1) < markerList.size() ? markerList.get(startIndex + 1).getLatLng() : null;
            } catch (Exception e) {
                Log.e(TAG, startIndex + " ------ " + markerList.size() + "  -------" + array);
            }
            if (latLng1 != null) {
                newMarker.setRotate((float) getAngle(latLng, latLng1) + ClusterManager.mapstatusRotate);
            }
            BaiduMap mBaiduMap = mapView.getMap();
            if (latLng != null) {
//                newMarker.setPosition(latLng);
                if (historyMoveCarThread != null) {
                    if (options.size() != 0) mBaiduMap.removeOverLays(options);
                    historyMoveCarThread.onProgressBarDrag(startIndex);
                } else {//未播放的时候滑动进度条
                    newMarker.setPosition(latLng);
                    hisLatLngs.clear();
                    mBaiduMap.removeOverLays(options);
                    for (int i = 0; i <= startIndex; i++) {
                        hisLatLngs.add(markerList.get(i).getLatLng());
                    }
                    if (hisLatLngs.size() > 1) {
                        //设置折线的属性
                        OverlayOptions mOverlayOptions = new PolylineOptions()
                                .width(10)
                                .color(0x800000FF)
                                .points(hisLatLngs);
                        Overlay overlay = mBaiduMap.addOverlay(mOverlayOptions);
                        options.add(overlay);
                    }
                }
            }
            historyMap.put("newMarker", newMarker);
            historyMap.put("num", startIndex);
        }

    }

    /**
     * 已经走过的经纬度点集合
     */
    private List<LatLng> hisLatLngs = new ArrayList<>();
    /**
     * 已经绘制的overLay集合
     */
    private List<Overlay> options = new ArrayList<>();

    /**
     * 打开关闭罗盘
     */
    @ReactProp(name = "compassOpenState")
    public void isOpenCompass(TextureMapView mapView, boolean flag) {
        Log.e(TAG, "===isOpenCompass: " + flag);
        mapView.getMap().setCompassEnable(flag);
    }

    /**
     * 比例尺信息
     */
    @ReactProp(name = "baiduMapScalePosition")
    public void setBaiduMapScalePosition(TextureMapView mapView, final String scale) {
    }

    /**
     * 点名下发功能
     */
    @ReactProp(name = "latestLocation")
    public void setLatestLocation(final TextureMapView mapView, ReadableMap readableMap) {
        Log.i(TAG, "===点名下发功能:" + readableMap);
        if (readableMap == null) {
            return;
        }
        VehicleEntity vehi = JSON.parseObject(JSON.toJSONString(readableMap.toHashMap()), VehicleEntity.class);
        if (vehi.getMarkerId() == null || "".equals(vehi.getMarkerId())) {
            return;
        }
        LatLng latLng;
        if (vehicleEntityListAll.containsKey(vehi.getMarkerId())) {
            latLng = new LatLng(vehi.getLatitude().doubleValue(), vehi.getLongitude().doubleValue());
            centreLatLng = latLng;
            if (!mClusterManager.getMarkerHashMap().isEmpty()) {
                BaiduMoveCarThread baiduMoveCarThread = movingCars.get(vehi.getMarkerId());
                List<Marker> markers;
                if (baiduMoveCarThread != null) {
                    markers = baiduMoveCarThread.getMoveMarker();
                    baiduMoveCarThread.stopMove();
                    movingCars.remove(vehi.getMarkerId());
                } else {
                    markers = mClusterManager.getMarkerHashMap().get(vehi.getMarkerId());
                }
                if (markers != null) {
                    for (Marker marker : markers) {
                        marker.setPosition(latLng);
                    }
                }
            }
            mClusterManager.setActionStatus(1);
            CommonMapUtil.locationCenter(mapView.getMap(), latLng, currentZoomSize);
        }
    }


    /**
     * 聚焦功能
     *
     * @param mapView 地图view
     */
    @ReactProp(name = "monitorFocusTrack")
    public void setMonitorFocusTrack(final TextureMapView mapView, String string) {
        Log.i("===monitorFocusTrack", string + "");
        if (null == string) {
            return;
        }
        final BaiduMap map = mapView.getMap();
        String[] split = string.split("\\|");
        String markerId = split[0];
        //isFocus = true;
        Marker marker = getMarker(markerId);
        if (marker == null) {
            currentZoomSize = 19;
            if (vehicleEntityListAll.containsKey(markerId)) {
                VehicleEntity vehicleEntity = vehicleEntityListAll.get(markerId);
                BigDecimal lat = vehicleEntity.getLatitude();
                BigDecimal lon = vehicleEntity.getLongitude();
                if (lat.toString().equals("1000") || lon.toString().equals("1000")) {
                    if ("true".equals(split[1])) {
                        mClusterManager.startFocusListenerService(true);
                    }
                    return;
                }
                LatLng latLng = new LatLng(lat.doubleValue(), lon.doubleValue());
                //centreLatLng = latLng;
                mClusterManager.setMarkerId(markerId);
                mClusterManager.setActionStatus(1);
                mClusterManager.setFocusMarkerIdV2(markerId);
                if ("true".equals(split[1])) {
                    mClusterManager.startFocusListenerService(true);
                }
                CommonMapUtil.localCenterPoint(map, latLng, 19);
            }
            return;
        }

        focusListenerService.setMarker(marker);
        focusListenerService.setPoint(CommonMapUtil.getScreenPoint());
        focusListenerService.startFocus();
        mClusterManager.setFocusMarkerId(markerId);

        //删除正在行走的车的移动线程
        List<Marker> markers = mClusterManager.getMarkerHashMap().get(markerId);
        try {
            BaiduMoveCarThread baiduMoveCarThread = movingCars.get(markerId);
            if (baiduMoveCarThread != null) {
                baiduMoveCarThread.stopMove();
                movingCars.remove(markerId);
            }
        } catch (Exception e) {
            Log.e(TAG, "setMonitorFocusTrack: " + "聚焦时终止移动线程异常", e);
        }

        if (vehicleEntityListAll.containsKey(markerId)) {
            VehicleEntity vehicleEntity = vehicleEntityListAll.get(markerId);
            centreLatLng = new LatLng(vehicleEntity.getLatitude().doubleValue(), vehicleEntity.getLongitude().doubleValue());

            if (markers != null) {
                for (Marker marker1 : markers) {
                    marker1.remove();
                }
            }
            mClusterManager.getMarkerHashMap().remove(markerId);
        }

        if ("true".equals(split[1])) {
            // 若当前是聚合状态 定位位置
            Log.i("monitorFocusTrackLog", split[1] + "");
            CommonMapUtil.localCenterPoint(map, centreLatLng, 19);
            mClusterManager.setMarkerId(markerId);
            mClusterManager.setActionStatus(1);
            mClusterManager.setFocusMarkerIdV2(markerId);
            mClusterManager.startFocusListenerService(true);
        } else {
            Log.i("monitorFocusTrackLog", split[1] + "");
            mClusterManager.setFocusMarkerId(null);
            mClusterManager.startFocusListenerService(false);
            focusListenerService.stopFocus();
        }
    }


    /**
     * 根据markerId获取markerId
     */
    private Marker getMarker(String markerId) {
        if (mClusterManager.getMarkerHashMap().isEmpty() && mClusterManager.getTempHashMap().isEmpty()) {
            return null;
        }
        HashMap<String, List<Marker>> hashMap = mClusterManager.getMarkerHashMap();
        if (hashMap.isEmpty()) {
            hashMap = mClusterManager.getTempHashMap();
        }
        List<Marker> markers = hashMap.get(markerId);
        if (markers == null || markers.isEmpty()) {
            return null;
        }
        return markers.get(0);
    }


    /**
     * 监听器
     */
    public class MyLocationListener extends BDAbstractLocationListener {
        private final TextureMapView mapView;

        public MyLocationListener(TextureMapView mapView) {
            this.mapView = mapView;
        }

        @Override
        public void onReceiveLocation(BDLocation location) {
            //Log.d(TAG, "onReceiveLocation: ");
            Log.e(TAG, "onReceiveLocation: " + location.getLatitude() + " " + location.getLongitude());
            MyLocationData locData = new MyLocationData.Builder()
                    .accuracy(location.getRadius())
                    // 此处设置开发者获取到的方向信息，顺时针0-360
                    .direction(100).latitude(location.getLatitude())
                    .longitude(location.getLongitude()).build();
            BaiduMap map = mapView.getMap();
            // 设置定位数据
            map.setMyLocationData(locData);
            // 当不需要定位图层时关闭定位图层
            locationLatLng = new LatLng(location.getLatitude(),
                    location.getLongitude());
            LatLng ll = new LatLng(location.getLatitude(),
                    location.getLongitude());
            NavigationModule.dealStartLatLng(ll);
            MapStatus.Builder builder = new MapStatus.Builder();
            builder.target(ll).zoom(18.0f);
            MyLocationConfiguration config = new MyLocationConfiguration(MyLocationConfiguration.LocationMode.NORMAL, false, null);
            map.setMyLocationConfiguration(config);
            map.animateMapStatus(MapStatusUpdateFactory.newMapStatus(builder.build()));

            final int viewId = mapView.getId();
            // 定位成功后修改聚焦状态
            EventInitMethod.onMonitorLoseFocus(mReactContext, viewId);
            Log.e(TAG, "onReceiveLocation1111: " + location.getLocType());
            switch (location.getLocType()) {
                case BDLocation.TypeGpsLocation: //GPS定位结果
                case BDLocation.TypeNetWorkLocation: //网络定位结果
                    //定位成功或失败事件
                    EventInitMethod.onLocationSuccess(mReactContext, viewId, "true");
                    break;
                case BDLocation.TypeServerError:
                    Toast.makeText(context, "服务器错误，请检查", Toast.LENGTH_SHORT).show();
                    break;
                case BDLocation.TypeNetWorkException:
                    Toast.makeText(context, "网络错误，请检查", Toast.LENGTH_SHORT).show();
                    break;
                case BDLocation.TypeCriteriaException:
                    //定位权限发送到页面
                    EventInitMethod.onLocation(mReactContext, viewId);
                    //定位成功或失败事件
                    EventInitMethod.onLocationSuccess(mReactContext, viewId, "false");
                    break;
            }
        }

    }

    /**
     * 构建事件交互信息
     */
    public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
        Map<String, Object> build = MapBuilder.newHashMap();

        build.put("onInAreaOptionsAPP", MapBuilder.of(
                "phasedRegistrationNames", MapBuilder.of("bubbled", "onInAreaOptions")));
        /*
         * 返回地图可视区域范围内的监控对象信息
         */
        build.put("topChange", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onChange")));
        /*
         * 返回地图可视区域范围内的监控对象信息
         */
        build.put("location", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onLocationStatusDenied")));
        /*
         * 地图点击后触发事件
         */
        build.put("onMapClickAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMapClick")));
        /*
         * 地图初始化成功事件
         */
        build.put("onMapInitFinishAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMapInitFinish")));
        /*
         * 路径规划距离返回
         */
        build.put("onPlanDistanceAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onPlanDistance")));
        /*
         * 定位成功或失败事件
         */
        build.put("onLocationSuccessAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onLocationSuccess")));
        /*
         * 地图标注物点击事件（返回当前点击的监控对象id）
         */
        build.put("onPointClickEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onPointClickEvent")));

        /*
         * 地图聚合点击事件（返回当前点击的监控对象id）
         */
        build.put("onClustersClickEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onClustersClickEvent")));

        /*
         * 历史轨迹停止点点击（返回当前停止点信息）
         */
        build.put("onStopPointDataEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onStopPointDataEvent")));

        /*
         * 历史轨迹停止点点击（返回当前停止点序号）
         */
        build.put("onStopPointIndexEventAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onStopPointIndexEvent")));


        /*
         * 逆地址 轨迹回放暂停后，返回查询的位置信息
         */
        build.put("onAddressAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onAddress")));
        /*
         * 原生端通知jsTimer关闭
         */
        build.put("onMonitorLoseFocusAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMonitorLoseFocus")));
        /*
         * 原生端通知js端scaleView
         */
        build.put("onMyScaleAPP", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMyScale")));
        return build;
    }

    /**
     * 启动监控对象平移线程
     *
     * @param vehicleId   监控对象id
     * @param markers     监控对象列表（包含一个textMarker和一个carMarker）
     * @param carMoveInfo 移动的车辆信息
     */
    private void startCarMove(String vehicleId, List<Marker> markers, CarMoveInfo carMoveInfo) {
        BaiduMoveCarThread baiduMoveCarThread = movingCars.get(vehicleId);
        if (baiduMoveCarThread != null
                && !Thread.State.TERMINATED.equals(baiduMoveCarThread.getState())
                && !Thread.State.BLOCKED.equals(baiduMoveCarThread.getState())
                && !Thread.State.NEW.equals(baiduMoveCarThread.getState())) {
            List<Marker> moveMakers = baiduMoveCarThread.getMoveMarker();
            //检测当前正在跑的marker是与当前下发经纬度的marker是否为同一个marker
            if ((moveMakers.get(1)) == (markers.get(1))) {
                baiduMoveCarThread.putCarMoveInfo(carMoveInfo);
                baiduMoveCarThread.setLastCarMoveInfo(carMoveInfo);
            } else {
                moveMakers.get(0).remove();
                moveMakers.get(1).remove();
                baiduMoveCarThread.setMoveMarker(markers);
                baiduMoveCarThread.clearCarMoveInfo();
                baiduMoveCarThread.setLastCarMoveInfo(carMoveInfo);
                baiduMoveCarThread.putCarMoveInfo(carMoveInfo);
            }
        } else {
            markers.get(0).cancelAnimation();
            markers.get(1).cancelAnimation();
            baiduMoveCarThread = new BaiduMoveCarThread();
            baiduMoveCarThread.setMoveMarker(markers);
            baiduMoveCarThread.setLastCarMoveInfo(carMoveInfo);
            movingCars.remove(vehicleId);
            movingCars.put(vehicleId, baiduMoveCarThread);
            baiduMoveCarThread.start();
            baiduMoveCarThread.putCarMoveInfo(carMoveInfo);
        }
    }

    private void zoomToSpan(BaiduMap map) {
        if (wakeAll.size() > 0) {
            LatLngBounds.Builder builder = new LatLngBounds.Builder();
            for (LatLng latLng : wakeAll) {
                // polyline 中的点可能太多，只按marker 缩放
                builder.include(latLng);
            }
            MapStatusUpdate mapStatusUpdate = MapStatusUpdateFactory.newLatLngBounds(builder.build(), ScreenUtils.getScreenWidth(), ScreenUtils.getScreenHeight());
            map.setMapStatus(mapStatusUpdate);
            mapzoomSpanHis(map);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private void destroy() {
        this.wakeStartLatLng = null;
        this.wakeList.clear();
        this.mClusterManager = null;
        this.listAllTemp.clear();
        this.vehicleEntityListAll.clear();
        this.vehicleEntityListScreen.clear();
        this.movingCars.clear();
        for (Map.Entry<String, Object> next : wakeMap.entrySet()) {
            ((Marker) next.getValue()).remove();
        }
        if (routePlanSearch != null) {
            routePlanSearch.destroy();
        }
        vedioFlag = true;
        // 历史轨迹
        if (historyMoveCarThread != null) {
            historyMoveCarThread.setRunning(false);
            historyMoveCarThread.setExit(true);
        }
        historyMoveCarThread = null;
        historyMap.clear();
        historyPark.clear();
        // 实时尾迹
        wakeDataMarkerId = null;
        wakeStartLatLng = null;
        wakeVehicleEntity = null;
        wakeDataMoveCarThread = null;
        wakeAll.clear();
        wakeList.clear();
        markerClickListener = null;
        WakeDataRealTimeThread.clearThread();
    }
}