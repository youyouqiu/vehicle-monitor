//
//  RCTBaiduMapView.m
//  rnProject
//
//  Created by 敖祥华 on 2018/8/14.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RCTBaiduMapView.h"
#import "RCTPolylineView.h"
#import "AppDelegate.h"


// 轨迹平滑移动
#import "MovingAnnotationView.h"
#import "TracingPoint.h"
#import "JSONKit.h"
#import "CustomBMKAnnotation.h"
#import "SportBMKAnnotation.h"
#import <objc/runtime.h>
#import "BMKMapViewAdapter.h"
#import "MyLocation.h"
#import "GPSNaviViewController.h"
#import "BMKLocalSyncTileLayer.h"
#import "BDStopAnnotation.h"
#import "BDStopAnnotationSearcher.h"

// 颜色16进制转rgb宏
#define UIColorFromHex(s) [UIColor colorWithRed:(((s & 0xFF0000) >> 16 )) / 255.0 green:((( s & 0xFF00 ) >> 8 )) / 255.0 blue:(( s & 0xFF )) / 255.0 alpha:1.0]
#define pi 3.14159265358979323846
#define radiansToDegrees(x) (180.0 * x / pi)
#define latSpan 0.001784
#define lngSpan 0.008542

/*
 *点聚合Annotation
 */
@interface ClusterAnnotation : BMKPointAnnotation

///所包含annotation个数
@property (nonatomic, assign) NSInteger size;
@property (nonatomic, assign) NSMutableArray *clusterPointsInfo;

@end

@implementation ClusterAnnotation

@synthesize size = _size;
@synthesize clusterPointsInfo = _clusterPointsInfo;

@end

/**
 * 长按
 */
@interface RCTLongPress:UILongPressGestureRecognizer

@property (nonatomic, assign) NSMutableArray *data;

@end

@implementation RCTLongPress

@synthesize data = _data;

@end

@interface RouteAnnotation : BMKPointAnnotation
{
  int _type; //0:起点 1：终点 2：公交 3：地铁 4：驾乘 5：途经点
  int _degree;
}

@property (nonatomic) int type;
@property (nonatomic) int degree;
@end

@implementation RouteAnnotation

@synthesize type = _type;
@synthesize degree = _degree;

@end

@interface RCTBaiduMapView()

@property (nonatomic, assign) int bMapType;
@property (nonatomic, strong) NSArray* markers;
@property (nonatomic, strong) NSArray* videoMarker;
@property (nonatomic, strong) NSArray* overlayPoints;
// 驾车路线规划
@property (nonatomic, strong) NSArray* routePlan;
// 保存路线规划终点信息
@property (nonatomic, strong) NSArray *planData;
@property (nonatomic, strong) BMKRouteSearch* routeSearch;
@property (nonatomic, strong) BMKMapView* mapView;
// @property (nonatomic, strong) NSMutableDictionary* annotations;
// 设置需要在地图中心点显示标注点id
@property (nonatomic, strong) NSString* centerPoint;
/**
 * 保存中心点的监控对象id
 */
@property (nonatomic, strong) NSString* centerMonitorId;
// 实时监控标注物
@property (nonatomic, strong) NSMutableDictionary* realTimeAnnotations;
// 保存所有监控对象位置信息
@property (nonatomic, strong) NSMutableDictionary* markesInfo;
// 保存区域内监控对象位置信息
@property (nonatomic, strong) NSMutableDictionary* inAreaMarkers;
// 保存区域外监控对象位置信息
@property (nonatomic, strong) NSMutableDictionary* outAreaMarkers;
// 保存标注点图片
@property (nonatomic, strong) NSMutableDictionary* optionsIcon;

// 保存paopaoview对象
@property (nonatomic, strong) NSMutableDictionary* paopaoViewInfo;
// 保存地图可视区域范围
@property (nonatomic, strong) NSMutableArray* mapAreaScope;
@property (nonatomic, assign) BOOL locationManager;

@property (nonatomic, strong) BMKLocationManager* locService;
@property (nonatomic, strong) CLHeading* userHeading;

@property (nonatomic, strong) BMKClusterManager* clusterManager;//点聚合管理类

// 设置聚焦跟踪标注物
@property (nonatomic, copy) NSString* pointTracking;
// 保存聚焦跟踪标注物id
// @property (nonatomic, copy) NSString* trackingMonitorId;

// 轨迹回放
@property (nonatomic, assign) NSArray* sportPath;
// 轨迹回放播放控制
@property (nonatomic, assign) BOOL sportPathPlay;
// 轨迹回放标注物是否已经播放过
@property (nonatomic, assign) BOOL sportPlayed;
// 轨迹播放速度
@property (nonatomic, assign) double playBackSpeed;
// 设置轨迹回放播放速度
@property (nonatomic, assign) double sportSpeed;
// 设置轨迹回放当前位置点
@property (nonatomic, assign) NSArray* sportIndex;

// 保存轨迹回放的点信息
@property (nonatomic, strong) NSMutableDictionary* tracking;

// 点击地图事件
@property (nonatomic, copy) RCTBubblingEventBlock onMapClick;
// 返回位置信息事件
@property (nonatomic, copy) RCTBubblingEventBlock onAddress;
// 返回区域内标注物信息
@property (nonatomic, copy) RCTBubblingEventBlock onInAreaOptions;

// 删除指定id的标注物
@property (nonatomic, copy) NSString *removeAnnotation;

// 保存当前位置信息
@property (nonatomic, assign) CLLocationCoordinate2D currentLocation;

// 获取当前位置信息成功后回调函数
@property (nonatomic, copy) RCTBubblingEventBlock onLocationSuccess;

// 设置实时尾迹
@property (nonatomic, assign) BOOL realTimeWake;
// 是否为实时尾迹类型
@property (nonatomic, assign) BOOL wakeTyPe;
// 路径规划成功后距离返回事件
@property (nonatomic, copy) RCTBubblingEventBlock onPlanDistance;
// 地图初始化完成事件
@property (nonatomic, copy) RCTBubblingEventBlock onMapInitFinish;
//实时追踪当前定位
@property (nonatomic, assign) BOOL trackCurrentLocation;
// 实时追踪目标定位
@property (nonatomic, assign) BOOL trackTargetLocation;
//实时追踪当前定位
@property (nonatomic, assign) BOOL wakeCurrentLocation;
// 实时追踪目标定位
@property (nonatomic, assign) BOOL wakeTargetLocation;
// 实时尾迹
@property (nonatomic, assign) NSArray* wakeData;
// 保存当前实时尾迹监控对象的id
@property (nonatomic, copy) NSString *wakeMonitorId;
// 保存实时尾迹数据集合
@property (nonatomic, strong) NSMutableArray* wakeCoordinate;
@property (nonatomic, strong) NSMutableArray* wakeAllCoordinate;
// 位置信息查询
@property (nonatomic, assign) NSArray* searchAddress;
// 放大地图
@property (nonatomic, assign) NSArray* mapAmplification;
// 缩小地图
@property (nonatomic, assign) NSArray* mapNarrow;
// 点击地图标注物事件
@property (nonatomic, copy) RCTBubblingEventBlock onPointClickEvent;
// 定位监控对象，进行居中显示
@property (nonatomic, assign) NSArray* monitorFocus;
// 记录地图层级
@property (nonatomic, assign) BOOL clusterState; // zoomNumber;
// 聚合数量
@property (nonatomic, assign) int aggrNum;
@property (nonatomic, assign) int clusterNumer;
/**
 * 标明是否是主页
 */
@property (nonatomic, assign) BOOL isHome;
@property (nonatomic, assign) BOOL isHomeState;

// 点名下发功能
@property (nonatomic, assign) NSDictionary* latestLocation;
/**
 * 拒绝获取定位事件
 */
@property (nonatomic, copy) RCTBubblingEventBlock onLocationStatusDenied;
/**
 * 指南针是否开启
 */
@property (nonatomic, assign) BOOL compassOpenState;
@property (nonatomic, assign) BOOL compassState;
/**
 * 是否已经定位到用户当前位置
 */
@property (nonatomic, assign) BOOL userLocationState;
/**
 * 地图轨迹适配
 */
@property (nonatomic, assign) NSString* fitPolyLineSpan;
@property (nonatomic, assign) int fSpan;
/**
 * 地图实时追踪轨迹适配
 */
@property (nonatomic, assign) int trackPolyLineSpan;

/**
 * 声明处于哪个页面
 */
@property (nonatomic, copy) NSString* pageDet;

// 取消监控对象聚焦跟踪通知事件
@property (nonatomic, copy) RCTBubblingEventBlock onMonitorLoseFocus;

// 聚焦跟踪id
@property (nonatomic, copy) NSString *monitorFocusId;

// GCD定时器
@property (nonatomic, strong) dispatch_source_t timer;

//@property (nonatomic, copy) RCTBubblingEventBlock onGoLatestPoinEvent;

// 更新最新位置点
@property (nonatomic, strong) NSMutableArray* latestPoins;

// 聚合点长按事件
@property (nonatomic, copy) RCTBubblingEventBlock onClustersClickEvent;

// 历史数据停止点annotation
@property (nonatomic, strong) NSMutableDictionary* stopAnnotations;

// 历史数据停止点annotation view
@property (nonatomic, strong) NSMutableDictionary* stopAnnotationViews;

// 返回停止点位置信息事件
@property (nonatomic, copy) RCTBubblingEventBlock onStopPointDataEvent;

/**
 * 历史数据停止点当前高亮点位置
 */
@property (nonatomic, assign) int stopActiveIndex;

// 返回停止点index事件
@property (nonatomic, copy) RCTBubblingEventBlock onStopPointIndexEvent;
@property (nonatomic, strong) NSArray* speedPiecewise;
@property (nonatomic, assign) BOOL isShowChart;

// 主页标注物移动压点
@property (nonatomic, assign) BOOL dotType;
@property (nonatomic, assign) int dotValue;

// 轨迹回放轨迹线粗细
@property (nonatomic, assign) BOOL trajectoryType;
@property (nonatomic, assign) int trajectoryValue;

// 地图是否render
@property (nonatomic, assign) BOOL mapFinishRender;

// 轨迹回放-行驶过颜色加深线
@property (nonatomic, strong) BMKPolyline* playbackPolyline;
// 轨迹回放颜色加深线点集合
@property (nonatomic, strong) NSMutableArray* playbackPoints;

@end

// 轨迹平滑移动
@interface RCTBaiduMapView()<MovingAnnotationViewAnimateDelegate>
{
  SportBMKAnnotation *sportAnnotation;
  MovingAnnotationView *playBackSportAnnotationView;
  NSMutableArray *playBackTracking;
  NSMutableArray *playBackSportNodes;//轨迹点
  NSInteger playBackSportNodeNum;//轨迹点数
  NSInteger currentIndex;//当前结点
  BOOL sportState;// 当前轨迹运动状态
  BOOL changeState; // 当前轨迹点是否被改变
  BOOL isPlaying; // 轨迹是否在回放
  UIImage* potionImage;
}

@end

@implementation RCTBaiduMapView

-(instancetype)init
{
  self = [super init];
  if(self)
  {
    self.delegate = self;
  }
  return self;
}

-(void)willMoveToSuperview:(UIView *)newSuperview
{
  [super willMoveToSuperview:newSuperview];
  if(newSuperview)
  {
    [self viewWillAppear];
    self.delegate = self;
  }
  else
  {
    [self viewWillDisappear];
    self.delegate = nil;
  }
}

/**
 * 设置中心点
 */
-(void)centerLatLng:(NSDictionary *)LatLngObj
{
//  if (![_pageDet  isEqual: @"monitorVideo"] ) {
//    CGRect fRect = [self convertRect:self.frame toView:self];
//    CGFloat width = fRect.size.width * 0.5;
//    CGFloat height = fRect.size.height * 1 / 3;
//    [self setMapCenterToScreenPt:CGPointMake(width, height)];
//  }
  double lat = [RCTConvert double:LatLngObj[@"latitude"]];
  double lng = [RCTConvert double:LatLngObj[@"longitude"]];
  if (lat != 1000 && lng != 1000) {
    CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
    //  self.centerCoordinate = point;
    [self setCenterCoordinate:point];
    [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19 coordinate:point];
  }
}

/**
 * 设置地图类型
 */
-(void)setBMapType:(int)num
{
  if (num == 1) { // 标准地图
   [self setMapType:BMKMapTypeStandard];
  } else if (num == 2) { // 卫星地图
    [self setMapType:BMKMapTypeSatellite];
  }
}

/**
 *批量创建图标
 */
-(void)setMarkers:(NSArray *)markers
{
  double markersCount = [markers count];
  if (markersCount > 0) {
    if (_realTimeAnnotations == nil) {
      // 创建第一个标注物
      // 将第一条监控对象数据居中显示

      _realTimeAnnotations = [NSMutableDictionary dictionary];
      
      /**
       * 移动地图区域以触发事件创建可视区域范围内的监控对象
       */
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        CLLocationCoordinate2D coordinate = self.centerCoordinate;
        double coorlat = coordinate.latitude + 0.000001;
        double coorlng = coordinate.longitude + 0.000001;
        CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(coorlat, coorlng);
        [self setCenterCoordinate:coor animated:YES];
      });
      // 保存所有的监控对象信息
      if (_markesInfo == nil) {
        _markesInfo = [NSMutableDictionary dictionary];
      }
      for (int i = 0; i < markersCount; i++) {
        NSDictionary* thisMarkerOption = [markers objectAtIndex:i];
        double lat = [RCTConvert double:thisMarkerOption[@"latitude"]];
        double lng = [RCTConvert double:thisMarkerOption[@"longitude"]];
        if (!(lat == 1000 || lng == 1000)) {
          NSString* thisMarkerId = [RCTConvert NSString:thisMarkerOption[@"markerId"]];
          [_markesInfo setObject:thisMarkerOption forKey:thisMarkerId];
        } else {
          
        }
      }
    } else {
        CGRect fRect = [self convertRect:self.frame toView:self];
        NSArray *inAreaKeyArr = [_inAreaMarkers allKeys];
        for (int i = 0; i < markersCount; i++) {
          NSDictionary *option = [markers objectAtIndex:i];
          NSString *markerId = [RCTConvert NSString:option[@"markerId"]];
          NSArray *clusterArr = self.annotations;
          int m = 0;
          for (int j = 0; j < clusterArr.count; j++) {
            if ([clusterArr[j] isKindOfClass:[ClusterAnnotation class]]) {
              ClusterAnnotation *cluann = clusterArr[j];
              m = m + (int)cluann.size;
            }
          }
          
          if ((self.zoomLevel >= 14 && m < _clusterNumer) || self.zoomLevel >= 19) {
            double lat = [RCTConvert double:option[@"latitude"]];
            double lng = [RCTConvert double:option[@"longitude"]];
            
            CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lng);
            CGPoint cRect = [self convertCoordinate:coordinate toPointToView:self.mapView];
            
            int status = [RCTConvert int:option[@"status"]];
            // 判断对应点是否已经存在
            if ([inAreaKeyArr containsObject:markerId]) {
              // 更新监控对象状态
              MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:markerId];
              UIView* button = [[sportAnnotationView viewWithTag:111] viewWithTag:110];
              button.layer.backgroundColor = [self getStatus:(int)status].CGColor;
              
              NSMutableArray *values = [_inAreaMarkers objectForKey:markerId];
              if (values.count > 0) {
                // 判断经纬度是否相同
                NSDictionary * lastOption = [values lastObject];
                double lastLat = [RCTConvert double:lastOption[@"latitude"]];
                double lastLng = [RCTConvert double:lastOption[@"longitude"]];
                double valueCount = [values count];
                double oldTime = [lastOption[@"time"] doubleValue];
                double newTime = [option[@"time"] doubleValue];
                
                if(newTime > oldTime){
                  if (!(lastLat == lat && lastLng == lng)) {
                    [values addObject:option];
                    // 判断保存的标注位置点是否保存为2个，如果是两个就进行移动
                    if (values.count == 2) {
                      [self initSportNodes:markerId];
                    }
                  }else if(lastLat == lat && lastLng == lng){
                      // 两点位置相同时，更新位置上传时间
                      NSLog(@"打印 替换时队列长度,%lu",(unsigned long)values.count);
                      [values replaceObjectAtIndex:valueCount-1 withObject:option];
                  }
                }
              } else {
                [values addObject:option];
              }
            }
            else if (CGRectContainsPoint(fRect, cRect)) {
              CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
              [self addMarker:annotation option:option];
              [_realTimeAnnotations setObject:annotation forKey:markerId];
              NSMutableArray *values = [[NSMutableArray alloc] init];
              [values addObject:option];
              [_inAreaMarkers setObject:values forKey:markerId];
            } else {
              [_outAreaMarkers setObject:option forKey:markerId];
            }
          }
          // 保存在所有点集合中
          [_markesInfo setObject:option forKey:markerId];
        }
    }
  }
}

