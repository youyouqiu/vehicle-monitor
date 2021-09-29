//
//  ToastView.h
//  scanning
//
//  Created by zwkj on 2019/7/3.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface ToastLabel : UILabel

-(void)setMessageText:(NSString *)text;

@end

@interface ToastView : NSObject
{
  ToastLabel *toastLabel;
  NSTimer *countTimer;
}

+ (instancetype)shareInstance;

- (void)makeToast:(NSString *)message duration:(CGFloat)duration;

@end
