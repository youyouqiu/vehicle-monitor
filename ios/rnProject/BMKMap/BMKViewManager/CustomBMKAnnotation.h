//
//  CustomBMKAnnotation.h
//  rnProject
//
//  Created by 敖祥华 on 2018/9/6.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <BaiduMapAPI_Map/BMKPointAnnotation.h>

@interface CustomBMKAnnotation : BMKPointAnnotation

@property (nonatomic, copy) NSString *icon;
@property (nonatomic, copy) NSString *markerId;
@property (nonatomic, copy) NSString *markerName;
@property (nonatomic, assign) int status;
@property (nonatomic, assign) BOOL tracking;
@property (nonatomic, copy) NSString *type;
@property (nonatomic, assign) int angle;
@property (nonatomic, copy) NSString *pointType;
@property (nonatomic, assign) double wakeLat;
@property (nonatomic, assign) double wakeLng;
@property (nonatomic, assign) double wakeLineStartLat;
@property (nonatomic, assign) double wakeLineStartLng;

@end
