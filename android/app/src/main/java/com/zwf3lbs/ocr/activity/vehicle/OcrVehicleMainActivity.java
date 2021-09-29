package com.zwf3lbs.ocr.activity.vehicle;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager.widget.PagerAdapter;
import androidx.viewpager.widget.ViewPager;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.animation.GlideAnimation;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.target.Target;
import com.zwf3lbs.ocr.activity.vehicle.carPicture.CarPictureCameraResultActivity;
import com.zwf3lbs.ocr.activity.vehicle.drivingLicense.DrivingLicenseObverseCameraResultActivity;
import com.zwf3lbs.ocr.activity.vehicle.drivingLicense.DrivingLicensePositiveCameraResultActivity;
import com.zwf3lbs.ocr.activity.vehicle.professional.driverLicense.DriverLicenseCameraResultActivity;
import com.zwf3lbs.ocr.activity.vehicle.professional.idCard.VehicleResultChooseActivity;
import com.zwf3lbs.ocr.activity.vehicle.professional.qualificationCertificate.QualificationCertificateCameraResultActivity;
import com.zwf3lbs.ocr.activity.vehicle.transportLicense.TransportLicenseCameraResultActivity;
import com.zwf3lbs.ocr.module.RNBridgeModule;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.util.HttpUri;
import com.zwf3lbs.ocr.util.HttpUtil;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


/**
 * Ocr功能入口函数
 */
public class OcrVehicleMainActivity extends AppCompatActivity {
    private static final String TAG = "OcrVehicleMainActivity";
    private MainApplication applicationData;
    private static Handler mainHandler;
    private ActionBar actionBar;
    private int firstInitNumber = 0;
    private int secondInitNumber = 0;
    private TextView text_driving;
    private TextView text_transport;
    private TextView text_professional;
    private TextView text_car_picture;


    private final static int drivingWhat = 0;
    private final static int transportWhat = 1;
    private final static int professionalWhat = 2;
    private final static int carPictureWhat = 3;
    private final static int professionalInfos = 4;

    private ViewPager mViewPager;
    private List<View> mViews = new ArrayList<>();

    private LinearLayout drivingLicense;
    private LinearLayout transportPermit;
    private LinearLayout professionalLicense;
    private LinearLayout vehiclePicture;

    private ImageButton drivingLicenseImg;
    private ImageButton transportPermitImg;
    private ImageButton professionalLicenseImg;
    private ImageButton vehiclePictureImg;

    //行驶证的正副切换
    private View obverseView;
    private ViewPager drivingViewPager;
    private LinearLayout drivingChange;
    private LinearLayout bottomBorder;
    private PagerAdapter drivingAdapter;
    private List<View> drivingViews = new ArrayList<>();
    private TextView drivingLicenseObverseTextView;
    private TextView drivingLicensePositiveTextView;
    private LinearLayout drivingLicensePositiveBorder;
    private LinearLayout drivingLicenseObverseBorder;
    private ImageView id_pic_positive;
    private TextView chassisNumber;
    private TextView engineNumber;
    private TextView usingNature;
    private TextView brandModel;
    private TextView registrationDate;
    private TextView licenseIssuanceDate;
    private TextView totalQuality;
    private TextView validEndDate;
    private TextView profileSizeLong;
    private TextView profileSizeWide;
    private TextView profileSizeHigh;
    private ImageView id_pic_obverse;
    private RelativeLayout border;

    //运输证
    private ImageView id_pic_transport;
    private TextView transport_card_number;

    //从业人员
    private View professionalView;
    private ViewPager professionalViewPager;
    private List<View> professionalViews = new ArrayList<>();
    private LinearLayout professionalChange;
    private LinearLayout professionalbottomBorder;
    private ImageView professional_more;
    private TextView professional;
    private TextView professionalTextView1;
    private TextView professionalTextView2;
    private TextView professionalTextView3;
    private LinearLayout professionalBorder1;
    private LinearLayout professionalBorder2;
    private LinearLayout professionalBorder3;
    private EditText idCardName;
    private TextView idCardGender;
    private EditText idCardNumber;
    private ImageView id_pic_idCard;
    private ImageView id_pic_driving;
    private EditText drivingLicenseNo;
    private EditText drivingType;
    private TextView drivingStartDate;
    private TextView drivingEndDate;
    private ImageView id_pic_qualification;
    private EditText qualificationCardNumber;
    private HorizontalScrollView horizontalScrollView;
    private LinearLayout scrollview_linearlayout;
    private ImageView chooseImage;
    private TextView chooseView;
    private boolean xialaFlag = false;
    private LinearLayout professional_null;
    private boolean isShowAdd = false;
    private View addProfessionalView;
    private ImageView id_pic_addProfessional;


