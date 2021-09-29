//
//  OCRTransportInfoViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/26.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRTransportInfoViewController.h"
#import "OCRCameraViewController.h"
#import "AppDelegate.h"
#import "OCRServices.h"
#import "OCRSingleton.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"
#import <AVFoundation/AVFoundation.h>
#import "ToastView.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRTransportInfoViewController ()<UITableViewDelegate, UITableViewDataSource>

@property (nonatomic, strong) UILabel *monitorName;
@property (nonatomic, strong) NSArray *transportData;
@property (nonatomic, strong) UIButton *uploadCertificate;
@property (nonatomic, strong) UITableView *tableView;
@property (nonatomic, strong) UILabel *headerTitle;
@property (nonatomic, strong) UIImageView *transportImageView;
//@property (nonatomic, strong) UINavigationController *nc;

@end

@implementation OCRTransportInfoViewController

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  self.navigationController.navigationBar.topItem.title = @"";
  self.view.backgroundColor = UIColorFromRGB(0xf4f7fa); // [UIColor whiteColor];
  self.navigationController.navigationBar.barTintColor = UIColorFromRGB(0x339eff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
  [self.navigationController.navigationBar setTitleTextAttributes:
   @{NSFontAttributeName:[UIFont systemFontOfSize:18],
     NSForegroundColorAttributeName:[UIColor whiteColor]}];
  [[UINavigationBar appearance] setTintColor:[UIColor whiteColor]];
  self.navigationController.navigationBarHidden = NO;
//  [OCRSingleton sharedSingleton].isNativePage = YES;
  
  self.view.backgroundColor = [UIColor whiteColor];
  self.title = @"运输证信息";
  
  self.headerTitle = [[UILabel alloc] initWithFrame:CGRectMake(self.view.frame.size.width/2 - 75, 0, 150, self.navigationController.navigationBar.frame.size.height)];
  self.headerTitle.textAlignment = NSTextAlignmentCenter;
  self.headerTitle.textColor = [UIColor whiteColor];
  self.headerTitle.text = @"运输证信息";
  [self.navigationController.navigationBar addSubview:self.headerTitle];
  
  if ([OCRSingleton sharedSingleton].isLoadData) {
    [self getData];
    [OCRSingleton sharedSingleton].isLoadData = NO;
  }
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  [self.headerTitle removeFromSuperview];
  self.headerTitle = nil;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  [OCRSingleton sharedSingleton].isLoadData = YES;
//  self.nc = self.navigationController;
  [self defaultData];
  [self initPage];
}

-(void)initPage
{
  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  self.tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  self.tableView.delegate = self;
  self.tableView.dataSource = self;
  self.tableView.backgroundColor = UIColorFromRGB(0xf4f7fa);
  self.tableView.tableFooterView = [[UIView alloc] init];
  [self.view addSubview:self.tableView];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  static NSString *text = @"UITableViewTransportCell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if (indexPath.row == 0) {
    NSDictionary *data = [self.transportData objectAtIndex:indexPath.row];
    NSString *value = [data objectForKey:@"value"];
    UILabel *nameLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 44)];
    nameLabel.textAlignment = NSTextAlignmentCenter;
    [nameLabel setText:value];
    [cell addSubview:nameLabel];
    nameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (indexPath.row == 1) {
    NSDictionary *data = [self.transportData objectAtIndex:indexPath.row];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    if (self.transportImageView == nil) {
      self.transportImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.transportImageView.contentMode = UIViewContentModeScaleAspectFit;
//      self.transportImageView.backgroundColor = UIColorFromRGB(0xf4f7fa);
//      self.transportImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//      self.transportImageView.layer.borderWidth = 1.0f;
      
      self.transportImageView.userInteractionEnabled = YES;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.transportImageView addGestureRecognizer:singleTap];
      [cell.contentView addSubview:self.transportImageView];
      self.transportImageView.image = image;
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (indexPath.row == 2) {
    NSDictionary *data = [self.transportData objectAtIndex:indexPath.row];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  } else if (indexPath.row == 3) {
    self.uploadCertificate = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadCertificate setTitle:@"上传证件" forState:UIControlStateNormal];
    self.uploadCertificate.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadCertificate.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    self.uploadCertificate.layer.cornerRadius = 5;
    [self.uploadCertificate addTarget:self action:@selector(uploadCertificateEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadCertificate];
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

-(void)uploadCertificateEvent
{
  if ([self cameraPermissionsValidation]) {
    if (self.transportData.count >= 4) {
      NSDictionary *data = self.transportData[3];
      if (data != nil) {
        NSString *oldPhotoUrl = [data objectForKey:@"value"];
        [OCRSingleton sharedSingleton].oldPhotoUrl = oldPhotoUrl;
        AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        OCRCameraViewController *cv = [[OCRCameraViewController alloc] init];
        cv.type = 4;
        [app.nav pushViewController:cv animated:YES];
      }
    }
  }
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return 4;
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

-(void)defaultData
{
  UIImage *image = [UIImage imageNamed:@"transportPositive.png"];
  self.transportData = @[
                         @{@"key": @"monitorName", @"value": @""},
                         @{@"key": @"image", @"value": image},
                         @{@"key": @"运输证号", @"value": @"--"}
                      ];
}

-(void)getData
{
  NSDictionary *params = @{
                           @"monitorId": [OCRSingleton sharedSingleton].monitorId,
                           };
  [[OCRServices shardService] requestTransportNumberInfo:params
                                          successHandler:^(id result) {
                                            NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                                            BOOL success = [[result objectForKey:@"success"] boolValue];
                                            if (statusCode == 200 && success == YES) {
                                              NSDictionary *data = [result objectForKey:@"obj"];
                                              NSString *transportNumberPhoto = [data objectForKey:@"transportNumberPhoto"];
                                              UIImage *image = nil;
                                              if (![transportNumberPhoto isEqual:[NSNull null]]) {
                                                NSString *photoUrl = [NSString stringWithFormat:@"%@%@", [OCRSingleton sharedSingleton].imageWebUrl, transportNumberPhoto];
//                                                image = [UIImage imageWithData:[NSData dataWithContentsOfURL:[NSURL URLWithString:photoUrl]]];
                                                NSOperationQueue *operationQueue = [[NSOperationQueue alloc] init];
                                                NSInvocationOperation *op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadImage:) object:photoUrl];
                                                [operationQueue addOperation:op];
                                              } else {
                                                transportNumberPhoto = @"";
                                              }
                                              
                                              if (image == nil) {
                                                image = [UIImage imageNamed:@"transportPositive.png"];
                                              }
                                              
                                              NSString *transportNumber = [data objectForKey:@"transportNumber"];
                                              if ([transportNumber isEqual:[NSNull null]]) {
                                                transportNumber = @"--";
                                              }
                                              
                                              self.transportData = @[
                                                                     @{@"key": @"monitorName", @"value": [OCRSingleton sharedSingleton].monitorName},
                                                                     @{@"key": @"image", @"value": image},
                                                                     @{@"key": @"运输证号", @"value": transportNumber},
                                                                     @{@"key": @"oldPhotoUrl", @"value": transportNumberPhoto}
                                                                     ];
                                              dispatch_async(dispatch_get_main_queue(), ^{
                                                [self.tableView reloadData];
                                              });
                                            }
                                          }
                                             failHandler:^(NSError *err) {
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
      self.transportImageView.image = image;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.transportImageView addGestureRecognizer:singleTap];
    });
  }
}

@end
