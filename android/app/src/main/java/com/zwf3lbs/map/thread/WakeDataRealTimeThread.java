package com.zwf3lbs.map.thread;

import android.os.Bundle;

import com.baidu.mapapi.map.TextureMapView;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.Overlay;
import com.baidu.mapapi.map.OverlayOptions;
import com.baidu.mapapi.map.PolylineOptions;
import com.baidu.mapapi.model.LatLng;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

/**
 * 实时尾迹
 */
public class
WakeDataRealTimeThread extends Thread {

    private static WakeDataRealTimeThread myThread;
    private volatile Marker marker;
    private TextureMapView mapView;
    private final String lock = "lock";
    private boolean flag = true;
    private Queue<LatLng> queue = new LinkedList<>();
    private List<Overlay> overlayList = new ArrayList<>();
    public Queue<LatLng> getQueue() {
        return queue;
    }

    public void setQueue(Queue<LatLng> queue) {
        this.queue = queue;
    }

    private WakeDataRealTimeThread() {

    }

    private WakeDataRealTimeThread(Marker marker, TextureMapView mapView) {
        this.mapView = mapView;
        this.marker = marker;
    }

    public static WakeDataRealTimeThread getInstance(Marker marker, TextureMapView mapView) {
        if (myThread == null) {
            synchronized (WakeDataRealTimeThread.class) {
                if (myThread == null) {
                    myThread = new WakeDataRealTimeThread(marker, mapView);
                }
            }
        }
        return myThread;
    }


    public void stopMethod() {
        flag = false;
    }

    public void startMethod() {
        synchronized (lock) {
            flag = true;
            lock.notify();
        }
    }

    /**
     * 获取线程实例
     * @return
     */
    public static WakeDataRealTimeThread getInstance() {
        if (myThread == null) {
            synchronized (WakeDataRealTimeThread.class) {
                if (myThread == null) {
                    myThread = new WakeDataRealTimeThread();
                }
            }
        }
        return myThread;
    }

    /**
     * 清除实时画线的部分
     */
    public void clearOverlay(){
        if(overlayList==null||overlayList.size()==0){
            return;
        }
        stopMethod();
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        for (Overlay overlay1 : overlayList) {
            overlay1.remove();
        }
    }

    /**
     * 关闭线程
     */
    public static void clearThread() {
        myThread = null;
    }


    @Override
    public void run() {
        synchronized (lock) {
            while (true) {
                try {
                    if(mapView==null){
                        return;
                    }
                    if(queue.size()==0) {
                        queue.add(mapView.getMap().getMapStatus().target);
                        queue.add(marker.getPosition());
                    }else {
                        queue.add(marker.getPosition());
                    }
//                    MapStatusUpdate update1 = MapStatusUpdateFactory.newLatLng(position);
//                    MapStatusUpdate update = MapStatusUpdateFactory.newMapStatus(mMapStatus);
//                    mapView.getMap().getLocationConfiguration()
//                    mapView.getMap().setOnMarkerDragListener(new MarkerManager);
                    List<LatLng> list = new ArrayList<>(queue);
                    Bundle bundle = new Bundle();
                    bundle.putString("tempLine","1");
                    OverlayOptions ooPolyline = new PolylineOptions().width(5)
                            .color(0xFF0000FF).points(list).extraInfo(bundle);
                    Overlay overlay = mapView.getMap().addOverlay(ooPolyline);
                    overlayList.add(overlay);
                    queue.poll();
                    if (!flag) {
                        lock.wait();
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
