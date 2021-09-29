//
//  OCRCameraViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/20.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRCameraViewController.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "PDCameraScanView.h"

#import <AVFoundation/AVFoundation.h>
//#import <AipOcrSdk/AipOcrSdk.h>
//#import "AipOcrService.h"
#import "OcrService.h"
//#import "AipCaptureCardVC.h"
#import <AssetsLibrary/AssetsLibrary.h>
#import <Photos/Photos.h>
#import "OCRValidationViewController.h"
#import "OCRDrivingInfoValidationViewController.h"
#import "OCRTransportInfoValidationViewController.h"
#import "OCRPractitionersValidationViewController.h"
#import "AppDelegate.h"
#import "ToastView.h"
#import "LoadingView.h"
#import "OCRDrivingInfoValidationViewController.h"
#import "NSString+Category.h"
#import "OCRCarPhotoValidateViewController.h"
#import "OCRTransportInfoValidationViewController.h"
#import "OCRSingleton.h"

@interface OCRCameraViewController ()<AVCaptureMetadataOutputObjectsDelegate, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@property ( strong , nonatomic ) AVCaptureDevice * device; //捕获设备，默认后置摄像头
@property ( strong , nonatomic ) AVCaptureDeviceInput * input; //输入设备
@property ( strong , nonatomic ) AVCaptureMetadataOutput * output;//输出设备，需要指定他的输出类型及扫描范围
@property ( strong , nonatomic ) AVCaptureSession * session; //AVFoundation框架捕获类的中心枢纽，协调输入输出设备以获得数据
@property ( strong , nonatomic ) AVCaptureVideoPreviewLayer * previewLayer;//展示捕获图像的图层，是CALayer的子类
@property (nonatomic, strong) UIView *scanView;//定位扫描框在哪个位置
@property(nonatomic, strong) AVCaptureStillImageOutput *stillImageOutput;
@property (nonatomic, strong) UIView *buttonView; // 底部b拍照区域

@property (nonatomic, strong) UIView *buttomImageView; // 底部b拍照区域

@property (nonatomic, strong) UIImage *cameraImg; // 底部b拍照区域
@property (nonatomic, strong) UIImageView *photoImageView; // 展示照片区域

@end

@implementation OCRCameraViewController

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  [super.navigationController setNavigationBarHidden:YES animated:YES];
  [OCRSingleton sharedSingleton].isNativePage = YES;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  [[OcrService shardService] authWithAK:@"EG7QOKpL69x0wgoPoHBmvkWu" andSK:@"faNCK6gWi0mVyjqDpl2GPQjlZ5dnrqpx"];
  //  UIButton *pushBtn = [[UIButton alloc] initWithFrame:CGRectMake(100, 100, 200, 80)];
  //  [pushBtn setTitle:@"跳转RN" forState:UIControlStateNormal];
  //  [pushBtn addTarget:self action:@selector(clickPushRN) forControlEvents:UIControlEventTouchUpInside];
  //
  //  [self.view addSubview:pushBtn];
  
  //  [self openCamera];
  // 创建底部类型选择区域
  //  [self addButtomView];
  //
  //  [self showButtomSelectedView];
  //
  [self initPage];
  //初始化并启动扫描
  [self startScan];
}


/**
 * 初始化页面
 */
-(void)initPage
{
    [self topReturnButtonView];
    [self clearePhotoImageView];
    [self beforeTakingPicturesView];
    [self afterTakingPicturesView];
}

/**
 * 开启照相
 */
-(void)openCamera
{
  //定位扫描框在屏幕正中央，并且宽高为200的正方形
  //    self.scanView = [[UIView alloc]initWithFrame:CGRectMake((kScreen_Width-200)/2, (self.view.frame.size.height-200)/2, 200, 200)];
  //    [self.view addSubview:self.scanView];
  
  //设置扫描界面（包括扫描界面之外的部分置灰，扫描边框等的设置）,后面设置
  //    PDCameraScanView *clearView = [[PDCameraScanView alloc]initWithFrame:self.view.frame];
  //    [self.view addSubview:clearView];
}

-(void)topReturnButtonView
{
  // 添加相册图片
  UIButton *returnButton = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 30, 30)];
  UIImageView *closeImageView = [[UIImageView alloc] init];
  closeImageView.frame = CGRectMake(30, 30, 30, 30);
  closeImageView.image = [UIImage imageNamed:@"guanbi.png"];
  closeImageView.contentMode = UIViewContentModeScaleAspectFit;
  closeImageView.userInteractionEnabled = YES;
  returnButton.enabled = YES;
  returnButton.userInteractionEnabled = YES;
  [closeImageView addSubview:returnButton];
  [returnButton addTarget:self action:@selector(returnNavigation) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:closeImageView];
}

-(void)clearePhotoImageView
{
  CGFloat width = [UIScreen mainScreen].bounds.size.width;
  CGFloat height = [UIScreen mainScreen].bounds.size.height;
  self.photoImageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  self.photoImageView.contentMode = UIViewContentModeScaleAspectFit;
//  self.photoImageView.contentMode = UIViewContentModeScaleAspectFill;
//  self.photoImageView.clipsToBounds = YES;
  [self.view addSubview:self.photoImageView];
  self.photoImageView.backgroundColor = [UIColor blackColor];
  self.photoImageView.hidden = YES;
}

