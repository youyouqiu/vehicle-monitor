package com.zwf3lbs.map.thread;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.animation.LinearInterpolator;

import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.AnimationSet;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.animation.Transformation;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.map.OverlayOptions;
import com.baidu.mapapi.map.PolylineOptions;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.map.clusterutil.clustering.ClusterManager;
import com.zwf3lbs.map.listener.AnimationListener;
import com.zwf3lbs.map.util.CommonMapUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

/**
 * 实时尾迹车辆平滑移动
 */
public class WakeDataMoveCarThread extends Thread {

    private static final String TAG = "WakeDataMoveCarThread";
    /**
     * 经纬度集合
     */
    private List<LatLng> latLngList;
    private BaiduMap mBaiduMap;
    private final Handler handler = new Handler(Looper.getMainLooper());
    /**
     * 线程内部是否执行
     */
    private boolean isRunning = true;
    /**
     * 动画是否执行结束标志
     */
    private boolean animationFlag = true;
    /**
     * 是否定位到地图中心点
     */
    private boolean isMapCenter = true;
    /**
     * 动画是否执行中
     */
    private boolean isAnimationStart = true;
    /**
     * 车辆marker
     */
    private Marker carMarker;
    /**
     * 车牌号marker
     */
    private Marker textMarker;
    /**
     * 用于保存动画执行的最新两个点(超过两个点，则清除第一个)
     */
    private final List<LatLng> tempList = new ArrayList<>();
    /**
     * 定时器，用于动画执行，车辆移动
     */
    private Timer mTimer;
    /**
     * 定时任务
     */
    private TimerTask mTimerTask;
    /**
     * 用于保存动画执行的历史经纬度点
     */
    private List<Overlay> overlayList = new ArrayList<>();
    /**
     * 记录动画执行的时间，用于定时 定位中心点
     */
    private int countTime = 0;
    /**
     * 即将执行动画的两个经纬度坐标
     */
    private LatLng[] mlatLngs;

    /**
     * 设置run函数中是否执行
     */
    public void setIsRunning(boolean isRunning) {
        this.isRunning = isRunning;
    }

    /**
     * 设置是否定位到地图中心点
     */
    public void setMapFlag(boolean isMapCenter) {
        this.isMapCenter = isMapCenter;
    }

    /**
     * 设置新的数据源
     *
     * @param data 经纬度数据
     */
    public void setNewData(List<LatLng> data) {
        this.latLngList = data;
    }

    /**
     * 判断上一次的动画是否有结束，如果没有结束，则结束动画且绘制上两个点行驶路线
     * (取消动画再重新添加动画执行，会造成marker闪烁)
     */
    @Deprecated
    public void clearLastAnimAndDrawLine() {
        if (isAnimationStart) {
            if (carMarker != null) {
                carMarker.cancelAnimation();
                textMarker.cancelAnimation();
            }
        }
    }

    public WakeDataMoveCarThread(List<LatLng> list, BaiduMap map, Map<String, Object> wakeMap) {
        this.latLngList = list;
        this.mBaiduMap = map;
        if (carMarker == null) {
            carMarker = ((Marker) wakeMap.get("carMarker"));
            textMarker = ((Marker) wakeMap.get("textMarker"));
        }
    }

