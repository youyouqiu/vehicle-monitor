package com.zwf3lbs.stream;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecInfo.CodecCapabilities;
import android.media.MediaFormat;
import android.os.Build;
import android.util.Log;
import android.view.Surface;

import java.nio.ByteBuffer;

//getKnownCodecList
//https://github.com/abirjepatil/iOS/blob/b7402a63e9d7d4ee31f970970e6072955031c299/android/ijkmediaplayer/src/tv/danmaku/ijk/media/player/IjkMediaPlayer.java
@TargetApi(Build.VERSION_CODES.JELLY_BEAN)
@SuppressWarnings("deprecation")
public class H264Decoder {
	private final String TAG = this.getClass().getSimpleName();

	private DecoderEventCallback mEventCallback;
	private boolean _decoding = false;
	private final int TIMEOUT_USEC = 10000;// 10ms
	public static final String MIME_TYPE = "video/avc"; // H.264 Advanced Video

															// Coding
	private boolean _isSupportHW = false;
	private MediaCodec mDecoder = null;
	private MediaFormat _mediaFormat = null;
	private int _decodeWidth;
	private int _decodeHeight;
	private byte[] codec_sps = null;
	private byte[] codec_pps = null;
	private long startMs = 0;
	private String decodec_name = null;
	private static final String csd_buffer_0 = "csd-0";
	private static final String csd_buffer_1 = "csd-1";

	public H264Decoder() {
		_isSupportHW = isSupportHW(0, 0);
	}

	public boolean init(int width, int height) throws Exception {
		Log.i(TAG, "codec init w:" + width + " h:" + height);

		_isSupportHW = isSupportHW(width, height);
		if (_isSupportHW && null != decodec_name)
			mDecoder = MediaCodec.createByCodecName(decodec_name);
		else
			mDecoder = MediaCodec.createDecoderByType(MIME_TYPE);

		Log.d(TAG, "find color format.");

		_decodeWidth = width;
		_decodeHeight = height;
		_mediaFormat = MediaFormat.createVideoFormat(MIME_TYPE, width, height);// for
																				// video/avc
		if (null != codec_sps) {
			_mediaFormat.setByteBuffer(csd_buffer_0, ByteBuffer.wrap(codec_sps));// sps
		}
		if (null != codec_pps) {
			_mediaFormat.setByteBuffer(csd_buffer_1, ByteBuffer.wrap(codec_pps));// pps
		}

		Log.i(TAG, "init TestDecoder successful");
		return true;
	}

	public void setCallback(DecoderEventCallback callback) {
		mEventCallback = callback;
	}

	public boolean isDecoding() {
		return _decoding;
	}

	int fileIndex = 1;
	boolean writefile = false;

	public void startDecode(Surface surface, int videoScalingMode) {
		Log.i(TAG,"codec startDecode");
		if (_decoding)
			return;
		if (_mediaFormat == null || mDecoder == null) {
			Log.e(TAG,"Failed to start decoder, decoder:"+(mDecoder == null ? 0 : 1)+", format:"+(_mediaFormat == null ? 0 : 1));
			return;
		}
		mDecoder.configure(_mediaFormat, surface, null, 0);

		mDecoder.setVideoScalingMode(MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT);
		if (videoScalingMode == MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT)
			mDecoder.setVideoScalingMode(MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT);
		else if (videoScalingMode == MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING)
			mDecoder.setVideoScalingMode(MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING);

		mDecoder.start();
		startMs = System.currentTimeMillis();
		_decoding = true;

		// writefile = true;
	}

	public void stopDecode() {
		Log.i(TAG,"stopDecode ");
		if (!_decoding)
			return;
		Log.i(TAG,"stopDecode +");

		if (mDecoder != null) {
			Log.i(TAG,"stopDecode ++");
			mDecoder.flush();
			Log.i(TAG,"stopDecode +++");
			mDecoder.stop();
			Log.i(TAG,"stopDecode ++++");
			_decoding = false;
		}
		Log.i(TAG,"stopDecode +++++");
	}

