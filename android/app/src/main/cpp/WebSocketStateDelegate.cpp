#include "WebSocketStateDelegate.h"

jmethodID WebSocketStateDelegate::methodId = nullptr;
jmethodID WebSocketStateDelegate::methodIdOnMessage = nullptr;
jmethodID WebSocketStateDelegate::methodIdOnVideoSize = nullptr;
jmethodID WebSocketStateDelegate::methodIdOnVideoData = nullptr;

WebSocketStateDelegate* WebSocketStateDelegate::create(JNIEnv *env, jobject globalRef) {
    auto delegate = new WebSocketStateDelegate(globalRef);
    methodId = fetchMethodId(env, globalRef);
    methodIdOnMessage = fetchMethodIdOnMessage(env, globalRef);
    methodIdOnVideoSize = fetchMethodIdOnVideoSize(env, globalRef);
    methodIdOnVideoData = fetchMethodIdOnVideoData(env, globalRef);
    return delegate;
}

jmethodID WebSocketStateDelegate::fetchMethodId(JNIEnv *env, jobject globalRef) {
    jclass jclz = env->GetObjectClass(globalRef);
    return env->GetMethodID(jclz, "onState", "(I)V");
}
jmethodID WebSocketStateDelegate::fetchMethodIdOnMessage(JNIEnv *env, jobject globalRef) {
    jclass jclz = env->GetObjectClass(globalRef);
    return env->GetMethodID(jclz, "onMessage", "(Ljava/lang/String;)V");
}
jmethodID WebSocketStateDelegate::fetchMethodIdOnVideoSize(JNIEnv *env, jobject globalRef) {
    jclass jclz = env->GetObjectClass(globalRef);
    return env->GetMethodID(jclz, "onVideoSize", "(II)V");
}
jmethodID WebSocketStateDelegate::fetchMethodIdOnVideoData(JNIEnv *env, jobject globalRef) {
    jclass jclz = env->GetObjectClass(globalRef);
    return env->GetMethodID(jclz, "videoDataCallback","([B)V");
}

void WebSocketStateDelegate::onVideoData(const char* buffer, int bufferLength) {
    bool attach = false;
    JNIEnv* pEnv = nullptr;
    int status = globalVm->GetEnv((void **) &pEnv, JNI_VERSION_1_6);
    switch (status) {
        case JNI_OK:
            break;
        case JNI_EDETACHED:
            status = globalVm->AttachCurrentThread(&pEnv, nullptr);
            if (pEnv == nullptr) {
                LOGE("GetEnv: null java environment, error: %d", status);
                return;
            }
            attach = true;
            break;
        case JNI_EVERSION:
            LOGE("GetEnv: version not supported.");
            return;
        default:
            break;
    }

    if (methodIdOnVideoData == nullptr) {
        methodIdOnVideoData = fetchMethodIdOnVideoData(pEnv, _delegateObj);
    }
    if (methodIdOnVideoData != nullptr) {
        jbyteArray local_videoBuffer;
        local_videoBuffer = pEnv->NewByteArray(bufferLength);
        if( !local_videoBuffer || pEnv->ExceptionCheck())
        {
            LOGE("notifyVideoDataHW NewByteArray error");
            if(pEnv->ExceptionCheck())
            {
                pEnv->ExceptionDescribe();
                pEnv->ExceptionClear();
            }
            return;
        }

        pEnv->SetByteArrayRegion(local_videoBuffer, 0, bufferLength, (const jbyte*)buffer);
        pEnv->CallVoidMethod(_delegateObj, methodIdOnVideoData, local_videoBuffer);
    }

    if (attach) {
        globalVm -> DetachCurrentThread();
    }
}

void WebSocketStateDelegate::onVideoSize(const int width, const int height){
    bool attach = false;
    JNIEnv* pEnv = nullptr;
    int status = globalVm->GetEnv((void **) &pEnv, JNI_VERSION_1_6);
    switch (status) {
        case JNI_OK:
            break;
        case JNI_EDETACHED:
            status = globalVm->AttachCurrentThread(&pEnv, nullptr);
            if (pEnv == nullptr) {
                LOGE("GetEnv: null java environment, error: %d", status);
                return;
            }
            attach = true;
            break;
        case JNI_EVERSION:
            LOGE("GetEnv: version not supported.");
            return;
        default:
            break;
    }

    if (methodIdOnVideoSize == nullptr) {
        methodIdOnVideoSize = fetchMethodIdOnMessage(pEnv, _delegateObj);
    }
    if (methodIdOnVideoSize != nullptr) {
        pEnv->CallVoidMethod(_delegateObj, methodIdOnVideoSize, (jint)width, (jint)height);
    }

    if (attach) {
        globalVm -> DetachCurrentThread();
    }
}
void WebSocketStateDelegate::onMessage(const std::string& message){
    bool attach = false;
    JNIEnv* pEnv = nullptr;
    int status = globalVm->GetEnv((void **) &pEnv, JNI_VERSION_1_6);
    switch (status) {
        case JNI_OK:
            break;
        case JNI_EDETACHED:
            status = globalVm->AttachCurrentThread(&pEnv, nullptr);
            if (pEnv == nullptr) {
                LOGE("GetEnv: null java environment, error: %d", status);
                return;
            }
            attach = true;
            break;
        case JNI_EVERSION:
            LOGE("GetEnv: version not supported.");
            return;
        default:
            break;
    }

    if (methodIdOnMessage == nullptr) {
        methodIdOnMessage = fetchMethodIdOnMessage(pEnv, _delegateObj);
    }
    if (methodIdOnMessage != nullptr) {
        jstring strPar = pEnv->NewStringUTF(message.c_str());
        pEnv->CallVoidMethod(_delegateObj, methodIdOnMessage, strPar);
    }

    if (attach) {
        globalVm -> DetachCurrentThread();
    }
}
void WebSocketStateDelegate::onState(const int state) {
    if (_state == state) {
        return;
    }

    _state = state;
    bool attach = false;
    JNIEnv* pEnv = nullptr;
    int status = globalVm->GetEnv((void **) &pEnv, JNI_VERSION_1_6);
    switch (status) {
        case JNI_OK:
            break;
        case JNI_EDETACHED:
            status = globalVm->AttachCurrentThread(&pEnv, nullptr);
            if (pEnv == nullptr) {
                LOGE("GetEnv: null java environment, error: %d", status);
                return;
            }
            attach = true;
            break;
        case JNI_EVERSION:
            LOGE("GetEnv: version not supported.");
            return;
        default:
            break;
    }

    if (methodId == nullptr) {
        methodId = fetchMethodId(pEnv, _delegateObj);
    }
    if (methodId != nullptr) {
        pEnv -> CallVoidMethod(_delegateObj, methodId, (jint)state);
    }

    if (attach) {
        globalVm -> DetachCurrentThread();
    }
}
