package com.zwf3lbs.ocr.util;

import android.annotation.SuppressLint;
import android.os.Environment;
import android.util.Log;

import java.io.File;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * @description:
 * @author: chenguoguo
 * @Date: 2021/4/27 11:54
 */
public class FileUtils {

    private static final String TAG = "FileUtils";
    /**
     * 日志存储路径
     */
    public static final String PATH_LOG = Environment.getExternalStorageDirectory()
            .getAbsolutePath() + "/f3_log/";

    /**
     * 根据时间范围删除过期的文件
     *
     * @param path 需要删除文件的对应目录
     * @param day  过期天数（超过这个天数，即删除）
     */
    public static void deleteFileByTime(String path, int day) {
        File logFile = new File(path);
        File[] files = logFile.listFiles();// 读取
        if (files != null) {// 先判断目录是否为空，否则会报空指针
            for (File file : files) {
                if (file.isDirectory()) {//检测到时目录
                    deleteFileByTime(file.getPath(), day);
                } else {
                    String fileName = file.getName();
                    if (fileName.endsWith(".log")) {
                        try {
                            String[] strs = fileName.split("_");
                            if (strs.length < 3 || !strs[1].startsWith("21")) {//不是21年开头的全部删除
                                if (!file.delete()) Log.d(TAG, "===delete log file failure===");
                                continue;
                            }
                            @SuppressLint("SimpleDateFormat")
                            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd-HH-mm");
                            String fileTime = format.format(new Date(file.lastModified()));
                            String dateString = format.format(new Date(System.currentTimeMillis()));
                            Date currDate = format.parse(dateString);
                            Date fileDate = format.parse(fileTime.trim());
                            if (currDate != null && fileDate != null) {
                                if (DateUtil.getBetweenDay(fileDate, currDate) >= day) {
                                    if (!file.delete()) Log.d(TAG, "===delete log file failure===");
                                }
                            }
                        } catch (ParseException e) {
                            e.printStackTrace();
                        }
                    } else {
                        if (!file.delete()) Log.d(TAG, "===delete log file failure===");
                    }
                }
            }
        }
    }

}
