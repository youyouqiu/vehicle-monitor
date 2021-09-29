# 客户独立打包流程
## 图片资源替换
1. 替换android/app/src/main/res下的mipmap-*文件夹下的ic_launcher.png文件
2. 替换android/app/src/main/res/drawable的screen*.png文件
3. 替换src/static/image的homePersonal.png（用户组织头像）和logo.png（登录logo）文件
## APP名称替换
修改android/app/src/main/res/strings.xml文件中的app_name
## 包名替换
1. 替换android/app/src/main/java下的包名
2. 替换android/app/build.gradle文件里的applicationId
3. 替换android/app/src/main/cpp/ZWStreamJni.cpp文件里的classPath
## 提示语替换
修改src/utils/locales/zhCn.js文件

| 属性               | 对应内容               |
| ------------------ | ---------------------- |
| loginTitle         | 第一次安装登录平台名称 |
| loginForgetPwAlert | 忘记密码提示语         |
| loginAboutAlert    | 关于登录提示语         |
## 默认IP替换
修改src/utils/env.js文件

| 属性                          | 对应内容                 |
| ----------------------------- | ------------------------ |
| defaultConfig.baseUrl         | 默认IP                   |
| defaultConfig.port            | 默认端口                 |
| defaultConfig.realTimeVideoIp | 视频服务器ip             |
| defaultConfig.imageWebUrl     | 多媒体静态资源服务器地址 |
## 隐藏网络设置功能
修改src/views/login/login.js文件，注释掉render()函数中的底部bottom部分
## 隐藏分享功能
修改src/views/personalCenter/index.js文件
1. 注释掉navigationOptions中的TouchableHighlight组件
2. 注释掉render()函数中的分享部分
## APK签名
1. 进入android/keystores文件夹，执行命令（替换alias为客户名称的拼音首字母; 替换dname为客户名称全拼）:
```
keytool -genkeypair -v -keystore keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -keypass zwlbs2018 -storetype jks -storepass android -alias hrm -dname "o=HAI RUN MING"
```
2. 修改android/gradle.properties文件中的MYAPP_RELEASE_KEY_ALIAS属性，指向新的alias
3. 客户签名列表：

