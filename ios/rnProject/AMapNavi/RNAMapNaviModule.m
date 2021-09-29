//
//  RNAMapNaviModule.m
//  rnProject
//
//  Created by zwkj on 2019/2/19.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "RNAMapNaviModule.h"

@implementation RNAMapNaviModule

+ (id)allocWithZone:(NSZone *)zone {
  static RNAMapNaviModule *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [super allocWithZone:zone];
  });
  return sharedInstance;
}

RCT_EXPORT_MODULE();


RCT_EXPORT_METHOD(openAMapNavi:(NSString *)event)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [[NSNotificationCenter defaultCenter]postNotificationName:@"openAMapNavi" object:nil];
  });
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"EventReminder", @"unableGetCurrentLocation", @"unableGetTargetLocation", @"notEnadledLocationPermission"];
}

- (void)addEventReminderReceived:(NSNotification *)notification {
  [self sendEventWithName:@"EventReminder" body:@{@"name": @"FlyElephant"}];
}

- (void)unableGetCurrentLocation:(NSNotification *)notification {
  [self sendEventWithName:@"unableGetCurrentLocation" body:@{@"name": @"unableGetCurrentLocation"}];
}

- (void)unableGetTargetLocation:(NSNotification *)notification {
  [self sendEventWithName:@"unableGetTargetLocation" body:@{@"name": @"unableGetTargetLocation"}];
}

- (void)notEnadledLocationPermission:(NSNotification *)notification {
  [self sendEventWithName:@"notEnadledLocationPermission" body:@{@"name": @"notEnadledLocationPermission"}];
}

@end
