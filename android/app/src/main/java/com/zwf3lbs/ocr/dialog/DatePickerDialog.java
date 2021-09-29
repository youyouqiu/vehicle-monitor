package com.zwf3lbs.ocr.dialog;

import android.app.Dialog;
import android.content.Context;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;


import com.zwf3lbs.ocr.loop.LoopListener;
import com.zwf3lbs.ocr.loop.LoopView;
import com.zwf3lbs.zwf3lbsapp.R;

import java.util.Arrays;
import java.util.Calendar;
import java.util.List;

public class DatePickerDialog extends Dialog {

    public   int MIN_YEAR = 1900;
    public   int MAX_YEAR = 2100;
    private Params params;

    public DatePickerDialog(Context context, int themeResId) {
        super(context, themeResId);
    }

    private void setParams(Params params) {
        this.params = params;
    }

    public interface OnDateSelectedListener {
         void onDateSelected(int[] dates);
         void onCancel();
    }

    private static final class Params {
        private boolean shadow = true;
        private boolean canCancel = true;
        private LoopView loopYear, loopMonth, loopDay;
        private OnDateSelectedListener callback;
    }

    public static class Builder {
        private final Context context;
        private final Params params;
        private Integer minYear = 1900;
        private Integer maxYear = 2100;
        private Integer selectYear;
        private Integer selectMonth;
        private Integer selectDay;
        private Integer minMonth;
        private Integer maxMonth;
        private Integer minDay;
        private Integer maxDay;
        private Integer type = 0;//0代表年月日的选择 1代表年月
        public static Integer DAY = 0;
        public static Integer MONTH = 1;

        public Integer getType() {
            return type;
        }

        public void setType(Integer type) {
            this.type = type;
        }

        public Builder(Context context) {
            this.context = context;
            params = new Params();
        }

        public Builder setMinYear(int year){
            minYear=year;
            return this;
        }

        public Builder setMaxYear(int year){
            maxYear=year;
            return this;
        }

        public Builder setMinMonth(int month){
            minMonth=month;
            return this;
        }

        public Builder setMaxMonth(int month){
            maxMonth=month;
            return this;
        }

        public Builder setMinDay(int day){
            minDay=day;
            return this;
        }

        public Builder setMaxDay(int day){
            maxDay=day;
            return this;
        }

        public Builder setSelectYear(int year){
            this.selectYear=year;
            return this;
        }

        public Builder setSelectMonth(int month){
            this.selectMonth=month;
            return this;
        }

        public Builder setSelectDay(int day){
            this.selectDay=day;
            return this;
        }

        /**
         * 获取当前选择的日期
         *
         * @return int[]数组形式返回。例[1990,6,15]
         */
        private int[] getCurrDateValues() {
            int currYear = Integer.parseInt(params.loopYear.getCurrentItemValue());
            int currMonth = Integer.parseInt(params.loopMonth.getCurrentItemValue());
            int currDay = Integer.parseInt(params.loopDay.getCurrentItemValue());
            return new int[]{currYear, currMonth, currDay};
        }

        public Builder setOnDateSelectedListener(OnDateSelectedListener onDateSelectedListener) {
            params.callback = onDateSelectedListener;
            return this;
        }