-(void)beforeTakingPicturesView
{
  // 屏幕的宽高
  CGFloat width = [UIScreen mainScreen].bounds.size.width;
  CGFloat height = [UIScreen mainScreen].bounds.size.height;
  // 添加底部拍照、灯光和相册区域
  self.buttonView = [[UIView alloc] initWithFrame:CGRectMake(0, height - 60, width, 60)];
  self.buttonView.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.6];
  [self.view addSubview:self.buttonView];

  // 添加相册图片
  UIButton *buttonPhoto = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 60, 60)];
  UIImageView *imagePhoto = [[UIImageView alloc] init];
  imagePhoto.frame = CGRectMake(20, 15, 30, 30);
  imagePhoto.image = [UIImage imageNamed:@"tuku.png"];
  imagePhoto.contentMode = UIViewContentModeScaleAspectFit;
  imagePhoto.userInteractionEnabled = YES;
  buttonPhoto.enabled = YES;
  buttonPhoto.userInteractionEnabled = YES;
  [imagePhoto addSubview:buttonPhoto];
  [buttonPhoto addTarget:self action:@selector(choosePicture) forControlEvents:UIControlEventTouchUpInside];
  [self.buttonView addSubview:imagePhoto];

  // 添加拍照图片
  UIButton *button = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 50, 50)];
  UIImageView *image = [[UIImageView alloc] init];
  image.frame = CGRectMake(width / 2 - 25, 5, 50, 50);
  image.image = [UIImage imageNamed:@"paizhaoanniu.png"];
  image.contentMode = UIViewContentModeScaleAspectFit;
  image.userInteractionEnabled = YES;
  button.enabled = YES;
  button.userInteractionEnabled = YES;
  [image addSubview:button];
  [button addTarget:self action:@selector(startPhoto) forControlEvents:UIControlEventTouchUpInside];
  [self.buttonView addSubview:image];

  // 添加灯光图片
  UIButton *buttonLight = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 60, 60)];
  UIImageView *imageLight = [[UIImageView alloc] init];
  imageLight.frame = CGRectMake(width - 50, 15, 30, 30);
  imageLight.image = [UIImage imageNamed:@"dengpao.png"];
  imageLight.contentMode = UIViewContentModeScaleAspectFit;
  imageLight.userInteractionEnabled = YES;
  buttonLight.enabled = YES;
  buttonLight.userInteractionEnabled = YES;
  [imageLight addSubview:buttonLight];
  [buttonLight addTarget:self action:@selector(selectedLight) forControlEvents:UIControlEventTouchUpInside];
  [self.buttonView addSubview:imageLight];
}

/**
 * 拍照成功后显示选择按钮区域
 */
-(void)afterTakingPicturesView
{
  //屏幕的宽度
  CGFloat width = [UIScreen mainScreen].bounds.size.width;
  CGFloat height = [UIScreen mainScreen].bounds.size.height;
  self.buttomImageView = [[UIView alloc] initWithFrame:CGRectMake(0, height - 60, width, 60)];
  self.buttomImageView.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.6];
  self.buttomImageView.hidden = YES;
  [self.view addSubview:self.buttomImageView];

  // 添加取消图片
  UIButton *button = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 60, 60)];
  UIImageView *image = [[UIImageView alloc] init];
  image.frame = CGRectMake(20, 18, 24, 24);
  image.image = [UIImage imageNamed:@"guan.png"];
  image.contentMode = UIViewContentModeScaleAspectFit;
  image.userInteractionEnabled = YES;
  button.enabled = YES;
  button.userInteractionEnabled = YES;
  [image addSubview:button];
  [button addTarget:self action:@selector(closePhotoView) forControlEvents:UIControlEventTouchUpInside];
  [self.buttomImageView addSubview:image];

  // 添加验证图片
  UIButton *buttonTwo = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, 60, 60)];
  UIImageView *imageTwo = [[UIImageView alloc] init];
  imageTwo.frame = CGRectMake(width - 50, 15, 30, 30);
  imageTwo.image = [UIImage imageNamed:@"queding.png"];
  imageTwo.contentMode = UIViewContentModeScaleAspectFit;
  imageTwo.userInteractionEnabled = YES;
  buttonTwo.enabled = YES;
  buttonTwo.userInteractionEnabled = YES;
  [imageTwo addSubview:buttonTwo];
  [buttonTwo addTarget:self action:@selector(validateImageInfo) forControlEvents:UIControlEventTouchUpInside];
  [self.buttomImageView addSubview:imageTwo];

}

/**
 * 返回上级路由
 */
-(void)returnNavigation
{
  [self.navigationController popViewControllerAnimated:YES];
}

// 获取设备方向

- (AVCaptureVideoOrientation)getOrientationForDeviceOrientation:(UIDeviceOrientation)deviceOrientation
{
  if (deviceOrientation == UIDeviceOrientationLandscapeLeft) {
    return AVCaptureVideoOrientationLandscapeRight;
  } else if ( deviceOrientation == UIDeviceOrientationLandscapeRight){
    return AVCaptureVideoOrientationLandscapeLeft;
  }
  return (AVCaptureVideoOrientation)deviceOrientation;
}

/**
 * 调用相册
 */
-(void)choosePicture
{
  UIImagePickerController *pickerControll = [[UIImagePickerController alloc] init];
  pickerControll.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
  pickerControll.delegate = self;
  pickerControll.allowsEditing = YES;
  
  [self presentViewController:pickerControll animated:YES completion:nil];
}

///放弃选择图片

- (void)cancelChioseAction{
  
  [self dismissViewControllerAnimated:YES completion:nil];
  
}

/**
 * 选取相册照片后代理方法
 */
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<UIImagePickerControllerInfoKey,id> *)info
{
  UIImage *image = info[UIImagePickerControllerOriginalImage];
  self.photoImageView.image = image;
  self.photoImageView.hidden = NO;
  self.buttonView.hidden = YES;
  self.buttomImageView.hidden = NO;
  self.cameraImg = image;
  [picker dismissViewControllerAnimated:YES completion:nil];
}

/**
 * 拍照
 */
