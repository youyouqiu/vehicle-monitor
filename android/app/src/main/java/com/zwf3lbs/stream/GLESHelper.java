package com.zwf3lbs.stream;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.opengl.GLES30;
import android.util.Log;

import com.zwf3lbs.zwf3lbsapp.MainApplication;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

public class GLESHelper {
    private static final String TAG = GLESHelper.class.getSimpleName();
    /**
     * 通过uri获取图片并进行压缩
     *
     * @param uri
     */
    public static Bitmap getBitmapFormUri(Context ac, Uri uri) throws FileNotFoundException, IOException {
        InputStream input = ac.getContentResolver().openInputStream(uri);
        BitmapFactory.Options onlyBoundsOptions = new BitmapFactory.Options();
        onlyBoundsOptions.inJustDecodeBounds = true;
        onlyBoundsOptions.inDither = true;//optional
        onlyBoundsOptions.inPreferredConfig = Bitmap.Config.ARGB_8888;//optional
        BitmapFactory.decodeStream(input, null, onlyBoundsOptions);
        input.close();
        int originalWidth = onlyBoundsOptions.outWidth;
        int originalHeight = onlyBoundsOptions.outHeight;
        if ((originalWidth == -1) || (originalHeight == -1))
            return null;
        //图片分辨率以480x800为标准
        float hh = 800f;//这里设置高度为800f
        float ww = 480f;//这里设置宽度为480f
        //缩放比。由于是固定比例缩放，只用高或者宽其中一个数据进行计算即可
        int be = 1;//be=1表示不缩放
        if (originalWidth > originalHeight && originalWidth > ww) {//如果宽度大的话根据宽度固定大小缩放
            be = (int) (originalWidth / ww);
        } else if (originalWidth < originalHeight && originalHeight > hh) {//如果高度高的话根据宽度固定大小缩放
            be = (int) (originalHeight / hh);
        }
        if (be <= 0)
            be = 1;
        //比例压缩
        BitmapFactory.Options bitmapOptions = new BitmapFactory.Options();
        bitmapOptions.inSampleSize = be;//设置缩放比例
        bitmapOptions.inDither = true;//optional
        bitmapOptions.inPreferredConfig = Bitmap.Config.ARGB_8888;//optional
        input = ac.getContentResolver().openInputStream(uri);
        Bitmap bitmap = BitmapFactory.decodeStream(input, null, bitmapOptions);
        input.close();

        return bitmap;//再进行质量压缩
    }
	public static int[] createTexture(int count, int type){
        int[] textures = new int[count];
        GLES30.glGenTextures(count, textures, 0);
        int texType = type;
        for(int i=0;i<count;i++){
            GLES30.glBindTexture(texType, textures[i]);
            checkGlError("glBindTexture mTextureID");

            GLES30.glTexParameterf(texType, GLES30.GL_TEXTURE_MIN_FILTER,
                    GLES30.GL_NEAREST);
            GLES30.glTexParameterf(texType, GLES30.GL_TEXTURE_MAG_FILTER,
                    GLES30.GL_LINEAR);
            GLES30.glTexParameteri(texType, GLES30.GL_TEXTURE_WRAP_S,
                    GLES30.GL_CLAMP_TO_EDGE);
            GLES30.glTexParameteri(texType, GLES30.GL_TEXTURE_WRAP_T,
                    GLES30.GL_CLAMP_TO_EDGE);
            checkGlError("glTexParameter");
            
            Log.d(TAG, "gen texture("+count+") id:"+textures[i]);
        }
        
        return textures;
	}
	

	public static void releaseTexture(int texid)  
    {  
        int[] texture = {texid};  
        GLES30.glDeleteTextures(1, texture, 0);
    }  


    public static void checkGlError(String op) {
        int error;
        while ((error = GLES30.glGetError()) != GLES30.GL_NO_ERROR) {
            Log.e(TAG, op + ": glError " + error);
            throw new RuntimeException(op + ": glError " + error);
        }
    }
}
