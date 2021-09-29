#ifndef ZWAudioPlayer_H_
#define ZWAudioPlayer_H_

#include "CommonPublic.h"
#include "AdpcmCoder.h"
#include "G726Coder.h"
#include "buf_manager.h"

#define AUDIO_SAMPLE_CHANNELS 1
#define PLAY_KICKSTART_BUFFER_COUNT 3
#define BUF_COUNT 16

#define SLASSERT(x)                   \
  do {                                \
    assert(SL_RESULT_SUCCESS == (x)); \
    (void)(x);                        \
  } while (0)

class ZWAudioPlayer
{
public:
    void bqPlayerCallback(SLAndroidSimpleBufferQueueItf bq);
    bool store(int format, uint8_t *data, int len, std::string& message);
    bool play();
    bool stop();

    ZWAudioPlayer(int sampleRate, int bufSize);
    ~ZWAudioPlayer();
private:
    const int PAYLOAD_TYPE_G721 = 1;
    const int PAYLOAD_TYPE_G711A = 6;
    const int PAYLOAD_TYPE_G711U = 7;
    const int PAYLOAD_TYPE_G726 = 8;
    const int PAYLOAD_TYPE_ADPCM = 26;
    const int PAYLOAD_TYPE_G726_16 = 29;         // 自定义负载类型说明 G726-16kbit
    const int PAYLOAD_TYPE_G726_24 = 30;         // 自定义负载类型说明 G726-24kbit
    const int PAYLOAD_TYPE_G726_32 = 31;         // 自定义负载类型说明 G726-32kbit
    const int PAYLOAD_TYPE_G726_40 = 32;         // 自定义负载类型说明 G726-40kbit

    volatile enum PlayerState {
        CREATED,
        PLAYING,
        STOPPED,
    };

    volatile PlayerState playerState = CREATED;
    bool isStarted = false;
    sample_buf silentBuf_{};
    sample_buf *_bufs = nullptr;
    AudioQueue *freeQueue = nullptr;
    AudioQueue *playQueue = nullptr;
    uint32_t _bufCount = 0;
    std::mutex _stopMutex;
    short *decodeBuffer = nullptr;
    adpcm_state *adpcmState = nullptr;
    g726_state_t *g726State = nullptr;
    bool _initg726 = false;
    int _bufferCount = 0;

    SLmilliHertz bqPlayerSampleRate = 0;
    uint32_t bqPlayerBufSize = 0;

    SLObjectItf _engineObjectItf = nullptr;
    SLEngineItf _engineEngineItf = nullptr;
    SLObjectItf _outputMixObjectItf = nullptr;
    SLObjectItf _playerObjectItf = nullptr;
    SLPlayItf _playItf = nullptr;
    SLAndroidSimpleBufferQueueItf _playBufferQueueItf = nullptr;
    void initCodecStateG726(int bitcount = 4);
    void createEngine();
    void createBufferQueueAudioPlayer(int sampleRate, int bufSize);
    void releaseDecodeBuffer();
    void initCodecState();
    void enqueueData(int len) const;
};

#endif