-(void)startPhoto
{
  AVCaptureConnection *stillImageConnection = [self.stillImageOutput connectionWithMediaType:AVMediaTypeVideo];
  UIDeviceOrientation curDeviceOrientation = [[UIDevice currentDevice] orientation];
  AVCaptureVideoOrientation avOrientation = [self getOrientationForDeviceOrientation:curDeviceOrientation];
  [stillImageConnection setVideoOrientation:avOrientation];
  [self.stillImageOutput captureStillImageAsynchronouslyFromConnection:stillImageConnection completionHandler:^(CMSampleBufferRef imageDataSampleBuffer, NSError *error) {
    NSData *jpegData = [AVCaptureStillImageOutput jpegStillImageNSDataRepresentation:imageDataSampleBuffer];

    UIImage *image = [UIImage imageWithData:jpegData];
    // 图片剪裁
    //    CGRect rect = CGRectMake(0, 0, self.view.bounds.size.width, self.view.bounds.size.height);
    //    CGImageRef imageRef = CGImageCreateWithImageInRect([image CGImage], rect);
    //    UIImage * img =  [UIImage imageWithCGImage:imageRef];
    //    CGImageRelease(imageRef);
    
    // 存入相册
    //    [self writeToSavedPhotos:image];
    //    [self writeToSavedPhotos:img];
    self.photoImageView.image = image;
    self.cameraImg = image;
    //    [self showImage:image];
    [self.buttonView setHidden:YES];
//    [self.session stopRunning];
    self.buttomImageView.hidden = NO;
    self.photoImageView.hidden = NO;
  }];
}

/**
 * 灯光选择
 */
-(void)selectedLight
{
  Class captureDeviceClass =NSClassFromString(@"AVCaptureDevice");
  if(captureDeviceClass !=nil) {
    AVCaptureDevice *device = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeVideo];
    if([device hasTorch]) { // 判断是否有闪光灯
      // 请求独占访问硬件设备
      [device lockForConfiguration:nil];
      if(device.torchMode == AVCaptureFlashModeOff) {
        [device setTorchMode:AVCaptureTorchModeOn];//手电筒开
      }else{
        [device setTorchMode:AVCaptureTorchModeOff]; // 手电筒关
      }
      // 请求解除独占访问硬件设备
      [device unlockForConfiguration];
    }
  }
}

/**
 * 验证图片信息是否有误 ocr
 */
-(void)validateImageInfo
{
  // [[ToastView shareInstance] makeToast:@"网络请求失败，请稍后再试" duration:2.0];
  [[LoadingView shareInstance] loadingHidden:NO];
  if (self.type == 1 || self.type == 11) {
    [self validationIdCard];
  } else if (self.type == 2) {
    [self validateVehicleLicensePositive];
  } else if (self.type == 3){
    [self validateVehicleLicenseBack];
  } else if (self.type == 6) {
    [self validateDriverLicense];
  } else if (self.type == 5) {
    [self validateQualificationCertificate];
  } else if (self.type == 7) {
    [self carPhotoInfoHandle];
//    [self validateCarPhoto];
  } else if (self.type == 4) {
    [self validateTransport];
  }
//  if (self.type == 2 || self.type == 3) {
//    OCRDrivingInfoValidationViewController *cv = [[OCRDrivingInfoValidationViewController alloc] init];
//    cv.imageData = self.cameraImg;
//    [app.nav pushViewController:cv animated:YES];
//  } if (self.type == 4) {
//    OCRTransportInfoValidationViewController *cv = [[OCRTransportInfoValidationViewController alloc] init];
//    cv.imageData = self.cameraImg;
//    [app.nav pushViewController:cv animated:YES];
//  } else if (self.type == 11) {
//    OCRPractitionersValidationViewController *cv = [[OCRPractitionersValidationViewController alloc] init];
//    cv.imageData = self.cameraImg;
//    [app.nav pushViewController:cv animated:YES];
//  }
}

/**
 * 验证身份证
 */
- (void)validationIdCard
{
    [[OcrService shardService] detectIdCardFrontFromImage:self.cameraImg
                                                       withOptions:nil
                                                       successHandler:^(id result){
                                                         [self successHandler:result type:self.type];
                                                       }
                                                       failHandler:^(NSError *error){
                                                         [self failHandler:error];
                                                       }];
}

/**
 * 验证行驶证正面
 */
- (void)validateVehicleLicensePositive
{
  [[OcrService shardService] detectVehicleLicenseFromImage:self.cameraImg
                                                  withOptions:nil
                                               successHandler:^(id result){
                                                 [self successHandler:result type:2];
                                               }
                                                  failHandler:^(NSError *error){
                                                    [self failHandler:error];
                                                  }];
}

/**
 * 验证行驶证副本
 */
-(void)validateVehicleLicenseBack
{
  [[OcrService shardService] detectVehicleLicenseBackFromImage:self.cameraImg
                                               withOptions:nil
                                            successHandler:^(id result){
                                              [self successHandler:result type:3];
                                            }
                                               failHandler:^(NSError *error){
                                                 [self failHandler:error];
                                               }];
}

/**
 * 验证驾驶证
 */
-(void)validateDriverLicense
{
  [[OcrService shardService] detectDrivingLicenseFromImage:self.cameraImg
                                                   withOptions:nil
                                                successHandler:^(id result){
                                                  [self successHandler:result type:6];
                                                }
                                                   failHandler:^(NSError *error){
                                                     [self failHandler:error];
                                                   }];
}

/**
 * 从业资格证验证
 */
-(void)validateQualificationCertificate
{
  [[OcrService shardService] detectTextAccurateBasicFromImage:self.cameraImg
                                               withOptions:nil
                                            successHandler:^(id result){
                                              [self successHandler:result type:5];
                                            }
                                               failHandler:^(NSError *error){
                                                 [self failHandler:error];
                                               }];
}

