//
//  OCRSingleton.h
//  scanning
//
//  Created by zwkj on 2019/7/8.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface OCRSingleton : NSObject
{
  NSString *http;
  NSString *token;
  NSString *monitorId;
  NSString *monitorName;
  NSString *platform;
  NSString *version;
  NSString *oldPhotoUrl;
  NSString *practitionersId;
  NSString *carType;
  BOOL isICType;
  BOOL isAddPractitioners;
  NSArray *idCardData;
  NSArray *driverLicenseData;
  NSArray *qualificationCertificateData;
  NSString *peopleName;
  NSString *imageWebUrl;
  int tableSelectedIndex;
  BOOL isNativePage;
  BOOL isLoadData;
}

+ (OCRSingleton *)sharedSingleton;

@property (nonatomic, retain) NSString *http;
@property (nonatomic, retain) NSString *token;
@property (nonatomic, retain) NSString *monitorId;
@property (nonatomic, retain) NSString *monitorName;
@property (nonatomic, retain) NSString *platform;
@property (nonatomic, retain) NSString *version;
@property (nonatomic, retain) NSString *oldPhotoUrl;
@property (nonatomic, retain) NSString *practitionersId;
@property (nonatomic, retain) NSString *carType;
@property (nonatomic, assign) BOOL isICType;
@property (nonatomic, assign) BOOL isAddPractitioners;
@property (nonatomic, retain) NSArray *idCardData;
@property (nonatomic, retain) NSArray *driverLicenseData;
@property (nonatomic, retain) NSArray *qualificationCertificateData;
@property (nonatomic, retain) NSString *peopleName;
@property (nonatomic, retain) NSString *imageWebUrl;
@property (nonatomic, assign) int tableSelectedIndex;
@property (nonatomic, assign) BOOL isNativePage;
@property (nonatomic, assign) BOOL isLoadData;

@end

