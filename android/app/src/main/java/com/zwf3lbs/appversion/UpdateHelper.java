package com.zwf3lbs.appversion;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;

import com.blankj.utilcode.util.AppUtils;
import com.hjq.permissions.OnPermission;
import com.hjq.permissions.Permission;
import com.hjq.permissions.XXPermissions;
import com.liulishuo.filedownloader.BaseDownloadTask;
import com.liulishuo.filedownloader.FileDownloadSampleListener;
import com.liulishuo.filedownloader.FileDownloader;
import com.zwf3lbs.zwf3lbsapp.BuildConfig;

import java.io.File;
import java.io.FileFilter;
import java.util.List;

// import android.support.v4.app.NotificationCompat;
//import android.support.v4.content.FileProvider;

/**
 * author : gfw
 * time   : 2018/10/24
 * desc   : 更新文件帮助类
 */
public class UpdateHelper {

    //创建通知栏渠道ID
    public static final String NOTIFICATION_CHANNEL_ID = "update";
    private static UpdateHelper instance;
    private int DOWNLOAD_NOTIFICATION_ID = 1000;
    private Activity activity;

    public Activity getActivity() {
        return activity;
    }

    public void setActivity(Activity activity) {
        this.activity = activity;
    }

    private Context context;
    private String filepath = Environment.getExternalStorageDirectory() + "/" + Environment.DIRECTORY_DOWNLOADS;
    private NotificationManager mNotificationManager;
    public static UpdateHelper getInstance() {
        if (instance == null)
            instance = new UpdateHelper();
        return instance;
    }

    public void setContext(Context context) {
        this.context = context;
    }

    public Context getContext() {
        return context;
    }

    /**
     * 安装APP
     */
    private void install(Context self, File file) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        /*
          适配7.0
         */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Uri contentUri = FileProvider.getUriForFile(self, BuildConfig.APPLICATION_ID + ".fileProvider", file);
            intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            self.grantUriPermission(self.getPackageName(), contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            self.grantUriPermission(self.getPackageName(), contentUri, Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

        } else {
            intent.setDataAndType(Uri.fromFile(file), "application/vnd.android.package-archive");
        }
        self.startActivity(intent);
        android.os.Process.killProcess(android.os.Process.myPid());
    }

    /**
     * 根据版本号判断更新
     */
    public void get(final Activity self, final int versionCode) {
        Log.e("versionCode :", "versionCode: " + versionCode);
    }

    /**
     * 根据下载地址判断更新
     */
    public void get(final Activity self, String downloadUrl) {
        Log.e("downloadUrl :", "downloadUrl: " + downloadUrl);

        updateApp(self, downloadUrl);
    }

