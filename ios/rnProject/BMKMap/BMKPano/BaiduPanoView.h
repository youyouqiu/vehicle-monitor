//
//  BaiduPanoView.h
//  rnProject
//
//  Created by zwkj on 2019/4/30.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import <BaiduPanoSDK/BaiduPanoramaView.h>
#import <BaiduPanoSDK/BaiduPanoImageOverlay.h>

@interface BaiduPanoView : UIView<BaiduPanoramaViewDelegate>

@property(strong, nonatomic) BaiduPanoramaView  *panoramaView;

@end