	public boolean isSupportHW() {
		return _isSupportHW;
	}
	
	public boolean isSupportHW(int w, int h) {
		decodec_name = CodecUtils.selectBestDecoder(MIME_TYPE,w,h);
		Log.d(TAG,"isSupportHW name:" + decodec_name);
		if (null != decodec_name)
			return true;
		return false;
	}

	public void setByteBuffer(String key, byte[] data, int offset) {
		if (null == data || data.length == 0)
			return;
		if (null != codec_sps) {
			codec_sps = null;
		}
		if (null != codec_pps) {
			codec_pps = null;
		}
		if (csd_buffer_0.equals(key)) {
			codec_sps = new byte[data.length - offset];
			System.arraycopy(data, offset, codec_sps, 0, data.length - offset);
		} else if (csd_buffer_1.equals(key)) {
			codec_pps = new byte[data.length - offset];
			System.arraycopy(data, offset, codec_pps, 0, data.length - offset);
		}
//		Log.w(TAG,"The csd setting key="+key+" data legnth="+data.length+" offset="+offset);
//		String strLog = "";
//		for(int i=offset; i<data.length; i++) {
//			strLog+= String.format("%d", data[i]) + " ";
//		}
//		Log.w(TAG,strLog);
	}

	// Synchronous Processing using Buffer Arrays (deprecated)
	// Codec-specific Data BUFFER_FLAG_CODEC_CONFIG
	public void onFrame(byte[] buf, int offset, int length, int flag,
			boolean render) throws Exception {
		Log.v(TAG,"codec onFrame");
		ByteBuffer[] inputBuffers = mDecoder.getInputBuffers();
		ByteBuffer[] outputBuffers = mDecoder.getOutputBuffers();
		int inputBufferIndex = mDecoder.dequeueInputBuffer(TIMEOUT_USEC);
		if (inputBufferIndex >= 0) {
			ByteBuffer inputBuffer = inputBuffers[inputBufferIndex];// inputBuffers[inputBufferIndex];
			if (buf != null) {
				inputBuffer.clear();
				inputBuffer.put(buf, offset, length);// java.nio.BufferOverflowException
				// mDecoder.queueInputBuffer(inputBufferIndex, 0, length, mCount
				// * 1000000 / FRAME_RATE , flag);

				mDecoder.queueInputBuffer(inputBufferIndex, 0, length,
						(System.currentTimeMillis() - startMs) * 1000, flag);
			} else {
				Log.v(TAG,"onFrame queueInputBuffer BUFFER_FLAG_END_OF_STREAM");
				mDecoder.queueInputBuffer(inputBufferIndex, 0, 0, 0, flag);
			}
			// mCount ++;
		}

		MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
		int outputBufferIndex = mDecoder.dequeueOutputBuffer(bufferInfo,
				TIMEOUT_USEC);

		if (outputBufferIndex == MediaCodec.INFO_OUTPUT_BUFFERS_CHANGED) {
			// outputBuffers = mDecoder.getOutputBuffers();
			Log.w(TAG,"onFrame output buffers changed");
		} else if (outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
			MediaFormat decoderOutputFormat = mDecoder.getOutputFormat();
			Log.w(TAG,"onFrame output format changed: " + decoderOutputFormat);
		} else if (outputBufferIndex == MediaCodec.INFO_TRY_AGAIN_LATER) {
			Log.w(TAG,"onFrame decode timeout");
		}
		Log.v(TAG,"onFrame outputBuffer size=" + bufferInfo.size + " flag=" + flag
				+ " outputBufferIndex:" + outputBufferIndex);
		while (outputBufferIndex >= 0) {
			ByteBuffer outputBuffer = outputBuffers[outputBufferIndex];
			if (null != outputBuffer) {
				outputBuffer.position(bufferInfo.offset);
				outputBuffer.limit(bufferInfo.offset + bufferInfo.size);
			}
			if (mEventCallback != null && mEventCallback.onFrameReady()) {
				Log.v(TAG,"callback frame");
				int bsize = outputBuffer.limit() - outputBuffer.position();
				byte[] bytes = new byte[bsize];
				outputBuffer.get(bytes, 0, bsize);
				byte[] bArr = yuv420p_to_bgra(bytes, _decodeWidth,
						_decodeHeight);
				mEventCallback.onFrame(bArr);
			}
			Log.v(TAG,"mDecoder.releaseOutputBuffer");
			mDecoder.releaseOutputBuffer(outputBufferIndex, render);// render);
			outputBufferIndex = mDecoder.dequeueOutputBuffer(bufferInfo,
					TIMEOUT_USEC);
		}
	}

