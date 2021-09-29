
#include <cstdint>
#include "ZWAudioPlayer.h"
#include "G726Coder.h"
#include "G711Coder.h"

void SLPlayerCallback(SLAndroidSimpleBufferQueueItf bufferQueueItf, void *context) {
    (static_cast<ZWAudioPlayer *>(context))->bqPlayerCallback(bufferQueueItf);
}

ZWAudioPlayer::ZWAudioPlayer(int sampleRate, int bufSize) {
    createEngine();
    createBufferQueueAudioPlayer(sampleRate, bufSize);
}

void ZWAudioPlayer::createEngine() {
    SLresult result;

    // create engine
    result = slCreateEngine(&_engineObjectItf, 0, nullptr, 0, nullptr, nullptr);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;

    // realize the engine
    result = (*_engineObjectItf)->Realize(_engineObjectItf, SL_BOOLEAN_FALSE);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;

    // get the engine interface, which is needed in order to create other objects
    result = (*_engineObjectItf)->GetInterface(_engineObjectItf, SL_IID_ENGINE, &_engineEngineItf);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;

    // create output mix
    result = (*_engineEngineItf)->CreateOutputMix(_engineEngineItf, &_outputMixObjectItf, 0, nullptr, nullptr);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;

    // realize the output mix
    result = (*_outputMixObjectItf)->Realize(_outputMixObjectItf, SL_BOOLEAN_FALSE);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;
}

void ZWAudioPlayer::createBufferQueueAudioPlayer(int sampleRate, int framesPerBuf) {
    SLresult result;
    if (sampleRate >= 0 && framesPerBuf >= 0 ) {
        bqPlayerSampleRate = static_cast<SLmilliHertz>(sampleRate * 1000);
        /*
         * device native buffer size is another factor to minimize audio latency, not used in this
         * sample: we only play one giant buffer here
         */
        bqPlayerBufSize = static_cast<uint32_t>(framesPerBuf);
        _bufCount = BUF_COUNT;

        uint32_t bufSize = bqPlayerBufSize * AUDIO_SAMPLE_CHANNELS * SL_PCMSAMPLEFORMAT_FIXED_16;
        bufSize = (bufSize + 7) >> 3;  // bits --> byte
        _bufferCount = bufSize;
//        LOGD("----t createBufferQueueAudioPlayer bufSize=%d framesPerBuf=%d",(int)bufSize, framesPerBuf);
        _bufs = allocateSampleBufs(_bufCount, bufSize);
        freeQueue = new AudioQueue(_bufCount);
        playQueue = new AudioQueue(_bufCount);
        for (uint32_t i = 0; i < _bufCount; i++) {
            freeQueue->push(&_bufs[i]);
        }
        silentBuf_.cap_ = bufSize;
        silentBuf_.buf_ = new uint8_t[silentBuf_.cap_];
        memset(silentBuf_.buf_, 0, silentBuf_.cap_);
        silentBuf_.size_ = silentBuf_.cap_;
    }
    decodeBuffer = (short *) malloc(2048);
    initCodecState();

    // configure audio source
    SLDataLocator_AndroidSimpleBufferQueue loc_bufq = {SL_DATALOCATOR_ANDROIDSIMPLEBUFFERQUEUE, 4};
    SLDataFormat_PCM format_pcm = {
            SL_DATAFORMAT_PCM,
            1,
            bqPlayerSampleRate,
            SL_PCMSAMPLEFORMAT_FIXED_16,
            SL_PCMSAMPLEFORMAT_FIXED_16,
            SL_SPEAKER_FRONT_CENTER,
            SL_BYTEORDER_LITTLEENDIAN
    };
    /*
     * Enable Fast Audio when possible:  once we set the same rate to be the native, fast audio path
     * will be triggered
     */
    if(bqPlayerSampleRate) {
        format_pcm.samplesPerSec = bqPlayerSampleRate;       //sample rate in mili second
    }
    SLDataSource audioSrc = {&loc_bufq, &format_pcm};

    // configure audio sink
    SLDataLocator_OutputMix loc_outmix = {SL_DATALOCATOR_OUTPUTMIX, _outputMixObjectItf};
    SLDataSink audioSnk = {&loc_outmix, nullptr};

    /*
     * create audio player:
     *     fast audio does not support when SL_IID_EFFECTSEND is required, skip it
     *     for fast audio case
     */
    const SLInterfaceID ids[2] = {SL_IID_ANDROIDSIMPLEBUFFERQUEUE, SL_IID_VOLUME};
    const SLboolean req[2] = {SL_BOOLEAN_TRUE, SL_BOOLEAN_TRUE, /*SL_BOOLEAN_TRUE,*/ };

    result = (*_engineEngineItf)->CreateAudioPlayer(_engineEngineItf, &_playerObjectItf, &audioSrc, &audioSnk, 2, ids,
                                                    req);
    assert(SL_RESULT_SUCCESS == result);
    (void) result;

    // realize the player
    result = (*_playerObjectItf)->Realize(_playerObjectItf, SL_BOOLEAN_FALSE);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;

    // get the play interface
    result = (*_playerObjectItf)->GetInterface(_playerObjectItf, SL_IID_PLAY, &_playItf);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;

    // get the buffer queue interface
    result = (*_playerObjectItf)->GetInterface(_playerObjectItf, SL_IID_ANDROIDSIMPLEBUFFERQUEUE,
                                               &_playBufferQueueItf);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;

    // register callback on the buffer queue
    result = (*_playBufferQueueItf)->RegisterCallback(_playBufferQueueItf, SLPlayerCallback, this);
    assert(SL_RESULT_SUCCESS == result);
    (void)result;
    LOGI("ZWAudioPlayer - registered callback.");

    playerState = CREATED;
}

