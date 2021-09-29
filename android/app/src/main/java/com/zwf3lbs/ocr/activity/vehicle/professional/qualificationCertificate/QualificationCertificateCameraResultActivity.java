package com.zwf3lbs.ocr.activity.vehicle.professional.qualificationCertificate;


import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Looper;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baidu.ocr.sdk.OCR;
import com.baidu.ocr.sdk.OnResultListener;
import com.baidu.ocr.sdk.exception.OCRError;
import com.baidu.ocr.sdk.model.AccessToken;
import com.baidu.ocr.sdk.model.GeneralBasicParams;
import com.baidu.ocr.sdk.model.GeneralResult;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.R;


import java.io.File;

public class QualificationCertificateCameraResultActivity extends Activity {

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

        dialog = new LoadingDialog.Builder(QualificationCertificateCameraResultActivity.this)
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
                    QualificationCertificateCameraResultActivity.this.finish();
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
                                    CommonUtil.showToast(QualificationCertificateCameraResultActivity.this, "网络连接失败！");
                                    return;
                                }
                                // 通用文字识别参数设置
                                GeneralBasicParams param = new GeneralBasicParams();
                                param.setDetectDirection(true);
                                param.setImageFile(new File(picPath));


                                OCR.getInstance(QualificationCertificateCameraResultActivity.this).initAccessToken(new OnResultListener<AccessToken>() {
                                    @Override
                                    public void onResult(AccessToken result) {
                                        String token = result.getAccessToken();
                                    }

                                    @Override
                                    public void onError(OCRError error) {

//                            dialog.cancel();
//                            CommonUtil.showToast(QualificationCertificateCameraResultActivity.this,"百度OCR秘钥验证失败！");
//                            error.printStackTrace();
                                    }
                                }, getApplicationContext());

                                // 调用通用文字识别服务
                                OCR.getInstance(QualificationCertificateCameraResultActivity.this).recognizeGeneralBasic(param, new OnResultListener<GeneralResult>() {
                                    @Override
                                    public void onResult(GeneralResult result) {
                                        try {
                                            JSONObject jsonObject = JSONObject.parseObject(result.getJsonRes());
                                            String card_number = null;
                                            Intent intent = new Intent(QualificationCertificateCameraResultActivity.this, ConfirmQualificationCertificateActivity.class);
                                            JSONArray jsonArray = jsonObject.getJSONArray("words_result");
                                            if (JSONObject.parseObject(jsonArray.get(1).toString()).getString("words").contains("从业资格")
                                                    && JSONObject.parseObject(jsonArray.get(2).toString()).getString("words").contains("证件")) {
                                                card_number = JSONObject.parseObject(jsonArray.get(3).toString()).getString("words");
                                            } else if (JSONObject.parseObject(jsonArray.get(2).toString()).getString("words").contains("从业资格")
                                                    && JSONObject.parseObject(jsonArray.get(3).toString()).getString("words").contains("证件")) {
                                                card_number = JSONObject.parseObject(jsonArray.get(1).toString()).getString("words");
                                            }

                                            if (card_number == null) {
                                                throw new NullPointerException();
                                            }
                                            intent.putExtra("card_number", card_number);
                                            intent.putExtra("filePath", picPath);
                                            dialog.cancel();
                                            startActivity(intent);
                                        } catch (Exception e) {
                                            dialog.cancel();
                                            CommonUtil.showToast(QualificationCertificateCameraResultActivity.this, "请上传正确的图片！");
                                        }
                                    }

                                    @Override
                                    public void onError(OCRError error) {
                                        dialog.cancel();
                                        CommonUtil.showToast(QualificationCertificateCameraResultActivity.this, "识别失败！");
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
        catch (Exception e){}
    }




}