/**
 * 创建独立的标注物
 */
-(void)setVideoMarker:(NSArray *)videoMarker
{
  double markersCount = [videoMarker count];
  if (markersCount > 0) {
    if (_realTimeAnnotations == nil) {
      // 创建第一个标注物
      // 将第一条监控对象数据居中显示
      NSDictionary* option = [videoMarker firstObject];
      NSString* markerId = [RCTConvert NSString:option[@"markerId"]];
      // [self centerLatLng:option];
      
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
//      self.centerCoordinate = point;
      [self setCenterCoordinate:point animated:YES];
      self.zoomLevel = 17;
      
      CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
      [self addMarker:annotation option:option];
      
      annotation.tracking = YES;
      //if (_realTimeAnnotations == nil) {
      _realTimeAnnotations = [NSMutableDictionary dictionary];
      //}
      [_realTimeAnnotations setObject:annotation forKey:markerId];
      if (_inAreaMarkers == nil) {
        _inAreaMarkers = [NSMutableDictionary dictionary];
        NSMutableArray *values = [[NSMutableArray alloc] init];
        [values addObject:option];
        [_inAreaMarkers setObject:values forKey:markerId];
      }
    } else {
      NSArray *inAreaKeyArr = [_inAreaMarkers allKeys];
      NSDictionary *option = [videoMarker firstObject];
      NSString *markerId = [RCTConvert NSString:option[@"markerId"]];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];

      int status = [RCTConvert int:option[@"status"]];
      // 判断对应点是否已经存在
      if ([inAreaKeyArr containsObject:markerId]) {
        // 更新监控对象状态
        MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:markerId];
        UIView* button = [[sportAnnotationView viewWithTag:111] viewWithTag:110];
        button.layer.backgroundColor = [self getStatus:(int)status].CGColor;
        
        NSMutableArray *values = [_inAreaMarkers objectForKey:markerId];
        if (values.count > 0) {
          // 判断经纬度是否相同
          NSDictionary * lastOption = [values lastObject];
          double lastLat = [RCTConvert double:lastOption[@"latitude"]];
          double lastLng = [RCTConvert double:lastOption[@"longitude"]];
          if (!(lastLat == lat && lastLng == lng)) {
            [values addObject:option];
            // 判断保存的标注位置点是否保存为2个，如果是两个就进行移动
            if (values.count == 2) {
              [self initSportNodes:markerId];
            }
          }
        } else {
          [values addObject:option];
        }
      } else {
        CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:markerId];
        [self removeAnnotation:annotation];
        [_realTimeAnnotations removeObjectForKey:markerId];
        
        [self centerLatLng:option];
        CustomBMKAnnotation* newAnn = [[CustomBMKAnnotation alloc] init];
        [self addMarker:newAnn option:option];
        
        newAnn.tracking = YES;
        
        [_realTimeAnnotations setObject:newAnn forKey:markerId];
        
        NSMutableArray *values = [[NSMutableArray alloc] init];
        [values addObject:option];
        [_inAreaMarkers removeObjectForKey:markerId];
        [_inAreaMarkers setObject:values forKey:markerId];
      }
    }
  }
}

/**
 *地图区域改变完成后会调用此接口
 *@param mapview 地图View
 *@param animated 是否动画
 */
- (void)mapView:(BMKMapView *)mapView regionDidChangeAnimated:(BOOL)animated
{
  // [self.superview removeFromSuperview];
//  [self.superview addSubview:self.mapView];
  // 获取地图可视区域范围内经纬度
  
  CGRect fRect = [self convertRect:self.frame toView:self];

  if (_isHomeState) {
    if (_realTimeAnnotations != nil) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        // 区域内标注物信息清空
        if (self->_inAreaMarkers == nil) {
          self->_inAreaMarkers = [NSMutableDictionary dictionary];
        }
        
        if (self->_outAreaMarkers == nil) {
          self->_outAreaMarkers = [NSMutableDictionary dictionary];
        }
        
        // 区域外标注物信息清空
        
        NSArray* infos = [self->_markesInfo allValues];
        NSArray* inAreaKeyArr = [self->_inAreaMarkers allKeys];
        NSArray* outAreaKeyArr = [self->_outAreaMarkers allKeys];
        for (int i = 0; i < infos.count; i++) {
          NSDictionary* info = [infos objectAtIndex:i];
          double lat = [RCTConvert double:info[@"latitude"]];
          double lng = [RCTConvert double:info[@"longitude"]];
          NSString* markerId = [RCTConvert NSString:info[@"markerId"]];
          
          CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lng);
          CGPoint cRect = [self convertCoordinate:coordinate toPointToView:self.mapView];
          
          // if (lat > leftUpLat && lat < rightDownLat && lng > leftUpLng && lng < rightDownLng) {
          if (CGRectContainsPoint(fRect, cRect)) {
            // 区域内
            if (![inAreaKeyArr containsObject:markerId]) {
              // 区域改变后区域内不包含新的监控对象
              NSMutableArray *values = [[NSMutableArray alloc] init];
              [values addObject:info];
              [self->_inAreaMarkers setObject:values forKey:markerId];
//              // 判断区域内的点是否在区域外的集合中
//              if ([outAreaKeyArr containsObject:markerId]) {
//                [_outAreaMarkers removeObjectForKey:markerId];
//              }
            }
            // 判断区域内的点是否在区域外的集合中
            if ([outAreaKeyArr containsObject:markerId]) {
              [self->_outAreaMarkers removeObjectForKey:markerId];
            }
          } else {
            // 删除区域内集合中的点
            BOOL isArea = YES;
            if ([inAreaKeyArr containsObject:markerId]) {
              CustomBMKAnnotation *annotation = [self->_realTimeAnnotations objectForKey:markerId];
              CGPoint aRect = [self convertCoordinate:annotation.coordinate toPointToView:self.mapView];
              if (!CGRectContainsPoint(fRect, aRect)) {
                isArea = NO;
                [self->_inAreaMarkers removeObjectForKey:markerId];
              }
            }
            if (!isArea) {
              //增加区域外集合中没有的点
              if (![outAreaKeyArr containsObject:markerId]) {
                [self->_outAreaMarkers setObject:info forKey:markerId];
              }
            }
          }
        }
        // 创建标注
        // [self createOption:_inAreaMarkers];
        // }
        // 聚合与非聚合
        if ((self.zoomLevel >= 14 && self->_inAreaMarkers.count < self->_clusterNumer) || self.zoomLevel  >= 19) {
          if (self->_clusterState) {
            [self removeAnnotations:self.annotations];
            [self->_realTimeAnnotations removeAllObjects];
            self->_clusterState = NO;
          }
          [self createOption];
        } else {
          [self cancelMonitorFocus:self->_centerPoint];
          self->_clusterState = YES;
          [self createCluster];
        }
        // _zoomNumber = self.zoomLevel;
        // }
      });
    }
  }
}

/**
 * 创建区域范围内的标注物
 */
-(void)createOption
{
  // 首先删除不在区域内的标注物
  // 获取已创建标注id
  NSArray* markersIdArr = [_realTimeAnnotations allKeys];
  NSArray* inAreaKeyArr = [_inAreaMarkers allKeys];
  NSArray* outAreaKeyArr = [_outAreaMarkers allKeys];
  
  // 首先删除在区域外的已创建标注物
  for (int i = 0; i < markersIdArr.count; i++) {
    if ([outAreaKeyArr containsObject:markersIdArr[i]]) {
      CustomBMKAnnotation *annotation = [_realTimeAnnotations objectForKey:markersIdArr[i]];
      
//      if ([_centerPoint isEqualToString:markersIdArr[i]]) {
//        // [self cancelMonitorFocus:_centerPoint];
//      } else {
        // 先移除标注物动画
        [playBackSportAnnotationView removeLayer:annotation.coordinate];
        // [self removeAnnotation:annotation];
        [self removeAnnotation:annotation];
        [_paopaoViewInfo removeObjectForKey:markersIdArr[i]];
        [_realTimeAnnotations removeObjectForKey:markersIdArr[i]];
//      }
    }
  }
  
  // 然后创建区域内未创建的标注物
  for (int j = 0; j < inAreaKeyArr.count; j ++) {
    if (![markersIdArr containsObject:inAreaKeyArr[j]]) {
      NSMutableArray* msg = [_inAreaMarkers objectForKey:inAreaKeyArr[j]];
      NSDictionary* option = [msg objectAtIndex:0];
      CustomBMKAnnotation *annotation = [[CustomBMKAnnotation alloc] init];
      [self addMarker:annotation option:option];
      if (_monitorFocusId) {
        if ([_monitorFocusId isEqualToString:inAreaKeyArr[j]]) {
          // annotation.tracking = YES;
          [self createGCD:annotation];
//          _monitorFocusId = nil;
        }
      }
      [_realTimeAnnotations setObject:annotation forKey:inAreaKeyArr[j]];
    }
  }
  
  if (self.onInAreaOptions) {
    // self.onInAreaOptions(_inAreaMarkers);
    NSArray *arr = [_inAreaMarkers allKeys];
    self.onInAreaOptions(@{@"data":arr});
  }
}


/**
 *添加标注物
 */
-(void)addMarker:(CustomBMKAnnotation *)annotation option:(NSDictionary *)option
{
  [self updateMarker:annotation option:option];
  [self addAnnotation:annotation];
}

/**
 * 更新标注物位置信息
 */
-(void)updateMarker:(CustomBMKAnnotation *)annotation option:(NSDictionary *)option
{
  CLLocationCoordinate2D coor = [self getCoorFromMarkerOption:option];
  NSString *title = [RCTConvert NSString:option[@"title"]];
  NSString *markerIconUrl =[RCTConvert NSString:option[@"ico"]];
  NSString *markerId =[RCTConvert NSString:option[@"markerId"]];
  int status = [RCTConvert int:option[@"status"]];
  int angle = [RCTConvert int:option[@"angle"]];
  annotation.coordinate = coor;
  annotation.title = title;
  annotation.icon = markerIconUrl;
  annotation.markerId = markerId;
  annotation.status = status;
  annotation.tracking = false;
  annotation.angle = angle;
}

/**
 * 筛选数据，组装经纬度
 */
-(CLLocationCoordinate2D)getCoorFromMarkerOption:(NSDictionary *)option
{
  double lat = [RCTConvert double:option[@"latitude"]];
  double lng = [RCTConvert double:option[@"longitude"]];
  CLLocationCoordinate2D coor;
  coor.latitude = lat;
  coor.longitude = lng;
  return coor;
}

/**
 * 绘制线
 */
-(void)setOverlayPoints:(NSArray *)points
{
  CLLocationCoordinate2D* coor = malloc(sizeof(CLLocationCoordinate2D) * points.count);
  
  for (int i = 0; i < points.count; i++) {
    NSDictionary *option = [points objectAtIndex:i];
    double lat = [RCTConvert double:option[@"latitude"]];
    double lng = [RCTConvert double:option[@"longitude"]];
    coor[i].latitude = lat;
    coor[i].longitude = lng;
  }
  BMKPolyline* polyline = [BMKPolyline polylineWithCoordinates:coor count:points.count];
  [self addOverlay:polyline];
  
  free(coor);
  
}

/**
 * 添加线的属性
 */
- (BMKOverlayView *)mapView:(BMKMapView *)mapView viewForOverlay:(id <BMKOverlay>)overlay{
  if ([overlay isKindOfClass:[BMKPolyline class]]){
    BMKPolylineView* polylineView = [[BMKPolylineView alloc] initWithOverlay:overlay];
    [polylineView loadStrokeTextureImages:@[[UIImage imageNamed:@"icon_road_yellow_arrow"],
                                                       [UIImage imageNamed:@"icon_road_green_arrow"],
                                                       [UIImage imageNamed:@"icon_road_purple_arrow"],
                                                       [UIImage imageNamed:@"icon_road_blue_arrow"]]];
    if (playBackTracking.count > 0) { // 轨迹回放
      if (_trajectoryType) {
        polylineView.lineWidth = 2*_trajectoryValue;
      } else {
        polylineView.lineWidth = 4;
      }
    } else if (_wakeTyPe) {
      polylineView.lineWidth = 4;
    } else {
      polylineView.strokeColor = [UIColor blueColor];
      polylineView.lineWidth = 2.0;
    }
    polylineView.lineJoinType = kBMKLineJoinMiter;
    return polylineView;
  }
  if ([overlay isKindOfClass:[BMKTileLayer class]]) {
    BMKTileLayerView *view = [[BMKTileLayerView alloc] initWithTileLayer:overlay];
    return view;
  }
  return nil;
}

/**
 * 逆地理编码
 */
