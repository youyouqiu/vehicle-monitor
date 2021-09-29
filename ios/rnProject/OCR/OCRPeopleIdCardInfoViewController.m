//
//  OCRPeopleIdCardInfoViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/20.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRPeopleIdCardInfoViewController.h"
#import "OCRCameraViewController.h"
#import "AppDelegate.h"
#import "OCRServices.h"
#import "OCRSingleton.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"
#import <AVFoundation/AVFoundation.h>
#import "ToastView.h"
#import "OCRValidationViewController.h"
#import "OCREmitterModule.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRPeopleIdCardInfoViewController ()<UITableViewDelegate, UITableViewDataSource>

@property (nonatomic, strong) UILabel *monitorNameLabel;
@property (nonatomic, strong) UIImageView *idCardImageView;
@property (nonatomic, strong) UILabel *nameLabel;
@property (nonatomic, strong) UILabel *genderLabel;
@property (nonatomic, strong) UILabel *cardLabel;
@property (nonatomic, strong) UIButton *uploadButton;
@property (nonatomic, strong) UITableView *tableView;

@property (nonatomic, strong) NSArray *peopleCardInfoData;

@end

@implementation OCRPeopleIdCardInfoViewController

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  self.navigationController.navigationBar.topItem.title = @"";
  self.navigationController.navigationBar.barTintColor = UIColorFromRGB(0x339eff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
  [self.navigationController.navigationBar setTitleTextAttributes:
   @{NSFontAttributeName:[UIFont systemFontOfSize:18],
     NSForegroundColorAttributeName:[UIColor whiteColor]}];
  [[UINavigationBar appearance] setTintColor:[UIColor whiteColor]];
//  [super.navigationController setNavigationBarHidden:NO animated:YES];
  self.navigationController.navigationBarHidden = NO;
  [OCRSingleton sharedSingleton].isNativePage = YES;
  self.title = @"身份证信息";
  if ([OCRSingleton sharedSingleton].isLoadData) {
    [self getData];
    [OCRSingleton sharedSingleton].isLoadData = NO;
  }
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  self.navigationController.navigationBarHidden = YES;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  [OCRSingleton sharedSingleton].isLoadData = YES;
  [self defaultData];
  [self initPage];
}

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  BOOL isShowHomePage = [viewController isKindOfClass:[OCRPeopleIdCardInfoViewController class]] ||
                        [viewController isKindOfClass:[OCRValidationViewController class]] ||
                        [viewController isKindOfClass:[OCRCameraViewController class]];
  if (!isShowHomePage) {
    OCREmitterModule *eventEmitter = [OCREmitterModule allocWithZone:nil];
    [eventEmitter onExitOCR:nil];
    [self.navigationController setNavigationBarHidden:YES animated:YES];
  }
}

-(void)initPage
{
  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  self.tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  self.tableView.delegate = self;
  self.tableView.dataSource = self;
  self.tableView.tableFooterView = [[UIView alloc] init];
  [self.view addSubview:self.tableView];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  static NSString *text = @"UITableViewPeopleCard";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if (indexPath.row == 0) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    NSString *value = [data objectForKey:@"value"];
    UILabel *nameLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 44)];
    nameLabel.textAlignment = NSTextAlignmentCenter;
    [nameLabel setText:value];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:nameLabel];
  } else if (indexPath.row == 1) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    UIImage *image = [data objectForKey:@"value"];
    if (self.idCardImageView == nil) {
      self.idCardImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.idCardImageView.contentMode = UIViewContentModeScaleAspectFit;
      self.idCardImageView.backgroundColor = [UIColor whiteColor];
      self.idCardImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
      self.idCardImageView.layer.borderWidth = 1.0f;
      self.idCardImageView.userInteractionEnabled = YES;
      [cell addSubview:self.idCardImageView];
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.idCardImageView addGestureRecognizer:singleTap];
      self.idCardImageView.image = image;
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (indexPath.row == 5) {
    self.uploadButton = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadButton setTitle:@"上传证件" forState:UIControlStateNormal];
    self.uploadButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadButton.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
    self.uploadButton.layer.cornerRadius = 5;
    [self.uploadButton addTarget:self action:@selector(uploadIdCard) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadButton];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return 6;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.row == 1) {
    return (self.view.frame.size.width - 80) * 0.56 + 15;
  }
  return 44;
}

