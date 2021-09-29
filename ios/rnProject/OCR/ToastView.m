//
//  ToastView.m
//  scanning
//
//  Created by zwkj on 2019/7/3.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "ToastView.h"

static int changeCount;

#define SCREENHEIGHT [UIScreen mainScreen].bounds.size.height //获取设备屏幕的高
#define SCREENWIDTH [UIScreen mainScreen].bounds.size.width //获取设备屏幕的宽

@implementation ToastView

// 实现声明单例方法 GCD
+ (instancetype)shareInstance {
  static ToastView *singleton = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    singleton = [[ToastView alloc] init];
  });
  return singleton;
}

// 初始化方法
- (instancetype)init {
  self = [super init];
  if (self) {
  toastLabel = [[ToastLabel alloc] init];
  countTimer = [NSTimer scheduledTimerWithTimeInterval:1.0 target:self selector:@selector(changeTime) userInfo:nil repeats:YES];
  countTimer.fireDate = [NSDate distantFuture];//关闭定时器
  }
  return self;
}

/**
 *  弹出并显示JSToastDialogs
 *  @param message  显示的文本内容
 *  @param duration 显示时间
 */
- (void)makeToast:(NSString *)message duration:(CGFloat)duration {
  if ([message length] == 0) {
    return;
  }
  [toastLabel setMessageText:message];
  [[[UIApplication sharedApplication] keyWindow] addSubview:toastLabel];
  toastLabel.alpha = 0.8;
  countTimer.fireDate = [NSDate distantPast];//开启定时器
  changeCount = duration;
}

//定时器回调方法
- (void)changeTime {
  if(changeCount-- <= 0){
    countTimer.fireDate = [NSDate distantFuture]; //关闭定时器
    [UIView animateWithDuration:0.2f animations:^{
      toastLabel.alpha = 0;
    } completion:^(BOOL finished) {
      [toastLabel removeFromSuperview];
    }];
  }
}

@end

@implementation ToastLabel

//DialogsLabel初始化，为label设置各种属性
- (instancetype)init {
  self = [super init];
  if (self) {
    self.layer.cornerRadius = 8;
    self.layer.masksToBounds = YES;
    self.backgroundColor = [UIColor blackColor];
    self.numberOfLines = 0;
    self.textAlignment = NSTextAlignmentCenter;
    self.textColor = [UIColor whiteColor];
    self.font = [UIFont systemFontOfSize:15];
  }
  return self;
}

//设置显示的文字

- (void)setMessageText:(NSString *)text {
  [self setText:text];
  self.frame = CGRectMake((SCREENWIDTH-200)/2, SCREENHEIGHT/2 - 25, 200, 50);
}

@end