	public boolean release() throws Exception {
		Log.i(TAG,"release decoder objects+");
		if (mDecoder != null) {
			Log.i(TAG,"release decoder ++");
			stopDecode();

			Log.i(TAG,"release decoder +++");
			mDecoder.release();
			Log.i(TAG,"release decoder ++++");
			mDecoder = null;
			return true;
		}
		Log.i(TAG,"release decoder objects false");
		return false;
	}

	/**
	 * Clears the playback surface to black.
	 */
	// https://github.com/google/grafika/blob/master/src/com/android/grafika/PlayMovieSurfaceActivity.java
	public void clearSurface(Surface surface) {
		// We need to do this with OpenGL ES (*not* Canvas -- the
		// "software render" bits
		// are sticky). We can't stay connected to the Surface after we're done
		// because
		// that'd prevent the video encoder from attaching.
		//
		// If the Surface is resized to be larger, the new portions will be
		// black, so
		// clearing to something other than black may look weird unless we do
		// the clear
		// post-resize.
		/*
		 * EglCore eglCore = new EglCore(); WindowSurface win = new
		 * WindowSurface(eglCore, surface, false); win.makeCurrent();
		 * GLES20.glClearColor(0, 0, 0, 0);
		 * GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT); win.swapBuffers();
		 * win.release(); eglCore.release();
		 */
	}

	@SuppressLint("InlinedApi")
	private int selectColorFormat(MediaCodecInfo codecInfo, String mimeType) {
		int result = 0;
		CodecCapabilities capabilities = codecInfo
				.getCapabilitiesForType(mimeType);

		// rgb(rgb mediacodec编码有点问题,暂时不用)
		for (int i = 0; i < capabilities.colorFormats.length; i++) {
			int colorFormat = capabilities.colorFormats[i];
			Log.i(TAG,"[selectColorFormat] colorFormat:"
					+ CodecUtils.colorFormatName(colorFormat));
			if (CodecUtils.isRecognizedFormatRGB(colorFormat) && result == 0) {
				result = colorFormat;
			}
		}
		// yuv
		if (result == 0) {
			// for (int i = 0; i < capabilities.colorFormats.length; i++) {
			// int colorFormat = capabilities.colorFormats[i];
			// if (TestUtils.isRecognizedFormatYUV(colorFormat)) {
			// return colorFormat;
			// }
			// }
		} else {
			return result;
		}
		return 0; // not reached
	}

	public byte[] yuv420p_to_bgra(byte[] bytes, int width, int height) {

		int frameSize = width * height;
		byte[] dst = new byte[frameSize << 2];

		int y_i = 0;
		int u_i = frameSize;
		int v_i = u_i + (frameSize >> 2);
		int stripUV = width >> 1;

		// Log.i(TAG,"yuv2rgb_func u=%d,v=%d.", u_i, v_i);

		int dst_i = 0;
		int y, u, v, r, g, b;
		for (int i = 0; i < height; i++) {
			for (int j = 0; j < width; j++) {
				y = bytes[y_i] & 0xff;
				y_i++;

				int uvPosW = j >> 1;
				int uvPosH = i >> 1;

				int offsetUV = (uvPosH * stripUV) + uvPosW;
				// Log.i(TAG,"yuv2rgb_func i=%d,j=%d,uv_offset=%d.", i, j,
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

		public boolean onFrameReady();
	}
}
