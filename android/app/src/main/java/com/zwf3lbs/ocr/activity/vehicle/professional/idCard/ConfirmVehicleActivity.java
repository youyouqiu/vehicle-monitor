package com.zwf3lbs.ocr.activity.vehicle.professional.idCard;

import android.content.Intent;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Looper;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.alibaba.fastjson.JSONObject;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.zwf3lbs.ocr.activity.vehicle.OcrVehicleMainActivity;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.util.HttpUri;
import com.zwf3lbs.ocr.util.HttpUtil;
import com.zwf3lbs.ocr.dialog.ConfirmDialog;
import com.zwf3lbs.ocr.dialog.DatePickerDialog;
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;


import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmVehicleActivity extends AppCompatActivity {

    private ImageView id_pic;

    private EditText id_name;

    private TextView id_sex;

    private EditText id_number;

    private MainApplication applicationData;

    private TextView gender_man;

    private TextView gender_women;

    private Button gender_comfirm;

    private BottomSheetDialog bottomSheetDialog;

    private LoadingDialog dialog;

    private String id;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_vehicle_idcard);
        TextView vehicle_plant = findViewById(R.id.vehicle_plant);
        TextView professional = findViewById(R.id.professional);
        id_pic = findViewById(R.id.id_pic);
        id_name = findViewById(R.id.id_name);
        id_sex = findViewById(R.id.id_sex);
        id_number = findViewById(R.id.id_number);

        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            CommonUtil.setActionBar(actionBar, this, "确认信息");
        }


        applicationData = (MainApplication)getApplicationContext();

        vehicle_plant.setText(applicationData.getMonitorName());
        professional.setText(applicationData.isAddProfessional() ? getIntent().getStringExtra("name") : applicationData.getProfessionalName());

        if(applicationData.getProfessionalType() != null && applicationData.getProfessionalType().equals(MainApplication.getIcProfessionalType()) && !applicationData.isAddProfessional()) {
            id_name.setText(applicationData.getIdName());
            id_number.setText(applicationData.getIdentity());
            id_name.setEnabled(false);
            id_number.setEnabled(false);
        } else {
            id_name.setText(getIntent().getStringExtra("name"));
            id_number.setText(getIntent().getStringExtra("identity"));
        }

        id_sex.setText(getIntent().getStringExtra("gender"));

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));



        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmVehicleActivity.this, id_pic,applicationData);
            }
        });


        id_sex.setOnClickListener(new View.OnClickListener() {
            //性别默认值
            String choose = getIntent().getStringExtra("gender");

            @Override
            public void onClick(View view) {
                bottomSheetDialog = new BottomSheetDialog(ConfirmVehicleActivity.this);
                bottomSheetDialog.setContentView(R.layout.ocr_gender_choose);
                bottomSheetDialog.show();

                gender_man = bottomSheetDialog.findViewById(R.id.gender_man);
                gender_women = bottomSheetDialog.findViewById(R.id.gender_woman);
                gender_comfirm = bottomSheetDialog.findViewById(R.id.gender_comfirm);

                gender_man.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        if (choose.equals("女")) {
                            gender_women.setBackground(getResources().getDrawable(R.drawable.textview_border_shape));
                        }
                        gender_man.setBackground(getResources().getDrawable(R.drawable.textview_choose_shape));
                        choose = gender_man.getText().toString();
                    }
                });

                gender_women.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        if (choose.equals("男")) {
                            gender_man.setBackground(getResources().getDrawable(R.drawable.textview_border_shape));
                        }
                        gender_women.setBackground(getResources().getDrawable(R.drawable.textview_choose_shape));
                        choose = gender_women.getText().toString();
                    }
                });

                gender_comfirm.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        id_sex.setText(choose);
                        bottomSheetDialog.cancel();
                    }
                });
            }
        });



        id_number.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmVehicleActivity.this);

            }
        });


        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmVehicleActivity.this)
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
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmVehicleActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("vehicleId", applicationData.getMonitorId());
                            parm.put("oldPhoto", applicationData.getOldPhotoPath());
                            parm.put("type", "1");

                            JSONObject jsonObject = new JSONObject();
                            if (!applicationData.isAddProfessional()) {
                                jsonObject.put("id", applicationData.getProfessionalId());
                            }
                            jsonObject.put("name",id_name.getText().toString());
                            jsonObject.put("gender", id_sex.getText().toString().equals("男") ? "1" : "2");
                            jsonObject.put("identity", id_number.getText().toString());
                            jsonObject.put("identity_card_photo", picJsonObject.getJSONObject("obj").getString("imageFilename"));

                            parm.put("info",jsonObject.toJSONString());

                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadProfessional, parm, ConfirmVehicleActivity.this);
                            JSONObject r = JSONObject.parseObject(re);
                            JSONObject obj = r.getJSONObject("obj");
                            if (r.getBoolean("success") && obj.getString("flag").equals("1")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmVehicleActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmVehicleActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("firstInitNumber",2);
                                intent.putExtra("secondInitNumber",0);
                                startActivity(intent);
                            } else if (r.getBoolean("success") && obj.getString("flag").equals("0")) {
                                dialog.cancel();
                                id = obj.getString("id");
                                if(id == null || id.equals("")) {
                                    CommonUtil.showToastShort(ConfirmVehicleActivity.this,obj.getString("msg"));
                                    return;
                                }
                                final ConfirmDialog confirmDialog = new ConfirmDialog(ConfirmVehicleActivity.this,R.style.ConfirmDialog);
                                confirmDialog.setTitle("提示");

                                confirmDialog.setMessage("该从业人员已存在，是否与监控对象绑定");
                                confirmDialog.setYesOnclickListener("绑定", new ConfirmDialog.onYesOnclickListener() {
                                    @Override
                                    public void onYesOnclick() {
                                        try {
                                            confirmDialog.cancel();
                                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                                            parm.put("vehicleId", applicationData.getMonitorId());
                                            parm.put("newId", id);
                                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.bindProfessional, parm, ConfirmVehicleActivity.this);
                                            JSONObject r = JSONObject.parseObject(re);

                                            if ( r.getJSONObject("obj").getString("flag").equals("1")){
                                                CommonUtil.showToastShort(ConfirmVehicleActivity.this, "绑定成功");
                                                Intent intent = new Intent(ConfirmVehicleActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                                intent.putExtra("firstInitNumber",2);
                                                intent.putExtra("secondInitNumber",0);
                                                startActivity(intent);
                                            } else {
                                                CommonUtil.showToastShort(ConfirmVehicleActivity.this, r.getJSONObject("obj").getString("msg"));
                                            }
                                        }catch (Exception e) {
                                            CommonUtil.showToastShort(ConfirmVehicleActivity.this, "绑定异常");
                                        }
                                    }
                                });

                                confirmDialog.setNoOnclickListener("取消", new ConfirmDialog.onNoOnclickListener() {
                                    @Override
                                    public void onNoClick() {
                                        confirmDialog.cancel();
                                    }
                                });

                                confirmDialog.show();

                            }
                            else {
                                dialog.cancel();
                                CommonUtil.showToast(ConfirmVehicleActivity.this, obj.getString("身份证上传失败"));
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            Log.e("身份证上传异常", e.toString() );
                            CommonUtil.showToast(ConfirmVehicleActivity.this, "身份证上传异常");
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
