import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import {
  postLogin, saveLog, getAbout, getCaptchaAuth, postLoginZhonghuan, ifMustUpdate, getHighest,
} from '../server/getData';
import storage from '../utils/storage';
import { assemblyUrl, assemblyVideoPort } from '../utils/env';
import { serviceConnectError } from '../utils/singleSignOn';


const updateLoginState = async (result) => {
  await storage.save({
    key: 'loginState',
    data: {
      expireAt: new Date(result.expiration.replace(/-/g, '/')),
      token: result.value,
      refreshToken: result.refreshToken,
    },
  });
};

// const updateAppSetting = async (obj) => {
//   const appSetting = {
//     queryAlarmPeriod: obj.app.queryAlarmPeriod,
//     aggrNum: obj.app.aggrNum,
//     queryHistoryPeriod: obj.app.queryHistoryPeriod,
//     maxStatObjNum: obj.app.maxStatObjNum,
//     aboutUs: obj.personal.aboutUs,
//     groupAvatar: obj.personal.groupAvatar,
//     forgetPwd: obj.login.forgetPwd,
//     aboutPW: obj.login.about,
//     logo: obj.login.logo,
//     title: obj.login.title,
//     url: obj.login.url,
//   };
//   await storage.save({
//     key: 'appSetting',
//     data: appSetting,
//   });
//   return appSetting;
// };

// action
const LOGIN_ACTION = { type: 'login/SAGA/LOGIN_ACTION' };

// 中寰登录 加验证码字段
const LOGINZHONGHUAN_ACTION = { type: 'login/SAGA/LOGINZHONGHUAN_ACTION' };

// login/LOGINZHONGHUAN_ACTION

const LOGIN_SUCCESS = { type: 'login/LOGIN_SUCCESS' };
const LOGIN_FAILED = { type: 'login/LOGIN_FAILED' };
const SETTING_START_ACTION = { type: 'login/SETTING_START_ACTION' };
const SETTING_ACTION = { type: 'login/SAGA/SETTING_ACTION' };

const GET_CAPTCHA = { type: 'login/SAGA/GET_CAPTCHA' };
const CAPTCHARES = { type: 'login/CAPTCHARES' };
const RESET_YZM = { type: 'login/RESET_YZM' };
// const SETTING_SUCCESS_ACTION = { type: 'login/SETTING_SUCCESS_ACTION' };

// const GET_SETTING_ACTION = { type: 'login/GET_SETTING_ACTION' };
const GET_SUCCESS_ACTION = { type: 'login/GET_SUCCESS_ACTION' };
const GET_FAILED_ACTION = { type: 'login/GET_FAILED_ACTION' };

const UPDATEAPP = { type: 'login/UPDATEAPP' };
const CLBSLOW = { type: 'login/CLBSLOW' };

// reducer
const defaultState = Map({
  aboutUs: null,
  groupAvatar: null,
  forgetPwd: null,
  aboutPW: null,
  logo: null,
  title: null,
  url: null,
  logined: false,
  loginStatus: null,
  loginFailReason: null,
  key_: null,

  personalData: [],
  errReason: '',
  captchaResult: {},
  randomNum: 0,
  updateAppNum: 0,
  ifNeedUpdate: false,
  clbsLowNum: 0,
  ifClbsVerLow: false,
});

