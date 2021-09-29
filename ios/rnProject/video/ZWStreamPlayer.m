//
//  ZWStreamPlayer.m
//  VideoEx1
//
//  Created by 改革丰富 on 2018/7/26.
//  Copyright © 2018年 改革丰富. All rights reserved.
//

#include <sys/types.h>
#import "ZWStreamPlayer.h"
#import "ZWHardDecoder.h"
#import "ZWAudioUnit.h"
#import "CommonPublic.h"
#import "MediaStreamServerC.h"
#import "ZWRtp808Frame.h"


#define logd(...) LogMessageA(0, "KEY", _channel, __VA_ARGS__)
#define logi(...) LogMessageA(1, "KEY", _channel, __VA_ARGS__)
#define logw(...) LogMessageA(2, "KEY", _channel, __VA_ARGS__)
#define loge(...) LogMessageA(3, "KEY", _channel, __VA_ARGS__)
int OnDataBlockFunc(const uint8_t* buffer, int bufferLength, void* data);
#define VIDEO_BUFFER_MAX 1024*1024*15

static const int PAYLOAD_TYPE_MASK = ((1 << 7) - 1);

@interface ZWFrameData : NSObject

@property (nonatomic, assign) uint8_t* data;
@property (nonatomic, assign) uint32_t trueLen;
@property (nonatomic, assign) int type;
@property (nonatomic, assign) uint32_t duration;
@property (nonatomic, assign) uint64_t startTime;

@end

@implementation ZWFrameData

-(void)dealloc
{
    if (_data) {
        free(_data);
        _data = nil;
    }
}

@end

@interface ZWStreamPlayer()

@property (nonatomic, strong) ZWStreamView* view;
@property (nonatomic, strong) ZWHardDecoder* decoder;
@property (nonatomic, strong) NSMutableArray<ZWFrameData*>* frameDataArray;
@property (nonatomic, strong) NSMutableArray<ZWFrameData*>* audioDataArray;
@property (nonatomic, strong) dispatch_queue_t queue;
@property (nonatomic, strong) dispatch_queue_t audioQueue;
@property (nonatomic, strong) dispatch_semaphore_t videoSem;
@property (nonatomic, strong) dispatch_semaphore_t audioSem;
@property (nonatomic, strong) dispatch_semaphore_t waitSem;
@property (nonatomic, assign) uint64_t lastTime;
@property (nonatomic, assign) uint64_t currentTime;
@property (nonatomic, assign) uint64_t timeBase;
@property (nonatomic, assign) int timeAdd;
@property (atomic, assign) int isStart;
@property (nonatomic, assign) size_t allLen;
@property (nonatomic, assign) int sampleRate;
@property (nonatomic, assign) bool isPlayAudio;

@property (nonatomic, assign) int isRender;

@end

@implementation ZWStreamPlayer
{
    void* _stream;
    int _channel;
    NSString* _playType;
    bool _skipFrames;
    char _message[1024];
    
    int _width;
    int _height;
}
-(instancetype)initWithUri:(NSString*)uri view:(ZWStreamView*)view delegate:(id<ZWStreamPlayerDelegate>)delegate sampleRate:(int)sampleRate enableAudio:(bool)enableAudio  withChannel:(int)channel withPlayType:(NSString*)playType
{
    self = [super init];
    if(self)
    {
        _uri = uri;
        _view = view;
        _isRender = 0;
        self.delegate = delegate;
        _decoder = [[ZWHardDecoder alloc] init];
        _queue = dispatch_queue_create([uri UTF8String], DISPATCH_QUEUE_SERIAL);
        _audioQueue = dispatch_queue_create("audio", DISPATCH_QUEUE_SERIAL);
        _frameDataArray = [[NSMutableArray alloc] init];
        _audioDataArray = [[NSMutableArray alloc] init];
        _videoSem = dispatch_semaphore_create(1);
        _audioSem = dispatch_semaphore_create(1);
        _waitSem = dispatch_semaphore_create(0);
        _isStart = 1;
        _sampleRate = sampleRate;
        _isPlayAudio = enableAudio;
        _channel = channel;
        _playType = playType;
        _skipFrames = ![_playType isEqual:@"PlayBack"];
        bool bret = [self startTask:uri];
        if (!bret) {
            return nil;
        }
        [self timeLoop];
    }
    return self;
}