-(void)getAddress:(NSDictionary *)option
{
  double lat = [RCTConvert double:option[@"latitude"]];
  double lng = [RCTConvert double:option[@"longitude"]];
  NSString *type = [RCTConvert NSString:option[@"type"]];
  if ([type isEqualToString:@"stopPoint"]) {
    NSString *index = [[option objectForKey:@"index"] stringValue]; // [RCTConvert NSString:option[@"index"]];
    BDStopAnnotationSearcher* searcher =[[BDStopAnnotationSearcher alloc] init];
    searcher.tag = [index intValue];
    searcher.delegate = self;
    CLLocationCoordinate2D pt = (CLLocationCoordinate2D){lat, lng};
    BMKReverseGeoCodeSearchOption *reverseGeoCodeSearchOption = [[BMKReverseGeoCodeSearchOption alloc] init];
    reverseGeoCodeSearchOption.location = pt;
    BOOL flag = [searcher reverseGeoCode:reverseGeoCodeSearchOption];
    if(flag)
    {
      NSLog(@"反geo检索发送成功");
    }
    else
    {
      NSLog(@"反geo检索发送失败");
    }
  } else {
    BMKGeoCodeSearch* searcher =[[BMKGeoCodeSearch alloc] init];
    searcher.delegate = self;
    CLLocationCoordinate2D pt = (CLLocationCoordinate2D){lat, lng};
    BMKReverseGeoCodeSearchOption *reverseGeoCodeSearchOption = [[BMKReverseGeoCodeSearchOption alloc] init];
    reverseGeoCodeSearchOption.location = pt;
    BOOL flag = [searcher reverseGeoCode:reverseGeoCodeSearchOption];
    if(flag)
    {
      NSLog(@"反geo检索发送成功");
    }
    else
    {
      NSLog(@"反geo检索发送失败");
    }
  }
}

//实现Deleage处理回调结果
//接收反向地理编码结果
- (void)onGetReverseGeoCodeResult:(BMKGeoCodeSearch *)searcher result:(BMKReverseGeoCodeSearchResult *)result errorCode:(BMKSearchErrorCode)error{
  if (error == BMK_SEARCH_NO_ERROR) {
    NSString* address = [result.address stringByAppendingString:result.sematicDescription];
    if ([searcher isKindOfClass:[BDStopAnnotationSearcher class]]) {
      BDStopAnnotationSearcher *stopSearcher = (BDStopAnnotationSearcher *)searcher;
      NSDictionary *data = @{@"address":address, @"index": @(stopSearcher.tag)};
      [self stopPointAddressCallBack:data];
    } else {
      // 轨迹回放的逆地理编码
      [self addressCallBack:address];
    }
  }
  else {
    NSLog(@"抱歉，未找到结果");
    [self addressCallBack:@"抱歉，未找到结果"];
  }
}

/**
 * 路线规划
 */
-(void)setRoutePlan:(NSArray *)points
{
  if (points.count > 0) {
    CLAuthorizationStatus stateInfo = [CLLocationManager authorizationStatus];
    if (stateInfo == kCLAuthorizationStatusDenied) { // 拒绝获取定位
      if (self.onLocationStatusDenied) {
        self.onLocationStatusDenied(@{@"data": @"true"});
      }
    } else {
      AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      _planData = points;
      //初始化检索对象
      _routeSearch = [[BMKRouteSearch alloc] init];
      _routeSearch.delegate = self;
      
      BMKPlanNode* start = [[BMKPlanNode alloc]init];
      CLLocationCoordinate2D startPt = _currentLocation;
      start.pt = startPt;
      BMKPlanNode* end = [[BMKPlanNode alloc]init];
      NSDictionary *endPoint = [points objectAtIndex:0];
      CLLocationCoordinate2D endPt = [self getCoorFromMarkerOption:endPoint];
      // 导航终点经纬度
      delegate.endNaviPoint = [self bdToGaodeWithLat:endPt.latitude andLon:endPt.longitude]; //endPt;
      end.pt = endPt;
      BMKDrivingRoutePlanOption *drivingRouteSearchOption = [[BMKDrivingRoutePlanOption alloc] init];
      drivingRouteSearchOption.from = start;
      drivingRouteSearchOption.to = end;
      drivingRouteSearchOption.drivingRequestTrafficType = BMK_DRIVING_REQUEST_TRAFFICE_TYPE_NONE;//不获取路况信息
      
      BOOL flag = [_routeSearch drivingSearch:drivingRouteSearchOption];
      if(flag)
      {
        NSLog(@"car检索发送成功");
      }
      else
      {
        NSLog(@"car检索发送失败");
      }
    }
  }
}

/**
 *返回驾乘搜索结果
 *@param searcher 搜索对象
 *@param result 搜索结果，类型为BMKDrivingRouteResult
 *@param error 错误号，@see BMKSearchErrorCode
 */
- (void)onGetDrivingRouteResult:(BMKRouteSearch*)searcher result:(BMKDrivingRouteResult*)result errorCode:(BMKSearchErrorCode)error
{
  [self removeAnnotations:self.annotations];
  [self removeOverlays:self.overlays];
  
  if (error == BMK_SEARCH_NO_ERROR) {
    //成功获取结果
    //表示一条驾车路线
    BMKDrivingRouteLine* plan = (BMKDrivingRouteLine*)[result.routes objectAtIndex:0];
    
    // 返回给js端路线规划距离
    NSNumber *distance = [NSNumber numberWithInt:plan.distance];
    // int distance = plan.distance;
    if (self.onPlanDistance) {
      self.onPlanDistance(@{@"data": distance});
    }
    
    // 计算路线方案中的路段数目
    int size = (int)[plan.steps count];
    int planPointCounts = 0;
    for (int i = 0; i < size; i++) {
      //表示驾车路线中的一个路段
      BMKDrivingStep* transitStep = [plan.steps objectAtIndex:i];
//      if(i == 0){
//        SportBMKAnnotation *startPoint = [[SportBMKAnnotation alloc] init];
//        startPoint.coordinate = _currentLocation; // plan.starting.location;
//        startPoint.type = @"start";
//        [self addAnnotation:startPoint];
//      } else
      if(i == size-1){
        NSDictionary *planEndData = [_planData objectAtIndex:0];
        CLLocationCoordinate2D endLocation = [self getCoorFromMarkerOption:planEndData];
        
        SportBMKAnnotation *endPoint = [[SportBMKAnnotation alloc] init];
        endPoint.coordinate = endLocation;
        endPoint.type = @"end";
        [self addAnnotation:endPoint];
        
        CustomBMKAnnotation* monitorPoint = [[CustomBMKAnnotation alloc] init];
        
         [self addMarker:monitorPoint option:planEndData];
         monitorPoint.type = @"monitor";
      }
      //轨迹点总数累计
      planPointCounts += transitStep.pointsCount;
    }
    
    //轨迹点
    BMKMapPoint* temppoints = malloc(sizeof(BMKMapPoint) * planPointCounts);
    
    int i = 0;
    for (int j = 0; j < size; j++) {
      BMKTransitStep *transitStep = [plan.steps objectAtIndex:j];
      int k = 0;
      for (k = 0; k < transitStep.pointsCount; k++) {
        temppoints[i].x = transitStep.points[k].x;
        temppoints[i].y = transitStep.points[k].y;
        i++;
      }
    }
    
    // 通过points构建BMKPolyline
    BMKPolyline* polyLine = [BMKPolyline polylineWithPoints:temppoints count:planPointCounts];
    [self addOverlay:polyLine]; // 添加路线overlay
    if (_trackPolyLineSpan) {
      if (_trackTargetLocation == NO && _trackCurrentLocation == NO) {
        [self mapViewFitPolyLine:polyLine bottomSpan:_trackPolyLineSpan];
      }
    } else {
      CGPoint scale = self.mapScaleBarPosition;
      [self mapViewFitPolyLine:polyLine bottomSpan: self.frame.size.height - scale.y];
    }
    free(temppoints);
  } else {
    //检索失败
  }
}

/**
 * 定位
 */
-(void)setLocationManager:(BOOL)flag
{
  if (flag) {
    _userLocationState = NO;
    CLAuthorizationStatus stateInfo = [CLLocationManager authorizationStatus];
    if (stateInfo == kCLAuthorizationStatusDenied) { // 拒绝获取定位
      if (self.onLocationStatusDenied) {
        self.onLocationStatusDenied(@{@"data": @"true"});
      }
    }
//    else if (stateInfo == kCLAuthorizationStatusNotDetermined) {
//
//    }
    else {
      //自定义精度圈
      BMKLocationViewDisplayParam *param = [[BMKLocationViewDisplayParam alloc] init];
      //线
      param.accuracyCircleStrokeColor = [UIColor colorWithRed:0 green:0 blue:1 alpha:0.5];
      //圈
      //    param.accuracyCircleFillColor = [UIColor colorWithRed:0 green:0 blue:1 alpha:0.2];
      [self updateLocationViewWithParam:param];
      [self setZoomLevel:17];

      //初始化BMKLocationService
      _locService = [[BMKLocationManager alloc] init];
      _locService.delegate = self;
      
      
      //设置返回位置的坐标系类型
      _locService.coordinateType = BMKLocationCoordinateTypeBMK09LL;
      //设置距离过滤参数
      _locService.distanceFilter = kCLDistanceFilterNone;
      //设置预期精度参数
      _locService.desiredAccuracy = kCLLocationAccuracyBest;
      //设置应用位置类型
      _locService.activityType = CLActivityTypeAutomotiveNavigation;
      //设置是否自动停止位置更新
      _locService.pausesLocationUpdatesAutomatically = NO;
      //设置是否允许后台定位
      _locService.allowsBackgroundLocationUpdates = YES;
      //设置位置获取超时时间
      _locService.locationTimeout = 10;
      //设置获取地址信息超时时间
      _locService.reGeocodeTimeout = 10;
      
      
      //启动LocationService
      [_locService startUpdatingLocation];
      if ([BMKLocationManager headingAvailable]) {
        [_locService startUpdatingHeading];
      }
      self.showsUserLocation = NO;//先关闭显示的定位图层
      self.userTrackingMode = BMKUserTrackingModeHeading;//设置定位的状态
      self.showsUserLocation = YES;//显示定位图层
      // 取消聚焦跟踪
      [self cancelMonitorFocus:_centerPoint];
    }
  } else {
    if (_locService != nil) {
      [_locService stopUpdatingLocation];
    }
  }
}

/**
 *在地图View将要启动定位时，会调用此函数
 *地图View
 */
//- (void)willStartLocatingUser
//{
//  //    NSLog(@"start locate");
//}

/**
 *用户方向更新后，会调用此函数
 *@param userLocation 新的用户位置
 */
- (void)BMKLocationManager:(BMKLocationManager * _Nonnull)manager
          didUpdateHeading:(CLHeading * _Nullable)heading
{
  _userHeading = heading;
}

/**
 *用户位置更新后，会调用此函数
 *@param userLocation 新的用户位置
 */

- (void)BMKLocationManager:(BMKLocationManager * _Nonnull)manager didUpdateLocation:(BMKLocation * _Nullable)location orError:(NSError * _Nullable)error

{
  if (error)
  {
    //NSLog(@"locError:{%ld - %@};", (long)error.code, error.localizedDescription);
  } if (location) {//得到定位信息，添加annotation
    if (location.location) {
      //NSLog(@"LOC = %@",location.location);
    }
    if (location.rgcData) {
      //NSLog(@"rgc = %@",[location.rgcData description]);
    }
    MyLocation * loc = [[MyLocation alloc] initWithLocation:location.location withHeading:_userHeading];
    [self updateLocationData:loc];
    if (!_userLocationState) {
      [self setCenterCoordinate:loc.location.coordinate animated:YES];
      _userLocationState = YES;
    }
    
    // 定位成功后返回给js端
    if (self.onLocationSuccess) {
      NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
      NSNumber *lat = [[NSNumber alloc] initWithDouble:loc.location.coordinate.latitude];
      NSNumber *lng = [[NSNumber alloc] initWithDouble:loc.location.coordinate.longitude];
      [option setObject:lat forKey:@"latitude"];
      [option setObject:lng forKey:@"longitude"];
      [self getAddress:option];
      
      AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      delegate.startNaviPoint = [self bdToGaodeWithLat:loc.location.coordinate.latitude andLon:loc.location.coordinate.longitude];
      
      self.onLocationSuccess(@{@"data": @"true"});
    }
    
    _currentLocation = loc.location.coordinate;
  }
}

/**
 *定位失败后，会调用此函数
 *地图View
 *@param error 错误号，参考CLError.h中定义的错误号
 */
- (void)BMKLocationManager:(BMKLocationManager * _Nonnull)manager didFailWithError:(NSError * _Nullable)error
{
    //NSLog(@"location error");
    // 定位成功后返回给js端
    if (self.onLocationSuccess) {
      self.onLocationSuccess(@{@"data": @"false"});
    }
}

/**
 * 聚合
 */
-(void)createCluster
{
  if (_clusterManager == nil) {
    //初始化点聚合管理类
    _clusterManager = [[BMKClusterManager alloc] init];
  }
  [_clusterManager clearClusterItems];
  // 模拟创建点
//  CGRect fRect = [self convertRect:self.frame toView:self];
  
  NSArray *arr = [_markesInfo allValues];
  for (int i = 0; i < arr.count; i++) {
    NSDictionary *option = arr[i];
    double lat = [RCTConvert double:option[@"latitude"]];
    double lng = [RCTConvert double:option[@"longitude"]];
    NSString *monitorId = [RCTConvert NSString:option[@"markerId"]];
    NSString *name = [RCTConvert NSString:option[@"title"]];
    int status = [RCTConvert int:option[@"status"]];
    
//    CGPoint cRect = [self convertCoordinate:CLLocationCoordinate2DMake(lat, lng) toPointToView:self.mapView];
    
//    if (CGRectContainsPoint(fRect, cRect)) {
      BMKClusterItem *clusterItem = [[BMKClusterItem alloc] init];
      clusterItem.coor = CLLocationCoordinate2DMake(lat, lng);
      clusterItem.monitorId = monitorId;
      clusterItem.name = name;
      clusterItem.status = status;
      [_clusterManager addClusterItem:clusterItem];
//    }
  }

  [self removeAnnotations:self.annotations];
  // 获取聚合后的标注
  NSArray *array = [_clusterManager getClusters: self.zoomLevel];
  for (BMKCluster *item in array) {
    NSMutableArray *clusters = item.clusterItems;
    NSMutableArray *clusterInfos = [[NSMutableArray alloc] init];
    for (int i = 0; i < clusters.count; i++) {
      BMKClusterItem *data = clusters[i];
      NSString *monitorId = data.monitorId;
      NSString *name = data.name;
      int status = data.status;
      NSDictionary *info = @{@"monitorId":monitorId, @"name": name, @"status": @(status) };
      [clusterInfos addObject:info];
    }
    
    ClusterAnnotation *annotation = [[ClusterAnnotation alloc] init];
    annotation.coordinate = item.coordinate;
    annotation.size = item.size;
    annotation.clusterPointsInfo = clusterInfos;
    [self addAnnotation:annotation];
  }
  
  // 清空保存点的数据
  [_realTimeAnnotations removeAllObjects];
  [_inAreaMarkers removeAllObjects];
  [_outAreaMarkers removeAllObjects];
}

-(void)setSpeedPiecewise:(NSArray*)arr
{
  _speedPiecewise = arr;
}

/**
 * 初始化轨迹回放的点和路线
 */
