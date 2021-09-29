package com.zwf3lbs.ocr.activity.vehicle.professional.driverLicense;

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

public class ConfirmDriverLicenseActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ImageView id_pic;

    private EditText driving_license_no;

    private EditText driving_type;

    private TextView driving_start_date;

    private TextView driving_end_date;

    private LoadingDialog dialog;

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_professional_driver);
        applicationData = (MainApplication)getApplicationContext();
        ActionBar actionBar = getSupportActionBar();
        CommonUtil.setActionBar(actionBar, this, "确认信息");

        TextView vehicle_plant = findViewById(R.id.vehicle_plant);
        TextView professional = findViewById(R.id.professional);
        id_pic = findViewById(R.id.id_pic);
        driving_license_no = findViewById(R.id.id_driver_number);
        driving_type = findViewById(R.id.id_car_type);
        driving_start_date = findViewById(R.id.id_start_date);
        driving_end_date = findViewById(R.id.id_end_date);

        vehicle_plant.setText(applicationData.getMonitorName());
        professional.setText(applicationData.getProfessionalName());

        if(applicationData.getProfessionalType() != null && applicationData.getProfessionalType().equals(MainApplication.getIcProfessionalType())) {
            driving_license_no.setText(applicationData.getDrivingLicenseNo());
            driving_license_no.setEnabled(false);
        } else {
            driving_license_no.setText(getIntent().getStringExtra("driving_license_no"));
        }
        driving_type.setText(getIntent().getStringExtra("driving_type"));
        driving_start_date.setText(DateUtil.getFormat2(getIntent().getStringExtra("driving_start_date")));
        driving_end_date.setText(DateUtil.getFormat2(getIntent().getStringExtra("driving_end_date")));

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));

        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmDriverLicenseActivity.this, id_pic, applicationData);
            }
        });


        driving_start_date.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<Integer> date;
                try {
                    date = DateUtil.getDateListForString(DateUtil.getFormat2(getIntent().getStringExtra("driving_start_date")));
                } catch (Exception e){
                    date = DateUtil.getDateListForString(DateUtil.getToday());
                }

                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmDriverLicenseActivity.this);
                builder.setOnDateSelectedListener(new DatePickerDialog.OnDateSelectedListener() {
                    @Override
                    public void onDateSelected(int[] dates) {
                        driving_start_date.setText(dates[0] + "-" + (dates[1] > 9 ? dates[1] : ("0" + dates[1])) + "-"
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
                builder.setMaxMonth(DateUtil.getDateListForString(DateUtil.getToday()).get(1));
                builder.setMaxDay(DateUtil.getDateListForString(DateUtil.getToday()).get(2));
                DatePickerDialog dateDialog = builder.create();
                dateDialog.show();
            }
        });

        //日历选择
        driving_end_date.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<Integer> date;
                try {
                    date = DateUtil.getDateListForString(DateUtil.getFormat2(getIntent().getStringExtra("driving_end_date")));
                } catch (Exception e){
                    date = DateUtil.getDateListForString(DateUtil.getToday());
                }
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmDriverLicenseActivity.this);
                builder.setOnDateSelectedListener(new DatePickerDialog.OnDateSelectedListener() {
                    @Override
                    public void onDateSelected(int[] dates) {
                        driving_end_date.setText(dates[0] + "-" + (dates[1] > 9 ? dates[1] : ("0" + dates[1])) + "-"
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
                builder.setMaxMonth(DateUtil.getDateListForString(DateUtil.getToday()).get(1));
                builder.setMaxDay(DateUtil.getDateListForString(DateUtil.getToday()).get(2));
                DatePickerDialog dateDialog = builder.create();
                dateDialog.show();
            }
        });


        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmDriverLicenseActivity.this)
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
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic, ConfirmDriverLicenseActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);

                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("vehicleId", applicationData.getMonitorId());
                            parm.put("oldPhoto", applicationData.getOldDriverLicensePhoto());
                            parm.put("type", "2");

                            JSONObject jsonObject = new JSONObject();
                            jsonObject.put("id",applicationData.getProfessionalId());
                            jsonObject.put("driving_license_no",driving_license_no.getText().toString());
                            jsonObject.put("driving_type",driving_type.getText().toString());
                            jsonObject.put("driving_start_date",driving_start_date.getText().toString().replace("-",""));
                            jsonObject.put("driving_end_date",driving_end_date.getText().toString().replace("-",""));
                            jsonObject.put("driver_license_photo", picJsonObject.getJSONObject("obj").getString("imageFilename"));

                            parm.put("info",jsonObject.toJSONString());

                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadProfessional, parm, ConfirmDriverLicenseActivity.this);
                            JSONObject r = JSONObject.parseObject(re);
                            JSONObject obj = r.getJSONObject("obj");
                            if (r.getBoolean("success") && obj.getString("flag").equals("1")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmDriverLicenseActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmDriverLicenseActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("firstInitNumber",2);
                                intent.putExtra("secondInitNumber",1);
                                startActivity(intent);
                            } else {
                                dialog.cancel();
                                CommonUtil.showToast(ConfirmDriverLicenseActivity.this, obj.getString("msg"));
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            Log.e("驾驶证上传异常", e.toString() );
                            CommonUtil.showToast(ConfirmDriverLicenseActivity.this, "驾驶证上传异常");
                        } finally {
                            Looper.loop();
                        }
                    }
                }).start();

            }
        });

    }

}
