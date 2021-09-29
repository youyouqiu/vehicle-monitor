//
//  OCRDrivingInfoViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/25.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRDrivingInfoViewController.h"
#import "DTScrollStatusView.h"
#import "OCRCameraViewController.h"
#import "AppDelegate.h"
#import "OCRServices.h"
#import "OCRSingleton.h"

#import "OCRDrivingInfoValidationViewController.h"
#import "OCRTransportInfoViewController.h"
#import "OCRTransportInfoValidationViewController.h"
#import "OCRPractitionersViewController.h"
#import "OCRPractitionersValidationViewController.h"
#import "OCRCarPhotoViewController.h"
#import "OCRCarPhotoValidateViewController.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"
#import <AVFoundation/AVFoundation.h>
#import "ToastView.h"
#import "OCREmitterModule.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRDrivingInfoViewController ()<DTScrollStatusDelegate, UINavigationControllerDelegate>

@property (nonatomic, strong) UILabel *monitorNameLabel;
@property (nonatomic, strong) NSArray *vehicleLicensePositiveData;
@property (nonatomic, strong) NSArray *vehicleLicenseReverseData;
@property (nonatomic, strong) NSArray *nonFreightCarData;
@property (nonatomic, strong) UIButton *uploadPositive; // 上传证件正本按钮
@property (nonatomic, strong) UIButton *uploadReverse; // 上传证件正本按钮

@property (nonatomic, strong) UITableView *frontTableView;
@property (nonatomic, strong) UITableView *duplicateTableView;
@property (nonatomic, strong) UITableView *tableView;
@property (nonatomic, strong) UIView *tabContentView;
@property (nonatomic, strong) UIImageView *nonFreightCarImageView;
@property (nonatomic, strong) UILabel *headerTitle;
@property (nonatomic, strong) UIImageView *positiveImageView;
@property (nonatomic, strong) UIImageView *reverseImageView;


@end

@implementation OCRDrivingInfoViewController

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  self.navigationController.navigationBar.topItem.title = @"";
  self.view.backgroundColor = UIColorFromRGB(0xf4f7fa);
  self.navigationController.navigationBar.barTintColor = UIColorFromRGB(0x339EFF);
  [self.navigationController.navigationBar setTitleTextAttributes:
   @{NSFontAttributeName:[UIFont systemFontOfSize:18],
     NSForegroundColorAttributeName:[UIColor whiteColor]}];
  [[UINavigationBar appearance] setTintColor:[UIColor whiteColor]];
  self.navigationController.navigationBarHidden = NO;
  self.navigationController.navigationBar.translucent = NO;
  [OCRSingleton sharedSingleton].isNativePage = YES;
  self.navigationItem.title = @"行驶证信息";
  self.title = @"行驶证";
  
  self.headerTitle = [[UILabel alloc] initWithFrame:CGRectMake(self.view.frame.size.width/2 - 75, 0, 150, self.navigationController.navigationBar.frame.size.height)];
  self.headerTitle.textAlignment = NSTextAlignmentCenter;
  self.headerTitle.textColor = [UIColor whiteColor];
  self.headerTitle.text = @"行驶证信息";
  [self.navigationController.navigationBar addSubview:self.headerTitle];
  
  if ([OCRSingleton sharedSingleton].isLoadData) {
    [self initData];
    [OCRSingleton sharedSingleton].isLoadData = NO;
  }
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  [self.headerTitle removeFromSuperview];
  self.headerTitle = nil;
}

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  BOOL isShowHomePage = [viewController isKindOfClass:[OCRDrivingInfoViewController class]] ||
                        [viewController isKindOfClass:[OCRDrivingInfoValidationViewController class]] ||
                        [viewController isKindOfClass:[OCRTransportInfoViewController class]] ||
                        [viewController isKindOfClass:[OCRTransportInfoValidationViewController class]] ||
                        [viewController isKindOfClass:[OCRPractitionersViewController class]] ||
                        [viewController isKindOfClass:[OCRPractitionersValidationViewController class]] ||
                        [viewController isKindOfClass:[OCRCarPhotoViewController class]] ||
                        [viewController isKindOfClass:[OCRCarPhotoValidateViewController class]] ||
                        [viewController isKindOfClass:[OCRCameraViewController class]] ||
                        [viewController isKindOfClass:[UITabBarController class]];
  if (!isShowHomePage) {
    OCREmitterModule *eventEmitter = [OCREmitterModule allocWithZone:nil];
    [eventEmitter onExitOCR:nil];
    [self.navigationController setNavigationBarHidden:YES animated:YES];
  }
}

