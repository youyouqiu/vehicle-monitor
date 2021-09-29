package com.zwf3lbs.panorama;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.baidu.lbsapi.BMapManager;
import com.baidu.lbsapi.panoramaview.PanoramaView;
import com.baidu.lbsapi.panoramaview.PanoramaViewListener;
import com.facebook.react.bridge.ReactContext;
import com.zwf3lbs.map.util.EventInitMethod;
import com.zwf3lbs.zwf3lbsapp.MainApplication;
import com.zwf3lbs.zwf3lbsapp.R;


public class PanoramaActivity extends AppCompatActivity {
    private PanoramaView mPanoView;
    private ReactContext reactContext;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initBMapManager();
        setContentView(R.layout.panodemo_main);
        reactContext = ((MainApplication)getApplicationContext()).getReactNativeHost().getReactInstanceManager()
                .getCurrentReactContext();

        mPanoView = findViewById(R.id.panorama);
        TextView textView = findViewById(R.id.tx1);
        Button btn = findViewById(R.id.bt1);

        Intent intent = getIntent();
        if (intent != null) {
            textView.setText(intent.getStringExtra("brand"));
            initPano(intent);
        }

        btn.setOnClickListener(v -> {
            Log.i("customPanoView点击事件V:", "");
            finish();
        });
    }

    private void initBMapManager() {
        MainApplication app = (MainApplication) this.getApplication();
        if (app.mBMapManager == null) {
            app.mBMapManager = new BMapManager(app);
            app.mBMapManager.init(new MainApplication.MyGeneralListener());
        }
    }

    private void initPano(Intent intent) {
        double lat = intent.getDoubleExtra("lat", 0d);
        double lon = intent.getDoubleExtra("lon", 0d);
        mPanoView.setPanoramaViewListener(new PanoramaViewListener() {
            @Override
            public void onDescriptionLoadEnd(String s) {
            }

            @Override
            public void onLoadPanoramaBegin() {
            }

            @Override
            public void onLoadPanoramaEnd(String s) {
                EventInitMethod.onPanoramaSuccess(reactContext);
            }

            @Override
            public void onLoadPanoramaError(String s) {
                EventInitMethod.onPanoramaFailed(reactContext);
            }

            @Override
            public void onMessage(String s, int i) {
            }

            @Override
            public void onCustomMarkerClick(String s) {
            }

            @Override
            public void onMoveStart() {
            }

            @Override
            public void onMoveEnd() {
            }
        });
        mPanoView.setPanoramaImageLevel(PanoramaView.ImageDefinition.ImageDefinitionHigh);
        mPanoView.setPanorama(lon, lat, PanoramaView.COORDTYPE_BD09LL);
    }

    @Override
    protected void onPause() {
        super.onPause();
        mPanoView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        mPanoView.onResume();
    }

    @Override
    protected void onDestroy() {
        mPanoView.destroy();
        super.onDestroy();
        EventInitMethod.onPanoramaClose(reactContext);
    }
}
