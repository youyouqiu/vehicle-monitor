//
//  LoadingView.m
//  scanning
//
//  Created by zwkj on 2019/7/3.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "LoadingView.h"

#define SCREENHEIGHT [UIScreen mainScreen].bounds.size.height //获取设备屏幕的高
#define SCREENWIDTH [UIScreen mainScreen].bounds.size.width //获取设备屏幕的宽

int angle = 0.0;

@implementation LoadingView

// 实现声明单例方法 GCD
+ (instancetype)shareInstance {
  static LoadingView *singleton = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    singleton = [[LoadingView alloc] init];
  });
  return singleton;
}

// 初始化方法
- (instancetype)init {
  self = [super init];
  if (self) {
    screenView = [[ScreenView alloc] init];
  }
  return self;
}

/**
 * 控制loading显示和隐藏
 */
- (void)loadingHidden:(BOOL)state
{
  if (state) {
    [screenView removeFromSuperview];
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[[UIApplication sharedApplication] keyWindow] addSubview:screenView];
    });
  }
}

@end

@interface ScreenView()

@property (nonatomic, strong) UIImageView *loadingImageView;

@end

@implementation ScreenView

- (instancetype)init {
  self = [super init];
  if (self) {
    self.frame = CGRectMake(0, 0, SCREENWIDTH, SCREENHEIGHT);
//    self.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.3];
    UIImage *loadingImage = [UIImage imageNamed:@"spinner.png"];
    self.loadingImageView = [[UIImageView alloc] initWithFrame:CGRectMake((SCREENWIDTH-30)/2, SCREENHEIGHT/2 - 15, 30, 30)];
    self.loadingImageView.image = loadingImage;
    self.loadingImageView.contentMode = UIViewContentModeScaleAspectFit;
    [self addSubview:self.loadingImageView];
    [self startAnimation];
  }
  return self;
}

- (void)startAnimation
{
  [UIView beginAnimations:nil context:nil];
  [UIView setAnimationDuration:0.05];
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(endAnimation)];
  self.loadingImageView.transform = CGAffineTransformMakeRotation(angle * (M_PI /180.0f));
  [UIView commitAnimations];
}

-(void)endAnimation
{
  angle += 15;
  [self startAnimation];
}

@end
