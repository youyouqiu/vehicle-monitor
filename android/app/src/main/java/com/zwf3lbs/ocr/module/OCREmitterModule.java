package com.zwf3lbs.ocr.module;

import com.facebook.react.bridge.ReactApplicationContext;
import com.zwf3lbs.BaseModule;

public class OCREmitterModule extends BaseModule {
    private static final String REACT_CLASS = "OCREmitterModule";
    private static OCREmitterModule instance;
    private static ReactApplicationContext reacContext;

    public OCREmitterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        OCREmitterModule.reacContext = reactContext;
        context = reactContext;
    }

    public static OCREmitterModule getInstance() {
        if (instance == null) {
            instance = new OCREmitterModule(reacContext);
        }
        return instance;
    }

    public String getName() {
        return REACT_CLASS;
    }

}