-(void)setSportPath:(NSArray*)arr
{
  // 首先筛选组装轨迹点数据
  [self removeAnnotations:self.annotations];
  [self removeOverlays:self.overlays];
  if (arr.count > 0) {
    _sportPlayed = NO;
    if (arr != nil) {
      if (playBackTracking == nil) {
        playBackTracking =[NSMutableArray array];
      } else {
        [playBackTracking removeAllObjects];
      }
      // 根据设置的不同速度区间进行划分线段
      NSMutableArray *minimumTrackTint = [NSMutableArray array];
      NSMutableArray *maximumTrackTint = [NSMutableArray array];
      NSMutableArray *thumbTint = [NSMutableArray array];
      NSMutableArray *tint = [NSMutableArray array];
      double min = [_speedPiecewise[0] doubleValue];
      double max = [_speedPiecewise[1] doubleValue];
      int tag = 0;
      
      for (NSDictionary *dic in arr) {
        TracingPoint* tp = [[TracingPoint alloc] init];
        double speed = [dic[@"speed"] doubleValue];
        CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake([dic[@"latitude"] doubleValue], [dic[@"longitude"] doubleValue]);
        tp.coordinate = coordinate;
        tp.speed = speed;
        tp.icon = dic[@"icon"];
        [playBackTracking addObject:tp];
        
        if (speed <= min) {
          if (!tag) {
            tag = 1;
          }
          if (tag && tag != 1) {
            NSArray* a = [tint mutableCopy];
            if (tag == 2) {
              [thumbTint addObject:a];
            } else if (tag == 3) {
              [maximumTrackTint addObject:a];
            }
            TracingPoint *last = [tint lastObject];
            [tint removeAllObjects];
            [tint addObject:last];
            tag = 1;
          }
        } else if (speed > min && speed <= max) {
          if (!tag) {
            tag= 2;
          }
          if (tag && tag != 2) {
            NSArray* a = [tint mutableCopy];
            if (tag == 1) {
              [minimumTrackTint addObject:a];
            } else if (tag == 3) {
              [maximumTrackTint addObject:a];
            }
            TracingPoint *last = [tint lastObject];
            [tint removeAllObjects];
            [tint addObject:last];
            tag = 2;
          }
        } else if (speed > max) {
          if (!tag) {
            tag= 3;
          }
          if (tag && tag != 3) {
            NSArray* a = [tint mutableCopy];
            if (tag == 1) {
              [minimumTrackTint addObject:a];
            } else if (tag == 2) {
              [thumbTint addObject:a];
            }
            TracingPoint *last = [tint lastObject];
            [tint removeAllObjects];
            [tint addObject:last];
            tag = 3;
          }
        }
        [tint addObject:tp];
      }
      
      NSArray* a = [tint mutableCopy];
      if (tag == 1) {
        [minimumTrackTint addObject:a];
      } else if (tag == 2) {
        [thumbTint addObject:a];
      } else if (tag == 3) {
        [maximumTrackTint addObject:a];
      }
      [tint removeAllObjects];
      tag = 0;
      
      playBackSportNodeNum = [playBackTracking count];
      CLLocationCoordinate2D paths[playBackSportNodeNum];
      for (NSInteger i = 0; i < playBackSportNodeNum; i++) {
        TracingPoint * tp = playBackTracking[i];
        paths[i] = tp.coordinate;
      }
      BMKPolyline *polyLine = [BMKPolyline polylineWithCoordinates:paths count:playBackSportNodeNum];
      polyLine.title = @"sportPath";
      [self addOverlay:polyLine];
      
      // 地图上添加轨迹线、起点、终点和监控对象图标
      // 创建轨迹线
      for (NSInteger i = 0; i < minimumTrackTint.count; i++) {
        NSMutableArray* info = minimumTrackTint[i];
        NSInteger sportCount = info.count;
        CLLocationCoordinate2D paths[sportCount];
        for (NSInteger j = 0; j < sportCount; j++) {
          TracingPoint * tp = info[j];
          paths[j] = tp.coordinate;
        }
        NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:0], nil];
        BMKPolyline *polyLine = [BMKPolyline polylineWithCoordinates:paths count:sportCount textureIndex:colorIndexs];
        polyLine.title = @"sportPath";
        [self addOverlay:polyLine];
      }
      for (NSInteger i = 0; i < thumbTint.count; i++) {
        NSMutableArray* info = thumbTint[i];
        NSInteger sportCount = info.count;
        CLLocationCoordinate2D paths[sportCount];
        for (NSInteger j = 0; j < sportCount; j++) {
          TracingPoint * tp = info[j];
          paths[j] = tp.coordinate;
        }
        NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:1], nil];
        BMKPolyline *polyLine = [BMKPolyline polylineWithCoordinates:paths count:sportCount textureIndex:colorIndexs];
        polyLine.title = @"sportPath";
        [self addOverlay:polyLine];
      }
      for (NSInteger i = 0; i < maximumTrackTint.count; i++) {
        NSMutableArray* info = maximumTrackTint[i];
        NSInteger sportCount = info.count;
        CLLocationCoordinate2D paths[sportCount];
        for (NSInteger j = 0; j < sportCount; j++) {
          TracingPoint * tp = info[j];
          paths[j] = tp.coordinate;
        }
        NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:2], nil];
        BMKPolyline *polyLine = [BMKPolyline polylineWithCoordinates:paths count:sportCount textureIndex:colorIndexs];
        polyLine.title = @"sportPath";
        [self addOverlay:polyLine];
      }
      
      TracingPoint *firstPoint = [playBackTracking firstObject];
      // 初始化移动后轨迹点集合
      if (_playbackPoints) {
        [_playbackPoints removeAllObjects];
      } else {
        _playbackPoints = [[NSMutableArray alloc] init];
      }
      
      [_playbackPoints addObject: playBackTracking[0]];
      // 初始化轨迹移动加深线
      if (_playbackPolyline) {
        _playbackPolyline = nil;
      }
      // 创建起点标注物
      SportBMKAnnotation *startPoint = [[SportBMKAnnotation alloc] init];
      NSString *monitorIcon =[RCTConvert NSString:arr[0][@"ico"]];
      startPoint.coordinate = firstPoint.coordinate;
      startPoint.type = @"start";
      startPoint.icon = monitorIcon;
      [self addAnnotation:startPoint];
      // 创建终点标注物
      TracingPoint *lastPoint = [playBackTracking lastObject];
      SportBMKAnnotation *endPoint = [[SportBMKAnnotation alloc] init];
      endPoint.coordinate = lastPoint.coordinate;
      endPoint.type = @"end";
      endPoint.icon = monitorIcon;
      [self addAnnotation:endPoint];
      // 创建监控对象标注物
      NSString *pointIndex =[RCTConvert NSString:arr[0][@"sportIndex"]];
      TracingPoint *monitorPoint = firstPoint;
      if(pointIndex){
        monitorPoint = [playBackTracking objectAtIndex:[pointIndex intValue]];
      }
      sportAnnotation = [[SportBMKAnnotation alloc] init];
      sportAnnotation.coordinate = monitorPoint.coordinate;
      sportAnnotation.type = @"monitor";
      sportAnnotation.icon = monitorIcon;
      sportAnnotation.lat = monitorPoint.coordinate.latitude;
      sportAnnotation.lng = monitorPoint.coordinate.longitude;
      [self addAnnotation:sportAnnotation];
      sportState = true;
      
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        // 地图划线自适应地图
        [self mapViewFitPolyLine:polyLine bottomSpan:self->_fSpan];
      });
    }
  }
}

/**
 * 根据地图上添加的覆盖物分布情况，自动缩放地图到合适的视野级别
 */
- (void)mapViewFitPolyLine:(BMKPolyline *) polyLine bottomSpan:(int) bSpan{
  CGFloat ltX, ltY, rbX, rbY;
  if (polyLine.pointCount < 1) {
    return;
  }
  BMKMapPoint pt = polyLine.points[0];
  (void)(ltX = pt.x), ltY = pt.y;
  //左上方的点lefttop坐标（ltX，ltY）
  (void)(rbX = pt.x), rbY = pt.y;
  //右底部的点rightbottom坐标（rbX，rbY）
  for (int i = 1; i < polyLine.pointCount; i++) {
    BMKMapPoint pt = polyLine.points[i];
    if (pt.x < ltX) {
      ltX = pt.x;
    }
    if (pt.x > rbX) {
      rbX = pt.x;
    }
    if (pt.y < ltY) {
      ltY = pt.y;
    }
    if (pt.y > rbY) {
      rbY = pt.y;
    }
  }
  BMKMapRect rect;
  rect.origin = BMKMapPointMake(ltX , ltY);
  rect.size = BMKMapSizeMake(rbX - ltX, rbY - ltY);
  UIEdgeInsets padding = UIEdgeInsetsMake(60, 40, bSpan, 40);
  if (rect.size.height && rect.size.width) {
      [self fitVisibleMapRect:rect edgePadding:padding withAnimated:YES];
  } else {
    [self setZoomLevel:19];
    [self setCenterCoordinate:polyLine.coordinate animated:YES];
  }
}

/**
 * 设置轨迹回放播放速度
 */
-(void)setSportSpeed:(double)speedValue
{
  _playBackSpeed = speedValue;
}

/**
 * 轨迹回放播放控制
 */
-(void)setSportPathPlay:(BOOL)flag
{
  if (flag) {
    changeState = NO;
    isPlaying = YES;
    [self sportPlay];
  } else {
    isPlaying = NO;
    [self sportStop];
  }
}

/**
 * 轨迹播放
 */
-(void)sportPlay
{
  if (_sportPlayed == NO) {
    _sportPlayed = YES;
  }
  
  if (sportState) {
    currentIndex ++;
    NSLog(@"2222222222222222222222b:%ld", (long)currentIndex);
    if (currentIndex < playBackTracking.count) {
      TracingPoint *currentNode;
//      if (_isShowChart) {
        currentNode = [playBackTracking objectAtIndex:currentIndex];
      [_playbackPoints addObject:currentNode];
//      } else {
//        for (long i = currentIndex; i < playBackTracking.count; i += 1) {
//          currentNode = [playBackTracking objectAtIndex:i];
          double speed = currentNode.speed;
//          if (speed > 0) {
//            currentIndex = i;
//            break;
//          }
//        }
//      }
      
//      TracingPoint *currentNode = [playBackTracking objectAtIndex:currentIndex];
//      double speed = currentNode.speed;
//      if (speed == 0) {
//        [self sportPlay];
//        return;
//      }
      TracingPoint *beforeNode = [playBackTracking objectAtIndex:currentIndex - 1];
      
      TracingPoint *tempNode = [[TracingPoint alloc] init];
      tempNode.coordinate = sportAnnotation.coordinate;
      
      
      if (speed < 5) {
        // 当两个点的经纬度相等的时候
        [self performSelector:@selector(sportPlay) withObject:nil afterDelay:_isShowChart ? _playBackSpeed:0];
      } else if (currentNode.coordinate.latitude == beforeNode.coordinate.latitude && currentNode.coordinate.longitude == beforeNode.coordinate.longitude) {
        [self performSelector:@selector(sportPlay) withObject:nil afterDelay:_playBackSpeed];
      } else {
        playBackSportNodes = [[NSMutableArray alloc] init];
        [playBackSportNodes addObject:tempNode];
        [playBackSportNodes addObject:currentNode];
        
        NSMutableArray *angelNodes = [[NSMutableArray alloc] init];
        [angelNodes addObject: beforeNode];
        [angelNodes addObject: currentNode];
        
//        NSArray *arr = playBackSportNodes;
        
        CGFloat angle = [self getAngle:angelNodes];
         playBackSportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
        [playBackSportAnnotationView addTrackingAnimationForPoints:playBackSportNodes duration:_playBackSpeed];
      }
    } else {
      currentIndex --;
    }
  } else {
    [playBackSportAnnotationView resumeLayer];
    sportState = true;
  }
}

/**
 * 轨迹回放暂停
 */
-(void)sportStop
{
  if (sportAnnotation != nil) {
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(sportPlay) object:nil];
  }
}

/**
 * 设置轨迹回放当前位置
 */
-(void)setSportIndex:(NSArray*)sportIndex
{
  if (sportIndex.count > 0) {
    NSDictionary* option = [sportIndex firstObject];
    _isShowChart = [RCTConvert BOOL:option[@"isShowChart"]];
    BOOL flag = [[RCTConvert NSString:option[@"flag"]] isEqualToString: @"true"];
    if (!flag) {
      if (sportAnnotation != nil) {
        NSString *indexStr = [RCTConvert NSString:option[@"index"]];
        int index = [indexStr intValue];
        if (index <= [playBackTracking count]) {
          changeState = YES;
          if (isPlaying == NO) {
            currentIndex = index;
          }
          
          // 已经播放过的标注物取消动画
          // 未播放过的直接设置经纬度坐标
          TracingPoint *point = [playBackTracking objectAtIndex:currentIndex];
          sportAnnotation.mapPointType = YES;
          sportAnnotation.lng = point.coordinate.longitude;
          sportAnnotation.lat = point.coordinate.latitude;
          if (_sportPlayed) {
            [playBackSportAnnotationView removeLayer:point.coordinate];
          } else {
            [playBackSportAnnotationView setMapPoint:point.coordinate];
          }
          sportAnnotation.coordinate = point.coordinate;
          // 删除已添加的行驶过的轨迹线，再根据下标重新画线
          NSArray *trackings = [playBackTracking subarrayWithRange:NSMakeRange(0, currentIndex + 1)];
          
          _playbackPoints = [trackings mutableCopy];

          CLLocationCoordinate2D paths[_playbackPoints.count];
          for (NSInteger i = 0; i < _playbackPoints.count; i++) {
            TracingPoint * tp = _playbackPoints[i];
            paths[i] = tp.coordinate;
          }
          
          if (_playbackPolyline) {
            NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:4], nil];
            [_playbackPolyline setPolylineWithCoordinates:paths count:_playbackPoints.count textureIndex:colorIndexs];
          } else {
            NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:4], nil];
            _playbackPolyline = [BMKPolyline polylineWithCoordinates:paths count:_playbackPoints.count textureIndex:colorIndexs];
            _playbackPolyline.title = @"sportPath";
            [self addOverlay:_playbackPolyline];
          }
          
          NSArray *arr = [self overlays];
          for (int i = 0; i < arr.count; i++) {
            BMKPolyline *line = arr[i];
            if (![line.title isEqual:@"sportPath"]) {
              [self removeOverlay:line];
            }
          }

//          NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:4], nil];
//          BMKPolyline *polyLine = [BMKPolyline polylineWithCoordinates:paths count:trackings.count textureIndex:colorIndexs];
//          polyLine.title = @"movedPath";
//          [self addOverlay:polyLine];
        }
      }
    }
  }
}

/**
 * 查询出来的位置信息返回给js端
 */
-(void)addressCallBack:(NSString*)addStr
{
  if (self.onAddress) {
    NSDictionary *address = @{@"data":addStr};
    self.onAddress(address);
  }
}

/**
 * 初始化轨迹点数据
 */
