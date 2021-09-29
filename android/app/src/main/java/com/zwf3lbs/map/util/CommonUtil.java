package com.zwf3lbs.map.util;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.drawable.Drawable;
import android.location.Location;
import android.location.LocationManager;
//import android.support.v4.content.ContextCompat;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;

import com.baidu.mapapi.animation.Animation;
import com.baidu.mapapi.animation.RotateAnimation;
import com.baidu.mapapi.map.BitmapDescriptor;
import com.baidu.mapapi.map.BitmapDescriptorFactory;
import com.baidu.mapapi.map.Marker;
import com.baidu.mapapi.model.LatLng;
import com.blankj.utilcode.util.ImageUtils;
import com.blankj.utilcode.util.ScreenUtils;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static android.content.pm.PackageManager.PERMISSION_GRANTED;


/**
 * 工具类
 */
public class CommonUtil {
    private static final String TAG = "CommonUtil";

    public static List<LatLng> list = new ArrayList<>();

    /**
     * 颜色处理
     */
    public static Integer statusToColour(int status) {
        // 默认为未定位
        int colour = 0xff754801;
        switch (status) {
            case 2:
                colour = 0xff754801;
                break;
            case 3:
                colour = 0xffb6b6b6;
                break;
            case 4:
                colour = 0xffc80002;
                break;
            case 5:
                colour = 0xffffab2d;
                break;
            case 9:
                colour = 0xff960ba3;
                break;
            case 10:
                colour = 0xff78af3a;
                break;
            case 11:
                colour = 0xfffb8c96;
                break;
            default:
                break;
        }
        return colour;
    }

    /**
     * 根据两点算取图标转的角度
     */
    public static double getAngle(LatLng fromPoint, LatLng toPoint) {
        double slope = getSlope(fromPoint, toPoint);
        if (slope == Double.MAX_VALUE) {
            if (toPoint.latitude > fromPoint.latitude) {
                return 0;
            } else {
                return 180;
            }
        }
        float deltaAngle = 0;
        if ((toPoint.latitude - fromPoint.latitude) * slope < 0) {
            deltaAngle = 180;
        }
        double radio = Math.atan(slope);
        return 180 * (radio / Math.PI) + deltaAngle;
    }

    /**
     * 算斜率
     */
    private static double getSlope(LatLng fromPoint, LatLng toPoint) {
        if (toPoint.longitude == fromPoint.longitude) {
            System.out.println(fromPoint);
            System.out.println(toPoint);
            return Double.MAX_VALUE;
        }
        return ((toPoint.latitude - fromPoint.latitude) / (toPoint.longitude - fromPoint.longitude));
    }

    /**
     * 权限判断
     */
    public static boolean checkLocationPermission(Context context) {
        String permissions = "android.permission.ACCESS_FINE_LOCATION,android.permission.ACCESS_COARSE_LOCATION";
        String[] split = permissions.split(",");
        for (String permission : split) {
            int i = 0;
            try {
                i = ContextCompat.checkSelfPermission(context, permission);
            } catch (Exception e) {
                Log.e(TAG, e.getMessage());
            }

            if (i != PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }


    public static BitmapDescriptor getBitMapV2(BitmapDescriptor bitmapDescriptor) {
        // 获得图片的宽高
        int width = bitmapDescriptor.getBitmap().getWidth();
        int height = bitmapDescriptor.getBitmap().getHeight();
        // 计算缩放比例
        float screenDensity = ScreenUtils.getScreenDensity();
        float scaleWidth = ((float) 250) / width;
        float scaleHeight = ((float) 150) / height;
        // 取得想要缩放的matrix参数
        Matrix matrix = new Matrix();
        float wid = 100 * screenDensity;
        float hig = 50 * screenDensity;
        matrix.postScale(scaleWidth, scaleHeight);
        Bitmap bitmap = ImageUtils.compressByScale(bitmapDescriptor.getBitmap(), (int) wid, (int) hig);
        // 得到新的图片
        Bitmap.createBitmap(bitmapDescriptor.getBitmap(), 0, 0, width, height, matrix, true);
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    public static void routeCarMarker(Marker marker, Integer angel) {
        if (angel == null) {
            return;
        }
        if (angel < 0) {
            angel = 360 + angel;
        }
        RotateAnimation rotateAnimation = new RotateAnimation(marker.getRotate(), angel);
        rotateAnimation.setDuration(10);
        rotateAnimation.setRepeatCount(0);
        rotateAnimation.setRepeatMode(Animation.RepeatMode.RESTART);
        marker.setAnimation(rotateAnimation);
        marker.startAnimation();
        marker.setRotate(angel);
    }

    public static BitmapDescriptor createStartIco() {
        BitmapDescriptor bitmapDescriptor = BitmapDescriptorFactory.fromResource(R.drawable.start);
        float screenDensity = ScreenUtils.getScreenDensity();
        float wid = 22 * screenDensity;
        float hig = 35 * screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(bitmapDescriptor.getBitmap(), (int) wid, (int) hig);
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    public static BitmapDescriptor createEndIco() {
        BitmapDescriptor bitmapDescriptor = BitmapDescriptorFactory.fromResource(R.drawable.end);
        float screenDensity = ScreenUtils.getScreenDensity();
        float wid = 22*screenDensity;
        float hig = 35*screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(bitmapDescriptor.getBitmap(), (int) wid, (int) hig);
        // 得到新的图片
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public static BitmapDescriptor createParkIco(Context context) {
        Drawable vectorDrawable = context.getDrawable(R.drawable.park);
        Objects.requireNonNull(vectorDrawable);
        Bitmap b = Bitmap.createBitmap(vectorDrawable.getIntrinsicWidth(), vectorDrawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(b);
        vectorDrawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        vectorDrawable.draw(canvas);
        float screenDensity = ScreenUtils.getScreenDensity();
        float wid = 22*screenDensity;
        float hig = 22*screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(b, (int) wid, (int) hig);
        // 得到新的图片
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public static BitmapDescriptor createCheckParkIco(Context context) {
        Drawable vectorDrawable = context.getDrawable(R.drawable.check_park);
        Objects.requireNonNull(vectorDrawable);
        Bitmap b = Bitmap.createBitmap(vectorDrawable.getIntrinsicWidth(), vectorDrawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(b);
        vectorDrawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        vectorDrawable.draw(canvas);
        float screenDensity = ScreenUtils.getScreenDensity();
        float wid = 22*screenDensity;
        float hig = 22*screenDensity;
        Bitmap bitmap = ImageUtils.compressByScale(b, (int) wid, (int) hig);
        // 得到新的图片
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    public static LatLng initLocation(Context context) {
        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);

        if (locationManager == null || CommonUtil.checkLocationPermission(context)) {
            return null;
        }

        List<String> providers = new ArrayList<>();
        providers.add(LocationManager.NETWORK_PROVIDER);
        providers.add(LocationManager.GPS_PROVIDER);
        providers.add(LocationManager.PASSIVE_PROVIDER);
        Location location;
        for(String provider : providers) {
            try {
                location = locationManager.getLastKnownLocation(provider);
                if (location != null){
                    //不为空,显示地理位置经纬度
                    return new LatLng(location.getLatitude(), location.getLongitude());
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }
}
