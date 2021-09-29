//
// Created by Administrator on 2018/8/15.
//

#ifndef ZWZWHardDecoderR_H
#define ZWZWHardDecoderR_H

#include "CommonPublic.h"

#define ENABLE_VIDEO 1

class ZWHardDecoder
{
public:
    typedef std::function<void(uint8_t*, int, int, int)> Callback;

    int decodeData(uint8_t* data, size_t len);

    ZWHardDecoder(Callback callback): _callback(callback) {}
    ZWHardDecoder(Callback callback, ANativeWindow* surface): _renderSurface(surface),  _callback(callback) {}
    
    ~ZWHardDecoder() {
        if(_isStart) {
            stop();
        }
    }
    
private:
    ANativeWindow* _renderSurface;
    AMediaCodec* _decode = nullptr;
    uint32_t _width = 0;
    uint32_t _height = 0;
    bool _isStart = false;
    
    const int _timeOutUs = 10*1000;
    
    bool _isSPS = false;
    bool _isPPS = false;
    std::vector<uint8_t> _sps;
    std::vector<uint8_t> _pps;

    bool _isInit = false;

    int32_t _decodeType = -1;
    Callback _callback;
    
    int start(std::vector<uint8_t> sps, std::vector<uint8_t> pps);

    void stop();
    
    int analysisVideoData(const uint8_t* data, size_t len);
    void setHardDecodeAttr(std::vector<uint8_t>& videoAttr, const uint8_t* attr, size_t len);
};

#endif