    /**
     * 在通知栏显示下载进度
     */
    private void showDownloadNotificationUI(final Context self, final int progress) {
        //应用名称
        String appName = AppUtils.getAppName();
        //应用版本号
        String versionName = AppUtils.getAppVersionName();
        //通知栏展现时间
        long currentTime = System.currentTimeMillis();
        //通知标题
        String mContentTitle = "应用升级";
        //通知内容
        String mContentText = appName + "  " + progress + "%";
        //设置Ticker
        String mTicker = "正在下载...";
        //设置最大下载完成率
        int maxProgress = 100;
        if (self != null) {
            //应用图标
            int appIcon = self.getApplicationInfo().icon;

            PendingIntent mPendingIntent = PendingIntent.getActivity(self, 0, new Intent(), PendingIntent.FLAG_CANCEL_CURRENT);
            mNotificationManager = (NotificationManager) self.getSystemService(Context.NOTIFICATION_SERVICE);
            //兼容Android8.0
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                //设置渠道名称，展示给用户看，一经设定不可修改
                CharSequence channelName = "应用更新";
                //设置通知栏信息的重要级别
                int importance = NotificationManager.IMPORTANCE_HIGH;
                //创建通知栏渠道信息
                NotificationChannel mChannel = new NotificationChannel(Configure.NOTIFICATION_CHANNEL_ID, channelName, importance);
                // 配置通知渠道的属性
                mChannel.setDescription("更新应用版本，如果关闭通知，你可能会失去第一时间更新应用");
                // 设置通知出现时声音，默认通知是有声音的
                mChannel.setSound(null, null);
                // 设置通知出现时的闪灯（如果 android 设备支持的话）
                mChannel.enableLights(false);
                mChannel.setLightColor(Color.BLUE);
                // 设置通知出现时的震动（如果 android 设备支持的话）
                mChannel.enableVibration(false);
                //mChannel.enableVibration(true);
                mChannel.setVibrationPattern(new long[]{0});

                //最后在 notificationManager 中创建该通知渠道
                mNotificationManager.createNotificationChannel(mChannel);

                Notification.Builder builder = new Notification.Builder(self, Configure.NOTIFICATION_CHANNEL_ID);

                builder.setAutoCancel(true)
                        .setContentIntent(mPendingIntent)
                        .setContentTitle(mContentTitle)
                        .setContentText(mContentText)
                        .setOngoing(false)
                        .setTicker(mTicker)
                        .setProgress(maxProgress, progress, false)
                        .setSmallIcon(appIcon)
                        .setWhen(currentTime)
                        .setVibrate(new long[]{0});
                mNotificationManager.notify(DOWNLOAD_NOTIFICATION_ID, builder.build());
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NotificationCompat.Builder builder = new NotificationCompat.Builder(self);
                builder.setAutoCancel(true)
                        .setContentIntent(mPendingIntent)
                        .setContentTitle(mContentTitle)
                        .setContentText(mContentText)
                        .setOngoing(false)
                        .setTicker(mTicker)
                        .setProgress(maxProgress, progress, false)
                        .setSmallIcon(appIcon)
                        .setWhen(currentTime)
                        .setVibrate(new long[]{0});
                mNotificationManager.notify(DOWNLOAD_NOTIFICATION_ID, builder.build());
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN &&
                    Build.VERSION.SDK_INT <= Build.VERSION_CODES.LOLLIPOP_MR1) {
                Notification.Builder builder = new Notification.Builder(self);
                builder.setAutoCancel(true)
                        .setContentIntent(mPendingIntent)
                        .setContentTitle(mContentTitle)
                        .setContentText(mContentText)
                        .setOngoing(false)
                        .setTicker(mTicker)
                        .setProgress(maxProgress, progress, false)
                        .setSmallIcon(appIcon)
                        .setWhen(currentTime)
                        .setVibrate(new long[]{0});
                mNotificationManager.notify(DOWNLOAD_NOTIFICATION_ID, builder.build());
            }
        }
    }
    private void closeNotificationUI(){
        mNotificationManager.cancelAll();
    }

    /**
     * 外部已经确定更新，且拿到了更新地址，则直接更新
     */
    private void updateApp(final Activity mContext, String installStr) {
        if (XXPermissions.isHasPermission(mContext, Permission.WRITE_EXTERNAL_STORAGE, Permission.READ_EXTERNAL_STORAGE)) {
            if (mContext == null || mContext.isFinishing())
                return;
            File file = new File(Configure.LAZYCATDIR + File.separator + Configure.APK_NAME);
            if (file.exists()) {
                file.delete();
            }
            createDownloadTask(mContext, installStr);
        } else {
            XXPermissions.gotoPermissionSettings(mContext);
        }
    }

    /**
     * 下载文件
     */
    public void createDownloadTask(final Context self, String url) {
        boolean isDir = false;
        String path = "";

        if (XXPermissions.isHasPermission(self, Permission.WRITE_EXTERNAL_STORAGE, Permission.READ_EXTERNAL_STORAGE)) {
            path = Configure.LAZYCATDIR + File.separator + Configure.APK_NAME;
        }
        /*
          开始下载
         */
        FileDownloader.getImpl().create(url)
                .setPath(path, isDir)
                .setCallbackProgressTimes(300)
                .setMinIntervalUpdateSpeed(400)
                .setListener(new FileDownloadSampleListener() {

                    @Override
                    protected void pending(BaseDownloadTask task, int soFarBytes, int totalBytes) {
                        super.pending(task, soFarBytes, totalBytes);
                    }

                    @Override
                    protected void progress(BaseDownloadTask task, int soFarBytes, int totalBytes) {
                        super.progress(task, soFarBytes, totalBytes);
                        float percent = (float) soFarBytes / totalBytes * 100.0f;
                        showDownloadNotificationUI(self, (int) percent);
                    }

                    @Override
                    protected void error(BaseDownloadTask task, Throwable e) {
                        super.error(task, e);
                    }

                    @Override
                    protected void connected(BaseDownloadTask task, String etag, boolean isContinue, int soFarBytes, int totalBytes) {
                        super.connected(task, etag, isContinue, soFarBytes, totalBytes);
                    }

                    @Override
                    protected void paused(BaseDownloadTask task, int soFarBytes, int totalBytes) {
                        super.paused(task, soFarBytes, totalBytes);
                    }

                    @Override
                    protected void completed(BaseDownloadTask task) {
                        super.completed(task);
                        //下载完成更新通知栏UI
                        showDownloadNotificationUI(self, 100);
                        //关闭通知栏
                        closeNotificationUI();
//                        //安装APK
                        AppVersionModule.getInstance().onHandleResult("3");
                    }

                    @Override
                    protected void warn(BaseDownloadTask task) {
                        super.warn(task);
                    }
                }).start();
    }

    /**
     * 兼容8.0版本
     */
    public void installAppVersion26(final Activity self, final File file) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (XXPermissions.isHasPermission(self, Permission.REQUEST_INSTALL_PACKAGES, Permission.READ_EXTERNAL_STORAGE, Permission.WRITE_EXTERNAL_STORAGE)) {
                install(self, file);
            } else {
                XXPermissions.with(self)
                        .permission(Permission.REQUEST_INSTALL_PACKAGES, Permission.READ_EXTERNAL_STORAGE, Permission.WRITE_EXTERNAL_STORAGE)
                        .constantRequest()
                        .request(new OnPermission() {
                            @Override
                            public void hasPermission(List<String> granted, boolean isAll) {
                                install(self, file);
                            }

                            @Override
                            public void noPermission(List<String> denied, boolean quick) {
                            }
                        });
            }
        } else {
            install(self, file);
        }

    }

    public String judgeUpdate(Integer ver) {
        //1.获取当前APP版本
        String appVersionName = AppUtils.getAppVersionName();
        String version = dealVersion(appVersionName);
        int packVersion = Integer.parseInt(version);
        // 当前已是最新版本
        if(packVersion>=ver){
            return "0";
        }else {
        // 2.扫描本地下载路径是否有最新版本安装包
            File updatePackage = findUpdatePackage(ver);
            if(updatePackage==null){
                return "1";
            }else {
                return "2";
            }
        }
    }
    private String dealVersion(String appVersionName) {
        String[] split = appVersionName.split("[.]");
        StringBuilder version= new StringBuilder();
        version.append(split[0]);
        for (int i = 1; i < split.length; i++) {
            if(split[i].length()==1){
                version.append("0").append(split[i]);
            }else {
                version.append(split[i]);
            }
        }
        return version.toString();
    }

    private File findUpdatePackage(Integer ver) {
        File parent = new File(filepath);
        if(!parent.exists() || parent.isFile()){
            return null;
        }
        File[] apks = parent.listFiles(new FileFilter() {
            @Override
            public boolean accept(File pathname) {
                return pathname.getName().toLowerCase().endsWith(".apk");
            }
        });
        if(apks == null || apks.length == 0){
            return null;
        }
        try {

            /*
               通过 build.gradle 中的 versionCode 来判断
               每次版本更新后 修改versionCode
             */
            PackageManager packageManager = context.getPackageManager();
            PackageInfo packageInfo = packageManager.getPackageInfo(context.getPackageName(), 0);
            File apkFile = null;
            for(File apk : apks){
                PackageInfo apkInfo = packageManager.getPackageArchiveInfo(apk.getAbsolutePath(), 0);
                String apkVer = dealVersion(apkInfo.versionName);
                if(packageInfo.packageName.equals(apkInfo.packageName)&&Integer.parseInt(apkVer)==ver){
                        apkFile = apk;
                        break;
                }
            }
            return apkFile;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
