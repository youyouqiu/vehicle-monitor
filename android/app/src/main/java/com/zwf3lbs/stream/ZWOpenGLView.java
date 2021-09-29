package com.zwf3lbs.stream;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.SurfaceTexture;
import android.graphics.drawable.Drawable;
import android.opengl.GLES30;
import android.opengl.GLSurfaceView;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Size;
import android.view.MotionEvent;
import android.view.PixelCopy;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.widget.Toast;

import com.zwf3lbs.stream.surface.EglCore;
import com.zwf3lbs.stream.surface.WindowSurface;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.ref.WeakReference;

public class ZWOpenGLView extends TextureView implements TextureView.SurfaceTextureListener {
    private final static String TAG = "ZW-ZWOpenGLView";
    private Runnable _destroyedRunnable = null;
    private Runnable _createRunnable = null;
    private Runnable _changeRunnable = null;
    RendererBase _renderer;
    GLThreadEGL _glThreadEGL;
    boolean _enableGL = false;
    SurfaceTexture _surfaceTexture;
    Surface _surface;
    Size _viewSize;
    Context _content;
    float _lastX;
    float _lastY;

    public ZWOpenGLView(Context context) {
        super(context);
        init();
        _content = context;
    }

    public ZWOpenGLView(Context context, AttributeSet attributeSet) {
        super(context, attributeSet);
        init();
        _content = context;
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
//        Log.d(TAG, "dispatchTouchEvent: "+event);
//        return true;
        return super.dispatchTouchEvent(event);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        Log.d(TAG, "onTouchEvent: "+event);
        return true;
    }

    private void init(){
        setSurfaceTextureListener(this);
        this.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View view) {
                Log.d(TAG, "onClick: 点击");
            }
        });

        this.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
//                Log.d(TAG, "onTouch: "+event);
                if (event.getAction() == MotionEvent.ACTION_DOWN || event.getAction() == MotionEvent.ACTION_MOVE){
                    v.getParent().requestDisallowInterceptTouchEvent(true);
                } else {
                    v.getParent().requestDisallowInterceptTouchEvent(false);
                }
//                if (true) return true;
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
//                        Log.d(TAG, "onTouch: 按下");
                        _lastX = event.getX();
                        _lastY = event.getY();
                        break;
                    case MotionEvent.ACTION_MOVE:
//                        Log.d(TAG, "onTouch: 移动");
                        float offX = event.getX() - _lastX;
                        float offY = event.getY() - _lastY;

                        _renderer.touchView(offX, offY);
                        ZWOpenGLView.this.requestRender();

                        _lastX = event.getX();
                        _lastY = event.getY();
                        break;
                    case MotionEvent.ACTION_UP:
