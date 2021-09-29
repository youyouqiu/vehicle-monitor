#pragma clang diagnostic push
#pragma ide diagnostic ignored "cppcoreguidelines-avoid-goto"
//
// Created by Administrator on 2018/8/15.
//

#include "ZWHardDecoder.h"

constexpr int MAX_SPS_LEN = 100;
constexpr int H264_MIN_LEN = 6;
constexpr int NAL_MIN_LEN = 5;
constexpr uint32_t START_CODE = 1U << 24U; //开始码00 00 00 01在内存中的值 0x01000000
constexpr uint8_t NAL_MASK = 0x1fU;
constexpr int NAL_IDR = 5;
constexpr int NAL_SPS = 7;
constexpr int NAL_PPS = 8;

#define GET_BITS(bitSize) \
do \
{ \
	if(current + (bitSize) > maxCurrent) { \
	    return -1; \
    } \
	resultValue = 0; \
	for (int i = 0; i != (bitSize); ++i, ++current) \
	{ \
		resultValue <<= 1; \
		if (data[current >> 3] & (0x80 >> (current & 0x07))) \
		{ \
			++resultValue; \
		} \
	} \
} while(0)

#define GET_UNSIGNED_GOLOMB \
do \
{ \
	zeroCount = 0; \
	GET_BITS(1); \
	while (resultValue == 0) \
	{ \
		++zeroCount; \
		GET_BITS(1); \
	} \
	GET_BITS(zeroCount); \
	resultValue = (1 << zeroCount) + resultValue - 1; \
} while(0)

#define GET_SIGNED_GOLOMB \
do \
{ \
	GET_UNSIGNED_GOLOMB; \
	resultValue = (resultValue & 0x01) == 0 ? (resultValue + 1) >> 1 : -((resultValue + 1) >> 1); \
} while(0)

#define DO_EMULATION_PREVENTION \
do \
{ \
	size_t tmp_buf_size = len; \
	for (int i = 0; i < tmp_buf_size - 2; i++) \
	{ \
		if (!((data[i] ^ 0x00) + (data[i + 1] ^ 0x00) + (data[i + 2] ^ 0x03))) \
		{ \
			for (int j = i + 2; j<tmp_buf_size - 1; j++) \
			{ \
				data[j] = data[j + 1]; \
			} \
			--len; \
		} \
	} \
}while(0)

static int parseSpsH264(uint8_t* data, size_t len, uint32_t& width, uint32_t& height)
{
    DO_EMULATION_PREVENTION;
    size_t maxCurrent = std::min(len * 8, static_cast<size_t>(MAX_SPS_LEN) * 8);
    int32_t resultValue = 0;
    size_t zeroCount = 0;
    size_t current = 0;
    GET_BITS(3);
    GET_BITS(5);
    if(resultValue == NAL_SPS)
    {
        GET_BITS(8);
        int profileIdc = resultValue;
        GET_BITS(16);
        GET_UNSIGNED_GOLOMB;
        if(profileIdc == 100 || profileIdc == 110 || profileIdc == 122 || profileIdc == 144 )
        {
            GET_UNSIGNED_GOLOMB;
            if(resultValue == 3)
            {
                GET_BITS(1);
            }
            GET_UNSIGNED_GOLOMB;
            GET_UNSIGNED_GOLOMB;
            GET_BITS(1);
            GET_BITS(1);
            if(resultValue != 0)
            {
                GET_BITS(8);
            }
        }
        GET_UNSIGNED_GOLOMB;
        GET_UNSIGNED_GOLOMB;
        int picType = resultValue;
        if(picType == 0)
        {
            GET_UNSIGNED_GOLOMB;
        }
        else if(picType == 1)
        {
            GET_BITS(1);
            GET_SIGNED_GOLOMB;
            GET_SIGNED_GOLOMB;
            GET_UNSIGNED_GOLOMB;
            for(int i = 0; i != resultValue; ++i)
            {
                GET_SIGNED_GOLOMB;
            }
        }
        GET_UNSIGNED_GOLOMB;
        GET_BITS(1);
        GET_UNSIGNED_GOLOMB;
        width = static_cast<uint32_t>((resultValue + 1) * 16);
        GET_UNSIGNED_GOLOMB;
        height = static_cast<uint32_t>((resultValue + 1) * 16);
    }
    return 0;
}

int ZWHardDecoder::start(std::vector<uint8_t> sps, std::vector<uint8_t> pps)
{
    if(_isStart || sps.size() <= 4 || parseSpsH264(sps.data() + 4, sps.size() - 4, _width, _height) != 0 ||
       _width == 0 || _height == 0)
    {
        return -1;
    }

    _decode = AMediaCodec_createDecoderByType("video/avc");
    if(!_decode)
    {
        return -1;
    }

    AMediaFormat *decodeFormat = AMediaFormat_new();

    media_status_t result;
    if(!decodeFormat)
    {
        goto ERROR;
    }

    AMediaFormat_setString(decodeFormat, AMEDIAFORMAT_KEY_MIME, "video/avc");
    AMediaFormat_setInt32(decodeFormat, AMEDIAFORMAT_KEY_WIDTH, _width);
    AMediaFormat_setInt32(decodeFormat, AMEDIAFORMAT_KEY_HEIGHT, _height);
    AMediaFormat_setBuffer(decodeFormat, "csd-0", sps.data(), sps.size());
    AMediaFormat_setBuffer(decodeFormat, "csd-1", pps.data(), pps.size());

    result = AMediaCodec_configure(_decode, decodeFormat, _renderSurface, nullptr, 0);
    AMediaFormat_delete(decodeFormat);
    
    if(result != AMEDIA_OK)
    {
        goto ERROR;
    }

    result = AMediaCodec_start(_decode);
    if(result != AMEDIA_OK)
    {
        goto ERROR;
    }

    _isStart = true;
    return 0;

ERROR:
    AMediaCodec_delete(_decode);
    return -1;
}

