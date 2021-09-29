package com.zwf3lbs.ocr.activity;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;

public class LookPicActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.big_pic);
        MainApplication application = (MainApplication) getApplication();
        ImageView imageView = findViewById(R.id.imageview);
        Bitmap bitmap  = application.getBigPic();
        imageView.setImageBitmap(bitmap);
        application.setBigPic(null);
        imageView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }
}
