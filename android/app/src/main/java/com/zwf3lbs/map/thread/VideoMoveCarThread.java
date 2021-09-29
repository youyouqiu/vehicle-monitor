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
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.MapStatus;
import com.baidu.mapapi.map.MapStatusUpdate;
import com.baidu.mapapi.map.MapStatusUpdateFactory;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.model.LatLng;

import java.lang.ref.WeakReference;
import java.util.LinkedList;
import java.util.Queue;

import static com.zwf3lbs.map.util.CommonUtil.getAngle;

public class VideoMoveCarThread {
    private final BaiduMap map;
    private final Handler handler;
    private final Marker textMarker;
    private final Marker carMarker;

    public VideoMoveCarThread(BaiduMap map, Marker carMarker, Marker textMarker) {
        this.handler = new MessageHandler(this);
        this.map = map;
        this.carMarker = carMarker;
        this.textMarker = textMarker;
    }

    public void addPoint(LatLng point) {
        if (textMarker == null || carMarker == null) {
            return;
        }
        handler.obtainMessage(1, point).sendToTarget();
    }

    private void moveCar(final LatLng latLng) {
        if (map == null) {
            return;
        }
        double angle = getAngle(carMarker.getPosition(), latLng);
        Bundle bundle = new Bundle();
        bundle.putInt("videoAngle", (int) angle);
        final LatLng[] latLngs = new LatLng[]{textMarker.getPosition(), latLng};
        if (angle < 0) {
            angle = 360 + angle;
        }
        if (carMarker.getPosition().latitude == latLng.latitude
                && carMarker.getPosition().longitude == latLng.longitude) {
            angle = (double) carMarker.getRotate();
            bundle.putInt("videoAngle", (int) angle);
        }
        carMarker.setExtraInfo(bundle);
        setAnimation(latLng, (int) angle, latLngs);
    }

    private void setAnimation(final LatLng latLng, int angle, LatLng[] latLngs) {
        //车头旋转动画
        RotateAnimation rotateAnimation = new RotateAnimation(carMarker.getRotate(), angle);
        rotateAnimation.setDuration(1);
        rotateAnimation.setRepeatCount(0);
        rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
        //车辆移动动画
        Transformation transformation = new Transformation(latLngs);
        transformation.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart() {
            }

            @Override
            public void onAnimationEnd() {
                MapStatus mMapStatus = new MapStatus.Builder()
                    .target(latLng) //移动地图到指定点
                    .zoom(15) //设置地图缩放等级为15
                    .build();
                //定义MapStatusUpdate对象，以便描述地图状态将要发生的变化
                MapStatusUpdate mMapStatusUpdate = MapStatusUpdateFactory.newMapStatus(mMapStatus);
                //移动地图，使车辆图标居中
                map.setMapStatus(mMapStatusUpdate);
            }

            @Override
            public void onAnimationCancel() {

            }

            @Override
            public void onAnimationRepeat() {

            }
        });
        transformation.setDuration(10000);
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
        private final WeakReference<VideoMoveCarThread> target;

        MessageHandler(VideoMoveCarThread moveCarThread) {
            super(Looper.getMainLooper());
            this.target = new WeakReference<>(moveCarThread);
        }

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            VideoMoveCarThread moveCarThread = this.target.get();
            if (moveCarThread == null) {
                return;
            }
            LatLng latLng = (LatLng) msg.obj;
            moveCarThread.moveCar(latLng);
        }
    }
}
