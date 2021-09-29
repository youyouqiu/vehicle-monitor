//
// Created by Administrator on 2018/8/15.
//

#include "CommonPublic.h"
#include "ZWStreamPlayer.h"

JavaVM* globalVm;

extern "C" {


JNIEXPORT jlong JNICALL
nativeInitPlayer(JNIEnv *env, jobject obj, jobject view, jint width, jint height, jint sampleRate,
                 jint sampleBufSize, jboolean enableAudio) {
    LOGD("TestPlayer view=%p",view);
    ANativeWindow *window = nullptr;
    if (view != nullptr){
        window = ANativeWindow_fromSurface(env, view);
    }
    auto player = new ZWStreamPlayer(sampleRate, sampleBufSize, enableAudio);

    jobject globalRef = env->NewGlobalRef(obj);
    auto delegate = WebSocketStateDelegate::create(env, globalRef);
    player->setWebSocketStateDelegate(delegate);
    return reinterpret_cast<jlong>(player);
}

JNIEXPORT void JNICALL nativeCacheDir(JNIEnv *env, jobject obj, jlong point, jstring cacheDir) {
    NO_USED(env);
    NO_USED(obj);
    LOGD("nativeCacheDir");
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->cacheDir(env->GetStringUTFChars(cacheDir, nullptr));
}


JNIEXPORT void JNICALL nativeReleasePlayer(JNIEnv *env, jobject obj, jlong point) {
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
//    ANativeWindow *nativeWindow = player->getNativeView();
    jobject globalDelegate = player->getWebSocketStateDelegate()->getDelegateObj();
    delete player;
    env->DeleteGlobalRef(globalDelegate);
//    if (nativeWindow){
//        ANativeWindow_release(nativeWindow);
//    }
}

JNIEXPORT void JNICALL
nativePlayerWindowsSize(JNIEnv *env, jobject obj, jlong point, jint width, jint height) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
//    player->setWindowsSize(width, height);
}

JNIEXPORT void JNICALL nativePlay(JNIEnv *env, jobject obj, jlong point, jstring uri) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->play(env->GetStringUTFChars(uri, nullptr));
}

JNIEXPORT void JNICALL nativeChannel(JNIEnv *env, jobject obj, jlong point, jint channel) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->channel(channel);
}

JNIEXPORT void JNICALL nativePlayType(JNIEnv *env, jobject obj, jlong point, jstring playType) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->playType(env->GetStringUTFChars(playType, nullptr));
}

JNIEXPORT void JNICALL nativeSendMessage(JNIEnv *env, jobject obj, jlong point, jstring message) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->sendMessage(env->GetStringUTFChars(message, nullptr));
}




JNIEXPORT void JNICALL nativeStop(JNIEnv *env, jobject obj, jlong point) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->stop();
}

JNIEXPORT void JNICALL nativePlayAudio(JNIEnv *env, jobject obj, jlong point) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->playAudio();
}

JNIEXPORT void JNICALL nativeStopAudio(JNIEnv *env, jobject obj, jlong point) {
    NO_USED(env);
    NO_USED(obj);
    auto player = reinterpret_cast<ZWStreamPlayer *>(point);
    player->stopAudio();
}

static int
registerNativeMethods(JNIEnv *env, const char *className, const JNINativeMethod *gMethods,
                      int numMethods) {
    jclass clazz;
    clazz = env->FindClass(className);
    if (clazz == nullptr) {
        return JNI_FALSE;
    }
    if (env->RegisterNatives(clazz, gMethods, numMethods) < 0) {
        return JNI_FALSE;
    }
    return JNI_TRUE;
}

static int registerNatives(JNIEnv *env) {
    const JNINativeMethod nativePlayerMethods[] = {
        {"nativeInitPlayer",        "(Landroid/view/Surface;IIIIZ)J", reinterpret_cast<void *>(nativeInitPlayer)},
        {"nativeCacheDir",           "(JLjava/lang/String;)V",                         reinterpret_cast<void *>(nativeCacheDir)},
        {"nativePlayerWindowsSize", "(JII)V",                         reinterpret_cast<void *>(nativePlayerWindowsSize)},
        {"nativeChannel",           "(JI)V",                         reinterpret_cast<void *>(nativeChannel)},
        {"nativePlayType",           "(JLjava/lang/String;)V",                         reinterpret_cast<void *>(nativePlayType)},
        {"nativeSendMessage",           "(JLjava/lang/String;)V",                         reinterpret_cast<void *>(nativeSendMessage)},
        {"nativeReleasePlayer",     "(J)V",                           reinterpret_cast<void *>(nativeReleasePlayer)},
        {"nativePlay",              "(JLjava/lang/String;)V",         reinterpret_cast<void *>(nativePlay)},
        {"nativeStop",              "(J)V",                           reinterpret_cast<void *>(nativeStop)},
        {"nativePlayAudio",         "(J)V",                           reinterpret_cast<void *>(nativePlayAudio)},
        {"nativeStopAudio",         "(J)V",                           reinterpret_cast<void *>(nativeStopAudio)}
    };

    const std::string classPath = "com/zwf3lbs/stream/";
    if (!registerNativeMethods(env, (classPath + "ZWStreamPlayer").c_str(), nativePlayerMethods,
                               sizeof(nativePlayerMethods) / sizeof(nativePlayerMethods[0]))) {
        return JNI_FALSE;
    }
    return JNI_TRUE;
}

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
    JNIEnv *env = nullptr;
    globalVm = vm;
    if (vm->GetEnv(reinterpret_cast<void **>(&env), JNI_VERSION_1_6) != JNI_OK) {
        return JNI_ERR;
    }
    if (!registerNatives(env)) {
        return JNI_ERR;
    }
    return JNI_VERSION_1_6;
}

}
