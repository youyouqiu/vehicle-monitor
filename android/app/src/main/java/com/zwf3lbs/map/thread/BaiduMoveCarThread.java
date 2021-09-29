package com.zwf3lbs.map.thread;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;

import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.AnimationSet;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.animation.Transformation;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.map.clusterutil.clustering.ClusterManager;
import com.zwf3lbs.map.entity.CarMoveInfo;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;

import static com.zwf3lbs.map.util.CommonUtil.getAngle;

/**
 * 主页车辆平滑移动
 */
public class BaiduMoveCarThread extends Thread {
    private static final CarMoveInfo POISON = new CarMoveInfo();
    private LatLng start;
    private List<Marker> moveMarker;
    private boolean flag = true;
    private CarMoveInfo lastCarMoveInfo;

    private final Handler handler;

    private final LinkedBlockingQueue<CarMoveInfo> queue;

    public void putCarMoveInfo(CarMoveInfo carMoveInfo) {
        try {
            queue.put(carMoveInfo);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public void clearCarMoveInfo() {
        queue.clear();
    }

    public CarMoveInfo getLastCarMoveInfo() {
        return lastCarMoveInfo;
    }

    public void setLastCarMoveInfo(CarMoveInfo lastCarMoveInfo) {
        this.lastCarMoveInfo = lastCarMoveInfo;
    }

    public LatLng getStart() {
        return start;
    }

    public void setStart(LatLng start) {
        this.start = start;
    }

    public List<Marker> getMoveMarker() {
        if (moveMarker == null) {
            return new ArrayList<>();
        }
        return moveMarker;
    }

    public void setMoveMarker(List<Marker> mMoveMarker) {
        this.moveMarker = mMoveMarker;
    }

    public boolean isFlag() {
        return flag;
    }

    public void setFlag(boolean flag) {
        this.flag = flag;
    }

    public BaiduMoveCarThread() {
        this.handler = new MessageHandler(this);
        this.queue = new LinkedBlockingQueue<>();
    }

    public void stopMove() {
        clearCarMoveInfo();
        try {
            this.queue.put(POISON);
        } catch (InterruptedException ignore) {
        }

        handler.removeMessages(1);
        if (moveMarker != null) {
            for (Marker marker : moveMarker) {
                marker.cancelAnimation();
            }
        }
    }

    /**
     * 获取压点数量
     * @return
     */
    public int getDotSize() {
        return queue.size();
    }

    /**
     * 获取第一个点数据
     * @return
     */
    public CarMoveInfo getBottomInfo() {
        return queue.peek();
    }

    @Override
    public void run() {
        try {
            CarMoveInfo carMoveInfo;
            while (!Thread.currentThread().isInterrupted()) {
                carMoveInfo = queue.take();
                if (carMoveInfo == POISON) {
                    break;
                }
                final int time = carMoveInfo.getTime();

                handler.obtainMessage(1, carMoveInfo).sendToTarget();
                Thread.sleep(time * 1000 - 100);
            }
        } catch (Exception e) {
            Log.e("BaiduMoveCarThread", "实时轨迹线程停止");
        }
    }

    private void doMove(CarMoveInfo carMoveInfo) {
        final Marker textMarker = moveMarker.get(0);
        final Marker carMarker = moveMarker.get(1);

        RotateAnimation rotateAnimation = null;

        if (textMarker.getPosition().longitude != carMoveInfo.getLatLng().longitude || textMarker.getPosition().latitude != carMoveInfo.getLatLng().latitude) {
            double angle = getAngle(textMarker.getPosition(), carMoveInfo.getLatLng());
            Bundle bundle = carMarker.getExtraInfo();
            bundle.putInt("BaiduMoveCarThreadAngle", (int) angle);
            if (angle < 0) {
                angle = 360 + angle;
            }
            float startAngle = carMarker.getRotate();
            rotateAnimation = new RotateAnimation(startAngle, (int) angle + ClusterManager.mapstatusRotate);
            rotateAnimation.setDuration(20);
            rotateAnimation.setRepeatCount(0);
            rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
        }

        final LatLng[] latLngs = new LatLng[]{textMarker.getPosition(), carMoveInfo.getLatLng()};

        Transformation transformation = new Transformation(latLngs);
        transformation.setDuration((carMoveInfo.getTime() * 1000) - 150);
        transformation.setRepeatCount(0);
        transformation.setRepeatMode(Animation.RepeatMode.RESTART);
        AnimationSet animationSet = new AnimationSet();
        animationSet.addAnimation(transformation);
        animationSet.addAnimation(rotateAnimation);
        carMarker.setAnimation(animationSet);
        carMarker.startAnimation();
        textMarker.setAnimation(transformation);
        textMarker.startAnimation();
    }

    private static class MessageHandler extends Handler {
        private final WeakReference<BaiduMoveCarThread> target;

        MessageHandler(BaiduMoveCarThread moveCarThread) {
            super(Looper.getMainLooper());
            this.target = new WeakReference<>(moveCarThread);
        }

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            BaiduMoveCarThread moveCarThread = this.target.get();
            if (moveCarThread == null) {
                return;
            }
            CarMoveInfo carMoveInfo = (CarMoveInfo) msg.obj;
            try {
                moveCarThread.doMove(carMoveInfo);
            } catch (Exception e) {
                Log.e("BaiduMoveCarThread", "实时轨迹线程异常");
            }
        }
    }
}