- (void)dealloc
{
  self.navigationController.delegate = nil;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  [OCRSingleton sharedSingleton].isLoadData = YES;
  self.navigationController.delegate = self;
  [self defaultData];
  [self initPage];
  [self setPageContent];
}

- (void)initPage
{
  CGFloat height = self.view.bounds.size.height;
  CGFloat width = self.view.bounds.size.width;
  
  // 顶部监控对象名称
  self.monitorNameLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, width, 45)];
  self.monitorNameLabel.textAlignment = NSTextAlignmentCenter;
  self.monitorNameLabel.textColor = [UIColor blackColor];
  self.monitorNameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
  [self.view addSubview:self.monitorNameLabel];
  self.monitorNameLabel.backgroundColor = UIColorFromRGB(0xf4f7fa);
  
  // 选项卡
  self.tabContentView = [[UIView alloc] initWithFrame:CGRectMake(0, 45, width, height - 45)];
  [self.view addSubview:self.tabContentView];
  self.tabContentView.backgroundColor = UIColorFromRGB(0xf4f7fa);

  DTScrollStatusView *scrollTapView = [[DTScrollStatusView alloc] initWithTitleArr:@[@"行驶证正本", @"行驶证副本"]
                                                          type:ScrollTapTypeWithNavigation];
  scrollTapView.scrollStatusDelegate = self;
  [self.tabContentView addSubview:scrollTapView];
  self.tabContentView.hidden = YES;
  scrollTapView.backgroundColor = [UIColor whiteColor]; // UIColorFromRGB(0xf4f7fa); // [UIColor whiteColor];
  
  self.tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  self.tableView.delegate = self;
  self.tableView.dataSource = self;
  self.tableView.tableFooterView = [[UIView alloc] init];
  self.tableView.tag = 3;
  [self.view addSubview:self.tableView];
  self.tableView.backgroundColor = UIColorFromRGB(0xf4f7fa);
  self.tableView.hidden = NO;
}

-(void)setPageContent
{
//  if ([[OCRSingleton sharedSingleton].carType isEqualToString:@"1"]) {
    self.monitorNameLabel.text = [OCRSingleton sharedSingleton].monitorName;
//  }
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  
  static NSString *text = @"UITableViewCell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if (tableView.tag == 0) {
    cell = [self positiveContent:cell indexPathRow:indexPath.row];
  }
  else if(tableView.tag == 1)
  {
    cell = [self reverseContent:cell indexPathRow:indexPath.row];
  } else if (tableView.tag == 3) {
    NSLog(@"dddd");
    cell = [self nonFreightCarContent:cell indexPathRow:indexPath.row];
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

/**
 * 非货运车行驶证正面
 */
-(UITableViewCell *)nonFreightCarContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 0) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *value = [data objectForKey:@"value"];
    UILabel *nameLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 44)];
    nameLabel.textAlignment = NSTextAlignmentCenter;
    nameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
