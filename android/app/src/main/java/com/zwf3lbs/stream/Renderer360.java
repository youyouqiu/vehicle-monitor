package com.zwf3lbs.stream;

import android.graphics.Bitmap;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLES30;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.util.Log;

import java.nio.FloatBuffer;
import java.nio.IntBuffer;
import java.nio.ShortBuffer;
import java.util.Arrays;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class Renderer360 extends RendererBase implements GLSurfaceView.Renderer {
    private final static String TAG = "ZW-Renderer360";
    private final double NV_PI = 3.14159265358979323846;

    private int _program;
    private int _uMVPMatrixHandler;
    private int _aPositionHandle;
    private int _aTexCoorHandle;
    private int _sTextureHandle;

    private int _programIcon;
    private int _aPositionHandleIcon;
    private int _aTexCoorHandleIcon;
    private int _sTextureHandleIcon;

    private int _viewWidth;
    private int _viewHeight;

    private float[] mViewMatrix=new float[16];
    private float[] mMVPMatrix=new float[16];
    private float[] mProjectMatrix = new float[]{
        1.0f,   0,      0,      0,
        0,      1.0f,   0,      0,
        0,      0,      1.0f,   0,
        0,      0,      0,      1.0f
    };


    private FloatBuffer _vertexBuffer, _texCoorBuffer;
    private ShortBuffer _indexBuffer;
    private int _indexCount;
    private float _lastZ;
    private float _angleX=0,_angleY=0;

    private final float[] _textCoorArr = new float[]{
            0.0f, 1.0f,                     // 左上
            1.0f, 1.0f,                     // 右上
            0.0f, 0.0f,                     // 左下
            1.0f, 0.0f,                     // 右下
    };

    private final float[] _vertexArr = new float[]{
            0.8f, -1.0f,                   // 左下
            1.0f, -1.0f,                    // 右下
            0.8f, -0.8f,                    // 左上
            1.0f, -0.8f,                     // 右上
    };
    private final FloatBuffer _vertexBufferIcon = makeBuffer(_vertexArr);
    private final FloatBuffer _texCoorBufferIcon = makeBuffer(_textCoorArr);

    // 初始化 - 球体顶点数组
    void initVertexBuffer(int radius){

        final int segmentCount = 5;
        final int hozSegmentCount = segmentCount * 4;
        final int verSegmentCount = segmentCount * 2;

        // cos(theta) and sin(theta) in z-x plane
        double[] cosTheta = new double[hozSegmentCount+1];
        double[] sinTheta = new double[hozSegmentCount+1];

        double theta = NV_PI / 2;
        double thetaStep = NV_PI / (segmentCount * 2);
        for (int i = 0; i < hozSegmentCount; i++, theta += thetaStep) {
            cosTheta[i] = Math.cos(theta);
            sinTheta[i] = Math.sin(theta);
        }
        cosTheta[hozSegmentCount] = cosTheta[0];
        sinTheta[hozSegmentCount] = sinTheta[0];

        // Angle in x-y plane
        double angle = (NV_PI / 2);
        double angleStep = NV_PI / verSegmentCount;

        // Save vertex data
        final int vertexPosLen = 3 * (verSegmentCount+1) * (hozSegmentCount+1);
        float[] m_VertexBuffer = new float[vertexPosLen];
        // Save texture data
        final int vertexTexCoordLen = 2 * (verSegmentCount+1) * (hozSegmentCount+1);
        float[] m_TexCoorBuffer = new float[vertexTexCoordLen];

        int vertexPosBaseIndex = 0;
        int vertexTexBaseIndex = 0;
        for (int i = 0; i <= verSegmentCount; i++, angle -= angleStep) {
            float t = (float)(verSegmentCount-i) / verSegmentCount;
            double radiusInCrossSection;
            float y;

            if (i == 0) {//球底
                radiusInCrossSection = 0;
                y = (float)-radius;
            } else if (i == verSegmentCount) {//球顶
                radiusInCrossSection = 0;
                y = (float)radius;
            } else {
                radiusInCrossSection = radius * Math.cos(angle);
                y = (float)(radius * Math.sin(-angle));
            }
            for (int j = 0; j <= hozSegmentCount; j++) {
                float s = (float)(hozSegmentCount-j) / hozSegmentCount;

                m_VertexBuffer[vertexPosBaseIndex++] = (float)(radiusInCrossSection * sinTheta[j]);
                m_VertexBuffer[vertexPosBaseIndex++] = y;
                m_VertexBuffer[vertexPosBaseIndex++] =(float)(radiusInCrossSection * cosTheta[j]);

                m_TexCoorBuffer[vertexTexBaseIndex++] = s;
                m_TexCoorBuffer[vertexTexBaseIndex++] = t;
            }
        }
        Log.d(TAG, "initVertexBuffer: m_VertexBuffer="+m_VertexBuffer.length);
        Log.d(TAG, "initVertexBuffer: "+ Arrays.toString(m_VertexBuffer));
        Log.d(TAG, "initVertexBuffer: m_TexCoorBuffer="+m_TexCoorBuffer.length);
        Log.d(TAG, "initVertexBuffer: "+ Arrays.toString(m_TexCoorBuffer));
        _vertexBuffer = makeBuffer(m_VertexBuffer);
        _texCoorBuffer = makeBuffer(m_TexCoorBuffer);

        //
        // Fill indices buffer
        //
        _indexCount = verSegmentCount * hozSegmentCount * 6;
        short[] indexBuffer = new short[_indexCount];
        int indexSet = 0;

        for (int row = 0; row < verSegmentCount; row++) {
            for (int col = 0; col < hozSegmentCount; col++) {
                short N10 = (short)((row + 1) * (hozSegmentCount + 1) + col);
                short N00 = (short)(row * (hozSegmentCount + 1) + col);

                indexBuffer[indexSet++] = (N00);
                indexBuffer[indexSet++] =  (short)(N10 + 1);
                indexBuffer[indexSet++] = (N10);


                indexBuffer[indexSet++] = (N00);
                indexBuffer[indexSet++] =  (short)(N00 + 1);
                indexBuffer[indexSet++] =  (short)(N10 + 1);
            }
        }
        _indexBuffer = makeBuffer(indexBuffer);
        Log.d(TAG, "initVertexBuffer: indexBuffer="+indexBuffer.length);
        Log.d(TAG, "initVertexBuffer: "+ Arrays.toString(indexBuffer));
    }

    // 初始化 - glsl
    void initProgram(){
        IntBuffer oldProgram = IntBuffer.allocate(1);
        GLES20.glGetIntegerv(GLES20.GL_CURRENT_PROGRAM, oldProgram);
        {
            int vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexShaderCodeMVP);
            int fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentShaderCodeOES);
            if (vertexShader == 0 || fragmentShader == 0){
                Log.e(TAG, "onSurfaceCreated: error shader!");
                return;
            }
            _program = GLES20.glCreateProgram();
            GLES20.glAttachShader(_program, vertexShader);
            GLES20.glAttachShader(_program, fragmentShader);
            GLES20.glLinkProgram(_program);
            if (!checkGlError(TAG, "glCreateProgram")){
                return;
            }

            GLES20.glUseProgram(_program);
            _uMVPMatrixHandler = GLES20.glGetUniformLocation(_program,"uMVPMatrix");
            _aPositionHandle = GLES20.glGetAttribLocation(_program,"aPosition");
            _aTexCoorHandle = GLES20.glGetAttribLocation(_program,"aTexCoor");
            _sTextureHandle = GLES20.glGetUniformLocation(_program,"sTexture");
            checkGlLocation(TAG, "uMVPMatrix", _uMVPMatrixHandler);
            checkGlLocation(TAG, "aPosition", _aPositionHandle);
            checkGlLocation(TAG, "aTexCoor", _aTexCoorHandle);
            checkGlLocation(TAG, "sTexture", _sTextureHandle);
        }
        GLES20.glUseProgram(oldProgram.get(0));
    }
    void initProgramIcon(){
        IntBuffer oldProgram = IntBuffer.allocate(1);
        GLES20.glGetIntegerv(GLES20.GL_CURRENT_PROGRAM, oldProgram);
        {
            int vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexShaderCodeDefault);
            int fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentShaderCodeDefault);
            if (vertexShader == 0 || fragmentShader == 0){
                Log.e(TAG, "onSurfaceCreated: error shader!");
                return;
            }
            _programIcon = GLES20.glCreateProgram();
            GLES20.glAttachShader(_programIcon, vertexShader);
            GLES20.glAttachShader(_programIcon, fragmentShader);
            GLES20.glLinkProgram(_programIcon);
            if (!checkGlError(TAG, "glCreateProgram")){
                return;
            }

            GLES20.glUseProgram(_programIcon);
            _aPositionHandleIcon = GLES20.glGetAttribLocation(_programIcon,"aPosition");
            _aTexCoorHandleIcon = GLES20.glGetAttribLocation(_programIcon,"aTexCoor");
            _sTextureHandleIcon = GLES20.glGetUniformLocation(_programIcon,"sTexture");
            checkGlLocation(TAG, "aPosition", _aPositionHandleIcon);
            checkGlLocation(TAG, "aTexCoor", _aTexCoorHandleIcon);
            checkGlLocation(TAG, "sTexture", _sTextureHandleIcon);
        }
        GLES20.glUseProgram(oldProgram.get(0));
    }

    static float triangleCoords[] = {
            -0.5f,  0.5f, 0.0f, // top left
            -0.5f, -0.5f, 0.0f, // bottom left
            0.5f, -0.5f, 0.0f, // bottom right
            0.5f,  0.5f, 0.0f  // top right
    };
    static short index[]={
            0,1,2,0,2,3
//            0,3,1
    };
    void initVertexBuffer2(int radius){
        _vertexBuffer = makeBuffer(triangleCoords);
        _indexBuffer = makeBuffer(index);
        _indexCount = index.length;
    }
    void setFOV(float fFOV){
        float nearValue = (float) Math.tan(fFOV * NV_PI / 180.0f / 2f);
        Matrix.frustumM(mProjectMatrix,0, -nearValue, nearValue, -nearValue, nearValue,1,800);

        Matrix.multiplyMM(mMVPMatrix,0,mProjectMatrix,0,mViewMatrix,0);
    }

    public void switchAngle(){
//        Matrix.multiplyMM(mMVPMatrix,0,mProjectMatrix,0,mViewMatrix,0);
        Matrix.rotateM(mMVPMatrix, 0, 90,0,-1,0);
    }

    @Override
    public void touchView(float x, float y){
        _lastZ+=0.1;
//        Matrix.setLookAtM(mViewMatrix,0,0,0,2.0f,0f,0f,0f,0f,_lastZ,_lastZ);
        Log.d(TAG, "touchView: _lastZ="+_lastZ);

//        Matrix.multiplyMM(mMVPMatrix,0,mProjectMatrix,0,mViewMatrix,0);

        _angleX += y/15;
        _angleY += x/15;

        Log.d(TAG, "touchView: _angleX="+_angleX+" _angleY"+_angleY);

        Matrix.multiplyMM(mMVPMatrix,0,mProjectMatrix,0,mViewMatrix,0);
        Matrix.rotateM(mMVPMatrix, 0, _angleX,-1,0,0);
        Matrix.rotateM(mMVPMatrix, 0, _angleY,0,-1,0);
//        Matrix.rotateM(mMVPMatrix, 0, y/10,-1,0,0);
    }
    @Override
    public void onSurfaceCreated(GL10 gl10, EGLConfig eglConfig) {
        Log.d(TAG, "TestPlayer onSurfaceCreated: ");
        super.onSurfaceCreated(gl10, eglConfig);
        initVertexBuffer(100);
        initProgram();
        initProgramIcon();
        setFOV(95);
    }

    @Override
    public void onSurfaceChanged(GL10 gl10, int width, int height) {
        Log.d(TAG, "TestPlayer onSurfaceChanged: ");
        super.onSurfaceChanged(gl10, width, height);
        _viewHeight = height;
        _viewWidth = width;
        GLES20.glViewport(0,0, width, height);

        //计算宽高比
        float ratio = (float)width/height;
//        Matrix.setIdentityM(mMVPMatrix, 0);
//        Matrix.setIdentityM(mViewMatrix, 0);
//        Matrix.setIdentityM(mProjectMatrix, 0);
        //设置透视投影
//        Matrix.frustumM(mProjectMatrix,0, -ratio, ratio,-1,1,3,7);
        //设置相机位置
        Matrix.setLookAtM(mViewMatrix,0,0,0,1,0,0,0,0f,1,0);
        //计算变换矩阵
        Matrix.multiplyMM(mMVPMatrix,0,mProjectMatrix,0,mViewMatrix,0);

    }


    void drawVideo(){
        GLES20.glUseProgram(_program);
        GLES20.glClearColor(0,0,0,1);
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT| GLES20.GL_DEPTH_BUFFER_BIT);

        // mvp
        GLES20.glUniformMatrix4fv(_uMVPMatrixHandler, 1, false, mMVPMatrix, 0);
        //启用顶点位置数据
        GLES20.glEnableVertexAttribArray(_aPositionHandle);
        GLES20.glVertexAttribPointer(_aPositionHandle, 3, GLES20.GL_FLOAT, false, 3*4, _vertexBuffer);
        checkGlError(TAG, "_vertexBuffer");
        //启用顶点纹理数据
        GLES20.glEnableVertexAttribArray(_aTexCoorHandle);
        GLES20.glVertexAttribPointer(_aTexCoorHandle, 2, GLES20.GL_FLOAT, false, 2*4, _texCoorBuffer);
        checkGlError(TAG, "_texCoorBuffer");
        // 纹理
        GLES30.glActiveTexture(GLES30.GL_TEXTURE0);
        checkGlError(TAG, "glActiveTexture:"+_codecSurface.getTexture());
        GLES30.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, _codecSurface.getTexture());
        checkGlError(TAG, "glBindTexture:"+_codecSurface.getTexture());
        GLES30.glUniform1i(_sTextureHandle, 0);
        checkGlError(TAG, "glUniform1i sTexture:"+_codecSurface.getTexture()+" handle="+_sTextureHandle);


        //绘制三角形
        GLES20.glDrawElements(GLES20.GL_TRIANGLES, _indexCount, GLES20.GL_UNSIGNED_SHORT, _indexBuffer);
        checkGlError(TAG, "glDrawElements");
    }
    void drawWatermark(){
        GLES20.glUseProgram(_programIcon);
//        GLES20.glClearColor(0,0,1,1);
//        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT| GLES20.GL_DEPTH_BUFFER_BIT);
        GLES30.glEnable(GLES30.GL_BLEND);
        GLES30.glBlendFunc(GLES30.GL_SRC_ALPHA, GLES30.GL_ONE_MINUS_SRC_ALPHA);

        //启用顶点位置数据
        GLES20.glEnableVertexAttribArray(_aPositionHandleIcon);
        GLES30.glVertexAttribPointer(_aPositionHandleIcon, 2, GLES30.GL_FLOAT, false, 2*4, _vertexBufferIcon);
        checkGlError(TAG, "_vertexBufferIcon");
        //启用顶点纹理数据
        GLES20.glEnableVertexAttribArray(_aTexCoorHandleIcon);
        GLES20.glVertexAttribPointer(_aTexCoorHandleIcon, 2, GLES20.GL_FLOAT, false, 2*4, _texCoorBufferIcon);
        checkGlError(TAG, "_texCoorBufferIcon");
        // 纹理
        GLES30.glActiveTexture(GLES30.GL_TEXTURE0);
        checkGlError(TAG, "glActiveTexture:"+_watermarkTexture);
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, _watermarkTexture);
        checkGlError(TAG, "glBindTexture:"+_watermarkTexture);
        GLES30.glUniform1i(_sTextureHandleIcon, 0);
        checkGlError(TAG, "glUniform1i sTexture:"+_watermarkTexture+" handle="+_sTextureHandleIcon);

        //绘制三角形
        GLES30.glDrawArrays(GLES30.GL_TRIANGLE_STRIP, 0, 4);
        GLES30.glDisable(GLES30.GL_BLEND);
        checkGlError(TAG, "glDrawArrays");
    }
    @Override
    public void onDrawFrame(GL10 gl10) {
        IntBuffer oldProgram = IntBuffer.allocate(1);
        GLES20.glGetIntegerv(GLES20.GL_CURRENT_PROGRAM, oldProgram);
        {
            if (_codecSurface != null) {
                drawVideo();
            }
            if (_watermarkTexture != 0){
//                Log.d(TAG, "onDrawFrame: drawWatermark _watermarkTexture="+_watermarkTexture);
                drawWatermark();
            }
        }
        GLES20.glUseProgram(oldProgram.get(0));
        super.onDrawFrame(gl10);
    }

}
