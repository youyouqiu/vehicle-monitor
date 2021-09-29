package com.zwf3lbs.ocr.util;


import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Map;


public class HttpUtil {

    private static final String DEF_CHARSET = "UTF-8";
    private static String userAgent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.66 Safari/537.36";
    private static int DEF_CONN_TIMEOUT = 30000;


    /**
     * 通过URL从服务器上下载下来，保存为字符串，以便待会进行JSON解析
     */
    public static String doGET(String strUrl, Map<String, String> params, Context context) throws Exception {
        HttpURLConnection conn = null;
        BufferedReader reader = null;
        String rs = null;
        try {
            StringBuilder sb = new StringBuilder();
            strUrl = strUrl + "?" + urlEncode(params);
            URL url = new URL(strUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-agent", userAgent);
            conn.setUseCaches(false);
            conn.setConnectTimeout(DEF_CONN_TIMEOUT);
            conn.setReadTimeout(DEF_CONN_TIMEOUT);
            conn.setInstanceFollowRedirects(false);
            conn.connect();
            if (conn.getResponseCode() == 401) {
                CommonUtil.showToast(context,"登录失效，请重新登录");
            }
            InputStream is = conn.getInputStream();
            reader = new BufferedReader(new InputStreamReader(is, DEF_CHARSET));
            String strRead;
            while ((strRead = reader.readLine()) != null) {
                sb.append(strRead);
            }
            rs = sb.toString();
        } catch (Exception e) {
            // TODO: handle exception
            e.printStackTrace();
        } finally {
            if (reader != null) {
                reader.close();
            }
            if (conn != null) {
                conn.disconnect();
            }
        }
        return rs;
    }


    // 将map型转为请求参数型
    private static String urlEncode(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry i : params.entrySet()) {
            try {
                if(i.getValue() == null) {
                    continue;
                }
                sb.append(i.getKey()).append("=")
                        .append(URLEncoder.encode(i.getValue().toString(), "utf-8"))
                        .append("&");
            } catch (Exception e) {
                Log.e("HttpUtil", e.getMessage());
            }
        }
        return sb.toString();
    }

    public static String doPOST(String strUrl, Map<String, String> params, Context context) throws Exception {
        HttpURLConnection conn = null;
        BufferedReader reader = null;
        String rs = null;
        try {
            StringBuilder sb = new StringBuilder();
            URL url = new URL(strUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoInput(true);
            conn.setDoOutput(true);
            conn.setRequestProperty("User-agent", userAgent);
            conn.setUseCaches(false);
            conn.setConnectTimeout(DEF_CONN_TIMEOUT);
            conn.setReadTimeout(DEF_CONN_TIMEOUT);
            conn.setInstanceFollowRedirects(false);
            conn.connect();
            DataOutputStream out = new DataOutputStream(conn.getOutputStream());
            out.writeBytes(urlEncode(params));
            if (conn.getResponseCode() == 401) {
                CommonUtil.showToastShort(context,"登录失效，请重新登录");
            }
            InputStream is = conn.getInputStream();
            reader = new BufferedReader(new InputStreamReader(is, DEF_CHARSET));
            String strRead;
            while ((strRead = reader.readLine()) != null) {
                sb.append(strRead);
            }
            rs = sb.toString();
        } catch (Exception e) {
            Log.e("HttpUtil", e.getMessage());
        } finally {
            if (reader != null) {
                reader.close();
            }
            if (conn != null) {
                conn.disconnect();
            }
        }
        return rs;
    }

    //把bitmap转换成String
    public static String bitmapToString(String filePath) {
        try {
            Bitmap bit = BitmapFactory.decodeFile(filePath);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bit.compress(Bitmap.CompressFormat.JPEG, 100, baos);
            byte [] b = baos.toByteArray();
            baos.close();
            return  Base64.encodeToString(b, Base64.NO_WRAP);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
