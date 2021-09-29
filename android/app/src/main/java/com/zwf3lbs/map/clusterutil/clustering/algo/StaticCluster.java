/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.map.clusterutil.clustering.algo;

import com.baidu.mapapi.model.LatLng;
import com.zwf3lbs.map.clusterutil.clustering.Cluster;
import com.zwf3lbs.map.clusterutil.clustering.ClusterItem;

import java.util.HashSet;
import java.util.Set;

/**
 * A cluster whose center is determined upon creation.
 */
public class StaticCluster<T extends ClusterItem> implements Cluster<T> {
    private final LatLng mCenter;
    private final Set<T> mItems = new HashSet<>();

    public StaticCluster(LatLng center) {
        mCenter = center;
    }



    public boolean add(T t) {
        return mItems.add(t);
    }

    @Override
    public LatLng getPosition() {
        return mCenter;
    }

    public boolean remove(T t) {
        return mItems.remove(t);
    }

    @Override
    public Set<T> getItems() {
        return mItems;
    }

    @Override
    public int getSize() {
        return mItems.size();
    }

    @Override
    public String toString() {
        return "StaticCluster{"
                + "mCenter=" + mCenter
                + ", mItems.size=" + mItems.size()
                + '}';
    }
}