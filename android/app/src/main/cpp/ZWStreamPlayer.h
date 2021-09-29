//
// Created by Administrator on 2018/8/14.
//

#ifndef ZWSTREAMPLAYER_H
#define ZWSTREAMPLAYER_H

#include "CommonPublic.h"
#include "WebSocketStateDelegate.h"
#include "ZWAudioPlayer.h"
#include "MediaStreamServer.h"

#define DECODE_2_SURFACE 1
#define DECODE_JAVA 1

#define ENABLE_RTPFRAME_LIST 0

#define VIDEO_BUFFER_MAX 15*1000*1000

struct ZWFrameData
{
    uint8_t* data;
    int dataLen;
    int type;
    uint8_t payloadType;
    uint32_t duration;
    uint64_t startTime;

    bool allocData(int size){
        if (size>0){
            data = (uint8_t*)malloc(size);
        }
        return data;
    }
    ~ZWFrameData(){
        if(data){free(data);data=0;}
    };
};

class ZWStreamPlayer
{
public:
    ZWStreamPlayer(int sampleRate, int sampleBufSize,
                   bool enableAudio);
    ~ZWStreamPlayer();

    void play(const char* uri);
    void stop();
    void playAudio();
    void stopAudio();
    void sendMessage(const std::string& msg);

    void channel(int v){_channel=v;}
    void playType(const std::string& v){
        _playType = v;
    }


    inline void setWebSocketStateDelegate(WebSocketStateDelegate* delegate) {
        _webSocketStateDelegate = delegate;
    }

    inline WebSocketStateDelegate* getWebSocketStateDelegate() {
        return _webSocketStateDelegate;
    }

    void cacheDir(const std::string& v){_cacheDir=v;}
private:
    std::mutex _mutex;                              // 视频锁
    std::condition_variable _condition;

    std::mutex _audioMutex;                         // 音频锁
    std::condition_variable _audioCondition;

    std::string _cacheDir;

    int _channel;
    TaskInfoPar _task;
    std::shared_ptr<MediaStreamServer> _stream;
#if ENABLE_RTPFRAME_LIST
    std::shared_ptr<Rtp808FrameList> _lstFrames;
#endif

    int _logReadFlag=0;
    bool _showLoop = false;

    std::string _audioMessage;
    uint64_t _lastTime = 0;
    uint64_t _currentTime = 0;
    uint64_t _timeBase = 0;
    size_t _allLen = 0;
    std::string _playType = "";
    bool _skipFrames = true;
    volatile std::atomic_bool _isStart = ATOMIC_VAR_INIT(false);

    static const uint8_t PAYLOAD_TYPE_MASK = (1 << 7) - 1;
    static const int AUDIO_SAMPLE_RATE_8K = 8000;
    static const int AUDIO_BUFFER_SIZE = 10240;
    static const int RTP_MAX_SIZE = 950;

    int _videoWidth = 0;
    int _videoHeight = 0;
    int _sampleRate = AUDIO_SAMPLE_RATE_8K;
    int _sampleBufSize = AUDIO_BUFFER_SIZE;
    bool _enableAudio = false;

    std::unique_ptr<std::thread> _websocketThread;
    std::unique_ptr<std::thread> _renderThread;
    std::unique_ptr<std::thread> _audioThread;


    std::list<std::shared_ptr<ZWFrameData>> _frameDataList;
    std::list<std::shared_ptr<ZWFrameData>> _audioDataList;

    std::shared_ptr<ZWAudioPlayer>  audioPlayer = nullptr;
    WebSocketStateDelegate* _webSocketStateDelegate = nullptr;

    void clearFrameData();
    void pushFrameData(std::shared_ptr<ZWFrameData> frameData);
    void pushAudioData(std::shared_ptr<ZWFrameData> frameData);
    int saveData(const uint8_t* buffer, int bufferLengh, uint64_t time);
    void initTaskInfo(TaskInfoPar& task, const std::string& uri);
    void startWebSocket(const char *uri);
    void startTimeLoop();

    void startAudioThread();

    void startVideoThread();

};

#endif
