//
//  LoadingView.h
//  scanning
//
//  Created by zwkj on 2019/7/3.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface ScreenView:UIView

@end

@interface LoadingView : NSObject
{
  ScreenView* screenView;
}

+ (instancetype)shareInstance;

- (void)loadingHidden:(BOOL)state;

@end