/**
 * 车辆照片验证
 */
//-(void)validateCarPhoto
//{
//  [[OcrService shardService] carNumberFromImage:self.cameraImg
//                                                  withOptions:nil
//                                               successHandler:^(id result){
//                                                 [self successHandler:result type:7];
//                                               }
//                                                  failHandler:^(NSError *error){
//                                                    [self failHandler:error];
//                                                  }];
//}

/**
 * 道路运输证验证
 */
-(void)validateTransport
{
  [[OcrService shardService] detectTextAccurateBasicFromImage:self.cameraImg
                                    withOptions:nil
                                 successHandler:^(id result){
                                   [self successHandler:result type:4];
                                 }
                                    failHandler:^(NSError *error){
                                      [self failHandler:error];
                                    }];
}

/**
 * 识别成功
 */
-(void)successHandler:(id)result type:(NSInteger)status
{
  NSLog(@"识别成功");
  dispatch_async(dispatch_get_main_queue(), ^{
    [[LoadingView shareInstance] loadingHidden:YES];
  });
  if (status == 1 || status == 11) { // 身份证识别成功
    [self idCardInfoHandle:result];
  } else if (status == 2) {
    [self vehicleLicensePositiveInfoHandle:result];
  } else if (status == 3) {
    [self vehicleLicenseBackInfoHandle:result];
  } else if (status == 6) {
    [self driverLicenseInfoHandle:result];
  } else if (status == 5) {
    [self qualificationCertificateInfoHandle:result];
  } else if (status == 7) {
//    [self carPhotoInfoHandle:result];
  } else if (status == 4) {
    [self transportInfoHandle:result];
  }
}


/**
 * 身份证正面识别结果处理
 */
-(void)idCardInfoHandle:(id)result
{
  NSDictionary *infos = [result objectForKey:@"words_result"];
  NSDictionary *nameInfo = infos[@"姓名"];
  NSString *name = nameInfo[@"words"];
  NSDictionary *birthdayInfo = infos[@"出生"];
  NSString *birthday = birthdayInfo[@"words"];
  NSDictionary *cardNumberInfo = infos[@"公民身份号码"];
  NSString *cardNumber = cardNumberInfo[@"words"];
  NSDictionary *genderInfo = infos[@"性别"];
  NSString *gender = genderInfo[@"words"];
  NSDictionary *addressInfo = infos[@"住址"];
  NSString *address = addressInfo[@"words"];
  NSDictionary *nationalInfo = infos[@"民族"];
  NSString *national = nationalInfo[@"words"];
  if (name != nil && ![name isEqual: @""] &&
      birthday != nil && ![birthday isEqual: @""] &&
      cardNumber != nil && ![cardNumber isEqual: @""] &&
      gender != nil && ![gender isEqual: @""] &&
      address != nil && ![address isEqual: @""] &&
      national != nil && ![national isEqual: @""]
  ) {
    if (self.type == 1) {
      NSArray *textInfo = @[
                            @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                            @{@"key": @"image", @"value": self.cameraImg},
                            @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                            @{@"key": @"姓名", @"value": name},
                            @{@"key": @"性别", @"value": gender},
                            @{@"key": @"身份证号", @"value": cardNumber},
                            @{@"key": @"出生", @"value": birthday},
                            @{@"key": @"住址", @"value": address},
                            @{@"key": @"民族", @"value": national},
                          ];
      dispatch_async(dispatch_get_main_queue(), ^{
        [[LoadingView shareInstance] loadingHidden:YES];
        [self closePhotoView];
        AppDelegate *appss = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        OCRValidationViewController *cv = [[OCRValidationViewController alloc] init];
        cv.peopleCardInfoData = textInfo;
        [appss.nav pushViewController:cv animated:YES];
      });
    } else if (self.type == 11) {
      if ([OCRSingleton sharedSingleton].isICType) {
        NSArray *idCardData = [OCRSingleton sharedSingleton].idCardData;
        name = [idCardData[1] objectForKey:@"value"];
        cardNumber = [idCardData[3] objectForKey:@"value"];
      }
      
//      NSString *newName = [[OCRSingleton sharedSingleton].isICType ] ? ;
      NSArray *textInfo = @[
                            @{@"key": @"image", @"value": self.cameraImg},
                            @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                            @{@"key": @"姓名", @"value": name},
                            @{@"key": @"性别", @"value": gender},
                            @{@"key": @"身份证号", @"value": cardNumber},
                            @{@"key": @"出生", @"value": birthday},
                            @{@"key": @"住址", @"value": address},
                            @{@"key": @"民族", @"value": national},
                          ];
      dispatch_async(dispatch_get_main_queue(), ^{
        [[LoadingView shareInstance] loadingHidden:YES];
        [self closePhotoView];
        AppDelegate *appss = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        OCRPractitionersValidationViewController *cv = [[OCRPractitionersValidationViewController alloc] init];
        cv.idCardInfoData = textInfo;
        [appss.nav pushViewController:cv animated:YES];
      });
    }
    
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [[ToastView shareInstance] makeToast:@"请上传正确的图片" duration:2.0];
    });
  }
}

/**
 * 行驶证正面数据处理
 */
