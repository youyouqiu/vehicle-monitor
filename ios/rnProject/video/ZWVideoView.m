//
//  ZWVideoView.m
//  rnProject
//
//  Created by zwkj on 2018/8/29.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "ZWVideoView.h"
#import "ZWStreamPlayer.h"

#import <React/RCTComponent.h> //事件

@interface ZWVideoView() <ZWStreamPlayerDelegate>

    @property (nonatomic, copy) NSString* socketUrl; //url地址
    @property (nonatomic, assign) BOOL ifOpenVideo; //是否开启视频
    @property (nonatomic, assign) int sampleRate; //音频采样率
    @property (nonatomic,assign) BOOL ifOpenAudio;//是否开启音频
    @property (nonatomic, strong) ZWStreamPlayer* player;
    @property (nonatomic, assign) int channel; // 通道号
    @property (nonatomic, copy) NSString* playType; // 播放类型

    @property (nonatomic, copy) RCTBubblingEventBlock onStateChange; // 事件
    @property (nonatomic, copy) RCTBubblingEventBlock onMessageChange; // 事件
    @property (nonatomic, copy) RCTBubblingEventBlock onVideoSizeChange; // 事件

@end


@implementation ZWVideoView

-(void)close
{
    NSLog(@"close ZWVideoView");
    if(_player)
    {
        [_player close];
    }
}

-(void)setSocketUrl:(NSString*)socketUrl
{
    _socketUrl = socketUrl;
    if (_ifOpenVideo && !_player) {
        NSLog(@"[native] setSocketUrl play: %@", socketUrl);
        [self setIfOpenVideo:_ifOpenVideo];
    }
}
-(void)setChannel:(int)channel
{
    _channel = channel;
}
-(void)setPlayType:(NSString*)playType
{
    _playType = playType;
}

-(void)setSampleRate:(int)sampleRate
{
  _sampleRate = sampleRate;
}

-(void)setIfOpenAudio:(BOOL)ifOpenAudio
{
  _ifOpenAudio = ifOpenAudio;
  
  if (_player) {
    if (_ifOpenAudio) {
      [_player playAudio];
    }else{
      [_player closeAudio];
    }
  }
}

/**
 * 设置视频播放或停止
 */
-(void)setIfOpenVideo:(BOOL)ifOpenVideo
{
    _ifOpenVideo = ifOpenVideo;

    if(_ifOpenVideo)
    {
      if(_player)
      {
        NSLog(@"前端代码有误");
        abort();
      }
      NSLog(@"sampleRate: %d", _sampleRate);
//      _player = [[ZWStreamPlayer alloc] initWithUri:_socketUrl view:self delegate:self sampleRate:8000 enableAudio:true];
      _player = [[ZWStreamPlayer alloc] initWithUri:_socketUrl view:self delegate:self sampleRate:_sampleRate enableAudio:_ifOpenAudio withChannel:_channel withPlayType:_playType];
//      NSLog(@"onPlay 123456");
    }
    else if(_player)
    {
      NSLog(@"关闭视频");
      [_player close];
      _player = nil;
      NSLog(@"onStop 123456");
    }
    else
    {
        NSLog(@"player is nil, ifOpenVideo: %d", _ifOpenAudio);
    }
}
-(void)sendMessage:(NSString*)msg
{
    if(_ifOpenVideo)
    {
        if (_player) {
            [_player sendMessage:msg];
            return;
        }
    }
    NSLog(@"error sendMessage");
}

/**
 * 0链接socket成功，1出错，2关闭,3打开视频成功,4关闭视频
 */
-(void)onState:(int)state
{
  NSLog(@"[native]state%i",state);
  if (!self.onStateChange) {
    return;
  }
  NSLog(@"[native]onStateChange%i",state);
  self.onStateChange(@{@"state": @[@(state)]});
}

-(void)onMessage:(NSString *)message
{
 NSLog(@"[native]onMessage %@",message);
 if (!self.onMessageChange) {
   return;
 }
 self.onMessageChange(@{@"message": @[message]});
}
-(void)onVideoSize:(int)width height:(int)height
{
    NSLog(@"[native]onVideoSize %d-%d",width,height);
    if (!self.onVideoSizeChange) {
      return;
    }
    self.onMessageChange(@{@"width": @[@(width)],@"height": @[@(height)]});
}
@end
