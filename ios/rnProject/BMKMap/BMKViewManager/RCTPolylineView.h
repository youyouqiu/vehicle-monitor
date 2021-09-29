//
//  RCTPolylineView.h
//  rnProject
//
//  Created by 敖祥华 on 2018/8/16.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <BaiduMapAPI_Map/BMKPointAnnotation.h>
#import <React/RCTViewManager.h>
#import <BaiduMapAPI_Map/BMKPolyline.h>
#import <BaiduMapAPI_Map/BMKPolylineView.h>
#import <BaiduMapAPI_Map/BMKMapView.h>

@interface RCTPolylineView : NSObject<BMKMapViewDelegate>

-(instancetype)initWithMapView:(BMKMapView*)view;

-(void)setOverlayPoints:(NSArray *)points;

@end
