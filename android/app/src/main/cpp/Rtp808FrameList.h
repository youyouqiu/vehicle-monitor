//
// Created by qwe on 2020/6/10.
//

#ifndef ANDROIDDEMO_RTP808FRAMELIST_H
#define ANDROIDDEMO_RTP808FRAMELIST_H

#include "CommonPublic.h"
#include "Rtp808Frame.h"

class Rtp808FrameList {
private:
    std::list<std::shared_ptr<Rtp808Frame>> _vFrames;
    std::list<std::shared_ptr<Rtp808Frame>> _aFrames;
    std::mutex _vMutex;
    std::mutex _aMutex;
    std::condition_variable _vCondition;
    std::condition_variable _aCondition;

    uint64_t _lastTime = 0;             // rtp时间戳，毫秒
    uint64_t _timeBase = 0;             // 解码播放时间，微秒

    bool _autoLostFrame = false;        // 自动丢帧
    int _maxFrames = 50;               // 自动丢帧时允许的最大缓存帧数(video)

    void lostFrames();
public:
    int parseFrames(const uint8_t* data, int length);

    std::shared_ptr<Rtp808Frame> videoFrame();
    std::shared_ptr<Rtp808Frame> audioFrame();

    void releaseLock();

    inline bool autoLostFrame(){return _autoLostFrame;};
    inline void autoLostFrame(bool v){_autoLostFrame=v;};

    inline int maxFrames(){return _maxFrames;}
    inline void maxFrames(int v){_maxFrames=v;}
};


#endif //ANDROIDDEMO_RTP808FRAMELIST_H
