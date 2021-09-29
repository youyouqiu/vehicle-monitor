//
//  OCREmitterModule.m
//  rnProject
//
//  Created by zwkj on 2019/7/31.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCREmitterModule.h"

@implementation OCREmitterModule

+ (id)allocWithZone:(NSZone *)zone {
  static OCREmitterModule *sharedInstance = nil;
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
    [[NSNotificationCenter defaultCenter]postNotificationName:@"emitterOcr" object:nil];
  });
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onEnterOCR", @"onExitOCR"];
}

- (void)onEnterOCR:(NSNotification *)notification {
  [self sendEventWithName:@"onEnterOCR" body:@{@"name": @"onEnterOCR"}];
}

- (void)onExitOCR:(NSNotification *)notification {
  [self sendEventWithName:@"onExitOCR" body:@{@"name": @"onExitOCR"}];
}

@end
