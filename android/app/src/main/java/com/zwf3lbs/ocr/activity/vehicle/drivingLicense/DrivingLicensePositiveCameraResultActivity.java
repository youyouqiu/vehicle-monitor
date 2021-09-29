package com.zwf3lbs.ocr.activity.vehicle.drivingLicense;


import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Looper;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;

import com.alibaba.fastjson.JSONObject;
import com.baidu.ocr.sdk.OCR;
import com.baidu.ocr.sdk.OnResultListener;
import com.baidu.ocr.sdk.exception.OCRError;
import com.baidu.ocr.sdk.model.AccessToken;
import com.baidu.ocr.sdk.model.OcrRequestParams;
import com.baidu.ocr.sdk.model.OcrResponseResult;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.R;


import java.io.File;

public class DrivingLicensePositiveCameraResultActivity extends Activity {

    private ImageButton cancelButton;
    private ImageButton confirmButton;
    private String picPath;
    private  Bitmap bitmap;
    private LoadingDialog dialog;

    @Override
    protected void onCreate( Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.orc_result_person);
         picPath=getIntent().getStringExtra("picpath");//通过值"picpath"得到照片路径
        ImageView imageview=findViewById(R.id.pic);

        dialog = new LoadingDialog.Builder(DrivingLicensePositiveCameraResultActivity.this)
                .setMessage("识别中...")
                .setCancelable(false)
                .setCancelOutside(false).create();

        try{
            imageview.setScaleType(ImageView.ScaleType.FIT_XY);
            imageview.setImageBitmap(BitmapFactory.decodeFile(picPath));

            cancelButton = findViewById(R.id.cancel_picture);

            confirmButton = findViewById(R.id.confirm_picture);

            cancelButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    DrivingLicensePositiveCameraResultActivity.this.finish();
                }
            });

            confirmButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    if (dialog == null || dialog.isShowing()) {
                        return;
                    } else {
                        dialog.show();
                    }

                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                Looper.prepare();
                                if (!CommonUtil.isNetworkOnline()) {
                                    dialog.cancel();
                                    CommonUtil.showToast(DrivingLicensePositiveCameraResultActivity.this, "网络连接失败！");
                                    return;
                                }
                                //通用文字识别参数设置
                                OcrRequestParams param = new OcrRequestParams();
                                param.setImageFile(new File(picPath));
                                // 设置其他参数
                                param.putParam("detect_direction", true);

                                OCR.getInstance(DrivingLicensePositiveCameraResultActivity.this).initAccessToken(new OnResultListener<AccessToken>() {
                                    @Override
                                    public void onResult(AccessToken result) {
                                        String token = result.getAccessToken();
                                    }

                                    @Override
                                    public void onError(OCRError error) {

                                        //dialog.cancel();
                                        //CommonUtil.showToast(DrivingLicensePositiveCameraResultActivity.this,"百度OCR秘钥验证失败！");
                                    }
                                }, getApplicationContext());

                                // 调用通用文字识别服务
                                OCR.getInstance(DrivingLicensePositiveCameraResultActivity.this).recognizeVehicleLicense(param, new OnResultListener<OcrResponseResult>() {
                                    @Override
                                    public void onResult(OcrResponseResult result) {
                                        try {
                                            JSONObject jsonObject = JSONObject.parseObject(result.getJsonRes());
                                            JSONObject re = jsonObject.getJSONObject("words_result");
                                            Intent intent = new Intent(DrivingLicensePositiveCameraResultActivity.this, ConfirmDrivingLicensePositiveActivity.class);
                                            intent.putExtra("chassisNumber", re.getJSONObject("车辆识别代号").getString("words"));
                                            intent.putExtra("engineNumber", re.getJSONObject("发动机号码").getString("words"));
                                            intent.putExtra("usingNature", re.getJSONObject("使用性质").getString("words"));
                                            intent.putExtra("brandModel", re.getJSONObject("品牌型号").getString("words"));
                                            intent.putExtra("registrationDate", re.getJSONObject("注册日期").getString("words"));
                                            intent.putExtra("licenseIssuanceDate", re.getJSONObject("发证日期").getString("words"));
                                            intent.putExtra("filePath", picPath);
                                            dialog.cancel();
                                            startActivity(intent);
                                        } catch (Exception e) {
                                            dialog.cancel();
                                            CommonUtil.showToast(DrivingLicensePositiveCameraResultActivity.this, "请上传正确的图片！");
                                        }
                                    }

                                    @Override
                                    public void onError(OCRError error) {
                                        dialog.cancel();
                                        CommonUtil.showToast(DrivingLicensePositiveCameraResultActivity.this, "识别失败！");
                                    }
                                });
                            }finally {
                                Looper.loop();
                            }
                        }
                    }).start();
                }
            });
        }
        catch (Exception e){
        }
    }




}