        public DatePickerDialog create() {
            final DatePickerDialog dialog = new DatePickerDialog(context, params.shadow ? R.style.Theme_Light_NoTitle_Dialog : R.style.Theme_Light_NoTitle_NoShadow_Dialog);
            dialog.MIN_YEAR = minYear;
            dialog.MAX_YEAR = maxYear;
            View view = LayoutInflater.from(context).inflate(R.layout.layout_picker_date, null);

            view.findViewById(R.id.tv_cancel).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    dialog.dismiss();
                    params.callback.onCancel();
                }
            });



            Calendar c = Calendar.getInstance();

            final LoopView loopDay = view.findViewById(R.id.loop_day);
            loopDay.setArrayList(d(1, 30, "日"));
            if(selectDay!=null){
                loopDay.setCurrentItem(selectDay);
            }else{
                loopDay.setCurrentItem(c.get(Calendar.DATE));
            }
            //loopDay.setNotLoop();

            final LoopView loopYear = view.findViewById(R.id.loop_year);
            loopYear.setArrayList(d(dialog.MIN_YEAR, dialog.MAX_YEAR - dialog.MIN_YEAR + 1,  "年"));
            if(selectYear!=null){
                loopYear.setCurrentItem(selectYear-dialog.MIN_YEAR+1);
            }else{
                loopYear.setCurrentItem(dialog.MAX_YEAR);
            }
            loopYear.setNotLoop();

            final LoopView loopMonth = view.findViewById(R.id.loop_month);
            loopMonth.setArrayList(d(1, 12, "月"));
            if(selectMonth!=null){
                loopMonth.setCurrentItem(selectMonth);
            }else{
                loopMonth.setCurrentItem(c.get(Calendar.MONTH));
            }
            loopMonth.setNotLoop();



            final LoopListener maxDaySyncListener = new LoopListener() {
                @Override
                public void onItemSelect(int item) {
                    Calendar c = Calendar.getInstance();
                    boolean needFixed=true;
                    if(minYear!=null){
                        if(Integer.parseInt(loopYear.getCurrentItemValue())==minYear ){
                            if(minMonth!=null){
                                if(Integer.parseInt(loopMonth.getCurrentItemValue())<minMonth){
                                    loopMonth.setCurrentItem(minMonth - 1);
                                }
                            }
                        }else if(Integer.parseInt(loopYear.getCurrentItemValue())<minYear){
                            loopYear.setCurrentItem(minYear-dialog.MIN_YEAR);
                        }
                    }

                    if(maxYear!=null){
                        if(Integer.parseInt(loopYear.getCurrentItemValue())==maxYear ){
                            if(maxMonth!=null){
                                if(Integer.parseInt(loopMonth.getCurrentItemValue())>maxMonth){
                                    loopMonth.setCurrentItem(maxMonth - 1);
                                }
                            }
                        }else if(Integer.parseInt(loopYear.getCurrentItemValue())>maxYear){
                            loopYear.setCurrentItem(maxYear-dialog.MIN_YEAR);
                        }
                    }

                    c.set(Integer.parseInt(loopYear.getCurrentItemValue()), Integer.parseInt(loopMonth.getCurrentItemValue()) - 1, 1);
                    c.roll(Calendar.DATE, false);

                    if(needFixed){
                        int maxDayOfMonth = c.get(Calendar.DATE);
                        int fixedCurr = loopDay.getCurrentItem();
                        loopDay.setArrayList(d(1, maxDayOfMonth, "日"));
                        // 修正被选中的日期最大值
                        if (fixedCurr > maxDayOfMonth) fixedCurr = maxDayOfMonth - 1;
                        loopDay.setCurrentItem(fixedCurr);
                    }
                }
            };

            final LoopListener dayLoopListener=new LoopListener() {
                @Override
                public void onItemSelect(int item) {
                    if(minYear!=null && minMonth!=null && minDay!=null
                            && Integer.parseInt(loopYear.getCurrentItemValue())==minYear
                            && Integer.parseInt(loopMonth.getCurrentItemValue())==minMonth
                            && Integer.parseInt(loopDay.getCurrentItemValue())<minDay
                            ){
                        loopDay.setCurrentItem(minDay-1);
                    }

                    if(maxYear!=null && maxMonth!=null && maxDay!=null
                            && Integer.parseInt(loopYear.getCurrentItemValue())==maxYear
                            && Integer.parseInt(loopMonth.getCurrentItemValue())==maxMonth
                            && Integer.parseInt(loopDay.getCurrentItemValue())>maxDay
                            ){
                        loopDay.setCurrentItem(maxDay-1);
                    }
                }
            };
            loopYear.setListener(maxDaySyncListener);
            loopMonth.setListener(maxDaySyncListener);
            loopDay.setListener(dayLoopListener);

            view.findViewById(R.id.tx_finish).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    dialog.dismiss();
                    params.callback.onDateSelected(getCurrDateValues());
                }
            });

            Window win = dialog.getWindow();
            win.getDecorView().setPadding(0, 0, 0, 0);
            WindowManager.LayoutParams lp = win.getAttributes();
            lp.width = WindowManager.LayoutParams.MATCH_PARENT;
            lp.height = WindowManager.LayoutParams.WRAP_CONTENT;
            win.setAttributes(lp);
            win.setGravity(Gravity.BOTTOM);
            win.setWindowAnimations(R.style.Animation_Bottom_Rising);

            dialog.setContentView(view);
            dialog.setCanceledOnTouchOutside(params.canCancel);
            dialog.setCancelable(params.canCancel);

            params.loopYear = loopYear;
            params.loopMonth = loopMonth;
            params.loopDay = loopDay;
            dialog.setParams(params);
            if(type == 1) {
                view.findViewById(R.id.frame_day).setVisibility(View.GONE);
            }

            return dialog;
        }

        /**
         * 将数字传化为集合，并且补充0
         *
         * @param startNum 数字起点
         * @param count    数字个数
         * @return
         */
        private static List<String> d(int startNum, int count, String type) {
            String[] values = new String[count];
            for (int i = startNum; i < startNum + count; i++) {
                String tempValue = (i < 10 ? "0" : "") + i;
                values[i - startNum] = tempValue + type;
            }
            return Arrays.asList(values);
        }

    }

}
