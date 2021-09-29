package com.zwf3lbs.ocr.activity.person;

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
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.zwf3lbs.ocr.dialog.DatePickerDialog;
import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.ocr.util.CommonUtil;
import com.zwf3lbs.ocr.util.HttpUri;
import com.zwf3lbs.ocr.util.HttpUtil;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.HashMap;
import java.util.Map;

import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;

public class ConfirmPersonActivity  extends AppCompatActivity {

    private TextView title_name;

    private ImageView id_pic;

    private EditText id_name;

    private TextView id_sex;

    private EditText id_number;

    private MainApplication applicationData;

    private ActionBar actionBar;

    private TextView gender_man;

    private TextView gender_women;

    private Button gender_comfirm;

    private BottomSheetDialog bottomSheetDialog;

    private LoadingDialog dialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ocr_comfirm_person);
        title_name = findViewById(R.id.title_name);
        id_pic = findViewById(R.id.id_pic);
        id_name = findViewById(R.id.id_name);
        id_sex = findViewById(R.id.id_sex);
        id_number = findViewById(R.id.id_number);

        actionBar = getSupportActionBar();
        CommonUtil.setActionBar(actionBar,this, "确认信息");


        applicationData = (MainApplication)getApplicationContext();

        title_name.setText(getIntent().getStringExtra("name"));
        id_name.setText(getIntent().getStringExtra("name"));
        id_sex.setText(getIntent().getStringExtra("gender"));
        id_number.setText(getIntent().getStringExtra("identity"));

        String picPath = getIntent().getStringExtra("filePath");

        //图片展示
        id_pic.setScaleType(ImageView.ScaleType.FIT_XY);
        id_pic.setImageBitmap(BitmapFactory.decodeFile(picPath));


        id_sex.setOnClickListener(new View.OnClickListener() {
            //性别默认值
            String choose = getIntent().getStringExtra("gender");

            @Override
            public void onClick(View view) {
                bottomSheetDialog = new BottomSheetDialog(ConfirmPersonActivity.this);
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


        id_pic.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CommonUtil.showBigPic(ConfirmPersonActivity.this, id_pic, applicationData);
            }
        });


        id_number.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                DatePickerDialog.Builder builder = new DatePickerDialog.Builder(ConfirmPersonActivity.this);

            }
        });


        Button submit = findViewById(R.id.submit_id);
        submit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                LoadingDialog.Builder loadBuilder = new LoadingDialog.Builder(ConfirmPersonActivity.this)
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
                            Map<String, String> parmPic = new HashMap<>();
                            parmPic.put("monitorId", applicationData.getMonitorId());
                            parmPic.put("access_token" ,applicationData.getAccess_token());
                            parmPic.put("version", applicationData.getVersion());
                            parmPic.put("platform",applicationData.getPlatform());
                            parmPic.put("decodeImage", fileString);
                            String picRe = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadImg, parmPic,ConfirmPersonActivity.this);
                            JSONObject picJsonObject = JSONObject.parseObject(picRe);

                            Map<String, String> parm = new HashMap<>();
                            parm.put("monitorId", applicationData.getMonitorId());
                            parm.put("access_token" ,applicationData.getAccess_token());
                            parm.put("version",  applicationData.getVersion());
                            parm.put("platform",applicationData.getPlatform());
                            parm.put("name",id_name.getText().toString());
                            parm.put("gender", id_sex.getText().toString().equals("男") ? "1" : "2");
                            parm.put("identity", id_number.getText().toString());
                            parm.put("identityCardPhoto", picJsonObject.getJSONObject("obj").getString("imageFilename"));
                            parm.put("oldIdentityCardPhoto", applicationData.getOldPhotoPath());
                            parm.put("nation", getIntent().getStringExtra("nation"));
                            parm.put("birthday", getIntent().getStringExtra("birthday"));
                            parm.put("address", getIntent().getStringExtra("address"));
                            String re = HttpUtil.doPOST(applicationData.getServiceAddress() + HttpUri.uploadIdentityCardInfo, parm,ConfirmPersonActivity.this);
                            JSONObject jsonObject = JSONObject.parseObject(re);
                            if (jsonObject.getBoolean("success")) {
                                dialog.cancel();
                                CommonUtil.showToastShort(ConfirmPersonActivity.this, "上传成功");
                                Intent intent = new Intent(ConfirmPersonActivity.this, OcrPersonMainActivity.class).setFlags(FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
                                startActivity(intent);
                            } else {
                                dialog.cancel();
                                CommonUtil.showToast(ConfirmPersonActivity.this, "身份证信息上传失败");
                            }
                        } catch (Exception e) {
                            dialog.cancel();
                            Log.e("身份证信息上传异常", e.toString() );
                            CommonUtil.showToast(ConfirmPersonActivity.this, "身份证信息上传异常");
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
        switch (item.getItemId()) {
            case android.R.id.home:
                finish();
                break;

            default:
                break;
        }
        return super.onOptionsItemSelected(item);
    }

}