| 客户名称 | APP类型 | alias | SHA-1(安卓)/安全码(iOS)                                     | 百度地图key                      | 高德地图key                      |
| -------- | ------- | ----- | ----------------------------------------------------------- | -------------------------------- | -------------------------------- |
| 安行天下 | 安卓    | axtx  | 5B:2A:DA:2F:70:DA:DF:B4:91:F4:21:1F:ED:06:17:12:9E:5D:D7:C9 | K74EAdF1WHMmGGvdLXG1Il5MWsLGi0Bq | adea4295eeedd135cb213244079b3d00 |
| 北斗星云 | 安卓    | bdxy  | 99:DC:85:5F:B2:1C:32:84:34:AE:52:60:BE:AD:E7:D0:A3:12:88:11 | NfTSYHElnyymqrE3T0qsDFi9b5G4M6NQ | b975edd7a7e9ba7fc1b59e918b69f404 |
| 辰川科技 | 安卓    | cckj  | 66:CB:37:EA:09:8A:0D:E2:9E:23:69:08:99:17:89:FD:12:8D:70:C8 | EiM9DLOvirB1BSmNhK3zPvjkLfosW928 | 6d05b8c4b3023e1e0435855045a7fc5f |
| 大庆炯浩 | 安卓    | dqjh  | 8A:15:2E:F9:08:54:C7:4E:CC:14:34:09:56:2E:75:43:39:17:92:8A | EtMNZUYed5p7AzFxoyafoxXelHPFsrUU | 2914504665b0b9d3ddb3d23b10c984c9 |
| 海润铭   | 安卓    | hrm   | 2A:DC:0C:8C:1F:69:C8:D2:57:D4:96:58:55:3B:42:CB:BF:8D:89:27 | h6lSg9sF2Ix28tEEzfy1PGsEwY5tqunP | bf837e9ba40d26327bcdc62eccecf0f2 |
| 护车星   | 安卓    | hcx   | 48:AF:6A:34:B7:7B:98:D7:3E:12:04:AC:F5:9A:FF:9E:4A:9A:42:0C | 无                               | 无                               |
| 辉虎科技 | 安卓    | hhkj  | 55:35:FF:B9:07:43:DB:17:D1:58:97:2F:02:63:A0:D5:F8:F1:32:1F | mUFq72nk13p8PWSasXV2RuYfESbVRGZf | 98e9c9fa52acfa41c763cd0e0619c3cc |
| 辉虎科技 | iOS     | hhkj  | com.hhlbs.hhlbsapp                                          | Wko4IZgOk3VsPKG3Qa2mTEjdOSfhvyGx | 434d3e663c98cb6b7c6a2324315edbef |
| 慧通科技 | 安卓    | htkj  | 90:5B:2B:49:A1:C9:83:EC:C9:E4:D7:46:1D:E1:EF:52:2F:67:CB:3D | 77LPRWb9buWlEfVPP5kMdhSqNiPYZw7q | ab8badbaf2dae2c48fe6f2bf2f2a50d1 |
| 江苏云驰 | 安卓    | jsyc  | D9:D2:36:40:8A:12:F8:6D:83:58:2F:29:B2:F3:D9:EE:6C:19:37:93 | euRUyycCqKfVeh60GLCWdexCKa1DMr30 | 0811d3dc4681fea2e67fdee85541fc51 |
| 晶太科技 | 安卓    | jtkj  | C0:97:33:44:E0:33:EA:87:F7:F8:C0:18:C7:4A:1A:90:74:5A:EF:D5 | FBZD6z3dal6yy6uaNU7XREBxHqxCOl8X | 6c197080e35e4444acb1aee94ab72b9e |
| 捷通数码 | 安卓    | jtsm  | 72:1F:A6:4C:9C:77:1A:AC:04:87:6D:D4:7A:FF:31:6B:EC:67:EB:8C | QKewW1AXDvv79TZiZ6WHINi18CIaS91H | e30f269f7aed015c3a73acb7a600ff42 |
| 辽宁易流 | 安卓    | lnyl  | 44:D1:AF:BF:C1:67:C0:29:CB:CD:D3:95:7F:43:48:DA:B7:59:91:2C | r5GeEWiwDjusERLprfSGzT5vrFM7ETGm | 663f4c01e57f4edba11318e0054686af |
| 泰恒元   | 安卓    | thy   | 无                                                          | 无                               | 无                               |
| 星辰北斗 | 安卓    | scxcl | 0C:DD:6C:13:97:CD:53:50:4A:38:D3:6D:89:26:B8:B8:7E:62:DF:06 | V0FwC8x1ERSC3YO3dMEZZ7HZKyrW63w1 | 816111d74dbf84b57d02e7d97839e5f2 |
| 溏盾科技 | 安卓    | tdkj  | 57:A3:EA:55:28:B8:D7:54:0A:7D:44:22:1B:36:FE:87:2C:B9:CD:08 | zxQPXUYKSitFsWAlfKmjQEiHsYRDY621 | 02d5d23bb618a814aefd19cad4eaa7c4 |
| 泰州瀚海 | 安卓    | tzhh  | 19:ED:20:58:7A:3B:38:2C:E4:EF:B7:BF:1C:9B:9D:81:FE:65:9F:78 | WibnwTnXRZBnqY3CtYtfhcTovvcbqGGo | 1c5fca476feaacc3df4fa42cdc1407b9 |
| 亿程信息 | 安卓    | ycxx  | 31:F7:F9:FA:FD:EB:C5:62:D1:3F:03:EC:6C:3D:9C:A1:66:9E:07:60 | y4W4iU4GzK2SqMHu72eLbP5CTn5Trkiz | 7375a7a585f65df884e1c5f8570306eb |
| 中卫北斗 | 安卓    | zwbd  | 50:FE:0B:4E:15:66:58:14:CB:21:A1:3D:FD:84:D5:CD:23:7A:B9:CC | 0mDTS5OiLCCW80AOe1xaAvdFpkgXuh3e | 36651da4d617ccd0354bad6e24e521b6 |
| 柳州恒盛 | 安卓    | lzhs  | FF:AE:A7:90:96:1D:B0:2B:B0:8C:34:C0:40:6E:46:A7:EF:58:5A:13 | PocqNECucAC8lGVn6twN7MRescT0U8Et | 8fec33a933904b2947a59cc84f2f052c |
## 百度API和高德API
1. 登录https://lbs.baidu.com/ 新建应用，申请百度地图API_KEY，将申请到的key替换AndroidManifest.xml文件中的com.baidu.lbsapi.API_KEY
2. 登录https://ai.baidu.com/ 申请并下载百度OCR的aip_license文件
3. 登录https://lbs.amap.com/ 新建应用，申请高德地图API_KEY，将申请到的key替换AndroidManifest.xml文件中的com.amap.api.v2.apikey