//    nameLabel.backgroundColor = UIColorFromRGB(0xf4f7fa);
    [nameLabel setText:value];
    [cell addSubview:nameLabel];
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 1) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
    if (self.nonFreightCarImageView == nil) {
      self.nonFreightCarImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.nonFreightCarImageView.contentMode = UIViewContentModeScaleAspectFit;
//      self.nonFreightCarImageView.backgroundColor = [UIColor whiteColor];
//      self.nonFreightCarImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//      self.nonFreightCarImageView.layer.borderWidth = 1.0f;
      self.nonFreightCarImageView.userInteractionEnabled = YES;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.nonFreightCarImageView addGestureRecognizer:singleTap];
      self.nonFreightCarImageView.image = image;
      [cell.contentView addSubview:self.nonFreightCarImageView];
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 8) {
//    if (self.uploadPositive == nil) {
      self.uploadPositive = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
      self.uploadPositive.layer.cornerRadius = 5;
      [self.uploadPositive setTitle:@"上传证件正本" forState:UIControlStateNormal];
      self.uploadPositive.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
      self.uploadPositive.backgroundColor = UIColorFromRGB(0x4287ff);
      [self.uploadPositive addTarget:self action:@selector(uploadPositiveEvent) forControlEvents:UIControlEventTouchUpInside];
      [cell addSubview:self.uploadPositive];
//    }
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

- (void)handleSingleTap:(UITapGestureRecognizer *)gestureRecognizer {
  MyUITapGestureRecognizer *tap = (MyUITapGestureRecognizer *)gestureRecognizer;
  [[PhotoFullScreen shareInstances] makeToast:tap.image];
}

/**
 * 行驶证正面
 */
-(UITableViewCell *)positiveContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 0) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    if (self.positiveImageView == nil) {
      self.positiveImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 15, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.positiveImageView.contentMode = UIViewContentModeScaleAspectFit;
//      self.positiveImageView.backgroundColor = [UIColor whiteColor]; // UIColorFromRGB(0xf4f7fa);
//      self.positiveImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//      self.positiveImageView.layer.borderWidth = 1.0f;
      self.positiveImageView.userInteractionEnabled = YES;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.positiveImageView addGestureRecognizer:singleTap];
      self.positiveImageView.image = image;
      [cell.contentView addSubview:self.positiveImageView];
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 7) {
    self.uploadPositive = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    self.uploadPositive.layer.cornerRadius = 5;
    [self.uploadPositive setTitle:@"上传证件正本" forState:UIControlStateNormal];
    self.uploadPositive.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadPositive.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
    [self.uploadPositive addTarget:self action:@selector(uploadPositiveEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadPositive];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

/**
 * 驾驶证正面上传
 */
- (void)uploadPositiveEvent
{
  if ([self cameraPermissionsValidation]) {
    NSDictionary *data = nil;
    if ([[OCRSingleton sharedSingleton].carType isEqualToString:@"1"]) {
      [OCRSingleton sharedSingleton].tableSelectedIndex = 0;
      if (self.vehicleLicensePositiveData.count >= 8) {
        data = self.vehicleLicensePositiveData[7];
      }
    } else {
      [OCRSingleton sharedSingleton].tableSelectedIndex = 3;
      if (self.nonFreightCarData.count >= 9) {
        data = self.nonFreightCarData[8];
      }
    }
    if (data != nil) {
      NSString *photoUrl = [data objectForKey:@"value"];
      [OCRSingleton sharedSingleton].oldPhotoUrl = photoUrl;
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRCameraViewController *cv = [[OCRCameraViewController alloc] init];
      cv.type = 2;
      [app.nav pushViewController:cv animated:YES];
    }
  }
}

/**
 * 行驶证反面
 */
-(UITableViewCell *)reverseContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 0) {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    if (self.reverseImageView == nil) {
      self.reverseImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 15, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.reverseImageView.contentMode = UIViewContentModeScaleAspectFit;
//      self.reverseImageView.backgroundColor = [UIColor whiteColor]; // UIColorFromRGB(0xf4f7fa);
//      self.reverseImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//      self.reverseImageView.layer.borderWidth = 1.0f;
      self.reverseImageView.userInteractionEnabled = YES;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.reverseImageView addGestureRecognizer:singleTap];
      [cell.contentView addSubview:self.reverseImageView];
      self.reverseImageView.image = image;
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 6) {
    self.uploadReverse = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    self.uploadReverse.layer.cornerRadius = 5;
    [self.uploadReverse setTitle:@"上传证件副本" forState:UIControlStateNormal];
    self.uploadReverse.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadReverse.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
    [self.uploadReverse addTarget:self action:@selector(uploadReverseEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadReverse];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

/**
 * 驾驶证反面上传
 */
- (void)uploadReverseEvent
{
  if ([self cameraPermissionsValidation]) {
    if (self.vehicleLicenseReverseData.count >= 7) {
      NSDictionary *data = self.vehicleLicenseReverseData[6];
      if (data != nil) {
        NSString *photoUrl = [data objectForKey:@"value"];
        [OCRSingleton sharedSingleton].oldPhotoUrl = photoUrl;
        [OCRSingleton sharedSingleton].tableSelectedIndex = 1;
        AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        OCRCameraViewController *cv = [[OCRCameraViewController alloc] init];
        cv.type = 3;
        [app.nav pushViewController:cv animated:YES];
      }
    }
  }
}


- (void)refreshViewWithTag:(NSInteger)tag
                  isHeader:(BOOL)isHeader {
  if(isHeader)
  {
    NSLog(@"当前%ld个tableview 的头部正在刷新",(long)tag);
  }
  else
  {
    NSLog(@"当前%ld个tableview 的尾部正在刷新",(long)tag);
  }
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  if (tableView.tag == 0) {
    self.frontTableView = tableView;
    return 8;
  }
  else if (tableView.tag == 1)
  {
    self.duplicateTableView = tableView;
    return 7;
  } else {
    self.tableView = tableView;
    return 9;
  }
}

- (void)defaultData
{
  UIImage *drivingPositiveImage = [UIImage imageNamed:@"drivingPositivePhoto.png"];
  UIImage *drivingReverseImage = [UIImage imageNamed:@"drivingReverse.png"];
  // 行驶证正面数据
  self.vehicleLicensePositiveData = @[
                                      @{@"key": @"图片", @"value": drivingPositiveImage},
                                      @{@"key": @"车架号", @"value": @"--"},
                                      @{@"key": @"发动机号", @"value": @"--"},
                                      @{@"key": @"使用性质", @"value": @"--"},
                                      @{@"key": @"品牌型号", @"value": @"--"},
                                      @{@"key": @"注册日期", @"value": @"--"},
                                      @{@"key": @"发证日期", @"value": @"--"}
                                    ];

  // 行驶证反面数据
  self.vehicleLicenseReverseData = @[
                                     @{@"key": @"图片", @"value": drivingReverseImage},
                                     @{@"key": @"检验有效期至", @"value": @"--"},
                                     @{@"key": @"总质量(kg)", @"value": @"--"},
                                     @{@"key": @"外廓尺寸-长(mm)", @"value": @"--"},
                                     @{@"key": @"外廓尺寸-高(mm)", @"value": @"--"},
                                     @{@"key": @"外廓尺寸-宽(mm)", @"value": @"--"}
                                   ];
  
  // 非货运车数据
  self.nonFreightCarData = @[
                             @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                             @{@"key": @"图片", @"value": drivingPositiveImage},
                             @{@"key": @"车架号", @"value": @"--"},
                             @{@"key": @"发动机号", @"value": @"--"},
                             @{@"key": @"使用性质", @"value": @"--"},
                             @{@"key": @"品牌型号", @"value": @"--"},
                             @{@"key": @"注册日期", @"value": @"--"},
                             @{@"key": @"发证日期", @"value": @"--"}
                           ];
}

- (void)initData
{
  NSDictionary *params = @{
                           @"monitorId": [OCRSingleton sharedSingleton].monitorId,
                         };
  [[OCRServices shardService] requestVehicleDriveLicenseInfo:params
                                              successHandler:^(id result) {
                                                NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                                                BOOL success = [[result objectForKey:@"success"] boolValue];
                                                if (statusCode == 200 && success == YES) {
                                                  NSDictionary *data = [result objectForKey:@"obj"];
                                                  if (data.count > 0) {
                                                    NSString *standard = [data objectForKey:@"standard"];
                                                    
                                                    if ([standard isEqual:[NSNull null]]) {
                                                      standard = @"0";
                                                    } else {
                                                      
                                                    }
                                                    
                                                    NSString *drivingLicenseFrontPhoto = [data objectForKey:@"drivingLicenseFrontPhoto"];
                                                    
                                                    UIImage *frontImage = nil;
                                                    if (![drivingLicenseFrontPhoto isEqual:[NSNull null]]) {
                                                      NSString *photoUrl = [NSString stringWithFormat:@"%@%@", [OCRSingleton sharedSingleton].imageWebUrl, drivingLicenseFrontPhoto];
//                                                      frontImage = [UIImage imageWithData:[NSData dataWithContentsOfURL:[NSURL URLWithString:photoUrl]]];
                                                      NSOperationQueue *operationQueue = [[NSOperationQueue alloc] init];
//                                                      self.positiveImageView
                                                      NSInvocationOperation *op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadPositiveImage:) object:photoUrl];
                                                      [operationQueue addOperation:op];
                                                    } else {
                                                      drivingLicenseFrontPhoto = @"";
                                                    }
                                                    if (frontImage == nil) {
                                                      frontImage = [UIImage imageNamed:@"drivingPositivePhoto.png"];
                                                      dispatch_async(dispatch_get_main_queue(), ^{
                                                        self.positiveImageView.image = frontImage;
                                                      });
                                                    }
                                                    NSString *chassisNumber = [data objectForKey:@"chassisNumber"];
                                                    if ([chassisNumber isEqual:[NSNull null]]) {
                                                      chassisNumber = @"--";
                                                    }
                                                    
                                                    NSString *engineNumber = [data objectForKey:@"engineNumber"];
                                                    if ([engineNumber isEqual:[NSNull null]]) {
                                                      engineNumber = @"--";
                                                    }
                                                    
                                                    NSString *usingNature = [data objectForKey:@"usingNature"];
                                                    if ([usingNature isEqual:[NSNull null]]) {
                                                      usingNature = @"--";
                                                    }
                                                    
                                                    NSString *brandModel = [data objectForKey:@"brandModel"];
                                                    if ([brandModel isEqual:[NSNull null]]) {
                                                      brandModel = @"--";
                                                    }
                                                    
                                                    NSString *registrationDate = [data objectForKey:@"registrationDate"];
                                                    if (![registrationDate isEqual:[NSNull null]]) {
                                                      NSArray *registrationDateArr = [registrationDate componentsSeparatedByString:@" "];
                                                      registrationDate = registrationDateArr[0];
                                                    } else {
                                                      registrationDate = @"--";
                                                    }
                                                    
                                                    NSString *licenseIssuanceDate = [data objectForKey:@"licenseIssuanceDate"];
                                                    if (![licenseIssuanceDate isEqual:[NSNull null]]) {
                                                      NSArray *licenseIssuanceDateArr = [licenseIssuanceDate componentsSeparatedByString:@" "];
                                                      licenseIssuanceDate = licenseIssuanceDateArr[0];
                                                    } else {
                                                      licenseIssuanceDate = @"--";
                                                    }
                                                    
                                                    if ([standard isEqualToString:@"1"]) {
                                                      self.vehicleLicensePositiveData = @[
                                                                                          @{@"key": @"图片", @"value": frontImage},
                                                                                          @{@"key": @"车架号", @"value": chassisNumber},
                                                                                          @{@"key": @"发动机号", @"value": engineNumber},
                                                                                          @{@"key": @"使用性质", @"value": usingNature},
                                                                                          @{@"key": @"品牌型号", @"value": brandModel},
                                                                                          @{@"key": @"注册日期", @"value": registrationDate},
                                                                                          @{@"key": @"发证日期", @"value": licenseIssuanceDate},
                                                                                          @{@"key": @"oldPhotoUrl", @"value": drivingLicenseFrontPhoto},
                                                                                          ];
                                                    } else {
                                                      self.nonFreightCarData = @[
                                                                                 @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                                                                                          @{@"key": @"图片", @"value": frontImage},
                                                                                          @{@"key": @"车架号", @"value": chassisNumber},
                                                                                          @{@"key": @"发动机号", @"value": engineNumber},
                                                                                          @{@"key": @"使用性质", @"value": usingNature},
                                                                                          @{@"key": @"品牌型号", @"value": brandModel},
                                                                                          @{@"key": @"注册日期", @"value": registrationDate},
                                                                                          @{@"key": @"发证日期", @"value": licenseIssuanceDate},
                                                                                          @{@"key": @"oldPhotoUrl", @"value": drivingLicenseFrontPhoto},
                                                                                          ];
                                                    }
                                                    
                                                    
                                                    if ([standard isEqualToString:@"1"]) {
                                                      NSString *drivingLicenseDuplicatePhoto = [data objectForKey:@"drivingLicenseDuplicatePhoto"];
                                                      UIImage *duplicateImage = nil;
                                                      if (![drivingLicenseDuplicatePhoto isEqual:[NSNull null]]) {
                                                        NSString *photoUrl = [NSString stringWithFormat:@"%@%@", [OCRSingleton sharedSingleton].imageWebUrl, drivingLicenseDuplicatePhoto];
//                                                        duplicateImage = [UIImage imageWithData:[NSData dataWithContentsOfURL:[NSURL URLWithString:photoUrl]]];
//                                                        self.reverseImageView
                                                        NSOperationQueue *operationQueue = [[NSOperationQueue alloc] init];
                                                        NSInvocationOperation *op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadReverseImage:) object:photoUrl];
                                                        [operationQueue addOperation:op];
                                                      } else {
                                                        drivingLicenseDuplicatePhoto = @"";
                                                      }
                                                      if (duplicateImage == nil) {
                                                        duplicateImage = [UIImage imageNamed:@"drivingReverse.png"];
                                                        dispatch_async(dispatch_get_main_queue(), ^{
                                                          self.reverseImageView.image = duplicateImage;
                                                        });
                                                      }
                                                      
                                                      NSString *validEndDate = [data objectForKey:@"validEndDate"];
                                                      if (![validEndDate isEqual:[NSNull null]]) {
                                                        NSArray *validEndDateArr = [validEndDate componentsSeparatedByString: @" "];
                                                        validEndDate = validEndDateArr[0];
                                                        validEndDate = [validEndDate substringToIndex:7];
                                                        NSArray *date = [validEndDate componentsSeparatedByString:@"-"];
                                                        validEndDate = [NSString stringWithFormat:@"%@年%@月", date[0], date[1]];
                                                      } else {
                                                        validEndDate = @"--";
                                                      }
                                                      
                                                      NSString *totalQuality = nil;
                                                      if ([[data objectForKey:@"totalQuality"] isEqual:[NSNull null]]) {
                                                        totalQuality = @"--";
                                                      } else {                                                
                                                        totalQuality = [data objectForKey:@"totalQuality"];
                                                      }
                                                      
                                                      NSString *profileSizeLong = nil;
                                                      if ([[data objectForKey:@"profileSizeLong"] isEqual:[NSNull null]]) {
                                                        profileSizeLong = @"--";
                                                      } else {
                                                        profileSizeLong = [[data objectForKey:@"profileSizeLong"] stringValue];
                                                      }
                                                      
                                                      NSString *profileSizeHigh = nil;
                                                      if ([[data objectForKey:@"profileSizeHigh"] isEqual:[NSNull null]]) {
                                                        profileSizeHigh = @"--";
                                                      } else {
                                                        profileSizeHigh = [[data objectForKey:@"profileSizeHigh"] stringValue];
                                                      }
                                                      
                                                      NSString *profileSizeWide = nil;
                                                      if ([[data objectForKey:@"profileSizeWide"] isEqual:[NSNull null]]) {
                                                        profileSizeWide = @"--";
                                                      } else {
                                                        profileSizeWide = [[data objectForKey:@"profileSizeWide"] stringValue];
                                                      }
                                                      
                                                      self.vehicleLicenseReverseData = @[
                                                                                         @{@"key": @"图片", @"value": duplicateImage},
                                                                                         @{@"key": @"检验有效期至", @"value": validEndDate},
                                                                                         @{@"key": @"总质量(kg)", @"value": totalQuality},
                                                                                         @{@"key": @"外廓尺寸-长(mm)", @"value": profileSizeLong},
                                                                                         @{@"key": @"外廓尺寸-高(mm)", @"value": profileSizeHigh},
                                                                                         @{@"key": @"外廓尺寸-宽(mm)", @"value": profileSizeWide},
                                                                                         @{@"key": @"oldPhotoUrl", @"value": drivingLicenseDuplicatePhoto},
                                                                                         ];
                                                    }
                                                    
                                                    dispatch_async(dispatch_get_main_queue(), ^{
                                                      [OCRSingleton sharedSingleton].carType = standard;
                                                      if ([standard isEqualToString:@"1"]) {
                                                        self.tableView.hidden = YES;
                                                        self.tabContentView.hidden = NO;
                                                        [self.frontTableView reloadData];
                                                        [self.duplicateTableView reloadData];

                                                      } else {
                                                        self.tabContentView.hidden = YES;
                                                        self.tableView.hidden = NO;
                                                        [self.tableView reloadData];
                                                      }
                                                    });
                                                  }
                                                }
                                              }
                                                 failHandler:^(NSError *err) {
//                                                   NSLog(@"ssss");
                                                   if (err.code == 50050) {
                                                     dispatch_async(dispatch_get_main_queue(), ^{
                                                       [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                                                       dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                                         NSArray *controllers = self.navigationController.viewControllers;
                                                         self.navigationController.navigationBarHidden = YES;
                                                         [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 2] animated:YES];
                                                       });
                                                     });
                                                   }
                                                 }];
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (tableView.tag == 3) {
    if (indexPath.row == 1) {
      return (self.view.frame.size.width - 80) * 0.56 + 15;
    }
  } else {
    if (indexPath.row == 0) {
      return (self.view.frame.size.width - 80) * 0.56 + 30;
    }
  }
  return 44;
}