-(void)getData
{
  NSDictionary *params = @{
                          @"monitorId": [OCRSingleton sharedSingleton].monitorId,
                        };
  [[OCRServices shardService] requestIdCardInfo: params
                          successHandler:^(id result) {
                            NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                            BOOL success = [[result objectForKey:@"success"] boolValue];
                            if (statusCode == 200 && success == YES) {
                              NSDictionary *data = [result objectForKey:@"obj"];
                              if (data.count > 0) {
                                NSString *gender = [self getGender:[data objectForKey:@"gender"]];
                                if ([gender isEqual:[NSNull null]]) {
                                  gender = @"--";
                                }
                                NSString *identityCardPhoto = [data objectForKey:@"identityCardPhoto"];
                                NSString *identity = [data objectForKey:@"identity"];
                                if ([identity isEqual:[NSNull null]]) {
                                  identity = @"--";
//                                  [OCRSingleton sharedSingleton].oldPhotoUrl = @"";
                                } else {
//                                  [OCRSingleton sharedSingleton].oldPhotoUrl = identityCardPhoto;
                                }
                                NSString *name = [data objectForKey:@"name"];
                                if ([name isEqual:[NSNull null]]) {
                                  name = @"--";
                                }
                                UIImage *image = nil;
                                if (![identityCardPhoto isEqual:[NSNull null]]) {
                                  [OCRSingleton sharedSingleton].oldPhotoUrl = identityCardPhoto;
                                  NSString *photoUrl = [NSString stringWithFormat:@"%@%@", [OCRSingleton sharedSingleton].imageWebUrl, identityCardPhoto];
//                                  image = [UIImage imageWithData:[NSData dataWithContentsOfURL:[NSURL URLWithString:photoUrl]]];
                                  NSOperationQueue *operationQueue = [[NSOperationQueue alloc] init];
                                  NSInvocationOperation *op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadImage:) object:photoUrl];
                                  [operationQueue addOperation:op];
                                } else {
                                  [OCRSingleton sharedSingleton].oldPhotoUrl = @"";
                                }
                                if (image == nil) {
                                  image = [UIImage imageNamed:@"idCardPhoto.png"];
                                }
                                
                                self.peopleCardInfoData = @[
                                                            @{@"key": @"monitorName", @"value":[OCRSingleton sharedSingleton].monitorName},
                                                            @{@"key": @"image", @"value": image},
                                                            @{@"key": @"姓名", @"value": name},
                                                            @{@"key": @"性别", @"value": gender},
                                                            @{@"key": @"身份证号", @"value": identity}
                                                          ];
                                
                                dispatch_async(dispatch_get_main_queue(), ^{
                                  [self.tableView reloadData];
                                });
                              }
                            }
                          }
                             failHandler:^(NSError *error) {
                               if (error.code == 50050) {
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

-(void)defaultData
{
  UIImage *image = [UIImage imageNamed:@"idCardPhoto.png"];
  self.peopleCardInfoData = @[
                              @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                              @{@"key": @"image", @"value": image},
                              @{@"key": @"姓名", @"value": @"--"},
                              @{@"key": @"性别", @"value": @"--"},
                              @{@"key": @"身份证号", @"value": @"--"}
                            ];
}

/**
 * 上传证件
 */
- (void)uploadIdCard
{
  if ([self cameraPermissionsValidation]) {
    AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    OCRCameraViewController *cv = [[OCRCameraViewController alloc] init];
    cv.type = 1;
    [app.nav pushViewController:cv animated:YES];
  }
}

/**
 * 性别
 */
- (NSString *)getGender:(NSString *)type
{
  if ([type isEqualToString:@"1"]) {
    return @"男";
  } else {
    return @"女";
  }
}

- (void)handleSingleTap:(UITapGestureRecognizer *)gestureRecognizer {
  MyUITapGestureRecognizer *tap = (MyUITapGestureRecognizer *)gestureRecognizer;
  [[PhotoFullScreen shareInstances] makeToast:tap.image];
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

- (void)downloadImage:(NSString *)url
{
  NSURL *imageUrl = [NSURL URLWithString:url];
  UIImage *image = [UIImage imageWithData:[NSData dataWithContentsOfURL:imageUrl]];
  if (image != nil) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self.idCardImageView.image = image;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.idCardImageView addGestureRecognizer:singleTap];
    });
  }
}

@end
