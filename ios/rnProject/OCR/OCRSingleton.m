//
//  OCRSingleton.m
//  scanning
//
//  Created by zwkj on 2019/7/8.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRSingleton.h"

@implementation OCRSingleton

@synthesize http;
@synthesize token;
@synthesize monitorId;
@synthesize monitorName;
@synthesize platform;
@synthesize version;
@synthesize oldPhotoUrl;
@synthesize practitionersId;
@synthesize carType;
@synthesize isICType;
@synthesize isAddPractitioners;
@synthesize idCardData;
@synthesize driverLicenseData;
@synthesize qualificationCertificateData;
@synthesize peopleName;
@synthesize imageWebUrl;
@synthesize tableSelectedIndex;
@synthesize isNativePage;
@synthesize isLoadData;

+ (OCRSingleton *)sharedSingleton
{
  static OCRSingleton *sharedSingleton;
  
  @synchronized (self) {
    if (!sharedSingleton) {
      sharedSingleton = [[OCRSingleton alloc] init];
      return sharedSingleton;
    }
  }
  return sharedSingleton;
}

@end