-(void)initSportNodes:(NSString*)id
{
  // 清空轨迹点数据
  if (_tracking == nil) {
    _tracking = [NSMutableDictionary dictionary];
  }
  [_tracking removeObjectForKey:id];
  
  // 当前点与最后一个点比较，两者定位时间差>=35秒，则直接跳转到最后一个点
  // 在这直接删除满足条件的中间点
  NSMutableArray *values = [_inAreaMarkers objectForKey:id];
  if (values.count > 2) {
    NSDictionary *firstOption = [values firstObject];
    NSDictionary *lastOption = [values lastObject];
    
    double firstTime = [firstOption[@"time"] doubleValue];
    double lastTime = [lastOption[@"time"] doubleValue];
    if (lastTime - firstTime >= 35) {
      [values removeObjectsInRange:NSMakeRange(1, values.count - 2)];
    }
  }
  
  NSMutableArray *info = [NSMutableArray array];
  if (values.count >= 2) {
    for (int i = 0; i < 2; i++) {
      NSDictionary *option = [values objectAtIndex:i];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      TracingPoint * tp = [[TracingPoint alloc] init];
      tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
      tp.speed = [option[@"speed"] doubleValue];
      tp.time = [option[@"time"] doubleValue];
      tp.angle = [option[@"angle"] doubleValue];
      [info addObject:tp];
    }
    [_tracking setObject:info forKey:id];
    [self addPolyline:id];
  }
}

/**
 * 开始添加轨迹线和标注
 */
-(void)addPolyline:(NSString*)id
{
  NSMutableArray *value = [_tracking objectForKey:id];
  NSInteger sportNodeNum = [value count];
  CLLocationCoordinate2D paths[sportNodeNum];
  for (NSInteger i = 0; i < sportNodeNum; i++) {
    TracingPoint * tp = value[i];
    paths[i] = tp.coordinate;
  }
  
  // 如果是实时尾迹就显示轨迹线
  if (_wakeTyPe) {
    BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
    [self addOverlay:path];
  }
  [self running:id];
}

- (void)running:(NSString*)id
{
  /* Find annotation view for car annotation. */
  NSMutableArray *value = [_tracking objectForKey:id];
  // 上一点数据
  TracingPoint *currentNode = [value objectAtIndex:0];
  // 当前点数据
  TracingPoint *tempNode = [value objectAtIndex:1];
  // 最新位置点数据
  TracingPoint *latestNode = [value lastObject];
  
  NSMutableArray *sportNodes = [[NSMutableArray alloc] init];
  
  [sportNodes addObject:currentNode];
  [sportNodes addObject:tempNode];
  MovingAnnotationView *sportAnnotationView = [_optionsIcon objectForKey:id];
  // 计算角度值
  NSArray *arr = [value subarrayWithRange:NSMakeRange(0, 2)];
  CGFloat angle = [self getAngle:arr];
  sportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
  
  /**
   * 地图位置当前点A与地图位置下一个点b之间定位时间T >= 31秒，A直接跳点B
   * 地图位置AB两点间的速度 >= 230km/h，A点保持不动
   * 新增用户个性化配置设置压点时长，
   * 新增逻辑：
   * 存储点数量大于等于3时，判断当前点与最新位置点的时间差，如果大于等于设置时间，则直接跳点
   * 否则判断当前点与下一个点之间时间间隔大于121秒，或速度大于等于230或者小于5，则直接跳到下一个点
   */
  double secondsTime = (tempNode.time - currentNode.time);
  double time = latestNode.time - currentNode.time;
  if (secondsTime > 0) {
    double minutesTime = secondsTime / 60;
    BMKMapPoint point1 = BMKMapPointForCoordinate(currentNode.coordinate);
    BMKMapPoint point2 = BMKMapPointForCoordinate(tempNode.coordinate);
    CLLocationDistance distance = BMKMetersBetweenMapPoints(point1, point2);
    double speed = distance / minutesTime / 60;
    if (value.count >= 3) {
      if ((!_dotType && time >= 31) || (_dotType && time >= _dotValue)) {
        [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:0.1];
      } else {
        if (speed >= 230 || speed < 5) {
          [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:0.1];
        } else {
          [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:secondsTime];
        }
      }
    } else {
      if (secondsTime >= 120 || speed >= 230 || speed < 5) {
        [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:0.1];
      } else {
        [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:secondsTime];
      }
    }
    
    
//    if ((!_dotType && secondsTime < 31) || (_dotType && _dotValue >= secondsTime)) {
//      BMKMapPoint point1 = BMKMapPointForCoordinate(currentNode.coordinate);
//      BMKMapPoint point2 = BMKMapPointForCoordinate(tempNode.coordinate);
//      CLLocationDistance distance = BMKMetersBetweenMapPoints(point1, point2);
//      double speed = distance / minutesTime / 60;
//      if (speed < 230) {
//        [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:secondsTime];
//      } else {
//        NSMutableArray *values = [_inAreaMarkers objectForKey:id];
//        [values removeObjectAtIndex:1];
//        if (values.count >= 2) {
//          [self initSportNodes:id];
//        }
//      }
//    } else {
//      [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:0.1];
//    }
  } else {
    NSMutableArray *values = [_inAreaMarkers objectForKey:id];
    [values removeObjectAtIndex:1];
    if (values.count >= 2) {
      [self initSportNodes:id];
    }
  }
}

/**
 * 计算两点间的旋转角度
 */
-(CGFloat)getAngle:(NSArray*)arr
{
  // CGFloat angle = 0.0;
  TracingPoint *startPoint = [arr objectAtIndex:0];
  TracingPoint *endPoint = [arr objectAtIndex:1];
  
  CGPoint start = [self convertCoordinate:startPoint.coordinate toPointToView:self.mapView];
  CGPoint end = [self convertCoordinate:endPoint.coordinate toPointToView:self.mapView];
  CGFloat height = end.y - start.y;
  CGFloat width = end.x - start.x;
  CGFloat rads = atan(height/width);
  float rotation = self.rotation;
  float r = rotation - 360;
  float s = r / 180;
  float v = s * 3.14159;
  
  if (end.y < start.y && end.x > start.x) { // 一区间 负数
    rads =  rads;  // 3.14159
  } else if (end.y <= start.y && end.x <= start.x) { // 二区间 正数
    rads = rads + 3.14159;
  } else if (end.y > start.y && end.x < start.x) { // 三区间 负数
    rads = rads - 3.14159;
  } else if (end.y > start.y && end.x > start.x) { // 四区间 正数
    rads = rads;
  }
  return rads + v;
  // return radiansToDegrees(rads);
  // degs = degrees(atan((top - bottom)/(right - left)))
  
  // return angle;
}

/**
 * 通过角度计算出旋转值
 */
-(CGFloat)angleConversion:(int)angle
{
  CGFloat transformValue = angle * 3.14159 / 180;
  return transformValue;
}

// 根据anntation生成对应的View
- (BMKAnnotationView *)mapView:(BMKMapView *)mapView viewForAnnotation:(id <BMKAnnotation>)annotation
{
  if ([annotation isKindOfClass:[CustomBMKAnnotation class]]){
    CustomBMKAnnotation* customAnnotation = annotation;
    NSString *markerId = customAnnotation.markerId;
    static NSString *reuseIndetifier = @"sportsAnnotation";
    if (_optionsIcon == nil) {
      _optionsIcon = [NSMutableDictionary dictionary];
    }
    MovingAnnotationView *sportAnnotationView = [[MovingAnnotationView alloc] initWithAnnotation:annotation
                                                           reuseIdentifier:reuseIndetifier];
    sportAnnotationView.animateDelegate = self;
    sportAnnotationView.canShowCallout = NO;
    
    
//    CGPoint centerPoint= CGPointMake(-sportAnnotationView.frame.size.width/2, -sportAnnotationView.frame.size.height/2);
    CGPoint centerPoint = CGPointMake(0, 0);
    [sportAnnotationView setCenterOffset:centerPoint];
    CGFloat angle = [self angleConversion:customAnnotation.angle];
    sportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
    [_optionsIcon setObject:sportAnnotationView forKey:markerId];
    // sportAnnotationView.backgroundColor = [UIColor blueColor];
    // sportAnnotationView.image = nil;
    if ([customAnnotation.pointType  isEqual: @"wake"]) {
      sportAnnotationView.image = nil;
    } else {
       UIView *viewForImage=[[UIView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
       sportAnnotationView.image=[self getImageFromView:viewForImage];
    }
    // sportAnnotationView.backgroundColor = [UIColor greenColor];
    
    
//    if(potionImage)
//    {
//      sportAnnotationView.image = potionImage;
//    }
    
    /**
     * 自定义paopaoview
     */
    UIImageView *backView = [[UIImageView alloc] init];
    if ([customAnnotation.pointType  isEqual: @"wake"]) {
      backView.frame = CGRectMake(-50, -55, 100, 45);
    } else {
      backView.frame = CGRectMake(-30, -40, 100, 45);
    }
    backView.image = [UIImage imageNamed:@"paopaoView.png"];
    backView.contentMode = UIViewContentModeScaleAspectFit;
    
    int status = customAnnotation.status;
    UIButton * button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    button.frame = CGRectMake(7.f, 13.f, 12.f, 12.f);
    button.layer.cornerRadius = 7;
    button.layer.masksToBounds = YES;
    button.layer.borderWidth = 0;
    button.layer.backgroundColor = [self getStatus:(int)status].CGColor;// [UIColor greenColor].CGColor;
    button.tag = 110;
    [backView addSubview:button];
    
    
    // 添加标题，监控对象名称
    UILabel *titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(22 ,-1, 80, 40)];
    titleLabel.font = [UIFont boldSystemFontOfSize:12];
    titleLabel.textColor = [UIColor blackColor];
    titleLabel.text = customAnnotation.title; // @"渝A88888";
    [backView addSubview:titleLabel];
    
    backView.tag = 111;
    [sportAnnotationView addSubview:backView];
    
  
    UIButton *pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 40, 40)];
//    pointBtn.backgroundColor = [UIColor redColor];
    sportAnnotationView.userInteractionEnabled = YES;
    pointBtn.enabled = YES;
    pointBtn.userInteractionEnabled = YES;
    
    // 监控对象标注物添加点击事件
    objc_setAssociatedObject(pointBtn, @"monitorId", markerId, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [pointBtn addTarget:self action:@selector(pointClick:) forControlEvents:UIControlEventTouchUpInside];

    
    [sportAnnotationView addSubview:pointBtn];
    
    
    
    // 保存创建的paopaoview对象
    if (_paopaoViewInfo == nil) {
      _paopaoViewInfo = [NSMutableDictionary dictionary];
    }
    if ([_centerMonitorId isEqualToString:markerId]) {
      sportAnnotationView.displayPriority = BMKFeatureDisplayPriorityDefaultHigh;
    }
    [_paopaoViewInfo setObject:sportAnnotationView forKey:markerId];
    sportAnnotationView.enabled3D = true;
    return sportAnnotationView;
  } else if ([annotation isKindOfClass:[SportBMKAnnotation class]]) {// 轨迹回放点
    // SportBMKAnnotation* sportAnnotation = annotation;
    static NSString *reuseIndetifier = @"sportsAnnotation";
    playBackSportAnnotationView = (MovingAnnotationView*)[mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
//    if (playBackSportAnnotationView == nil)
//    {
      playBackSportAnnotationView = [[MovingAnnotationView alloc] initWithAnnotation:annotation
                                                             reuseIdentifier:reuseIndetifier];
      playBackSportAnnotationView.animateDelegate = self;
      playBackSportAnnotationView.canShowCallout = NO;
//    }
    CGPoint centerPoint= CGPointZero;
    [playBackSportAnnotationView setCenterOffset:centerPoint];
    playBackSportAnnotationView.image = nil;
    playBackSportAnnotationView.enabled3D = true;
    return playBackSportAnnotationView;
  } else if ([annotation isKindOfClass:[ClusterAnnotation class]]) { // 聚合标注物
    static NSString *reuseIndetifier = @"clusterAnnotation";
    ClusterAnnotation *cAnnotation = annotation;
    BMKAnnotationView *annotationView = [[BMKAnnotationView alloc] initWithAnnotation:annotation
                                                     reuseIdentifier:reuseIndetifier];
    annotationView.image = [UIImage imageNamed:@"cluster.png"];
    
    // 添加标题，聚合数量
    UIImageView *clusterView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 5, 40, 20)];
    // clusterView.backgroundColor = [UIColor whiteColor];
    UILabel *titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 40, 20)];
    titleLabel.font = [UIFont boldSystemFontOfSize:16];
    titleLabel.textColor = [UIColor blackColor];
    titleLabel.text = [NSString stringWithFormat:@"%ld", (long)cAnnotation.size]; // @"渝A88888";
    titleLabel.textAlignment = NSTextAlignmentCenter;
    [clusterView addSubview:titleLabel];
    
    [annotationView addSubview:clusterView];
    annotationView.frame = CGRectMake(0, 0, 40, 40);
    annotationView.contentMode = UIViewContentModeScaleAspectFit;
    
    // 聚合物添加长按事件
    UIButton *pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 40, 40)];
    annotationView.userInteractionEnabled = YES;
    pointBtn.enabled = YES;
    pointBtn.userInteractionEnabled = YES;
    [annotationView addSubview:pointBtn];
    
    NSMutableArray *clusters = cAnnotation.clusterPointsInfo;
    
    // 监控对象标注物添加点击事件
//    objc_setAssociatedObject(pointBtn, @"clusters", clusters, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
//    RCTLongPress *longPress = [[RCTLongPress alloc] initWithTarget:self action:@selector(clustersPointLongPress:)];
//    longPress.minimumPressDuration = 1;
//    longPress.data = clusters;
//    [pointBtn addGestureRecognizer:longPress];
    
    // 监控对象单击事件
    
    objc_setAssociatedObject(pointBtn, @"clusters", clusters, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [pointBtn addTarget:self action:@selector(clustersPointClick:) forControlEvents:UIControlEventTouchUpInside];
    
    annotationView.enabled3D = true;
    return annotationView;
  } else if ([annotation isKindOfClass:[BDStopAnnotation class]]) {
    static NSString *reuseIndetifier = @"stopAnnotation";
    BDStopAnnotation *stopAnnotation = annotation;
    BMKAnnotationView *stopAnnotationView = (BMKAnnotationView *)[mapView dequeueReusableAnnotationViewWithIdentifier:reuseIndetifier];
    if (stopAnnotationView == nil)
    {
      stopAnnotationView = [[BMKAnnotationView alloc] initWithAnnotation:annotation
                                                   reuseIdentifier:reuseIndetifier];
    }
    if ([stopAnnotation.type isEqualToString:@"active"]) {
      stopAnnotationView.image = [UIImage imageNamed:@"stopActive.png"];
    } else {
      stopAnnotationView.image = [UIImage imageNamed:@"stop.png"];
    }
    
    stopAnnotationView.frame = CGRectMake(0, 0, 25, 25);
    stopAnnotationView.contentMode = UIViewContentModeScaleAspectFit;
    
    // 停止点标注物添加点击事件
    UIButton *pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 25, 25)];
    stopAnnotationView.userInteractionEnabled = YES;
    pointBtn.enabled = YES;
    pointBtn.userInteractionEnabled = YES;
//    pointBtn.backgroundColor = [UIColor blueColor];
    [stopAnnotationView addSubview:pointBtn];
    
    NSString *index = [NSString stringWithFormat:@"%d", stopAnnotation.index];
    objc_setAssociatedObject(pointBtn, @"index", index, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    [pointBtn addTarget:self action:@selector(stopPointClick:) forControlEvents:UIControlEventTouchUpInside];
    if (!self.stopAnnotationViews) {
      self.stopAnnotationViews = [[NSMutableDictionary alloc] init];
    }
    [self.stopAnnotationViews setObject:stopAnnotationView forKey:index];
    stopAnnotationView.enabled3D = true;
    return stopAnnotationView;
  }
  return nil;
}

