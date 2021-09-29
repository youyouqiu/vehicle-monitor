//
// Created by qwe on 2020/6/9.
//

#include "Rtp808Frame.h"


#define PAYLOAD_TYPE_MASK  ((1 << 7) - 1)
static char magic[4] = {0x30, 0x31, 0x63, 0x64};

int checkMagic(const uint8_t* data, int length) {
    int result = -1;
    if(memcmp(data, magic, 4)!=0) {
        // 查找rtp头开始位置
        for (int i = 0; i < length - sizeof(Rtp808HeadBaseV); ++i) {
            if(memcmp(data+i, magic, 4)==0) {
                result = i;
                break;
            }
        }
    } else {
        result = 0;
    }
    return result;
}

void Rtp808Frame::parseSimNumber(const uint8_t* data, std::string& str)
{
    //01 90 00 05 16 75 -> 01 90 00 05 16 75
    // 用以辅助将RTP头部中的BCD编码转为10进制SIM卡号
    char bcdBuffer[13] = {0};
    for(int i = 0; i != 6; ++i)
    {
        bcdBuffer[i << 1] = (data[i] >> 4) + '0';
        bcdBuffer[(i << 1) + 1] = (data[i] & 0x0f) + '0';
    }

    str = bcdBuffer;
}
int Rtp808Frame::parse(const uint8_t* data, int length) {

    // check start
    if(length < sizeof(Rtp808HeadBaseV)) {
        return 0;
    }
    int offset = checkMagic(data, length);
    if (offset<0) {
        LOGE("magic not found");
        return -1;
    } else if (offset > 0) {
        LOGI("magic offset:%d", offset);
        length -= offset;
        if(length < sizeof(Rtp808HeadBaseV)) {
            return 0;
        }
        data += offset;
    }

    // check head cc
    auto headV = reinterpret_cast<const Rtp808HeadBaseV*>(data);
    if (!(headV -> headV == 2 && headV -> headP == 0 && headV -> headX == 0 && headV -> headCC == 1)) {
        LOGE("head cc error");
        PrintBuffer(data, 32);
        return -1;
    }

    // read value
    _payloadType = EPayloadType(PAYLOAD_TYPE_MASK & headV->headPT);
    _packageNumber = swapBigEndian_u16(headV->number);
    parseSimNumber(&(headV->simBcd[0]), _simNumber);
    _logicChannel = headV->logicChannel;
    _packageType = EPackageType(headV->partFlag);
    _dataType = EDataType(headV->dataType);

    uint64_t timestamp = 0;
    switch (_dataType) {
        case EDataType::IFRAME:
        case EDataType::PFRAME:
        case EDataType::BFRAME:
        {
            _dataLen = swapBigEndian_u16(headV->dataLen);
            _rtpHeadLen = sizeof(Rtp808HeadBaseV);
            _frameDuration = swapBigEndian_u16(headV->lastFrameTime);
            memcpy(&timestamp, headV->time, sizeof(uint64_t));
        }
            break;
        case EDataType::AFRAME:
        {
            auto ptrA = reinterpret_cast<const Rtp808HeadBaseA*>(data);
            _dataLen = swapBigEndian_u16(ptrA->dataLen);
            _rtpHeadLen = sizeof(Rtp808HeadBaseA);
            memcpy(&timestamp, ptrA->time, sizeof(uint64_t));
        }
            break;
        default:
            LOGE("data type error");
            return -1;
    }
    _timestamp = swapBigEndian_u64(timestamp);
    if(_dataLen<0 || _dataLen >100000) {
        LOGE("data length error:%d", _dataLen);
        return -1;
    }

    int frameSize = _rtpHeadLen + _dataLen;
    _buffer.resize(frameSize);
    memcpy(_buffer.data(), data, frameSize);

    _ptrFrame = _buffer.data();
    _ptrPayload = _ptrFrame+_rtpHeadLen;


//    LOGD("Rtp808Frame::parse: frameSize=%d,_dataLen=%d, _packageType=%d,_dataType=%d,isVideo=%d,headV->partFlag=%d,headV->dataType=%d",frameSize,_dataLen,_packageType,_dataType,isVideo(),headV->partFlag,headV->dataType);
//    PrintBuffer(data, 30);
    return frameSize;
}

void Rtp808Frame::appendFrames(const std::vector<std::shared_ptr<Rtp808Frame>>& frames)
{
    int allsize = 0;
    for (const auto & frame : frames) {
        allsize += frame->size();
    }
    
    int offset = _buffer.size();
    int newSize = _buffer.size()+allsize;
    _buffer.resize(newSize);

//    LOGD("Rtp808FrameList::appendFrames self datasize=%d", _dataLen);
    for (const auto & frame : frames) {
//        LOGD("Rtp808Frame::appendFrames i=%d ,offset=%d size=%d",i,offset, frames[i]->size());
        memcpy(_buffer.data()+offset, frame->data(), frame->size());
        offset+=frame->size();
    }
    _dataLen += allsize;
    _ptrFrame = _buffer.data();
    _ptrPayload = _ptrFrame+_rtpHeadLen;

//    LOGD("Rtp808Frame::appendFrames allsize=%d", _dataLen);

}

std::unique_ptr<uint8_t[]> Rtp808Frame::encodeMessage(std::string content, int& size)
{
    /*
    char magic[4];
    uint8_t headCC: 4;                                                      // 固定1
    uint8_t headX: 1;                                                       // RTP头是否需要扩展位，固定0
    uint8_t headP: 1;                                                       // 固定 0
    uint8_t headV: 2;                                                       // 固定 2
    uint8_t headPT: 7;                                                      // 负载类型
    uint8_t headM: 1;                                                       // 标志位，确定是否是完整数据帧边界
    uint16_t number;                                                        // 包序号
    uint8_t simBcd[6];                                                      // sim卡号，BCD编码
    uint8_t logicChannel;                                                   // 逻辑通道号，按照 JT/T 1076 20 的表2
    uint8_t partFlag: 4;                                                    // 分包标记，0000：原子包，不可拆分、0001：分包处理第一包、0010：分包处理最后一包、0011：分包时中间包
    uint8_t dataType: 4;                                                    // 数据类型，0000：I帧、0001：P帧、0010：B帧、0011：音频帧、0100：透传数据
    uint8_t time[8];                                                        // 相对时间戳
    uint16_t lastIFrameTime;                                                // 与上一关键帧的时间间隔，单位毫秒，
    uint16_t lastFrameTime;                                                 // 与上一帧的时间间隔，单位毫秒，
    uint16_t dataLen;                                                       // 后续数据体长度（不含此字段）
    uint8_t data[0];                                                        // 数据体
     * */
    Rtp808HeadBaseT rtp={0};
    memcpy(rtp.magic,magic,4);
    rtp.headCC = 1;
//    rtp.headX =  0;
//    rtp.headP = 0;
    rtp.headV = 2;
//    rtp.headPT = 0;
    rtp.headM = 1;
//    rtp.number = 0;
//    rtp.simBcd =
//    rtp.logicChannel =
    rtp.partFlag = 0;
    rtp.dataType = 4;
    rtp.dataLen = content.size();

    std::unique_ptr<uint8_t[]> rtpframe(new uint8_t[sizeof(Rtp808HeadBaseT)+content.size()]());
    memcpy(rtpframe.get(), &rtp, sizeof(Rtp808HeadBaseT));
    memcpy(rtpframe.get()+sizeof(Rtp808HeadBaseT), content.data(), content.size());
    size = sizeof(Rtp808HeadBaseT)+content.size();
    return rtpframe;
}