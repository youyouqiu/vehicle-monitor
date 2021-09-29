package com.zwf3lbs.zwf3lbsapp;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Environment;
import android.os.Looper;
import android.os.Process;
import android.os.SystemClock;
import android.util.Log;
import android.widget.Toast;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * @author lihao
 * @date 2018/7/16 17:06
 */
public class CrashHandler implements Thread.UncaughtExceptionHandler {

    private static final String TAG = "CrashHandler";

    private static final boolean DEBUG = true;

    private static final String PATH = Environment.getExternalStorageDirectory().getPath() + "/Crash/";
    private static final String FILE_NAME = "crash";
    private static final String FILE_NAME_SUFFIX = ".trace";

    private Thread.UncaughtExceptionHandler mDefaultCrashHandler;
    private Context mContext;

    private CrashHandler() {
    }

    private enum CrashHandlerHelper {
        INSTANCE;

        private CrashHandler instance;

        CrashHandlerHelper() {
            this.instance = new CrashHandler();
        }
    }

    public static CrashHandler getInstance() {
        return CrashHandlerHelper.INSTANCE.instance;
    }

    public void init(Context context) {
        mDefaultCrashHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(this);
        mContext = context.getApplicationContext();
    }


    /**
     * 当程序中有未被捕获的异常，系统将会自动调用#uncaughtthread为出现未捕获异常的线程。
     *
     * @param t  出现未捕获异常的线程
     * @param ex 未捕获的异常
     */
    @Override
    public void uncaughtException(Thread t, Throwable ex) {
        try {
            // 导出异常信息到SD卡中
            dumpExceptionToSDCard(ex);
            // 这里可以上传异常信息到服务器，便于开发人员分析日志从而解决问题
            uploadExceptionToServer();
            crashProcess();
        } catch (IOException e) {
            e.printStackTrace();
        }
        ex.printStackTrace();
        if (null != mDefaultCrashHandler) {
            mDefaultCrashHandler.uncaughtException(t, ex);
        } else {
            Process.killProcess(Process.myPid());
        }
    }

    private void dumpExceptionToSDCard(Throwable ex) throws IOException {
        if (!Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
            if (DEBUG) {
                Log.w(TAG, "sdcard unmounted, skip dump exception");
                return;
            }
        }
        File dir = new File(PATH);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        long current = System.currentTimeMillis();
        String time = new SimpleDateFormat("yyyy-MM-ddHH:mm:ss", Locale.getDefault()).format(new Date(current));
        File file = new File(PATH + FILE_NAME + time + FILE_NAME_SUFFIX);
        Log.i(TAG, PATH + FILE_NAME + time + FILE_NAME_SUFFIX);
        try {
            PrintWriter pw = new PrintWriter(new BufferedWriter(
                    new FileWriter(file)));
            pw.println(time);
            dumpPhoneInfo(pw);
            pw.println();
            ex.printStackTrace(pw);
            pw.close();
        } catch (Exception e) {
            Log.e(TAG, "dump crash info failed.");
        }
    }

    private void dumpPhoneInfo(PrintWriter pw) throws PackageManager.NameNotFoundException {
        PackageManager pm = mContext.getPackageManager();
        PackageInfo pi = pm.getPackageInfo(mContext.getPackageName(), PackageManager.GET_ACTIVITIES);
        pw.print("App Version: ");
        pw.print(pi.versionName);
        pw.print('_');
        pw.println(pi.versionCode);

        // Android 版本号
        pw.print("OS Version: ");
        pw.print(Build.VERSION.RELEASE);
        pw.print('_');
        pw.println(Build.VERSION.SDK_INT);

        // 手机制造商
        pw.print("Vendor: ");
        pw.println(Build.MANUFACTURER);

        // 手机型号
        pw.print("Model: ");
        pw.println(Build.MODEL);

        // CPU架构
        pw.print("CPU ABI: ");
        for (String abi : Build.SUPPORTED_ABIS) {
            pw.print(abi + "，");
        }
    }

    private void uploadExceptionToServer() {
        //TODO Upload Exception Message To Your Web Server
    }

    private void crashProcess(){
        new Thread() {
            @Override
            public void run() {
                Looper.prepare();
                Toast.makeText(mContext, "很抱歉,程序出现异常,即将重启.", Toast.LENGTH_SHORT).show();
                Looper.loop();
            }
        }.start();
        // 重启应用（按需要添加是否重启应用）
        Intent intent = mContext.getPackageManager().getLaunchIntentForPackage(mContext.getPackageName());
        assert intent != null;
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        mContext.startActivity(intent);
        SystemClock.sleep(1000);
    }
}
