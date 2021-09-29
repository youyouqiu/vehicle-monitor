package com.zwf3lbs.stream;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.SurfaceTexture;
import android.net.Uri;
import android.opengl.GLSurfaceView;
import android.util.Log;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;

import androidx.annotation.WorkerThread;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.zwf3lbs.zwf3lbsapp.R;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class ZWStreamPlayer {
    private final static String TAG = "ZW-ZWStreamPlayer";
    private List<ZWOpenGLView> _views = new ArrayList<>();
    private long nativePoint;
    private ThemedReactContext zwContext;
    private final ZWOpenGLView view;
    private final int sampleRate;
    private boolean enableAudio;

    private int width;
    private int height;
    private int channel = -1;
    private String playType;
    private RendererBase _renderer;
    private VideoDecoder _decoder;
    private Object _decoderLock = new Object();
    private boolean _playing;
    private boolean _aborting;
    private String _vrImageSrc;

    ZWStreamPlayer(ZWOpenGLView view, int sampleRate, boolean enableAudio, boolean is360) {
        Log.d(TAG, "ZWStreamPlayer: ZWStreamPlayer()");
        this.nativePoint = 0;
        this.sampleRate = sampleRate;
        this.view = view;
        this.enableAudio = enableAudio;
        view.setEnableGL(false);
        if (is360){
            view.setEnableGL(true);
            _renderer = new Renderer360();
            view.setRenderer(_renderer);
        } else {
            view.setEnableGL(true);
            _renderer = new Renderer2D();
            view.setRenderer(_renderer);
        }
        view.setBackgroundColor(Color.TRANSPARENT);
        view.setDestroyedRunnable(new Runnable() {
            @Override
            public void run() {
                onSurfaceDestroyed();
            }
        });
        view.setCreateRunnable(new Runnable(){
            @Override
            public void run() {
                ZWStreamPlayer.this.width = view.getViewSize().getWidth();
                ZWStreamPlayer.this.height = view.getViewSize().getHeight();
            }
        });
        view.setChangeRunnable(new Runnable() {
            @Override
            public void run() {
                ZWStreamPlayer.this.width = view.getViewSize().getWidth();
                ZWStreamPlayer.this.height = view.getViewSize().getHeight();
            }
        });
    }

    private void onSurfaceDestroyed(){
        Log.d(TAG, String.format("onSurfaceDestroyed",this.channel));
        deletePlayer();
    }

    public void setChannel(int v){
        Log.d(TAG, String.format("TestPlayer setChannel: %d", v));
        if (this.channel != v){
            this.channel = v;
        }
    }
    public void setPlayType(String playType){
        Log.d(TAG, String.format("TestPlayer (%d)setPlayType: %s", this.channel, playType));
        if (!Objects.equals(this.playType, playType)){
            this.playType = playType;
        }
    }
    public void setVrImageSrc(String imgPath){
        Log.d(TAG, "setVrImageSrc: imgPath="+imgPath+",_renderer"+_renderer);
        if (_vrImageSrc != imgPath){
            _vrImageSrc = imgPath;
            if (this._renderer != null){
                try {
                    Bitmap img = GLESHelper.getBitmapFormUri(this.zwContext, Uri.parse(_vrImageSrc));
                    Log.d(TAG, "setVrImageSrc: img="+img);
                    this._renderer.setWatermark(img);
                } catch (IOException e) {
                    e.printStackTrace();
                    Log.e(TAG, "setVrImageSrc: ", e);
                }
            }
        }
    }

    void initPlayer() {
    }

    void deletePlayer() {
        _aborting = true;
        synchronized(_decoderLock){
            if (_decoder!=null){
                _decoder.stopCodec();
                _decoder = null;
            }
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                Log.d(TAG,  String.format("(%d)deletePlayer", ZWStreamPlayer.this.channel));
                try {
                    if (ZWStreamPlayer.this.nativePoint != 0) {
                        long tmppoint = ZWStreamPlayer.this.nativePoint;
                        ZWStreamPlayer.this.nativePoint = 0;

                        nativeStop(tmppoint);
                        ZWStreamPlayer.this.nativeReleasePlayer(tmppoint);
                        Log.d(TAG, String.format("TestPlayer Release player: %s, point: %d", this, tmppoint));
                    }

                    Log.d(TAG, String.format("(%d)Release player: %s, point: %d",  ZWStreamPlayer.this.channel, this, nativePoint));
                }catch (Exception ex){
                    Log.e(TAG, "run: stopVideo", ex);
                }
                _aborting = false;
                _playing = false;
            }
        }).start();
    }


    public void onState(int state) {
        Log.d(TAG,  String.format("(%d)onState: %d , point:%d", this.channel, state, this.nativePoint));
        switch (state){
            case 0:
            case 3:
                _playing = true;
                break;
            case 1:
            case 2:
            case 4:
                _playing = false;
                break;
        }
        WritableMap nativeEvent = Arguments.createMap();
        nativeEvent.putInt("state", state);
        zwContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                view.getId(),"stateChange", nativeEvent
        );
    }
    public void onMessage(String message) {
        Log.d(TAG, String.format("(%d)onMessage: %s , point:%d", this.channel, message, this.nativePoint));
        WritableMap nativeEvent = Arguments.createMap();
        nativeEvent.putString("message", message);
        zwContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                view.getId(),"messageChange", nativeEvent
        );
    }
    public void onVideoSize(int width, int height) {
        Log.d(TAG, String.format("(%d)onVideoSize: %d-%d , point:%d", this.channel, width, height, this.nativePoint));
        WritableMap nativeEvent = Arguments.createMap();
        nativeEvent.putInt("width",width);
        nativeEvent.putInt("height",height);
        zwContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                view.getId(),"videoSizeChange", nativeEvent
        );
    }

    void setZwContext(ThemedReactContext zwContext) {
        this.zwContext = zwContext;
        if (_renderer!=null && zwContext!=null){
            Bitmap bmp= BitmapFactory.decodeResource(zwContext.getResources(), R.drawable.qj360);
            _renderer.setWatermark(bmp);
        }
    }

    void playVideo(String url) {
        Log.d(TAG, "playVideo: nativePoint="+nativePoint+",width="+width+","+height);
        if (_playing){
            return;
        }
        _playing = true;
        if (nativePoint == 0) {
            nativePoint = nativeInitPlayer(null, width, height, sampleRate, 320, enableAudio);
            nativeCacheDir(nativePoint, zwContext.getCacheDir().getPath());
            Log.d(TAG, String.format("TestPlayer Create native player. Player: %s, point: %d,nativeCacheDir=%s,getFilesDir=%s，enableAudio:"+enableAudio, this, nativePoint,zwContext.getCacheDir().getPath(),zwContext.getFilesDir().getPath()));
        }
        Log.d(TAG, String.format("(%d)playVideo: %s", this.channel, url));
        nativeChannel(nativePoint, channel);
        nativePlayType(nativePoint, playType);
        nativePlay(nativePoint, url);
    }

    void stopVideo() {
        Log.d(TAG, String.format("(%d)stopVideo",this.channel));
        if (!_playing || _aborting){
            return;
        }
        deletePlayer();
    }
    void sendMessage(String msg) {
        Log.d(TAG, String.format("(%d)sendMessage: %s,nativePoint= %d", this.channel, msg, nativePoint));
        if (nativePoint == 0) {
            return;
        }
        nativeSendMessage(nativePoint, msg);
    }

    void playAudio() {
        Log.d(TAG, String.format("(%d)playAudio", this.channel));
        enableAudio = true;
        if (nativePoint == 0) {
            return;
        }
        nativePlayAudio(nativePoint);
    }

    void stopAudio() {
        Log.d(TAG, String.format("(%d)stopAudio", this.channel));
        enableAudio = false;
        if (nativePoint == 0) {
            return;
        }
        nativeStopAudio(nativePoint);
    }
    private void videoDataCallback(byte[] data){
        if (true){
//            return;
        }
        try {
            synchronized(_decoderLock) {
                if (_aborting || !_playing) {
                    return;
                }
                if (_decoder == null) {
                    if (width > 0 && height > 0){
                        _decoder = new VideoDecoder(width, height);
                    }
                }
                if (_decoder != null) {
                    if (_renderer!=null && _renderer.surface()!=null){
//                        Log.d(TAG, "videoDataCallback:  _decoder.setSurface");
                        _decoder.setSurface(_renderer.surface().getSurface());
                    } else if (!view.getEnableGL()){
                        _decoder.setSurface(view.getSurface());
//                        _decoder.setOnImageRunnable(new VideoDecoder.DecoderEventCallback() {
//                            @Override
//                            public void onFrame(byte[] buf) {
//                                Bitmap img = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
//                                ByteBuffer buf2 = ByteBuffer.wrap(buf);
//                                img.copyPixelsFromBuffer(buf2);
//                                view.drawBitmap(img);
//                                img.recycle();
//                            }
//                        });
                    } else {
                        return;
                    }
                    _decoder.startCodec();
                    _decoder.onFrame(data,0, data.length);
                }
            }
        } catch (Exception ex) {
            try{
                if (_decoder!=null){
                    _decoder.stopCodec();
                    _decoder = null;
                }
            }catch (Exception ex2){}
            Log.e(TAG, "videoDataCallback: "+ex.getMessage(), ex);
        }
    }

    native private long nativeInitPlayer(Surface view, int width, int height, int sampleRate, int bufferSize, boolean enableAudio);

    native private void nativeReleasePlayer(long point);

    native private void nativePlayerWindowsSize(long point, int width, int height);

    native private void nativeCacheDir(long point, String path);

    native private void nativePlay(long point, String uri);

    native private void nativeChannel(long point, int channel);

    native private void nativePlayType(long point, String playType);

    native private void nativeStop(long point);

    native private void nativePlayAudio(long point);

    native private void nativeStopAudio(long point);

    native private void nativeSendMessage(long point, String message);
    static {
        System.loadLibrary("ZWStreamPlayer");
    }

}
