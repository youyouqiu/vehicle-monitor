//
//  LocationPermissionsModule.m
//  rnProject
//
//  Created by zwkj on 2019/2/24.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "locationPermissionsModule.h"
#import <CoreLocation/CoreLocation.h>

@implementation LocationPermissionsModule

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(getLocationState,name:(NSString *)testStr
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  CLAuthorizationStatus stateInfo = [CLLocationManager authorizationStatus];
  if (stateInfo == kCLAuthorizationStatusDenied) {
    resolve(@(false));
  } else {
    resolve(@(true));
  }
}

@end
