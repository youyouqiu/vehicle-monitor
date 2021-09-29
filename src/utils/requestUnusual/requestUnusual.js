// import { NetInfo } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

let isNetworkConnected = null;

const connectionChangeEvent = (connectionInfo) => {
  const { type } = connectionInfo;
  if (type === 'none' || type === 'unknown') {
    // 网络异常弹窗提示
    isNetworkConnected = false;
  } else {
    // 执行刚才中断的action
    if (isNetworkConnected === false) {
      isNetworkConnected = true;
    }
  }
};

/**
 * 监听网络变化情况
 */
NetInfo.addEventListener(
  (connectionInfo) => {
    connectionChangeEvent(connectionInfo);
  },
);

/**
 * 获取当前网络状况
 */
export const getConnectionInfo = () => new Promise((resolve) => {
  NetInfo.fetch().then((connectionInfo) => {
    const { type } = connectionInfo;
    if (type === 'none' || type === 'unknown') {
      resolve(true);
    } else {
      resolve(true);
    }
  });
});

/**
 *  判断当前设备是否联网
 */
export const isConnected = () => NetInfo.isConnected.fetch();