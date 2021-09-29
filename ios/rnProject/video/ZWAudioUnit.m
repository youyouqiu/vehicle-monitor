//
//  ZWAudioUnit.m
//  VideoEx1
//
//  Created by 改革丰富 on 2018/10/8.
//  Copyright © 2018年 zwlbs. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <AudioUnit/AudioUnit.h>
#import "ZWAudioUnit.h"
#import "AudioCoder/AdpcmCoder.h"
#import "AudioCoder/G726Coder.h"
#import "AudioCoder/G711Coder.h"

#pragma mark - callback function

static OSStatus PlayCallback(void *inRefCon,
                             AudioUnitRenderActionFlags *ioActionFlags,
                             const AudioTimeStamp *inTimeStamp,
                             UInt32 inBusNumber,
                             UInt32 inNumberFrames,
                             AudioBufferList *ioData)
{
    ZWAudioUnit *audioUnit = (__bridge ZWAudioUnit *)inRefCon;
    int num = ioData->mNumberBuffers;
    AudioBuffer buffer;
    
    NSMutableData *audioData = audioUnit.audioByteData;
    long len = audioData.length;
    if (len <= 0)
    {
        for (int i = 0; i < num; i++) {
            buffer = ioData->mBuffers[i];
            // play silent audio
            memset(buffer.mData, 0, buffer.mDataByteSize);
        }
        return noErr;
    }
    
    for (int i = 0; i < num; i++) {
        @autoreleasepool {
            buffer = ioData->mBuffers[i];
            NSData *pcmBlock = [audioData subdataWithRange:NSMakeRange(0, (NSUInteger) len)];
            UInt32 size = (UInt32)MIN(buffer.mDataByteSize, len);
            memcpy(buffer.mData, pcmBlock.bytes, size);
            //NSLog(@"play audio data, bytes:%d, total: %ld", size, len);
            [audioData replaceBytesInRange:NSMakeRange(0, size) withBytes:NULL length:0];
            buffer.mDataByteSize = size;
        }
    }
    return noErr;
}

@interface ZWAudioUnit()

@property (nonatomic, assign, readwrite) int sampleRate;
@property (nonatomic, assign, readwrite) BOOL isPlaying;
@property (nonatomic, assign, readwrite) AudioComponentInstance audioUnit;
@property (nonatomic, assign, readwrite) adpcm_state *adpcmState;
@property (nonatomic, assign, readwrite) g726_state_t *g726State;
@property (nonatomic, assign, readwrite) short *decodeBuffer;

@end

@implementation ZWAudioUnit
{
    bool _g726_init;
}
@synthesize audioByteData;
@synthesize isPlaying;
@synthesize audioUnit;
@synthesize adpcmState;
@synthesize g726State;
@synthesize decodeBuffer;

- (void)initAudioSession
{
    NSError *error;
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    
    [audioSession setCategory:AVAudioSessionCategoryPlayback error:&error];
    [audioSession setPreferredSampleRate:8000 error:&error];
    [audioSession setPreferredInputNumberOfChannels:1 error:&error];
    [audioSession setPreferredIOBufferDuration:0.128 error:&error];
}

- (void)initBuffer
{
    UInt32 flag = 0;
    OSStatus status = AudioUnitSetProperty(audioUnit,
                                           kAudioUnitProperty_ShouldAllocateBuffer,
                                           kAudioUnitScope_Output,
                                           OUTPUT_BUS,
                                           &flag,
                                           sizeof(flag));
    [self hasError:status file:__FILE__ line:__LINE__];
}

- (void)initAudioComponent
{
    AudioComponentDescription audioDesc;
    audioDesc.componentType = kAudioUnitType_Output;
    audioDesc.componentSubType = kAudioUnitSubType_RemoteIO;
    audioDesc.componentManufacturer = kAudioUnitManufacturer_Apple;
    audioDesc.componentFlags = 0;
    audioDesc.componentFlagsMask = 0;
    
    AudioComponent inputComponent = AudioComponentFindNext(NULL, &audioDesc);
    AudioComponentInstanceNew(inputComponent, &audioUnit);
    UInt32 flag = 1;
    OSStatus status = AudioUnitSetProperty(audioUnit,
                                           kAudioOutputUnitProperty_EnableIO,
                                           kAudioUnitScope_Output,
                                           OUTPUT_BUS,
                                           &flag,
                                           sizeof(flag));
    [self hasError:status file:__FILE__ line:__LINE__];
}