    @Override
    public void run() {
        while (isRunning) {
            if (latLngList.size() == 0 || latLngList.size() == 1) continue;
            if (animationFlag) {
                animationFlag = false;
                final LatLng startPoint = latLngList.get(0);
                final LatLng endPoint = latLngList.get(1);
                handler.post(() -> {
                    RotateAnimation rotateAnimation = null;
                    if (startPoint.latitude != endPoint.latitude || startPoint.longitude != startPoint.longitude) {
                        double angle = getAngle(startPoint, endPoint);
                        carMarker.getExtraInfo().putInt("wakeDataAngle", (int) angle);
                        Bundle bundle = new Bundle();
                        bundle.putInt("wakeDataAngle", (int) angle);
                        carMarker.setExtraInfo(bundle);
                        if (angle < 0) angle = 360 + angle;
                        rotateAnimation = new RotateAnimation(carMarker.getRotate(), (int) angle + ClusterManager.mapstatusRotate);
                        rotateAnimation.setDuration(1);
                        rotateAnimation.setRepeatCount(0);
                        rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
                    }

                    mlatLngs = new LatLng[]{startPoint, endPoint};
                    Transformation transformation = new Transformation(mlatLngs);
                    transformation.setInterpolator(new LinearInterpolator());
                    transformation.setAnimationListener(new AnimationListener() {
                        @Override
                        public void onAnimationStart() {
                            Log.i(TAG, "onAnimationStart");
                            isAnimationStart = true;
                            mTimer = new Timer();
                            mTimerTask = new TimerTask() {
                                @Override
                                public void run() {
                                    drawLine();
                                }
                            };
                            mTimer.schedule(mTimerTask, 0, 500);
                        }

                        @Override
                        public void onAnimationEnd() {
                            Log.i(TAG, "onAnimationEnd");
                            onFinished();
                            CommonMapUtil.localCenterPoint(mBaiduMap, mlatLngs[1], 19);
                        }

                        @Override
                        public void onAnimationCancel() {
                            super.onAnimationCancel();
                            Log.i(TAG, "onAnimationCancel");
                            //取消动画之后，会自动执行onAnimationEnd()，不需要手动调用
                        }

                        /**
                         * 取消或结束动画
                         */
                        @Override
                        public void onFinished() {
                            countTime = 0;
                            if (mTimer != null) {
                                mTimer.cancel();
                                if (mTimerTask != null) {
                                    mTimerTask.cancel();
                                    mTimerTask = null;
                                }
                                mTimer = null;
                            }
                            List<LatLng> points = new ArrayList<>();
                            points.add(mlatLngs[0]);
                            points.add(mlatLngs[1]);
                            OverlayOptions ooPolyline = new PolylineOptions().width(5)
                                    .color(0xFF0000FF).points(points);
                            mBaiduMap.removeOverLays(overlayList);
                            mBaiduMap.addOverlay(ooPolyline);
                            //超过两个经纬度点时，清除第一个
                            if (latLngList.size() > 1) latLngList.remove(0);
                            animationFlag = true;
                            isAnimationStart = false;
                            //BaiduMapViewManager.wakeMap.put("carMarker", carMarker);
                        }
                    });
                    transformation.setDuration(20 * 1000);
                    transformation.setRepeatCount(0);
                    transformation.setRepeatMode(Animation.RepeatMode.RESTART);
                    AnimationSet animationSet = new AnimationSet();
                    animationSet.addAnimation(transformation);
                    animationSet.addAnimation(rotateAnimation);

                    carMarker.setAnimation(animationSet);
                    carMarker.startAnimation();
                    textMarker.setAnimation(transformation);
                    textMarker.startAnimation();
                });
            }
        }
    }


    /**
     * 绘制点位之间的线
     */
    private void drawLine() {
        if (carMarker == null) return;
        //if (isMapCenter && isAnimationStart) {
        if (isAnimationStart) {
            tempList.add(carMarker.getPosition());
            if (tempList.size() > 2) tempList.remove(0);
            if (tempList.size() > 1) {
                //Log.i(TAG, carMarker.getPosition().toString());
                Bundle bundle = new Bundle();
                bundle.putString("tempLine", "1");
                OverlayOptions ooPolyline = new PolylineOptions().width(5)
                        .color(0xFF0000FF).points(tempList).extraInfo(bundle);
                Overlay overlay = mBaiduMap.addOverlay(ooPolyline);
                overlayList.add(overlay);
                if (countTime % 6 == 0 && isMapCenter) {//每间隔3s执行一次中心点聚焦
                    mBaiduMap.setMapStatus(MapStatusUpdateFactory.newLatLng(carMarker.getPosition()));
                }
            }
        }
        countTime++;
    }

    /**
     * 根据两点算取图标转的角度
     */
    public static double getAngle(LatLng fromPoint, LatLng toPoint) {
        double slope = getSlope(fromPoint, toPoint);
        if (slope == Double.MAX_VALUE) {
            if (toPoint.latitude > fromPoint.latitude) {
                return 0;
            } else {
                return 180;
            }
        }
        float deltAngle = 0;
        if ((toPoint.latitude - fromPoint.latitude) * slope < 0) {
            deltAngle = 180;
        }
        double radio = Math.atan(slope);
        return 180 * (radio / Math.PI) + deltAngle;
    }

    /**
     * 算斜率
     */
    public static double getSlope(LatLng fromPoint, LatLng toPoint) {
        if (toPoint.longitude == fromPoint.longitude) {
            return Double.MAX_VALUE;
        }
        return ((toPoint.latitude - fromPoint.latitude) / (toPoint.longitude - fromPoint.longitude));
    }
}
