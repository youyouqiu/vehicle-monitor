//

//  Created by 改革丰富 on 2018/7/26.
//  Copyright © 2018年 改革丰富. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ZWStreamView.h"

@protocol ZWStreamPlayerDelegate;

@interface ZWStreamPlayer : NSObject

@property(nonatomic, weak) id<ZWStreamPlayerDelegate> delegate;

@property (nonatomic, copy, readonly) NSString* uri;

-(instancetype)initWithUri:(NSString*)uri view:(ZWStreamView*)view delegate:(id<ZWStreamPlayerDelegate>)delegate sampleRate:(int)sampleRate enableAudio:(bool)enableAudio  withChannel:(int)channel withPlayType:(NSString*)playType;

-(void)playAudio;

-(void)closeAudio;

-(void)close;

-(void)sendMessage:(NSString*)message;
@end

@protocol ZWStreamPlayerDelegate <NSObject>

-(void)onState:(int)state;

-(void)onMessage:(NSString *)message;

-(void)onVideoSize:(int)width height:(int)height;
@end