//                        Log.d(TAG, "onTouch: 抬起");
                        break;
                }
                return true;
            }
        });
    }

    public void setDestroyedRunnable(Runnable runnable){
        _destroyedRunnable = runnable;
    }
    public void setCreateRunnable(Runnable runnable){
        _createRunnable = runnable;
    }
    public void setChangeRunnable(Runnable runnable){
        _changeRunnable = runnable;
    }

    public void setRenderer(RendererBase renderer){
        _renderer = renderer;
        _renderer.view(this);
    }
    public RendererBase getRenderer(){
        return _renderer;
    }
    public SurfaceTexture getSurfaceTexture(){
        return _surfaceTexture;
    }
    public void setEnableGL(boolean b) {
        _enableGL = b;
    }
    public boolean getEnableGL(){
        return _enableGL;
    }

    public Surface getSurface() {
        return _surface;
    }

    public Size getViewSize() {
        return _viewSize;
    }

    @Override
    public void setBackgroundColor(int color) {
//        super.setBackgroundColor(color);
    }

    @Override
    public void setBackground(Drawable background) {
//        super.setBackground(background);
    }

    @TargetApi(Build.VERSION_CODES.N)
    public void capture() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            Toast toast = Toast.makeText(ZWOpenGLView.this.getContext(),
                    "Android版本不支持", Toast.LENGTH_LONG);
            toast.show();
            return;
        }
        CaptureTask task = new CaptureTask(this);
        task.execute(this.getWidth(), this.getHeight());

    }

    public void drawBitmap(Bitmap img){
        Canvas canvas = _surface.lockHardwareCanvas();
        canvas.drawBitmap(img, 0,0,null);
        _surface.unlockCanvasAndPost(canvas);
    }

    public void requestRender(){
        if (_glThreadEGL != null) {
            _glThreadEGL.render();
        }
    }
    public void queueGL(Runnable runnable){
        if (_enableGL && _glThreadEGL != null) {
            _glThreadEGL.queueEvent(runnable);
        }
    }

    @Override
    public void onSurfaceTextureAvailable(SurfaceTexture surfaceTexture, int i, int i1) {
        Log.d(TAG, "onSurfaceTextureAvailable: _renderer="+_renderer+",_enableGL="+_enableGL);
        _surfaceTexture = surfaceTexture;
        _viewSize = new Size(i, i1);
        _surface = new Surface(surfaceTexture);

        if (_createRunnable != null){
            _createRunnable.run();
        }
        if (!_enableGL) {

        } else {
            if (_glThreadEGL == null){
                _glThreadEGL = new GLThreadEGL();
                _glThreadEGL.start();
                _glThreadEGL.initRenderer(surfaceTexture);
                Log.d(TAG, "onSurfaceTextureAvailable: _glThreadEGL.queueEvent");
                _glThreadEGL.queueEvent(new Runnable() {
                    @Override
                    public void run() {
                        Log.d(TAG, "onSurfaceTextureAvailable: _glThreadEGL.queueEvent _renderer="+_renderer);
                        if (_renderer != null) {
                            _renderer.onSurfaceChanged(null, i, i1);
                        }
                    }
                });
            }
        }
    }

    @Override
    public void onSurfaceTextureSizeChanged(SurfaceTexture surfaceTexture, int i, int i1) {
        Log.d(TAG, "onSurfaceTextureSizeChanged: ");
        _viewSize = new Size(i, i1);
        if (_changeRunnable != null){
            _changeRunnable.run();
        }
        if (_renderer != null){
            if (_glThreadEGL != null){
                _glThreadEGL.queueEvent(new Runnable() {
                    @Override
                    public void run() {
                        _renderer.onSurfaceChanged(null, i, i1);
                    }
                });
            }
        }
    }

    @Override
    public boolean onSurfaceTextureDestroyed(SurfaceTexture surfaceTexture) {
        Log.d(TAG, "onSurfaceTextureDestroyed: ");
        if (_destroyedRunnable!=null) {
            _destroyedRunnable.run();
        }
        if (_surface!=null){
            _surface.release();
            _surface = null;
        }
        if (_glThreadEGL != null){
            _glThreadEGL.queueEvent(new Runnable() {
                @Override
                public void run() {
                    _renderer.release();
                }
            });
            _glThreadEGL.destroyedRenderer();
            _glThreadEGL = null;
        }
        return false;
    }

    @Override
    public void onSurfaceTextureUpdated(SurfaceTexture surfaceTexture) {

    }

    private static class CaptureTask extends AsyncTask<Integer, Void, Void> {

        private final WeakReference<ZWOpenGLView> view;

        private CaptureTask(ZWOpenGLView view) {
            this.view = new WeakReference<>(view);
        }

        @TargetApi(Build.VERSION_CODES.N)
        @Override
        protected Void doInBackground(Integer... params) {
            // Create a bitmap the size of the scene view.
            final Bitmap bitmap = Bitmap.createBitmap(params[0], params[1], Bitmap.Config.ARGB_8888);

            // Create a handler thread to offload the processing of the image.
            final HandlerThread handlerThread = new HandlerThread("PixelCopier");
            handlerThread.start();

            Surface surface = new Surface(view.get().getSurfaceTexture());
            // Make the request to copy.
            PixelCopy.request(surface, bitmap, new PixelCopy.OnPixelCopyFinishedListener() {
                @Override
                public void onPixelCopyFinished(int copyResult) {
                    if (copyResult == PixelCopy.SUCCESS) {
                        Log.e(TAG, bitmap.toString());
                        String name = System.currentTimeMillis() + ".jpg";
                        File imageFile = store(bitmap, name);
                        Log.d(TAG, "store file: " + imageFile.getPath());
                    } else {
                        Toast toast = Toast.makeText(view.get().getContext(),
                                                     "Failed to copyPixels: " + copyResult, Toast.LENGTH_LONG);
                        toast.show();
                    }
                    surface.release();
                    handlerThread.quitSafely();
                }
            }, new Handler(handlerThread.getLooper()));
            return null;
        }

        private File store(Bitmap bitmap, String name) {
            File image = new File(Environment.getExternalStorageDirectory() + "/" + Environment.DIRECTORY_DCIM + "/" + name);
            FileOutputStream fos;
            try {
                fos = new FileOutputStream(image);
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
                fos.flush();
                fos.close();
            } catch (IOException e) {
                Log.e(TAG, e.getMessage(), e);
            }
            return image;
        }
    }

    private class GLThreadEGL extends Thread {
        private long _threadid;
        private String TAG = "ZW-GLThreadEGL";

        private EglCore mEglCore;
        private WindowSurface _displaySurface;

        SurfaceTexture _surfaceTemp = null;

        boolean _stopped = false;

        boolean _needRenderOne = false;
        Object _renderLock = new Object();

        boolean _needInit = false;
        Object _initLock = new Object();

        boolean _needDestroyed = false;
        Object _destroyedLock = new Object();

        boolean _needQueueEvent = false;
        Object _queueEventLock = new Object();
        Runnable _queueEventTmp;

        public void queueEvent(Runnable runnable){
            if (_threadid == Thread.currentThread().getId()) {
                _queueEvent(runnable);
            } else {
                synchronized (_queueEventLock) {
                    _queueEventTmp = runnable;
                    _needQueueEvent = true;
                    try {
                        _queueEventLock.wait();
                    } catch (InterruptedException ie) {
                        Log.w(TAG, "Error queueEvent.");
                    }
                }
            }
        }
        public void initRenderer(SurfaceTexture surface) {
            if (_threadid == Thread.currentThread().getId()) {
                _initRenderer(surface);
            } else {
                synchronized (_initLock) {
                    _surfaceTemp = surface;
                    _needInit = true;
                    try {
                        _initLock.wait();
                    } catch (InterruptedException ie) {
                        Log.w(TAG, "Error init wait.");
                    }
                }
            }
        }

        public void render() {
            if (_stopped)
                return;
            if (_threadid == Thread.currentThread().getId()) {
                _render();
            } else {
                synchronized (_renderLock) {
                    _needRenderOne = true;
                }
            }
        }

        public void destroyedRenderer() {
            if (_stopped)
                return;
            if (_threadid == Thread.currentThread().getId()) {
                _destroyedRenderer();
                _stopped = true;
            } else {
                synchronized (_destroyedLock) {
                    _needDestroyed = true;
                    try {
                        _destroyedLock.wait();
                        Log.d(TAG, "[destroyedRenderer] after wait");
                    } catch (InterruptedException ie) {
                        Log.w(TAG, "Error destroyed wait.");
                    }
                }
            }
        }

        @Override
        public void run() {
            _threadid = Thread.currentThread().getId();
            while (!_stopped) {

                synchronized (_queueEventLock) {
                    if (_needQueueEvent) {
                        _queueEvent(_queueEventTmp);
                        _needQueueEvent = false;
                        _queueEventLock.notify();
                    }
                }
                synchronized (_renderLock) {
                    if (_needRenderOne) {
                        _render();
                        _needRenderOne = false;
                        _renderLock.notify();
                    }
                }
                synchronized (_initLock) {
                    if (_needInit && _surfaceTemp != null) {
                        _initRenderer(_surfaceTemp);
                        _needInit = false;
                        _initLock.notify();
                    }
                }

                synchronized (_destroyedLock) {
                    if (_needDestroyed) {
                        _destroyedRenderer();
                        _needDestroyed = false;
                        _destroyedLock.notify();
                        _stopped = true;
                    }
                }
            }

            Log.d(TAG, "[run] end");
        }

        private void _queueEvent(Runnable runnable){
            Log.d(TAG, "[_queueEvent] runnable");
            if (runnable != null) {
                runnable.run();
            }
        }
        private void _render() {
            if (_displaySurface == null)
                return;

            _displaySurface.makeCurrent();
            if (_renderer!=null){
                _renderer.onDrawFrame(null);
            }
//            GLES30.glClearColor(1,1,1,1);
//            GLES30.glClear(GLES30.GL_COLOR_BUFFER_BIT| GLES30.GL_DEPTH_BUFFER_BIT);
            _displaySurface.swapBuffers();
        }

        private void _initRenderer(SurfaceTexture surface) {
            Log.d(TAG, "[Renderer] init");
            mEglCore = new EglCore(null, EglCore.FLAG_RECORDABLE);
            _displaySurface = new WindowSurface(mEglCore, surface, false);
            _displaySurface.makeCurrent();

            if (_renderer!=null){
                _renderer.onSurfaceCreated(null, null);
            }
        }

        private void _destroyedRenderer() {

            if (mEglCore == null)
                return;

            if (_renderer != null) {
                _renderer.release();
            }


            Log.d(TAG, "[surfaceDestroyed] _displaySurface");
            if (_displaySurface != null) {
                _displaySurface.makeCurrent();
                GLES30.glClearColor(1,1,1,0);
                GLES30.glClear(GLES30.GL_COLOR_BUFFER_BIT| GLES30.GL_DEPTH_BUFFER_BIT);
                _displaySurface.swapBuffers();
                _displaySurface.release();
                _displaySurface = null;
            }

            Log.d(TAG, "[surfaceDestroyed] mEglCore");
            if (mEglCore != null) {
                mEglCore.release();
                mEglCore = null;
            }
            Log.d(TAG, "[surfaceDestroyed] mEgl");
        }
    }
}
