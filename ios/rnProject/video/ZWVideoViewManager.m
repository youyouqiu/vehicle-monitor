//
//  ZWVideoViewManager.m
//  rnProject
//
//  Created by wanjikun on 2018/8/28.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "ZWVideoViewManager.h"
#import "ZWVideoView.h"
#import "React/RCTUIManager.h"

@implementation ZWVideoViewManager
//导出该类到react-native
RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(socketUrl, NSString)
RCT_EXPORT_VIEW_PROPERTY(ifOpenVideo, BOOL)
RCT_EXPORT_VIEW_PROPERTY(sampleRate, int) //音频采样率
RCT_EXPORT_VIEW_PROPERTY(ifOpenAudio, BOOL) //是否播放音频
RCT_EXPORT_VIEW_PROPERTY(channel, int) // 通道号
RCT_EXPORT_VIEW_PROPERTY(playType, NSString) // 播放类型

RCT_EXPORT_VIEW_PROPERTY(onStateChange, RCTBubblingEventBlock)  //事件相关
RCT_EXPORT_VIEW_PROPERTY(onMessageChange, RCTBubblingEventBlock)  //事件相关
RCT_EXPORT_VIEW_PROPERTY(onVideoSizeChange, RCTBubblingEventBlock)  //事件相关

RCT_EXPORT_METHOD(close:(nonnull NSNumber *)reactTag)
{
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        ZWVideoView *view = (ZWVideoView *) viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[ZWVideoView class]]) {
            RCTLogError(@"Cannot find Component with tag #%@", reactTag);
            return;
        }
        [view close];
    }];
}

RCT_EXPORT_METHOD(message:(nonnull NSNumber *)reactTag msg:(NSString*)msg)
{
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        ZWVideoView *view = (ZWVideoView *) viewRegistry[reactTag];
        if (view) {
            [view sendMessage:msg];
        }
    }];
}

//创建原声视图
-(UIView *)view
{
  return [[ZWVideoView alloc] initWithFrame:CGRectMake(10, 10, 100, 100)];

}
@end