const loginReducers = (state = defaultState, action) => {
  let newState = null;
  const randomNum = Math.round(Math.random() * 100);
  const updateAppNum = Math.round(Math.random() * 100);

  switch (action.type) {
    case SETTING_START_ACTION.type:
      newState = state.merge({
        loginStatus: null,
      });
      return newState;
    // case SETTING_SUCCESS_ACTION.type:
    //   newState = state.merge({
    //     aboutUs: action.payload.aboutUs,
    //     groupAvatar: action.payload.groupAvatar,
    //     forgetPwd: action.payload.forgetPwd,
    //     aboutPW: action.payload.about,
    //     logo: action.payload.logo,
    //     title: action.payload.title,
    //     url: action.payload.url,
    //   });
    //   return newState;
    case LOGIN_SUCCESS.type:
      newState = state.merge({
        logined: true,
        loginStatus: 'success',
        key_: Math.random(),
      });
      return newState;
    case LOGIN_FAILED.type:
      newState = state.merge({
        logined: false,
        loginStatus: 'failed',
        loginFailReason: action.payload ? action.payload.errReason : '',
        key_: Math.random(),
      });

      return newState;
    case GET_SUCCESS_ACTION.type:
      newState = state.merge({
        personalData: action.datas,
        errReason: '',
      });
      return newState;

    case GET_FAILED_ACTION.type:
      newState = state.merge({
        errReason: action.datas,
      });
      return newState;
    case CAPTCHARES.type:
      newState = state.merge({
        captchaResult: action.payload,
        randomNum,
      });
      return newState;
    case RESET_YZM.type:
      return state.set('captchaResult', {});
    case UPDATEAPP.type:
      newState = state.merge({
        ifNeedUpdate: action.payload,
        updateAppNum,
      });
      return newState;
    case CLBSLOW.type:
      newState = state.merge({
        ifClbsVerLow: action.payload,
        clbsLowNum: updateAppNum,
      });
      return newState;
    default:
      return state;
  }
};


// saga
function* loginRequest({ payload }) {
  const httpConfig = {
    baseUrl: undefined,
    port: undefined,
    realTimeVideoIp: undefined,
    videoRequestPort: undefined,
    imageWebUrl: undefined,
  };
  if (payload.ip === '') {
    assemblyUrl(
      undefined,
      undefined,
    );
  } else {
    const ip = payload.ip.split(':');

    assemblyUrl(
      ip[0],
      ip[1] && ip[1].length > 0 ? ip[1] : '8080',
    );
    ([httpConfig.baseUrl] = ip);
    httpConfig.port = ip[1] && ip[1].length > 0 ? ip[1] : '8080';
  }


  // 这一段加上登录强制更新的判断
  const ifUpdateRes = yield call(ifMustUpdate, payload);
  if (ifUpdateRes.error === 'network_lose_connected') {
    yield put({ type: LOGIN_FAILED.type });
    return;
  }

  if (ifUpdateRes === false) {
    yield put({ type: LOGIN_FAILED.type });
    return;
  }

  if (ifUpdateRes.success) {
    const { obj, obj: { flag: forceFlag } } = ifUpdateRes;
    if (forceFlag === false) {
      yield put({ type: UPDATEAPP.type, payload: obj });
      return;
    }
  }


  // getHighest
  // 这一段加上平台版本判断
  // 这一段加上登录强制更新的判断
  const getHighestRes = yield call(getHighest);
  // const { success: ifClbsVerLow } = getHighestRes;
  if (!getHighestRes.success) {
    yield put({ type: CLBSLOW.type, payload: true });
    return;
  }

  const result = yield call(postLogin, payload);
  if (result === false) {
    serviceConnectError();
    yield put({ type: LOGIN_FAILED.type });
    return;
  }
  if (result.refreshToken && result.value) {
    // 登录成功，拿到了token
    yield call(updateLoginState, result);
    // 开始保存日志
    // yield call(saveLog, { registerType: 1 });
    // 获取app配置
    yield call(saveLog, { registerType: 1 });
    const personalResult = yield call(getAbout, {});
    if (personalResult === false) {
      yield put({ type: LOGIN_FAILED.type });
      return;
    }
    if (personalResult) {
      if (personalResult.success) {
        storage.save({
          key: 'appSettings',
          data: personalResult.obj,
        });
        yield put({ type: GET_SUCCESS_ACTION.type, datas: personalResult.obj });

        assemblyVideoPort(
          personalResult.obj.realTimeVideoIp,
          personalResult.obj.videoTcpPort,
          personalResult.obj.resourceTcpPort,
          personalResult.obj.imageWebUrl,
        );
        httpConfig.realTimeVideoIp = personalResult.obj.realTimeVideoIp;
        httpConfig.videoRequestPort = personalResult.obj.videoTcpPort;
        httpConfig.videoPlaybackPort = personalResult.obj.resourceTcpPort;
        httpConfig.imageWebUrl = personalResult.obj.imageWebUrl;
        // }
        storage.save({
          key: 'httpConfig',
          data: httpConfig,
        });
      } else {
        let errReason = 'REQUEST_ERR';
        if (personalResult.name === 'request_timeout') { // 加载超时
          errReason = 'REQUEST_TIMEOUT';
        }
        yield put({ type: GET_FAILED_ACTION.type, datas: errReason });
      }
    }

    yield put({ type: LOGIN_SUCCESS.type, payload: result });
  } else {
    let errReason = 'ERR_ACCOUNT_PWD';
    switch (result.message) {
      case 'PASSWORD':
        errReason = 'ERR_ACCOUNT_PWD';
        break;
      case 'EXPIRED':
        errReason = 'ERR_EXPIRED';
        break;
      case 'INVOKED':
        errReason = 'ERR_INVOKED';
        break;
      case 'UNAUTHORIZED':
        errReason = 'ERR_UNAUTHORIZED';
        break;
      default:
        break;
    }

    yield put({ type: LOGIN_FAILED.type, payload: { errReason } });
  }
}

