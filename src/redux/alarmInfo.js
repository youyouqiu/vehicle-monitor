import { Map } from 'immutable';
import * as timeFormat from 'd3-time-format';// 时间格式转换
import { put, call, takeEvery } from './common';
import { getAlarmInfoSummary, getAlarmInfoDetail } from '../server/getData';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d');
// 获取报警对象信息action
const INIT_START_ACTION = { type: 'alarmInfo/INIT_START_ACTION' };
const GETDATA_ACTION = { type: 'alarmInfo/SAGA/GETDATA_ACTION' };
const GETDATA_SUCCESS = { type: 'alarmInfo/GETDATA_SUCCESS' };
const GETDATA_FAILED = { type: 'alarmInfo/GETDATA_FAILED' };

// 获取报警信息详情action
const GETDETAIL_ACTION = { type: 'alarmInfo/SAGA/GETDETAIL_ACTION' };
const GETDETAIL_SUCCESS = { type: 'alarmInfo/GETDETAIL_SUCCESS' };
const GETDETAIL_FAILED = { type: 'alarmInfo/GETDETAIL_FAILED' };

// reducer
const defaultState = Map({
  initStatus: 'start',
  alarmInfoData: [],
  alarmContent: null,
  key_: null,
});

const alarmInfoReducers = (state = defaultState, action) => {
  let newState = null;
  switch (action.type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'start',
        alarmInfoData: [],
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
        alarmInfoData: [],
        key_: Math.random(),
      });
      return newState;
    case GETDETAIL_SUCCESS.type:
      newState = state.merge({
        alarmInfoData: [],
        alarmContent: action.payload,
        key_: Math.random(),
      });
      return newState;
    case GETDETAIL_FAILED.type:
      newState = state.merge({
        alarmInfoData: [],
        alarmContent: [],
        key_: Math.random(),
      });
      return newState;
    default:
      return state;
  }
};

// saga
function* getDataRequest({ payload }) {
  yield put({ type: INIT_START_ACTION.type });
  const getDataResult = yield call(getAlarmInfoSummary, payload);
  if (getDataResult.statusCode === 200) {
    const newObj = getDataResult.obj.alarmSummary;
    // newObj[0].data = [{}];
    const len = newObj.length;
    if (len > 0) { // 第一次查询报警概要信息时默认查询第一条报警详情
      if (payload.page === 1) {
        const param = {
          id: payload.id,
          page: payload.page,
          pageSize: payload.innerPageSize,
          alarmType: payload.alarmType,
          time: timeFormator(getDataResult.obj.alarmSummary[0].date),
        };
        const getDataDeatil = yield call(getAlarmInfoDetail, param);
        if (getDataDeatil.statusCode === 200) {
          const { alarmDetails } = getDataDeatil.obj;
          newObj[0].data = (alarmDetails.length === 0 ? [] : alarmDetails);
        }
      }
    }
    yield put({ type: GETDATA_SUCCESS.type, payload: newObj });
  } else {
    yield put({ type: GETDATA_FAILED.type });
  }
}

// 获取当前点击日期下的报警详情
function* getCurContent({ payload }) {
  const getDataDeatil = yield call(getAlarmInfoDetail, payload);
  if (getDataDeatil.statusCode === 200) {
    yield put({ type: GETDETAIL_SUCCESS.type, payload: getDataDeatil.obj.alarmDetails });
  } else {
    yield put({ type: GETDETAIL_FAILED.type });
  }
}

function* alarmInfoSaga() {
  // 获取报警对象信息
  yield takeEvery(GETDATA_ACTION.type, getDataRequest);
  // 获取报警信息详情
  yield takeEvery(GETDETAIL_ACTION.type, getCurContent);
}

// 导出
export default {
  alarmInfoReducers,
  alarmInfoSaga,
};
