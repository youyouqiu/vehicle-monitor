//
//  ZWHardDecoder.h
//  VideoEx1
//
//  Created by 改革丰富 on 2018/7/26.
//  Copyright © 2018年 改革丰富. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ZWHardDecoder : NSObject

-(CVPixelBufferRef)decode:(uint8_t*)data len:(size_t)len frameType:(int)frameType;

@end
