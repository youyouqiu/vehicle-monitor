//
//  OCRServices.h
//  scanning
//
//  Created by zwkj on 2019/7/8.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface OCRServices : NSObject

/**
 * 上传图片
 */
- (void)uploadImage:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 获取人员身份证信息
 */
-(void)requestIdCardInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 上传人员身份证信息
 */
-(void)uploadIdCardInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 获取行驶证信息
 */
- (void)requestVehicleDriveLicenseInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 上传车辆行驶证正本信息
 */
-(void)uploadVehicleDriveLicenseFrontInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 上传车辆行驶证副本信息
 */
-(void)uploadVehicleDriveLicenseDuplicateInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 获取车辆的运输证信息
 */
-(void)requestTransportNumberInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 上传车辆的运输证信息
 */
-(void)uploadTransportNumberInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 获取从业人员列表
 */
-(void)requestPractitionersList:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 获取从业人员信息
 */
-(void)requestPractitionersInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 上传从业人员信息
 */
-(void)uploadPractitionersInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 获取车辆照片
 */
-(void)requestCarPhoto:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 上传车辆照片
 */
-(void)uploadCarPhoto:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

/**
 * 绑定从业人员
 */
-(void)bindPractitioners:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler;

+ (instancetype)shardService;

// + (void)attempDealloc;

@end

