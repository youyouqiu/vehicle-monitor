//
//  RNAMapNaviModule.h
//  rnProject
//
//  Created by zwkj on 2019/2/19.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RNAMapNaviModule : RCTEventEmitter<RCTBridgeModule>

- (void)addEventReminderReceived:(NSNotification *)notification;

// 无法获取当前位置
- (void)unableGetCurrentLocation: (NSNotification *)notification;

// 无法获取监控对象位置
- (void)unableGetTargetLocation: (NSNotification *)notification;

// 用户未开启定位权限
- (void)notEnadledLocationPermission: (NSNotification *)notification;

@end
