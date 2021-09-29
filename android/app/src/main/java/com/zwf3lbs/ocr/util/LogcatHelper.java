package com.zwf3lbs.ocr.util;

import android.os.Environment;

import java.io.File;


/**
 * @description: 日志保存本地工具类
 * @author: chenguoguo
 * @Date: 2021/3/26 11:24
 */
public class LogcatHelper {

    private static LogcatHelper INSTANCE = null;

    private LogDumper mLogDumper = null;
    private int mPId;

    //public static String PATH_LOG = "";

    /**
     * 初始化目录
     */
    private void init() {
        //String sdcardPath = Environment.getExternalStorageDirectory().getAbsolutePath();
        //PATH_LOG = new File(sdcardPath + "/f3_log/").getAbsolutePath();
        File file = new File(FileUtils.PATH_LOG);
        if (!file.exists()) {
            file.mkdirs();
        }
    }

    public static LogcatHelper getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new LogcatHelper();
        }
        return INSTANCE;
    }

    private LogcatHelper() {
        init();
        mPId = android.os.Process.myPid();
    }

    /**
     * 启动日志保存功能（保存到本地）
     */
    public void start() {
        if (mLogDumper == null) {
            mLogDumper = new LogDumper(String.valueOf(mPId), FileUtils.PATH_LOG);
        }
        mLogDumper.start();
    }

    /**
     * 停止日志保存功能
     */
    public void stop() {
        if (mLogDumper != null) {
            mLogDumper.stopLogs();
            mLogDumper = null;
        }

    }
}