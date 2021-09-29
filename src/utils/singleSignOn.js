/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
import NetInfo from '@react-native-community/netinfo';
import { toastShow } from './toastUtils';
import { getLocale } from './locales';
import { getRouteKey, reset, setMonitor } from './routeCondition';
import storage from './storage';

let requestFailedState = true;

/**
 * 服务异常
 */
export function serviceError(netWorkStatus) {
  if (!requestFailedState) {
    requestFailedState = true;
    if (netWorkStatus) {
      toastShow(getLocale('noNetwork'), { duration: 2000 });
    } else {
      toastShow(getLocale('requestFailed'), { duration: 2000 });
    }
    if (getRouteKey() !== 'login') {
      setTimeout(() => {
        storage.remove({
          key: 'loginState',
        }).then(() => {
          setMonitor(null);
          reset('login');
        });
      }, 2000);
    }
  }
}

/**
 * 服务器异常导致的服务异常情况
 */
export function serviceConnectError() {
  NetInfo.fetch().then((connectionInfo) => {
    requestFailedState = false;
    if (connectionInfo.type === 'wifi' || connectionInfo.type === 'cellular') {
      serviceError();
    } else {
      serviceError(true);
    }
  });
}

/**
 * token过期处理
 */
export async function tokenOverdue() {
  toastShow(getLocale('longTimeNoOperation'), { duration: 2000 });
  setTimeout(() => {
    storage.remove({
      key: 'loginState',
    }).then(() => {
      setMonitor(null);
      reset('login');
    });
  }, 2000);
}
