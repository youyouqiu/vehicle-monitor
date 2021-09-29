package com.zwf3lbs.zwf3lbsapp;

import android.app.Application;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.graphics.Bitmap;
import android.util.Log;
import android.widget.Toast;

import androidx.multidex.MultiDex;

import com.baidu.lbsapi.BMapManager;
import com.baidu.lbsapi.MKGeneralListener;
import com.baidu.mapapi.SDKInitializer;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.tencent.bugly.Bugly;
import com.umeng.commonsdk.UMConfigure;
import com.umeng.socialize.PlatformConfig;
import com.zwf3lbs.map.BaiduMapViewPackage;
import com.zwf3lbs.marqueeLabel.RCTMarqueeLabelPackage;
import com.zwf3lbs.ocr.util.FileUtils;
import com.zwf3lbs.ocr.util.LogcatHelper;
import com.zwf3lbs.ocr.util.RudenessScreenHelper;
import com.zwf3lbs.share.DplusReactPackage;
import com.zwf3lbs.share.RNUMConfigure;
import com.zwf3lbs.stream.StreamPlayerPackage;

import java.lang.reflect.InvocationTargetException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

//import com.tencent.bugly.crashreport.CrashReport;

public class MainApplication extends Application implements ReactApplication {

    private static final String TAG = "MainApplication";
    private static MainApplication mInstance = null;
    public BMapManager mBMapManager = null;

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            List<ReactPackage> packages = new PackageList(this).getPackages();
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(new MyReactNativePackage());
            //
            packages.add(new BaiduMapViewPackage());
            packages.add(new RCTMarqueeLabelPackage());
            packages.add(new StreamPlayerPackage()); // 音视频
            packages.add(new DplusReactPackage());
            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mInstance = this;
        //安卓屏幕自适应
        new RudenessScreenHelper(this, 350, 820).activate();
        //SoLoader.init(this, /* native exopackage */ false);
        if (!isDebug(this)) {
//            CrashReport.initCrashReport(getApplicationContext(), "b184ee4b59", true);
            Bugly.init(getApplicationContext(), "b184ee4b59", true);
            CrashHandler.getInstance().init(this);
        }
        FileUtils.deleteFileByTime(FileUtils.PATH_LOG, 2);
        LogcatHelper.getInstance().start();
        SDKInitializer.initialize(getApplicationContext());
        SoLoader.init(this, false);
//        initEngineManager(this);
        RNUMConfigure.init(this, "5d7f56dd3fc195a8e4000e16", "Umeng", UMConfigure.DEVICE_TYPE_PHONE,
                "");
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }

    public void initEngineManager(Context context) {
        if (mBMapManager == null) {
            mBMapManager = new BMapManager(context);
        }

        if (!mBMapManager.init(new MyGeneralListener())) {
            Toast.makeText(getInstance().getApplicationContext(), "BMapManager  初始化错误!",
                    Toast.LENGTH_LONG).show();
        }
        Log.d("ljx", "initEngineManager");
    }

    public static MainApplication getInstance() {
        return mInstance;
    }

    // 常用事件监听，用来处理通常的网络错误，授权验证错误等
    public static class MyGeneralListener implements MKGeneralListener {

        @Override
        public void onGetPermissionState(int iError) {
            // 非零值表示key验证未通过
            if (iError != 0) {
                // 授权Key错误：
                Log.i(TAG, "key认证失败");
                /*Toast.makeText(MainApplication.getInstance().getApplicationContext(),
                        "请在AndoridManifest.xml中输入正确的授权Key,并检查您的网络连接是否正常！error: " + iError, Toast.LENGTH_LONG).show();*/
            } else {
                Log.i(TAG, "key认证成功");
                /*Toast.makeText(MainApplication.getInstance().getApplicationContext(), "key认证成功", Toast.LENGTH_LONG)
                        .show();*/
            }
        }
    }

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     */
    private static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            try {
                Class<?> aClass = Class.forName("com.zwf3lbs.zwf3lbsapp.ReactNativeFlipper");
                aClass
                        .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                        .invoke(null, context, reactInstanceManager);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }

    // 配置平台
    static {
        PlatformConfig.setWeixin("wx4f7d606dde72cc1d", "ec7c6e1c762314a596ee8606154db647");
        PlatformConfig.setQQZone("1106561424", "ArH8OHXaNVU1hdB4");
    }

    private static boolean isDebug(Context context) {
        try {
            ApplicationInfo info = context.getApplicationInfo();
            return (info.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        } catch (Exception e) {
            return false;
        }
    }


    //ocr
    private String serviceAddress;

    private String access_token;//token

    private String monitorId; //监控对象id

    private String monitorName;

    private String platform;

    private Class<?> picResultClass;

    private String version;

    //fastdfs地址
    private String FASTDFS_ADDRESS;

    private String oldPhotoPath;//旧的人员身份证照片存储路径

    private String oldDrivingLicenseFrontPhoto;//旧的行驶证正面照片地址

    private String oldDrivingLicenseDuplicatePhoto;//旧的行驶证副面照片地址

    private String oldDriverLicensePhoto;//旧的驾驶证照片地址

    private String oldQualificationCertificatePhoto;//旧的从业资格证照片地址

    //fe75ffc3-1689-4fb1-a4ec-121b2f4d47ec,64b0b86c-ce77-491a-8ad2-5a873789e23f,1ffe4d77-43a9-456a-a79b-86000a1dab96
    private String professionalId;

    private String professionalName;

    //从也人员类型
    private String professionalType;

    //ic卡岗位类型
    private static String IcProfessionalType = "ed057aa7-64b8-4ec1-9b14-dbc62b4286d4";

    //标记是否是新增从业人员
    private boolean isAddProfessional = false;

    //姓名
    private String idName;

    private String drivingLicenseNo;

    private String identity;

    private String cardNumber;

    private Map<String, String> professionalInfos = new LinkedHashMap<>();

    private Bitmap bigPic;

    public ReactNativeHost getmReactNativeHost() {
        return mReactNativeHost;
    }

    public String getServiceAddress() {
        return serviceAddress;
    }

    public void setServiceAddress(String serviceAddress) {
        this.serviceAddress = serviceAddress;
    }

    public String getAccess_token() {
        return access_token;
    }

    public void setAccess_token(String access_token) {
        this.access_token = access_token;
    }

    public String getMonitorId() {
        return monitorId;
    }

    public void setMonitorId(String monitorId) {
        this.monitorId = monitorId;
    }

    public String getMonitorName() {
        return monitorName;
    }

    public void setMonitorName(String monitorName) {
        this.monitorName = monitorName;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public Class<?> getPicResultClass() {
        return picResultClass;
    }

    public void setPicResultClass(Class<?> picResultClass) {
        this.picResultClass = picResultClass;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getFASTDFS_ADDRESS() {
        return FASTDFS_ADDRESS;
    }

    public void setFASTDFS_ADDRESS(String FASTDFS_ADDRESS) {
        this.FASTDFS_ADDRESS = FASTDFS_ADDRESS;
    }

    public String getOldPhotoPath() {
        return oldPhotoPath;
    }

    public void setOldPhotoPath(String oldPhotoPath) {
        this.oldPhotoPath = oldPhotoPath;
    }

    public String getOldDrivingLicenseFrontPhoto() {
        return oldDrivingLicenseFrontPhoto;
    }

    public void setOldDrivingLicenseFrontPhoto(String oldDrivingLicenseFrontPhoto) {
        this.oldDrivingLicenseFrontPhoto = oldDrivingLicenseFrontPhoto;
    }

    public String getOldDrivingLicenseDuplicatePhoto() {
        return oldDrivingLicenseDuplicatePhoto;
    }

    public void setOldDrivingLicenseDuplicatePhoto(String oldDrivingLicenseDuplicatePhoto) {
        this.oldDrivingLicenseDuplicatePhoto = oldDrivingLicenseDuplicatePhoto;
    }

    public String getOldDriverLicensePhoto() {
        return oldDriverLicensePhoto;
    }

    public void setOldDriverLicensePhoto(String oldDriverLicensePhoto) {
        this.oldDriverLicensePhoto = oldDriverLicensePhoto;
    }

    public String getOldQualificationCertificatePhoto() {
        return oldQualificationCertificatePhoto;
    }

    public void setOldQualificationCertificatePhoto(String oldQualificationCertificatePhoto) {
        this.oldQualificationCertificatePhoto = oldQualificationCertificatePhoto;
    }

    public String getProfessionalId() {
        return professionalId;
    }

    public void setProfessionalId(String professionalId) {
        this.professionalId = professionalId;
    }

    public String getProfessionalName() {
        return professionalName;
    }

    public void setProfessionalName(String professionalName) {
        this.professionalName = professionalName;
    }

    public String getProfessionalType() {
        return professionalType;
    }

    public void setProfessionalType(String professionalType) {
        this.professionalType = professionalType;
    }

    public static String getIcProfessionalType() {
        return IcProfessionalType;
    }

    public static void setIcProfessionalType(String icProfessionalType) {
        IcProfessionalType = icProfessionalType;
    }

    public boolean isAddProfessional() {
        return isAddProfessional;
    }

    public void setAddProfessional(boolean addProfessional) {
        isAddProfessional = addProfessional;
    }

    public String getIdName() {
        return idName;
    }

    public void setIdName(String idName) {
        this.idName = idName;
    }

    public String getDrivingLicenseNo() {
        return drivingLicenseNo;
    }

    public void setDrivingLicenseNo(String drivingLicenseNo) {
        this.drivingLicenseNo = drivingLicenseNo;
    }

    public String getIdentity() {
        return identity;
    }

    public void setIdentity(String identity) {
        this.identity = identity;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public Map<String, String> getProfessionalInfos() {
        return professionalInfos;
    }

    public void setProfessionalInfos(Map<String, String> professionalInfos) {
        this.professionalInfos = professionalInfos;
    }

    public Bitmap getBigPic() {
        return bigPic;
    }

    public void setBigPic(Bitmap bigPic) {
        this.bigPic = bigPic;
    }

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        MultiDex.install(this);
    }
}