/**
 * 验证相机权限是否开启
 */
- (BOOL)cameraPermissionsValidation
{
  NSString *mediaType = AVMediaTypeVideo;//读取媒体类型
  AVAuthorizationStatus authStatus = [AVCaptureDevice authorizationStatusForMediaType:mediaType];//读取设备授权状态
  if(authStatus == AVAuthorizationStatusRestricted || authStatus == AVAuthorizationStatusDenied) {
    [[ToastView shareInstance] makeToast:@"相机权限已关闭，请在设置当中重新设置" duration:2.0];
    return NO;
  }
  return YES;
}

- (void)downloadPositiveImage:(NSString *)url
{
  NSURL *imageUrl = [NSURL URLWithString:url];
  UIImage *image = [UIImage imageWithData:[NSData dataWithContentsOfURL:imageUrl]];
  if (image != nil) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if ([[OCRSingleton sharedSingleton].carType isEqualToString:@"1"]) {
        MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
        singleTap.image = image;
        [self.positiveImageView addGestureRecognizer:singleTap];
        self.positiveImageView.image = image;
      } else {
        MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
        singleTap.image = image;
        [self.nonFreightCarImageView addGestureRecognizer:singleTap];
        self.nonFreightCarImageView.image = image;
      }
    });
  }
}

- (void)downloadReverseImage:(NSString *)url
{
  NSURL *imageUrl = [NSURL URLWithString:url];
  UIImage *image = [UIImage imageWithData:[NSData dataWithContentsOfURL:imageUrl]];
  if (image != nil) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self.reverseImageView.image = image;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.reverseImageView addGestureRecognizer:singleTap];
    });
  }
}

@end
