/* eslint no-undef:off */
import Storage from 'react-native-storage';
// import { AsyncStorage } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

const storage = new Storage({
  // 最大容量，默认值1000条数据循环存储
  size: 1000,

  // 存储引擎：对于RN使用AsyncStorage，对于web使用window.localStorage
  // 如果不指定则数据只会保存在内存中，重启后即丢失
  storageBackend: AsyncStorage,

  // 数据过期时间，默认一整天（1000 * 3600 * 24 毫秒），设为null则永不过期
  defaultExpires: null,

  // 读写时在内存中缓存数据。默认启用。
  enableCache: true,

  sync: {
    userSetting(params) {
      const { syncParams: { user } } = params;
      const ret = {};
      ret[user] = {
        voice: true, // 声音
        shake: true, // 震动
        time: true, // 免打扰
        timeStart: '20:00', // 免打扰开始时间
        timeEnd: '08:00', // 免打扰结束时间
        videoSwitch: false, // 视频画质
        speedSlider: [30, 90], // 速度设置
        trajectoryType: true, // 轨迹线
        trajectoryValue: 2, // 轨迹值
        dotType: true, // 压点
        dotValue: 31, // 压点值
      };
      return ret;
    },
  },
});

export default storage;