void ZWHardDecoder::stop()
{
    if(_isStart)
    {
        AMediaCodec_stop(_decode);
        AMediaCodec_delete(_decode);
        _isStart = false;
    }  
};

int ZWHardDecoder::decodeData(uint8_t* data, size_t len)
{
    if(len < H264_MIN_LEN)
    {
        return H264_MIN_LEN;
    }
    auto end = data + len;
    const uint8_t* pos = reinterpret_cast<uint8_t*>(memmem(data, len, &START_CODE, 4));
    while(pos && end - pos > 4)
    {
        int value = pos[4] & NAL_MASK;
        if((value == NAL_IDR || value == 1) && _isStart)
        {
            return analysisVideoData(pos, end - pos);
            //return 0;
        }
        auto begin = pos;
        pos = reinterpret_cast<uint8_t*>(memmem(begin + 4, end - begin - 4, &START_CODE, 4));
        pos = pos == nullptr ? end : pos;
        size_t safeSize = pos - begin;
        if(safeSize > NAL_MIN_LEN)
        {
            if(value == NAL_SPS)
            {
                if(_isSPS)
                {
                    _isSPS = false;
                    _isPPS = false;
                }
                LOGD("setHardDecodeAttr 1");
                setHardDecodeAttr(_sps, begin, safeSize);
                _isSPS = true;
            }
            else if (value == NAL_PPS)
            {
                if(_isPPS)
                {
                    _isSPS = false;
                    _isPPS = false;
                }
                LOGD("setHardDecodeAttr 2");
                setHardDecodeAttr(_pps, begin, safeSize);
                _isPPS = true;
            }
            if(_isSPS && _isPPS && (!_isStart || !_isInit))
            {
                _isInit = true;
                LOGD("stop 1");
                stop();
                LOGD("ststartstartop 1");
                start(_sps, _pps);
                LOGD("start 1");
            }
        }
    }
    return 0;
}

int ZWHardDecoder::analysisVideoData(const uint8_t* data, size_t len)
{
//    usleep(1);
    LOGD("ZWHardDecoder::analysisVideoData datalen=%d",len);
//    PrintBuffer(data, 32);
    int iresult = -1;
#if ENABLE_VIDEO
    do
    {
        ssize_t inputIndex = AMediaCodec_dequeueInputBuffer(_decode, _timeOutUs);
        if(inputIndex < 0)
        {
            LOGW("ZWHardDecoder::analysisVideoData:AMediaCodec_dequeueInputBuffer=%d", inputIndex);
            break;
        }

        size_t inputSize = 0;
        uint8_t* inputData = AMediaCodec_getInputBuffer(_decode, static_cast<size_t>(inputIndex), &inputSize);
        if(!inputData || inputSize < len)
        {
            LOGE("ZWHardDecoder::analysisVideoData:AMediaCodec_getInputBuffer=%d", inputSize);
            break;
        }

        memcpy(inputData, data, len);
        media_status_t result = AMediaCodec_queueInputBuffer(_decode, static_cast<size_t>(inputIndex), 0, len, 0, 0);
        if(result != AMEDIA_OK)
        {
            LOGE("ZWHardDecoder::analysisVideoData:AMediaCodec_queueInputBuffer=%d", result);
            break;
        }
        iresult = 0;
    }while(false);

    while(true)
    {
        uint8_t* outputData = nullptr;
        AMediaCodecBufferInfo outputInfo;
        ssize_t outputIndex = AMediaCodec_dequeueOutputBuffer(_decode, &outputInfo, _timeOutUs);
        if(outputIndex < 0)
        {
//            LOGW("ZWHardDecoder::analysisVideoData:AMediaCodec_dequeueOutputBuffer=%d", outputIndex);
            break;
        }

        size_t outputSize = 0;
        outputData = AMediaCodec_getOutputBuffer(_decode, static_cast<size_t>(outputIndex), &outputSize);
        if(!outputData)
        {
            LOGE("ZWHardDecoder::analysisVideoData:AMediaCodec_getOutputBuffer=%d", outputSize);
            break;
        }

        if(_decodeType == -1)
        {
            AMediaFormat* format = AMediaCodec_getOutputFormat(_decode);
            AMediaFormat_getInt32(format, AMEDIAFORMAT_KEY_COLOR_FORMAT, &_decodeType);
        }


        if(AMediaCodec_releaseOutputBuffer(_decode, static_cast<size_t>(outputIndex), _renderSurface!=nullptr) != AMEDIA_OK)
        {
            LOGE("ZWHardDecoder::analysisVideoData:AMediaCodec_releaseOutputBuffer");
            break;
        }

        if(_callback)
        {
            _callback(outputData, _width, _height, _decodeType);
        }
    }

#endif
//    LOGD("ZWHardDecoder::analysisVideoData _callback=%p",_callback);
    return iresult;
}

void ZWHardDecoder::setHardDecodeAttr(std::vector<uint8_t>& videoAttr, const uint8_t* attr, size_t len)
{
    if(len != videoAttr.size() || memcmp(videoAttr.data(), attr, len) != 0)
    {
        videoAttr.resize(len);
        memcpy(videoAttr.data(), attr, len);
        stop();
    }
}

#pragma clang diagnostic pop