- (void)initADPCMFormat:(int)sampleRate;
{
    AudioStreamBasicDescription audioFormat = {0};
    audioFormat.mSampleRate = sampleRate;
    audioFormat.mFormatID = kAudioFormatLinearPCM;
    audioFormat.mFormatFlags = kAudioFormatFlagIsSignedInteger | kAudioFormatFlagIsPacked;
    audioFormat.mFramesPerPacket = 1;
    audioFormat.mChannelsPerFrame = 1;
    audioFormat.mBitsPerChannel = 16;
    audioFormat.mBytesPerPacket = 2;
    audioFormat.mBytesPerFrame = 2;
    OSStatus status = AudioUnitSetProperty(audioUnit,
                                           kAudioUnitProperty_StreamFormat,
                                           kAudioUnitScope_Input,
                                           OUTPUT_BUS,
                                           &audioFormat,
                                           sizeof(audioFormat));
    [self hasError:status file:__FILE__ line:__LINE__];
    
    status = AudioUnitSetProperty(audioUnit,
                                  kAudioUnitProperty_StreamFormat,
                                  kAudioUnitScope_Output,
                                  INPUT_BUS,
                                  &audioFormat,
                                  sizeof(audioFormat));
    [self hasError:status file:__FILE__ line:__LINE__];
}

- (void)initPlayCallback
{
    AURenderCallbackStruct playCallback;
    playCallback.inputProc = PlayCallback;
    playCallback.inputProcRefCon = (__bridge void * _Nullable)(self);
    OSStatus status = AudioUnitSetProperty(audioUnit,
                                           kAudioUnitProperty_SetRenderCallback,
                                           kAudioUnitScope_Global,
                                           OUTPUT_BUS,
                                           &playCallback,
                                           sizeof(playCallback));
    [self hasError:status file:__FILE__ line:__LINE__];
}

- (void)hasError:(int)statusCode file:(char *)file line:(int)line
{
    if (statusCode)
    {
        NSLog(@"Error Code responded %d in file %s on line %d", statusCode, file, line);
    }
}

-(void)decodeAdpcm:(uint8_t*)data dataLen:(int)len
{
    len = (len - 4);
    int size = len << 2;
    initAdpcmState((char *)data, adpcmState);
    short *buffer = (short *)malloc((size_t) size);
    adpcm_decode((char *)(data + 4), buffer, len, adpcmState);
    [audioByteData appendBytes:buffer length:(NSUInteger) size];
    free(buffer);
}

- (void)changeByteEndian:(uint8_t *)data len:(int *)len
{
    uint8_t c = 0;
    for (int i = 0; i < *len; i++)
    {
        c = data[i];
        data[i] = (uint8_t) (((c & 0x0F) << 4) + ((c >> 4) & 0x0F));
    }
}

- (void)decodeG726Data:(uint8_t *)data len:(int *)len {
    [self changeByteEndian:data len:len];
    int size = decodeG726(data, *len, decodeBuffer, g726State);
    [audioByteData appendBytes:decodeBuffer length:(NSUInteger) (size << 1)];
#ifdef DEBUG
    NSLog(@"bytes after decode: %d", size);
#endif
}
- (void)decodeG711AData:(uint8_t *)data len:(int *)len {
    decodeG711a(decodeBuffer, data, *len);
    int count = *len;
    [audioByteData appendBytes:decodeBuffer length:(NSUInteger) (count << 1)];
}
- (void)decodeG711UData:(uint8_t *)data len:(int *)len {
    decodeG711u(decodeBuffer, data, *len);
    int count = *len;
    [audioByteData appendBytes:decodeBuffer length:(NSUInteger) (count << 1)];
}

