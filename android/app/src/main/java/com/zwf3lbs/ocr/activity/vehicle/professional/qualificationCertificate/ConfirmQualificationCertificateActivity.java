package com.zwf3lbs.ocr.activity.vehicle.professional.qualificationCertificate;

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
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.util.HttpUri;
import com.zwf3lbs.ocr.util.HttpUtil;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.lang.ref.WeakReference;
import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmQualificationCertificateActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ImageView id_pic;

    private EditText card_number;

    private LoadingDialog dialog;

    private static class MessageHandler extends Handler {
        private WeakReference<ConfirmQualificationCertificateActivity> target;

        MessageHandler(ConfirmQualificationCertificateActivity activity) {
            this.target = new WeakReference<>(activity);
        }

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            final ConfirmQualificationCertificateActivity activity = target.get();
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
                    .setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("firstInitNumber",2);
            intent.putExtra("secondInitNumber",2);
            startActivity(intent);
        } else {
            dialog.cancel();
            CommonUtil.showToast(this, (String)msg.obj);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_qualification_certificate);
        applicationData = (MainApplication)getApplicationContext();
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            CommonUtil.setActionBar(actionBar, this, "确认信息");
        }

        TextView vehicle_plant = findViewById(R.id.vehicle_plant);
        TextView professional = findViewById(R.id.professional);
        id_pic = findViewById(R.id.id_pic);
        card_number = findViewById(R.id.card_number);

        vehicle_plant.setText(applicationData.getMonitorName());
        professional.setText(applicationData.getProfessionalName());

        if(applicationData.getProfessionalType() != null && applicationData.getProfessionalType().equals(MainApplication.getIcProfessionalType())) {
            card_number.setText(applicationData.getCardNumber());
            card_number.setEnabled(false);
        } else {
            card_number.setText(getIntent().getStringExtra("card_number"));
        }

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));


        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmQualificationCertificateActivity.this, id_pic, applicationData);
            }
        });

        final MessageHandler handler = new MessageHandler(this);
        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmQualificationCertificateActivity.this)
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
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmQualificationCertificateActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("vehicleId", applicationData.getMonitorId());
                            parm.put("oldPhoto", applicationData.getOldQualificationCertificatePhoto());
                            parm.put("type", "3");

                            JSONObject jsonObject = new JSONObject();
                            jsonObject.put("id",applicationData.getProfessionalId());
                            jsonObject.put("card_number",card_number.getText().toString());
                            jsonObject.put("qualification_certificate_photo", picJsonObject.getJSONObject("obj").getString("imageFilename"));

                            parm.put("info",jsonObject.toJSONString());

                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadProfessional, parm,ConfirmQualificationCertificateActivity.this);
                            JSONObject r = JSONObject.parseObject(re);
                            JSONObject obj = r.getJSONObject("obj");
                            if (r.getBoolean("success") && obj.getString("flag").equals("1")) {
                                Message.obtain(handler, 1, "上传成功").sendToTarget();
                            } else {
                                Message.obtain(handler, 2, obj.getString("msg")).sendToTarget();
                            }
                        } catch (Exception e) {
                            Log.e("从业资格证上传异常", e.toString() );
                            Message.obtain(handler, 2, "从业资格证上传异常").sendToTarget();
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
