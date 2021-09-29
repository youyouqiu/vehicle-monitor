//
//  SportBMKAnnotation.h
//  rnProject
//
//  Created by 敖祥华 on 2018/9/16.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <BaiduMapAPI_Map/BMKPointAnnotation.h>

@interface SportBMKAnnotation : BMKPointAnnotation

@property (nonatomic, copy) NSString *icon;
// 标注物类型
// start 起点
// end 终点
// monitor 监控对象
@property (nonatomic, copy) NSString *type;
@property (nonatomic, assign) double lng;
@property (nonatomic, assign) double lat;
// 标记是否手动更改mappoint
@property (nonatomic, assign) BOOL mapPointType;

@end
