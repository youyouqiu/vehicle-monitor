/* eslint-disable import/no-cycle */
/**
 * url: 请求URL
 * type：请求方式
 * data：请求传递参数
 * timeout: 超时请求时长
 */


import { Platform } from 'react-native';
import { requestConfig } from './env';
import { getLoginState } from '../server/getStorageData';
import storage from './storage';
import {
  isConnected,
  showModal,
} from './network';


const httpBaseConfig = requestConfig();

// const getLoginState = async () => {
//   let state = null;
//   try {
//     state = await storage.load({
//       key: 'loginState',
//     });
//     return state;
//   } catch (error) {
//     return null;
//   }
// };

const setLoginState = async (data) => {
  await storage.save({
    key: 'loginState',
    data,
  });
};

// 获取缓存ip
// const getStorageIp = async () => {
//   let ret = null;
//   try {
//     ret = await storage.load({
//       key: 'loginAccont',
//     });
//
//     if (ret.length <= 0) {
//       return null;
//     }
//
//     const { ip } = ret[0];
//     return ip;
//   } catch (error) {
//     return null;
//   }
// };

const typeDict = { GET: 'GET', POST: 'POST', 'POST-FORM': 'POST' };

async function doFetch (
  url = '',
  type = 'POST',
  dataParam = {},
  timeout = 0,
  needToken = true,
) {
  // 判断网络是否异常
  if (!isConnected()) {
    showModal();
    return { error: 'network_lose_connected' };
  }

  const data = Object.assign(dataParam, {
    platform: Platform.OS,
    version: httpBaseConfig.version,
  });
  const requestConfigObject = {
    cache: 'no-cache',
    credentials: 'omit',
    method: typeDict[type],
    mode: 'cors',
  };
  let requsetUrl = url;
  if (needToken) {
    let token = await getLoginState();
    if (token !== null) {
      const now = new Date();
      now.setMinutes(now.getMinutes - 10);
      const tokenExpiration = new Date(token.expiration);
      if (now > tokenExpiration) {
        if (now > new Date(token.refreshToken.expiration)) {
          return { error: 'unauthorized' };
        }
        token = await doFetch(
          `/clbs/oauth/token?client_id=mobile_1&client_secret=secret_1&grant_type=refresh_token&refresh_token=${token.refreshToken.value}&platform=${Platform.OS}&version=${httpBaseConfig.version}`,
          'POST',
          {},
          8000,
          false,
        );
        if (!token.value || token.value.length === 0) {
          return { error: 'unauthorized' };
        }
        await setLoginState(token);
      }
      if (requsetUrl.indexOf('?') > -1) {
        requsetUrl = `${url}&access_token=${token.token}`;
      } else {
        requsetUrl = `${url}?access_token=${token.token}`;
      }
    } else {
      return { error: 'unauthorized' };
    }
  }


  // ip 设置
  let newUrl = `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}${requsetUrl}`;
  if ('ip' in dataParam) {
    if (dataParam.ip !== '') {
      const ipArr = dataParam.ip.split(':');
      const port = ipArr[1] ? '' : ':8080';
      newUrl = `http://${dataParam.ip}${port}${requsetUrl}`;
    }
  }


  if (type === 'GET') {
    if (data) {
      const dataKeys = Object.keys(data);
      const queryStr = dataKeys.map(key => `${key}=${data[key]}`).join('&');
      if (queryStr && queryStr.length > 0) {
        if (newUrl.indexOf('?') > -1) {
          newUrl = `${newUrl}&${queryStr}`;
        } else {
          newUrl = `${newUrl}?${queryStr}`;
        }
      }
    }
  } else if (type === 'POST-FORM') {
    const formData = new FormData();
    const dataKeys = Object.keys(data);
    for (let i = 0; i < dataKeys.length; i += 1) {
      const key = dataKeys[i];
      const value = `${data[key]}`;
      formData.append(key, value);
    }
    requestConfigObject.body = formData;
    requestConfigObject.headers = {
      'content-type': 'multipart/form-data',
    };
  } else if (type === 'POST') {
    requestConfigObject.body = data ? JSON.stringify(data) : data;
    requestConfigObject.headers = {
      'content-type': 'application/json',
    };
  }
  const result = Promise.race([
    fetch(newUrl, requestConfigObject),
    // 如果想要通过浏览器调试,需要注释下面这个timeout函数
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const err = new Error('request_timeout');
        err.error = 'request_timeout';
        err.name = 'request_timeout';
        reject(err);
      }, timeout === 0 ? 8000 : timeout);
    }),
  ]).then(response => response.json()).then(info => info).catch((err) => {
    if (err.error === 'request_timeout' || err.error === 'invalid_token') {
      return err;
    }
    const error = new Error('network_lose_connected');
    error.error = 'network_lose_connected';
    error.name = 'network_lose_connected';
    return error;
  });

  return result;
}

export default doFetch;