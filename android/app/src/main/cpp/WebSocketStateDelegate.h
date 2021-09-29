
#ifndef WEBSOCKETSTATEDELEGATE_H
#define WEBSOCKETSTATEDELEGATE_H

#include <jni.h>
#include "CommonPublic.h"

extern JavaVM* globalVm;

class WebSocketStateDelegate
{
public:
    static WebSocketStateDelegate* create(JNIEnv *env, jobject globalRef);

    inline jobject getDelegateObj() {
        return _delegateObj;
    }

    void onState(const int state);
    void onMessage(const std::string& message);
    void onVideoSize(const int width, const int height);
    void onVideoData(const char* buffer, int bufferLength);

    static const int CONNECTED = 0;
    static const int ERROR = 1;
    static const int CLOSED = 2;
    static const int VIDEO_OPEN = 3;
    static const int VIDEO_CLOSED = 4;

private:
    WebSocketStateDelegate(jobject obj): _delegateObj(obj), _state(-1) {}

    static jmethodID fetchMethodId(JNIEnv *env, jobject globalRef);
    static jmethodID fetchMethodIdOnMessage(JNIEnv *env, jobject globalRef);
    static jmethodID fetchMethodIdOnVideoSize(JNIEnv *env, jobject globalRef);
    static jmethodID fetchMethodIdOnVideoData(JNIEnv *env, jobject globalRef);

    jobject _delegateObj;
    int _state;

    static jmethodID methodId;
    static jmethodID methodIdOnMessage;
    static jmethodID methodIdOnVideoSize;
    static jmethodID methodIdOnVideoData;
};

#endif //WEBSOCKETSTATEDELEGATE_H
