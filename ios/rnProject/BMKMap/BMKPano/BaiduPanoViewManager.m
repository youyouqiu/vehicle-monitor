//
//  BaiduPanoViewManager.m
//  rnProject
//
//  Created by zwkj on 2019/4/30.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "BaiduPanoViewManager.h"

@implementation BaiduPanoViewManager

RCT_EXPORT_MODULE()

/**
 * 设置全景位置
 */
RCT_EXPORT_VIEW_PROPERTY(customPanoView, NSDictionary*);

/**
 * 全景区域大小切换事件
 */
RCT_EXPORT_VIEW_PROPERTY(onPanoramaScreenChange, RCTBubblingEventBlock)

/**
 * 全景关闭通知事件
 */
RCT_EXPORT_VIEW_PROPERTY(onPanoramaClose, RCTBubblingEventBlock)

/**
 * 全景加载失败通知事件
 */
RCT_EXPORT_VIEW_PROPERTY(onPanoramaFailed, RCTBubblingEventBlock)

/**
 * 全景加载成功通知事件
 */
RCT_EXPORT_VIEW_PROPERTY(onPanoramaSuccess, RCTBubblingEventBlock)

/**
 * 初始化视图
 */
-(UIView *)view
{
  BaiduPanoView* panoView = [[BaiduPanoView alloc] init];
  return panoView;
}

@end
