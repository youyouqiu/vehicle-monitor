package com.zwf3lbs.marqueeLabel;

import android.graphics.Color;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class RCTMarqueeLabelManager extends SimpleViewManager<RCTMarqueeLabel> {
    @Override
    public @NonNull String getName() {
        return "RCTMarqueeLabel";
    }

    @Override
    public @NonNull RCTMarqueeLabel createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new RCTMarqueeLabel(reactContext);
    }

    @ReactProp(name = "text")
    public void setText(RCTMarqueeLabel view, String text) {
        view.setText(text);
    }

    @ReactProp(name = "fontSize")
    public void setFontSize(RCTMarqueeLabel view, float fontSize) {
        view.setTextSize(fontSize);
    }

    @ReactProp(name = "color")
    public void setColor(RCTMarqueeLabel view, String color) {
        int colorInt = Color.parseColor(color);
        view.setTextColor(colorInt);
    }

    @ReactProp(name = "backgroundColor")
    public void setBackgroundColor(RCTMarqueeLabel view, int color) {
        view.setPaintBackgroundColor(color);
    }

    @ReactProp(name = "isRepeat")
    public void setIsRepeat(RCTMarqueeLabel view, boolean flag) {
        view.setIsRepeat(flag);
    }

    @ReactProp(name = "startPoint")
    public void setStartPoint(RCTMarqueeLabel view, int point) {
        view.setStartPoint(point);
    }

    @ReactProp(name = "direction")
    public void setDirection(RCTMarqueeLabel view, int direction) {
        view.setDirection(direction);
    }

    @ReactProp(name = "scrollDuration")
    public void setScrollDuration(RCTMarqueeLabel view, int scrollDuration) {
        view.setScrollDuration(scrollDuration);
    }


}
