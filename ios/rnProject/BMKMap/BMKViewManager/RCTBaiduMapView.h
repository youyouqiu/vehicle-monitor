//
//  RCTBaiduMapView.h
//  rnProject
//
//  Created by 敖祥华 on 2018/8/14.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import <BaiduMapAPI_Map/BMKMapView.h>
#import <BaiduMapAPI_Map/BMKPinAnnotationView.h>
#import <BaiduMapAPI_Map/BMKPointAnnotation.h>
#import <BaiduMapAPI_Search/BMKGeocodeSearch.h>
#import <BaiduMapAPI_Search/BMKRouteSearch.h>
// #import <BaiduMapAPI_Location/BMKLocationComponent.h>
#import <BMKLocationKit/BMKLocationComponent.h>
#import <UIKit/UIKit.h>
#import <BaiduMapAPI_Map/BMKPolyline.h>
#import "BMKClusterManager.h"

@interface RCTBaiduMapView : BMKMapView<BMKMapViewDelegate, BMKGeoCodeSearchDelegate, BMKRouteSearchDelegate, CLLocationManagerDelegate, BMKLocationManagerDelegate>

//@property (nonatomic, assign) CLLocationCoordinate2D startNaviPoint;
//
//@property (nonatomic, assign) CLLocationCoordinate2D endNaviPoint;
@property (nonatomic, assign) int sgcer;

/**
 开启地图惯性缩放
 
 @param inertiaCoefficient 惯性系数，系数越小，惯性越小，越容易改变，系数越大，惯性越大，越不容易改变
 
 */
- (void)mapView:(BMKMapView *)mapView openMapInertiaDragWithCoefficient:(float)inertiaCoefficient;

/**
 阻尼效果改变地图等级
 
 @param currentLevel  当前的等级
 @param settingLevel  要设定的等级
 */
- (void)dampZoomingMapLevelFromCurrentValue:(float)currentLevel ToSettingValue:(float)settingLevel;

@end
