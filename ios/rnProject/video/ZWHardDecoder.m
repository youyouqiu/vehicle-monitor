//
//  ZWHardDecoder.m
//  VideoEx1
//
//  Created by 改革丰富 on 2018/7/26.
//  Copyright © 2018年 改革丰富. All rights reserved.
//

#import "ZWHardDecoder.h"
#import <VideoToolbox/VideoToolbox.h>

#define setHardDecodecAttr(attr, attrLen) \
if(attrLen == safeSize - 4) \
{ \
    if(memcmp(attr, begin + 4, attrLen) != 0) \
    { \
        memcpy(attr, begin + 4, attrLen); \
        hardIsInit = NO; \
    } \
} \
else \
{ \
    if(attr) \
    { \
        free(attr); \
    } \
    attrLen = safeSize - 4; \
    attr = (uint8_t*)malloc(attrLen); \
    memcpy(attr, begin + 4, attrLen); \
    hardIsInit = NO; \
}

void didDecompress(void *decompressionOutputRefCon, void *sourceFrameRefCon, OSStatus status, VTDecodeInfoFlags infoFlags, CVImageBufferRef pixelBuffer, CMTime presentationTimeStamp, CMTime presentationDuration )
{
    CVPixelBufferRef* outputPixelBuffer = (CVPixelBufferRef *)sourceFrameRefCon;
    *outputPixelBuffer = CVPixelBufferRetain(pixelBuffer);
}

@interface ZWHardDecoder()
{
    uint8_t* sps;
    size_t spsLen;
    uint8_t* pps;
    size_t ppsLen;
    VTDecompressionSessionRef deocderSession;
    CMVideoFormatDescriptionRef decoderFormatDescription;
    BOOL hardIsInit;
}

@end

@implementation ZWHardDecoder

-(instancetype)init
{
    self = [super init];
    if(self)
    {
        sps = NULL;
        spsLen = 0;
        pps = NULL;
        ppsLen = 0;
        deocderSession = NULL;
        decoderFormatDescription = NULL;
        hardIsInit = NO;
    }
    return self;
}

-(void)dealloc
{
    if(sps)
    {
        free(sps);
    }
    if(pps)
    {
        free(pps);
    }
    if(decoderFormatDescription)
    {
        CFRelease(decoderFormatDescription);
    }
    if(deocderSession)
    {
        VTDecompressionSessionInvalidate(deocderSession);
        CFRelease(deocderSession);
    }
}

-(int)initHardDecoder
{
    if(decoderFormatDescription)
    {
        CFRelease(decoderFormatDescription);
        decoderFormatDescription = NULL;
    }
    if(deocderSession)
    {
        VTDecompressionSessionInvalidate(deocderSession);
        CFRelease(deocderSession);
        deocderSession = NULL;
    }
    const uint8_t* const parameterSetPointers[2] = {sps, pps};
    const size_t parameterSetSizes[2] = {spsLen, ppsLen};
    OSStatus status = CMVideoFormatDescriptionCreateFromH264ParameterSets(kCFAllocatorDefault, 2, parameterSetPointers, parameterSetSizes, 4, &decoderFormatDescription);
    if(status == noErr)
    {
        
        const void* keys[] = {kCVPixelBufferPixelFormatTypeKey};
        uint32_t formatType = kCVPixelFormatType_32BGRA;//kCVPixelFormatType_420YpCbCr8BiPlanarFullRange;
        const void* values[] = {CFNumberCreate(NULL, kCFNumberSInt32Type, &formatType)};
        CFDictionaryRef attrs = CFDictionaryCreate(NULL, keys, values, 1, NULL, NULL);
        
        VTDecompressionOutputCallbackRecord callBackRecord;
        callBackRecord.decompressionOutputCallback = didDecompress;
        callBackRecord.decompressionOutputRefCon = NULL;
        
        status = VTDecompressionSessionCreate(kCFAllocatorDefault, decoderFormatDescription, NULL, attrs, &callBackRecord, &deocderSession);
        CFRelease(attrs);
        if(status == noErr)
        {
            return 0;
        }
    }
    return -1;
}

-(CVPixelBufferRef)analysisVideoData:(uint8_t*)data len:(size_t)len
{
    *((int32_t*)data) = htonl((int32_t)len - 4);
    CVPixelBufferRef outputPixelBuffer = NULL;
    CMBlockBufferRef blockBuffer = NULL;
    OSStatus status  = CMBlockBufferCreateWithMemoryBlock(kCFAllocatorDefault, (void*)data, len, kCFAllocatorNull, NULL, 0, len, 0, &blockBuffer);
    if(status == kCMBlockBufferNoErr)
    {
        CMSampleBufferRef sampleBuffer = NULL;
        const size_t sampleSizeArray[] = {len};
        status = CMSampleBufferCreateReady(kCFAllocatorDefault, blockBuffer, decoderFormatDescription, 1, 0, NULL, 1, sampleSizeArray, &sampleBuffer);
        if (status == kCMBlockBufferNoErr && sampleBuffer)
        {
            VTDecodeInfoFlags flagOut = 0;
            VTDecompressionSessionDecodeFrame(deocderSession, sampleBuffer, 0, &outputPixelBuffer, &flagOut);
            if(sampleBuffer)
            {
                CFRelease(sampleBuffer);
            }
        }
    }
    if(blockBuffer)
    {
        CFRelease(blockBuffer);
    }
    return outputPixelBuffer;
}

-(CVPixelBufferRef)decode:(uint8_t*)data len:(size_t)len frameType:(int)frameType
{
    if(len >= 10)
    {
        if(frameType == 0)
        {
            int32_t findValue = 1 << 24;
            uint8_t* end = data + len;
            uint8_t* pos = (uint8_t*)memmem(data, len, &findValue, 4);
            while(pos && end - pos > 4)
            {
                int value = pos[4] & 0x1f;
                if(value == 5 && hardIsInit)
                {
                    return [self analysisVideoData:pos len:end - pos];
                }
                uint8_t* begin = pos;
                pos = (uint8_t*)memmem(begin + 4, end - begin - 4, &findValue, 4);
                pos = pos == NULL ? end : pos;
                size_t safeSize = pos - begin;
                if(safeSize > 5)
                {
                    if(value == 7)
                    {
                        setHardDecodecAttr(sps, spsLen);
                    }
                    else if (value == 8)
                    {
                        setHardDecodecAttr(pps, ppsLen);
                    }
                    if(sps != NULL && pps != NULL && !hardIsInit && [self initHardDecoder] == 0)
                    {
                        hardIsInit = YES;
                    }
                }
            }
        }
        else if(hardIsInit)
        {
            return [self analysisVideoData:data len:len];
        }
    }
    return NULL;
}

@end
