//
//  RCTBaiduMapManager.m
//  rnProject
//
//  Created by 敖祥华 on 2018/8/12.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <CoreLocation/CoreLocation.h>

#import "RCTBaiduMapViewManager.h"
@implementation RCTBaiduMapManager
RCT_EXPORT_MODULE()

/**
 *地图实时路况
 */
RCT_EXPORT_VIEW_PROPERTY(trafficEnabled, BOOL)

/**
 * 显示地图类型
 */
RCT_EXPORT_VIEW_PROPERTY(bMapType, int)

/**
 * 批量创建标注
 */
RCT_EXPORT_VIEW_PROPERTY(markers, NSArray*)

/**
 * 创建线
 */
RCT_EXPORT_VIEW_PROPERTY(overlayPoints, NSArray*)

/**
 * 设置中心点
 */
RCT_EXPORT_VIEW_PROPERTY(centerLatLng, NSDictionary*)

/**
 * 设置路线
 */
RCT_EXPORT_VIEW_PROPERTY(routePlan, NSArray*)

/**
 * 开启定位
 */
RCT_EXPORT_VIEW_PROPERTY(locationManager, BOOL)

/**
 * 轨迹回放
 */
RCT_EXPORT_VIEW_PROPERTY(sportPath, NSArray*)

/**
 * 控制轨迹回放播放状态
 */
RCT_EXPORT_VIEW_PROPERTY(sportPathPlay, BOOL)

/**
 * 设置轨迹回放播放速度
 */
RCT_EXPORT_VIEW_PROPERTY(sportSpeed, double)

/**
 * 设置轨迹回放位置点
 */
RCT_EXPORT_VIEW_PROPERTY(sportIndex, NSArray*)

/**
 * 设置需要在地图中心点显示标注点id
 */
RCT_EXPORT_VIEW_PROPERTY(centerPoint, NSString*)

/**
 * 点击地图
 */
RCT_EXPORT_VIEW_PROPERTY(onMapClick, RCTBubblingEventBlock)

/**
 * 返回位置信息
 */
RCT_EXPORT_VIEW_PROPERTY(onAddress, RCTBubblingEventBlock)

/**
 * 返回区域内标注物信息
 */
RCT_EXPORT_VIEW_PROPERTY(onInAreaOptions, RCTBubblingEventBlock)

/**
 * 音视频监控--用于删除需要去掉的标注物点
 */
RCT_EXPORT_VIEW_PROPERTY(removeAnnotation, NSString*)

/**
 * 设置聚焦跟踪标注物
 */
RCT_EXPORT_VIEW_PROPERTY(pointTracking, NSString*)

/**
 * 获取当前定位信息成功回调事件
 */
RCT_EXPORT_VIEW_PROPERTY(onLocationSuccess, RCTBubblingEventBlock)

/**
 * 设置实时尾迹
 */
RCT_EXPORT_VIEW_PROPERTY(realTimeWake, BOOL)

/**
 * 路径规划距离返回事件
 */
RCT_EXPORT_VIEW_PROPERTY(onPlanDistance, RCTBubblingEventBlock)

/**
 * 地图初始化完成事件
 */
RCT_EXPORT_VIEW_PROPERTY(onMapInitFinish, RCTBubblingEventBlock)

/**
 * 实时追踪当前定位
 */
RCT_EXPORT_VIEW_PROPERTY(trackCurrentLocation, BOOL)

/**
 * 实时追踪目标定位
 */
RCT_EXPORT_VIEW_PROPERTY(wakeTargetLocation, BOOL)

/**
 * 实时尾迹当前定位
 */
RCT_EXPORT_VIEW_PROPERTY(wakeCurrentLocation, BOOL)

/**
 * 实时尾迹目标定位
 */
RCT_EXPORT_VIEW_PROPERTY(trackTargetLocation, BOOL)

/**
 * 实时尾迹
 */
RCT_EXPORT_VIEW_PROPERTY(wakeData, NSArray*)

/**
 * 位置信息查询
 */
RCT_EXPORT_VIEW_PROPERTY(searchAddress, NSArray*)

/**
 * 放大地图
 * mapAmplification
 */
RCT_EXPORT_VIEW_PROPERTY(mapAmplification, NSArray*)

/**
 * 缩小地图
 * mapNarrow
 */
RCT_EXPORT_VIEW_PROPERTY(mapNarrow, NSArray*)

/**
 * 地图初始化完成事件
 */
