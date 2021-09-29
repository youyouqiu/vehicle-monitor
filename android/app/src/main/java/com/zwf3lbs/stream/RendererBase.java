package com.zwf3lbs.stream;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.SurfaceTexture;
import android.net.Uri;
import android.opengl.GLES30;
import android.opengl.GLSurfaceView;
import android.opengl.GLUtils;
import android.util.Log;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.nio.IntBuffer;
import java.nio.ShortBuffer;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class RendererBase implements GLSurfaceView.Renderer, SurfaceTexture.OnFrameAvailableListener {
    private final static String TAG = "ZW-RendererBase";

    protected final String vertexShaderCodeDefault =
"attribute vec3 aPosition;	                                  \n"+
"attribute vec2 aTexCoor;	                                  \n"+
"varying vec2 vTextureCoord;	                              \n"+
"void main()     	                                          \n"+
"{  			                          		              \n "+
"	gl_Position =  vec4(aPosition, 1)  ;	                  \n"+
"	vTextureCoord = aTexCoor;	                              \n"+
"}	                                                          \n";
protected final String fragmentShaderCodeDefault =
"precision mediump float;                                    \n"+
"varying vec2 vTextureCoord;                                 \n"+
"uniform sampler2D sTexture;                        \n"+
"void main()                                                 \n"+
"{                                                           \n"+
"	gl_FragColor = texture2D(sTexture, vTextureCoord);       \n"+
"}                                                           \n"
;
    protected final String fragmentShaderCodeOES =
"#extension GL_OES_EGL_image_external : require              \n"+
"precision mediump float;                                    \n"+
"varying vec2 vTextureCoord;                                 \n"+
"uniform samplerExternalOES sTexture;                        \n"+
"void main()                                                 \n"+
"{                                                           \n"+
"	gl_FragColor = texture2D(sTexture, vTextureCoord);       \n"+
"}                                                           \n"
;
    protected final String vertexShaderCodeMVP =
"uniform mat4 uMVPMatrix;	                                  "+
"attribute vec3 aPosition;	                                  "+
"attribute vec2 aTexCoor;	                                  "+
"varying vec2 vTextureCoord;	                              "+
"void main()     	                                          "+
"{  			                          		              "+
"	gl_Position =  uMVPMatrix * vec4(aPosition,1)  ;	      "+
"	vTextureCoord = aTexCoor;	                              "+
"}	                                                          ";

    protected CodecSurface _codecSurface;
    protected Callback _c;
    protected ZWOpenGLView _view;
    protected Bitmap _watermarkImage;
    protected int _watermarkTexture;


    File _storeDir;
    public void setDir(File dir ){
        _storeDir = dir;
    }

    public void setWatermark(Bitmap img){
        Log.d(TAG, "setWatermark: imgPath = "+img);
        if (_watermarkImage != img){
            if (_watermarkImage != null){
                _watermarkImage.recycle();
            }
            _watermarkImage = img;
            if (_view != null) {
                _view.queueGL(new Runnable() {
                    @Override
                    public void run() {
                        if (_watermarkTexture != 0){
                            GLESHelper.releaseTexture(_watermarkTexture);
                        }
                        if (_watermarkImage != null){
                            Log.d(TAG, "setWatermark: _watermarkImage = "+_watermarkImage);
                            _watermarkTexture = createTexture(_watermarkImage);
                            Log.d(TAG, "setWatermark: _watermarkTexture = "+_watermarkTexture);
                        }
                    }
                });
            }
        }
    }

    public int loadShader(int type, String shaderCode){
        //根据type创建顶点着色器或者片元着色器
        int shader = GLES30.glCreateShader(type);
        if (!checkGlError(TAG, "glCreateShader")){
            return 0;
        }
        //将资源加入到着色器中，并编译
        GLES30.glShaderSource(shader, shaderCode);
        if (!checkGlError(TAG, "glShaderSource")){
            return 0;
        }
        GLES30.glCompileShader(shader);
        if (!checkGlError(TAG, "glCompileShader")){
            return 0;
        }

        IntBuffer compiled = IntBuffer.allocate(1);
        GLES30.glGetShaderiv(shader, GLES30.GL_COMPILE_STATUS, compiled);
        if (compiled.get(0) == GLES30.GL_FALSE){
            String msg = GLES30.glGetShaderInfoLog(shader);
            GLES30.glDeleteShader(shader);
            Log.e(TAG, "loadShader: glDeleteShader:"+msg);
            return 0;
        }
        return shader;
    }

    public boolean checkGlError(String prefix, String funcName){
        int err = GLES30.glGetError();
        if (err != GLES30.GL_NO_ERROR) {
            Log.e(prefix, String.format("checkGlError: %s GL error after %s(): 0x%08x", prefix, funcName, err));
            return false;
        }
        return true;
    }

    public void touchView(float x, float y){}

    public boolean checkGlLocation(String prefix, String locName, int loc)
    {
        if(loc < 0)
        {
            Log.e(prefix, String.format("%s GL location error:%s", prefix, locName));
            return false;
        }
        return true;
    }

    public int createTexture(Bitmap bmptexture) {
        int []  mTextures = new int[1];
        GLES30.glGenTextures(1, mTextures, 0);
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, mTextures[0]);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_S,
                GLES30.GL_CLAMP_TO_EDGE);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_T,
                GLES30.GL_CLAMP_TO_EDGE);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MIN_FILTER,
                GLES30.GL_NEAREST);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MAG_FILTER,
                GLES30.GL_NEAREST);

        GLUtils.texImage2D(GLES30.GL_TEXTURE_2D, 0, bmptexture, 0);
        return mTextures[0];
    }

    public static IntBuffer makeBuffer(int[] arr) {
        ByteBuffer bb = ByteBuffer.allocateDirect(arr.length * (Integer.SIZE/8));
        bb.order(ByteOrder.nativeOrder());
        IntBuffer ib = bb.asIntBuffer();
        ib.put(arr);
        ib.position(0);
        return ib;
    }
    public static FloatBuffer makeBuffer(float[] arr) {
        ByteBuffer bb = ByteBuffer.allocateDirect(arr.length * (Float.SIZE/8));
        bb.order(ByteOrder.nativeOrder());
        FloatBuffer ib = bb.asFloatBuffer();
        ib.put(arr);
        ib.position(0);
        return ib;
    }
    public static ShortBuffer makeBuffer(short[] arr) {
        ByteBuffer bb = ByteBuffer.allocateDirect(arr.length * (Short.SIZE/8));
        bb.order(ByteOrder.nativeOrder());
        ShortBuffer ib = bb.asShortBuffer();
        ib.put(arr);
        ib.position(0);
        return ib;
    }
    public void saveBitmap(Bitmap bitmap, String bitName)
    {
        String tempfilename = _storeDir.getPath()+"/"+bitName;
        Log.d(TAG, "saveBitmap: "+tempfilename);
        File file = new File(tempfilename);
        if(file.exists()){
            file.delete();
        }
        FileOutputStream out;
        try{
            out = new FileOutputStream(file);
            if(bitmap.compress(Bitmap.CompressFormat.PNG, 90, out))
            {
                out.flush();
                out.close();
            }
        }
        catch (FileNotFoundException e)
        {
            e.printStackTrace();
        }
        catch (IOException e)
        {
            e.printStackTrace();
        }
    }

    public void populate_toLookAt_withEyeAt_withUp(float[] aGLMatrix, CC3Vector targetLocation, CC3Vector eyeLocation, CC3Vector upDirection){
        CC3Vector fwdDir = CC3VectorDifference(targetLocation, eyeLocation);
        populate_toPointTowards_withUp(aGLMatrix, fwdDir, upDirection);
        transpose(aGLMatrix);
        transpose_by(aGLMatrix, CC3VectorNegate(eyeLocation));
    }
    public void populate_toPointTowards_withUp(float[] aGLMatrix, CC3Vector fwdDirection, CC3Vector upDirection){

        /*
     |  rx  ux  -fx  0 |
 M = |  ry  uy  -fy  0 |
     |  rz  uz  -fz  0 |
     |  0   0    0   1 |

	 where f is the normalized Forward vector (the direction being pointed to)
	 and u is the normalized Up vector in the rotated frame
	 and r is the normalized Right vector in the rotated frame
 */
        CC3Vector f, u, r;

        f = CC3VectorNormalize(fwdDirection);
        r = CC3VectorNormalize(CC3VectorCross(f, upDirection));
        u = CC3VectorCross(r, f);			// already normalized since f & r are orthonormal

        aGLMatrix[0]  = r.x;
        aGLMatrix[1]  = r.y;
        aGLMatrix[2]  = r.z;
        aGLMatrix[3] = 0.0f;

        aGLMatrix[4]  = u.x;
        aGLMatrix[5]  = u.y;
        aGLMatrix[6]  = u.z;
        aGLMatrix[7] = 0.0f;

        aGLMatrix[8]  = -f.x;
        aGLMatrix[9]  = -f.y;
        aGLMatrix[10] = -f.z;
        aGLMatrix[11] = 0.0f;

        aGLMatrix[12]  = 0.0f;
        aGLMatrix[13]  = 0.0f;
        aGLMatrix[14] = 0.0f;
        aGLMatrix[15] = 1.0f;
    }
    public void transpose_by(float[] aGLMatrix, CC3Vector aVector){
        float[]  m = aGLMatrix;					// Make a simple alias
        m[12] = aVector.x * m[0] + aVector.y * m[4] + aVector.z * m[8] + m[12];
        m[13] = aVector.x * m[1] + aVector.y * m[5] + aVector.z * m[9] + m[13];
        m[14] = aVector.x * m[2] + aVector.y * m[6] + aVector.z * m[10] + m[14];
        m[15] = aVector.x * m[3] + aVector.y * m[7] + aVector.z * m[11] + m[15];
    }

    public void transpose(float[] aGLMatrix){
        swap_with_inMatrix(1,4, aGLMatrix);
        swap_with_inMatrix(2,8, aGLMatrix);
        swap_with_inMatrix(3,12, aGLMatrix);
        swap_with_inMatrix(6,9, aGLMatrix);
        swap_with_inMatrix(7,13, aGLMatrix);
        swap_with_inMatrix(11,14, aGLMatrix);
    }
    public void swap_with_inMatrix(int idx1, int idx2, float[] aGLMatrix){
        float tmp = aGLMatrix[idx1];
        aGLMatrix[idx1] = aGLMatrix[idx2];
        aGLMatrix[idx2] = tmp;
    }

    public CC3Vector CC3VectorDifference(CC3Vector minuend, CC3Vector subtrahend){
        CC3Vector difference = new CC3Vector();
        difference.x = minuend.x - subtrahend.x;
        difference.y = minuend.y - subtrahend.y;
        difference.z = minuend.z - subtrahend.z;
        return difference;
    }
    CC3Vector CC3VectorNormalize(CC3Vector v) {
        float len = CC3VectorLength(v);
        if (len == 0.0) return v;

        CC3Vector normal = new CC3Vector();
        normal.x = v.x / len;
        normal.y = v.y / len;
        normal.z = v.z / len;
        return normal;
    }
    CC3Vector CC3VectorCross(CC3Vector v1, CC3Vector v2) {
        CC3Vector result = new CC3Vector();
        result.x = v1.y * v2.z - v1.z * v2.y;
        result.y = v1.z * v2.x - v1.x * v2.z;
        result.z = v1.x * v2.y - v1.y * v2.x;
        return result;
    }
    CC3Vector CC3VectorNegate(CC3Vector v) {
        CC3Vector result = new CC3Vector();
        result.x = -v.x;
        result.y = -v.y;
        result.z = -v.z;
        return result;
    }
    float CC3VectorLength(CC3Vector v) {
        float x = v.x;
        float y = v.y;
        float z = v.z;
        return (float) Math.sqrt((x * x) + (y * y) + (z * z));
    }

    public void view(ZWOpenGLView view){
        _view = view;
    }
    public CodecSurface surface(){
        return _codecSurface;
    }

    public void initCodecSurface(){
        if (_codecSurface == null) {
            _codecSurface = new CodecSurface();
            _codecSurface.init(this);
        }
    }
    public void releaseCodecSurface(){
        if (_codecSurface != null) {
            _codecSurface.releaseObjForCodec();
            _codecSurface = null;
        }
    }
    public void release(){
        Log.d(TAG, "TestPlayer releaseObjForCodec");
        if (_watermarkTexture != 0){
            GLESHelper.releaseTexture(_watermarkTexture);
        }
        if (_watermarkImage != null){
            _watermarkImage.recycle();
        }
        releaseCodecSurface();
    }
    public void callback(Callback c){
        _c = c;
    }

    @Override
    public void onSurfaceCreated(GL10 gl10, EGLConfig eglConfig) {
        Log.d(TAG, "TestPlayer glview onSurfaceCreated");
        initCodecSurface();
        if (_c != null) {
            _c.onSurfaceCreated();
        }
        if (_watermarkImage != null){
            Log.d(TAG, "onSurfaceCreated: _watermarkImage = "+_watermarkImage);
            _watermarkTexture = createTexture(_watermarkImage);
            Log.d(TAG, "onSurfaceCreated: _watermarkTexture = "+_watermarkTexture);
        }
    }

    @Override
    public void onSurfaceChanged(GL10 gl10, int width, int height) {
        Log.d(TAG, "TestPlayer glview onSurfaceChanged i=" + width + " i1=" + height);
        initCodecSurface();
        if (_c != null) {
            _c.onSurfaceChanged(width, height);
        }
    }

    @Override
    public void onDrawFrame(GL10 gl10) {
//        Log.d(TAG, "TestPlayer glview onDrawFrame");
        _codecSurface.updateTexImage();
    }

    @Override
    public void onFrameAvailable(SurfaceTexture surfaceTexture) {
//        Log.d(TAG, "onFrameAvailable: view = "+_view);
        if (_view != null) {
            _view.requestRender();
        } else {
            Log.w(TAG, "onFrameAvailable: view null");
        }
    }

    class CC3Vector{
        public float x,y,z;
        public CC3Vector(){}
        public CC3Vector(float ix, float iy, float iz){
            x = ix;
            y = iy;
            z = iz;
        }
    }
    public interface Callback{
        void onFrameAvailable(SurfaceTexture surfaceTexture);
        void onSurfaceCreated();
        void onSurfaceChanged(int width, int height);
    }
}