    //车辆照片
    ImageView id_pic_car_picture;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_vehicle_main);
        applicationData = (MainApplication) getApplication();
        actionBar = getSupportActionBar();
        setInitNumber();
        mainHandler = new MessageHandler(this);
        initView();
        getProfessionalInfos();
        initEvents();
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            RNBridgeModule.getInstance().onExitOCR();
            finishAndRemoveTask();
        }
        return super.onOptionsItemSelected(item);
    }

    //设置进入主页面时进入的子菜单
    private void setInitNumber() {
        firstInitNumber = getIntent().getIntExtra("firstInitNumber", 0);
        secondInitNumber = getIntent().getIntExtra("secondInitNumber", 0);
    }

    private void getProfessionalInfos() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Map<String, String> map = CommonUtil.getHttpParm(applicationData);
                    map.put("id", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.getProfessionalList, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONArray obj = jsonObject.getJSONArray("obj");
                    if (obj != null) {
                        Message.obtain(mainHandler, professionalInfos, obj).sendToTarget();
                    }
                } catch (Exception e) {
                    Log.e(TAG, e.getMessage(), e);
                }
            }
        }).start();
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void initEvents() {

        mViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int i, float v, int i1) {

            }

            @RequiresApi(api = Build.VERSION_CODES.M)
            @Override
            public void onPageSelected(int i) {
                int currentItem = mViewPager.getCurrentItem();
                restImg();
                switch (currentItem) {
                    case 0:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "行驶证信息");
                        drivingLicenseImg.setImageResource(R.drawable.vehicle_license_focus_icon2x);
                        text_driving.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                    case 1:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "运输证信息");
                        transportPermitImg.setImageResource(R.drawable.transport_focus_icon2x);
                        text_transport.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                    case 2:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "从业人员信息");
                        professionalLicenseImg.setImageResource(R.drawable.id_card_focus_icon2x);
                        text_professional.setTextColor(getResources().getColor(R.color.colorBlue, null));

                        //添加滑回从业人员页面时显示收个人员信息
                        if (professionalViewPager != null) {
                            professionalViewPager.setVisibility(View.VISIBLE);
                            horizontalScrollView.setVisibility(View.GONE);
                            professionalbottomBorder.setVisibility(View.VISIBLE);
                            professionalChange.setVisibility(View.VISIBLE);
                            addProfessionalView.setVisibility(View.GONE);
                        } else {
                            horizontalScrollView.setVisibility(View.GONE);
                            addProfessionalView.setVisibility(View.GONE);
                            professional_null.setVisibility(View.VISIBLE);
                        }
                        isShowAdd = false;
                        break;
                    case 3:
                        CommonUtil.setActionBar(actionBar, OcrVehicleMainActivity.this, "车辆照片");
                        vehiclePictureImg.setImageResource(R.drawable.car_photo_focus_icon2x);
                        text_car_picture.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                }

            }

            @Override
            public void onPageScrollStateChanged(int i) {

            }
        });
        CommonUtil.setActionBar(actionBar, this, "行驶证信息");
        drivingLicenseImg.setImageResource(R.drawable.vehicle_license_focus_icon2x);
        text_driving.setTextColor(getResources().getColor(R.color.colorBlue, null));
        mViewPager.setCurrentItem(firstInitNumber);

        drivingLicense.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mViewPager.setCurrentItem(0);
            }
        });

        transportPermit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mViewPager.setCurrentItem(1);
            }
        });
        professionalLicense.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mViewPager.setCurrentItem(2);
            }
        });
        vehiclePicture.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mViewPager.setCurrentItem(3);
            }
        });


    }

    private void initView() {
        mViewPager = findViewById(R.id.id_viewpager);

        text_driving = findViewById(R.id.text_driving);
        text_transport = findViewById(R.id.text_transport);
        text_professional = findViewById(R.id.text_professional);
        text_car_picture = findViewById(R.id.text_car_picture);

        drivingLicense = findViewById(R.id.id_tab_home);
        transportPermit = findViewById(R.id.id_tab_categorise);
        professionalLicense = findViewById(R.id.id_tab_discovery);
        vehiclePicture = findViewById(R.id.id_tab_me);

        drivingLicenseImg = findViewById(R.id.id_tab_home_img);
        transportPermitImg = findViewById(R.id.id_tab_categorise_img);
        professionalLicenseImg = findViewById(R.id.id_tab_discovery_img);
        vehiclePictureImg = findViewById(R.id.id_tab_me_img);

        View driving = View.inflate(this, R.layout.ocr_vehicle_driving_license, null);
        View transport = View.inflate(this, R.layout.ocr_vehicle_transport_permit, null);
        professionalView = View.inflate(this, R.layout.ocr_vehicle_professional, null);
        View carPicture = View.inflate(this, R.layout.ocr_vehicle_car_picture, null);

        initDrivingView(driving);
        initTransportView(transport);
        initProfessionalView(professionalView);
        initCarPictureView(carPicture);

        mViews.add(driving);
        mViews.add(transport);
        mViews.add(professionalView);
        mViews.add(carPicture);


        PagerAdapter mAdapter = new PagerAdapter() {
            @Override
            public int getCount() {
                return mViews.size();
            }

            @NonNull
            @Override
            public Object instantiateItem(@NonNull ViewGroup container, int position) {
                View view = mViews.get(position);
                container.addView(view);
                return view;
            }

            @Override
            public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
                container.removeView(mViews.get(position));
            }

            @Override
            public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
                return view == o;
            }
        };
        mViewPager.setAdapter(mAdapter);
    }

    /**
     * 初始化行驶证上传页面
     */
    @RequiresApi(api = Build.VERSION_CODES.M)
    private void initDrivingView(View idView) {

        CommonUtil.setActionBar(actionBar, this, "行驶证信息");
        bottomBorder = idView.findViewById(R.id.id_bottom_border);
        drivingChange = idView.findViewById(R.id.change);
        border = idView.findViewById(R.id.border);

        drivingLicensePositiveTextView = idView.findViewById(R.id.id_top_1);
        drivingLicenseObverseTextView = idView.findViewById(R.id.id_top_2);
        drivingLicensePositiveBorder = idView.findViewById(R.id.id_bottom_border_1);
        drivingLicenseObverseBorder = idView.findViewById(R.id.id_bottom_border_2);

        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());

        final Context ctx = idView.getContext();
        View positiveView = View.inflate(ctx, R.layout.ocr_vehicle_driving_license_positive, null);

        id_pic_positive = positiveView.findViewById(R.id.id_pic);
        id_pic_positive.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_positive, applicationData);
            }
        });

        chassisNumber = positiveView.findViewById(R.id.chassisNumber);
        engineNumber = positiveView.findViewById(R.id.engineNumber);
        usingNature = positiveView.findViewById(R.id.usingNature);
        brandModel = positiveView.findViewById(R.id.brandModel);
        registrationDate = positiveView.findViewById(R.id.registrationDate);
        licenseIssuanceDate = positiveView.findViewById(R.id.licenseIssuanceDate);
        Button drivingLicensePositiveCamera = positiveView.findViewById(R.id.submit_id);

        obverseView = View.inflate(ctx, R.layout.ocr_vehicle_driving_license_obverse, null);
        id_pic_obverse = obverseView.findViewById(R.id.id_pic);
        id_pic_obverse.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_obverse, applicationData);
            }
        });


        totalQuality = obverseView.findViewById(R.id.totalQuality);
        validEndDate = obverseView.findViewById(R.id.validEndDate);
        profileSizeLong = obverseView.findViewById(R.id.profileSizeLong);
        profileSizeWide = obverseView.findViewById(R.id.profileSizeWide);
        profileSizeHigh = obverseView.findViewById(R.id.profileSizeHigh);
        Button drivingLicenseObverseCamera = obverseView.findViewById(R.id.submit_id);

        drivingViewPager = idView.findViewById(R.id.id_driving_license_viewpager);
        drivingViews.add(positiveView);
        //drivingViews.add(obverseView);

        border.setVisibility(View.GONE);
        drivingChange.setVisibility(View.GONE);
        bottomBorder.setVisibility(View.GONE);


        drivingAdapter = new PagerAdapter() {
            @Override
            public int getCount() {
                return drivingViews.size();
            }

            @NonNull
            @Override
            public Object instantiateItem(@NonNull ViewGroup container, int position) {
                View view = drivingViews.get(position);
                container.addView(view);
                return view;
            }

            @Override
            public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
                container.removeView(drivingViews.get(position));
            }

            @Override
            public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
                return view == o;
            }
        };
        drivingViewPager.setAdapter(drivingAdapter);


        drivingLicensePositiveTextView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                drivingViewPager.setCurrentItem(0);
            }


        });
        drivingLicenseObverseTextView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                drivingViewPager.setCurrentItem(1);
            }
        });
        drivingViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int i, float v, int i1) {

            }

            @RequiresApi(api = Build.VERSION_CODES.M)
            private void reset() {
                drivingLicensePositiveTextView.setTextColor(getResources().getColor(R.color.colorGrey, null));
                drivingLicensePositiveBorder.setBackgroundColor(getResources().getColor(R.color.colorWhite, null));
                drivingLicenseObverseTextView.setTextColor(getResources().getColor(R.color.colorGrey, null));
                drivingLicenseObverseBorder.setBackgroundColor(getResources().getColor(R.color.colorWhite, null));
            }

            @RequiresApi(api = Build.VERSION_CODES.M)
            @Override
            public void onPageSelected(int i) {
                int currentItem = drivingViewPager.getCurrentItem();
                switch (currentItem) {
                    case 0:
                        reset();
                        drivingLicensePositiveTextView.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        drivingLicensePositiveBorder.setBackgroundColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                    case 1:
                        reset();
                        drivingLicenseObverseTextView.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        drivingLicenseObverseBorder.setBackgroundColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                }
            }

            @Override
            public void onPageScrollStateChanged(int i) {
            }
        });
        //初始化行驶证页面
        drivingLicensePositiveTextView.setTextColor(getResources().getColor(R.color.colorBlue, null));
        drivingLicensePositiveBorder.setBackgroundColor(getResources().getColor(R.color.colorBlue, null));
        drivingViewPager.setCurrentItem(secondInitNumber);


        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Map<String, String> map = CommonUtil.getHttpParm(applicationData);
                    map.put("monitorId", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doGET(applicationData.getServiceAddress() + HttpUri.getVehicleDriveLicenseInfo, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONObject obj = jsonObject.getJSONObject("obj");
                    if (obj != null) {
                        Message.obtain(mainHandler, drivingWhat, obj).sendToTarget();
                    }
                } catch (Exception e) {
                    Log.e(TAG, e.getMessage(), e);
                }
            }
        }).start();


        drivingLicensePositiveCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(DrivingLicensePositiveCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        drivingLicenseObverseCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(DrivingLicenseObverseCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });
    }


    /**
     * 初始化运输证上传页面
     */
    private void initTransportView(View idView) {
        CommonUtil.setActionBar(actionBar, this, "运输证信息");
        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());

        final Button submit_id = idView.findViewById(R.id.submit_id);
        id_pic_transport = idView.findViewById(R.id.id_pic);
        id_pic_transport.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_transport, applicationData);
            }
        });

        transport_card_number = idView.findViewById(R.id.card_number);

        submit_id.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(TransportLicenseCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });


        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Map<String, String> map = CommonUtil.getHttpParm(applicationData);
                    map.put("monitorId", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doGET(applicationData.getServiceAddress() + HttpUri.getTransportNumberInfo, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONObject obj = jsonObject.getJSONObject("obj");
                    if (obj != null) {
                        Message.obtain(mainHandler, transportWhat, obj).sendToTarget();
                    }
                } catch (Exception e) {
                    Log.e(TAG, e.getMessage(), e);
                }
            }
        }).start();
    }


    @Override
    protected void onResume() {
        super.onResume();
        if (isShowAdd) {
            //添加滑回从业人员页面时显示收个人员信息
            if (professionalViewPager != null) {
                professionalViewPager.setVisibility(View.VISIBLE);
                horizontalScrollView.setVisibility(View.GONE);
                professionalbottomBorder.setVisibility(View.VISIBLE);
                professionalChange.setVisibility(View.VISIBLE);
                addProfessionalView.setVisibility(View.GONE);
            } else {
                horizontalScrollView.setVisibility(View.GONE);
                addProfessionalView.setVisibility(View.GONE);
                professional_null.setVisibility(View.VISIBLE);
            }
            isShowAdd = false;
        }
    }

    /**
     * 初始化从业人员页面
     */
    private void initProfessionalView(View idView) {

        CommonUtil.setActionBar(actionBar, this, "从业人员信息");
        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());
        professional_more = idView.findViewById(R.id.professional_more);
        professional = idView.findViewById(R.id.professional);
        ImageButton professional_add = idView.findViewById(R.id.professional_add);
        professional_null = idView.findViewById(R.id.professional_null);
        addProfessionalView = idView.findViewById(R.id.add_professional_view);
        Button addProfessionalSubmit = idView.findViewById(R.id.add_submit);
        id_pic_addProfessional = idView.findViewById(R.id.id_pic_addProfessional);


        horizontalScrollView = idView.findViewById(R.id.scrollview);
        scrollview_linearlayout = idView.findViewById(R.id.scrollview_linearlayout);

        professionalbottomBorder = idView.findViewById(R.id.id_bottom_border);
        professionalChange = idView.findViewById(R.id. change);
        professionalTextView1 = idView.findViewById(R.id.id_top_1);
        professionalTextView2 = idView.findViewById(R.id.id_top_2);
        professionalTextView3 = idView.findViewById(R.id.id_top_3);
        professionalBorder1 = idView.findViewById(R.id.id_bottom_border_1);
        professionalBorder2 = idView.findViewById(R.id.id_bottom_border_2);
        professionalBorder3 = idView.findViewById(R.id.id_bottom_border_3);

        professionalbottomBorder.setVisibility(View.GONE);
        professionalChange.setVisibility(View.GONE);
        professional_more.setVisibility(View.GONE);
        addProfessionalView.setVisibility(View.GONE);
        professional.setText("--");


        professional_more.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                checkProfessional();
            }
        });

        professional.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                checkProfessional();
            }
        });

        professional_add.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!isShowAdd) {
                    if (professionalViewPager != null) {
                        professionalViewPager.setVisibility(View.GONE);
                    }
                    horizontalScrollView.setVisibility(View.GONE);
                    professional_null.setVisibility(View.GONE);
                    addProfessionalView.setVisibility(View.VISIBLE);
                    professionalbottomBorder.setVisibility(View.GONE);
                    professionalChange.setVisibility(View.GONE);
                    isShowAdd = true;
                }

            }
        });


        addProfessionalSubmit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setAddProfessional(true);
                applicationData.setPicResultClass(VehicleResultChooseActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }

    });

        id_pic_addProfessional.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_addProfessional, applicationData);
            }
        });


    }

    private void checkProfessional(){
        if (applicationData.getProfessionalInfos().size() > 1) {
            if (xialaFlag) {
                professional_more.setBackgroundResource(R.drawable.xiala);
                horizontalScrollView.setVisibility(View.GONE);
                professionalbottomBorder.setVisibility(View.VISIBLE);
                professionalChange.setVisibility(View.VISIBLE);
                xialaFlag = false;
            } else {
                professional_more.setBackgroundResource(R.drawable.upback);
                professionalbottomBorder.setVisibility(View.GONE);
                professionalChange.setVisibility(View.GONE);
                horizontalScrollView.setVisibility(View.VISIBLE);
                xialaFlag = true;
            }
        } else if(applicationData.getProfessionalInfos().size() == 1) {
            professionalViewPager.setVisibility(View.VISIBLE);
            horizontalScrollView.setVisibility(View.GONE);
            professionalbottomBorder.setVisibility(View.VISIBLE);
            professionalChange.setVisibility(View.VISIBLE);
            addProfessionalView.setVisibility(View.GONE);
            isShowAdd = false;
        }
    }

    /**
     * 初始化车辆照片上传页面
     */
    private void initCarPictureView(View idView) {
        CommonUtil.setActionBar(actionBar, this, "车辆照片");
        final TextView vehicle_plant = idView.findViewById(R.id.vehicle_plant);
        vehicle_plant.setText(applicationData.getMonitorName());

        final Button submit_id = idView.findViewById(R.id.submit_id);
        id_pic_car_picture = idView.findViewById(R.id.id_pic);
        id_pic_car_picture.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_car_picture, applicationData);
            }
        });


        submit_id.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(CarPictureCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Map<String, String> map = CommonUtil.getHttpParm(applicationData);
                    map.put("monitorId", applicationData.getMonitorId());
                    String personInfo = HttpUtil.doGET(applicationData.getServiceAddress() + HttpUri.getVehiclePhotoInfo, map, OcrVehicleMainActivity.this);
                    JSONObject jsonObject = JSONObject.parseObject(personInfo);
                    JSONObject obj = jsonObject.getJSONObject("obj");
                    if (obj != null) {
                        Message.obtain(mainHandler, carPictureWhat, obj).sendToTarget();
                    }
                } catch (Exception e) {
                    Log.e(TAG, e.getMessage(), e);
                }
            }
        }).start();
    }

    private static class MessageHandler extends Handler {
        private WeakReference<OcrVehicleMainActivity> target;

        MessageHandler(OcrVehicleMainActivity activity) {
            this.target = new WeakReference<>(activity);
        }

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            final OcrVehicleMainActivity activity = target.get();
            if (activity != null) {
                activity.update(msg);
            }
        }
    }

    public void update(Message msg) {
        switch (msg.what) {
            case drivingWhat:
                dealDrivingWhat(msg);
                break;
            case transportWhat:
                dealTransportWhat(msg);
                break;
            case professionalWhat:
                dealprofessionalWhat(msg);
                break;
            case carPictureWhat:
                dealCarPictureWhat(msg);
                break;
            case professionalInfos:
                setProfessionalInfos(msg);
                break;
            default:
                break;
        }
    }

    private void dealDrivingWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        Log.e("dealDrivingWhat", obj.toString());
        String registration = obj.getString("registrationDate");
        String licenseIssuance = obj.getString("licenseIssuanceDate");
        if (obj.getString("standard") != null && obj.getString("standard").equals("1")) {
            drivingViews.add(obverseView);
            drivingAdapter.notifyDataSetChanged();
            border.setVisibility(View.VISIBLE);
            drivingChange.setVisibility(View.VISIBLE);
            bottomBorder.setVisibility(View.VISIBLE);

            drivingViewPager.setCurrentItem(secondInitNumber);
        }
        chassisNumber.setText(obj.getString("chassisNumber"));
        engineNumber.setText(obj.getString("engineNumber"));
        usingNature.setText(obj.getString("usingNature"));
        brandModel.setText(obj.getString("brandModel"));
        registrationDate.setText((registration != null && registration.length() > 10) ? registration.substring(0, 10) : registration);
        licenseIssuanceDate.setText((licenseIssuance != null && licenseIssuance.length() > 10) ? licenseIssuance.substring(0, 10) : licenseIssuance);
        applicationData.setOldDrivingLicenseFrontPhoto(obj.getString("drivingLicenseFrontPhoto"));
        String picUriPositive = applicationData.getFASTDFS_ADDRESS() + obj.getString("drivingLicenseFrontPhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUriPositive)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_positive.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_positive.setImageBitmap(resource);
                    }

                    @Override
                    public void onLoadFailed(Exception e, Drawable errorDrawable) {
                        id_pic_positive.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_positive.setImageResource(R.drawable.driving_license_1);
                    }

                });

        String validEndTime = obj.getString("validEndDate");
        totalQuality.setText(obj.getString("totalQuality"));
        validEndDate.setText((validEndTime != null && validEndTime.length() > 7) ? validEndTime.substring(0, 7) : validEndTime);
        profileSizeLong.setText(obj.getString("profileSizeLong"));
        profileSizeWide.setText(obj.getString("profileSizeWide"));
        profileSizeHigh.setText(obj.getString("profileSizeHigh"));
        applicationData.setOldDrivingLicenseDuplicatePhoto(obj.getString("drivingLicenseDuplicatePhoto"));
        String picUriObverse = applicationData.getFASTDFS_ADDRESS() + obj.getString( "drivingLicenseDuplicatePhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUriObverse)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_obverse.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_obverse.setImageBitmap(resource);
                    }

                    @Override
                    public void onLoadFailed(Exception e, Drawable errorDrawable) {
                        id_pic_obverse.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_obverse.setImageResource(R.drawable.driving_license_2);
                    }
                });
    }

    private void dealTransportWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        transport_card_number.setText(obj.getString("transportNumber"));
        applicationData.setOldPhotoPath(obj.getString("transportNumberPhoto"));
        String picUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("transportNumberPhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUri)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_transport.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_transport.setImageBitmap(resource);
                    }
                });
    }

    private void dealprofessionalWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        applicationData.setProfessionalType(obj.getString("positionType"));
        Log.e("dealprofessionalWhat", obj.toJSONString());
        idCardName.setText(obj.getString("name"));
        idCardGender.setText(obj.getString("gender") != null ? (obj.getString("gender").equals("1") ? "男" : "女") : null);
        idCardNumber.setText(obj.getString("identity"));
        applicationData.setOldPhotoPath(obj.getString("identityCardPhoto"));
        applicationData.setIdentity(obj.getString("identity"));
        applicationData.setIdName(obj.getString("name"));
        if (obj.getString("identityCardPhoto") != null && !obj.getString("identityCardPhoto").equals("")) {
            String picUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("identityCardPhoto");
            Glide.with(OcrVehicleMainActivity.this)
                    .load(picUri)
                    .asBitmap().into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                @Override
                public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                    id_pic_idCard.setScaleType(ImageView.ScaleType.FIT_XY);
                    id_pic_idCard.setImageBitmap(resource);
                }

                @Override
                public void onLoadFailed(Exception e, Drawable errorDrawable) {
                    id_pic_idCard.setScaleType(ImageView.ScaleType.FIT_XY);
                    id_pic_idCard.setImageResource(R.drawable.id_card);
                }
            });
        } else {
            id_pic_idCard.setScaleType(ImageView.ScaleType.FIT_XY);
            id_pic_idCard.setImageResource(R.drawable.id_card);
        }

        qualificationCardNumber.setText(obj.getString("cardNumber"));
        applicationData.setCardNumber(obj.getString("cardNumber"));
        applicationData.setOldQualificationCertificatePhoto(obj.getString("qualificationCertificatePhoto"));
        if (obj.getString("qualificationCertificatePhoto") != null && !obj.getString("qualificationCertificatePhoto").equals("")) {
            String qualificationPicUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("qualificationCertificatePhoto");
            Glide.with(OcrVehicleMainActivity.this)
                    .load(qualificationPicUri)
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            id_pic_qualification.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_qualification.setImageBitmap(resource);
                        }

                        @Override
                        public void onLoadFailed(Exception e, Drawable errorDrawable) {
                            id_pic_qualification.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_qualification.setImageResource(R.drawable.professional_qualification);
                        }
                    });
        } else {
            id_pic_qualification.setScaleType(ImageView.ScaleType.FIT_XY);
            id_pic_qualification.setImageResource(R.drawable.professional_qualification);
        }

        applicationData.setDrivingLicenseNo(obj.getString("drivingLicenseNo"));
        drivingLicenseNo.setText(obj.getString("drivingLicenseNo"));
        drivingType.setText(obj.getString("drivingType"));
        String sd = obj.getString("drivingStartDate");
        String ed = obj.getString("drivingEndDate");
        drivingStartDate.setText((sd != null && sd.length() > 10) ? sd.substring(0, 10) : sd);
        drivingEndDate.setText((ed != null && ed.length() > 10) ? ed.substring(0, 10) : ed);
        applicationData.setOldDriverLicensePhoto(obj.getString("driverLicensePhoto"));
        if (obj.getString("driverLicensePhoto") != null && !obj.getString("driverLicensePhoto").equals("")) {
            String driverPic = applicationData.getFASTDFS_ADDRESS() + obj.getString("driverLicensePhoto");
            Glide.with(OcrVehicleMainActivity.this)
                    .load(driverPic)
                    .asBitmap()
                    .dontAnimate()
                    .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                        @Override
                        public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                            id_pic_driving.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_driving.setImageBitmap(resource);
                        }

                        @Override
                        public void onLoadFailed(Exception e, Drawable errorDrawable) {
                            id_pic_driving.setScaleType(ImageView.ScaleType.FIT_XY);
                            id_pic_driving.setImageResource(R.drawable.driver_license);
                        }
                    });
        } else {
            id_pic_driving.setScaleType(ImageView.ScaleType.FIT_XY);
            id_pic_driving.setImageResource(R.drawable.driver_license);
        }

    }


    private void dealCarPictureWhat(Message msg) {
        JSONObject obj = (JSONObject) msg.obj;
        applicationData.setOldPhotoPath(obj.getString("vehiclePhoto"));
        String picUri = applicationData.getFASTDFS_ADDRESS() + obj.getString("vehiclePhoto");
        Glide.with(OcrVehicleMainActivity.this)
                .load(picUri)
                .asBitmap()
                .dontAnimate()
                .into(new SimpleTarget<Bitmap>(Target.SIZE_ORIGINAL, Target.SIZE_ORIGINAL) {
                    @Override
                    public void onResourceReady(Bitmap resource, GlideAnimation glideAnimation) {
                        id_pic_car_picture.setScaleType(ImageView.ScaleType.FIT_XY);
                        id_pic_car_picture.setImageBitmap(resource);
                    }
                });
    }


    @RequiresApi(api = Build.VERSION_CODES.M)
    private void setProfessionalInfos(Message msg) {
        JSONArray obj = (JSONArray) msg.obj;
        Log.e(" setProfessionalInfos", obj.toJSONString());
        final Map<String, String> prpfessionalInfos = new LinkedHashMap<>();
        for (int i = obj.size() - 1; i >= 0; i--) {
            JSONObject jb = JSONObject.parseObject(obj.get(i).toString());
            prpfessionalInfos.put(jb.getString("name"), jb.getString("id"));
        }
        applicationData.setProfessionalInfos(prpfessionalInfos);

        if (prpfessionalInfos.size() <= 0) {
            return;
        }

        professionalbottomBorder.setVisibility(View.VISIBLE);
        professionalChange.setVisibility(View.VISIBLE);
        horizontalScrollView.setVisibility(View.GONE);
        professional_null.setVisibility(View.GONE);

        professional.setText(applicationData.getProfessionalInfos().entrySet().iterator().next().getKey());
        applicationData.setProfessionalId(applicationData.getProfessionalInfos().entrySet().iterator().next().getValue());
        applicationData.setProfessionalName(applicationData.getProfessionalInfos().entrySet().iterator().next().getKey());


        //初始化选择从业人员滑动框
        for (Map.Entry entry : applicationData.getProfessionalInfos().entrySet()) {
            View linearLayout = View.inflate(this, R.layout.ocr_vehicle_professional_professional_choose, null);
            ImageView imageView = linearLayout.findViewById(R.id.professional_choose);
            TextView textView = linearLayout.findViewById(R.id.professional);
            textView.setText((String) entry.getKey());
            if (entry.getValue().equals(applicationData.getProfessionalId())) {
                imageView.setImageResource(R.drawable.renyuan);
                textView.setTextColor(getResources().getColor(R.color.colorOrange, null));
                chooseImage = imageView;
                chooseView = textView;
            }
            scrollview_linearlayout.addView(linearLayout);

            linearLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    chooseImage.setImageResource(R.drawable.renyuan);
                    chooseView.setTextColor(getResources().getColor(R.color.colorBlack, null));
                    chooseImage = v.findViewById(R.id.professional_choose);
                    chooseView = v.findViewById(R.id.professional);
                    chooseImage.setImageResource(R.drawable.renyuan);
                    chooseView.setTextColor(getResources().getColor(R.color.colorOrange, null));
                    applicationData.setProfessionalId(applicationData.getProfessionalInfos().get(chooseView.getText().toString()));
                    applicationData.setProfessionalName(chooseView.getText().toString());
                    professional.setText(chooseView.getText().toString());

                    horizontalScrollView.setVisibility(View.GONE);
                    professionalbottomBorder.setVisibility(View.VISIBLE);
                    professionalChange.setVisibility(View.VISIBLE);
                    addProfessionalView.setVisibility(View.GONE);
                    professional_more.setBackgroundResource(R.drawable.xiala);
                    professionalViewPager.setVisibility(View.VISIBLE);
                    isShowAdd = false;
                    xialaFlag = false;

                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                        try {
                            Map<String, String> map = CommonUtil.getHttpParm(applicationData);
                            map.put("id", applicationData.getProfessionalId());
                            String personInfo = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.getProfessionalInfo, map, OcrVehicleMainActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(personInfo);
                            JSONObject obj = jsonObject.getJSONObject("obj");
                            if (obj != null) {
                                Message.obtain(mainHandler, professionalWhat, obj).sendToTarget();
                            }
                        } catch (Exception e) {
                            Log.e(TAG, e.getMessage(), e);
                        }
                        }
                    }).start();
                }
            });

        }

        final Context ctx = professionalView.getContext();
        View icard = View.inflate(ctx, R.layout.ocr_vehicle_professional_idcard, null);
        Button idCardCamera = icard.findViewById(R.id.submit_id);
        idCardName = icard.findViewById(R.id.id_name);
        idCardGender = icard.findViewById(R.id.id_sex);
        idCardNumber = icard.findViewById(R.id.id_number);
        id_pic_idCard = icard.findViewById(R.id.id_pic);
        id_pic_idCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_idCard, applicationData);
            }
        });


        View driver = View.inflate(ctx, R.layout.ocr_vehicle_professional_driver, null);
        Button driverCamera = driver.findViewById(R.id.submit_id);
        drivingLicenseNo = driver.findViewById(R.id.id_driver_number);
        drivingType = driver.findViewById(R.id.id_car_type);
        drivingStartDate = driver.findViewById(R.id.id_start_date);
        drivingEndDate = driver.findViewById(R.id.id_end_date);
        id_pic_driving = driver.findViewById(R.id.id_pic);
        id_pic_driving.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_driving, applicationData);
            }
        });


        View qualification = View.inflate(ctx, R.layout.ocr_vehicle_professional_qualification, null);
        Button qualificationCamera = qualification.findViewById(R.id.submit_id);
        qualificationCardNumber = qualification.findViewById(R.id.card_number);
        id_pic_qualification = qualification.findViewById(R.id.id_pic);
        id_pic_qualification.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(OcrVehicleMainActivity.this, id_pic_qualification, applicationData);
            }
        });

        professionalViewPager = professionalView.findViewById(R.id.id_professional_license_viewpager);

        professionalViews.add(icard);
        professionalViews.add(driver);
        professionalViews.add(qualification);


        PagerAdapter professionalAdapter = new PagerAdapter() {
            @Override
            public int getCount() {
                return professionalViews.size();
            }

            @NonNull
            @Override
            public Object instantiateItem(@NonNull ViewGroup container, int position) {
                View view = professionalViews.get(position);
                container.addView(view);
                return view;
            }

            @Override
            public void destroyItem(@NonNull ViewGroup container, int position, @NonNull Object object) {
                container.removeView(professionalViews.get(position));
            }

            @Override
            public boolean isViewFromObject(@NonNull View view, @NonNull Object o) {
                return view == o;
            }
        };
        professionalViewPager.setAdapter(professionalAdapter);


        professionalTextView1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                professionalViewPager.setCurrentItem(0);
            }
        });
        professionalTextView2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                professionalViewPager.setCurrentItem(1);
            }
        });
        professionalTextView3.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                professionalViewPager.setCurrentItem(2);
            }
        });

        professionalViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int i, float v, int i1) {

            }

            private void reset() {
                professionalTextView1.setTextColor(getResources().getColor(R.color.colorGrey, null));
                professionalBorder1.setBackgroundColor(getResources().getColor(R.color.colorWhite, null));
                professionalTextView2.setTextColor(getResources().getColor(R.color.colorGrey, null));
                professionalBorder2.setBackgroundColor(getResources().getColor(R.color.colorWhite, null));
                professionalTextView3.setTextColor(getResources().getColor(R.color.colorGrey, null));
                professionalBorder3.setBackgroundColor(getResources().getColor(R.color.colorWhite, null));
            }

            @Override
            public void onPageSelected(int i) {
                int currentItem = professionalViewPager.getCurrentItem();
                switch (currentItem) {
                    case 0:
                        reset();
                        if (applicationData.getProfessionalInfos().size() > 1) {
                            professional_more.setVisibility(View.VISIBLE);
                        } else {
                            professional_more.setVisibility(View.GONE);
                        }
                        professionalTextView1.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        professionalBorder1.setBackgroundColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                    case 1:
                        reset();
                        //professional_more.setVisibility(View.GONE);
                        professionalTextView2.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        professionalBorder2.setBackgroundColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                    case 2:
                        reset();
                        //professional_more.setVisibility(View.GONE);
                        professionalTextView3.setTextColor(getResources().getColor(R.color.colorBlue, null));
                        professionalBorder3.setBackgroundColor(getResources().getColor(R.color.colorBlue, null));
                        break;
                }
            }

            @Override
            public void onPageScrollStateChanged(int i) {
            }
        });
        //初始从业人员页面
        //判断人员下拉按钮是否可见
        if (applicationData.getProfessionalInfos().size() > 1) {
            professional_more.setBackgroundResource(R.drawable.xiala);
            professional_more.setVisibility(View.VISIBLE);
        } else {
            professional_more.setVisibility(View.GONE);
        }
        professionalTextView1.setTextColor(getResources().getColor(R.color.colorBlue, null));
        professionalBorder1.setBackgroundColor(getResources().getColor(R.color.colorBlue, null));
        professionalViewPager.setCurrentItem(secondInitNumber);


        idCardCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setAddProfessional(false);
                applicationData.setPicResultClass(VehicleResultChooseActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        driverCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(DriverLicenseCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });

        qualificationCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                applicationData.setPicResultClass(QualificationCertificateCameraResultActivity.class);
                CommonUtil.checkCameraPermissions(OcrVehicleMainActivity.this);
            }
        });


        new Thread(new Runnable() {
            @Override
            public void run() {
            try {
                Map<String, String> map = CommonUtil.getHttpParm(applicationData);
                map.put("id", applicationData.getProfessionalId());
                String personInfo = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.getProfessionalInfo, map, OcrVehicleMainActivity.this);
                JSONObject jsonObject = JSONObject.parseObject(personInfo);
                JSONObject obj = jsonObject.getJSONObject("obj");
                if (obj != null) {
                    Message.obtain(mainHandler, professionalWhat, obj).sendToTarget();
                }
            } catch (Exception e) {
                Log.e(TAG, e.getMessage(), e);
            }
            }
        }).start();
    }


    private void restImg() {
        drivingLicenseImg.setImageResource(R.drawable.vehicle_license_blur_icon2x);
        transportPermitImg.setImageResource(R.drawable.transport_blur_icon2x);
        professionalLicenseImg.setImageResource(R.drawable.id_card_blur_icon2x);
        vehiclePictureImg.setImageResource(R.drawable.car_photo_blur_icon2x);
        text_driving.setTextColor(getResources().getColor(R.color.colorGrey, null));
        text_transport.setTextColor(getResources().getColor(R.color.colorGrey, null));
        text_professional.setTextColor(getResources().getColor(R.color.colorGrey, null));
        text_car_picture.setTextColor(getResources().getColor(R.color.colorGrey, null));
    }
}