-(void)stopPointClick:(UIButton *)button
{
  int index = [objc_getAssociatedObject(button, @"index") intValue];
  [self setStopIndex:index];
  if (self.onStopPointIndexEvent) {
    self.onStopPointIndexEvent(@{@"index": @(index)});
  }
}

-(void)pointClick:(UIButton *)button
{
  NSLog(@"点击事件触发");
  NSString *mid = objc_getAssociatedObject(button, @"monitorId");
  [self cancelMonitorFocus:mid];
  if (self.onPointClickEvent) {
    self.onPointClickEvent(@{@"data": mid});
  }
}

/**
 * 聚合图标长按事件
 */
-(void)clustersPointLongPress:(RCTLongPress *)longPress
{
  if (longPress.state == UIGestureRecognizerStateBegan) {
//    NSMutableArray *clusters = objc_getAssociatedObject(longPress, @"clusters");
    NSMutableArray *data = longPress.data;
    if (self.onClustersClickEvent) {
      self.onClustersClickEvent(@{@"data": data});
    }
  }
}

/**
 * 聚合图标单击事件
 */
- (void)clustersPointClick:(UIButton *)btn
{
  NSMutableArray *clusters = objc_getAssociatedObject(btn, @"clusters");
  if (self.onClustersClickEvent) {
    self.onClustersClickEvent(@{@"data": clusters});
  }
}

-(UIImage *)getImageFromView:(UIView *)view{
  
  UIGraphicsBeginImageContext(view.bounds.size);
  
  [view.layer renderInContext:UIGraphicsGetCurrentContext()];
  
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  
  UIGraphicsEndImageContext();
  
  return image;
  
}

-(UIColor*)getStatus:(int)status
{
  UIColor *color = [UIColor whiteColor];
  if (status == 2) { // 未定位
    color = UIColorFromHex(0x754801);
  } else if (status == 3) { // 未上线
    color = UIColorFromHex(0xb6b6b6);
  } else if (status == 4) { // 停车
    color = UIColorFromHex(0xc80002);
  } else if (status == 5) { // 报警
    color = UIColorFromHex(0xffab2d);
  } else if (status == 9) { // 超速
    color = UIColorFromHex(0x960ba3);
  } else if (status == 10) { // 行驶
    color = UIColorFromHex(0x78af3a);
  } else if (status == 11) { // 心跳
    color = UIColorFromHex(0xfb8c96);
  }
  return color;
}

//- (void)mapView:(BMKMapView *)mapView didAddAnnotationViews:(NSArray *)views {
//  NSLog(@"sdsdsdsdsdsdsdsd");
//}

/**
 *点中底图空白处会回调此接口
 *@param mapview 地图View
 *@param coordinate 空白处坐标点的经纬度
 */
- (void)mapView:(BMKMapView *)mapView onClickedMapBlank:(CLLocationCoordinate2D)coordinate
{
  //NSLog(@"sdsdsdsdsdsdsdsd");
  if (self.onStopPointIndexEvent) {
    self.onStopPointIndexEvent(@{@"index": @(-1)});
  }
  if (!self.onMapClick) {
    return;
  }
  self.onMapClick(@{
   @"data": @"true"});
}

/**
 * 标注物移动结束
 */
- (void)movingAnnotationViewAnimationFinished:(BMKPointAnnotation*)annotation{
  /**
   * 删除移动后的标注物第一条数据
   * 删除数据后，如果数据数量大于等于2就进行移动
   */
  if (!changeState) {
    if ([annotation isKindOfClass:[CustomBMKAnnotation class]]){
      CustomBMKAnnotation* customAnnotation = (CustomBMKAnnotation*)annotation;
      NSString *markerId = customAnnotation.markerId;
      if (_wakeTyPe) {
        if(_wakeCoordinate.count > 0) {
          [_wakeCoordinate removeObjectAtIndex:0];
          if (_wakeCoordinate.count >= 2) {
            [self initWakeNodes:markerId];
          }
        }
      } else {
        NSArray *inAreaKeyArr = [_inAreaMarkers allKeys];
        if ([inAreaKeyArr containsObject:markerId]) {
          NSMutableArray *values = [_inAreaMarkers objectForKey:markerId];
          if (values.count > 1) {
            // 判断保存的标注位置点是否保存为2个，如果是两个就进行移动
            [values removeObjectAtIndex:0];
            // [_inAreaMarkers setObject:values forKey:markerId];
          }
          if (values.count >= 2) {
            [self initSportNodes:markerId];
          }
        }
      }
    } else if ([annotation isKindOfClass:[SportBMKAnnotation class]]) {
      [self sportPlay];
    }
  }
}

-(void)annotationHopsFinished:(BMKPointAnnotation*)annotation
{
  if ([annotation isKindOfClass:[CustomBMKAnnotation class]]){
    CustomBMKAnnotation* customAnnotation = (CustomBMKAnnotation*)annotation;
    if ([customAnnotation.pointType isEqual:@"wake"]) {
      CLLocationCoordinate2D coor[2] = {0};
      coor[0].latitude = customAnnotation.wakeLineStartLat;
      coor[0].longitude = customAnnotation.wakeLineStartLng;

      coor[1] = customAnnotation.coordinate;
      NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:3], nil];
      BMKPolyline *polyline = [BMKPolyline polylineWithCoordinates:coor count:2 textureIndex:colorIndexs];
      polyline.title = @"wakeline";
      [self addOverlay:polyline];

      customAnnotation.wakeLineStartLat = customAnnotation.coordinate.latitude;
      customAnnotation.wakeLineStartLng = customAnnotation.coordinate.longitude;

      NSArray *arr = [self overlays];

      for (int i = 0; i < arr.count; i++) {
        BMKPolyline *line = arr[i];
        if (![line.title isEqual:@"wakeline"]) {
          [self removeOverlay:line];
        }
      }
    }
  } else if ([annotation isKindOfClass:[SportBMKAnnotation class]]) {
    NSArray *arr = [self overlays];

    for (int i = 0; i < arr.count; i++) {
      BMKPolyline *line = arr[i];
      if (![line.title isEqual:@"sportPath"]) {
        [self removeOverlay:line];
      }
    }
  
    SportBMKAnnotation* sportAnnotation = (SportBMKAnnotation*)annotation;
    
    CLLocationCoordinate2D paths[_playbackPoints.count + 1];
    for (NSInteger i = 0; i < _playbackPoints.count; i++) {
      TracingPoint * tp = _playbackPoints[i];
      paths[i] = tp.coordinate;
    }
    paths[_playbackPoints.count] = CLLocationCoordinate2DMake(sportAnnotation.lat, sportAnnotation.lng);
    NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:4], nil];
    if (_playbackPolyline) {
      [_playbackPolyline setPolylineWithCoordinates:paths count:_playbackPoints.count + 1 textureIndex:colorIndexs];
    } else {
      _playbackPolyline = [BMKPolyline polylineWithCoordinates:paths count:_playbackPoints.count + 1 textureIndex:colorIndexs];
      _playbackPolyline.title = @"sportPath";
      [self addOverlay:_playbackPolyline];
    }
    
//    NSArray *trackings = [playBackTracking subarrayWithRange:NSMakeRange(0, currentIndex)];

//    CLLocationCoordinate2D paths[trackings.count + 1];
//    for (NSInteger i = 0; i < trackings.count; i++) {
//      TracingPoint * tp = trackings[i];
//      paths[i] = tp.coordinate;
//    }
    
    
//    paths[trackings.count] = CLLocationCoordinate2DMake(sportAnnotation.lat, sportAnnotation.lng);
//
//    NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:4], nil];
//    BMKPolyline *polyLine = [BMKPolyline polylineWithCoordinates:paths count:trackings.count + 1 textureIndex:colorIndexs];
//
//    polyLine.title = @"movedPath";
//    [self addOverlay:polyLine];

    sportAnnotation.lat = sportAnnotation.coordinate.latitude;
    sportAnnotation.lng = sportAnnotation.coordinate.longitude;
  }
}

/**
 * 设置需要在地图中心点显示标注点id
 */
-(void)setCenterPoint:(NSString*)monitorId
{
  if (monitorId != NULL) {
    // 将之前最高层级点设置为默认层级
    if (_centerMonitorId != nil) {
      MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:_centerMonitorId];
      if (sportAnnotationView != nil) {
        sportAnnotationView.displayPriority = BMKFeatureDisplayPriorityDefaultMiddle;
      }
    }
    
    _centerMonitorId = monitorId;
//
//    if (![_pageDet  isEqual: @"monitorVideo"] ) {
//      CGRect fRect = [self convertRect:self.frame toView:self];
//      CGFloat width = fRect.size.width * 0.5;
//      CGFloat height = fRect.size.height * 1 / 3;
//      [self setMapCenterToScreenPt:CGPointMake(width, height)];
//    }
    
    CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
    if (annotation != nil) {
      MovingAnnotationView *annotationView = [_paopaoViewInfo objectForKey:monitorId];
      [annotationView removeLayer:annotation.coordinate];
      [self removeAnnotation:annotation];
      [_paopaoViewInfo removeObjectForKey:monitorId];
      [_realTimeAnnotations removeObjectForKey:monitorId];
      
      // 获取当前监控对象的位置点，取最新点进行中心点设置和定位设置
      NSMutableArray *values = [_inAreaMarkers objectForKey:monitorId];
      if (values && values.count > 0) {
        NSMutableDictionary *option = [values lastObject];
        CustomBMKAnnotation* newAnnotation = [[CustomBMKAnnotation alloc] init];
        [self addMarker:newAnnotation option:option];
        double lat = [RCTConvert double:option[@"latitude"]];
        double lng = [RCTConvert double:option[@"longitude"]];
        CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
        self.centerCoordinate = point;
        [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19 coordinate:point];
        [_realTimeAnnotations setObject:newAnnotation forKey:monitorId];
        if (values.count > 1) {
          [values removeObjectsInRange:NSMakeRange(0, values.count - 1)];
        }
      }
    } else {
      NSDictionary *option = [_markesInfo objectForKey:monitorId];
      if (option != nil) {
        [self centerLatLng:option];
      }
    }
  }
}

// 聚焦监控对象，设置最新位置点和中心点
-(void)setMonitorFocus:(NSArray*)info
{
  if (info != NULL) {
    NSDictionary *msg = [info firstObject];
    NSString *monitorId = [RCTConvert NSString:msg[@"monitorId"]];
    if (monitorId.length != 0) {
      CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
      if (annotation != nil) {
        // 获取当前监控对象的位置点，取最新点进行中心点设置和定位设置
        NSMutableArray *values = [_inAreaMarkers objectForKey:monitorId];
        if (values && values.count > 0) {
          NSMutableDictionary *option = [values lastObject];
          double lat = [RCTConvert double:option[@"latitude"]];
          double lng = [RCTConvert double:option[@"longitude"]];
          CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
          MovingAnnotationView *sportAnnotationView = [_optionsIcon objectForKey:monitorId];
          [sportAnnotationView removeLayer:annotation.coordinate];
          annotation.coordinate = point;
//          [self setCenterCoordinate:point animated:YES];
          self.centerCoordinate = point;
          [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19 coordinate:point];
//          self.zoomLevel = 19;
          if (values.count > 1) {
            [values removeObjectsInRange:NSMakeRange(0, values.count - 1)];
          }
        }
      } else {
        NSDictionary *option = [_markesInfo objectForKey:monitorId];
        if (option != nil) {
          [self centerLatLng:option];
//            [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19];
        }
      }
    }
  }
}

/**
 * 删除指定id的监控对象
 */
-(void)setRemoveAnnotation:(NSString*)monitorId
{
  if (monitorId) {
    if (_realTimeAnnotations != nil) {
      CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
      if (annotation != nil) {
        [self removeAnnotation:annotation];
        [_realTimeAnnotations removeObjectForKey:monitorId];
        [_markesInfo removeObjectForKey:monitorId];
        [_inAreaMarkers removeObjectForKey:monitorId];
      }
    }
  }
}

/**
 * 设置聚焦跟踪标注物
 */
-(void)setPointTracking:(NSString*)id
{
  if (id) {
//    if (_trackingMonitorId != nil) {
//      CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:_trackingMonitorId];
//      if (annotation != nil) {
//        annotation.tracking = false;
//      }
//    }
    
    CustomBMKAnnotation* point = [_realTimeAnnotations objectForKey:id];
    if (point != nil) {
      point.tracking = true;
    }
  }
}

/**
 * 设置实时尾迹
 */
-(void)setRealTimeWake:(BOOL)flag
{
  _wakeTyPe = flag;
}

/**
 *地图初始化完毕时会调用此接口
 *@param mapview 地图View
 */
- (void)mapViewDidFinishLoading:(BMKMapView *)mapView
{
//  //NSLog(@"地图加载完成");
//  if (_compassState) {
//    [self setCompassOpenState:YES];
//    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
//      if (![self->_pageDet  isEqual: @"monitorVideo"] ) {
//        CGRect fRect = [self convertRect:self.frame toView:self];
//        CGFloat width = fRect.size.width * 0.5;
//        CGFloat height = fRect.size.height * 1 / 3;
//        [self setMapCenterToScreenPt:CGPointMake(width, height)];
//      }
//      if (self->_isHomeState) {
//        [self setCompassPosition:CGPointMake(15, 110)];
//      } else {
//        [self setCompassPosition:CGPointMake(15, 30)];
//      }
//    });
//  }
  [self setCompassPosition:CGPointMake(15, 30)];
  if (self.onMapInitFinish) {
    self.onMapInitFinish(@{@"data":@"true"});
  }
//
//  // 开启地图比例尺
//  self.showMapScaleBar = YES;
}

- (void)mapViewDidFinishRendering:(BMKMapView *)mapView {
  if (_compassState) {
    [self setCompassOpenState:YES];
//    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      if (![self->_pageDet  isEqual: @"monitorVideo"] && !_mapFinishRender) {
        _mapFinishRender = YES;
        CGRect fRect = [self convertRect:self.frame toView:self];
        CGFloat width = fRect.size.width * 0.5;
        CGFloat height = fRect.size.height * 1 / 3;
        [self setMapCenterToScreenPt:CGPointMake(width, height)];
      }
      if (self->_isHomeState) {
        [self setCompassPosition:CGPointMake(15, 110)];
      } else {
        [self setCompassPosition:CGPointMake(15, 30)];
      }
//    });
  }
//  if (self.onMapInitFinish) {
//    self.onMapInitFinish(@{@"data":@"true"});
//  }
  
  // 开启地图比例尺
  self.showMapScaleBar = YES;
}

/**
 * 实时追踪当前定位
 */
-(void)setTrackCurrentLocation:(BOOL)flag
{
  _trackCurrentLocation = flag;
  if (flag) {
    [self setCenterCoordinate:_currentLocation animated:YES];
    self.zoomLevel = 19;
//    [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19];
  } else {
    NSArray *overlayArr = [self overlays];
    if (overlayArr.count > 0) {
      [self mapViewFitPolyLine:[overlayArr firstObject] bottomSpan: _trackPolyLineSpan];
    }
  }
}

