//
//  OCRServices.m
//  scanning
//
//  Created by zwkj on 2019/7/8.
//  Copyright © 2019年 Facebook. All rights reserved.
//

//#import "OCRValidationViewController.h"
//#import "OCRDrivingInfoValidationViewController.h"
//#import "OCRTransportInfoValidationViewController.h"
//#import "OCRPractitionersValidationViewController.h"
//#import "OCRCarPhotoValidateViewController.h"

#import "OCRServices.h"
#import "OCRSingleton.h"
#import "LoadingView.h"
#import "ToastView.h"

static NSString *const POST = @"POST";
static NSString *const GET = @"GET";
static NSString *const URL_UPLOAD_IMAGE = @"/clbs/app/appOcr/monitorInfo/uploadImage";
static NSString *const URL_GET_IDCARD = @"/clbs/app/appOcr/monitorInfo/getIdentityCardInfo";
static NSString *const URL_UPLOAD_IDCARD = @"/clbs/app/appOcr/monitorInfo/uploadIdentityCardInfo";
static NSString *const URL_GET_VEHICLEDRIVELICENSE = @"/clbs/app/appOcr/monitorInfo/getVehicleDriveLicenseInfo";
static NSString *const URL_UPLOAD_VEHICLEDRIVELICENCEFRONT = @"/clbs/app/appOcr/monitorInfo/uploadVehicleDriveLicenseFrontInfo";
static NSString *const URL_UPLOAD_VEHICLEDRIVELICENCEDUPLICATE = @"/clbs/app/appOcr/monitorInfo/uploadVehicleDriveLicenseDuplicateInfo";
static NSString *const URL_GET_TRANSPORTNUMBER = @"/clbs/app/appOcr/monitorInfo/getTransportNumberInfo";
static NSString *const URL_UPLOAD_TRANSPORTNUMBER = @"/clbs/app/appOcr/monitorInfo/uploadTransportNumberInfo";
static NSString *const URL_GET_PRACTITIONERSLIST = @"/clbs/app/ocr/professionals/getList";
static NSString *const URL_GET_PRACTITIONERSINFO = @"/clbs/app/ocr/professionals/getInfo";
static NSString *const URL_UPLOAD_PRACTITIONERSINFO = @"/clbs/app/ocr/professionals/saveInfo";
static NSString *const URL_GET_CARPHOTO = @"/clbs/app/appOcr/monitorInfo/getVehiclePhotoInfo";
static NSString *const URL_UPLOAD_CARPHOTO = @"/clbs/app/appOcr/monitorInfo/uploadVehiclePhoto";
static NSString *const URL_BIND_PRACTITIONERS = @"/clbs/app/ocr/professionals/bind";

// static dispatch_once_t onceToken;

@implementation OCRServices
{
  NSString *http;
  NSString *token;
  NSString *platform;
  NSString *version;
  NSURLSession *_apiSession;
//  NSString *imageWebUrl;
}

- (instancetype)init {
  if (self = [super init]) {
    http = [OCRSingleton sharedSingleton].http;
    token = [OCRSingleton sharedSingleton].token;
    platform = [OCRSingleton sharedSingleton].platform;
    version = [OCRSingleton sharedSingleton].version;
//    imageWebUrl = [OCRSingleton sharedSingleton].imageWebUrl;
    
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    [configuration setHTTPAdditionalHeaders:@{
                                              @"Accept": @"application/json"
                                              }];
    // 如果网络状况不好，可以在这里修改超时时间
    configuration.timeoutIntervalForRequest = 30;
    configuration.timeoutIntervalForResource = 30;
    _apiSession = [NSURLSession sessionWithConfiguration:configuration];
  }
  return self;
}

/**
 * 上传图片
 */
- (void)uploadImage:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  UIImage *image = [params objectForKey:@"decodeImage"];
  NSData *imageData = [self jpgDataWithImage:image sizeLimit:4096000];
  NSString *str = [imageData base64EncodedStringWithOptions:0];
  
