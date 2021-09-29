import { Map } from 'immutable';
import { delay } from 'redux-saga';
import * as timeFormat from 'd3-time-format';
import {
  put, call, takeLatest,
} from './common';
// import { getUserSetting } from '../server/getStorageData';
// import storage from '../utils/storage';
import {
  getSpeedingStatistics,
  getSpeedingStatisticsDetail,
} from '../server/getData';
import { getCurrentTime } from '../utils/function';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
let nowEndTime = '';

// action
const INIT_ACTION = { type: 'speedingStatistics/SAGA/INIT_ACTION' };
const INIT_START_ACTION = { type: 'speedingStatistics/INIT_START_ACTION' };
const INIT_SUCCESS_ACTION = { type: 'speedingStatistics/INIT_SUCCESS_ACTION' };
const INIT_FAIL_ACTION = { type: 'speedingStatistics/INIT_FAIL_ACTION' };

const GET_DETAILS_START_ACTION = { type: 'speedingStatistics/GET_DETAILS_START_ACTION' };
const GET_DETAILS_ACTION = { type: 'speedingStatistics/SAGA/GET_DETAILS_ACTION' };
const GET_DETAILS_SUCCESS_ACTION = { type: 'speedingStatistics/GET_DETAILS_SUCCESS_ACTION' };
const GET_DETAILS_FAIL_ACTION = { type: 'speedingStatistics/GET_DETAILS_FAIL_ACTION' };

const RESET_DETAIL_ACTION = { type: 'speedingStatistics/SAGA/RESET_DETAIL_ACTION' };
const RESET_DETAIL_START_ACTION = { type: 'speedingStatistics/RESET_DETAIL_START_ACTION' };
const RESET_DETAIL_SUCCESS_ACTION = { type: 'speedingStatistics/RESET_DETAIL_SUCCESS_ACTION' };

const RESET_DATA = { type: 'speedingStatistics/RESET_DATA' };

// reducer
const defaultState = Map({
  initStatus: 'ing', // ing,end
  isSuccess: true,
  queryPeriod: 31,
  barChartData: null,
  detailsData: [],
  currentIndex: null,
  extraState: null,
});

const speedingStatisticsReducers = (state = defaultState, { type, payload }) => {
  let newState = null;
  switch (type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        isSuccess: true,
        barChartData: null,
        detailsData: [],
        currentIndex: null,
        extraState: null,
      });
      return newState;
    case INIT_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: true,
        barChartData: payload.barChartData,
        currentIndex: null,
        extraState: payload.extraState,
      });
      return newState;
    case INIT_FAIL_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: false,
      });
      return newState;
    case GET_DETAILS_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
      });
      return newState;
    case GET_DETAILS_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: true,
        detailsData: payload.detailsData,
        currentIndex: payload.currentIndex,
      });
      return newState;
    case GET_DETAILS_FAIL_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: false,
      });
      return newState;
    case RESET_DETAIL_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
      });
      return newState;
    case RESET_DETAIL_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        detailsData: [],
        currentIndex: payload.currentIndex,
      });
      return newState;
    case RESET_DATA.type:
      newState = state.merge({
        initStatus: 'ing', // ing,end
        isSuccess: true,
        queryPeriod: 31,
        barChartData: null,
        detailsData: [],
        currentIndex: null,
        extraState: null,
      });
      return newState;
    default:
      return state;
  }
};


// saga

function* initRequest ({ payload }) {
  const {
    monitors: vehicleIds,
    startTime,
    endTime,
    type,
  } = payload;
  yield put({
    type: INIT_START_ACTION.type,
  });

  // 判断自定义时间是否超过当前时间
  nowEndTime = (endTime >= getCurrentTime(1)) ? timeFormator(new Date()) : endTime;
  const param = {
    moniterIds: vehicleIds.join(','),
    startTime: `${startTime}`,
    endTime: nowEndTime,
    type,
  };

  const barResult = yield call(getSpeedingStatistics, param);
  if (barResult === false || barResult.statusCode !== 200) {
    yield put({ type: INIT_FAIL_ACTION.type });
    return;
  }

  yield put({
    type: INIT_SUCCESS_ACTION.type,
    payload: {
      barChartData: barResult.obj.speedReports,
      extraState: payload.extraState,
    },
  });
}

function* getDetails ({ payload }) {
  try {
    const {
      moniterId,
      startTime,
      // endTime,
      type,
      index,
    } = payload;

    yield put({
      type: GET_DETAILS_START_ACTION.type,
    });

    const param = {
      moniterId,
      startTime: `${startTime}`,
      endTime: nowEndTime,
      type,
    };
    const detailsResult = yield call(getSpeedingStatisticsDetail, param);

    if (detailsResult === false || detailsResult.statusCode !== 200) {
      yield put({ type: GET_DETAILS_FAIL_ACTION.type });
      return;
    }

    yield put({
      type: GET_DETAILS_SUCCESS_ACTION.type,
      payload: {
        detailsData: detailsResult.obj.details,
        currentIndex: index,
      },
    });
  } catch (error) {
    yield put({ type: GET_DETAILS_FAIL_ACTION.type });
  }
}

function* resetDetails ({ payload }) {
  yield put({
    type: RESET_DETAIL_START_ACTION.type,
  });

  yield delay(100);

  yield put({
    type: RESET_DETAIL_SUCCESS_ACTION.type,
    payload,
  });
}


function* speedingStatisticsSaga () {
  yield takeLatest(INIT_ACTION.type, initRequest);
  yield takeLatest(GET_DETAILS_ACTION.type, getDetails);
  yield takeLatest(RESET_DETAIL_ACTION.type, resetDetails);
}

// 导出
export default {
  speedingStatisticsReducers,
  speedingStatisticsSaga,
};
