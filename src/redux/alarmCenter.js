import { Map } from 'immutable';
import * as timeFormat from 'd3-time-format';
import {
  put, call, takeEvery, all,
} from './common';
import { getAlarmData, getAlarmNum, getAlarmSetting } from '../server/getData';
import {
  getCurAccont, getCheckAlarmType, getClearAlarmTime, getUserSetting,
} from '../server/getStorageData';
import storage from '../utils/storage';

// 获取报警对象信息action
const INIT_START_ACTION = { type: 'alarmCenter/INIT_START_ACTION' };
const GETDATA_ACTION = { type: 'alarmCenter/SAGA/GETDATA_ACTION' };
const GETDATA_SUCCESS = { type: 'alarmCenter/GETDATA_SUCCESS' };
const GETDATA_FAILED = { type: 'alarmCenter/GETDATA_FAILED' };

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
// reducer
const defaultState = Map({
  alarmData: {},
  initStatus: 'start',
  key_: null,
});

const alarmCenterReducers = (state = defaultState, action) => {
  let newState = null;
  switch (action.type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'start',
        alarmData: {},
        queryAlarmType: '',
      });
      return newState;
    case GETDATA_SUCCESS.type:
      newState = state.merge({
        alarmData: action.payload,
        initStatus: 'end',
      });
      return newState;
    case GETDATA_FAILED.type:
      newState = state.merge({
        alarmData: {},
        initStatus: 'end',
        key_: Math.random(),
      });
      return newState;
    default:
      return state;
  }
};

// 获取两个日期差
const getDatePoor = (start, end) => {
  const startVal = start.replace(/-/g, '/');
  const endVal = end.replace(/-/g, '/');
  const start1 = (new Date(startVal)).getTime();
  const end1 = (new Date(endVal)).getTime();
  let time = 0;
  if (start1 > end1) {
    time = start1 - end1;
  } else {
    time = end1 - start1;
  }
  return Math.floor(time / 86400000);
};

function* getAppSetting() {
  // 获取当前登录用户名
  const userName = yield call(getCurAccont) || '';

  // 请求后台数据接口获取报警类型
  const newAlarmType = [];
  const settingData = yield call(getAlarmSetting);
  if (settingData.obj.settings.length === 0) {
    const settingResult = yield call(getUserSetting);
    settingData.obj.settings = settingResult.alarmTypes;
  }
  if (settingData.statusCode === 200) {
    const typeArr = settingData.obj.settings;
    const typeLen = typeArr.length;
    for (let i = 0; i < typeLen; i += 1) {
      newAlarmType.push(`switch${typeArr[i].type}`);
    }
  }
  // 获取用户勾选的报警数据类型
  let beforeAlarmType = [];// 上一次后台配置的报警数据类型
  let checkSwitch = null;// 用户开启的报警数据类型
  const checkObj = yield call(getCheckAlarmType);
  if (checkObj !== null) {
    checkSwitch = checkObj[userName] ? checkObj[userName].checkArr : null;
    beforeAlarmType = checkObj[userName] ? checkObj[userName].allType : [];
  }
  // 筛选出最新的报警数据类型
  const setAlarmType = [];
  if (checkSwitch !== null) {
    const len = checkSwitch.length;
    for (let i = 0; i < len; i += 1) {
      if (newAlarmType.indexOf(checkSwitch[i]) !== -1) {
        setAlarmType.push(checkSwitch[i]);
      }
    }
  }
  const len = newAlarmType.length;
  for (let i = 0; i < len; i += 1) {
    if (beforeAlarmType.indexOf(newAlarmType[i]) === -1) {
      setAlarmType.push(newAlarmType[i]);
    }
  }

  // 保存新的报警类型到缓存中
  const alarmObj = {};
  alarmObj[userName] = {
    checkArr: setAlarmType,
    allType: newAlarmType,
  };
  storage.save({
    key: 'checkSwitch',
    data: alarmObj,
  });

  let alarmType = '';
  const typeLen = setAlarmType.length;
  if (typeLen > 0) {
    for (let i = 0; i < typeLen; i += 1) {
      alarmType += `${setAlarmType[i].replace('switch', '')},`;
    }
  }

  // 获取用户清除报警数据时间
  let timeData = yield call(getClearAlarmTime);
  if (timeData !== null) {
    timeData = timeData[userName] || null;
  }

  const nowTime = timeFormator(new Date());// 当前时间
  const yesterdayTime = timeFormator((new Date()).getTime() - 24 * 60 * 60 * 1000);// 前一天时间
  let newStartTime = yesterdayTime;// 开始时间
  if (timeData !== null) {
    const poor = getDatePoor(timeData.time, nowTime);
    if (poor <= 1) {
      newStartTime = timeData.time;
    }
  }
  return { timeData, alarmType, newStartTime };
}

// 数据组装
function* setResultData(data) {
  const { result, num, obj } = data;
  const newObj = obj;
  if (result.statusCode === 200) {
    newObj.data = result.obj.objects;
    if (num.statusCode === 200) {
      newObj.count = num.obj.count;
    } else {
      newObj.count = null;
    }
    yield put({ type: GETDATA_SUCCESS.type, payload: newObj });
  } else {
    yield put({ type: GETDATA_FAILED.type });
  }
}

// saga
function* getDataRequest({ payload }) {
  const newPayload = payload;
  let settingData = null;
  let getDataNum = {};
  let getDataResult = {};
  const newObj = {
    data: [],
    count: 0,
    setting: null,
  };
  if (payload.page === 1) {
    yield put({ type: INIT_START_ACTION.type });
    if (payload.fuzzyParam === '') {
      // 获取缓存数据
      settingData = yield call(getAppSetting);
      newPayload.alarmType = settingData.alarmType;
      newPayload.startTime = settingData.newStartTime;

      newObj.setting = settingData;
      newObj.setting.clearAlarmTime = settingData.timeData || null;

      const param = {
        alarmType: settingData.alarmType,
        startTime: payload.startTime,
        // endTime: '2018-10-24 18:30:00',
        endTime: payload.endTime,
        // uniquenessFlag: payload.uniquenessFlag,
      };
      // getDataNum = yield call(getAlarmNum, param);

      ([getDataNum, getDataResult] = yield all([
        call(getAlarmNum, param),
        call(getAlarmData, newPayload),
      ]));
    } else {
      getDataResult = yield call(getAlarmData, newPayload);
    }
  } else {
    getDataResult = yield call(getAlarmData, newPayload);
  }
  yield call(setResultData, { result: getDataResult, num: getDataNum, obj: newObj });
}

function* alarmCenterSaga() {
  // 获取报警对象信息
  yield takeEvery(GETDATA_ACTION.type, getDataRequest);
}

// 导出
export default {
  alarmCenterReducers,
  alarmCenterSaga,
};