void ZWAudioPlayer::initCodecState() {
    adpcmState = static_cast<adpcm_state *>(malloc(sizeof(adpcm_state)));
    memset(adpcmState, 0, sizeof(adpcm_state));

    g726State = static_cast<g726_state_t *>(malloc(sizeof(g726_state_t)));
    memset(g726State, 0, sizeof(g726_state_t));
}
void ZWAudioPlayer::initCodecStateG726(int bitcount) {
    if (!_initg726){
        initG726State(bitcount, g726State);
        _initg726 = true;
    }
}


bool ZWAudioPlayer::store(int format, uint8_t *data, int len, std::string& message) {
    usleep(1000);
    if (playerState != CREATED && playerState != PLAYING) {
        message = "Error playerState!";
        return JNI_FALSE;
    }

//    if (data[0] === 0x00 && data[1] === 0x01 && data[3] === 0x00 && (data[2] & 0xff) === (data.length - 4) / 2) {
//        data = data.slice(4);
//    }

    uint8_t* pdata = data;
    int dataLen = len;


    if (pdata[0] == 0x00 && pdata[1] == 0x01 && pdata[3] == 0x00 && (pdata[2] & 0xff) == (dataLen - 4) / 2){
        pdata += 4;
        dataLen -= 4;
    }

    if (format == PAYLOAD_TYPE_ADPCM) {
        dataLen = (dataLen - 4);
//        dataLen = (dataLen - 4) << 1;
        adpcmState->valPrev = pdata[0] + (pdata[1] << 8);
        adpcmState->index = pdata[2];

        adpcm_decode((char *)(pdata + 4), decodeBuffer, dataLen, adpcmState);
    } else if (format == PAYLOAD_TYPE_G711A) {
        decodeG711a(decodeBuffer, pdata, dataLen);
    } else if (format == PAYLOAD_TYPE_G711U) {
        decodeG711u(decodeBuffer, pdata, dataLen);
    } else if (format == PAYLOAD_TYPE_G726) {
        initCodecStateG726();
        dataLen = decodeG726(pdata, dataLen, decodeBuffer, g726State);
    } else if (format == PAYLOAD_TYPE_G726_16) {
        initCodecStateG726(2);
        dataLen = decodeG726(pdata, dataLen, decodeBuffer, g726State);
    } else if (format == PAYLOAD_TYPE_G726_24) {
        initCodecStateG726(3);
        dataLen = decodeG726(pdata, dataLen, decodeBuffer, g726State);
    } else if (format == PAYLOAD_TYPE_G726_32) {
        initCodecStateG726(4);
        dataLen = decodeG726(pdata, dataLen, decodeBuffer, g726State);
    } else if (format == PAYLOAD_TYPE_G726_40) {
        initCodecStateG726(5);
        dataLen = decodeG726(pdata, dataLen, decodeBuffer, g726State);
    } else {
//        LOGE("Not supported audio format: %d", format);
        message = "Not supported audio format!";
        return JNI_FALSE;
    }
    enqueueData(dataLen);

//    return JNI_TRUE;

//    return JNI_TRUE;

    if (!isStarted) {
        if (playQueue->size() < PLAY_KICKSTART_BUFFER_COUNT) {
            //开始播放音频前准备音频数据
            return JNI_TRUE;
        }
        //将静音数据放入播放队列中，开始播放
        SLresult result = (*_playBufferQueueItf)->Enqueue(_playBufferQueueItf, silentBuf_.buf_, silentBuf_.size_);
        SLASSERT(result);
        isStarted = true;
    }
    return JNI_TRUE;
}

