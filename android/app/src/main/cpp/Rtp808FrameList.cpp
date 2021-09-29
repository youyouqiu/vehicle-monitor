//
// Created by qwe on 2020/6/10.
//

#include "Rtp808FrameList.h"

// 解析RTP帧，返回大于等于0：已处理的数据长度，小于0：异常
int Rtp808FrameList::parseFrames(const uint8_t* data, int length)
{
    int offset = 0;
    while (true)
    {
        if (offset>=length)
        {
            break;
        }
        if(_vFrames.size()>_maxFrames)
        {
//            LOGW("video frames full");
            break;
        }
        std::shared_ptr<Rtp808Frame> frame = std::make_shared<Rtp808Frame>();
        int iret = frame->parse(data+offset, length-offset);
        if(iret>0)
        {
            if(frame->isVideo())
            {
                // duration 毫秒->微秒
                auto currentTime =frame->timestamp();
                auto duration = frame->duration();
                duration = static_cast<int>(_lastTime == 0 ? 0 : (duration > 0 ? duration : currentTime - _lastTime));
                _lastTime = currentTime;
                duration = static_cast<int>((duration > 0 && duration < 500) ? duration : 40);
                frame->duration(duration * 1000);

                // start time
                if (frame->packageType() == EPackageType::ATOMIC || frame->packageType() == EPackageType::PART_START)
                {
                    _timeBase = _timeBase == 0 ? getCurrentTime() : _timeBase;
                    frame->time(_timeBase);
                    _timeBase += frame->duration();
                }
                {
                    std::lock_guard<std::mutex> guard(_vMutex);
                    _vFrames.push_back(frame);
//                    LOGD("append video frame:%d.",_vFrames.size());
                    _vCondition.notify_one();
                }
            }
            else
            {
                std::lock_guard<std::mutex> guard(_aMutex);
                _aFrames.push_back(frame);
//                LOGD("append audio frame:%d.",_aFrames.size());
                _aCondition.notify_one();
            }
            offset+=iret;
        }
        else
        {
            if(iret < 0)
            {
                offset = -1;
            }
            break;
        }
    }

    if(_autoLostFrame)
    {
        lostFrames();
    }

    return offset;
}


void Rtp808FrameList::lostFrames()
{
    LOGD("Lost frames:vframes=%d", _vFrames.size());
    if(_vFrames.size()<_maxFrames)
        return;

    int originSizeV = _vFrames.size();
    int originSizeA = _aFrames.size();
    int lostSizeV = 0;
    int lostSizeA = 0;
    bool iFrameFound = false;

    uint64_t lastTime = 0;
    // find i frame
    {
        std::lock_guard<std::mutex> guard(_vMutex);
        while(_vFrames.size()>0)
        {
            auto frame = _vFrames.front();
            _vFrames.pop_front();
            lostSizeV++;

            lastTime = frame->timestamp();
            if(frame->dataType() == EDataType::IFRAME && (frame->packageType() == EPackageType::ATOMIC || frame->packageType() == EPackageType::PART_END))
            {
                iFrameFound = true;
                break;
            }
        }
    }
    // lost audio frame
    {
        std::lock_guard<std::mutex> guard(_aMutex);
        while (_aFrames.size()>0)
        {
            auto frame = _aFrames.front();
            auto frameTime = frame->timestamp();
            if(frameTime > lastTime)
            {
                break;
            }

            _aFrames.pop_front();
            lostSizeA++;
        }
    }

    LOGW("Lost frames:origin count=v-%d a-%d, lost count=v-%d a-%d, iframe found=%d", originSizeV, originSizeA, lostSizeV, lostSizeA, iFrameFound);
}




std::shared_ptr<Rtp808Frame> Rtp808FrameList::videoFrame()
{
    std::unique_lock<std::mutex> uniquelock(_vMutex);
    int frameCount = 0; // 一帧视频帧包含的RTP帧数量
    bool hasFrame = false;
//    LOGD("Rtp808FrameList::videoFrame 1, hasFrame=%d", hasFrame);
    for (auto iter = _vFrames.begin(); iter != _vFrames.end() ; ++iter) {
        frameCount++;

        if((*iter)->packageType() == EPackageType::ATOMIC || (*iter)->packageType() == EPackageType::PART_END)
        {
            hasFrame = true;
            break;
        }
    }
    if(hasFrame)
    {
        if (frameCount>0)
        {

            std::vector<std::shared_ptr<Rtp808Frame>> lstSeconds;
            std::shared_ptr<Rtp808Frame> result = _vFrames.front();
            _vFrames.pop_front();
            if(frameCount>1)
            {
                for (int i = 1; i < frameCount; ++i) {
                    auto oneFrame = _vFrames.front();
                    _vFrames.pop_front();
                    lstSeconds.push_back(oneFrame);
                }
            }
            LOGD("use video frame:%d.",_vFrames.size());
            uniquelock.unlock();


            if(lstSeconds.size()>0)
            {
                result->appendFrames(lstSeconds);
            }
            return result;
        }
    }
    _vCondition.wait_for(uniquelock, std::chrono::seconds(2));
    uniquelock.unlock();


//    LOGD("Rtp808FrameList::videoFrame 2");
    return nullptr;
}

std::shared_ptr<Rtp808Frame> Rtp808FrameList::audioFrame()
{
    std::unique_lock<std::mutex> uniquelock(_aMutex);
    if(_aFrames.size()>0)
    {
        auto frame = _aFrames.front();
        _aFrames.pop_front();
//        LOGD("use audio frame:%d.",_aFrames.size());
        return frame;
    }
    else
    {
        _aCondition.wait_for(uniquelock, std::chrono::seconds(2));
    }
    return nullptr;
}

void Rtp808FrameList::releaseLock()
{
    _vCondition.notify_all();
    _aCondition.notify_all();
}