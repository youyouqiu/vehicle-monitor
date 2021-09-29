/* eslint-disable import/no-cycle */
// import { NetInfo } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import NetworkModal from './networkModal';
import { getLocale } from './locales';
import { toastShow } from './toastUtils';
// import { reset } from './routeCondition';
import storage from './storage';
import {
  serviceError, tokenOverdue, serviceConnectError,
} from './singleSignOn';
import { getRouteKey } from './routeCondition';

let connectionType = null;
let listener = null;
let isModalShow = false;
let dispatch = null;
let action = [];
let requestEvent = null;
let requestParams = null;
let rootAction = null;
let requestError = false;


/**
 * 调用dispatch
 */
export function employDispatch () {
  if (typeof dispatch === 'function' && rootAction !== null) {
    dispatch(rootAction);
  }
  if (typeof dispatch === 'function' && action.length > 0) {
    for (let i = 0; i < action.length; i += 1) {
      dispatch(action[i]);
    }
  }

  if (typeof requestEvent === 'function') {
    requestEvent(...requestParams);
  }
}

/**
 * 如果不是在WiFi或者3g，4g或者未知就认为不在线
 * @param {String} type 网络主类型
 * @param {String} detailType 网络详细类型，针对蜂窝网络
 */
function isOnline (type) {
  // return !(type === 'none'
  // || (type === 'cellular' && (detailType !== '3g' && detailType !== '4g')));
  return !(type === 'none' || type === 'unknown');
}
function handleConnectivityChange (connectionInfo) {
  connectionType = connectionInfo.type;
  if (isOnline(connectionInfo.type)) {
    // 隐藏弹窗
    NetworkModal.hide();
    // 重新触发action
    if (isModalShow) {
      setTimeout(() => {
        employDispatch();
      }, 300);
    }
    isModalShow = false;
  } else {
    if (getRouteKey() === 'login') {
      toastShow(getLocale('noNetwork'), { duration: 2000 });
      return;
    }
    NetworkModal.show();
  }
  if (typeof listener === 'function') {
    listener(connectionInfo.type);
  }
  //   NetInfo.removeEventListener(
  //     'connectionChange',
  //     handleConnectivityChange,
  //   );
}

NetInfo.fetch().then((connectionInfo) => {
  handleConnectivityChange(connectionInfo);
});

NetInfo.addEventListener(
  (connectionInfo) => {
    handleConnectivityChange(connectionInfo);
  },
);

/**
 * 判断是否正在移动数据网络状态中
 */
export function isCellular () {
  if (connectionType === 'cellular') {
    return connectionType;
  }
  return false;
}

/**
 * 判断是否连接网络
 */
export function isConnected () {
  return isOnline(connectionType);
}

/**
 * 当网络状态改变时触发
 * @param {Function} 网络状态改变时的回调，接收两个参数，分别是网络类型，和当网络子类型
 */
export function onConnectionChange (callback) {
  listener = callback;
}

/**
 * 置空当网络状态改变时触发的回调函数
 */
export function removeConnectionChange () {
  listener = null;
}

/**
 * 弹出提示框
 */
export function showModal () {
  if (getRouteKey() === 'login') {
    toastShow(getLocale('noNetwork'), { duration: 2000 });
    return;
  }
  setTimeout(() => {
    NetworkModal.show();
    isModalShow = true;
  }, 500);
}

/**
 * 保存dispatch
 */
export function saveDispatch (nextDispatch) {
  dispatch = nextDispatch;
}

/**
 * 保存action
 */
export function saveAction (nextAction) {
  // action.push(nextAction);
  if (nextAction.type === 'root/SAGA/INIT_ACTION') {
    rootAction = nextAction;
  } else {
    for (let i = 0; i < action.length; i += 1) {
      const a = action[i];
      if (a.type === nextAction.type) {
        action.splice(i, 1);
        break;
      }
    }
    action.push(nextAction);
  }
}

/**
 * 清空action
 */
export function clearAction () {
  action = [];
}

/**
 * 保存公共组件内部的数据请求事件
 */
export function saveRequestEvent (event, params) {
  requestEvent = event;
  requestParams = params;
}

/**
 * 请求错误类型处理
 */
export function errHandle (result, event, ...params) {
  switch (result.error) {
    case 'server_error': // 服务器异常，fetch走到catch中
      // toastShow(getLocale('requestFailed'), { duration: 2000 });
      requestError = true;
      setTimeout(() => {
        requestError = false;
      }, 2000);
      NetworkModal.hide();
      serviceError();
      break;
    case 'request_timeout': // 超时
      if (!requestError) {
        saveRequestEvent(event, params);
        // NetworkModal.show({ type: 'timeout' });
      }
      break;
    case 'unauthorized':
    case 'invalid_token':
      storage.remove({
        key: 'loginState',
      }).then(() => {
        if (getRouteKey() !== 'login') {
          // reset('login');
          // closeSingleSocket();

          tokenOverdue();
        }
      });
      break;
    case 'network_lose_connected':
      serviceConnectError();
      break;
    default:
      break;
  }
}
