//
//  RNBridgeModule.m
//  scanning
//
//  Created by zwkj on 2019/6/11.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "RNBridgeModule.h"

#import "AppDelegate.h"
#import "OCRPeopleIdCardInfoViewController.h"

#import "OCRDrivingInfoViewController.h"
#import "OCRTransportInfoViewController.h"
#import "OCRCarPhotoViewController.h"
#import "OCRPractitionersViewController.h"
#import "OCRSingleton.h"
#import "OCRServices.h"
#import "OCREmitterModule.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@implementation RNBridgeModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(backToViewController:(NSDictionary *)options){
  
  OCREmitterModule *eventEmitter = [OCREmitterModule allocWithZone:nil];
  [eventEmitter onEnterOCR:nil];
  NSString *http = [options objectForKey:@"http"];
  NSString *token = [options objectForKey:@"token"];
  NSString *monitorId = [options objectForKey:@"monitorId"];
  NSString *monitorName = [options objectForKey:@"monitorName"];
  NSString *platform = [options objectForKey:@"platform"];
  NSString *version = [options objectForKey:@"version"];
  NSString *imageWebUrl = [options objectForKey:@"imageWebUrl"];
  [OCRSingleton sharedSingleton].http = http;
  [OCRSingleton sharedSingleton].token = token;
  [OCRSingleton sharedSingleton].monitorId = monitorId;
  [OCRSingleton sharedSingleton].monitorName = monitorName;
  [OCRSingleton sharedSingleton].platform = platform;
  [OCRSingleton sharedSingleton].version = version;
  [OCRSingleton sharedSingleton].imageWebUrl = imageWebUrl;
//  [OCRServices attempDealloc];
  
  NSInteger index = [[options objectForKey:@"monitorType"] integerValue];
  dispatch_async(dispatch_get_main_queue(), ^{
    AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    if (index == 1) {
      OCRPeopleIdCardInfoViewController *one = [[OCRPeopleIdCardInfoViewController alloc] init];
      [app.nav pushViewController:one animated:YES];
    } else if (index == 0) {
//      CGSize size = {20, 20};
      // 行驶证
      OCRDrivingInfoViewController *drivingInfo = [[OCRDrivingInfoViewController alloc] init];
      drivingInfo.tabBarItem.title = @"行驶证";
      drivingInfo.tabBarItem.image = [[UIImage imageNamed:@"vehicleLicenseBlurIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"vehicleLicenseBlurIcon.png"] size:size];
      drivingInfo.tabBarItem.selectedImage = [[UIImage imageNamed:@"vehicleLicenseFocusIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"vehicleLicenseFocusIcon.png"] size:size];
      [drivingInfo.tabBarItem setTitleTextAttributes:@{NSForegroundColorAttributeName:UIColorFromRGB(0x339eff)} forState:UIControlStateSelected];
      // 运输证
      OCRTransportInfoViewController *transportInfo = [[OCRTransportInfoViewController alloc] init];
      transportInfo.tabBarItem.title = @"运输证";
      transportInfo.tabBarItem.image = [[UIImage imageNamed:@"transportBlurIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"transportBlurIcon.png"] size:size];
      transportInfo.tabBarItem.selectedImage = [[UIImage imageNamed:@"transportFocusIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"transportFocusIcon.png.png"] size:size];
      [transportInfo.tabBarItem setTitleTextAttributes:@{NSForegroundColorAttributeName:UIColorFromRGB(0x339eff)} forState:UIControlStateSelected];
      // 从业人员
      OCRPractitionersViewController *practitioners = [[OCRPractitionersViewController alloc] init];
      practitioners.tabBarItem.title = @"从业人员";
      practitioners.tabBarItem.image = [[UIImage imageNamed:@"idCardBlurIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"idCardBlurIcon.png"] size:size];
      practitioners.tabBarItem.selectedImage = [[UIImage imageNamed:@"idCardFocusIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"idCardFocusIcon.png"] size:size];
      [practitioners.tabBarItem setTitleTextAttributes:@{NSForegroundColorAttributeName:UIColorFromRGB(0x339eff)} forState:UIControlStateSelected];
      // 车辆照片
      OCRCarPhotoViewController *carPhoto = [[OCRCarPhotoViewController alloc] init];
      carPhoto.tabBarItem.title = @"车辆照片";
      carPhoto.tabBarItem.image = [[UIImage imageNamed:@"carPhotoBlurIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"carPhotoBlurIcon.png"] size:size];
      carPhoto.tabBarItem.selectedImage = [[UIImage imageNamed:@"carPhotoFocusIcon-1.png"] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]; // [self scaleToSize:[UIImage imageNamed:@"carPhotoFocusIcon.png"] size:size];
      [carPhoto.tabBarItem setTitleTextAttributes:@{NSForegroundColorAttributeName:UIColorFromRGB(0x339eff)} forState:UIControlStateSelected];
      
      UITabBarController *tabs = [[UITabBarController alloc] init];
//      tabs.viewControllers = @[drivingInfo, transportInfo, practitioners, carPhoto];
//      [app.nav pushViewController:tabs animated:YES];
      
      [tabs addChildViewController:drivingInfo];
      [tabs addChildViewController:transportInfo];
      [tabs addChildViewController:practitioners];
      [tabs addChildViewController:carPhoto];
      
      [app.nav pushViewController:tabs animated:YES];
    }
  });
}

-(UIImage *)scaleToSize:(UIImage *)img size:(CGSize)newSize
{
  UIGraphicsBeginImageContext(newSize);
  [img drawInRect:CGRectMake(0, 0, newSize.width, newSize.height)];
  UIImage *scaleImage = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return scaleImage;
}

@end
