package com.zwf3lbs.stream;

import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecInfo.CodecCapabilities;
import android.media.MediaFormat;
import android.util.Log;
import android.view.Surface;
import android.view.SurfaceHolder;

import java.io.IOException;
import java.nio.ByteBuffer;

public class VideoDecoder {
    private final String TAG = this.getClass().getSimpleName();

    //解码后显示的surface及其宽高
    private Surface _surface;
    private int width, height;
    //解码器
    private MediaCodec mCodec;
    private boolean isFirst = true;
    // 需要解码的类型
    private final static String MIME_TYPE = "video/avc"; // H.264 Advanced Video
    private final static int TIME_INTERNAL = 5;
    private DecoderEventCallback _runnable = null;

    /**
     * 初始化解码器
     *
     * @param width  surface宽
     * @param height surface高
     */
    public VideoDecoder(int width, int height) {
//        logger.d("MediaCodecUtil() called with: " + "holder = [" + holder + "], " +
//                "width = [" + width + "], height = [" + height + "]");
        this.width = width;
        this.height = height;
    }
    public VideoDecoder(SurfaceHolder holder, int width, int height) {
//        logger.d("MediaCodecUtil() called with: " + "holder = [" + holder + "], " +
//                "width = [" + width + "], height = [" + height + "]");
        this._surface = holder.getSurface();
        this.width = width;
        this.height = height;
    }
    public VideoDecoder(Surface surface, int width, int height) {
//        logger.d("MediaCodecUtil() called with: " + "holder = [" + holder + "], " +
//                "width = [" + width + "], height = [" + height + "]");
        this._surface = surface;
        this.width = width;
        this.height = height;
    }
    public VideoDecoder(SurfaceHolder holder) {
        this(holder, holder.getSurfaceFrame().width(), holder.getSurfaceFrame().height());
    }

    public void setOnImageRunnable(DecoderEventCallback runnable){
        _runnable = runnable;
    }
    public void setSurface(Surface surface){
        this._surface = surface;
    }
    public void startCodec() throws IOException {
        if (isFirst) {
            isFirst = false;
            //第一次打开则初始化解码器
            initDecoder();
        }
    }

    public void initDecoder() throws IOException {
        mCodec = MediaCodec.createDecoderByType(MIME_TYPE);
        //初始化MediaFormat
        MediaFormat mediaFormat = MediaFormat.createVideoFormat(MIME_TYPE,
                width, height);
        //配置MediaFormat以及需要显示的surface
//        mCodec.configure(mediaFormat, null, null, 0);
        mCodec.configure(mediaFormat, _surface, null, 0);
        //开始解码
        mCodec.start();
    }

    int mCount = 0;


    public boolean onFrame(byte[] buf, int offset, int length) {
        // 获取输入buffer index
        //-1表示一直等待；0表示不等待；其他大于0的参数表示等待毫秒数
        int inputBufferIndex = mCodec.dequeueInputBuffer(-1);
        if (inputBufferIndex >= 0) {
            ByteBuffer inputBuffer = mCodec.getInputBuffer(inputBufferIndex);
            //清空buffer
            inputBuffer.clear();
            //put需要解码的数据
            inputBuffer.put(buf, offset, length);
            //解码
            mCodec.queueInputBuffer(inputBufferIndex, 0, length, mCount * TIME_INTERNAL, 0);
            mCount++;

        } else {
            return false;
        }
        // 获取输出buffer index
        MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
        int outputBufferIndex = mCodec.dequeueOutputBuffer(bufferInfo, 100);
        //循环解码，直到数据全部解码完成
        while (outputBufferIndex >= 0) {
            //logger.d("outputBufferIndex = " + outputBufferIndex);
            if (_runnable != null) {
                ByteBuffer outputBuffer =  mCodec.getOutputBuffer(outputBufferIndex);
                if (null != outputBuffer) {
                    outputBuffer.position(bufferInfo.offset);
                    outputBuffer.limit(bufferInfo.offset + bufferInfo.size);

                    int bsize = outputBuffer.limit() - outputBuffer.position();
                    int bsize2 = bufferInfo.size;
                    Log.d(TAG, "onFrame: bsize="+bsize+",bsize2="+bsize2+",this.width="+this.width+",this.height="+this.height);
//                    byte[] bytes = new byte[bsize];
//                    outputBuffer.get(bytes, 0, bsize);
//                    byte[] bArr = yuv420p_to_bgra(bytes, this.width, this.height);
//                    _runnable.onFrame(bArr);
                }
            }
            //true : 将解码的数据显示到surface上
            mCodec.releaseOutputBuffer(outputBufferIndex, _surface!=null);
//            mCodec.releaseOutputBuffer(outputBufferIndex, true);
            outputBufferIndex = mCodec.dequeueOutputBuffer(bufferInfo, 0);
        }
        if (outputBufferIndex < 0) {
            //logger.e("outputBufferIndex = " + outputBufferIndex);
        }
        return true;
    }

    /**
     *停止解码，释放解码器
     */
    public void stopCodec() {

        try {
            isFirst = true;
            if (mCodec != null) {
                mCodec.stop();
                mCodec.release();
                mCodec = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "stopCodec: error", e);
            e.printStackTrace();
            mCodec = null;
        }
    }

    public byte[] yuv420p_to_bgra(byte[] bytes, int width, int height) {

        int frameSize = width * height;
        byte[] dst = new byte[frameSize << 2];

        int y_i = 0;
        int u_i = frameSize;
        int v_i = u_i + (frameSize >> 2);
        int stripUV = width >> 1;

        // _log.i("yuv2rgb_func u=%d,v=%d.", u_i, v_i);

        int dst_i = 0;
        int y, u, v, r, g, b;
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                y = bytes[y_i] & 0xff;
                y_i++;

                int uvPosW = j >> 1;
                int uvPosH = i >> 1;

                int offsetUV = (uvPosH * stripUV) + uvPosW;
                // _log.i("yuv2rgb_func i=%d,j=%d,uv_offset=%d.", i, j,
                // offsetUV);
                u = bytes[offsetUV + u_i] & 0xff;// 0x80;//
                v = bytes[offsetUV + v_i] & 0xff;// 0x80;//

                r = (int) (1.166f * (y - 16) + 1.596f * (v - 128));
                g = (int) (1.164f * (y - 16) - 0.813f * (v - 128) - 0.391f * (u - 128));
                b = (int) (1.164f * (y - 16) + 2.018f * (u - 128));
                r = r < 0 ? 0 : r > 255 ? 255 : r;
                g = g < 0 ? 0 : g > 255 ? 255 : g;
                b = b < 0 ? 0 : b > 255 ? 255 : b;

                dst[dst_i++] = (byte) b;
                dst[dst_i++] = (byte) g;
                dst[dst_i++] = (byte) r;
                dst[dst_i++] = (byte) 255;
            }
        }
        return dst;
    }


    public interface DecoderEventCallback {
        public void onFrame(byte[] buf);
    }
}
