//
//  IdleTimerModule.m
//  rnProject
//
//  Created by zwlbs on 2020/9/27.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "IdleTimerModule.h"

@implementation IdleTimerModule

RCT_EXPORT_MODULE();


RCT_EXPORT_METHOD(open)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication sharedApplication].idleTimerDisabled = YES;
  });
}

RCT_EXPORT_METHOD(close)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication sharedApplication].idleTimerDisabled = NO;
  });
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"EventReminder"];
}

@end
