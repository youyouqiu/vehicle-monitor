package com.zwf3lbs.ocr.activity.person;


import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;

import com.baidu.ocr.sdk.OCR;
import com.baidu.ocr.sdk.OnResultListener;
import com.baidu.ocr.sdk.exception.OCRError;
import com.baidu.ocr.sdk.model.AccessToken;
import com.baidu.ocr.sdk.model.IDCardParams;
import com.baidu.ocr.sdk.model.IDCardResult;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.R;


import java.io.File;

public class PersonResultChooseActivity extends Activity {

    private ImageButton cancelButton;
    private ImageButton confirmButton;
    private String picPath;
    private  Bitmap bitmap;
    private LoadingDialog dialog;

    @Override
    protected void onCreate( Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.e("test2222", "" );
        setContentView(R.layout.orc_result_person);
         picPath=getIntent().getStringExtra("picpath");//通过值"picpath"得到照片路径
        ImageView imageview=findViewById(R.id.pic);

        dialog = new LoadingDialog.Builder(PersonResultChooseActivity.this)
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
                    PersonResultChooseActivity.this.finish();
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
                                    CommonUtil.showToast(PersonResultChooseActivity.this, "网络连接失败！");
                                    return;
                                }
                                //通用文字识别参数设置
                                IDCardParams param = new IDCardParams();
                                // 设置身份证正反面
                                param.setIdCardSide(IDCardParams.ID_CARD_SIDE_FRONT);
                                // 设置方向检测
                                param.setDetectDirection(true);
                                param.setImageFile(new File(picPath));

                                OCR.getInstance(PersonResultChooseActivity.this).initAccessToken(new OnResultListener<AccessToken>() {
                                    @Override
                                    public void onResult(AccessToken result) {
                                        String token = result.getAccessToken();
                                    }

                                    @Override
                                    public void onError(OCRError error) {

                                    }
                                }, getApplicationContext());

                                // 调用通用文字识别服务
                                OCR.getInstance(PersonResultChooseActivity.this).recognizeIDCard(param, new OnResultListener<IDCardResult>() {
                                    @Override
                                    public void onResult(IDCardResult result) {
                                        try {
                                            Intent intent = new Intent(PersonResultChooseActivity.this, ConfirmPersonActivity.class);
                                            intent.putExtra("filePath", picPath);
                                            intent.putExtra("name", result.getName().toString());
                                            intent.putExtra("gender", result.getGender().toString());
                                            intent.putExtra("identity", result.getIdNumber().toString());
                                            intent.putExtra("nation", result.getEthnic().toString());
                                            intent.putExtra("birthday", result.getBirthday().toString());
                                            intent.putExtra("address", result.getAddress().toString());
                                            dialog.cancel();
                                            startActivity(intent);
                                        } catch (Exception e) {
                                            dialog.cancel();
                                            CommonUtil.showToast(PersonResultChooseActivity.this, "请上传正确的图片！");
                                        }
                                    }

                                    @Override
                                    public void onError(OCRError error) {
                                        dialog.cancel();
                                        CommonUtil.showToast(PersonResultChooseActivity.this, "识别失败！");
                                    }
                                });
                            } finally {
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
