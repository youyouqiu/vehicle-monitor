package com.zwf3lbs.map.thread;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.map.OverlayOptions;
import com.baidu.mapapi.map.PolylineOptions;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.map.clusterutil.clustering.ClusterManager;
import com.zwf3lbs.map.entity.DecLatLng;

import java.util.ArrayList;
import java.util.List;


/**
 * 轨迹回放车辆平滑移动线程
 */
public class HistoryMoveCarThread extends Thread {

    private final String TAG = HistoryMoveCarThread.class.getSimpleName();
    private final Handler mHandler = new Handler(Looper.getMainLooper());
    private static final double DISTANCE = 0.002;
    private BaiduMap mBaiduMap;
    /**
     * 轨迹点存放数组
     */
    private List<DecLatLng> mList;
    /**
     * 监控对象
     */
    private final Marker mMoveMarker;
    /**
     * 线程执行状态（控制for循环）
     */
    private boolean running = true;
    /**
     * 是否退出执行(控制while循环)
     */
    private boolean isExit = false;
    /**
     * 车辆轨迹起点位置下标
     */
    public Integer mIndex = 0;
    /**
     * 播放速度
     */
    private Double playSpeed;
    /**
     * 行走轨迹颜色16进制值
     */
    private int pathColor = 0x800000FF;
    /**
     * 轨迹粗细
     */
    private int pathWith = 10;
    /**
     * 是否显示曲线图（用于控制是否跳点）
     */
    private boolean isShowChart = false;
    /**
     * 已经绘制的overLay集合
     */
    private List<Overlay> options = new ArrayList<>();
    /**
     * 已经走过的经纬度点集合
     */
    private List<LatLng> hisLatLngs = new ArrayList<>();

    public HistoryMoveCarThread(Marker mMoveMarker, BaiduMap map) {
        this.mMoveMarker = mMoveMarker;
        this.mBaiduMap = map;
    }

    /**
     * 设置位置（下标）
     */
    public void setIndex(Integer index) {
        this.mIndex = index;
    }

    /**
     * 设置历史轨迹经纬度列表
     */
    public void setNewList(List<DecLatLng> list) {
        this.mList = list;
    }

    /**
     * 设置是否继续执行
     */
    public void setRunning(boolean running) {
        this.running = running;
    }

    /**
     * 设置是否退出while死循环
     */
    public void setExit(boolean exit) {
        isExit = exit;
    }

    /**
     * 设置播放速度
     *
     * @param playSpeed 速度值
     */
    public void setPlaySpeed(Double playSpeed) {
        this.playSpeed = playSpeed;
    }

    /**
     * 设置行驶轨迹宽度
     *
     * @param with 宽度值
     */
    public void setPathWith(int with) {
        this.pathWith = with;
    }

    /**
     * 设置是否有显示图标（控制是否跳点）
     */
    public void setShowChart(boolean showChart) {
        isShowChart = showChart;
    }

    /**
     * 进度条拖动（未播放的情况下拖动绘制）
     *
     * @param index 指定的拖动位置
     */
    public void onProgressBarDrag(int index) {
        mIndex = index;
        hisLatLngs.clear();
        mBaiduMap.removeOverLays(options);
        for (int i = 0; i <= mIndex; i++) {
            hisLatLngs.add(mList.get(i).getLatLng());
        }
        drawLine();
    }

    /**
     * 绘制行驶过的路线轨迹(实时绘制)
     *
     * @param latLng 当前点的经纬度
     */
    private void drawPolyLine(LatLng latLng) {
        hisLatLngs.add(latLng);
        drawLine();
    }

    private void drawLine() {
        if (hisLatLngs.size() > 1) {
            mHandler.post(() -> {
                mBaiduMap.removeOverLays(options);
                //设置折线的属性
                OverlayOptions mOverlayOptions = new PolylineOptions()
                        .width(pathWith)
                        .color(pathColor)
                        .points(hisLatLngs);
                Overlay overlay = mBaiduMap.addOverlay(mOverlayOptions);
                options.add(overlay);
            });
        }
    }

