//
//  BMKMapViewAdapter.h
//  rnProject
//
//  Created by zwkj on 2018/10/29.
//  Copyright © 2018年 Facebook. All rights reserved.
//  专门处理百度地图运动特性的类

#import <Foundation/Foundation.h>
#import <BaiduMapAPI_Map/BMKMapComponent.h>

@interface BMKMapViewAdapter : NSObject

/**
 
 @param mapView mapView description
 @param inertiaCoefficient inertiaCoefficient description
 */
+ (void)mapView:(BMKMapView *)mapView openInertiaDragWithCoefficient:(float)inertiaCoefficient;


/**
 
 
 @param mapView mapView description
 @param close close description
 */
+ (void)mapView:(BMKMapView *)mapView closeMapInertialDrag:(BOOL)close;


/**
 Description
 
 @param mapView mapView description
 @param currentLevel currentLevel description
 @param settingLevel settingLevel description
 */
+ (void)mapView:(BMKMapView *)mapView dampZoomingMapLevelFromCurrentValue:(float)currentLevel ToSettingValue:(float)settingLevel;


@end
