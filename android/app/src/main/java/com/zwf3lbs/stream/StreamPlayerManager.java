package com.zwf3lbs.stream;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import javax.annotation.Nullable;

public class StreamPlayerManager extends SimpleViewManager<ZWOpenGLView> {
    private static final String TAG = "ZW-StreamPlayerManager";
    private static final String REACT_CLASS = "ZWVideoView";//组件名称
    private static final int COMMAND_PLAY_ID = 1;
    private static final int COMMAND_STOP_ID = 2;
    private static final int COMMAND_CAPTURE_ID = 3;
    private static final int COMMAND_MESSAGE_ID = 4;
    private static final String COMMAND_PLAY_NAME = "play";
    private static final String COMMAND_STOP_NAME = "stop";
    private static final String COMMAND_CAPTURE_NAME = "capture";
    private static final String COMMAND_MESSAGE_NAME = "message";

    private String sockUrl;
    private int channel;
    private String playType;
    private int panoramaType;
    private String vrImageSrc;
    private boolean enableAudio = false;
//    private String message = "";

    private final Map<ZWOpenGLView, ZWStreamPlayer> players;

    StreamPlayerManager() {
        players = new HashMap<>();
    }

    /**
     设置引用名
     */
    @Override
    public @NonNull String getName() {
        return REACT_CLASS;
    }

    /**
     创建ui组件实例
     */
    protected @NonNull ZWOpenGLView createViewInstance(@NonNull ThemedReactContext reactContext) {
        ZWOpenGLView openGLView = new ZWOpenGLView(reactContext);
        Log.d(TAG, "createViewInstance " + openGLView);
        return openGLView;
    }

    /**
     * 所有组件属性更新完成后的回调事件处理
     */
    @Override
    protected void onAfterUpdateTransaction(@NonNull ZWOpenGLView openGLView) {
        Log.d(TAG, "onAfterUpdateTransaction " + openGLView);
        if (players.get(openGLView) != null) {
            return;
        }
        initPlayer(openGLView);
    }

    @Override
    public void onDropViewInstance(@NonNull ZWOpenGLView view) {
        Log.d(TAG, "onDropViewInstance " + view);
        final ZWStreamPlayer player = players.remove(view);
        player.deletePlayer();
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
        Map<String, Object> build = MapBuilder.newHashMap();

        build.put("videoSizeChange", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onVideoSizeChange")));

        build.put("messageChange", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onMessageChange")));

        build.put("stateChange", MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onStateChange")));
        return build;
    }

    private void initPlayer(ZWOpenGLView openGLView) {
        Log.d(TAG, "initPlayer " + openGLView+",panoramaType="+panoramaType+",vrImageSrc="+this.vrImageSrc);
//        panoramaType = 1;
        ZWStreamPlayer player = new ZWStreamPlayer(openGLView,8000, enableAudio, panoramaType==1);
        player.setZwContext((ThemedReactContext) openGLView.getContext());
        player.setChannel(this.channel);
        player.setPlayType(this.playType);
        player.initPlayer();
        player.setVrImageSrc(this.vrImageSrc);
        players.put(openGLView, player);
    }

    /**
     获取音视频uri
     */
    @ReactProp(name="socketUrl")
    public void setSocketUrl(ZWOpenGLView openGLView, String socketUrl){
        Log.d(TAG, "setSocketUrl：" + socketUrl);
        if (!Objects.equals(this.sockUrl, socketUrl)){
            this.sockUrl = socketUrl;
        }
    }
    /**
     获取音视频通道
     */
    @ReactProp(name="channel")
    public void setChannel(ZWOpenGLView openGLView, int channel){
        this.channel = channel;
        ZWStreamPlayer player = players.get(openGLView);
        if (player != null) {
            player.setChannel(channel);
        }
    }
    /**
     是否全景模式
     */
    @ReactProp(name="panoramaType")
    public void setIsPanorama(ZWOpenGLView openGLView, int panoramaType){
        Log.d(TAG, "setIsPanorama: panoramaType="+panoramaType);
        this.panoramaType = panoramaType;
    }
    /**
     全景模式显示图标
     */
    @ReactProp(name="vrImageSrc")
    public void setVrImageSrc(ZWOpenGLView openGLView, String vrImageSrc){
        this.vrImageSrc = vrImageSrc;
    }
    /**
     获取音视频类型
     */
    @ReactProp(name="playType")
    public void setPlayType(ZWOpenGLView openGLView, String playType){
        this.playType = playType;
        ZWStreamPlayer player = players.get(openGLView);
        if (player != null){
            player.setPlayType(playType);
        }
    }

    /**
     打开关闭视频
     */
    @ReactProp(name="ifOpenVideo")
    public void setIfOpenVideo(ZWOpenGLView openGLView, Boolean ifOpenVideo) {
        Log.d(TAG, "ifOpenVideo: " + ifOpenVideo);
        ZWStreamPlayer player = players.get(openGLView);
        if (player == null) {
            Log.d(TAG, "ifOpenVideo: player == null");
            return;
        }
        if (ifOpenVideo) {
            player.playVideo(sockUrl);
            return;
        }
        player.stopVideo();
    }

    /**
     打开关闭音频
     */
    @ReactProp(name="ifOpenAudio")
    public void setIfOpenAudio(ZWOpenGLView openGLView, Boolean ifOpenAudio) {
        Log.d(TAG, "setIfOpenAudio: " + ifOpenAudio);
        ZWStreamPlayer player = players.get(openGLView);
        this.enableAudio = ifOpenAudio;
        if (player == null) {
            return;
        }
        if (ifOpenAudio) {
            player.playAudio();
            return;
        }
        player.stopAudio();
    }

    @Override
    public @Nullable Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
                COMMAND_PLAY_NAME, COMMAND_PLAY_ID,
                COMMAND_STOP_NAME, COMMAND_STOP_ID,
                COMMAND_CAPTURE_NAME, COMMAND_CAPTURE_ID,
                COMMAND_MESSAGE_NAME, COMMAND_MESSAGE_ID
        );
    }

    @Override
    public void receiveCommand(@NonNull ZWOpenGLView view, int commandId, @Nullable ReadableArray args) {
        ZWStreamPlayer player = players.get(view);
        switch (commandId) {
            case COMMAND_PLAY_ID:
                Log.d(TAG, "receiveCommand - COMMAND_PLAY_ID:"+sockUrl);
                player.playVideo(sockUrl);
                break;
            case COMMAND_STOP_ID:
                Log.d(TAG, "receiveCommand - COMMAND_STOP_ID");
                player.stopVideo();
                break;
            case COMMAND_CAPTURE_ID:
                Log.d(TAG, "receiveCommand - COMMAND_CAPTURE_ID");
                view.capture();
                break;
            case COMMAND_MESSAGE_ID:
                if (args!=null && args.size()==1){
                    String message = args.getString(0);
                    player.sendMessage(message);
                    Log.d(TAG, "receiveCommand - COMMAND_MESSAGE_ID:"+message);
                } else {
                    Log.e(TAG, "receiveCommand - COMMAND_MESSAGE_ID : error args");
                }
                break;
            default:
                break;
        }
    }
}