-(void)dealloc
{
    logd("destroy stream player.");
}

-(void)playAudio
{
    _isPlayAudio = true;
}

-(void)closeAudio
{
    _isPlayAudio = false;
}-(void)close
{
    logd("close - stopServer");
    if (_stream) {
        void* freestream = _stream;
        _stream = nil;
        stopServer(freestream);
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            while(freestream && checkServerRunning(freestream)) {
                usleep(1000*100);
                freeServer(&freestream);
            }
        });
    }
    dispatch_semaphore_wait(_videoSem, DISPATCH_TIME_FOREVER);
    dispatch_semaphore_wait(_audioSem, DISPATCH_TIME_FOREVER);
    self.isStart = 0;
    dispatch_semaphore_signal(_videoSem);
    dispatch_semaphore_signal(_audioSem);
    dispatch_sync(_queue, ^{});
    dispatch_sync(_audioQueue, ^{});
    if(self.delegate)
    {
        [self.delegate onState:4];
    }
}
-(void)sendMessage:(NSString*)message
{
    logd("----testplay-send message(%d):%s",message.length, message.UTF8String);
    if (_stream&&checkServerRunning(_stream)) {
//        NSData* data = [ZWRtp808Frame encodeMessage:message];
        sendRtpMessage(_stream, message.UTF8String, (int)message.length);
        cleanBuffer(_stream);
        [self clearFrameData];
    } else {
        loge("error sendMessage");
    }
}

-(bool)startTask:(NSString*)uri
{
    logd("ZWStreamPlayer::startTask - start(%s)",uri?uri.UTF8String:"");
    do {
        if (!uri) {
            break;
        }
        _stream = initServer(uri.UTF8String, _channel, OnDataBlockFunc, (__bridge void *)(self));
        if (!_stream) {
            break;
        }
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            bool bret = runServer(_stream);
            if(!bret)
            {
                logd("startTask - stopServer");
                if(self.delegate)
                {
                    [self.delegate onState:1];
                }
                stopServer(_stream);
                return;
            }
            if(self.delegate)
            {
                [self.delegate onState:0];
            }
            while(_stream&&checkServerRunning(_stream)) {
                //                logd("Heartbeat");
                usleep(5000000);
                sendHeartbeat(_stream);
            }
            logd("Heartbeat - over;_stream=%p;running=%d",_stream,checkServerRunning(_stream));
            if(self.delegate)
            {
                [self.delegate onState:2];
            }
        });
        return true;
    } while (false);
    loge("fail url:%s",uri?uri.UTF8String:"null");
