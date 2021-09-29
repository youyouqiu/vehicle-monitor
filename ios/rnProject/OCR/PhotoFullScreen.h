//
//  PhotoFullScreen.h
//  rnProject
//
//  Created by zwkj on 2019/7/24.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface PhotoImageView : UIView

@property (nonatomic, strong) UIImageView *imageView;

-(void)setMessageImage:(UIImage *)image;

@end

@interface PhotoFullScreen : NSObject
{
  PhotoImageView *pImageView;
}

+ (instancetype)shareInstances;

- (void)makeToast:(UIImage *)image;

@end
