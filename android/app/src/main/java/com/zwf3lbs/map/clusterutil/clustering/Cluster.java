/*
 * Copyright (C) 2015 Baidu, Inc. All Rights Reserved.
 */

package com.zwf3lbs.map.clusterutil.clustering;


import com.baidu.mapapi.model.LatLng;

import java.util.Set;

/**
 * A collection of ClusterItems that are nearby each other.
 */
public interface Cluster<T extends ClusterItem> {
    public LatLng getPosition();

    Set<T> getItems();

    int getSize();
}