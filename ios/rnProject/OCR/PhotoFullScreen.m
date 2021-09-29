//
//  PhotoFullScreen.m
//  rnProject
//
//  Created by zwkj on 2019/7/24.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "PhotoFullScreen.h"

#define SCREENHEIGHT [UIScreen mainScreen].bounds.size.height //获取设备屏幕的高
#define SCREENWIDTH [UIScreen mainScreen].bounds.size.width //获取设备屏幕的宽

@implementation PhotoFullScreen

// 实现声明单例方法 GCD
+ (instancetype)shareInstances{
  static PhotoFullScreen *singleton = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    singleton = [[PhotoFullScreen alloc] init];
  });
  return singleton;
}

// 初始化方法
- (instancetype)init {
  self = [super init];
  if (self) {
    pImageView = [[PhotoImageView alloc] init];
  }
  return self;
}

/**
 *  弹出并显示JSToastDialogs
 *  @param message  显示的文本内容
 *  @param duration 显示时间
 */
- (void)makeToast:(UIImage *)image
{
  if (image == nil) {
    return;
  }
  
  [pImageView setMessageImage:image];
  
  [[[UIApplication sharedApplication] keyWindow] addSubview:pImageView];
}

//- (void)setMessageImage:(UIImage *)image {
//  pImageView.frame = CGRectMake(0, 0, SCREENWIDTH, SCREENHEIGHT);
//  UIImageView *imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 0, SCREENWIDTH, SCREENHEIGHT)];
//  imageView.image = image;
//  imageView.contentMode = UIViewContentModeScaleAspectFit;
//
//  imageView.userInteractionEnabled = YES;
//  UITapGestureRecognizer *singleTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap)];
//  [imageView addGestureRecognizer:singleTap];
//
//  [pImageView addSubview:imageView];
//}

//-(void)handleSingleTap
//{
//  [pImageView removeFromSuperview];
//}

@end

@implementation PhotoImageView

- (instancetype)init {
  self = [super init];
  if (self) {
    self.layer.masksToBounds = YES;
    self.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.5];
  }
  return self;
}

- (void)setMessageImage:(UIImage *)image {
  self.frame = CGRectMake(0, 0, SCREENWIDTH, SCREENHEIGHT);
  if (self.imageView == nil) {
    self.imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, 0, SCREENWIDTH, SCREENHEIGHT)];
    self.imageView.contentMode = UIViewContentModeScaleAspectFit;
    self.imageView.userInteractionEnabled = YES;
    UITapGestureRecognizer *singleTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap)];
    [self.imageView addGestureRecognizer:singleTap];
    [self addSubview:self.imageView];
  }
  self.imageView.image = image;
}

-(void)handleSingleTap
{
  [self removeFromSuperview];
}

@end

