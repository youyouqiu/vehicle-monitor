//
// Created by Administrator on 2018/8/14.
//

#include "ZWStreamPlayer.h"
#include "ZWHardDecoder.h"
#include "ZWStreamGLView.h"
#include "Rtp808Frame.h"

#define logd(...) LogMessageA(0, _task.key.c_str(), _task.channel, __VA_ARGS__)
#define logi(...) LogMessageA(1, _task.key.c_str(), _task.channel, __VA_ARGS__)
#define logw(...) LogMessageA(2, _task.key.c_str(), _task.channel, __VA_ARGS__)
#define loge(...) LogMessageA(3, _task.key.c_str(), _task.channel, __VA_ARGS__)

ZWStreamPlayer::ZWStreamPlayer(int sampleRate, int sampleBufSize, bool enableAudio)
        : _channel(0), _sampleRate(sampleRate),
          _sampleBufSize(sampleBufSize), _enableAudio(enableAudio) {

#if ENABLE_RTPFRAME_LIST
    _lstFrames = std::make_shared<Rtp808FrameList>();
//        _lstFrames->autoLostFrame(true);
#endif
}

ZWStreamPlayer::~ZWStreamPlayer()
{
    stop();
    delete _webSocketStateDelegate;
}

void ZWStreamPlayer::pushFrameData(std::shared_ptr<ZWFrameData> frameData) {
    if(_frameDataList.size() > 19)
    {
        frameData -> startTime -= 2;
    }
    {
        std::lock_guard<std::mutex> lock(_mutex);
        _allLen += frameData -> dataLen;
        _frameDataList.push_back(frameData);
//        logd("pushFrameData");
    }
    _condition.notify_one();
}

void ZWStreamPlayer::pushAudioData(std::shared_ptr<ZWFrameData> frameData) {
    {
        std::unique_lock<std::mutex> lock(_audioMutex);
        _audioDataList.push_back(frameData);
    }
    _audioCondition.notify_one();
}
void ZWStreamPlayer::clearFrameData() {
    {
        std::lock_guard<std::mutex> lock(_mutex);
        _allLen = 0;
        _timeBase = 0;
        _currentTime = 0;
        _frameDataList.clear();
        logi("clearFrameData _allLen=%d",_allLen);
    }
    {
        std::lock_guard<std::mutex> lock(_audioMutex);
        _audioDataList.clear();
    }
}

