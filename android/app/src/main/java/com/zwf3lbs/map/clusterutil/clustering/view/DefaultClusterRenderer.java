/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.map.clusterutil.clustering.view;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.TimeInterpolator;
import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.OvalShape;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.MessageQueue;
import android.util.Log;
import android.util.SparseArray;
import android.view.ViewGroup;
import android.view.animation.DecelerateInterpolator;

import com.alibaba.fastjson.JSON;
import com.baidu.mapapi.map.BaiduMap;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.map.MarkerOptions;
import com.baidu.mapapi.map.Projection;
import com.baidu.mapapi.model.LatLng;
import com.baidu.mapapi.model.LatLngBounds;
import com.zwf3lbs.map.clusterutil.MarkerManager;
import com.zwf3lbs.map.clusterutil.clustering.Cluster;
import com.zwf3lbs.map.clusterutil.clustering.ClusterItem;
import com.zwf3lbs.map.clusterutil.clustering.ClusterManager;
import com.zwf3lbs.map.clusterutil.clustering.algo.NonHierarchicalDistanceBasedAlgorithm;
import com.zwf3lbs.map.clusterutil.projection.Point;
import com.zwf3lbs.map.clusterutil.projection.SphericalMercatorProjection;
import com.zwf3lbs.map.clusterutil.ui.IconGenerator;
import com.zwf3lbs.map.clusterutil.ui.SquareTextView;
import com.zwf3lbs.map.entity.MonitorInfo;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;


/**
 * The default view for a ClusterManager. Markers are animated in and out of clusters.
 * 管理各个marker的聚合和分离
 */
