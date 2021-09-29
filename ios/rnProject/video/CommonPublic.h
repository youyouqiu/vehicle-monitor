//
// Created by Administrator on 2018/8/16.
//

#ifndef COMMONPUBLIC_H
#define COMMONPUBLIC_H

#ifdef __cplusplus
#include <iostream>
#include <iomanip>
#include <sstream>
#include <thread>
#include <vector>
#include <list>
#include <string>
#include <regex>
#include <map>
#include <set>
#include <mutex>
#include <cstdlib>
#include <condition_variable>
#include <atomic>
#include <memory>
#include <cstring>
#include <future>
#include <unordered_map>
#include <algorithm>
#endif

#include <unistd.h>
#include <sys/types.h>
#include <string.h>
#include <signal.h>
#include <assert.h>
#include <fcntl.h>
#include <time.h>
#include <sys/stat.h>
#include <stdlib.h>
#include <unwind.h>
#include <dlfcn.h>
#include <math.h>
#include <endian.h>

#define ENABLE_DEBUG_LOG 1


#ifdef ANDROID
#include <android/native_window_jni.h>
#include <android/log.h>
#include <EGL/egl.h>
#include <EGL/eglplatform.h>
#include <EGL/eglext.h>
#include <GLES3/gl3.h>
#include <SLES/OpenSLES.h>
#include <SLES/OpenSLES_Android.h>

#include <media/NdkMediaCodec.h>

#include <jni.h>
#define TAG "jni"
#define LOGQ
#define LOGID ""

#if ENABLE_DEBUG_LOG
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG,TAG ,__VA_ARGS__) // 定义LOGD类型
#else
#define LOGD(...)
#endif
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,TAG ,__VA_ARGS__) // 定义LOGI类型
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN,TAG ,__VA_ARGS__) // 定义LOGW类型
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR,TAG ,__VA_ARGS__) // 定义LOGE类型
#define LOGF(...) __android_log_print(ANDROID_LOG_FATAL,TAG ,__VA_ARGS__) // 定义LOGF类型


#else

#import <Foundation/Foundation.h>

#define LOGQ @
#define LOGID "[native]"

#define LOGD NSLog
#define LOGI NSLog
#define LOGW NSLog
#define LOGE NSLog
#endif

#define SMART(type) std::shared_ptr<type>



#define NO_USED(V) ((void) V)




static inline uint16_t swapBigEndian_u16(uint16_t value)
{
#if __BYTE_ORDER__==__ORDER_LITTLE_ENDIAN__
    return __builtin_bswap16(value);
#else
    return value;
#endif
}
static inline uint32_t swapBigEndian_u32(uint32_t value)
{
#if __BYTE_ORDER__==__ORDER_LITTLE_ENDIAN__
    return __builtin_bswap32(value);
#else
    return value;
#endif
}

static inline uint64_t swapBigEndian_u64(uint64_t value)
{
#if __BYTE_ORDER__==__ORDER_LITTLE_ENDIAN__
    return __builtin_bswap64(value);
#else
    return value;
#endif
}

static inline void LogMessageA(int logLevel, const char* key, int channel, const char *format, ...) {
    char* buf = (char*)malloc(1024*2);
    if (buf) {
        memset(buf,0,1024*2);
        sprintf(buf, "[%s-%d]", key, channel);
        int index = (int)strlen(buf);

        va_list aptr;
        va_start(aptr, format);
        vsprintf(buf+index, format, aptr);
        va_end(aptr);

        switch (logLevel){
            case 1:
                LOGI(LOGQ"%s%s",LOGID,buf);
                break;
            case 2:
                LOGW(LOGQ"%s%s",LOGID,buf);
                break;
            case 3:
                LOGE(LOGQ"%s%s",LOGID,buf);
                break;
            default:
                LOGD(LOGQ"%s%s",LOGID,buf);
                break;
        }
        free(buf);
    }
}


static inline void PrintBuffer(const void* pBuff, unsigned int nLen)
{
    LOGD(LOGQ"------------------BUFFER(%p)-------------------\n", pBuff);
    if (NULL == pBuff || 0 == nLen)
    {
        return;
    }

    const int nBytePerLine = 16;
    unsigned char* p = (unsigned char*)pBuff;
    char szHex[3*nBytePerLine+1] = {0};
    for (unsigned int i=0; i<nLen; ++i)
    {
        int idx = 3 * (i % nBytePerLine);
        if (0 == idx)
        {
            memset(szHex, 0, sizeof(szHex));
        }
#ifdef WIN32
        sprintf_s(&szHex[idx], 4, "%02x ", p[i]);// buff长度要多传入1个字节
#else
        snprintf(&szHex[idx], 4, "%02x ", p[i]); // buff长度要多传入1个字节
#endif

        // 以16个字节为一行，进行打印
        if (0 == ((i+1) % nBytePerLine))
        {
            LOGD(LOGQ"%s\n", szHex);
        }
    }

    // 打印最后一行未满16个字节的内容
    if (0 != (nLen % nBytePerLine))
    {
        LOGD(LOGQ"%s\n", szHex);
    }
    LOGD(LOGQ"------------------end-------------------\n");
}

// 微秒
static inline uint64_t getCurrentTime()
{
    struct timespec time;
#ifdef ANDROID
    clock_gettime(CLOCK_MONOTONIC, &time);
#else
    if (@available(iOS 10.0, *)) {
        clock_gettime(CLOCK_MONOTONIC, &time);
    } else {
        // Fallback on earlier versions
    }
#endif
    return (uint64_t)(time.tv_sec * 1000000 + time.tv_nsec / 1000);
}

static void writeTestFile(const char* flieName, const uint8_t* buffer, int length)
{
    FILE* file = fopen(flieName, "ab");
    if (file)
    {
        fwrite(buffer,1,length,file);
        fclose(file);
    }
}
static void clearTestFile(const char* flieName)
{
    FILE* file = fopen(flieName, "w");
    if (file)
    {
        fclose(file);
    }
}


#endif
