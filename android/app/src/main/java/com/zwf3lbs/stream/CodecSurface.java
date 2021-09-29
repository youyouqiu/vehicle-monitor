package com.zwf3lbs.stream;

import android.graphics.SurfaceTexture;
import android.opengl.GLES11Ext;
import android.opengl.GLES30;
import android.util.Log;
import android.view.Surface;

public class CodecSurface {
	private static final String TAG = CodecSurface.class.getSimpleName();

	private int _textureCodec;
	private SurfaceTexture _surfaceTexture;
	private Surface _surface;

	public Surface getSurface() {
		return _surface;
	}
	public int getTexture() {
		return _textureCodec;
	}

	public void init(SurfaceTexture.OnFrameAvailableListener listener){
		// texture
		int[] tex = GLESHelper.createTexture(1,GLES11Ext.GL_TEXTURE_EXTERNAL_OES);
		_textureCodec = tex[0];
		// surface
		_surfaceTexture = new SurfaceTexture(_textureCodec);
		_surfaceTexture.setOnFrameAvailableListener(listener);
		_surface = new Surface(_surfaceTexture);
	}
	public void releaseObjForCodec(){
		if(_surface!=null){
			_surface.release();
			_surface = null;
		}

		GLESHelper.releaseTexture(_textureCodec);
		_textureCodec = 0;

		_surfaceTexture = null;

	}
	public void updateTexImage(){
		if (_surfaceTexture != null) {
			_surfaceTexture.updateTexImage();
		}
	}

}
