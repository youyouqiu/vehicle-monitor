package com.zwf3lbs.marqueeLabel;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.SurfaceTexture;
import android.os.Handler;
import android.os.Message;
import android.text.TextPaint;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.TextureView;

import androidx.annotation.NonNull;

import java.lang.ref.WeakReference;


public class RCTMarqueeLabel extends TextureView implements TextureView.SurfaceTextureListener {
    private static final String TAG = "RCTMarqueeLabel";

    public Context mContext;

    private String mText; //内容

    private float mTextSize = 100; //字体大小

    private int mTextColor = Color.RED; //字体的颜色

    private int mBackgroundColor = Color.WHITE;//背景色

    private boolean mIsRepeat;//是否重复滚动

    private int mStartPoint;// 开始滚动的位置  0是从最左面开始    1是从最末尾开始

    private int mDirection;//滚动方向 0 向左滚动   1向右滚动

    private float mScrollDuration;//滚动速度

    private TextPaint mTextPaint;

    private MarqueeViewThread mThread;

    private String marqueeText;

    private int textWidth = 0, textHeight = 0;

    public int currentX = 0;// 当前x的位置

    public int sepX = 5;//每一步滚动的距离

    private final Handler mHandler = new MessageHandler(this);

    public RCTMarqueeLabel(Context context) {
        this(context, null);
    }

    public RCTMarqueeLabel(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public RCTMarqueeLabel(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        this.mContext = context;
        init();
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        startScroll();
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        stopScroll();
    }

    void setText(String text) {
        mText = text;
        if (mText == null) {
            return;
        }
        measurementsText(text);
    }

    void setTextSize(float size) {
        mTextSize = size;
        if (mText == null) {
            return;
        }
        measurementsText(mText);
    }

    void setTextColor(int color) {
        mTextColor = color;
    }

    void setPaintBackgroundColor(int color) {
        mBackgroundColor = color;
    }

    void setIsRepeat(boolean flag) {
        mIsRepeat = flag;
    }

    void setStartPoint(int point) {
        mStartPoint = point;
    }

    void setDirection(int direction) {
        mDirection = direction;
    }

    void setScrollDuration(int scrollDuration) {
        mScrollDuration = scrollDuration;
    }


    private void init() {
        mTextColor = Color.RED;
        mTextSize = 48;
        mBackgroundColor = Color.WHITE;
        mIsRepeat = true;
        mStartPoint = 0;
        mDirection = 0;
        mScrollDuration = 10;

        // holder = this.getHolder();
        // holder.addCallback(this);
        this.setSurfaceTextureListener(this);
        mTextPaint = new TextPaint();
        mTextPaint.setFlags(Paint.ANTI_ALIAS_FLAG);
        mTextPaint.setTextAlign(Paint.Align.LEFT);
        // this.setZOrderOnTop(true);
    }

    protected void measurementsText(String msg) {
        marqueeText = msg;
        mTextPaint.setTextSize(mTextSize);
        mTextPaint.setColor(mTextColor);
        mTextPaint.setStrokeWidth(0.5f);
//        mTextPaint.setFakeBoldText(true);
        // 设定阴影(柔边, X 轴位移, Y 轴位移, 阴影颜色)
        // mTextPaint.setShadowLayer(5, 3, 3, ShadowColor);
        textWidth = (int) mTextPaint.measureText(marqueeText);
        Paint.FontMetrics fontMetrics = mTextPaint.getFontMetrics();
        textHeight = (int) fontMetrics.bottom;
        DisplayMetrics display = this.getResources().getDisplayMetrics();
        int width = display.widthPixels;
        if (mStartPoint == 0) {
            currentX = 0;
        } else {
            currentX = width - getPaddingLeft() - getPaddingRight();
        }
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);
    }

    /**
     * 开始滚动
     */
    public void startScroll() {
        if (mThread != null && mThread.isRun) {
            return;
        }
        if (!TextUtils.isEmpty(mText)) {
            measurementsText(mText);
        }
        mThread = new MarqueeViewThread(this);//创建一个绘图线程
    }

    /**
     * 停止滚动
     */
    public void stopScroll() {
        if (mThread != null) {
            mThread.isRun = false;
            mThread.interrupt();
        }
        mThread = null;
    }

    @Override
    public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
        startScroll();
        if (mThread != null) {
            mThread.isRun = true;
            mThread.start();
        }
    }

    @Override
    public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {

    }

    @Override
    public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
        stopScroll();
        return false;
    }

    @Override
    public void onSurfaceTextureUpdated(SurfaceTexture surface) {

    }

    public void drawFrame() throws InterruptedException {
        if (TextUtils.isEmpty(marqueeText)) {
            Thread.sleep(1000);//睡眠时间为1秒
            return;
        }
        Canvas canvas = lockCanvas(null);
        int paddingLeft = getPaddingLeft();
        int paddingTop = getPaddingTop();
        int paddingRight = getPaddingRight();
        int paddingBottom = getPaddingBottom();

        int contentWidth = getWidth() - paddingLeft - paddingRight;
        int contentHeight = getHeight() - paddingTop - paddingBottom;

        int centerYLine = paddingTop + contentHeight / 2;//中心线

        if (mDirection == 0) {//向左滚动
            if (currentX <= -textWidth) {
                if (!mIsRepeat) {//如果是不重复滚动
                    mHandler.sendEmptyMessage(ROLL_OVER);
                }
                currentX = contentWidth;
            } else {
                currentX -= sepX;
            }
        } else {//  向右滚动
            if (currentX >= contentWidth) {
                if (!mIsRepeat) {//如果是不重复滚动
                    mHandler.sendEmptyMessage(ROLL_OVER);
                }
                currentX = -textWidth;
            } else {
                currentX += sepX;
            }
        }

        canvas.drawColor(mBackgroundColor);
        canvas.drawText(marqueeText, currentX, centerYLine + dpi2px(getContext(), textHeight) / 2.0f, mTextPaint);
        unlockCanvasAndPost(canvas);//结束锁定画图，并提交改变。

        int c = (int) (mScrollDuration * 1000 / (textWidth / sepX));
        Thread.sleep(c);//睡眠时间为移动的频率
    }

    /**
     * 线程
     */
    private static class MarqueeViewThread extends Thread {
        private final WeakReference<RCTMarqueeLabel> viewRef;

        private volatile boolean isRun;//是否在运行

        MarqueeViewThread(RCTMarqueeLabel view) {
            this.viewRef = new WeakReference<>(view);
            isRun = true;
        }

        @Override
        public void run() {
            RCTMarqueeLabel view;
            while (isRun) {
                try {
                    view = viewRef.get();
                    if (view == null) {
                        break;
                    }
                    view.drawFrame();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } catch (Exception e) {
                    Log.e(TAG, e.getMessage(), e);
                }
            }
        }

    }

    public static final int ROLL_OVER = 100;


    private static class MessageHandler extends Handler {
        private final WeakReference<RCTMarqueeLabel> target;

        MessageHandler(RCTMarqueeLabel label) {
            this.target = new WeakReference<>(label);
        }

        @Override
        public void handleMessage(@NonNull Message msg) {
            super.handleMessage(msg);

            RCTMarqueeLabel label = this.target.get();
            if (label != null) {
                label.update(msg.what);
            }
        }
    }

    private void update(int command) {
        if (command == ROLL_OVER) {
            stopScroll();
        }
    }


    /**
     * dip转换为px
     *
     */
    public static int dpi2px(Context context, float dpValue) {
        final float scale = context.getResources().getDisplayMetrics().density;
        return (int) (dpValue * scale + 0.5f);
    }
}