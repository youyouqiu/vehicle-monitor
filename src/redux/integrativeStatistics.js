import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import { getAlarmMonitor, getStatisticalMonitor } from '../server/getData';
// 获取报警配置信息action
const INIT_START_ACTION = { type: 'integrativeStatistics/INIT_START_ACTION' };
const GETDATA_ACTION = { type: 'integrativeStatistics/SAGA/GETDATA_ACTION' };
const GETDATA_SUCCESS = { type: 'integrativeStatistics/GETDATA_SUCCESS' };
const GETDATA_FAILED = { type: 'integrativeStatistics/GETDATA_FAILED' };

// reducer
const defaultState = Map({
  initStatus: 'start',
  isLoadMore: false,
  allMonitors: [],
  key_: null,
});

const integrativeStatisticsReducers = (state = defaultState, action) => {
  let newState = null;
  switch (action.type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'start',
        isLoadMore: false,
      });
      return newState;
    case GETDATA_SUCCESS.type:
      newState = state.merge({
        allMonitors: action.payload.obj.assignmentList,
        isLoadMore: action.payload.obj.anythingElse,
        initStatus: 'end',
        key_: Math.random(),
      });
      return newState;
    case GETDATA_FAILED.type:
      newState = state.merge({
        allMonitors: [],
        isLoadMore: false,
        initStatus: 'end',
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
  let getDataResult = [];
  if (payload.type !== undefined) { // 上线统计，超速统计
    getDataResult = yield call(getStatisticalMonitor, payload);
  } else { // 报警排名，报警处置
    getDataResult = yield call(getAlarmMonitor, payload);
  }
  if (getDataResult.statusCode === 200) {
    yield put({ type: GETDATA_SUCCESS.type, payload: getDataResult });
  } else {
    yield put({ type: GETDATA_FAILED.type });
  }
}

function* integrativeStatisticsSaga() {
  // 获取用户报警配置置信息
  yield takeEvery(GETDATA_ACTION.type, getDataRequest);
}

// 导出
export default {
  integrativeStatisticsReducers,
  integrativeStatisticsSaga,
};