public class DefaultClusterRenderer<T extends ClusterItem> implements
        ClusterRenderer<T> {
    private static final boolean SHOULD_ANIMATE = Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB;
    private final BaiduMap mMap;
    private final IconGenerator mIconGenerator;
    private final ClusterManager<T> mClusterManager;
    private final float mDensity;

    private static final int[] BUCKETS = {1000, 20, 50, 100, 200, 500, 1000};
    private ShapeDrawable mColoredCircleBackground;

    /**
     * Markers that are currently on the map.
     */
    private Set<MarkerWithPosition> mMarkers = Collections.newSetFromMap(
            new ConcurrentHashMap<MarkerWithPosition, Boolean>());

    /**
     * Icons for each bucket.
     */
    private SparseArray<BitmapDescriptor> mIcons = new SparseArray<BitmapDescriptor>();

    /**
     * Markers for single ClusterItems.
     */
    private MarkerCache<T> mMarkerCache = new MarkerCache<T>();

    /**
     * 最小聚合数量（达到这个数目，才会聚合）
     */
    private static final int MIN_CLUSTER_SIZE = 0;

    /**
     * The currently displayed set of clusters.
     */
    private Set<? extends Cluster<T>> mClusters;

    /**
     * Lookup between markers and the associated cluster.
     */
    private Map<Marker, Cluster<T>> mMarkerToCluster = new HashMap<Marker, Cluster<T>>();
    private Map<Cluster<T>, Marker> mClusterToMarker = new HashMap<Cluster<T>, Marker>();

    /**
     * The target zoom level for the current set of clusters.
     */
    private float mZoom;

    private final ViewModifier mViewModifier = new ViewModifier();

    private ClusterManager.OnClusterClickListener<T> mClickListener;
    private ClusterManager.OnClusterInfoWindowClickListener<T> mInfoWindowClickListener;
    private ClusterManager.OnClusterItemClickListener<T> mItemClickListener;
    private ClusterManager.OnClusterItemInfoWindowClickListener<T> mItemInfoWindowClickListener;

    public DefaultClusterRenderer(Context context, BaiduMap map, ClusterManager<T> clusterManager) {
        mMap = map;
        mDensity = context.getResources().getDisplayMetrics().density;
        mIconGenerator = new IconGenerator(context);
        mIconGenerator.setContentView(makeSquareTextView(context));
        mIconGenerator.setTextAppearance(R.style.ClusterIcon_TextAppearance);
        mIconGenerator.setBackground(makeClusterBackground());
        mClusterManager = clusterManager;
    }

    @Override
    public void onAdd() {
        mClusterManager.getMarkerCollection().setOnMarkerClickListener(new BaiduMap.OnMarkerClickListener() {
            @Override
            public boolean onMarkerClick(Marker marker) {
                return mItemClickListener != null && mItemClickListener.onClusterItemClick(mMarkerCache.get(marker));
            }
        });


        mClusterManager.getClusterMarkerCollection().setOnMarkerClickListener(new BaiduMap.OnMarkerClickListener() {
            @Override
            public boolean onMarkerClick(Marker marker) {
                return mClickListener != null && mClickListener.onClusterClick(mMarkerToCluster.get(marker));
            }
        });

    }

    @Override
    public void onRemove() {
        mClusterManager.getMarkerCollection().setOnMarkerClickListener(null);
        mClusterManager.getClusterMarkerCollection().setOnMarkerClickListener(null);
    }

    /**
     * 设置聚合背景效果
     * @return
     */
    private LayerDrawable makeClusterBackground() {
        mColoredCircleBackground = new ShapeDrawable(new OvalShape());
        ShapeDrawable outline = new ShapeDrawable(new OvalShape());
        outline.getPaint().setColor(0x80ffffff); // Transparent white.
        LayerDrawable background = new LayerDrawable(new Drawable[]{outline, mColoredCircleBackground});
        int strokeWidth = (int) (mDensity * 3);
        background.setLayerInset(1, strokeWidth, strokeWidth, strokeWidth, strokeWidth);
        return background;
    }

    /**
     * 设置聚合icon显示的文本
     * @param context
     * @return
     */
    private SquareTextView makeSquareTextView(Context context) {
        SquareTextView squareTextView =
                new SquareTextView(context);
        ViewGroup.LayoutParams layoutParams = new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        squareTextView.setLayoutParams(layoutParams);
        squareTextView.setId(R.id.text);
        int twelveDpi = (int) (12 * mDensity);
        squareTextView.setPadding(twelveDpi, twelveDpi, twelveDpi, twelveDpi);
        return squareTextView;
    }

    private int getColor(int clusterSize) {
        final float hueRange = 220;
        final float sizeRange = 300;
        final float size = Math.min(clusterSize, sizeRange);
        final float hue = (sizeRange - size) * (sizeRange - size) / (sizeRange * sizeRange) * hueRange;
        return Color.HSVToColor(new float[]{
                hue, 1f, .6f
        });
    }

    protected String getClusterText(int bucket) {
        if (bucket < BUCKETS[0]) {
            return String.valueOf(bucket);
        }
        return String.valueOf(bucket) + "+";
    }

    /**
     * Gets the "bucket" for a particular cluster. By default, uses the number of points within the
     * cluster, bucketed to some set points.
     */
    protected int getBucket(Cluster<T> cluster) {
        int size = cluster.getSize();
        if (size <= BUCKETS[0]) {
            return size;
        }
        for (int i = 0; i < BUCKETS.length - 1; i++) {
            if (size < BUCKETS[i + 1]) {
                return BUCKETS[i];
            }
        }
        return BUCKETS[BUCKETS.length - 1];
    }

    /**
     * ViewModifier ensures only one re-rendering of the view occurs at a time, and schedules
     * re-rendering, which is performed by the RenderTask.
     */
    @SuppressLint("HandlerLeak")
    private class ViewModifier extends Handler {
        private static final int RUN_TASK = 0;
        private static final int TASK_FINISHED = 1;
        private boolean mViewModificationInProgress = false;
        private RenderTask mNextClusters = null;

        @Override
        public void handleMessage(Message msg) {
            if (msg.what == TASK_FINISHED) {
                mViewModificationInProgress = false;
                if (mNextClusters != null) {
                    // Run the task that was queued up.
                    sendEmptyMessage(RUN_TASK);
                }
                return;
            }
            removeMessages(RUN_TASK);

            if (mViewModificationInProgress) {
                // Busy - wait for the callback.
                return;
            }

            if (mNextClusters == null) {
                // Nothing to do.
                return;
            }

            RenderTask renderTask;
            synchronized (this) {
                renderTask = mNextClusters;
                mNextClusters = null;
                mViewModificationInProgress = true;
            }

            renderTask.setCallback(new Runnable() {
                @Override
                public void run() {
                    sendEmptyMessage(TASK_FINISHED);
                }
            });
            renderTask.setProjection(mMap.getProjection());
            renderTask.setMapZoom(mMap.getMapStatus().zoom);
            new Thread(renderTask).start();
        }

        public void queue(Set<? extends Cluster<T>> clusters) {
            synchronized (this) {
                // Overwrite any pending cluster tasks - we don't care about intermediate states.
                mNextClusters = new RenderTask(clusters);
            }
            sendEmptyMessage(RUN_TASK);
        }
    }

    /**
     * 判断cluster是否能聚合
     * @param cluster
     * @return
     */
    protected boolean shouldRenderAsCluster(Cluster<T> cluster) {
        /**
         * 判断cluster中的marker数量是否达到最小数量
         */
        return cluster.getSize() > MIN_CLUSTER_SIZE;
    }

    /**
     * Transforms the current view (represented by DefaultClusterRenderer.mClusters and DefaultClusterRenderer.mZoom) to a
     * new zoom level and set of clusters.
     * <p/>
     * This must be run off the UI thread. Work is coordinated in the RenderTask, then queued up to
     * be executed by a MarkerModifier.
     * <p/>
     * There are three stages for the render:
     * <p/>
     * 1. Markers are added to the map
     * <p/>
     * 2. Markers are animated to their final position
     * <p/>
     * 3. Any old markers are removed from the map
     * <p/>
     * When zooming in, markers are animated out from the nearest existing cluster. When zooming
     * out, existing clusters are animated to the nearest new cluster.
     */
    private class RenderTask implements Runnable {
        final Set<? extends Cluster<T>> clusters;
        private Runnable mCallback;
        private Projection mProjection;
        private SphericalMercatorProjection mSphericalMercatorProjection;
        private float mMapZoom;

        private RenderTask(Set<? extends Cluster<T>> clusters) {
            this.clusters = clusters;
        }

        /**
         * A callback to be run when all work has been completed.
         *
         * @param callback
         */
        public void setCallback(Runnable callback) {
            mCallback = callback;
        }

        public void setProjection(Projection projection) {
            this.mProjection = projection;
        }

        public void setMapZoom(float zoom) {
            this.mMapZoom = zoom;
            this.mSphericalMercatorProjection =
                    new SphericalMercatorProjection(256 * Math.pow(2, Math.min(zoom, mZoom)));
        }

        @SuppressLint("NewApi")
        public void run() {
//            if (clusters.equals(DefaultClusterRenderer.this.mClusters)) {
//                mCallback.run();//判断如果新的clusters等于上一次保存的clusters，直接return出去
//                return;
//            }

            final MarkerModifier markerModifier = new MarkerModifier();

            final float zoom = mMapZoom;
            final boolean zoomingIn = zoom > mZoom;//mZoom为上一次保存的zoom值
            final float zoomDelta = zoom - mZoom;//zoom变化量级，超过一定量级就不执行动画了

            final Set<MarkerWithPosition> markersToRemove = mMarkers;//需要删除的点
            final LatLngBounds visibleBounds = mMap.getMapStatus().bound;//地图在手机上面的可视范围
            // TODO: Add some padding, so that markers can animate in from off-screen.

            //1. 添加点
            //找出所有屏幕上的已经存在的cluster中心点，在增加点的时候有些动画需要用到这些点
            List<Point> existingClustersOnScreen = null;
            if (DefaultClusterRenderer.this.mClusters != null && SHOULD_ANIMATE) {
                existingClustersOnScreen = new ArrayList<Point>();
                //迭代上一次保存的cluster
                for (Cluster<T> c : DefaultClusterRenderer.this.mClusters) {
                    //只有已经聚合了的cluster才可以新增点
                    if (shouldRenderAsCluster(c) && visibleBounds.contains(c.getPosition())) {
                        //position转换成point
                        Point point = mSphericalMercatorProjection.toPoint(c.getPosition());
                        //保存屏幕上已经聚合的cluster
                        existingClustersOnScreen.add(point);
                    }
                }
            }

            // Create the new markers and animate them to their new positions.
            //保存新的clusters中需要显示的点,转成MarkerWithPosition类型
            final Set<MarkerWithPosition> newMarkers = Collections.newSetFromMap(
                    new ConcurrentHashMap<MarkerWithPosition, Boolean>());
            for (Cluster<T> c : clusters) {//迭代新的clusters
                boolean onScreen = visibleBounds.contains(c.getPosition());//是否在屏幕内
                if (zoomingIn && onScreen && SHOULD_ANIMATE) {//地图放大 + 此cluster在屏幕内 + 可以动画(SDK版本>11)
                    //position转成point
                    Point point = mSphericalMercatorProjection.toPoint(c.getPosition());
                    //找出与这个cluster距离最近的原屏幕上的点
                    Point closest = findClosestCluster(existingClustersOnScreen, point);
                    if (closest != null) {//存在，则实现动画
                        LatLng animateTo = mSphericalMercatorProjection.toLatLng(closest);
                        markerModifier.add(true, new CreateMarkerTask(c, newMarkers, animateTo));
                    } else {//不存在，则直接添加不生成动画
                        markerModifier.add(true, new CreateMarkerTask(c, newMarkers, null));
                    }
                } else {//直接添加点，不生成动画
                    markerModifier.add(onScreen, new CreateMarkerTask(c, newMarkers, null));
                }
            }

            // 2.等待添加点的任务完成
            markerModifier.waitUntilFree();

            // Don't remove any markers that were just added. This is basically anything that had
            // a hit in the MarkerCache.
            // 把newMarkers中的点从markersToRemove中移除，markersToRemove中的点都是需要从地图上移除的
            markersToRemove.removeAll(newMarkers);

            // Find all of the new clusters that were added on-screen. These are candidates for
            // markers to animate from.
            //3.移除点
            // 找出现在屏幕上显示的cluster中心点，在移除点时需要用到这些点来实现动画
            List<Point> newClustersOnScreen = null;
            if (SHOULD_ANIMATE) {
                newClustersOnScreen = new ArrayList<Point>();
                for (Cluster<T> c : clusters) {
                    if (shouldRenderAsCluster(c) && visibleBounds.contains(c.getPosition())) {
                        Point p = mSphericalMercatorProjection.toPoint(c.getPosition());
                        newClustersOnScreen.add(p);
                    }
                }
            }

            // Remove the old markers, animating them into clusters if zooming out.
            for (final MarkerWithPosition marker : markersToRemove) {//迭代所有需要移除的点
                boolean onScreen = visibleBounds.contains(marker.position);
                // Don't animate when zooming out more than 3 zoom levels.
                // TODO: drop animation based on speed of device & number of markers to animate.
                if (!zoomingIn && zoomDelta > -3 && onScreen && SHOULD_ANIMATE) {// 地图缩小 + zoom改变不超过3
                    final Point point = mSphericalMercatorProjection.toPoint(marker.position);
                    //找出最近的cluster
                    final Point closest = findClosestCluster(newClustersOnScreen, point);
                    if (closest != null) {
                        //动画移动的终点
                        LatLng animateTo = mSphericalMercatorProjection.toLatLng(closest);
                        markerModifier.animateThenRemove(marker, marker.position, animateTo);
                    } else {
                        markerModifier.remove(true, marker.marker);//无动画
                    }
                } else {
                    markerModifier.remove(onScreen, marker.marker);//无动画
                }
            }
            //等待移除点的任务完成
            markerModifier.waitUntilFree();

            mMarkers = newMarkers;//保存新的点
            DefaultClusterRenderer.this.mClusters = clusters;
            mZoom = zoom;//保存最新的zoom

            mCallback.run();//执行线程执行完成的回调函数
        }
    }

    @Override
    public void onClustersChanged(Set<? extends Cluster<T>> clusters) {
        mViewModifier.queue(clusters);
    }

    @Override
    public void setOnClusterClickListener(ClusterManager.OnClusterClickListener<T> listener) {
        mClickListener = listener;
    }

    @Override
    public void setOnClusterInfoWindowClickListener(ClusterManager
                                                            .OnClusterInfoWindowClickListener<T> listener) {
        mInfoWindowClickListener = listener;
    }

    @Override
    public void setOnClusterItemClickListener(ClusterManager.OnClusterItemClickListener<T> listener) {
        mItemClickListener = listener;
    }

    @Override
    public void setOnClusterItemInfoWindowClickListener(ClusterManager
                                                                .OnClusterItemInfoWindowClickListener<T> listener) {
        mItemInfoWindowClickListener = listener;
    }

    private static double distanceSquared(Point a, Point b) {
        return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }

    private static Point findClosestCluster(List<Point> markers, Point point) {
        if (markers == null || markers.isEmpty()) {
            return null;
        }

        // TODO: make this configurable.
        double minDistSquared = NonHierarchicalDistanceBasedAlgorithm.MAX_DISTANCE_AT_ZOOM * NonHierarchicalDistanceBasedAlgorithm.MAX_DISTANCE_AT_ZOOM;
        Point closest = null;
        for (Point candidate : markers) {
            double dist = distanceSquared(candidate, point);
            if (dist < minDistSquared) {
                closest = candidate;
                minDistSquared = dist;
            }
        }
        return closest;
    }

    /**
     * Handles all markerWithPosition manipulations on the map. Work (such as adding, removing, or
     * animating a markerWithPosition) is performed while trying not to block the rest of the app's
     * UI.
     * 处理显示和动画（处理地图上marker的修改），主线程中执行（Looper.getMainLooper()）
     */
    @SuppressLint("HandlerLeak")
    private class MarkerModifier extends Handler implements MessageQueue.IdleHandler {
        private static final int BLANK = 0;

        private final Lock lock = new ReentrantLock();
        private final Condition busyCondition = lock.newCondition();

        private Queue<CreateMarkerTask> mCreateMarkerTasks = new LinkedList<CreateMarkerTask>();
        private Queue<CreateMarkerTask> mOnScreenCreateMarkerTasks = new LinkedList<CreateMarkerTask>();
        private Queue<Marker> mRemoveMarkerTasks = new LinkedList<Marker>();
        private Queue<Marker> mOnScreenRemoveMarkerTasks = new LinkedList<Marker>();
        private Queue<AnimationTask> mAnimationTasks = new LinkedList<>();

        /**
         * Whether the idle listener has been added to the UI thread's MessageQueue.
         */
        private boolean mListenerAdded;

        private MarkerModifier() {
            super(Looper.getMainLooper());
        }

        /**
         * Creates markers for a cluster some time in the future.
         *
         * @param priority whether this operation should have priority.
         */
        public void add(boolean priority, CreateMarkerTask c) {
            Log.e("mOnScreenCreateMarker", "");
            lock.lock();
            sendEmptyMessage(BLANK);
            if (priority) {
                mOnScreenCreateMarkerTasks.add(c);
            } else {
                //mCreateMarkerTasks.add(c);
            }
            lock.unlock();
        }

        /**
         * Removes a markerWithPosition some time in the future.
         *
         * @param priority whether this operation should have priority.
         * @param m        the markerWithPosition to remove.
         */
        public void remove(boolean priority, Marker m) {
            lock.lock();
            sendEmptyMessage(BLANK);
            if (priority) {
                mOnScreenRemoveMarkerTasks.add(m);
            } else {
                mRemoveMarkerTasks.add(m);
            }
            lock.unlock();
        }

        /**
         * Animates a markerWithPosition some time in the future.
         *
         * @param marker the markerWithPosition to animate.
         * @param from   the position to animate from.
         * @param to     the position to animate to.
         */
        public void animate(MarkerWithPosition marker, LatLng from, LatLng to) {
            //lock.lock();
            //mAnimationTasks.add(new AnimationTask(marker, from, to));
            marker.marker.setPosition(to);

            //lock.unlock();
        }

        /**
         * Animates a markerWithPosition some time in the future, and removes it when the animation
         * is complete.
         *
         * @param marker the markerWithPosition to animate.
         * @param from   the position to animate from.
         * @param to     the position to animate to.
         */
        public void animateThenRemove(MarkerWithPosition marker, LatLng from, LatLng to) {
            //lock.lock();
//            AnimationTask animationTask = new AnimationTask(marker, from, to);
//            animationTask.removeOnAnimationComplete(mClusterManager.getMarkerManager());
//            mAnimationTasks.add(animationTask);
            marker.marker.setPosition(to);
            Cluster<T> cluster = mMarkerToCluster.get(marker.marker);
            mClusterToMarker.remove(cluster);
            mMarkerCache.remove(marker.marker);
            mMarkerToCluster.remove(marker.marker);
            mClusterManager.getMarkerManager().remove(marker.marker);
            //lock.unlock();
        }

        @Override
        public void handleMessage(Message msg) {
            if (!mListenerAdded) {
                Looper.myQueue().addIdleHandler(this);
                mListenerAdded = true;
            }
            removeMessages(BLANK);

            lock.lock();
            try {

                // Perform up to 10 tasks at once.
                // Consider only performing 10 remove tasks, not adds and animations.
                // Removes are relatively slow and are much better when batched.
                //每次执行20个任务
                //分批次执行所有任务（增加、删除、动画），避免卡顿
                for (int i = 0; i < 10; i++) {
                    performNextTask();//执行下一个任务
                }

                if (!isBusy()) {
                    mListenerAdded = false;
                    //所有子线程全部执行完成，移除idle接口
                    Looper.myQueue().removeIdleHandler(this);
                    // 唤醒所有等待的线程
                    busyCondition.signalAll();
                } else {
                    // Sometimes the idle queue may not be called - schedule up some work regardless
                    // of whether the UI thread is busy or not.
                    // TODO: try to remove this.
                    sendEmptyMessageDelayed(BLANK, 10);
                }
            } finally {
                lock.unlock();
            }
        }

        /**
         * Perform the next task. Prioritise any on-screen work.
         */
        private void performNextTask() {
            if (!mOnScreenRemoveMarkerTasks.isEmpty()) {
                removeMarker(mOnScreenRemoveMarkerTasks.poll());
            } else if (!mRemoveMarkerTasks.isEmpty()) {
                removeMarker(mRemoveMarkerTasks.poll());
            }
//            else if (!mAnimationTasks.isEmpty()) {
//                mAnimationTasks.poll().perform();
//            }
            else if (!mOnScreenCreateMarkerTasks.isEmpty()) {
                mOnScreenCreateMarkerTasks.poll().perform(this);
            } else if (!mCreateMarkerTasks.isEmpty()) {
                mCreateMarkerTasks.poll().perform(this);
            }
        }

        private void removeMarker(Marker m) {
            Cluster<T> cluster = mMarkerToCluster.get(m);
            mClusterToMarker.remove(cluster);
            mMarkerCache.remove(m);
            mMarkerToCluster.remove(m);
            mClusterManager.getMarkerManager().remove(m);
        }

        /**
         * @return 是否执行完所有任务
         */
        public boolean isBusy() {
            try {
                lock.lock();
                return !(mCreateMarkerTasks.isEmpty() && mOnScreenCreateMarkerTasks.isEmpty()
                        && mOnScreenRemoveMarkerTasks.isEmpty() && mRemoveMarkerTasks.isEmpty()
                        && mAnimationTasks.isEmpty());
            } finally {
                lock.unlock();
            }
        }

        /**
         * Blocks the calling thread until all work has been processed.
         */
        public void waitUntilFree() {
            while (isBusy()) {
                // Sometimes the idle queue may not be called - schedule up some work regardless
                // of whether the UI thread is busy or not.
                // TODO: try to remove this.
                sendEmptyMessage(BLANK);
                lock.lock();
                try {
                    if (isBusy()) {
                        busyCondition.await();
                    }
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                } finally {
                    lock.unlock();
                }
            }
        }

        @Override
        public boolean queueIdle() {
            // When the UI is not busy, schedule some work.
            sendEmptyMessage(BLANK);
            return true;
        }
    }

    /**
     * A cache of markers representing individual ClusterItems.
     */
    private static class MarkerCache<T> {
        private Map<T, Marker> mCache = new HashMap<T, Marker>();
        private Map<Marker, T> mCacheReverse = new HashMap<Marker, T>();

        public Marker get(T item) {
            return mCache.get(item);
        }

        public T get(Marker m) {
            return mCacheReverse.get(m);
        }

        public void put(T item, Marker m) {
            mCache.put(item, m);
            mCacheReverse.put(m, item);
        }

        public void remove(Marker m) {
            T item = mCacheReverse.get(m);
            mCacheReverse.remove(m);
            mCache.remove(item);
        }
    }

    /**
     * Called before the marker for a ClusterItem is added to the map.
     */
    protected void onBeforeClusterItemRendered(T item, MarkerOptions markerOptions) {
    }

    /**
     * Called before the marker for a Cluster is added to the map.
     * The default implementation draws a circle with a rough count of the number of items.
     */
    /**
     * 聚合图标渲染准备工作
     * @param cluster
     * @param markerOptions
     * @param bucket
     */
    protected void onBeforeClusterRendered(Cluster<T> cluster, MarkerOptions markerOptions, int bucket) {
//        int bucket = getBucket(cluster);
//        BitmapDescriptor descriptor = mIcons.get(bucket);
//        if (descriptor == null) {
//            mColoredCircleBackground.getPaint().setColor(getColor(bucket));
//            descriptor = BitmapDescriptorFactory.fromBitmap(mIconGenerator.makeIcon(getClusterText(bucket)));
//            mIcons.put(bucket, descriptor);
//        }
//        // TODO: consider adding anchor(.5, .5) (Individual markers will overlap more often)
//        markerOptions.icon(descriptor);


        // int bucket = getBucket(cluster);
        BitmapDescriptor descriptor = mIcons.get(bucket);
        if (descriptor == null) {
//            mColoredCircleBackground.getPaint().setColor(getColor(bucket));
            mColoredCircleBackground.getPaint().setColor(0xff00FF00);
//            descriptor = BitmapDescriptorFactory.fromBitmap(mIconGenerator.makeIcon(getClusterText(bucket)));
            descriptor = mIconGenerator.makeIcons(bucket);
//            mIcons.put(bucket, descriptor);
        }
//        BitmapDescriptor bitmapDescriptor  = BitmapDescriptorFactory.fromResource(R.drawable.cluster);
        // TODO: consider adding anchor(.5, .5) (Individual markers will overlap more often)
        markerOptions.icon(descriptor);
    }

    /**
     * Called after the marker for a Cluster has been added to the map.
     */
    protected void onClusterRendered(Cluster<T> cluster, Marker marker) {
    }

    /**
     * Get the marker from a ClusterItem
     *
     * @param clusterItem ClusterItem which you will obtain its marker
     * @return a marker from a ClusterItem or null if it does not exists
     */
    public Marker getMarker(T clusterItem) {
        return mMarkerCache.get(clusterItem);
    }

    /**
     * Called after the marker for a ClusterItem has been added to the map.
     */
    protected void onClusterItemRendered(T clusterItem, Marker marker) {
    }

    /**
     * Get the marker from a Cluster
     *
     * @param cluster which you will obtain its marker
     * @return a marker from a cluster or null if it does not exists
     */
    public Marker getMarker(Cluster<T> cluster) {
        return mClusterToMarker.get(cluster);
    }

    /**
     * Get the ClusterItem from a marker
     *
     * @param marker which you will obtain its ClusterItem
     * @return a ClusterItem from a marker or null if it does not exists
     */
    public T getClusterItem(Marker marker) {
        return mMarkerCache.get(marker);
    }

    /**
     * Get the Cluster from a marker
     *
     * @param marker which you will obtain its Cluster
     * @return a Cluster from a marker or null if it does not exists
     */
    public Cluster<T> getCluster(Marker marker) {
        return mMarkerToCluster.get(marker);
    }

    /**
     * Creates markerWithPosition(s) for a particular cluster, animating it if necessary.
     */
    private class CreateMarkerTask {
        private final Cluster<T> cluster;
        private final Set<MarkerWithPosition> newMarkers;
        private final LatLng animateFrom;

        /**
         * @param c            the cluster to render.
         * @param markersAdded a collection of markers to append any created markers.
         * @param animateFrom  the location to animate the markerWithPosition from, or null if no
         *                     animation is required.
         */
        public CreateMarkerTask(Cluster<T> c, Set<MarkerWithPosition> markersAdded, LatLng animateFrom) {
            this.cluster = c;
            this.newMarkers = markersAdded;
            this.animateFrom = animateFrom;
        }

        private void perform(MarkerModifier markerModifier) {
            // Don't show small clusters. Render the markers inside, instead.
            if (!shouldRenderAsCluster(cluster)) {
                for (T item : cluster.getItems()) {
                    Marker marker = mMarkerCache.get(item);
                    MarkerWithPosition markerWithPosition;
                    if (marker == null) {
                        MarkerOptions markerOptions = new MarkerOptions();
                        if (animateFrom != null) {
                            markerOptions.position(animateFrom);
                            markerOptions.icon(item.getBitmapDescriptor());
                            Bundle bundle = new Bundle();
                            bundle.putString("marketId", item.getInfoMarkerId());
                            markerOptions.extraInfo(bundle);
                        } else {
                            markerOptions.position(item.getPosition());
                            markerOptions.icon(item.getBitmapDescriptor());
                            Bundle bundle = new Bundle();
                            bundle.putString("marketId", item.getInfoMarkerId());
                            markerOptions.extraInfo(bundle);
                        }
                        //Log.i("===perform===",markerOptions.getPosition().toString()+"");
                        //Log.i("===perform===",item.getInfoMarkerId()+"");
                        //onBeforeClusterItemRendered(item, markerOptions);
                        marker = mClusterManager.getMarkerCollection().addMarker(markerOptions);
                        markerWithPosition = new MarkerWithPosition(marker);
                        mMarkerCache.put(item, marker);
                        if (animateFrom != null) {
                            //markerModifier.animate(markerWithPosition, animateFrom, item.getPosition());
                            marker.setPosition(item.getPosition());
                            //Log.i("===perform===2",markerOptions.getPosition().toString()+"");
                            //Log.i("===perform===2",item.getInfoMarkerId()+"");
                        }
                    } else {
                        markerWithPosition = new MarkerWithPosition(marker);
                    }
                    onClusterItemRendered(item, marker);
                    newMarkers.add(markerWithPosition);
                }
                return;
            }

            Set<T> items = cluster.getItems();
            Set<MonitorInfo> monitorInfos = Collections.synchronizedSet(new HashSet<MonitorInfo>());
            for (T t : items) {
                if (t.getInfoMonitor() != null) {
                    monitorInfos.add(t.getInfoMonitor());
                } else {

                }
            }

            if (monitorInfos.size() == 0) {
                return;
            }

            MarkerOptions markerOptions = new MarkerOptions()
                    .position(animateFrom == null ? cluster.getPosition() : animateFrom);
            onBeforeClusterRendered(cluster, markerOptions, monitorInfos.size());
            //Log.i("===perform===3",markerOptions.getPosition().toString()+"");
            Marker marker = mClusterManager.getClusterMarkerCollection().addMarker(markerOptions);

            Bundle bundle = new Bundle();
            bundle.putCharSequence("monitorInfos", JSON.toJSONString(monitorInfos));
            marker.setExtraInfo(bundle);
            marker.setToTop();
            mMarkerToCluster.put(marker, cluster);
            mClusterToMarker.put(cluster, marker);
            MarkerWithPosition markerWithPosition = new MarkerWithPosition(marker);
            if (animateFrom != null) {
                //markerModifier.animate(markerWithPosition, animateFrom, cluster.getPosition());
                marker.setPosition(cluster.getPosition());
            }
            onClusterRendered(cluster, marker);
            newMarkers.add(markerWithPosition);
        }
    }

    /**
     * A Marker and its position. Marker.getPosition() must be called from the UI thread, so this
     * object allows lookup from other threads.
     */
    private static class MarkerWithPosition {
        private final Marker marker;
        private LatLng position;

        private MarkerWithPosition(Marker marker) {
            this.marker = marker;
            position = marker.getPosition();
        }

        @Override
        public boolean equals(Object other) {
            if (other instanceof MarkerWithPosition) {
                return marker.equals(((MarkerWithPosition) other).marker);
            }
            return false;
        }

        @Override
        public int hashCode() {
            return marker.hashCode();
        }
    }

    private static final TimeInterpolator ANIMATION_INTERP = new DecelerateInterpolator();

    /**
     * Animates a markerWithPosition from one position to another. TODO: improve performance for
     * slow devices (e.g. Nexus S).
     */
    @TargetApi(Build.VERSION_CODES.HONEYCOMB_MR1)
    private class AnimationTask extends AnimatorListenerAdapter implements ValueAnimator.AnimatorUpdateListener {
        private final MarkerWithPosition markerWithPosition;
        private final Marker marker;
        private final LatLng from;
        private final LatLng to;
        private boolean mRemoveOnComplete;
        private MarkerManager mMarkerManager;

        private AnimationTask(MarkerWithPosition markerWithPosition, LatLng from, LatLng to) {
            this.markerWithPosition = markerWithPosition;
            this.marker = markerWithPosition.marker;
            this.from = from;
            this.to = to;
        }

        public void perform() {
            ValueAnimator valueAnimator = ValueAnimator.ofFloat(0, 1);
            valueAnimator.setInterpolator(ANIMATION_INTERP);
            valueAnimator.addUpdateListener(this);
            valueAnimator.addListener(this);
            valueAnimator.start();
        }

        @Override
        public void onAnimationEnd(Animator animation) {
            if (mRemoveOnComplete) {
                Cluster<T> cluster = mMarkerToCluster.get(marker);
                mClusterToMarker.remove(cluster);
                mMarkerCache.remove(marker);
                mMarkerToCluster.remove(marker);
                mMarkerManager.remove(marker);
            }
            markerWithPosition.position = to;
        }

        public void removeOnAnimationComplete(MarkerManager markerManager) {
            mMarkerManager = markerManager;
            mRemoveOnComplete = true;
        }

        @Override
        public void onAnimationUpdate(ValueAnimator valueAnimator) {
            float fraction = valueAnimator.getAnimatedFraction();
            double lat = (to.latitude - from.latitude) * fraction + from.latitude;
            double lngDelta = to.longitude - from.longitude;

            // Take the shortest path across the 180th meridian.
            if (Math.abs(lngDelta) > 180) {
                lngDelta -= Math.signum(lngDelta) * 360;
            }
            double lng = lngDelta * fraction + from.longitude;
            LatLng position = new LatLng(lat, lng);
            marker.setPosition(position);
        }
    }
}
