package com.zwf3lbs.ocr.activity.vehicle.drivingLicense;

import android.content.Intent;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;

import com.alibaba.fastjson.JSONObject;
import com.zwf3lbs.ocr.activity.vehicle.OcrVehicleMainActivity;
import com.zwf3lbs.ocr.dialog.DatePickerDialog;
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.util.DateUtil;
import com.zwf3lbs.ocr.util.HttpUri;
import com.zwf3lbs.ocr.util.HttpUtil;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.List;
import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmDrivingLicenseObverseActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ImageView id_pic;

    private TextView validEndDate;

    private EditText totalQuality;

    private EditText profileSizeLong;

    private EditText profileSizeWide;

    private EditText profileSizeHigh;

    private LoadingDialog dialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_driving_obverse);
        applicationData = (MainApplication)getApplicationContext();
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            CommonUtil.setActionBar(actionBar, this, "确认信息");
        }

        TextView vehicle_plant = findViewById(R.id.vehicle_plant);
        id_pic = findViewById(R.id.id_pic);
        validEndDate = findViewById(R.id.validEndDate);
        totalQuality = findViewById(R.id.totalQuality);
        profileSizeLong = findViewById(R.id.profileSizeLong);
        profileSizeWide = findViewById(R.id.profileSizeWide);
        profileSizeHigh = findViewById(R.id.profileSizeHigh);

        vehicle_plant.setText(applicationData.getMonitorName());

        validEndDate.setText(DateUtil.getChiesesDate(getIntent().getStringExtra("validEndDate")));
        totalQuality.setText(getIntent().getStringExtra("totalQuality"));
        profileSizeLong.setText(getIntent().getStringExtra("profileSizeLong"));
        profileSizeWide.setText(getIntent().getStringExtra("profileSizeWide"));
        profileSizeHigh.setText(getIntent().getStringExtra("profileSizeHigh"));

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));


        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmDrivingLicenseObverseActivity.this, id_pic, applicationData);
            }
        });

        validEndDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<Integer> date;
                try {
                    date = DateUtil.getDateListForString(DateUtil.getFormat2(getIntent().getStringExtra("validEndDate") +  "01"));
                } catch (Exception e){
                    date = DateUtil.getDateListForString(DateUtil.getToday());
                }
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmDrivingLicenseObverseActivity.this);
                builder.setOnDateSelectedListener(new DatePickerDialog.OnDateSelectedListener() {
                    @Override
                    public void onDateSelected(int[] dates) {
                        validEndDate.setText(dates[0] + "年" + (dates[1] > 9 ? dates[1] : ("0" + dates[1])) + "月");
                    }

                    @Override
                    public void onCancel() {

                    }
                })
                        .setSelectYear(date.get(0) - 1)
                        .setSelectMonth(date.get(1) - 1)
                        .setSelectDay(date.get(2) - 1);
                builder.setMinYear(2000);
                builder.setMaxYear(2050);
                builder.setMaxMonth(DateUtil.getDateListForString(DateUtil.getToday()).get(1));
                builder.setMaxDay(DateUtil.getDateListForString(DateUtil.getToday()).get(2));
                builder.setType(DatePickerDialog.Builder.MONTH);
                DatePickerDialog dateDialog = builder.create();
                dateDialog.show();
            }
        });



        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmDrivingLicenseObverseActivity.this)
                        .setMessage("上传中...")
                        .setCancelable(false)
                        .setCancelOutside(false);
                if (dialog != null && dialog.isShowing()) {
                    return;
                } else {
                    dialog = loadBuilder.create();
                    dialog.show();
                }
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Looper.prepare();
                            String fileString = HttpUtil.bitmapToString(getIntent().getStringExtra("filePath"));
                            Map<String, String> parmPic = CommonUtil.getHttpParm(applicationData);
                            parmPic.put("monitorId", applicationData.getMonitorId());
                            parmPic.put("decodeImage", fileString);
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmDrivingLicenseObverseActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("monitorId", applicationData.getMonitorId());
                            parm.put("totalQuality",totalQuality.getText().toString());
                            parm.put("profileSizeLong", profileSizeLong.getText().toString());
                            parm.put("profileSizeWide", profileSizeWide.getText().toString());
                            parm.put("drivingLicenseDuplicatePhoto", picJsonObject.getJSONObject("obj").getString("imageFilename"));
                            parm.put("oldDrivingLicenseDuplicatePhoto", applicationData.getOldDrivingLicenseDuplicatePhoto());
                            parm.put("profileSizeHigh", profileSizeHigh.getText().toString());
                            parm.put("validEndDate", validEndDate.getText().toString().replace("年","").replace("月","") + "01");
                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadVehicleDriveLicenseDuplicateInfo, parm,ConfirmDrivingLicenseObverseActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(re);
                            if (jsonObject.getBoolean("success")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmDrivingLicenseObverseActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmDrivingLicenseObverseActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("firstInitNumber",0);
                                intent.putExtra("secondInitNumber",1);
                                startActivity(intent);
                            } else {
                                Looper.prepare();
                                CommonUtil.showToast(ConfirmDrivingLicenseObverseActivity.this, "行驶证副面上传失败");
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            Log.e("行驶证副面上传异常", e.toString() );
                            CommonUtil.showToast(ConfirmDrivingLicenseObverseActivity.this, "行驶证副面上传异常");
                        } finally {
                            Looper.loop();
                        }
                    }
                }).start();

            }
        });
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
        }
        return super.onOptionsItemSelected(item);
    }
}
