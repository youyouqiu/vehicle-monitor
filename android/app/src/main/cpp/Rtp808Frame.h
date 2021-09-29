//
// Created by qwe on 2020/6/9.
//

#ifndef ANDROIDDEMO_RTP808FRAME_H
#define ANDROIDDEMO_RTP808FRAME_H

#include "CommonPublic.h"

enum EPayloadType
{
    G711  =1,
    G726  =8,
    LPCM  =18,
    AAC  =19,
    ADPCM = 26,
    AACLC = 24,
    G726_16 = 29  ,       // 自定义负载类型说明 G726-16kbit
    G726_24 = 30  ,       // 自定义负载类型说明 G726-24kbit
    G726_32=  31  ,       // 自定义负载类型说明 G726-32kbit
    G726_40 = 32  ,       // 自定义负载类型说明 G726-40kbit
    H264 =    98,
};
enum EPackageType
{
    ATOMIC = 0,         // 原子包, 不可拆分
    PART_START = 1,     // 分包，第一包
    PART_END = 2,       // 分包，最后一包
    PART_MIDDLE = 3,    // 分包，中间部分
};
enum EDataType
{
    IFRAME = 0,         // i帧
    PFRAME = 1,         // p帧
    BFRAME = 2,         // b帧
    AFRAME = 3,         // 音频帧
    TFRAME = 4,         // 透传数据
};


// 视频帧
struct Rtp808HeadBaseV
{
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
} __attribute__ ((packed));

// 音频帧
struct Rtp808HeadBaseA
{
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
    uint16_t dataLen;                                                       // 后续数据体长度（不含此字段）
    uint8_t data[0];                                                        // 数据体
} __attribute__ ((packed));

// 透传数据
struct Rtp808HeadBaseT
{
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
    uint16_t dataLen;                                                       // 后续数据体长度（不含此字段）
    uint8_t data[0];                                                        // 数据体
} __attribute__ ((packed));


class Rtp808Frame {
private:
    uint8_t* _ptrFrame;
    uint8_t* _ptrPayload;
    std::vector<uint8_t> _buffer;

    EPayloadType _payloadType;                      // 负载类型
    int _packageNumber;                             // 当前包序号
    std::string _simNumber;                         // 当前SIM卡号
    int _logicChannel;                              // 通道序号
    EPackageType _packageType;                      // 分包标记
    EDataType _dataType;                            // 数据类型
    uint64_t _timestamp;                            // 相对时间戳
    int _dataLen;                                   // 数据长度

    int _rtpHeadLen;                                // rtp头部长度
    int _frameDuration;                             // 帧时间
    uint64_t _startTime;                            // 播放时间, 微秒
private:
    void parseSimNumber(const uint8_t* data, std::string& str);
public:
    int parse(const uint8_t* data, int length);

    inline bool isVideo() {return _dataType ==EDataType::IFRAME||_dataType ==EDataType::PFRAME||_dataType ==EDataType::BFRAME;}
    inline uint64_t timestamp() {return _timestamp;}
    inline int duration(){return _frameDuration;}
    inline uint64_t time(){return _startTime;}
    inline EPackageType packageType(){return _packageType;}
    inline EPayloadType payloadType(){return _payloadType;}
    inline EDataType dataType(){return _dataType;}


    inline void time(uint64_t v){_startTime =v;}
    inline void duration(int v){_frameDuration =v;}

    inline int size(){return _dataLen;}
    inline uint8_t* data(){return _ptrPayload;}

    void appendFrames(const std::vector<std::shared_ptr<Rtp808Frame>>& frames);

    static std::unique_ptr<uint8_t[]> encodeMessage(std::string content, int& size);
};


#endif //ANDROIDDEMO_RTP808FRAME_H
