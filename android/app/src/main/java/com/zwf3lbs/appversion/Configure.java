package com.zwf3lbs.appversion;

import android.os.Environment;
//import android.os.FileUtils;

import com.blankj.utilcode.util.FileUtils;


import java.io.File;

public class Configure {

    //文件目录
    public static final String LAZYCATDIR = Environment.getExternalStorageDirectory().getAbsolutePath() + File.separator + "Download";
    public static final String LAZYCATDIR_LOG = Environment.getExternalStorageDirectory().getAbsolutePath() + File.separator + "lazycat/log/";
    public static final String LAZYCATDIR_ROOT = Environment.getExternalStorageDirectory().getAbsolutePath() + File.separator + "lazycat/";
    //目标文件名
    public static final String APK_NAME = "f3.apk";

    public static boolean createOrExistsDir() {
        return FileUtils.createOrExistsDir("lazycat");
    }

    //创建通知栏渠道ID
    public static final String NOTIFICATION_CHANNEL_ID = "update";
 

}
