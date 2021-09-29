/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.map.clusterutil.clustering.algo;


import com.zwf3lbs.map.clusterutil.clustering.Cluster;
import com.zwf3lbs.map.clusterutil.clustering.ClusterItem;

import java.util.Set;

/**
 * Logic for computing clusters
 */
public interface Algorithm<T extends ClusterItem> {
    void addItem(T item);

    void addItems(Set<T> items);

    void clearItems();

    void removeItem(T item);

    Set<? extends Cluster<T>> getClusters(double zoom);

    Set<T> getItems();
}