int ZWStreamPlayer::saveData(const uint8_t* buffer, int bufferLengh, uint64_t time)
{
    if (_logReadFlag > 150)
    {
//        logd("ZWStreamPlayer::saveData %s-%d data : %d, _allLen=%d,list=%d", _task.key.c_str(),_channel, bufferLengh,_allLen,_frameDataList.size());
        if (!_audioMessage.empty()){
            loge("%s",_audioMessage.c_str());
        }
        _logReadFlag=0;
    }
    else
    {
        _logReadFlag++;
    }

    const uint8_t* dataSource = buffer;
    uint8_t bitData = ((uint8_t)(dataSource[15] & 0xf0u));
    int packageNumber = (dataSource[6]<<8 | dataSource[7]);
//    logd(" package number=%d",packageNumber);
    int type =  bitData >> 4u; // data type: 0 video I frame; 1 video P frame; 2 video B frame; 3 audio frame
//        if(((_currentTime != 0 && type < 3) || type == 0) && ((_currentTime == 0 && _allLen < 10000000) || (_currentTime != 0 && _allLen < 30000000))) {
    if(type == 0 || (_allLen < VIDEO_BUFFER_MAX && type < 3)) {
//        return 1;
        // 关键帧 或 缓存足够时
        if (_allLen>=VIDEO_BUFFER_MAX){
            if(_skipFrames){
                clearFrameData();
            } else {
                // 阻塞
//                logd("_skipFrames=%d",_skipFrames);
                return 0;
            }
        }
        _showLoop = false;
        int frameHeadLen = 30;
        uint64_t currentTime = htonq(*((uint64_t *) (dataSource + 16)));
        uint16_t duration = ntohs(*((uint16_t *) (dataSource + 26)));
        duration = static_cast<uint16_t>(_currentTime == 0 ? 0 : (duration > 0 ? duration : currentTime - _currentTime));
        _currentTime = currentTime;
        duration = static_cast<uint16_t>((duration > 0 && duration < 500) ? duration : 40);


        auto videoData = (uint8_t*)malloc(bufferLengh);
        if (!videoData){
            loge("ZWStreamPlayer::saveData MALLOC ERROR！%d", bufferLengh);
            return 1;
        }
//        std::vector<uint8_t> videoData;
//        videoData.resize(bufferLengh);
        int offset = 0;
        int videoDataLen = 0;
        while(bufferLengh - offset>0)
        {
            if (bufferLengh - offset < frameHeadLen)
            {
                logd("bufferLengh - offset=%d,frameHeadLen=%d",bufferLengh - offset,frameHeadLen);
                break;
            }
            int rtpVideoDataLen = ntohs(*((uint16_t *) (dataSource + offset + 28)));
            if (bufferLengh - offset - frameHeadLen < rtpVideoDataLen)
            {
                logd("bufferLengh - offset - frameHeadLen=%d,rtpVideoDataLen=%d",bufferLengh - offset - frameHeadLen,rtpVideoDataLen);
                break;
            }
            memcpy(videoData+videoDataLen, dataSource+offset+frameHeadLen, rtpVideoDataLen);
            videoDataLen+=rtpVideoDataLen;
            offset+=frameHeadLen+rtpVideoDataLen;
        }
//        offset = 0;
        if(offset>0){
//            logd("offset>0");
            std::shared_ptr<ZWFrameData> saveData = std::make_shared<ZWFrameData>();
            saveData->data = videoData;
            saveData->dataLen = videoDataLen;
            saveData->type = type;
            saveData->duration = static_cast<uint32_t>(duration * 1000);
            _timeBase = _timeBase == 0 ? time : _timeBase;
            saveData->startTime = _timeBase;
            _timeBase += saveData->duration;
            pushFrameData((saveData));
        } else {
            free(videoData);
        }
    } else if(type == 3) {
//        logd("ZWStreamPlayer::saveData: _enableAudio=%d, ",_enableAudio);
//        _enableAudio = false;
        if (!_enableAudio)
            return 1;
        int frameHeadLen = 26;
//        std::vector<uint8_t> audioData;
        auto audioData = (uint8_t*)malloc(bufferLengh);
        if (!audioData){
            loge("ZWStreamPlayer::saveData audio MALLOC ERROR！%d", bufferLengh);
            return 1;
        }
        int offset = 0;
        int audioDataLength = 0;
        while(true)
        {
            if (bufferLengh - offset < frameHeadLen)
            {
                break;
            }
            int rtpDataLen = ntohs(*((uint16_t *) (dataSource + offset + 24)));
            if (bufferLengh - offset - frameHeadLen < rtpDataLen)
            {
                break;
            }
            memcpy(audioData, dataSource+offset+frameHeadLen, rtpDataLen);

            offset+=frameHeadLen+rtpDataLen;
            audioDataLength+=rtpDataLen;
//            logd("one audio frame:%d",frameHeadLen+rtpDataLen);
        }
//        offset = 0;
        if (offset>0){
            uint8_t payloadType = *(dataSource + 5) & PAYLOAD_TYPE_MASK;
            std::shared_ptr<ZWFrameData> saveData = std::make_shared<ZWFrameData>();
            saveData->data = audioData;
            saveData->dataLen = audioDataLength;
            saveData->payloadType = payloadType;
            saveData->startTime = time;
            pushAudioData((saveData));
        } else {
            free(audioData);
        }
    } else if(EDataType::TFRAME == type){
        std::string message(bufferLengh+1,'\0');
        if (buffer[5] == 0xf0){
            logd("error message");
        } else {
            memcpy(message.data(), buffer+sizeof(Rtp808HeadBaseT), bufferLengh-sizeof(Rtp808HeadBaseT));
            logd("onMessage:%s,packageNumber=%d",message.c_str(),packageNumber);
            _webSocketStateDelegate->onMessage(message);
        }
    } else {
        if(_skipFrames){
            _showLoop = true;
            logd("ZWStreamPlayer::startTimeLoop %s-%d, _allLen=%d,list=%d,type=%d", _task.key.c_str(),_channel, _allLen,_frameDataList.size(),type);
        }
//        logd("ZWStreamPlayer::saveData  %s-%d, unknow type:%d,_currentTime:%lld,_allLen:%d, _frameDataList:%d", _task.key.c_str(),_channel, type,_currentTime,_allLen,_frameDataList.size());
    }
    return 1;
}

