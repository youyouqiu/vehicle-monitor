//
//  BaiduPanoView.m
//  rnProject
//
//  Created by zwkj on 2019/4/30.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "BaiduPanoView.h"

@interface BaiduPanoView()

@property (nonatomic, assign) BOOL isScreen;
@property (nonatomic, assign) BOOL flag;
@property (nonatomic, strong) NSDictionary *position;
@property (nonatomic, copy) RCTBubblingEventBlock onPanoramaScreenChange;
@property (nonatomic, copy) RCTBubblingEventBlock onPanoramaClose;
@property (nonatomic, copy) RCTBubblingEventBlock onPanoramaFailed;
@property (nonatomic, copy) RCTBubblingEventBlock onPanoramaSuccess;

@end

@implementation BaiduPanoView

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self initPanorama];
  }
  return self;
}

- (void)panoramaLoadFailed:(BaiduPanoramaView *)panoramaView error:(NSError *)error
{
  NSLog(@"SSDSDSDSD");
  if (self.onPanoramaFailed) {
    self.onPanoramaFailed(@{@"data": @"false"});
  }
}

- (void)panoramaWillLoad:(BaiduPanoramaView *)panoramaView
{
  NSLog(@"SSDSDSDSD");
}

- (void)panoramaDidLoad:(BaiduPanoramaView *)panoramaView descreption:(NSString *)jsonStr
{
  NSLog(@"SSDSDSDSD");
  if (self.onPanoramaSuccess) {
    self.onPanoramaSuccess(@{@"data": @"true"});
  }
}

-(void)initPanorama
{
  self.isScreen = NO;
  self.flag = YES;
}

- (void)setCustomPanoView:(NSDictionary *)position
{
  if (position) {
    [self panoramaHandle:position];
  }
}

/**
 * 处理全景初始化或改变位置点
 */
-(void)panoramaHandle:(NSDictionary *)position
{
  self.position = position;
  double lat = [RCTConvert double:position[@"latitude"]];
  double lng = [RCTConvert double:position[@"longitude"]];
  NSString *title = [RCTConvert NSString:position[@"title"]];
  
  if (title.length > 10) {
    title = [[title substringToIndex:10] stringByAppendingString:@"..."];
  }

  if (self.flag) {
    if (self.panoramaView) {
      [self removeReactSubview:self.panoramaView];
    }

    float multiple;
    if (self.isScreen) {
      multiple = 1;
    } else {
      multiple = 1;
    }

    CGFloat width = [self setViewFrame:1 value:CGRectGetWidth([self getFixedScreenFrame])];
    CGFloat height = [self setViewFrame:multiple value:CGRectGetHeight([self getFixedScreenFrame])];
    CGRect frame = CGRectMake(0, 0, width, height);
    self.panoramaView = [[BaiduPanoramaView alloc] initWithFrame:frame key:@"UTL4FHMYP6MRWogBIkL5WBFLjGGpkCMQ"];
    self.panoramaView.delegate = self;



    // 添加按钮
    UIButton *pointBtn;
    if (self.isScreen) {
      pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(width - 60, height - 140, 40, 40)];
    } else {
      pointBtn = [[UIButton alloc] initWithFrame:CGRectMake(width - 60, height - 60, 40, 40)];
    }
//        pointBtn.backgroundColor = [UIColor redColor];
    self.panoramaView.userInteractionEnabled = YES;
    pointBtn.enabled = YES;

    UIImageView *imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 0, 40, 40)];
//    if (self.isScreen) {
      imageView.image = [UIImage imageNamed:@"panoramaNarrow.png"];
//    } else {
//      imageView.image = [UIImage imageNamed:@"panoramaAmplification.png"];
//    }

    [pointBtn addSubview:imageView];
    pointBtn.userInteractionEnabled = YES;
    [pointBtn addTarget:self action:@selector(panoramaViewFrameChange) forControlEvents:UIControlEventTouchUpInside];

    [self.panoramaView addSubview:pointBtn];

    UILabel *titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 40, width, 40)];
    titleLabel.font = [UIFont boldSystemFontOfSize:20];
    titleLabel.textColor = [UIColor blackColor];
    titleLabel.text = title; // @"渝A88888";
    titleLabel.textAlignment = NSTextAlignmentCenter;
    [self.panoramaView addSubview:titleLabel];

    [self addSubview:self.panoramaView];
    [self.panoramaView setPanoramaImageLevel:ImageDefinitionMiddle];
    self.flag = NO;
  }   

  [self.panoramaView setPanoramaWithLon:lng lat:lat];
}

/**
 * 点击按钮触发放大缩小
 */
-(void)panoramaViewFrameChange
{
//  self.flag = YES;
//  self.isScreen = !self.isScreen;
//  if (self.position) {
//    [self panoramaHandle:self.position];
//  }
//  if (self.onPanoramaScreenChange) {
//    self.onPanoramaScreenChange(@{@"data": @(self.isScreen)});
//    
//  }
  if (self.onPanoramaClose) {
    self.onPanoramaClose(@{@"data": @"true"});
  }
}

-(CGFloat)setViewFrame:(float)multiple value:(float)value
{
  return multiple * value;
}

- (CGRect)getFixedScreenFrame
{
  CGRect mainScreenFrame = [UIScreen mainScreen].bounds;
#ifdef NSFoundationVersionNumber_iOS_7_1
  if( ![self isPortrait]&& (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_7_1) ) {
    mainScreenFrame = CGRectMake(0, 0, mainScreenFrame.size.height, mainScreenFrame.size.width);
  }
#endif
  return mainScreenFrame;
}

//获取设备bound方法
- (BOOL)isPortrait {
  UIInterfaceOrientation orientation = [self getStatusBarOritation];
  if ( orientation == UIInterfaceOrientationPortrait || orientation == UIInterfaceOrientationPortraitUpsideDown ) {
    return YES;
  }
  return NO;
}

- (UIInterfaceOrientation)getStatusBarOritation {
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  return orientation;
}

- (void)dealloc {
  [self.panoramaView removeFromSuperview];
  self.panoramaView.delegate = nil;
}

@end
