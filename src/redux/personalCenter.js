import { Map } from 'immutable';
import { version } from 'punycode';
import { put, call, takeEvery } from './common';
import { getAbout, getAppVersion } from '../server/getData';
import storage from '../utils/storage';

// action
const GET_SETTING_ACTION = { type: 'personalCenter/SAGA/GET_SETTING_ACTION' };
const GET_SUCCESS_ACTION = { type: 'personalCenter/GET_SUCCESS_ACTION' };
const GET_FAILED_ACTION = { type: 'personalCenter/GET_FAILED_ACTION' };

const GET_VERSION = { type: 'PERSONAL/SAGA/VERSION' };

const VERSION = { type: 'versiondata' };

// reducer
const defaultState = Map({
  personalData: [],
  errReason: '',
  versionData: {},
  versionRamdomNum: 0,
});

const personalCenterReducers = (state = defaultState, action) => {
  let newState = null;
  const versionRamdomNum = Math.round(Math.random() * 100);

  switch (action.type) {
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
    case VERSION.type:

      newState = state.merge({
        versionData: action.result,
        versionRamdomNum,
      });
      return newState;
    default:
      return state;
  }
};

// saga
function* getSetting() {
  // 获取app配置
  const result = yield call(getAbout, {});
  if (!result) { return; }
  if (result.success) {
    storage.save({
      key: 'appSettings',
      data: result.obj,
    });
    yield put({ type: GET_SUCCESS_ACTION.type, datas: result.obj });
  } else {
    let errReason = 'REQUEST_ERR';
    if (result.name === 'request_timeout') { // 加载超时
      errReason = 'REQUEST_TIMEOUT';
    }
    yield put({ type: GET_FAILED_ACTION.type, datas: errReason });
  }
}

function* getVersion({ payload }) {
  const result = yield call(getAppVersion, payload.payload);
  yield put({ type: VERSION.type, result });
}

function* personalCenterSaga() {
  yield takeEvery(GET_SETTING_ACTION.type, getSetting);
  yield takeEvery(GET_VERSION.type, getVersion);
}

// 导出
export default {
  personalCenterReducers,
  personalCenterSaga,
};
