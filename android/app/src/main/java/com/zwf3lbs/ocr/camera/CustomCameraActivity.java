package com.zwf3lbs.ocr.camera;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.hardware.Camera;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.io.File;
import java.io.FileOutputStream;

public class CustomCameraActivity extends Activity implements SurfaceHolder.Callback {
    private static final int CHOOSE_PHOTO = 2;
    private static final int cameraId = 0;//声明cameraId属性，ID为1调用前置摄像头，为0调用后置摄像头。此处因有特殊需要故调用前置摄像头
    private Camera mCamera;
    private SurfaceHolder mHolder;
    private MainApplication applicationData;
    private boolean openOrClose  = true;
    //定义照片保存并显示的方法
    private final Camera.PictureCallback mpictureCallback = new Camera.PictureCallback(){
        @Override
        public void onPictureTaken(byte[] data,Camera camera){
            File tempfile = new File(Environment.getExternalStorageDirectory().getPath() + "/ocr.png");//新建一个文件对象tempfile，并保存在某路径中
            try {
                Bitmap bitmap = BitmapFactory.decodeByteArray(data,0,data.length);
                Matrix matrix=new Matrix();//新建一个矩阵对象
                matrix.setRotate(90);//矩阵旋转操作让照片可以正对着你。但是还存在一个左右对称的问题
                //新建位图，第2个参数至第5个参数表示位图的大小，matrix中是旋转后的位图信息，并使bitmap变量指向新的位图对象
                bitmap= Bitmap.createBitmap(bitmap,0,0,bitmap.getWidth(),bitmap.getHeight(),matrix,true);
                FileOutputStream out = new FileOutputStream(tempfile);
                bitmap.compress(Bitmap.CompressFormat.JPEG, 100, out);
                out.flush();
                Intent intent = new Intent(CustomCameraActivity.this, applicationData.getPicResultClass());//新建信使对象
                intent.putExtra("picpath", tempfile.getAbsolutePath());//打包文件给信使
                startActivity(intent);//打开新的activity，即打开展示照片的布局界面
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };

    @Override
    protected void onCreate( Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_custom);
        applicationData = (MainApplication) getApplication();
        SurfaceView mPreview = findViewById(R.id.preview);//初始化预览界面
        mHolder= mPreview.getHolder();
        mHolder.addCallback(this);

        View bottomView = findViewById(R.id.linearLayout_test);
        bottomView.getBackground().setAlpha(180);

        // 取消按钮
        ImageButton cancelButton = findViewById(R.id.orc_cancel);
        // 图库按钮
        ImageButton openPicButton = findViewById(R.id.ocr_open_picture);
        // 闪光灯
        ImageButton openLightButton = findViewById(R.id.ocr_open_light);
        ImageButton takePictureButton = findViewById(R.id.ocr_take_picture);
        //点击预览界面聚焦
        mPreview.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCamera.autoFocus(null);
            }
        });
        // 点击退出按钮 退出当前页面
        cancelButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                CustomCameraActivity.this.finish();
            }
        });
        // 打开闪光灯
        openLightButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                //判断API是否大于24（安卓7.0系统对应的API）
                try {
                    Camera.Parameters parameters = mCamera.getParameters();
                    if(openOrClose) {
                        parameters.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH);
                        mCamera.setParameters(parameters);
                        openOrClose = false;
                    }else {
                        parameters.setFlashMode(Camera.Parameters.FLASH_MODE_OFF);
                        mCamera.setParameters(parameters);
                        openOrClose = true;
                    }

                } catch (Exception e) {
                    Log.e("CustomCameraActivity", e.getMessage());
                }
            }
        });
        // 打开相册
        // 拍照
        takePictureButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (mCamera==null) {//如果此时摄像头值仍为空
                    mCamera = getCamera();
                }
                //摄像头聚焦
                mCamera.autoFocus(new Camera.AutoFocusCallback(){
                    @Override
                    public void onAutoFocus(boolean success, Camera camera) {
                        if(success){
                            mCamera.takePicture(null,null, mpictureCallback);
                        }
                    }
                });
            }
        });

        openPicButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                openAlbum();
            }
            });

    }


    public void openAlbum() {
        //通过intent打开相册，使用startactivityForResult方法启动actvity，
        //会返回到onActivityResult方法，所以我们还得复写onActivityResult方法
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        startActivityForResult(intent, CHOOSE_PHOTO);
    }



    //打开图库后选择图片获取图片的地址
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == CHOOSE_PHOTO && resultCode == RESULT_OK) {
            Uri uri = data.getData();
            Cursor cursor = getContentResolver().query(uri, null, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                String path = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA));
                long fileSize;
                File fileOutputStream = new File(path);
                fileSize = fileOutputStream.length();
                Bitmap bitmap = BitmapFactory.decodeFile(path);
                //验证图片大小
                if (fileSize >4 * 1024 * 1024 || bitmap.getWidth()< 15 || bitmap.getWidth()>4096 || bitmap.getHeight()<15 || bitmap.getHeight()>4096) {
                    Toast toast =Toast.makeText(getApplicationContext(),"",Toast.LENGTH_LONG);
                    toast.setGravity(Gravity.CENTER_HORIZONTAL,0,0);
                    LinearLayout layout = (LinearLayout) toast.getView();
                    TextView tv = (TextView) layout.getChildAt(0);
                    tv.setTextSize(20);
                    tv.setText("图片大小错误！");
                    toast.show();
                    openAlbum();
                    return;
                }
                //验证图片格式
                String []  pics = path.split("\\.");
                String picType = pics[pics.length - 1];
                if(!picType.equalsIgnoreCase("jpg") && !picType.equalsIgnoreCase("jpeg")
                        && !picType.equalsIgnoreCase("png") && !picType.equalsIgnoreCase("bmp")  ) {
                    Toast toast =Toast.makeText(getApplicationContext(),"",Toast.LENGTH_LONG);
                    toast.setGravity(Gravity.CENTER_HORIZONTAL,0,0);
                    LinearLayout layout = (LinearLayout) toast.getView();
                    TextView tv = (TextView) layout.getChildAt(0);
                    tv.setTextSize(20);
                    tv.setText("图片格式错误！");
                    toast.show();
                    openAlbum();
                    return;
                }
                Intent intent = new Intent(CustomCameraActivity.this, applicationData.getPicResultClass());//新建信使对象
                intent.putExtra("picpath", path);//打包文件给信使
                startActivity(intent);//打开新的activity，即打开展示照片的布局界面
                cursor.close();
            }
        }
    }

    //activity生命周期在onResume是界面应是显示状态
    @Override
    protected void onResume() {
        super.onResume();
        if (mCamera==null){//如果此时摄像头值仍为空
            mCamera=getCamera();//则通过getCamera()方法开启摄像头
            if(mHolder!=null){
                setStartPreview(mCamera,mHolder);//开启预览界面
            }
        }
    }
    //activity暂停的时候释放摄像头
    @Override
    protected void onPause() {
        super.onPause();
        releaseCamera();
    }
    //onResume()中提到的开启摄像头的方法
    private Camera getCamera() {
        Camera camera;//声明局部变量camera
        camera = Camera.open(cameraId);//根据cameraId的设置打开前置摄像头
        try {
        Camera.Parameters parameters = camera.getParameters();
        WindowManager windowManager = getWindowManager();
        Display display = windowManager.getDefaultDisplay();
        int screenWidth  = display.getWidth();
        int screenHeight = display.getHeight();
        parameters.setPictureFormat(ImageFormat.JPEG);//设置照片格式
        parameters.setPreviewSize(screenHeight, screenWidth);
        parameters.setPictureSize(screenHeight, screenWidth);
        parameters.setFocusMode(Camera.Parameters.FOCUS_MODE_AUTO);
            camera.setParameters(parameters);

        }
        catch (Exception e){
            try {
                Camera.Parameters parameters = camera.getParameters();
                Camera.Size s = parameters.getPreviewSize();
                parameters.setPictureSize(s.width, s.height);
                camera.setParameters(parameters);
            } catch (Exception ignored){
            }
        }
        return camera;
    }
    //开启预览界面
    private void setStartPreview(Camera camera, SurfaceHolder holder){
        try{
            camera.setPreviewDisplay(holder);
            camera.setDisplayOrientation(90);//如果没有这行你看到的预览界面就会是水平的
            camera.startPreview();
        } catch (Exception ignored){
        }
    }
    //定义释放摄像头的方法
    private void releaseCamera(){
        if(mCamera!=null){//如果摄像头还未释放，则执行下面代码
            mCamera.stopPreview();//1.首先停止预览
            mCamera.setPreviewCallback(null);//2.预览返回值为null
            mCamera.release(); //3.释放摄像头
            mCamera=null;//4.摄像头对象值为null
        }
    }
    //定义新建预览界面的方法
    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        setStartPreview(mCamera,mHolder);
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
        if (mCamera != null) {
            mCamera.stopPreview();//如果预览界面改变，则首先停止预览界面
            setStartPreview(mCamera, mHolder);//调整再重新打开预览界面
        }
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        releaseCamera();//预览界面销毁则释放相机
    }
}