void ZWStreamPlayer::initTaskInfo(TaskInfoPar& task, const std::string& uri)
{
    logd(("initTaskInfo _cacheDir="+_cacheDir).c_str());
    // "ws://58.87.111.217:7971/4ae969bb-b90f-4a65-9d6a-99dd85a5367f"
    task.ip = "";
    task.port = 0;
    task.key = "";
    task.channel = _channel;
    task.cacheDir = _cacheDir;
    do
    {
        std::string strPip = "ws://";
        std::string strPport = ":";
        std::string strPkey = "/";
        auto pip = uri.find(strPip);
        if (pip == std::string::npos)
        {
            break;
        }
        auto pport = uri.find(strPport, pip+strPip.size());
        if (pport == std::string::npos)
        {
            break;
        }
        auto pkey = uri.find(strPkey, pport+strPport.size());
        if (pkey == std::string::npos)
        {
            break;
        }
        task.ip = uri.substr(pip+strPip.size(),pport-pip-strPip.size());
        task.port = atoi(uri.substr(pport+strPport.size(),pkey-pport-strPport.size()).c_str());
        task.key = uri.substr(pkey+strPkey.size());
    }while(false);
    logd("initTaskInfo:ip=%s,port=%d,key=%s,channel=%d",task.ip.c_str(),task.port,task.key.c_str(),task.channel);
}
void ZWStreamPlayer::startWebSocket(const char *uri)
{
    logd("startWebSocket:%s",uri);
    _websocketThread = std::make_unique<std::thread>([this, uri](){

        initTaskInfo(_task, uri);
//        _task.port = 8971;
        if(_isStart)
        {
//            _webSocketStateDelegate->onState(WebSocketStateDelegate::CONNECTED);
            _task.cb = [this](const uint8_t* buffer, int bufferLengh, void* data) {
//                return 1;
                uint64_t time = getCurrentTime();
                return saveData(buffer, bufferLengh, time);
            };
            if (_stream) {
                _stream->StopTask();
            }
            _stream = std::make_shared<MediaStreamServer>();
            auto bret = _stream->SetupTask(_task);
            auto retstate = bret?WebSocketStateDelegate::CONNECTED:WebSocketStateDelegate::ERROR;
            _webSocketStateDelegate->onState(retstate);
            if (bret) {
                int sendOffset = 5000000;
                int lastOffset = 0;
                int stepSleep = 100000;
                while(_stream->Running()) {
                    usleep(stepSleep);
                    lastOffset += stepSleep;
                    if (lastOffset>=sendOffset){
                        _stream->Send((const uint8_t*)"0", 1);
                        lastOffset = 0;
                    }
                }
                logd("startWebSocket - stream end");
            }
        }
        //close
        _webSocketStateDelegate->onState(WebSocketStateDelegate::CLOSED);
    });
}
void ZWStreamPlayer::startTimeLoop() {
    logd("startTimeLoop");
    startVideoThread();
    startAudioThread();
}

void ZWStreamPlayer::startVideoThread() {
    _renderThread = std::make_unique<std::thread>([this]() {
        pthread_setname_np(pthread_self(), "ZW-VideoRender");
        _videoWidth = 0;
        _videoHeight = 0;
#if DECODE_JAVA

#elif DECODE_2_SURFACE
        auto callback = [this](uint8_t *data, int width, int height, int type) {
            _webSocketStateDelegate->onState(WebSocketStateDelegate::VIDEO_OPEN);
            if (_videoWidth!=width || _videoHeight!=height)
            {
                logd("_videoWidth=%d,_videoHeight=%d,width=%d,height=%d",_videoWidth,_videoHeight,width,height);
                _videoWidth = width;
                _videoHeight = height;
                _webSocketStateDelegate->onVideoSize(_videoWidth, _videoHeight);
            }

        };
        std::shared_ptr<ZWHardDecoder> videoDecoder = std::make_shared<ZWHardDecoder>(callback, _nativeWindow);
#else
        std::shared_ptr<ZWStreamGLView> view(ZWStreamGLView::create(_nativeWindow, viewWidth, viewHeight));
        auto callback = [this, view](uint8_t *data, int width, int height, int type) {
            _webSocketStateDelegate->onState(WebSocketStateDelegate::VIDEO_OPEN);
            if (_videoWidth!=width || _videoHeight!=height)
            {
                logd("_videoWidth=%d,_videoHeight=%d,width=%d,height=%d",_videoWidth,_videoHeight,width,height);
                _videoWidth = width;
                _videoHeight = height;
                _webSocketStateDelegate->onVideoSize(_videoWidth, _videoHeight);
            }
            if (view) {
                view->setWindowsSize(_viewwidth, _viewheight);
                view->setProgram(type == 19 ? 2 : 1);
                view->draw(data, _videoWidth, _videoHeight);
            }
        };
        std::shared_ptr<ZWHardDecoder> videoDecoder = std::make_shared<ZWHardDecoder>(callback);
#endif
        std::chrono::seconds waitTime(2);
        while (_isStart) {
            usleep(1);
            {
                if (_showLoop){
                    logd("ZWStreamPlayer::startTimeLoop %s-%d, _allLen=%d,list=%d", _task.key.c_str(),_channel, _allLen,_frameDataList.size());
                }

                std::unique_lock<std::mutex> lock(_mutex);
                if (_frameDataList.empty()) {
                    _condition.wait_for(lock, waitTime);
                    continue;
                }

                auto frameData = _frameDataList.front();
                _frameDataList.pop_front();
                _allLen -= frameData->dataLen;
                lock.unlock();

                uint64_t time = getCurrentTime();
                if(frameData->startTime>time){
                    int64_t sleepTime = frameData->startTime - time;
                    if (sleepTime > 0) {
                        //logd("video thread sleep %lld;", sleepTime);
                        usleep((uint32_t) sleepTime);
                    }
                } else {
//                    int64_t sleepTime = time - frameData->startTime;
//                    logd("2video thread sleep %lld;", sleepTime);
                }

                // 解码缓存获取失败时，数据是否直接丢弃
#if DECODE_JAVA
//                logd("onVideoData");
                _webSocketStateDelegate->onVideoData((const char*)frameData->data, frameData->dataLen);
                _webSocketStateDelegate->onState(WebSocketStateDelegate::VIDEO_OPEN);
#else
                videoDecoder->decodeData(frameData->data, frameData->dataLen);
#endif
            }
        }
    });
}

