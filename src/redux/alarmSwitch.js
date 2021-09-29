import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import { getAlarmSetting } from '../server/getData';
import { getUserSetting, getCurAccont, getCheckAlarmType } from '../server/getStorageData';
// 获取报警配置信息action
const INIT_START_ACTION = { type: 'alarmSwitch/INIT_START_ACTION' };
const GETDATA_ACTION = { type: 'alarmSwitch/SAGA/GETDATA_ACTION' };
const GETDATA_SUCCESS = { type: 'alarmSwitch/GETDATA_SUCCESS' };
const GETDATA_FAILED = { type: 'alarmSwitch/GETDATA_FAILED' };
const RESET_DATA = { type: 'alarmSwitch/RESET_DATA' };

// reducer
const defaultState = Map({
  initStatus: 'start',
  settingData: [],
  key_: null,
});

const alarmSwitchReducers = (state = defaultState, action) => {
  let newState = null;
  switch (action.type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'start',
        settingData: [],
      });
      return newState;
    case GETDATA_SUCCESS.type:
      newState = state.merge({
        settingData: action.payload,
        initStatus: 'end',
      });
      return newState;
    case GETDATA_FAILED.type:
      newState = state.merge({
        settingData: [],
        initStatus: 'end',
        key_: Math.random(),
      });
      return newState;
    case RESET_DATA.type:
      newState = state.merge({
        initStatus: 'start',
        settingData: [],
      });
      return newState;
    default:
      return state;
  }
};

// saga
function* getDataRequest ({ payload }) {
  yield put({ type: INIT_START_ACTION.type });
  const getDataResult = yield call(getAlarmSetting, payload);
  if (getDataResult.obj.settings.length === 0) {
    const settingResult = yield call(getUserSetting);
    getDataResult.obj.settings = settingResult.alarmTypes;
  }
  // if (getDataResult.statusCode === 200) {
  if (getDataResult.obj.settings.length !== 0) {
    // 读取缓存中保存的勾选的switch配置
    const checkData = yield call(getCheckAlarmType);
    let storageResult = null;
    if (checkData !== null) {
      const userName = yield call(getCurAccont);
      storageResult = checkData[userName] ? checkData[userName].checkArr : null;
    }
    getDataResult.storageData = storageResult;
    yield put({ type: GETDATA_SUCCESS.type, payload: getDataResult });
  } else {
    yield put({ type: GETDATA_FAILED.type });
  }
}

function* alarmSwitchSaga () {
  // 获取用户报警配置置信息
  yield takeEvery(GETDATA_ACTION.type, getDataRequest);
}

// 导出
export default {
  alarmSwitchReducers,
  alarmSwitchSaga,
};