/**
 * 实时追踪目标定位
 */
-(void)setTrackTargetLocation:(BOOL)flag
{
  _trackTargetLocation = flag;
  if (flag) {
    NSArray *arr = [self annotations];
    for (int i = 0; i < arr.count; i++) {
      SportBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
      if ([trackAnnotation.type  isEqual: @"monitor"]) {
        [self setCenterCoordinate:trackAnnotation.coordinate animated:YES];
        self.zoomLevel = 19;
//        [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19];
      }
    }
  }
  else {
    NSArray *overlayArr = [self overlays];
    if (overlayArr.count > 0) {
      [self mapViewFitPolyLine:[overlayArr firstObject] bottomSpan:_trackPolyLineSpan];
    }
  }
}

/**
 * 实时尾迹当前定位
 */
-(void)setWakeCurrentLocation:(BOOL)flag
{
  NSArray *arr = [self annotations];
  for (int i = 0; i < arr.count; i++) {
    CustomBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
    if ([trackAnnotation.type  isEqual: @"monitor"]) {
      trackAnnotation.tracking = NO;
    }
  }
  if (flag) {
    [self setCenterCoordinate:_currentLocation animated:YES];
    self.zoomLevel = 19;
  } else {
    NSMutableArray *wakeTrack = [[NSMutableArray alloc] init];
    for (int i = 0; i < _wakeAllCoordinate.count; i++) {
      NSDictionary *option = [_wakeAllCoordinate objectAtIndex:i];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      TracingPoint * tp = [[TracingPoint alloc] init];
      tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
      [wakeTrack addObject:tp];
    }

    NSInteger sportNodeNum = [wakeTrack count];
    CLLocationCoordinate2D paths[sportNodeNum];
    for (NSInteger i = 0; i < sportNodeNum; i++) {
      TracingPoint * tp = wakeTrack[i];
      paths[i] = tp.coordinate;
    }

    // 如果是实时尾迹就显示轨迹线
    BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
    path.title = @"wakeFitLine";
    [self addOverlay:path];
//    NSArray *overlayArr = [self overlays];
    CGPoint scale = self.mapScaleBarPosition;
//    for (int i = 0; i < overlayArr.count; i++) {
//      BMKPolyline *line = overlayArr[i];
//      if (![line.title isEqual:@"wakeFitLine"]) {
//        [self removeOverlay:line];
//      } else {
//        NSLog(@"sssss");
//      }
//    }
    [self mapViewFitPolyLine:path bottomSpan: self.frame.size.height - scale.y];
  }
}

/**
 * 实时尾迹目标定位
 */
-(void)setWakeTargetLocation:(BOOL)flag
{
  if (flag) {
    NSArray *arr = [self annotations];
    for (int i = 0; i < arr.count; i++) {
      CustomBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
      if ([trackAnnotation.type  isEqual: @"monitor"]) {
        trackAnnotation.tracking = YES;
        [self setCenterCoordinate:trackAnnotation.coordinate animated:YES];
        self.zoomLevel = 19;
      }
    }
  }
  else {
    NSArray *arr = [self annotations];
    for (int i = 0; i < arr.count; i++) {
      CustomBMKAnnotation *trackAnnotation = [arr objectAtIndex:i];
      if ([trackAnnotation.type  isEqual: @"monitor"]) {
        trackAnnotation.tracking = NO;
      }
    }
    NSMutableArray *wakeTrack = [[NSMutableArray alloc] init];
    for (int i = 0; i < _wakeAllCoordinate.count; i++) {
      NSDictionary *option = [_wakeAllCoordinate objectAtIndex:i];
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      TracingPoint * tp = [[TracingPoint alloc] init];
      tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
      [wakeTrack addObject:tp];
    }

    NSInteger sportNodeNum = [wakeTrack count];
    CLLocationCoordinate2D paths[sportNodeNum];
    for (NSInteger i = 0; i < sportNodeNum; i++) {
      TracingPoint * tp = wakeTrack[i];
      paths[i] = tp.coordinate;
    }

    // 如果是实时尾迹就显示轨迹线
    BMKPolyline *path = [BMKPolyline polylineWithCoordinates:paths count:sportNodeNum];
    path.title = @"wakeFitLine";
    [self addOverlay:path];
//    NSArray *overlayArr = [self overlays];
    CGPoint scale = self.mapScaleBarPosition;
//    for (int i = 0; i < overlayArr.count; i++) {
//      BMKPolyline *line = overlayArr[i];
//      if (![line.title isEqual:@"wakeFitLine"]) {
//        [self removeOverlay:line];
//      } else {
//        NSLog(@"sssss");
//      }
//    }
    [self mapViewFitPolyLine:path bottomSpan: self.frame.size.height - scale.y];
  }
}

/**
 * 实时尾迹
 */
-(void)setWakeData:(NSArray*)wakeData
{
  if (wakeData.count > 0) {
    NSDictionary* option = [wakeData firstObject];
    NSString* markerId = [RCTConvert NSString:option[@"markerId"]];
    // [self centerLatLng:option];
    
    BOOL isResult = [_wakeMonitorId isEqualToString:markerId];
    
    // if (markerId != _wakeMonitorId) {
    if (isResult == NO) {
      // 清空地图的覆盖物
      [self removeAnnotations:self.annotations];
      [self removeOverlays:self.overlays];
      if (_wakeCoordinate != nil) {
        [_wakeCoordinate removeAllObjects];
      }
      if (_wakeAllCoordinate != nil) {
        [_wakeAllCoordinate removeAllObjects];
      }
    }
    _wakeMonitorId = markerId;
    
    if (_wakeCoordinate == nil || _wakeCoordinate.count == 0) {
      [self centerLatLng:option];
      // 创建起点标注物
      SportBMKAnnotation *startPoint = [[SportBMKAnnotation alloc] init];
      CLLocationCoordinate2D coor = [self getCoorFromMarkerOption:option];
      _currentLocation = coor;
      startPoint.coordinate = coor;
      startPoint.type = @"start";
      [self addAnnotation:startPoint];
      // 创建监控对象标注物
      CustomBMKAnnotation* annotation = [[CustomBMKAnnotation alloc] init];
      annotation.type = @"monitor";
      annotation.pointType = @"wake";
      annotation.wakeLat = coor.latitude;
      annotation.wakeLng = coor.longitude;
      annotation.wakeLineStartLat = coor.latitude;
      annotation.wakeLineStartLng = coor.longitude;
      annotation.markerId = markerId;
      [self addMarker:annotation option:option];
      annotation.tracking = true;
      if (_wakeCoordinate == nil) {
        _wakeCoordinate = [[NSMutableArray alloc] init];
      }
      if (_wakeAllCoordinate == nil) {
        _wakeAllCoordinate = [[NSMutableArray alloc] init];
      }
      [_wakeCoordinate addObject:option];
      [_wakeAllCoordinate addObject:option];
    } else {
      NSDictionary *lastOption = [_wakeCoordinate lastObject];
      double lastLat = [RCTConvert double:lastOption[@"latitude"]];
      double lastLng = [RCTConvert double:lastOption[@"longitude"]];
      
      double lat = [RCTConvert double:option[@"latitude"]];
      double lng = [RCTConvert double:option[@"longitude"]];
      
      if (!(lastLat == lat && lastLng == lng)) {
          [_wakeCoordinate addObject:option];
          [_wakeAllCoordinate addObject:option];
          
          if (_wakeCoordinate.count == 2) {
            [self initWakeNodes:markerId];
          }
      }
      // 更新监控对象状态
      MovingAnnotationView *sportAnnotationView = [_paopaoViewInfo objectForKey:markerId];
      UIView* button = [[sportAnnotationView viewWithTag:111] viewWithTag:110];
      int status = [RCTConvert int:option[@"status"]];
      button.layer.backgroundColor = [self getStatus:(int)status].CGColor;
    }
  } else {
    [self removeAnnotations:self.annotations];
    [self removeOverlays:self.overlays];
    if (_wakeCoordinate != nil) {
      [_wakeCoordinate removeAllObjects];
    }
    if (_wakeAllCoordinate != nil) {
      [_wakeAllCoordinate removeAllObjects];
    }
    _wakeMonitorId = nil;
  }
}

/**
 * 初始化尾迹
 */
-(void)initWakeNodes:(NSString*)markerId{
  NSMutableArray *wakeTrack = [[NSMutableArray alloc] init];
  for (int i = 0; i < 2; i++) {
    NSDictionary *option = [_wakeCoordinate objectAtIndex:i];
    double lat = [RCTConvert double:option[@"latitude"]];
    double lng = [RCTConvert double:option[@"longitude"]];
    TracingPoint * tp = [[TracingPoint alloc] init];
    tp.coordinate = CLLocationCoordinate2DMake(lat, lng);
    tp.speed = [option[@"speed"] doubleValue];
    tp.monitorId = markerId;
    tp.time = [option[@"time"] doubleValue];
    [wakeTrack addObject:tp];
  }
  [self addwakePolyline:wakeTrack];
}

-(void)addwakePolyline:(NSMutableArray*)arr
{
  [self wakeRunning:arr];
}

-(void)wakeRunning:(NSMutableArray*)value
{
  TracingPoint *startNode = [value objectAtIndex:0];
  
  TracingPoint *tempNode = [value objectAtIndex:1];
  
  double secondsTime = tempNode.time - startNode.time;
  
  NSMutableArray *sportNodes = [[NSMutableArray alloc] init];
  
  [sportNodes addObject:startNode];
  [sportNodes addObject:tempNode];
  MovingAnnotationView *sportAnnotationView = [_optionsIcon objectForKey:tempNode.monitorId];
  // 计算角度值
  NSArray *arr = [value subarrayWithRange:NSMakeRange(0, 2)];
  CGFloat angle = [self getAngle:arr];
  sportAnnotationView.imageView.transform = CGAffineTransformMakeRotation(angle);
  
  if (secondsTime > 0) {
    double minutesTime = secondsTime / 60;
    if (secondsTime < 35) {
      BMKMapPoint point1 = BMKMapPointForCoordinate(startNode.coordinate);
      BMKMapPoint point2 = BMKMapPointForCoordinate(tempNode.coordinate);
      CLLocationDistance distance = BMKMetersBetweenMapPoints(point1, point2);
      double speed = distance / minutesTime / 60;
      if (speed < 230) {
        [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:secondsTime];
      } else {
        [_wakeCoordinate removeObjectAtIndex:1];
        if (_wakeCoordinate.count >= 2) {
          [self initWakeNodes:startNode.monitorId];
        }
      }
    } else {
      [sportAnnotationView addTrackingAnimationForPoints:sportNodes duration:0.1];
    }
  } else {
    [_wakeCoordinate removeObjectAtIndex:1];
    if (_wakeCoordinate.count >= 2) {
      [self initWakeNodes:startNode.monitorId];
    }
  }
}

/**
 * 位置信息查询
 */
-(void)setSearchAddress:(NSArray *)data
{
  if (data.count > 0) {
    NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
    NSDictionary* coorData = [data firstObject];
    NSNumber *lat = [[NSNumber alloc] initWithDouble:[RCTConvert double:coorData[@"latitude"]]];
    NSNumber *lng = [[NSNumber alloc] initWithDouble:[RCTConvert double:coorData[@"longitude"]]];
    [option setObject:lat forKey:@"latitude"];
    [option setObject:lng forKey:@"longitude"];
    [self getAddress:option];
  }
}

/**
 * 放大地图
 */
-(void)setMapAmplification:(NSArray *)data
{
  if (data.count > 0) {
    float zoomLevel = self.zoomLevel;
    if (zoomLevel < 21) {
      self.zoomLevel = zoomLevel + 1;
    }
  }
}

/**
 * 缩小地图
 */
-(void)setMapNarrow:(NSArray *)data
{
  if (data.count > 0) {
    float zoomlevel = self.zoomLevel;
    if (zoomlevel > 4) {
      self.zoomLevel = zoomlevel - 1;
    }
  }
}

/**
 * 聚合数量
 */
-(void)setAggrNum:(int)aggrNum
{
  if (aggrNum) {
    _clusterNumer = aggrNum;
  }
}

/**
 * 标明是否是主页
 */
-(void)setIsHome:(BOOL)isHome
{
  _isHomeState = isHome;
}

/**
 * 点名下发功能
 */
-(void)setLatestLocation:(NSDictionary*)info
{
  if (info) {
    double lat = [RCTConvert double:info[@"latitude"]];
    double lng = [RCTConvert double:info[@"longitude"]];
    NSString* markerId = [RCTConvert NSString:info[@"markerId"]];
    CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:markerId];
    if (annotation != nil) {
      CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
      MovingAnnotationView *sportAnnotationView = [_optionsIcon objectForKey:markerId];
      if (sportAnnotationView) {
        [sportAnnotationView removeLayer:annotation.coordinate];
      }
      annotation.coordinate = point;
      [self setCenterCoordinate:point animated:YES];
      
      NSString* title = annotation.title;
      NSString* ico = annotation.icon;
      int status = [RCTConvert int:info[@"status"]];
      int angle = [RCTConvert int:info[@"angle"]];
      int time = [RCTConvert int:info[@"time"]];
      NSDictionary* option = @{
       @"markerId":markerId,
       @"latitude":@(lat),
       @"longitude":@(lng),
       @"title": title,
       @"ico": ico,
       @"speed": @"10",
       @"status": @(status),
       @"angle": @(angle),
       @"time": @(time),
      };

      [_markesInfo setObject:option forKey:markerId];
      NSMutableArray *values = [[NSMutableArray alloc] init];
      [values addObject:option];
      [_inAreaMarkers setObject:values forKey:markerId];
    } else {
      CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
      [self setCenterCoordinate:point animated:YES];
      [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19 coordinate:point];
    }
  }
}

/**
 * 是否开启指南针
 */
-(void)setCompassOpenState:(BOOL)compassOpenState
{
  _compassState = compassOpenState;
}

/**
 * 地图轨迹适配
 */
-(void)setFitPolyLineSpan:(NSString*)fitPolyLineSpan
{
  if (fitPolyLineSpan) {
    NSArray *arr = [fitPolyLineSpan componentsSeparatedByString:@"|"]; //从字符A中分隔成2个元素的数组
//    NSString *str = [arr objectAtIndex:2];
    int span = [[arr firstObject] intValue];
    
    if (span != _fSpan) {
      _fSpan = [[arr firstObject] intValue];
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.25 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        NSArray* lines = self.overlays;
        BMKPolyline *polyLine = [lines firstObject];
        if (lines.count > 0) {
          [self mapViewFitPolyLine:polyLine bottomSpan:self->_fSpan];
        }
      });
    }
  }
}

/**
 * 实时追踪轨迹适配
 */
-(void)setTrackPolyLineSpan:(int)trackPolyLineSpan
{
  if (trackPolyLineSpan) {
    _trackPolyLineSpan = trackPolyLineSpan;
    NSArray* lines = self.overlays;
    if (lines.count > 0) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.25 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self mapViewFitPolyLine:[lines firstObject] bottomSpan:self->_trackPolyLineSpan];
      });
    }
  }
}


