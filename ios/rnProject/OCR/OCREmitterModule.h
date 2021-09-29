//
//  OCREmitterModule.h
//  rnProject
//
//  Created by zwkj on 2019/7/31.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface OCREmitterModule : RCTEventEmitter<RCTBridgeModule>

// 通知进入ocr原生页面
- (void)onEnterOCR: (NSNotification *)notification;

// 通知离开ocr原生页面
- (void)onExitOCR: (NSNotification *)notification;

@end