//  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  // 通用文字识别的图片清晰点更合适，满足接口max limit即可
//  NSData *imageData = [self jpgDataWithImage:image sizeLimit:4096000];
//  dict[@"decodeImage"] = @"sssss";// [imageData base64EncodedStringWithOptions:0];
  NSDictionary *dic = @{
                        @"decodeImage": str,
                        };
  
  
//  NSDictionary *newParams = @{
//                              @"decodeImage": [imageData base64EncodedStringWithOptions:0],
//                            };
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_UPLOAD_IMAGE, token, platform, version];
  [self _apiRequestWithURL:url options:dic requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 获取人员身份证信息
 */
- (void)requestIdCardInfo:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_GET_IDCARD, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:GET successHandler:successHandler failHandler:failHandler];
}

/**
 * 上传人员身份证信息
 */
- (void)uploadIdCardInfo:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_UPLOAD_IDCARD, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 获取行驶证信息
 */
- (void)requestVehicleDriveLicenseInfo:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_GET_VEHICLEDRIVELICENSE, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:GET successHandler:successHandler failHandler:failHandler];
}

/**
 * 上传车辆行驶证正本信息
 */
- (void)uploadVehicleDriveLicenseFrontInfo:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_UPLOAD_VEHICLEDRIVELICENCEFRONT, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 上传车辆行驶证副本信息
 */
- (void)uploadVehicleDriveLicenseDuplicateInfo:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_UPLOAD_VEHICLEDRIVELICENCEDUPLICATE, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 获取车辆的运输证信息
 */
- (void)requestTransportNumberInfo:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_GET_TRANSPORTNUMBER, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:GET successHandler:successHandler failHandler:failHandler];
}

/**
 * 上传车辆的运输证信息
 */
- (void)uploadTransportNumberInfo:(NSDictionary *)params successHandler:(void (^)(id))successHandler failHandler:(void (^)(NSError *))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_UPLOAD_TRANSPORTNUMBER, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 获取从业人员列表
 */
-(void)requestPractitionersList:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_GET_PRACTITIONERSLIST, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 获取从业人员信息
 */
-(void)requestPractitionersInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_GET_PRACTITIONERSINFO, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 上传从业人员信息
 */
-(void)uploadPractitionersInfo:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_UPLOAD_PRACTITIONERSINFO, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 获取车辆照片
 */
-(void)requestCarPhoto:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_GET_CARPHOTO, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:GET successHandler:successHandler failHandler:failHandler];
}

/**
 * 上传车辆照片
 */
-(void)uploadCarPhoto:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_UPLOAD_CARPHOTO, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}

/**
 * 绑定从业人员
 */
-(void)bindPractitioners:(NSDictionary *)params successHandler:(void (^)(id result))successHandler failHandler:(void (^)(NSError *err))failHandler
{
  NSString *url = [NSString stringWithFormat:@"%@%@?access_token=%@&platform=%@&version=%@", http, URL_BIND_PRACTITIONERS, token, platform, version];
  [self _apiRequestWithURL:url options:params requestType:POST successHandler:successHandler failHandler:failHandler];
}


/**
 * 通用的请求API服务的方法
 */