- (void)vehicleLicensePositiveInfoHandle:(id)result
{
  NSLog(@"sssss");
  NSDictionary *infos = [result objectForKey:@"words_result"];
  NSDictionary *engineNumberInfo = infos[@"发动机号码"];
  NSString *engineNumber = engineNumberInfo[@"words"];
  NSDictionary *plateNumberInfo = infos[@"号牌号码"];
  NSString *plateNumber = plateNumberInfo[@"words"];
  NSDictionary *ownerInfo = infos[@"所有人"];
  NSString *owner = ownerInfo[@"words"];
  NSDictionary *usingNatureInfo = infos[@"使用性质"];
  NSString *usingNature = usingNatureInfo[@"words"];
  NSDictionary *addressInfo = infos[@"住址"];
  NSString *address = addressInfo[@"words"];
  NSDictionary *registrationDateInfo = infos[@"注册日期"];
  NSString *registrationDate = registrationDateInfo[@"words"];
  NSDictionary *vehicleIdentificationCodeInfo = infos[@"车辆识别代号"];
  NSString *vehicleIdentificationCode = vehicleIdentificationCodeInfo[@"words"];
  NSDictionary *brandModelslInfo = infos[@"品牌型号"];
  NSString *brandModelsl = brandModelslInfo[@"words"];
  NSDictionary *carTypeInfo = infos[@"车辆类型"];
  NSString *carType = carTypeInfo[@"words"];
  NSDictionary *certificateDateInfo = infos[@"发证日期"];
  NSString *certificateDate = certificateDateInfo[@"words"];
  
  if (vehicleIdentificationCode != nil && ![vehicleIdentificationCode isEqual: @""] &&
      engineNumber != nil && ![engineNumber isEqual: @""] &&
      usingNature != nil && ![usingNature isEqual: @""] &&
      brandModelsl != nil && ![brandModelsl isEqual: @""] &&
      registrationDate != nil && ![registrationDate isEqual: @""] &&
      certificateDate != nil && ![certificateDate isEqual: @""]
      ) {
    NSString *carStatus = [OCRSingleton sharedSingleton].carType;
    NSArray *textInfo = nil;
    if (![carStatus isEqualToString:@"1"]) {
      textInfo = @[
                   @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                   @{@"key": @"image", @"value": self.cameraImg},
                   @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                   @{@"key": @"车架号", @"value": vehicleIdentificationCode},
                   @{@"key": @"发动机号", @"value": engineNumber},
                   @{@"key": @"使用性质", @"value": usingNature},
                   @{@"key": @"品牌型号", @"value": brandModelsl},
                   @{@"key": @"注册日期", @"value": registrationDate},
                   @{@"key": @"发证日期", @"value": certificateDate},
                   @{@"key": @"号牌号码", @"value": plateNumber},
                   @{@"key": @"所有人", @"value": owner},
                   @{@"key": @"住址", @"value": address},
                   @{@"key": @"车辆类型", @"value": carType},
                   ];
    } else {
      textInfo = @[
                   @{@"key": @"image", @"value": self.cameraImg},
                   @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                   @{@"key": @"车架号", @"value": vehicleIdentificationCode},
                   @{@"key": @"发动机号", @"value": engineNumber},
                   @{@"key": @"使用性质", @"value": usingNature},
                   @{@"key": @"品牌型号", @"value": brandModelsl},
                   @{@"key": @"注册日期", @"value": registrationDate},
                   @{@"key": @"发证日期", @"value": certificateDate},
                   @{@"key": @"号牌号码", @"value": plateNumber},
                   @{@"key": @"所有人", @"value": owner},
                   @{@"key": @"住址", @"value": address},
                   @{@"key": @"车辆类型", @"value": carType},
                   ];
    }
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [self closePhotoView];
      AppDelegate *appss = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRDrivingInfoValidationViewController *cv = [[OCRDrivingInfoValidationViewController alloc] init];
      if (![carStatus isEqualToString:@"1"]) {
        cv.nonFreightCarInfoData = textInfo;
      } else {
        cv.vehicleLicensePositiveInfoData = textInfo;
      }
      [appss.nav pushViewController:cv animated:YES];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [[ToastView shareInstance] makeToast:@"请上传正确的图片" duration:2.0];
    });
  }
}

/**
 * 行驶证副本数据处理
 */
-(void)vehicleLicenseBackInfoHandle:(id)result
{
  NSDictionary *infos = [result objectForKey:@"words_result"];
  NSDictionary *quasiTractionTotalQualityInfo = infos[@"准牵引总质量"];
  NSString *quasiTractionTotalQuality = quasiTractionTotalQualityInfo[@"words"];
  NSDictionary *totalQualityInfo = infos[@"总质量"];
  NSString *totalQuality = [totalQualityInfo[@"words"] stringByReplacingOccurrencesOfString:@"kg" withString:@""];
  NSDictionary *approvedLoadMassInfo = infos[@"核定载质量"];
  NSString *approvedLoadMass = approvedLoadMassInfo[@"words"];
  NSDictionary *curbWeightInfo = infos[@"整备质量"];
  NSString *curbWeight = curbWeightInfo[@"words"];
  NSDictionary *fileNumberInfo = infos[@"档案编号"];
  NSString *fileNumber = fileNumberInfo[@"words"];
  NSDictionary *fuelTypeInfo = infos[@"燃油类型"];
  NSString *fuelType = fuelTypeInfo[@"words"];
  NSDictionary *authorizedCapacityInfo = infos[@"核定载人数"];
  NSString *authorizedCapacity = authorizedCapacityInfo[@"words"];
  NSDictionary *verandahSizeInfo = infos[@"外廓尺寸"];
  NSString *verandahSize = verandahSizeInfo[@"words"];
  NSDictionary *inspectionRecordsInfo = infos[@"检验记录"];
  NSString *inspectionRecords = inspectionRecordsInfo[@"words"];
  NSDictionary *noteInfo = infos[@"备注"];
  NSString *note = noteInfo[@"words"];
  NSDictionary *plateNumberInfo = infos[@"号牌号码"];
  NSString *plateNumber = plateNumberInfo[@"words"];
  
  NSString *newVerandahSize = [verandahSize stringByReplacingOccurrencesOfString:@"mm" withString:@""];
  NSArray *array = [newVerandahSize componentsSeparatedByString:@"X"];
  
  if (inspectionRecords != nil && ![inspectionRecords isEqual: @""] &&
      totalQuality != nil && ![totalQuality isEqual: @""] &&
      array.count > 0
      ) {
    NSArray *textInfo = @[
                          @{@"key": @"image", @"value": self.cameraImg},
                          @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                          @{@"key": @"校验有效期至", @"value": [inspectionRecords substringToIndex:8]},
                          @{@"key": @"总质量(kg)", @"value": totalQuality},
                          @{@"key": @"外廓尺寸-长(mm)", @"value": array[0]},
                          @{@"key": @"外廓尺寸-宽(mm)", @"value": array[1]},
                          @{@"key": @"外廓尺寸-高(mm)", @"value": array[2]},
                          @{@"key": @"准牵引总质量", @"value": quasiTractionTotalQuality},
                          @{@"key": @"核定载质量", @"value": approvedLoadMass},
                          @{@"key": @"整备质量", @"value": curbWeight},
                          @{@"key": @"档案编号", @"value": fileNumber},
                          @{@"key": @"燃油类型", @"value": fuelType},
                          @{@"key": @"核定载人数", @"value": authorizedCapacity},
                          @{@"key": @"备注", @"value": note},
                          @{@"key": @"号牌号码", @"value": plateNumber},
                          ];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [self closePhotoView];
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRDrivingInfoValidationViewController *cv = [[OCRDrivingInfoValidationViewController alloc] init];
      cv.vehicleLicenseReverseInfoData = textInfo;
      [app.nav pushViewController:cv animated:YES];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [[ToastView shareInstance] makeToast:@"请上传正确的图片" duration:2.0];
    });
  }
}