RCT_EXPORT_VIEW_PROPERTY(onPointClickEvent, RCTBubblingEventBlock)

/**
 * 定位监控对象，进行居中显示
 */
RCT_EXPORT_VIEW_PROPERTY(monitorFocus, NSArray*)

/**
 * 聚合数量
 */
RCT_EXPORT_VIEW_PROPERTY(aggrNum, int);

/**
 * 标明是否是主页
 */
RCT_EXPORT_VIEW_PROPERTY(isHome, BOOL);

/**
 * 点名下发
 */
RCT_EXPORT_VIEW_PROPERTY(latestLocation, NSDictionary*);

/**
 * 拒绝获取定位事件
 */
RCT_EXPORT_VIEW_PROPERTY(onLocationStatusDenied, RCTBubblingEventBlock)

/**
 * 指南针是否开启
 */
RCT_EXPORT_VIEW_PROPERTY(compassOpenState, BOOL);

/**
 * 地图轨迹适配
 */
RCT_EXPORT_VIEW_PROPERTY(fitPolyLineSpan, NSString*);

/**
 * 声明处于哪个页面
 */
RCT_EXPORT_VIEW_PROPERTY(pageDet, NSString*);

/**
 * 创建独立的一个标注物
 */
RCT_EXPORT_VIEW_PROPERTY(videoMarker, NSArray*)

/**
 * 地图实时追踪轨迹适配
 */
RCT_EXPORT_VIEW_PROPERTY(trackPolyLineSpan, int)

/**
 * BaiduMapScalePosition
 * 改变地图比例尺位置
 */
RCT_EXPORT_VIEW_PROPERTY(baiduMapScalePosition, NSString*)

/**
 * 主页监控对象聚焦跟踪
 */
RCT_EXPORT_VIEW_PROPERTY(monitorFocusTrack, NSString*)

/**
 * 取消监控对象聚焦跟踪通知事件
 */
RCT_EXPORT_VIEW_PROPERTY(onMonitorLoseFocus, RCTBubblingEventBlock)

/**
 * 地图监控对象跳转到最新位置点
 */
RCT_EXPORT_VIEW_PROPERTY(goLatestPoin, NSArray*)

/**
 * 聚合点长按事件
 */
RCT_EXPORT_VIEW_PROPERTY(onClustersClickEvent, RCTBubblingEventBlock)

/**
 * 地图监控对象跳转到最新位置点完成事件通知
 */
//RCT_EXPORT_VIEW_PROPERTY(onGoLatestPoinEvent, RCTBubblingEventBlock)

/**
 * 地图停止点数据
 */
RCT_EXPORT_VIEW_PROPERTY(stopPoints, NSArray*)

/**
 * 地图停止点当前聚焦位置
 */
RCT_EXPORT_VIEW_PROPERTY(stopIndex, int)

/**
 * 返回停止点位置信息
 */
RCT_EXPORT_VIEW_PROPERTY(onStopPointDataEvent, RCTBubblingEventBlock)

/**
 * 返回停止点index
 */
RCT_EXPORT_VIEW_PROPERTY(onStopPointIndexEvent, RCTBubblingEventBlock)

/**
 * 速度分段
 */
RCT_EXPORT_VIEW_PROPERTY(speedPiecewise, NSArray*)

/**
 * 地图层级跳到最小层级
 */
RCT_EXPORT_VIEW_PROPERTY(minZoomState, double);

/**
 * 主页标注物移动压点
 */
RCT_EXPORT_VIEW_PROPERTY(dotData, NSDictionary*);

/**
 * 轨迹回放轨迹线粗细
 */
RCT_EXPORT_VIEW_PROPERTY(trajectoryData, NSDictionary*);

/**
 * 初始化视图
 */
-(UIView *)view
{
  RCTBaiduMapView* mapView = [[RCTBaiduMapView alloc] init];
  // 设置地图初始属性
//  CLLocationManager *manager = [[CLLocationManager alloc] init];
//  CLLocationCoordinate2D location = manager.location.coordinate;
//  if (location.latitude != 0 && location.longitude != 0) {
//    mapView.centerCoordinate = manager.location.coordinate;
//    mapView.zoomLevel = 15;
//  }
  mapView.zoomLevel = 5;
  mapView.overlookEnabled = NO;
  CLLocationCoordinate2D coor = CLLocationCoordinate2DMake(40.664248, 105.120685);
  mapView.centerCoordinate = coor;
//  mapView.delegate = mapView;
  return mapView;
}

@end
