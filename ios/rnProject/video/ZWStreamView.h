//
//  ZWStreamView.h
//  MetalYUV420P
//
//  Created by 改革丰富 on 2017/3/7.
//  Copyright © 2017年 改革丰富. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ZWStreamView : UIView

@property (nonatomic, assign, readonly) CGSize textureSize;

-(instancetype)initWithFrame:(CGRect)frameRect;

-(void)draw:(CVPixelBufferRef)pixelBuffer;

@end