#pragma mark 开启地图的惯性缩放
- (void)mapView:(BMKMapView *)mapView openMapInertiaDragWithCoefficient:(float)inertiaCoefficient{
  /*惯性系数也就是方程的二次项系数*/
  [BMKMapViewAdapter mapView:mapView openInertiaDragWithCoefficient:inertiaCoefficient];
}

/**
 阻尼效果改变地图等级
 
 @param currentLevel  当前的等级
 @param settingLevel  要设定的等级
 */

- (void)dampZoomingMapLevelFromCurrentValue:(float)currentLevel ToSettingValue:(float)settingLevel{
  [BMKMapViewAdapter mapView:self.mapView dampZoomingMapLevelFromCurrentValue:currentLevel ToSettingValue:settingLevel];
}

-(void)mapView:(BMKMapView *)mapView didSelectAnnotationView:(BMKAnnotationView *)view
{
  [view setSelected:NO];
}

// 百度坐标转高德
-(AMapNaviPoint *)bdToGaodeWithLat:(double)lat andLon:(double)lon
{
  double bd_lon = lon - 0.0065;
  double bd_lat = lat - 0.006;
  return [AMapNaviPoint locationWithLatitude:bd_lat longitude:bd_lon];
}

// 动态控制地图比例尺位置
-(void)setBaiduMapScalePosition:(NSString *)value

{
  NSArray *arr = [value componentsSeparatedByString:@"|"];
  int x = [[arr firstObject] intValue];
  int y = [[arr lastObject] intValue];
  // self.showMapScaleBar = YES;
  self.mapScaleBarPosition = CGPointMake(x, self.frame.size.height - y);
}

// 监控对象设置聚焦跟踪
-(void)setMonitorFocusTrack:(NSString *)value
{
  NSArray *arr = [value componentsSeparatedByString:@"|"];
  NSString *monitorId = [arr firstObject];
  CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:monitorId];
  _centerPoint = monitorId;
  BOOL state = [[arr objectAtIndex:1] boolValue];
  if (annotation) {
    if (state) { // 开启聚焦跟踪
      // 获取当前监控对象的位置点，取最新点进行中心点设置和定位设置
      NSMutableArray *values = [_inAreaMarkers objectForKey:monitorId];
      if (values && values.count > 0) {
        NSMutableDictionary *option = [values lastObject];
        double lat = [RCTConvert double:option[@"latitude"]];
        double lng = [RCTConvert double:option[@"longitude"]];
        CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
        MovingAnnotationView *sportAnnotationView = [_optionsIcon objectForKey:monitorId];
        [sportAnnotationView removeLayer:annotation.coordinate];
        annotation.coordinate = point;
//        self.zoomLevel = 19;
//        [self setCenterCoordinate:point animated:YES];
        self.centerCoordinate = point;
        [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19 coordinate:point];
        [self createGCD:annotation];
        if (values.count > 1) {
          [values removeObjectsInRange:NSMakeRange(0, values.count - 1)];
        }
      }
      _monitorFocusId = monitorId;
    } else { // 关闭聚焦跟踪
      _monitorFocusId = nil;
      [self closeGCD];
    }
  } else {
    if (state) {
      NSDictionary *option = [_markesInfo objectForKey:monitorId];
      if (option != nil) {
        double lat = [RCTConvert double:option[@"latitude"]];
        double lng = [RCTConvert double:option[@"longitude"]];
        if (lat != 1000 && lng != 1000) {
          CLLocationCoordinate2D point = CLLocationCoordinate2DMake(lat, lng);
  //        self.zoomLevel = 19;
  //        [self setCenterCoordinate:point animated:YES];
          self.centerCoordinate = point;
          [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19 coordinate:point];
          _monitorFocusId = monitorId;
        }
      }
    }
  }
}

// 取消聚焦跟踪并通知到js端
-(void)cancelMonitorFocus:(NSString *)id
{
  if (self.onMonitorLoseFocus) {
    self.onMonitorLoseFocus(@{@"data": @"loseFocus"});
  }
  CustomBMKAnnotation* annotation = [_realTimeAnnotations objectForKey:id];
  if (annotation) {
    // annotation.tracking = NO;
    _monitorFocusId = nil;
    [self closeGCD];
  }
}

//
-(void)createGCD:(CustomBMKAnnotation *)annotation
{
  if (self.timer) {
    [self closeGCD];
  }
  
  dispatch_queue_t queue = dispatch_get_main_queue();
  //创建一个定时器（dispatch_source_t本质上还是一个OC对象）
  self.timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
  //设置定时器的各种属性
  dispatch_time_t start = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0*NSEC_PER_SEC));
  uint64_t interval = (uint64_t)(0.5*NSEC_PER_SEC);
  dispatch_source_set_timer(self.timer, start, interval, 0);
  //设置回调
  // __weak typeof(self) weakSelf = self;
  dispatch_source_set_event_handler(self.timer, ^{
    //定时器需要执行的操作
    [self isBeyondArea:annotation];
    
  });
  //启动定时器（默认是暂停）
  dispatch_resume(self.timer);
}

// 监听聚焦监控对象是否超出限定区域
-(void)isBeyondArea:(CustomBMKAnnotation *)annotation
{
  // CGRect bounds = self.bounds;
  CGPoint center = [self convertCoordinate:self.centerCoordinate toPointToView:self.mapView];
  CGPoint CGAnn = [self convertCoordinate:annotation.coordinate toPointToView:self.mapView];
  CGFloat width = fabs(center.x - CGAnn.x);
  CGFloat height = fabs(center.y - CGAnn.y);
  CGFloat value= sqrt(pow(width, 2) + pow(height, 2));
  if (value > 120) {
//    self.centerCoordinate = annotation.coordinate;
    [self setCenterCoordinate:annotation.coordinate animated:YES];
  }
}

// 结束GCD定时监听
-(void)closeGCD
{
  if (self.timer) {
    dispatch_cancel(self.timer);
    self.timer = nil;
  }
}

/**
 * 监控对象跳转到最新点
 */
-(void)setGoLatestPoin:(NSArray *)arr
{
  if (arr.count > 0) {
    NSDictionary *info = [arr firstObject];
    NSString *id = [RCTConvert NSString:info[@"monitorId"]];
    double latestLat = [RCTConvert double:info[@"latitude"]];
    double latestLng = [RCTConvert double:info[@"longitude"]];
    double time = [RCTConvert double:info[@"time"]];
    int status =[RCTConvert int:info[@"status"]];
    
    NSMutableArray *values = [_inAreaMarkers objectForKey:id];
    if (values) {
      NSMutableDictionary *option = [values lastObject];
      [option setValue: [[NSNumber alloc] initWithDouble: latestLat] forKey:@"latitude"];
      [option setValue:[[NSNumber alloc] initWithDouble: latestLng] forKey:@"longitude"];
      [option setValue:[[NSNumber alloc] initWithDouble: time] forKey:@"time"];
      [option setValue:[[NSNumber alloc] initWithDouble: status] forKey:@"status"];
      if (values.count > 1) {
        [values removeObjectsInRange:NSMakeRange(0, values.count - 1)];
      }
    }
    
    NSMutableDictionary *latestInfo = [_markesInfo objectForKey:id];
    if (latestInfo) {
      [latestInfo setValue: [[NSNumber alloc] initWithDouble: latestLat] forKey:@"latitude"];
      [latestInfo setValue:[[NSNumber alloc] initWithDouble: latestLng] forKey:@"longitude"];
      [latestInfo setValue:[[NSNumber alloc] initWithDouble: time] forKey:@"time"];
      [latestInfo setValue:[[NSNumber alloc] initWithDouble: status] forKey:@"status"];
    }
    
    CLLocationCoordinate2D point = CLLocationCoordinate2DMake(latestLat, latestLng);
    [self setCenterCoordinate:point animated:YES];
    self.zoomLevel = 19;
//    [self parabola_refreshMapZoomLevel:self.zoomLevel targetZoom:19];
    
    NSArray *annotations = self.annotations;
    for (int j = 0; j < annotations.count; j++) {
      if ([annotations[j] isKindOfClass:[CustomBMKAnnotation class]]) {
        CustomBMKAnnotation *cluann = annotations[j];
        if ([id isEqualToString: cluann.markerId]) {
          cluann.coordinate = point;
          break;
        }
      }
    }
  }
}

-(void)tileLayer
{
  BMKLocalSyncTileLayer *syncTile = [[BMKLocalSyncTileLayer alloc] init];
  syncTile.maxZoom = 21;
  syncTile.minZoom = 3;
  [self addOverlay:syncTile];
}

/**
 * 历史数据停止点
 */
- (void)createStopPoint:(NSArray *)stopPointData
{
  if (stopPointData.count > 0) {
    /**
     * 删除和清空停止点图标和数据
     */
    if (self.stopAnnotations) {
      [self removeAnnotations:[self.stopAnnotations allValues]];
      [self.stopAnnotations removeAllObjects];
    }
    /**
     * 创建停止点图标
     */
    for (int i = 0; i < stopPointData.count; i++) {
      NSDictionary *dic = stopPointData[i];
      NSDictionary *location = [dic objectForKey:@"startLocation"];
      CLLocationCoordinate2D coor = CLLocationCoordinate2DMake([location[@"latitude"] doubleValue], [location[@"longitude"] doubleValue]);
      BDStopAnnotation *stopPoint = [[BDStopAnnotation alloc] init];
      stopPoint.coordinate = coor;
      stopPoint.index = i;
      stopPoint.type = @"default";
      [self addAnnotation:stopPoint];
      if (!self.stopAnnotations) {
        self.stopAnnotations = [[NSMutableDictionary alloc] init];
      }
      [self.stopAnnotations setObject:stopPoint forKey:@(i)];
    }
  };
}

/**
 * 地图历史数据停止点数据
 */
-(void)setStopPoints:(NSArray *)stopPoints
{
  if (stopPoints) {
    self.stopActiveIndex = -1;
    [self createStopPoint:stopPoints];
  }
}

/**
 * 地图历史数据停止点数据
 */
-(void)setStopIndex:(int)index
{
  if (index != -1 && index != self.stopActiveIndex) {
    if (self.stopAnnotations) {
      BDStopAnnotation *stopAnnotation = [self.stopAnnotations objectForKey:@(index)];
      if (stopAnnotation) {
        NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
        NSNumber *lat = [[NSNumber alloc] initWithDouble:stopAnnotation.coordinate.latitude];
        NSNumber *lng = [[NSNumber alloc] initWithDouble:stopAnnotation.coordinate.longitude];
        [option setObject:lat forKey:@"latitude"];
        [option setObject:lng forKey:@"longitude"];
        [option setObject:@"stopPoint" forKey:@"type"];
        [option setObject:@(index) forKey:@"index"];
        [self getAddress:option];
        /**
         * 删除高亮annotation
         */
        BDStopAnnotation *oldStopAnnotation = [self.stopAnnotations objectForKey:@(self.stopActiveIndex)];
        if (oldStopAnnotation != nil) {
          double latitude = oldStopAnnotation.coordinate.latitude;
          double longitude = oldStopAnnotation.coordinate.longitude;
          [self removeAnnotation:oldStopAnnotation];
          [self.stopAnnotationViews removeObjectForKey:@(self.stopActiveIndex)];
          [self.stopAnnotations removeObjectForKey:@(self.stopActiveIndex)];
          /**
           * 创建默认停止图标
           */
          
          CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(latitude, longitude);
          BDStopAnnotation *stopPoint = [[BDStopAnnotation alloc] init];
          stopPoint.coordinate = coor;
          stopPoint.index = self.stopActiveIndex;
          stopPoint.type = @"default";
          [self addAnnotation:stopPoint];
          [self.stopAnnotations setObject:stopPoint forKey:@(self.stopActiveIndex)];
        }
        self.stopActiveIndex = index;
        
        /**
         * 创建高亮停止图标
         */
        CLLocationCoordinate2D activeCoor = CLLocationCoordinate2DMake(stopAnnotation.coordinate.latitude, stopAnnotation.coordinate.longitude);
        [self removeAnnotation:stopAnnotation];
        [self.stopAnnotationViews removeObjectForKey:@(index)];
        BDStopAnnotation *stopActivePoint = [[BDStopAnnotation alloc] init];
        stopActivePoint.coordinate = activeCoor;
        stopActivePoint.index = index;
        stopActivePoint.type = @"active";
        [self addAnnotation:stopActivePoint];
        [self.stopAnnotations setObject:stopActivePoint forKey:@(index)];
      }
    }
  } else if (index == -1) {
    /**
     * 删除高亮annotation
     */
    BDStopAnnotation *oldStopAnnotation = [self.stopAnnotations objectForKey:@(self.stopActiveIndex)];
    double latitude = oldStopAnnotation.coordinate.latitude;
    double longitude = oldStopAnnotation.coordinate.longitude;
    [self removeAnnotation:oldStopAnnotation];
    [self.stopAnnotationViews removeObjectForKey:@(self.stopActiveIndex)];
    [self.stopAnnotations removeObjectForKey:@(self.stopActiveIndex)];
    /**
     * 创建默认停止图标
     */
    
    CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(latitude, longitude);
    BDStopAnnotation *stopPoint = [[BDStopAnnotation alloc] init];
    stopPoint.coordinate = coor;
    stopPoint.index = self.stopActiveIndex;
    stopPoint.type = @"default";
    [self addAnnotation:stopPoint];
    [self.stopAnnotations setObject:stopPoint forKey:@(self.stopActiveIndex)];
    self.stopActiveIndex = index;
  }
}

- (void)stopPointAddressCallBack:(NSDictionary *)data
{
  if (self.onStopPointDataEvent) {
    self.onStopPointDataEvent(data);
  }
}

- (void)parabola_refreshMapZoomLevel: (float) currentZoom targetZoom: (float) zoom coordinate: (CLLocationCoordinate2D) coordinate
{
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    float tZoom = self.zoomLevel;
    if (tZoom == zoom) return;
    float unitZoomLevelDuringTime = 0.04;
    int count = 25;
    if (zoom - currentZoom < 10) {
      count = 5;
    }
    float tempZoomLevel = (float) (zoom - currentZoom)/count;
    for (int i = 1; i <= count; i++) {
      dispatch_time_t time =  dispatch_time(DISPATCH_TIME_NOW, (uint64_t)(NSEC_PER_SEC * (i*unitZoomLevelDuringTime)));
      float level = tempZoomLevel*i + currentZoom;
      dispatch_after(time, dispatch_get_main_queue(), ^{
        [self setCenterCoordinate:coordinate];
        [self setZoomLevel: level];
      });
    }
  });
}

-(void)setMinZoomState:(double)number
{
  self.zoomLevel = 5;
  CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(40.664248, 105.120685);
  self.centerCoordinate = coor;
}

/**
 * 主页标注物移动压点
 */
-(void)setDotData:(NSDictionary *)obj
{
  _dotType = [RCTConvert BOOL:obj[@"dotType"]];
  _dotValue = [[RCTConvert NSString:obj[@"dotValue"]] intValue];
}

/**
 * 轨迹回放轨迹线粗细
 */
-(void)setTrajectoryData:(NSDictionary *)obj
{
  _trajectoryType = [RCTConvert BOOL:obj[@"trajectoryType"]];
  _trajectoryValue = [RCTConvert double:obj[@"trajectoryValue"]];
}

@end
