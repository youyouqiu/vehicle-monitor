package com.zwf3lbs.ocr.activity.vehicle.transportLicense;

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
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.util.HttpUri;
import com.zwf3lbs.ocr.util.HttpUtil;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmTransportLicenseActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ImageView id_pic;

    private EditText transportNumber;

    private LoadingDialog dialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_transport);
        applicationData = (MainApplication)getApplicationContext();
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            CommonUtil.setActionBar(actionBar, this, "确认信息");
        }

        TextView vehicle_plant = findViewById(R.id.vehicle_plant);
        id_pic = findViewById(R.id.id_pic);
        transportNumber = findViewById(R.id.card_number);

        vehicle_plant.setText(applicationData.getMonitorName());

        transportNumber.setText(getIntent().getStringExtra("transportNumber"));

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));

        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmTransportLicenseActivity.this, id_pic,applicationData);
            }
        });


        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmTransportLicenseActivity.this)
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
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmTransportLicenseActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("monitorId", applicationData.getMonitorId());
                            parm.put("transportNumber", transportNumber.getText().toString());
                            parm.put("transportNumberPhoto", picJsonObject.getJSONObject("obj").getString("imageFilename"));
                            parm.put("oldTransportNumberPhoto", applicationData.getOldPhotoPath());
                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadTransportNumberInfo, parm,ConfirmTransportLicenseActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(re);
                            if (jsonObject.getBoolean("success")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmTransportLicenseActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmTransportLicenseActivity.this, OcrVehicleMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                intent.putExtra("firstInitNumber",1);
                                startActivity(intent);
                            }else {
                                dialog.cancel();
                                CommonUtil.showToast(ConfirmTransportLicenseActivity.this,"运输证上传失败");
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            Log.e("运输证上传异常", e.toString() );
                            CommonUtil.showToast(ConfirmTransportLicenseActivity.this, "运输证上传异常");
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