void ZWAudioPlayer::enqueueData(int len) const {
    sample_buf *buf = nullptr;
    if (!freeQueue->front(&buf)) {
        //LOGE("=====OutOfFreeBuffers @ store audio data");
        return;
    }
    freeQueue->pop();

    len = len << 1;
    if (_bufferCount<len){
        LOGE("音频单帧缓存不足，dataLen=%d, _bufferCount=%d", len, _bufferCount);
        return;
    }
    memcpy(buf->buf_, decodeBuffer, static_cast<size_t>(len));
    buf->size_ = static_cast<uint32_t>(len);
    playQueue->push(buf);
}

bool ZWAudioPlayer::play() {
    if (playerState != CREATED && playerState != STOPPED) {
        return JNI_FALSE;
    }
    SLuint32 state;

    if (_playItf == nullptr) {
        LOGE("ZWAudioPlayer - _playItf is null");
        return JNI_FALSE;
    }
    SLresult result = (*_playItf)->GetPlayState(_playItf, &state);
    SLASSERT(result);

    if (state == SL_PLAYSTATE_PLAYING) {
        return JNI_TRUE;
    }
    std::lock_guard<std::mutex> lock(_stopMutex);
    // set the player's state to playing
    result = (*_playItf)->SetPlayState(_playItf, SL_PLAYSTATE_PLAYING);
    SLASSERT(result);

    playerState = PLAYING;
    LOGI("ZWAudioPlayer - play audio.");
    return JNI_TRUE;
}

bool ZWAudioPlayer::stop() {
    if (playerState != PLAYING) {
        return JNI_FALSE;
    }
    SLuint32 state;

    SLresult result = (*_playItf)->GetPlayState(_playItf, &state);
    SLASSERT(result);

    if (state == SL_PLAYSTATE_STOPPED) {
        return JNI_TRUE;
    }
    std::lock_guard<std::mutex> lock(_stopMutex);
    result = (*_playItf)->SetPlayState(_playItf, SL_PLAYSTATE_STOPPED);
    SLASSERT(result);
    (*_playBufferQueueItf)->Clear(_playBufferQueueItf);

    playerState = STOPPED;
    isStarted = false;
    LOGI("ZWAudioPlayer - stop audio.");
    return JNI_TRUE;
}

// this callback handler is called every time a buffer finishes playing
void ZWAudioPlayer::bqPlayerCallback(SLAndroidSimpleBufferQueueItf bq)
{
    std::lock_guard<std::mutex> lock(_stopMutex);
    assert(bq == _playBufferQueueItf);
    sample_buf *buf = nullptr;
    if (!playQueue->front(&buf)) {
        // LOGE("ZWAudioPlayer - Empty playQueue.");
        isStarted = false;
        return;
    }

    (*bq)->Enqueue(bq, buf->buf_, buf->size_);
    if (buf != &silentBuf_) {
        buf->size_ = 0;
        freeQueue->push(buf);
    }
    playQueue->pop();

//    if (playQueue->size() < PLAY_KICKSTART_BUFFER_COUNT) {
//        playQueue->push(&silentBuf_);
//    }
}

void ZWAudioPlayer::releaseDecodeBuffer() {
    if (decodeBuffer != nullptr)
    {
        free(decodeBuffer);
        decodeBuffer = nullptr;
    }
}

ZWAudioPlayer::~ZWAudioPlayer() {
    std::lock_guard<std::mutex> lock(_stopMutex);
    // destroy buffer queue audio player object, and invalidate all associated interfaces
    if (_playerObjectItf != nullptr) {
        (*_playerObjectItf)->Destroy(_playerObjectItf);
        _playerObjectItf = nullptr;
        _playItf = nullptr;
        _playBufferQueueItf = nullptr;
        //bqPlayerVolume = NULL;
    }

    if (_outputMixObjectItf != nullptr) {
        (*_outputMixObjectItf)->Destroy(_outputMixObjectItf);
        _outputMixObjectItf = nullptr;
    }

    // destroy engine object, and invalidate all associated interfaces
    if (_engineObjectItf != nullptr) {
        (*_engineObjectItf)->Destroy(_engineObjectItf);
        _engineObjectItf = nullptr;
        _engineEngineItf = nullptr;
    }

    delete playQueue;
    delete freeQueue;
    releaseSampleBufs(_bufs, _bufCount);
    releaseDecodeBuffer();
    free(adpcmState);
    free(g726State);
    LOGI("ZWAudioPlayer - free player.");
}

