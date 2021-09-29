package com.zwf3lbs.ocr.util;

import android.annotation.SuppressLint;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

/**
 * Created by lijie on 19/7/16
 */
public class DateUtil {

    public static String HHMMSS = "HH:mm:ss";
    public static String YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd-HH-mm-ss";
    public static String YY_MM_DD_HH_MM_SS = "yy-MM-dd-HH-mm-ss";
    public static String YYMMDDHHMMSS = "yyMMddHHmmss";//0200上传固定日期格式
    public static String YYYY_MM_DD_HHMMSS = "yyyy-MM-dd HH:mm:ss";
    public static String YYMMDD_HHMMSS = "yyMMdd_HHmmss";

    /**
     * 获取当前时间
     *
     * @param format
     * @return
     */
    public static String getCurrDate(String format) {
        Date d = new Date();
        @SuppressLint("SimpleDateFormat")
        SimpleDateFormat dateFormat = new SimpleDateFormat(format);
        return dateFormat.format(d);
    }

    public static String getTomorrow() {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_MONTH, 1);
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH) + 1;
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        return year + "-" + (month > 9 ? month : ("0" + month)) + "-" + day;
    }

    public static int getYear() {
        Calendar calendar = Calendar.getInstance();
        return calendar.get(Calendar.YEAR);
    }

    public static String getToday() {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH) + 1;
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        return year + "-" + (month > 9 ? month : ("0" + month)) + "-" + day;
    }

    public static List<Integer> getDateListForString(String date) {
        String[] dates = date.split("-");
        List<Integer> list = new ArrayList<>();
        list.add(Integer.parseInt(dates[0]));
        list.add(Integer.parseInt(dates[1]));
        list.add(Integer.parseInt(dates[2]));
        return list;
    }

    public static String  getFormat2(String format3){
        StringBuilder stringBuilder = new StringBuilder(format3);
        stringBuilder.insert(4,"-");
        stringBuilder.insert(7,"-");
        return stringBuilder.toString();
    }

    public static String  getChiesesDate(String format4){
        StringBuilder stringBuilder = new StringBuilder(format4);
        stringBuilder.insert(4,"年");
        stringBuilder.insert(7,"月");
        return stringBuilder.toString();
    }

    /**
     * 获取两个日期相差的天数
     *
     * @param currDate 日期1
     * @param fileDate 日期2
     * @return 相差天数
     */
    public static int getBetweenDay(Date currDate, Date fileDate) {
        //根据相差的毫秒数计算
        int dayValue = (int) ((currDate.getTime() - fileDate.getTime()) / (24 * 3600 * 1000));
        return Math.abs(dayValue);
    }

}
