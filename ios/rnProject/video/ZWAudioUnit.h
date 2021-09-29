//
//  ZWAudioUnit.h
//  VideoEx1
//
//  Created by 改革丰富 on 2018/10/8.
//  Copyright © 2018年 zwlbs. All rights reserved.
//

#ifndef ZWAudioUnit_h
#define ZWAudioUnit_h

#define OUTPUT_BUS 0
#define INPUT_BUS 1
#define PLAY_KICKSTART_BUFFER_COUNT 4
#define PAYLOAD_TYPE_G721 1
#define PAYLOAD_TYPE_G711A 6
#define PAYLOAD_TYPE_G711U 7
#define PAYLOAD_TYPE_G726 8
#define PAYLOAD_TYPE_G726_16 29
#define PAYLOAD_TYPE_G726_24 30
#define PAYLOAD_TYPE_G726_32 31
#define PAYLOAD_TYPE_G726_40 32
#define PAYLOAD_TYPE_ADPCM 26
#define AUDIO_BUFFER_SIZE 1024

@interface ZWAudioUnit : NSObject

@property (strong, readwrite) NSMutableData *audioByteData;

-(id)initAudioUnit:(int)sampleRate;
-(void)play:(uint8_t*)data dataLen:(int)len audioFormat:(int)audioFormat;
-(void)start;
-(void)stop;
-(void)audio_release;

@end

#endif /* ZWAudioUnit_h */