    @Override
    public void run() {
        while (true) {
            if (isExit) return;
            if (isAllElementEqual(mList)) return;
            if (mList == null || mMoveMarker == null) continue;
            if (running) {
                for (int i = mIndex, len = mList.size(); i < len - 1; i++) {
                    if (!running) break;
                    //未显示曲线图且速度小于5时，跳点
                    if (!isShowChart && mList.get(i).getSpeed() < 5) continue;
                    LatLng startPoint = mList.get(i).getLatLng();
                    LatLng endPoint = mList.get(i + 1).getLatLng();
                    drawPolyLine(startPoint);
                    if (startPoint.longitude == endPoint.longitude &&
                            startPoint.latitude == endPoint.latitude) {//前后两个点相等，则跳过
                        continue;
                    }

                    mMoveMarker.setAnchor(0.5f, 0.5f);//设置锚点比例
                    mMoveMarker.setToTop();//设置marker层级为顶级
                    //设置marker额外信息(手势操作地图时，如旋转，回调)
                    Bundle bundle = new Bundle();
                    bundle.putInt("historyAngle", (int) getAngle(startPoint, endPoint));
                    mMoveMarker.setExtraInfo(bundle);

                    //设置marker旋转角度
                    mMoveMarker.setRotate((float) getAngle(startPoint, endPoint) + ClusterManager.mapstatusRotate);

                    //根据两点的经纬度，计算大致时间，根据计算的时间，做每个经纬度点的停留处理，达到动画效果（待改进）
                    double slope = getSlope(startPoint, endPoint);
                    boolean isReverse = (startPoint.latitude > endPoint.latitude);
                    double intercept = getInterception(slope, startPoint);
                    double xMoveDistance = isReverse ? getXMoveDistance(slope) : -1 * getXMoveDistance(slope);
                    double textNum = ((endPoint.latitude - startPoint.latitude) / xMoveDistance);
                    int count = ((Double) Math.ceil(Math.abs(textNum))).intValue();
                    int time;
                    if (count != 0) {
                        time = ((Double) (playSpeed * 1000 / count)).intValue();
                    } else {
                        //if (mIndex != 0) i = mIndex;
                        try {
                            int i1 = Double.valueOf(playSpeed * 1000).intValue();
                            if (i1 >= 5000) i1 = 500;
                            Thread.sleep(i1);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                        continue;
                    }
                    for (double j = startPoint.latitude; j > endPoint.latitude == isReverse; j = j - xMoveDistance) {
                        LatLng latLng;
                        if (slope == Double.MAX_VALUE) {
                            latLng = new LatLng(j, startPoint.longitude);
                        } else {
                            latLng = new LatLng(j, (j - intercept) / slope);
                        }
                        if (!running) {
                            if (mIndex != 0) {
                                i = mIndex;
                                mMoveMarker.setPosition(endPoint);
                                break;
                            }
                        }
                        //final LatLng finalLatLng = latLng;
                        //mMoveMarker.setAnchor(0.5f, 0.5f);
                        mMoveMarker.setPosition(latLng);
                        try {
                            Thread.sleep(time);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }
                    if (i == len - 1) return;
                }
                running = false;
            }
        }
    }

    /**
     * 判断集合中所有元素是否都相等
     *
     * @param latLngs 元素集合
     * @return 是否相等
     */
    private boolean isAllElementEqual(List<DecLatLng> latLngs) {
        if (latLngs == null || latLngs.size() == 0) return false;
        DecLatLng latLng = latLngs.get(0);
        for (DecLatLng element : latLngs) {
            if (!latLng.equals(element)) return false;
        }
        return true;
    }

    /**
     * 根据两点算取图标转的角度
     */
    private double getAngle(LatLng fromPoint, LatLng toPoint) {
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
     * 根据两点的经纬度计算斜率
     */
    private double getSlope(LatLng fromPoint, LatLng toPoint) {
        if (toPoint.longitude == fromPoint.longitude) {
            return Double.MAX_VALUE;
        }
        return (toPoint.latitude - fromPoint.latitude) / (toPoint.longitude - fromPoint.longitude);

    }

    /**
     * 根据点和斜率算取截距
     */
    private double getInterception(double slope, LatLng point) {
        return point.latitude - slope * point.longitude;
    }

    /**
     * 计算x方向每次移动的距离
     */
    private double getXMoveDistance(double slope) {
        if (slope == Double.MAX_VALUE) {
            return DISTANCE;
        }
        return Math.abs((DISTANCE * slope) / Math.sqrt(1 + slope * slope));
    }
}