// 中寰登录
function* loginZhonghuanRequest({ payload }) {
  // if (payload.ip === '') {
  assemblyUrl(
    undefined,
    undefined,
  );

  const result = yield call(postLoginZhonghuan, payload);
  if (result === false) {
    yield put({ type: LOGIN_FAILED.type });
    return;
  }
  if (result.refreshToken && result.value) {
    // 登录成功，拿到了token
    yield call(updateLoginState, result);
    // 开始保存日志
    // yield call(saveLog, { registerType: 1 });
    // 获取app配置
    yield call(saveLog, { registerType: 1 });
    const personalResult = yield call(getAbout, {});
    if (personalResult) {
      if (personalResult.success) {
        storage.save({
          key: 'appSettings',
          data: personalResult.obj,
        });
        yield put({ type: GET_SUCCESS_ACTION.type, datas: personalResult.obj });
      } else {
        let errReason = 'REQUEST_ERR';
        if (personalResult.name === 'request_timeout') { // 加载超时
          errReason = 'REQUEST_TIMEOUT';
        }
        yield put({ type: GET_FAILED_ACTION.type, datas: errReason });
      }
    }
    if (personalResult.toString() === '') {
      assemblyVideoPort(
        personalResult ? personalResult.obj.realTimeVideoIp : undefined,
        personalResult ? personalResult.obj.realTimeVideoPort : undefined,
      );
    }

    yield put({ type: LOGIN_SUCCESS.type, payload: result });
  } else {
    let errReason = 'ERR_ACCOUNT_PWD';
    if (result.message) {
      switch (result.message) {
        case 'PASSWORD':
          errReason = 'ERR_ACCOUNT_PWD';
          break;
        case 'EXPIRED':
          errReason = 'ERR_EXPIRED';
          break;
        case 'INVOKED':
          errReason = 'ERR_INVOKED';
          break;
        case 'UNAUTHORIZED':
          errReason = 'ERR_UNAUTHORIZED';
          break;
        default:
          break;
      }
    } else
    if (result.exceptionDetailMsg) {
      errReason = 'ERR_VERIFICATIONCODE';
    }
    yield put({ type: LOGIN_FAILED.type, payload: { errReason } });
  }
}

function* settingRequest() {
  yield put({ type: 'HOME/CLEAR_EXTRA_MARKERS' });
  yield put({ type: SETTING_START_ACTION.type });
}

function* getCaptcha({ payload }) {
  const result = yield call(getCaptchaAuth, payload.data);

  yield put({ type: CAPTCHARES.type, payload: result });
}

function* loginSaga() {
  // 开始登录
  yield takeEvery(LOGIN_ACTION.type, loginRequest);
  yield takeEvery(LOGINZHONGHUAN_ACTION.type, loginZhonghuanRequest);
  yield takeEvery(SETTING_ACTION.type, settingRequest);
  yield takeEvery(GET_CAPTCHA.type, getCaptcha);
}

// 导出
export default {
  loginReducers,
  loginSaga,
};