- (void)initCodecState
{
    adpcmState = (adpcm_state *)malloc(sizeof(adpcm_state));
    memset(adpcmState, 0, sizeof(adpcm_state));

}
- (void)initG726:(int)bitCount
{
    if (!_g726_init) {
        g726State = (g726_state_t *)malloc(sizeof(g726_state_t));
        memset(g726State, 0, sizeof(g726_state_t));
        initG726State(4, g726State);
    #ifdef DEBUG
        NSLog(@"initG726State to 4bit");
    #endif
        _g726_init = true;
    }
}

#pragma mark - public methods

-(id)initAudioUnit:(int)sampleRate
{
    self = [self init];
    AudioUnitInitialize(audioUnit);
    _g726_init = false;
    [self initCodecState];
    decodeBuffer = (short *)malloc(AUDIO_BUFFER_SIZE);
    audioByteData = [[NSMutableData alloc] init];
    [self initAudioSession];
    [self initAudioComponent];
    [self initADPCMFormat:sampleRate];
    [self initPlayCallback];
    [self initBuffer];
    return self;
}

-(void)play:(uint8_t*)data dataLen:(int)len audioFormat:(int)audioFormat
{
    uint8_t* pdata = data;
    int dataLen = len;
    if (pdata[0] == 0x00 && pdata[1] == 0x01 && pdata[3] == 0x00 && (pdata[2] & 0xff) == (dataLen - 4) / 2){
        pdata += 4;
        dataLen -= 4;
    }
    if (audioFormat == PAYLOAD_TYPE_ADPCM)
    {
        [self decodeAdpcm:pdata dataLen:dataLen];
    }
    else if (audioFormat == PAYLOAD_TYPE_G711A)
    {
        [self decodeG711AData:pdata len:&dataLen];
    }
    else if (audioFormat == PAYLOAD_TYPE_G711U)
    {
        [self decodeG711UData:pdata len:&dataLen];
    }
    else if (audioFormat == PAYLOAD_TYPE_G726)
    {
        [self initG726:4];
        [self decodeG726Data:pdata len:&dataLen];
    }
    else if (audioFormat == PAYLOAD_TYPE_G726_16)
    {
        [self initG726:2];
        [self decodeG726Data:pdata len:&dataLen];
    }
    else if (audioFormat == PAYLOAD_TYPE_G726_24)
    {
        [self initG726:3];
        [self decodeG726Data:pdata len:&dataLen];
    }
    else if (audioFormat == PAYLOAD_TYPE_G726_32)
    {
        [self initG726:4];
        [self decodeG726Data:pdata len:&dataLen];
    }
    else if (audioFormat == PAYLOAD_TYPE_G726_40)
    {
        [self initG726:5];
        [self decodeG726Data:pdata len:&dataLen];
    }
    
    if (isPlaying)
    {
        return;
    }
    [self start];
}

-(void)start
{
    if (isPlaying)
    {
        return;
    }
    OSStatus status = AudioOutputUnitStart(audioUnit);
    [self hasError:status file:__FILE__ line:__LINE__];
    isPlaying = TRUE;
#ifdef DEBUG
    NSLog(@"Start play audio");
#endif
}

-(void)stop
{
    OSStatus status = AudioOutputUnitStop(audioUnit);
    [self hasError:status file:__FILE__ line:__LINE__];
    isPlaying = FALSE;
    [audioByteData resetBytesInRange:NSMakeRange(0, audioByteData.length)];
#ifdef DEBUG
    NSLog(@"Stop play audio");
#endif
}

-(void)audio_release
{
    OSStatus status = AudioUnitUninitialize(audioUnit);
    [self hasError:status file:__FILE__ line:__LINE__];
    isPlaying = FALSE;
    if (decodeBuffer != NULL)
    {
        free(decodeBuffer);
        decodeBuffer = NULL;
    }
}

-(void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver: self];
    AudioOutputUnitStop(audioUnit);
    isPlaying = FALSE;
    AudioUnitUninitialize(audioUnit);
    AudioComponentInstanceDispose(audioUnit);
    if (decodeBuffer != NULL)
    {
        free(decodeBuffer);
        decodeBuffer = NULL;
    }
    free(adpcmState);
    free(g726State);
}

@end