//    if(self.delegate)
//    {
//        [self.delegate onState:1];
//    }
    return false;
}
-(void)timeLoop
{
    __weak ZWStreamPlayer* weakSelf = self;
    dispatch_async(_queue, ^{
        __strong ZWStreamPlayer* player = weakSelf;
        while(player.isStart)
        {
            dispatch_semaphore_wait(player.videoSem, DISPATCH_TIME_FOREVER);
            if(player.frameDataArray.count>0)
            {
                ZWFrameData* frameData = player.frameDataArray.firstObject;
                if(frameData)
                {
                    dispatch_semaphore_signal(player.videoSem);
                    uint64_t time = (uint64_t) ([[NSProcessInfo processInfo] systemUptime] * 1000000);
                    if (frameData.startTime>time) {
                        int64_t sleepTime = frameData.startTime - time;
                        if(sleepTime > 0)
                        {
                            usleep((uint32_t)sleepTime);
                        }
                    }
                    // NSLog(@"play video data");
                    CVPixelBufferRef pixelBuffer = [player.decoder decode:frameData.data
                                                                      len:frameData.trueLen
                                                                frameType:frameData.type];
                    if(pixelBuffer)
                    {
                        [player.view draw:pixelBuffer];
                        if(self.delegate)
                        {
                            int width = (int)CVPixelBufferGetWidth(pixelBuffer);
                            int height = (int)CVPixelBufferGetHeight(pixelBuffer);
                            if (_width!=width||_height!=height) {
                                _width = width;
                                _height=height;
                                [self.delegate onVideoSize:_height height:_height];
                                logd("onVideoSize:%d-%d",_width,_height);
                            }
                        }
                        CFRelease(pixelBuffer);
                        if(!player.isRender)
                        {
                            player.isRender = 1;
                            if(player.delegate)
                            {
                                [player.delegate onState:3];
                            }
                        }
                    }
                    dispatch_semaphore_wait(player.videoSem, DISPATCH_TIME_FOREVER);
                    if (player.frameDataArray.count>0) {
                        
                        [player.frameDataArray removeObjectAtIndex:0];
                        player.allLen -= frameData.trueLen;
                    }
                }
                
            }
            else
            {
                dispatch_semaphore_wait(player.waitSem, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_MSEC));
            }
            dispatch_semaphore_signal(player.videoSem);
        }
        player = nil;
    });
    
    dispatch_async(_audioQueue, ^{
        __strong ZWStreamPlayer* player = weakSelf;
        ZWAudioUnit *audioUnit = [[ZWAudioUnit alloc] initAudioUnit:player.sampleRate];
        while (player.isStart) {
            @autoreleasepool {
                dispatch_semaphore_wait(player.audioSem, DISPATCH_TIME_FOREVER);
                if (player.audioDataArray.count) {
                    ZWFrameData* frameData = player.audioDataArray.firstObject;
                    if (frameData == nil)
                    {
                        continue;
                    }
                    uint8_t *data = frameData.data + 26;
                    // NSLog(@"play audio data");
                    [audioUnit play:data dataLen:frameData.trueLen audioFormat:frameData.type];
                    [player.audioDataArray removeObjectAtIndex:0];
                    dispatch_semaphore_signal(player.audioSem);
                    continue;
                }
                dispatch_semaphore_wait(player.waitSem, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_MSEC));
                dispatch_semaphore_signal(player.audioSem);
            }
        }
        [audioUnit stop];
        [audioUnit audio_release];
    });
}

-(void)pushFrameData:(ZWFrameData*)frameData
{
    dispatch_semaphore_wait(_videoSem, DISPATCH_TIME_FOREVER);
    _allLen += frameData.trueLen;
    _currentTime = _allLen > 30000000 ? 0 : _currentTime;
    [_frameDataArray addObject:frameData];
    if(_frameDataArray.count > 20)
    {
        _timeAdd = 2;
    }
    else if (_frameDataArray.count < 10)
    {
        _timeAdd = 0;
    }
    frameData.startTime -= _timeAdd;
    dispatch_semaphore_signal(_videoSem);
}
-(void)pushAudioData:(ZWFrameData*)frameData {
    dispatch_semaphore_wait(_audioSem, DISPATCH_TIME_FOREVER);
    [_audioDataArray addObject:frameData];
    dispatch_semaphore_signal(_audioSem);
}
-(void)clearFrameData{
    {
        dispatch_semaphore_wait(_videoSem, DISPATCH_TIME_FOREVER);
        [_frameDataArray removeAllObjects];
        _allLen = 0;
        _timeBase=0;
        _currentTime=0;
        logd("clean frame data:%d",_allLen);
        dispatch_semaphore_signal(_videoSem);
    }
    {
        dispatch_semaphore_wait(_audioSem, DISPATCH_TIME_FOREVER);
        [_audioDataArray removeAllObjects];
        dispatch_semaphore_signal(_audioSem);
    }
}

