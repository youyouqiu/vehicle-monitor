package com.zwf3lbs.ocr.util;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.ActionBar;

import com.hjq.permissions.OnPermission;
import com.hjq.permissions.Permission;
import com.hjq.permissions.XXPermissions;
import com.zwf3lbs.ocr.activity.LookPicActivity;
import com.zwf3lbs.ocr.camera.CustomCameraActivity;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CommonUtil {

    public static void checkCameraPermissions(final Context context) {
        XXPermissions.with((Activity) context)
            //.constantRequest() //可设置被拒绝后继续申请，直到用户授权或者永久拒绝
            //.permission(Permission.SYSTEM_ALERT_WINDOW, Permission.REQUEST_INSTALL_PACKAGES) //支持请求 6.0 悬浮窗权限 8.0 请求安装权限
            .permission(Permission.CAMERA)
            .permission(Permission.Group.STORAGE) //不指定权限则自动获取清单中的危险权限
            .request(new OnPermission() {

                @Override
                public void hasPermission(List<String> granted, boolean isAll) {
                    context.startActivity(new Intent(context, CustomCameraActivity.class));
                }

                @Override
                public void noPermission(List<String> denied, boolean quick) {
                    XXPermissions.gotoPermissionSettings(context);
                }
            });
    }

    public static Map<String, String> getHttpParm(MainApplication applicationData) {
        HashMap<String, String> parm = new HashMap<>();
        parm.put("access_token", applicationData.getAccess_token());
        parm.put("version", applicationData.getVersion());
        parm.put("platform", applicationData.getPlatform());
        return parm;
    }

    //设置标题通用方法
    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public static void setActionBar(ActionBar actionBar, Context context, String title) {

        // 返回箭头（默认不显示）
        actionBar.setDisplayHomeAsUpEnabled(true);
        Drawable vectorDrawable = context.getDrawable(R.mipmap.goback);
        actionBar.setHomeAsUpIndicator(resize(vectorDrawable, context));
        // 左侧图标点击事件使能
        actionBar.setHomeButtonEnabled(true);
        // 使左上角图标(系统)是否显示
        actionBar.setDisplayShowHomeEnabled(true);
        // 显示标题
        actionBar.setDisplayShowTitleEnabled(false);
        //显示自定义视图
        actionBar.setDisplayShowCustomEnabled(true);
        TextView textView = new TextView(context);
        textView.setText(title);
        textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        textView.setTextColor(0xffffffff);
        LinearLayout actionbarLayout = new LinearLayout(context);
        actionBar.setCustomView(actionbarLayout, new ActionBar.LayoutParams(ActionBar.LayoutParams.WRAP_CONTENT,
                ActionBar.LayoutParams.WRAP_CONTENT));
        ActionBar.LayoutParams mP = (ActionBar.LayoutParams) actionbarLayout
                .getLayoutParams();
        mP.gravity = mP.gravity & ~Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.CENTER_HORIZONTAL;
        actionbarLayout.addView(textView);
        actionBar.setCustomView(actionbarLayout, mP);

    }

    private static Drawable resize(Drawable image, Context context) {
        Bitmap bitmap = ((BitmapDrawable) image).getBitmap();
        DisplayMetrics dm = context.getResources().getDisplayMetrics();
        int screenWidth = dm.widthPixels;
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        int newWidth = (int) (30d / (1080d / screenWidth));
        int newHeight = (int) (60d / (1080d / screenWidth));
        float scaleWight = ((float) newWidth) / width;
        float scaleHeight = ((float) newHeight) / height;
        Matrix matrix = new Matrix();
        matrix.postScale(scaleWight, scaleHeight);
        Bitmap res = Bitmap.createBitmap(bitmap, 0, 0, width, height, matrix, true);
        return new BitmapDrawable(context.getResources(), res);
    }

    public static void showToast(Context context, String value) {
        Toast toast = Toast.makeText(context, "", Toast.LENGTH_LONG);
        toast.setGravity(Gravity.CENTER_HORIZONTAL, 0, 0);
        LinearLayout layout = (LinearLayout) toast.getView();
        TextView tv = (TextView) layout.getChildAt(0);
        tv.setTextSize(15);
        tv.setText(value);
        toast.show();
    }

    public static void showToastShort(Context context, String value) {
        Toast toast = Toast.makeText(context, "", Toast.LENGTH_SHORT);
        toast.setGravity(Gravity.CENTER_HORIZONTAL, 0, 0);
        LinearLayout layout = (LinearLayout) toast.getView();
        TextView tv = (TextView) layout.getChildAt(0);
        tv.setTextSize(15);
        tv.setText(value);
        toast.show();
    }

    public static void showBigPic(Context context, ImageView imageView, MainApplication application) {
        Intent intent = new Intent(context, LookPicActivity.class);
        //然后通过getDrawingCache方法获取BitMap
        Bitmap drawingCache = ((BitmapDrawable) imageView.getDrawable()).getBitmap();
        application.setBigPic(drawingCache);
        context.startActivity(intent);
    }

    /**
     * 检测当的网络状态
     */
    public static boolean isNetworkOnline() {
        Runtime runtime = Runtime.getRuntime();
        try {
            Process ipProcess = runtime.exec("ping -c 3 www.baidu.com");
            int exitValue = ipProcess.waitFor();
            return (exitValue == 0);
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
        return false;
    }

}