/**
 * 驾驶证数据处理
 */
-(void)driverLicenseInfoHandle:(id)result
{
  NSLog(@"sssss");
  NSDictionary *infos = [result objectForKey:@"words_result"];
  NSDictionary *quasiDrivingTypeInfo = infos[@"准驾车型"];
  NSString *quasiDrivingType = quasiDrivingTypeInfo[@"words"];
  NSDictionary *cardNumberInfo = infos[@"证号"];
  NSString *cardNumber = cardNumberInfo[@"words"];
  NSDictionary *addressInfo = infos[@"住址"];
  NSString *address = addressInfo[@"words"];
  NSDictionary *nameInfo = infos[@"姓名"];
  NSString *name = nameInfo[@"words"];
  NSDictionary *toInfo = infos[@"至"];
  NSString *to = toInfo[@"words"];
  NSDictionary *genderInfo = infos[@"性别"];
  NSString *gender = genderInfo[@"words"];
  NSDictionary *birthdayInfo = infos[@"出生日期"];
  NSString *birthday = birthdayInfo[@"words"];
  NSDictionary *firstApplicationDateInfo = infos[@"初次领证日期"];
  NSString *firstApplicationDate = firstApplicationDateInfo[@"words"];
  NSDictionary *nationalityInfo = infos[@"国籍"];
  NSString *nationality = nationalityInfo[@"words"];
  NSDictionary *validityDateInfo = infos[@"有效期限"];
  NSString *validityDate = validityDateInfo[@"words"];
  
  if (cardNumber != nil && ![cardNumber isEqual: @""] &&
      quasiDrivingType != nil && ![quasiDrivingType isEqual: @""] &&
      validityDate != nil && ![validityDate isEqual: @""] &&
      to != nil && ![to isEqual: @""]
      ) {
    if ([OCRSingleton sharedSingleton].isICType) {
      NSArray *driverLicenseData = [OCRSingleton sharedSingleton].driverLicenseData;
      cardNumber = [driverLicenseData[1] objectForKey:@"value"];
    }
    NSArray *textInfo = @[
                          @{@"key": @"image", @"value": self.cameraImg},
                          @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                          @{@"key": @"驾驶证号", @"value": cardNumber},
                          @{@"key": @"准驾车型", @"value": quasiDrivingType},
                          @{@"key": @"有效期起", @"value": validityDate},
                          @{@"key": @"有效期至", @"value": to},
                          @{@"key": @"住址", @"value": address},
                          @{@"key": @"姓名", @"value": name},
                          @{@"key": @"性别", @"value": gender},
                          @{@"key": @"出生日期", @"value": birthday},
                          @{@"key": @"初次领证日期", @"value": firstApplicationDate},
                          @{@"key": @"国籍", @"value": nationality},
                          @{@"key": @"有效期限", @"value": validityDate},
                        ];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [self closePhotoView];
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRPractitionersValidationViewController *cv = [[OCRPractitionersValidationViewController alloc] init];
      cv.driverLicenseInfoData = textInfo;
      [app.nav pushViewController:cv animated:YES];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [[ToastView shareInstance] makeToast:@"请上传正确的图片" duration:2.0];
    });
  }
}

/**
 * 从业资格证数据处理
 */
