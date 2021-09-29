package com.zwf3lbs.ocr.activity.vehicle.carPicture;


import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;


import com.zwf3lbs.ocr.dialog.LoadingDialog;
import com.zwf3lbs.zwf3lbsapp.R;

public class CarPictureCameraResultActivity extends Activity {

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
        try{
            imageview.setScaleType(ImageView.ScaleType.FIT_XY);
            imageview.setImageBitmap(BitmapFactory.decodeFile(picPath));

            cancelButton = findViewById(R.id.cancel_picture);

            confirmButton = findViewById(R.id.confirm_picture);

            cancelButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    CarPictureCameraResultActivity.this.finish();
                }
            });

            confirmButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    Intent intent = new Intent(CarPictureCameraResultActivity.this, ConfirmCarPictureActivity.class);
                    intent.putExtra("filePath", picPath);
                    startActivity(intent);
                }
            });
        }
        catch (Exception e){
        }
    }




}
