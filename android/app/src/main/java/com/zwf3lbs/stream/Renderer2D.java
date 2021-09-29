package com.zwf3lbs.stream;

import android.graphics.Bitmap;
import android.opengl.GLES10;
import android.opengl.GLES11Ext;
import android.opengl.GLES30;
import android.opengl.GLES30;
import android.opengl.GLES31Ext;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.util.Log;

import java.nio.FloatBuffer;
import java.nio.IntBuffer;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class Renderer2D extends RendererBase {
    private final static String TAG = "ZW-Renderer2D";

    private int _program;
    private int _aPositionHandle;
    private int _aTexCoorHandle;
    private int _sTextureHandle;

    private final float[] _textCoorArr = new float[]{
            0.0f, 1.0f,                     // 左上
            1.0f, 1.0f,                     // 右上
            0.0f, 0.0f,                     // 左下
            1.0f, 0.0f,                     // 右下
    };

    private final float[] _vertexArr = new float[]{
            -1.0f, -1.0f,                   // 左下
            1.0f, -1.0f,                    // 右下
            -1.0f, 1.0f,                    // 左上
            1.0f, 1.0f,                     // 右上
    };
    private final FloatBuffer _vertexBuffer = makeBuffer(_vertexArr);
    private final FloatBuffer _texCoorBuffer = makeBuffer(_textCoorArr);


    // 初始化 - glsl
    void initProgram(){
        Log.d(TAG, "initProgram: ");
        IntBuffer oldProgram = IntBuffer.allocate(1);
        GLES30.glGetIntegerv(GLES30.GL_CURRENT_PROGRAM, oldProgram);
        {
            int vertexShader = loadShader(GLES30.GL_VERTEX_SHADER, vertexShaderCodeDefault);
            int fragmentShader = loadShader(GLES30.GL_FRAGMENT_SHADER, fragmentShaderCodeOES);
            if (vertexShader == 0 || fragmentShader == 0){
                Log.e(TAG, "initProgram: error shader!fragmentShader="+fragmentShader+" vertexShader="+vertexShader);
                return;
            }
            _program = GLES30.glCreateProgram();
            GLES30.glAttachShader(_program, vertexShader);
            GLES30.glAttachShader(_program, fragmentShader);
            GLES30.glLinkProgram(_program);
            if (!checkGlError(TAG, "glCreateProgram")){
                return;
            }

            GLES30.glUseProgram(_program);
            _aPositionHandle = GLES30.glGetAttribLocation(_program,"aPosition");
            _aTexCoorHandle = GLES30.glGetAttribLocation(_program,"aTexCoor");
            _sTextureHandle = GLES30.glGetUniformLocation(_program,"sTexture");
            checkGlLocation(TAG, "aPosition", _aPositionHandle);
            checkGlLocation(TAG, "aTexCoor", _aTexCoorHandle);
            checkGlLocation(TAG, "sTexture", _sTextureHandle);
            Log.d(TAG, "initProgram: sTexture="+_sTextureHandle+" aTexCoor="+_aTexCoorHandle+" aPosition="+_aPositionHandle);
        }
        GLES30.glUseProgram(oldProgram.get(0));
    }


    @Override
    public void onSurfaceCreated(GL10 gl10, EGLConfig eglConfig) {
        Log.d(TAG, "TestPlayer onSurfaceCreated: ");
        super.onSurfaceCreated(gl10, eglConfig);
        initProgram();
    }

    @Override
    public void onSurfaceChanged(GL10 gl10, int width, int height) {
        Log.d(TAG, "TestPlayer onSurfaceChanged: ");
        super.onSurfaceChanged(gl10, width, height);
        GLES30.glViewport(0,0, width, height);

    }

    @Override
    public void onDrawFrame(GL10 gl10) {
//        Log.d(TAG, "onDrawFrame: ");
        if (_codecSurface == null) {
            super.onDrawFrame(gl10);
            return;
        }
//        Log.d(TAG, "TestPlayer onDrawFrame: ");
        IntBuffer oldProgram = IntBuffer.allocate(1);
        IntBuffer nowProgram = IntBuffer.allocate(1);
        GLES30.glGetIntegerv(GLES30.GL_CURRENT_PROGRAM, oldProgram);
        {
            GLES30.glUseProgram(_program);
            checkGlError(TAG, "glUseProgram _program="+_program);
            GLES30.glGetIntegerv(GLES30.GL_CURRENT_PROGRAM, nowProgram);
//            Log.d(TAG, "onDrawFrame: old="+oldProgram.get(0)+" now="+nowProgram.get(0)+" pro="+_program);
            GLES30.glClearColor(0,0,0,1);
            GLES30.glClear(GLES30.GL_COLOR_BUFFER_BIT| GLES30.GL_DEPTH_BUFFER_BIT);

            //启用顶点位置数据
            GLES30.glEnableVertexAttribArray(_aPositionHandle);
            GLES30.glVertexAttribPointer(_aPositionHandle, 2, GLES30.GL_FLOAT, false, 2*4, _vertexBuffer);
            checkGlError(TAG, "_vertexBuffer");
            //启用顶点纹理数据
            GLES30.glEnableVertexAttribArray(_aTexCoorHandle);
            GLES30.glVertexAttribPointer(_aTexCoorHandle, 2, GLES30.GL_FLOAT, false, 2*4, _texCoorBuffer);
            checkGlError(TAG, "_texCoorBuffer");
            // 纹理
            GLES30.glActiveTexture(GLES30.GL_TEXTURE0);
            checkGlError(TAG, "glActiveTexture:"+_codecSurface.getTexture());
            GLES30.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, _codecSurface.getTexture());
            checkGlError(TAG, "glBindTexture:"+_codecSurface.getTexture());
            GLES30.glUniform1i(_sTextureHandle, 0);
            checkGlError(TAG, "glUniform1i sTexture:"+_codecSurface.getTexture()+" handle="+_sTextureHandle);

            GLES30.glDrawArrays(GLES30.GL_TRIANGLE_STRIP, 0, 4);
            checkGlError(TAG, "glDrawArrays");
        }
        GLES30.glUseProgram(oldProgram.get(0));

        super.onDrawFrame(gl10);
    }
    @Override
    public void release(){
        super.release();
    }
}