-(void)qualificationCertificateInfoHandle:(id)result
{
  NSLog(@"ssss");
  NSString *number = nil;
  NSArray *infos = [result objectForKey:@"words_result"];
  for (NSUInteger i = 0; i < infos.count; i++) {
    NSDictionary *data = infos[i];
    NSString *text = data[@"words"];
    if ([text isEqualToString:@"从业资格"]) {
      NSString *nextText = [infos[i + 1] objectForKey:@"words"];
      if ([nextText isEqualToString:@"证号"] || [nextText isEqualToString:@"证件号"]) {
        number = [infos[i + 2] objectForKey:@"words"];
        break;
      } else if ([nextText containsString:@"证件号"] || [nextText containsString:@"证号"]) {
        number = nextText;
        break;
      }
    }
//    if ([text containsString:@"证件号"]) {
//      number = text;
//      break;
//    }
  }
  if (number != nil && ![number isEqualToString:@""]) {
    number = [number stringByReplacingOccurrencesOfString:@"证件号" withString:@""];
    number = [number stringByReplacingOccurrencesOfString:@"证号" withString:@""];
    if ([OCRSingleton sharedSingleton].isICType) {
      NSArray *qualificationCertificateData = [OCRSingleton sharedSingleton].qualificationCertificateData;
      number = [qualificationCertificateData[1] objectForKey:@"value"];
    }
    
    NSArray *textInfo = @[
                          @{@"key": @"图片", @"value": self.cameraImg},
                          @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                          @{@"key": @"从业资格证", @"value": number}
                        ];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [self closePhotoView];
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRPractitionersValidationViewController *cv = [[OCRPractitionersValidationViewController alloc] init];
      cv.qualificationCertificateInfoData = textInfo;
      [app.nav pushViewController:cv animated:YES];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [[ToastView shareInstance] makeToast:@"请上传正确的图片" duration:2.0];
    });
  }
}

/**
 * 车辆照片数据处理
 */
-(void)carPhotoInfoHandle
{
  NSData *imageData = UIImageJPEGRepresentation(self.cameraImg, 1.0);
  if (imageData.length <= 4096000) {
    NSArray *textInfo = @[
                          @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                          @{@"key": @"image", @"value": self.cameraImg},
                          @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                          //                          @{@"key": @"车牌号", @"value": number}
                          ];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [self closePhotoView];
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRCarPhotoValidateViewController *cv = [[OCRCarPhotoValidateViewController alloc] init];
      cv.carInfoData = textInfo;
      [app.nav pushViewController:cv animated:YES];
    });
  } else {
    [[ToastView shareInstance] makeToast:@"图片大小错误" duration:2.0];
  }
//  NSLog(@"sssss");
//  NSDictionary *infos = [result objectForKey:@"words_result"];
//  NSString *number = [infos objectForKey:@"number"];
//  if (number == nil || ![number isEqualToString:@""]) {
//  } else {
//    dispatch_async(dispatch_get_main_queue(), ^{
//      [[LoadingView shareInstance] loadingHidden:YES];
//      [[ToastView shareInstance] makeToast:@"请上传正确的图片" duration:2.0];
//    });
//  }
}

/**
 * 道路运输证数据处理
 */
-(void)transportInfoHandle:(id)result
{
  NSLog(@"dddd");
  NSString *number = nil;
  NSArray *infos = [result objectForKey:@"words_result"];
  for (NSUInteger i = 0; i < infos.count; i++) {
    NSDictionary *data = infos[i];
    NSString *text = data[@"words"];
    if ([text containsString:@"道路运输证号"]) {
      number = text;
      break;
    }
  }
  if (number != nil && ![number isEqualToString:@""]) {
    NSString *newNumber = [number stringByReplacingOccurrencesOfString:@"道路运输证号" withString:@""];
    NSArray *textInfo = @[
                          @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                          @{@"key": @"image", @"value": self.cameraImg},
                          @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                          @{@"key": @"运输证号", @"value": newNumber}
                        ];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [self closePhotoView];
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRTransportInfoValidationViewController *cv = [[OCRTransportInfoValidationViewController alloc] init];
      cv.transportInfoData = textInfo;
      [app.nav pushViewController:cv animated:YES];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[LoadingView shareInstance] loadingHidden:YES];
      [[ToastView shareInstance] makeToast:@"请上传正确的图片" duration:2.0];
    });
  }
}

/**
 * 识别失败
 */
-(void)failHandler:(NSError *)error
{
  NSLog(@"识别失败");
  dispatch_async(dispatch_get_main_queue(), ^{
    [[LoadingView shareInstance] loadingHidden:YES];
    if (error.code == 283504) { // 网络请求失败
      [[ToastView shareInstance] makeToast:@"网络请求失败，请稍后再试" duration:2.0];
    } else if (error.code == 283505) { // 服务器返回数据异常
      [[ToastView shareInstance] makeToast:@"服务异常，请稍后再试" duration:2.0];
    } else if (error.code == 216201) { // 图片格式错误
      [[ToastView shareInstance] makeToast:@"图片格式错误" duration:2.0];
    } else if (error.code == 216202) { // 图片大小错误
      [[ToastView shareInstance] makeToast:@"图片大小错误" duration:2.0];
    }
  });
}


/**
 * 关闭展示图片view
 */
-(void)closePhotoView
{
//  [self.session startRunning];
  self.buttonView.hidden = NO;
  self.buttomImageView.hidden = YES;
  self.photoImageView.hidden = YES;
}

- (void)writeToSavedPhotos:(UIImage *)image
{
  PHAuthorizationStatus status = [PHPhotoLibrary authorizationStatus];
  if (status == PHAuthorizationStatusRestricted || status == PHAuthorizationStatusDenied) {
    NSLog(@"无权限访问相册");
    return;
  }
  
  // 首先判断权限
  if ([self haveAlbumAuthority]) {
    //写入相册
    UIImageWriteToSavedPhotosAlbum(image, self, @selector(image: didFinishSavingWithError:contextInfo:), nil);
    
  }
}

- (void)image:(UIImage *)image didFinishSavingWithError:(NSError *)error contextInfo:(void *)contextInfo
{
  if (error) {
    NSLog(@"写入相册失败%@", error);
  } else {
    // 需要修改相册
    NSLog(@"写入相册成功");
  }
}

- (BOOL)haveAlbumAuthority
{
  PHAuthorizationStatus status = [PHPhotoLibrary authorizationStatus];
  
  if (status == PHAuthorizationStatusRestricted || status == PHAuthorizationStatusDenied) {
    return NO;
  }
  return YES;
  
}

/**
 开始扫描
 */