- (void)_apiRequestWithURL:(NSString *)URL
                   options:(NSDictionary *)options
               requestType:(NSString *)type
            successHandler:(void (^)(id result))successHandler
               failHandler:(void (^)(NSError *err))failHandler
{
  [[LoadingView shareInstance] loadingHidden:NO];
  NSMutableURLRequest *request = nil;
  if ([type isEqualToString:POST]) {
    NSURL *url = [NSURL URLWithString:URL];
    request = [NSMutableURLRequest requestWithURL:url];
    [request setHTTPMethod:POST];
    UIImage *image = [options objectForKey:@"decodeImage"];
    NSString *formData = nil;
    if (image == nil) {
      formData = [OCRServices dealWithParam:options];
    } else {
      formData = [OCRServices wwwFormWithDictionary:options];
    }
    [request setHTTPBody:[formData dataUsingEncoding:NSUTF8StringEncoding]];
  } else {
    NSURL *url = [NSURL URLWithString:[NSString stringWithFormat:@"%@&%@", URL, [OCRServices wwwFormWithDictionary:options]]];
    request = [NSMutableURLRequest requestWithURL:url];
  }
  [request setValue:@"application/x-www-form-urlencoded" forHTTPHeaderField:@"Content-Type"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
  
  [[_apiSession dataTaskWithRequest:request
                 completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
                   dispatch_async(dispatch_get_main_queue(), ^{
                     [[LoadingView shareInstance] loadingHidden:YES];
                   });
                   if (error) {
                     if (failHandler) failHandler(error);
                     return;
                   }
                   NSError *serializedErr = nil;
                   id obj = [NSJSONSerialization JSONObjectWithData:data options:0 error:&serializedErr];
                   if (serializedErr) {
                     if (failHandler) failHandler(error);
                     return;
                   }
                   if (obj[@"error_code"]){
                     if ([obj[@"error_code"] intValue] == 0) {
                       if (successHandler){
                         successHandler(obj);
                         return;
                       }
                     }
                     if (failHandler) failHandler(error);
                     return;
                   }
                   if (obj[@"error"]) {
                     NSString *err = obj[@"error"];
                     if ([err isEqualToString:@"invalid_token"]) {
//                        [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                       NSError *nerr = [NSError errorWithDomain:@"NSCommonErrorDomain" code:50050 userInfo:@{
                                                                                                           @"error": @"invalid_token",
                                                                                                           }];
                       if (failHandler) failHandler(nerr);
                       return;
                     }
                   }
                   if (successHandler) successHandler(obj);
                 }] resume];
}

- (NSData *)jpgDataWithImage:(UIImage *)image sizeLimit:(NSUInteger)maxSize {
  CGFloat compressionQuality = 1.0;
  NSData *imageData = nil;
  
  int i = 0;
  do{
    imageData = UIImageJPEGRepresentation(image, compressionQuality);
    compressionQuality -= 0.1;
    i += 1;
  }while(i < 3 && imageData.length > maxSize);
  return imageData;
}

+ (NSString *)base64Escape:(NSString *)string {
  NSCharacterSet *URLBase64CharacterSet = [[NSCharacterSet characterSetWithCharactersInString:@"/+=\n"] invertedSet];
  return [string stringByAddingPercentEncodingWithAllowedCharacters:URLBase64CharacterSet];
}

+ (NSString *)wwwFormWithDictionary:(NSDictionary *)dict {
  NSMutableString *result = [[NSMutableString alloc] init];
  if (dict != nil) {
    for (NSString *key in dict) {
      if (result.length)
      [result appendString:@"&"];
      [result appendString:[self base64Escape:key]];
      [result appendString:@"="];
      [result appendString:[self base64Escape:dict[key]]];
    }
  }
  return result;
}

+ (NSString *)dealWithParam:(NSDictionary *)param
{
  NSArray *allkeys = [param allKeys];
  NSMutableString *result = [NSMutableString string];
  for (NSString *key in allkeys) {
    NSString *str = @"";
    if ([param[key] isKindOfClass:[NSDictionary class]]) {
      NSArray *keys = [param[key] allKeys];
      str = [NSString stringWithFormat:@"%@=%@", key, @"{"];
      for (NSString *childKey in keys) {
        str = [NSString stringWithFormat:@"%@\"%@\":\"%@\",",str, childKey, param[key][childKey]];
      }
      str = [str substringWithRange:NSMakeRange(0, str.length-1)];
      str = [NSString stringWithFormat:@"%@%@",str, @"}&"];
    } else {
      str = [NSString stringWithFormat:@"%@=%@&",key,param[key]];
    }
    [result appendString:str];
  }
  return [result substringWithRange:NSMakeRange(0, result.length-1)];
}

+ (instancetype)shardService {
  static OCRServices *sharedService = nil;
//  static dispatch_once_t onceToken;
//  dispatch_once(&onceToken, ^{
    sharedService = [[self alloc] init];
//  });
  return sharedService;
}

@end
