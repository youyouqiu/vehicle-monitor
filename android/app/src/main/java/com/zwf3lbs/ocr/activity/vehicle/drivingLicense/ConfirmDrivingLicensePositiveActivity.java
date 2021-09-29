package com.zwf3lbs.ocr.activity.vehicle.drivingLicense;

import android.content.Intent;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
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

import java.lang.ref.WeakReference;
import java.util.List;
import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmDrivingLicensePositiveActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ImageView id_pic;

    private EditText chassisNumber;

    private EditText engineNumber;

    private EditText usingNature;

    private EditText brandModel;

    private TextView registrationDate;

    private TextView licenseIssuanceDate;

    private  LoadingDialog dialog;

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
        }
        return super.onOptionsItemSelected(item);
    }

    private static class MessageHandler extends Handler {
        private WeakReference<ConfirmDrivingLicensePositiveActivity> target;

        MessageHandler(ConfirmDrivingLicensePositiveActivity activity) {
            this.target = new WeakReference<>(activity);
        }

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            final ConfirmDrivingLicensePositiveActivity activity = target.get();
            if (activity != null) {
                activity.update(msg);
            }
        }
    }

    public void update(Message msg) {
        if (msg.what == 1) {
            dialog.cancel();
            CommonUtil.showToastShort(this, (String)msg.obj);
            Intent intent = new Intent(this, OcrVehicleMainActivity.class)
                    .setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK)
                    .putExtra("firstInitNumber",0)
                    .putExtra("secondInitNumber",0);
            startActivity(intent);
        } else {
            dialog.cancel();
            CommonUtil.showToast(this, (String)msg.obj);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_driving_positive);
        applicationData = (MainApplication)getApplicationContext();
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            CommonUtil.setActionBar(actionBar, this, "确认信息");
        }

        TextView vehicle_plant = findViewById(R.id.vehicle_plant);
        id_pic = findViewById(R.id.id_pic);
        chassisNumber = findViewById(R.id.chassisNumber);
        engineNumber = findViewById(R.id.engineNumber);
        usingNature = findViewById(R.id.usingNature);
        brandModel = findViewById(R.id.brandModel);
        registrationDate = findViewById(R.id.registrationDate);
        licenseIssuanceDate = findViewById(R.id.licenseIssuanceDate);

        vehicle_plant.setText(applicationData.getMonitorName());

        chassisNumber.setText(getIntent().getStringExtra("chassisNumber"));
        engineNumber.setText(getIntent().getStringExtra("engineNumber"));
        usingNature.setText(getIntent().getStringExtra("usingNature"));
        brandModel.setText(getIntent().getStringExtra("brandModel"));
        registrationDate.setText(DateUtil.getFormat2(getIntent().getStringExtra("registrationDate")));
        licenseIssuanceDate.setText(DateUtil.getFormat2(getIntent().getStringExtra("licenseIssuanceDate")));

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));

        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmDrivingLicensePositiveActivity.this, id_pic, applicationData);
            }
        });


        registrationDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<Integer> date = DateUtil.getDateListForString(DateUtil.getFormat2(getIntent().getStringExtra("registrationDate")));
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmDrivingLicensePositiveActivity.this);
                builder.setOnDateSelectedListener(new DatePickerDialog.OnDateSelectedListener() {
                    @Override
                    public void onDateSelected(int[] dates) {
                        registrationDate.setText(dates[0] + "-" + (dates[1] > 9 ? dates[1] : ("0" + dates[1])) + "-"
                                + (dates[2] > 9 ? dates[2] : ("0" + dates[2])));
                    }

                    @Override
                    public void onCancel() {

                    }
                })
                        .setSelectYear(date.get(0) - 1)
                        .setSelectMonth(date.get(1) - 1)
                        .setSelectDay(date.get(2) - 1);
                builder.setMinYear(2000);
                builder.setMaxYear(DateUtil.getYear());
                builder.setMaxMonth(DateUtil.getDateListForString(DateUtil.getToday()).get(1));
                builder.setMaxDay(DateUtil.getDateListForString(DateUtil.getToday()).get(2));
                DatePickerDialog dateDialog = builder.create();
                dateDialog.show();
            }
        });

        //日历选择
        licenseIssuanceDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<Integer> date = DateUtil.getDateListForString(DateUtil.getFormat2(getIntent().getStringExtra("licenseIssuanceDate")));
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmDrivingLicensePositiveActivity.this);
                builder.setOnDateSelectedListener(new DatePickerDialog.OnDateSelectedListener() {
                    @Override
                    public void onDateSelected(int[] dates) {
                        licenseIssuanceDate.setText(dates[0] + "-" + (dates[1] > 9 ? dates[1] : ("0" + dates[1])) + "-"
                                + (dates[2] > 9 ? dates[2] : ("0" + dates[2])));
                    }

                    @Override
                    public void onCancel() {

                    }
                })
                        .setSelectYear(date.get(0) - 1)
                        .setSelectMonth(date.get(1) - 1)
                        .setSelectDay(date.get(2) - 1);
                builder.setMinYear(2000);
                builder.setMaxYear(DateUtil.getYear());
                builder.setMaxMonth(DateUtil.getDateListForString(DateUtil.getToday()).get(1));
                builder.setMaxDay(DateUtil.getDateListForString(DateUtil.getToday()).get(2));
                DatePickerDialog dateDialog = builder.create();
                dateDialog.show();
            }
        });

        final MessageHandler handler = new MessageHandler(this);
        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmDrivingLicensePositiveActivity.this)
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
                            String fileString = HttpUtil.bitmapToString(getIntent().getStringExtra("filePath"));
                            Map<String, String> parmPic = CommonUtil.getHttpParm(applicationData);
                            parmPic.put("monitorId", applicationData.getMonitorId());
                            parmPic.put("decodeImage", fileString);

                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmDrivingLicensePositiveActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("monitorId", applicationData.getMonitorId());
                            parm.put("chassisNumber",chassisNumber.getText().toString());
                            parm.put("engineNumber", engineNumber.getText().toString());
                            parm.put("usingNature", usingNature.getText().toString());
                            parm.put("drivingLicenseFrontPhoto", picJsonObject.getJSONObject("obj").getString("imageFilename"));
                            parm.put("oldDrivingLicenseFrontPhoto", applicationData.getOldDrivingLicenseFrontPhoto());
                            parm.put("brandModel", brandModel.getText().toString());
                            parm.put("registrationDate", registrationDate.getText().toString().replace("-",""));
                            parm.put("licenseIssuanceDate", licenseIssuanceDate.getText().toString().replace("-",""));
                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadVehicleDriveLicenseFrontInfo, parm,ConfirmDrivingLicensePositiveActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(re);
                            if (jsonObject.getBoolean("success")) {
                                Message.obtain(handler, 1, "上传成功").sendToTarget();
                            } else {
                                Message.obtain(handler, 2, "行驶证正面上传失败").sendToTarget();
                            }
                        } catch (Exception e) {
                            Log.e("行驶证正面上传异常", e.toString() );
                            Message.obtain(handler, 2, "行驶证正面上传异常v").sendToTarget();
                        }
                    }
                }).start();

            }
        });

    }

}