- (void)startScan
{
  // 1.判断输入能否添加到会话中
  if (![self.session canAddInput:self.input]) return;
  [self.session addInput:self.input];
  
  
  // 2.判断输出能够添加到会话中
  //  if (![self.session canAddOutput:self.output]) return;
  //  [self.session addOutput:self.output];
  
  // 照片输出流
  self.stillImageOutput = [[AVCaptureStillImageOutput alloc] init];
  
  // 设置输出图片格式
  NSDictionary *outputSettings = @{AVVideoCodecKey : AVVideoCodecJPEG};
  [self.stillImageOutput setOutputSettings:outputSettings];
  
  if ([self.session canAddOutput:self.stillImageOutput]) {
    [self.session addOutput:self.stillImageOutput];
  }
  
  // 4.设置输出能够解析的数据类型
  // 注意点: 设置数据类型一定要在输出对象添加到会话之后才能设置
  //设置availableMetadataObjectTypes为二维码、条形码等均可扫描，如果想只扫描二维码可设置为
  // [self.output setMetadataObjectTypes:@[AVMetadataObjectTypeQRCode]];
  
  self.output.metadataObjectTypes = self.output.availableMetadataObjectTypes;
  
  // 5.设置监听监听输出解析到的数据
  [self.output setMetadataObjectsDelegate:self queue:dispatch_get_main_queue()];
  
  // 6.添加预览图层
  self.previewLayer.frame = self.view.bounds;
  [self.view.layer insertSublayer:self.previewLayer atIndex:0];
  
  // 8.开始扫描
  [self.session startRunning];
}

/**
 调用相册
 */
- (void)choicePhoto{
  //调用相册
  UIImagePickerController *imagePicker = [[UIImagePickerController alloc]init];
  //UIImagePickerControllerSourceTypePhotoLibrary为相册
  imagePicker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
  
  //设置代理UIImagePickerControllerDelegate和UINavigationControllerDelegate
  imagePicker.delegate = self;
  
  [self presentViewController:imagePicker animated:YES completion:nil];
}

#pragma mark 懒加载

/**
 * 解决进入相册选取照片后，取消按钮点击不灵敏问题
 */
- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  // 自定义相册取消按钮样式
//  UIButton * cancelBtn = [UIButton buttonWithType:UIButtonTypeCustom];
//  [cancelBtn setTitle:@"取消" forState:UIControlStateNormal];
//  [cancelBtn setTitleColor:[UIColor blueColor] forState:UIControlStateNormal];
//  cancelBtn.titleLabel.font = [UIFont systemFontOfSize:16];
//  [cancelBtn sizeToFit];
//  [cancelBtn addTarget:self action:@selector(cancelChioseAction) forControlEvents:UIControlEventTouchUpInside];
//  UIBarButtonItem *btn = [[UIBarButtonItem alloc] initWithCustomView:cancelBtn];
//  [viewController.navigationItem setRightBarButtonItem:btn animated:NO];
  
  // 修改相册标题栏文字颜色
  viewController.navigationController.navigationBar.barStyle = UIStatusBarStyleDefault;
  [viewController.navigationController.navigationBar setTintColor:[UIColor blueColor]];
  
  if ([UIDevice currentDevice].systemVersion.floatValue < 11) {
    return;
  }
  if ([viewController isKindOfClass:NSClassFromString(@"PUPhotoPickerHostViewController")]) {
    [viewController.view.subviews enumerateObjectsUsingBlock:^(__kindof UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
      if (obj.frame.size.width < 42) {
        [viewController.view sendSubviewToBack:obj];
        *stop = YES;
      }
    }];
  }
}

//下面初始化AVCaptureSession和AVCaptureVideoPreviewLayer:
- (AVCaptureSession *)session
{
  if (_session == nil) {
    _session = [[AVCaptureSession alloc] init];
  }
  return _session;
}

- (AVCaptureVideoPreviewLayer *)previewLayer
{
  if (_previewLayer == nil) {
    //负责图像渲染出来
    _previewLayer = [AVCaptureVideoPreviewLayer layerWithSession:self.session];
    self.previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
  }
  return _previewLayer;
}

/**
 这里设置输出设备要注意rectOfInterest属性的设置，一般默认是CGRect(x: 0, y: 0, width: 1, height: 1),
 全屏都能读取的，但是读取速度较慢。
 注意rectOfInterest属性的传人的是比例。
 比例是根据扫描容器的尺寸比上屏幕尺寸（注意要计算的时候要计算导航栏高度，有的话需减去）。
 参照的是横屏左上角的比例，而不是竖屏。
 所以我们再设置的时候要调整方向如下面所示。
 */
- (AVCaptureMetadataOutput *)output{
  if (_output == nil) {
    //初始化输出设备
    _output = [[AVCaptureMetadataOutput alloc] init];
    
    // 1.获取屏幕的frame
    CGRect viewRect = self.view.frame;
    // 2.获取扫描容器的frame
    CGRect containerRect = self.scanView.frame;
    
    CGFloat x = containerRect.origin.y / viewRect.size.height;
    CGFloat y = containerRect.origin.x / viewRect.size.width;
    CGFloat width = containerRect.size.height / viewRect.size.height;
    CGFloat height = containerRect.size.width / viewRect.size.width;
    //rectOfInterest属性设置设备的扫描范围
    _output.rectOfInterest = CGRectMake(x, y, width, height);
  }
  return _output;
}


- (AVCaptureDevice *)device{
  if (_device == nil) {
    // 设置AVCaptureDevice的类型为Video类型
    _device = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeVideo];
  }
  return _device;
}

- (AVCaptureDeviceInput *)input{
  if (_input == nil) {
    //输入设备初始化
    _input = [AVCaptureDeviceInput deviceInputWithDevice:self.device error:nil];
  }
  return _input;
}

@end