void ZWStreamPlayer::startAudioThread() {
    _audioThread = std::make_unique<std::thread>([this]() {
        pthread_setname_np(pthread_self(), "ZW-AudioRender");
        std::chrono::seconds waitTime(3);
        audioPlayer = std::make_shared<ZWAudioPlayer>(_sampleRate, _sampleBufSize);
        if (_enableAudio) {
            audioPlayer->play();
        }
        while (_isStart) {
            usleep(1);
            {
                std::unique_lock<std::mutex> audioLock(_audioMutex);
                if (_audioDataList.empty()) {
                    _audioCondition.wait_for(audioLock, waitTime);
                    continue;
                }
                auto frameData = (_audioDataList.front());
                _audioDataList.pop_front();
                audioLock.unlock();

                uint64_t time = getCurrentTime();
                int64_t sleepTime = frameData->startTime - time;
                if (sleepTime > 0) {
                    usleep((uint32_t) sleepTime);
                }

                if (_enableAudio) {
                    // RTP Header's size for audio is 26 bytes, and pcm header's size is 8 bytes
                    std::string message;
                    auto audioRet = audioPlayer->store(frameData->payloadType, frameData->data, static_cast<int>(frameData->dataLen), message);
//                    auto audioRet = audioPlayer->store(frameData->payloadType, frameData->data + 26, static_cast<int>(frameData->dataLen - 26), message);
                    if (!audioRet){
                        _audioMessage = message;
                    } else {
                        _audioMessage = "";
                    }
                }
            }
        }
        audioPlayer = nullptr;
    });
}

void ZWStreamPlayer::play(const char* uri) {
    if (_isStart){
        logd("Already playing!");
        return;
    }
    _isStart = true;
    if(_playType == "PlayBack") {
        _skipFrames=false;
    }
    logi("play %s", _playType.c_str());
    startWebSocket(uri);
    startTimeLoop();
}

void ZWStreamPlayer::playAudio() {
    if (!_isStart) {
        return;
    }
    if (audioPlayer == nullptr) {
        return;
    }
    audioPlayer->play();
    _enableAudio= true;
}

void ZWStreamPlayer::stopAudio() {
    if (!_isStart && audioPlayer != nullptr) {
        return;
    }
    _enableAudio = false;
    _audioCondition.notify_one();
    if (audioPlayer == nullptr) {
        return;
    }
    audioPlayer->stop();
}
void ZWStreamPlayer::sendMessage(const std::string& msg){
    if(_stream && _stream->Running())
    {
        logi("ZWStreamPlayer - sendMessage:%s",msg.c_str());
//        auto ptr = Rtp808Frame::encodeMessage(msg, size);
        _stream->Send((const uint8_t*)msg.data(),msg.size());
        _stream->Clean();
        clearFrameData();
    }
}

void ZWStreamPlayer::stop() {
    logi("ZWStreamPlayer - stop.");
    {
        std::unique_lock<std::mutex> lock(_mutex);
        if (!_isStart) {
            _webSocketStateDelegate->onState(WebSocketStateDelegate::VIDEO_CLOSED);
            logw("ZWStreamPlayer - stop: 未开始播放 .");
            return;
        }

        if(_stream && _stream->Running())
        {
            _stream->StopTask();
        }
        _isStart = false;
    }
    logi("ZWStreamPlayer - play stop wait.");
    _condition.notify_one();
    _audioCondition.notify_one();
    _renderThread->join();
    _audioThread->join();
    _websocketThread->join();

    logi("ZWStreamPlayer - play stop state.");
    _webSocketStateDelegate->onState(WebSocketStateDelegate::VIDEO_CLOSED);
}
