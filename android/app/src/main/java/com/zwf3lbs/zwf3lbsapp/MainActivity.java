package com.zwf3lbs.zwf3lbsapp;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;

import androidx.core.app.ActivityCompat;

import com.facebook.react.ReactActivity;
import com.liulishuo.filedownloader.FileDownloader;
import com.umeng.socialize.UMShareAPI;
import com.zwf3lbs.appversion.UpdateHelper;
import com.zwf3lbs.share.ShareAppModule;

// import com.mehcode.reactnative.splashscreen.SplashScreen;
// 禁止字体缩放

public class MainActivity extends ReactActivity {
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "rnProject";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Show the js-controlled splash screen
        // SplashScreen.show(this, getReactInstanceManager());

        View view = getWindow().getDecorView();
        setScreen(getApplicationContext(), view);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        super.onCreate(savedInstanceState);
        verifyPermission(this.getApplicationContext());
        // [...]
        //        ShareAppModule.initActivity(this);
        ShareAppModule.initSocialSDK(this);
    }

    public static Bitmap getBitmap(Context context, int resId) {
        BitmapFactory.Options options = new BitmapFactory.Options();
        TypedValue value = new TypedValue();
        context.getResources().openRawResource(resId, value);
        options.inTargetDensity = value.density;
        options.inScaled = false;//不缩放
        return BitmapFactory.decodeResource(context.getResources(), resId, options);
    }

    private static void setScreen(Context context, View view){
        Bitmap   bmp;
        int wWidth = context.getResources().getDisplayMetrics().widthPixels;
        int wHeight = context.getResources().getDisplayMetrics().heightPixels;
        if (wHeight <= 500) {
            bmp = getBitmap(context,R.mipmap.screen_500);
        } else if (wHeight <= 900){
            bmp = getBitmap(context,R.mipmap.screen_900);
        }else if (wHeight <= 1300){
            bmp = getBitmap(context,R.mipmap.screen_1300);
        }else if (wHeight <= 1500) {
            bmp = getBitmap(context, R.mipmap.screen_1600);
        }else if (wHeight <= 2000){
            bmp = getBitmap(context, R.mipmap.screen_2000);
        }else {
            bmp = getBitmap(context,R.mipmap.screen_2400);
        }
        int width = bmp.getWidth();
        int height = bmp.getHeight();
        Bitmap bitmap;
        if (wWidth <= width && wHeight <= height) {
            try {
                int x = (width - wWidth)/2;
                int y = (height - wHeight)/2;
                bitmap = Bitmap.createBitmap(bmp, x, y, wWidth, wHeight, null, false);
                Log.e("setScreen2", bitmap.getWidth() + "  " + bitmap.getHeight() );
            } catch (Exception e) {
                Log.e("setScreen3", "" );
                bitmap = bmp;
            }
        } else {
            bitmap = bmp;
        }
        Drawable drawable = new BitmapDrawable(view.getResources(), bitmap);
        view.setBackground(drawable);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        UMShareAPI.get(this).onActivityResult(requestCode, resultCode, data);
    }

    private static final int REQUEST_PERMISSIONS_CODE = 1;
    private static String[] PERMISSIONS_REQUESTS = {
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.CAMERA
    };

    public void verifyPermission(Context context){
        int permissionStorage = ActivityCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE);
        // GPS权限
        int permissionGps = ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION);
        if (permissionStorage != PackageManager.PERMISSION_GRANTED || permissionGps != PackageManager.PERMISSION_GRANTED) {
            // We don't have permission so prompt the user
            ActivityCompat.requestPermissions(MainActivity.this, PERMISSIONS_REQUESTS, REQUEST_PERMISSIONS_CODE);
        }
        FileDownloader.setup(context);
        UpdateHelper.getInstance().setActivity(this);
        UpdateHelper.getInstance().setContext(context);
    }

    // 禁止字体缩放
    @Override
    public Resources getResources() {

        Resources res = super.getResources();

        Configuration config=new Configuration();

        config.setToDefaults();

        res.updateConfiguration(config,res.getDisplayMetrics());

        return res;

    }
}
