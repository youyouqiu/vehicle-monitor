package com.zwf3lbs.ocr.activity.vehicle.carPicture;

import android.content.Intent;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
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

public class ConfirmCarPictureActivity extends AppCompatActivity {

    private MainApplication applicationData;

    private ImageView id_pic;

    private LoadingDialog dialog;

    LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmCarPictureActivity.this)
            .setMessage("上传中...")
            .setCancelable(false)
            .setCancelOutside(false);

    private static class MessageHandler extends Handler {
        private WeakReference<ConfirmCarPictureActivity> target;

        MessageHandler(ConfirmCarPictureActivity activity) {
            this.target = new WeakReference<>(activity);
        }

        @Override
        public void handleMessage(Message msg){
            super.handleMessage(msg);
            ConfirmCarPictureActivity activity = this.target.get();
            if (activity != null) {
                activity.update(msg);
            }
        }
    }

    public void update(Message msg) {
        if (msg.what == 1) {
            dialog.cancel();
            CommonUtil.showToastShort(ConfirmCarPictureActivity.this, (String)msg.obj);
            Intent intent = new Intent(ConfirmCarPictureActivity.this, OcrVehicleMainActivity.class)
                    .setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("firstInitNumber", 3);
            startActivity(intent);
        } else {
            dialog.cancel();
            CommonUtil.showToast(ConfirmCarPictureActivity.this, (String)msg.obj);
        }
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_car_picture);
        applicationData = (MainApplication)getApplicationContext();
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            CommonUtil.setActionBar(actionBar, this, "确认信息");
        }

        TextView vehicle_plant = findViewById(R.id.vehicle_plant);
        id_pic = findViewById(R.id.id_pic);

        vehicle_plant.setText(applicationData.getMonitorName());

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));

        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmCarPictureActivity.this, id_pic,applicationData);
            }
        });

        final MessageHandler handler = new MessageHandler(this);
        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
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
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmCarPictureActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);
                            Map<String, String> parm = CommonUtil.getHttpParm(applicationData);
                            parm.put("monitorId", applicationData.getMonitorId());
                            parm.put("vehiclePhoto", picJsonObject.getJSONObject("obj").getString("imageFilename"));
                            parm.put("oldVehiclePhoto", applicationData.getOldPhotoPath());
                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadVehiclePhoto, parm,ConfirmCarPictureActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(re);
                            if (jsonObject.getBoolean("success")) {
                                Message.obtain(handler, 1, "上传成功").sendToTarget();
                            } else {
                                Message.obtain(handler, 2, "车辆照片上传失败").sendToTarget();
                            }
                        } catch (Exception e) {
                            Message.obtain(handler, 2, "车辆照片上传异常").sendToTarget();
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