-(int)saveData:(const uint8_t*)buffer len:(int)len time:(uint64_t)time
{
    //    logd("ZWStreamPlayer::saveData - start");
    int proDataLen = -1;
    const uint8_t* dataSource = buffer;
    int type = (dataSource[15] & 0xf0) >> 4;
    if(type == 0 || (type < 3 && _allLen < VIDEO_BUFFER_MAX))
    {
        if (_allLen>VIDEO_BUFFER_MAX) {
            if (_skipFrames) {
                [self clearFrameData];
            } else {
                logd("VIDEO_BUFFER_MAX=%d,_allLen=%d",VIDEO_BUFFER_MAX,_allLen);
                return 0;
            }
        }
        int frameHeadLen = 30;
        uint64_t currentTime = ntohll(*((uint64_t*)(dataSource + 16)));
        uint16_t duration = ntohs(*((uint16_t*)(dataSource + 26)));
        duration = (uint16_t) (_currentTime == 0 ? 0 : (duration > 0 ? duration : currentTime - _currentTime));
        _currentTime = currentTime;
        duration = (uint16_t) ((duration > 0 && duration < 500) ? duration : 40);
        int offset = 0;
        int trueLen = 0;
        int rtpLen = 0;
        //        logd("saveData - malloc");
        uint8_t* videoData = (uint8_t*)malloc(len);
        if (!videoData) {
            loge("ZWStreamPlayer saveData MALLOC ERROR! length=%d",len);
            return 1;
        }
        while(rtpLen <= 950 && offset < len)
        {
            rtpLen = ntohs(*((uint16_t*)(dataSource + offset + 28)));
            if (rtpLen+offset+frameHeadLen>len) {
                loge("rtp frame length error:rtpLen=%d,offset=%d,frameHeadLen=%d,len=%d",rtpLen,offset,frameHeadLen,len);
                break;
            }
            memcpy(videoData+trueLen, dataSource + offset + frameHeadLen, rtpLen);
            trueLen += rtpLen;
            offset += rtpLen + frameHeadLen;
        }
        proDataLen = 1;
        if(trueLen>0&&trueLen<len)
        {
            ZWFrameData* saveData = [[ZWFrameData alloc] init];
            saveData.data = videoData;
            saveData.trueLen = (uint32_t) trueLen;
            saveData.type = type;
            saveData.duration = (uint32_t) (duration * 1000);
            _timeBase = _timeBase == 0 ? time : _timeBase;
            saveData.startTime = _timeBase;
            _timeBase += saveData.duration;
            [self pushFrameData:saveData];
        } else {
            free(videoData);
            loge("rtp frame length error:trueLen=%d, len=%d",trueLen, len);
        }
    } else if (type == 3) {
        if (!_isPlayAudio) {
            return 1;
        }
//        logd("saveData - malloc audio");
        uint8_t* audioData = (uint8_t*)malloc(len);
        if (!audioData) {
            loge("ZWStreamPlayer saveData audio MALLOC ERROR!%d",len);
            return 1;
        }
        memcpy(audioData, dataSource, len);
        uint8_t payloadType = (uint8_t) (*(dataSource + 5) & PAYLOAD_TYPE_MASK);
        ZWFrameData* saveData = [[ZWFrameData alloc] init];
        saveData.data = audioData;
        saveData.type = payloadType;
        saveData.trueLen = ntohs(*((uint16_t*)(audioData + 24)));
        saveData.startTime = time;
        proDataLen = len;
        [self pushAudioData:saveData];
    } else if (type == 4) {
        if(self.delegate)
        {
            memset(_message, 0, 1024);
            memcpy(_message, dataSource+sizeof(struct Rtp808HeadBaseT), len - sizeof(struct Rtp808HeadBaseT));
            NSString* strMessage = [NSString stringWithUTF8String:_message];
            [self.delegate onMessage:strMessage];
        }
        proDataLen = 1;
    } else {
        proDataLen = 1;
    }
    return 1;
}

@end

int OnDataBlockFunc(const uint8_t* buffer, int bufferLength, void* data){
    uint64_t time = (uint64_t) ([[NSProcessInfo processInfo] systemUptime] * 1000000);
    if (data) {
        ZWStreamPlayer* pPlayer = (__bridge ZWStreamPlayer*)data;
        int iret = [pPlayer saveData:buffer len:bufferLength time:time];
        return iret;
    }
    return 1;
}
