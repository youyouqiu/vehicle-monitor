import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import { getExpireRemindInfos, getExpireRemindInfoDetails } from '../server/getData';
import { getCurAccont } from '../server/getStorageData';

// 获取到期提醒对象信息action
const INIT_START_ACTION = { type: 'expireRemind/INIT_START_ACTION' };
const GETDATA_ACTION = { type: 'expireRemind/SAGA/GETDATA_ACTION' };
const GETDATA_SUCCESS = { type: 'expireRemind/GETDATA_SUCCESS' };
const GETDATA_FAILED = { type: 'epireRemind/GETDATA_FAILED' };

// 获取到期提醒信息详情action
const GETDETAIL_ACTION = { type: 'expireRemind/SAGA/GETDETAIL_ACTION' };
const GETDETAIL_SUCCESS = { type: 'expireRemind/GETDETAIL_SUCCESS' };
const GETDETAIL_FAILED = { type: 'expireRemind/GETDETAIL_FAILED' };

// reducer
const defaultState = Map({
  initStatus: 'start',
  alarmInfoData: {},
  alarmContent: null,
  key_: null,
});

const expireRemindReducers = (state = defaultState, action) => {
  let newState = null;
  switch (action.type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'start',
        alarmInfoData: {},
        alarmContent: null,
      });
      return newState;
    case GETDATA_SUCCESS.type:
      newState = state.merge({
        alarmContent: null,
        initStatus: 'end',
        alarmInfoData: action.payload,
        key_: Math.random(),
      });
      return newState;
    case GETDATA_FAILED.type:
      newState = state.merge({
        alarmContent: null,
        initStatus: 'end',
        alarmInfoData: {},
        key_: Math.random(),
      });
      return newState;
    case GETDETAIL_SUCCESS.type:
      newState = state.merge({
        alarmContent: action.payload,
        key_: Math.random(),
      });
      return newState;
    case GETDETAIL_FAILED.type:
      newState = state.merge({
        alarmContent: {},
        key_: Math.random(),
      });
      return newState;
    default:
      return state;
  }
};

// saga
function* getDataRequest() {
  // 获取当前用户名
  const userName = yield call(getCurAccont) || '';
  yield put({ type: INIT_START_ACTION.type });
  const getDataResult = yield call(getExpireRemindInfos, { userName });
  if (getDataResult.statusCode === 200) {
    const newObj = getDataResult.obj.alreadyLifecycleExpireNumber;
    if (newObj !== 0) {
      const param = {
        userName,
        page: 1,
        type: 1,
        limit: 10,
      };
      const getDataDeatil = yield call(getExpireRemindInfoDetails, param);
      if (getDataDeatil.statusCode === 200) {
        getDataResult.obj.data = getDataDeatil.obj;
      }
    }
    yield put({ type: GETDATA_SUCCESS.type, payload: getDataResult.obj });
  } else {
    yield put({ type: GETDATA_FAILED.type });
  }
}

// 获取当前点击到期提醒详情
function* getCurContent({ payload }) {
  const getDataDeatil = yield call(getExpireRemindInfoDetails, payload);
  if (getDataDeatil.statusCode === 200) {
    yield put({ type: GETDETAIL_SUCCESS.type, payload: getDataDeatil.obj });
  } else {
    yield put({ type: GETDETAIL_FAILED.type });
  }
}

function* expireRemindSaga() {
  // 获取到期提醒信息
  yield takeEvery(GETDATA_ACTION.type, getDataRequest);
  // 获取到期提醒信息详情
  yield takeEvery(GETDETAIL_ACTION.type, getCurContent);
}

// 导出
export default {
  expireRemindReducers,
  expireRemindSaga,
};
