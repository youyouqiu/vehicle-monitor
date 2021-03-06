import { Map } from 'immutable';
import * as timeFormat from 'd3-time-format';
import { delay } from 'redux-saga';
import {
  put, call, takeLatest,
} from './common';
// import { getUserSetting } from '../server/getStorageData';
// import storage from '../utils/storage';
import {
  getStopBar,
  getStopDetailData,
} from '../server/getData';
import { getCurrentTime } from '../utils/function';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
let nowEndTime = '';

// action
const INIT_ACTION = { type: 'stopStatistics/SAGA/INIT_ACTION' };
const INIT_START_ACTION = { type: 'stopStatistics/INIT_START_ACTION' };
const INIT_SUCCESS_ACTION = { type: 'stopStatistics/INIT_SUCCESS_ACTION' };
const INIT_FAIL_ACTION = { type: 'stopStatistics/INIT_FAIL_ACTION' };

const GET_DETAILS_START_ACTION = { type: 'stopStatistics/GET_DETAILS_START_ACTION' };
const GET_DETAILS_ACTION = { type: 'stopStatistics/SAGA/GET_DETAILS_ACTION' };
const GET_DETAILS_SUCCESS_ACTION = { type: 'stopStatistics/GET_DETAILS_SUCCESS_ACTION' };
const GET_DETAILS_FAIL_ACTION = { type: 'stopStatistics/GET_DETAILS_FAIL_ACTION' };

const RESET_DETAIL_ACTION = { type: 'stopStatistics/SAGA/RESET_DETAIL_ACTION' };
const RESET_DETAIL_START_ACTION = { type: 'stopStatistics/RESET_DETAIL_START_ACTION' };
const RESET_DETAIL_SUCCESS_ACTION = { type: 'stopStatistics/RESET_DETAIL_SUCCESS_ACTION' };

const RESET_DATA = { type: 'stopStatistics/RESET_DATA' };

// reducer
const defaultState = Map({
  initStatus: 'ing', // ing,end
  isSuccess: true,
  queryPeriod: 31,
  barChartData: null,
  barDetailData: null,
  currentIndex: null,
  extraState: null,
});

const stopStatisticsReducers = (state = defaultState, { type, payload }) => {
  let newState = null;
  switch (type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        isSuccess: true,
        barChartData: null,
        barDetailData: null,
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
        barDetailData: payload.details,
        initStatus: 'end',
        isSuccess: true,
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
        barDetailData: null,
        currentIndex: payload.currentIndex,
      });
      return newState;
    case RESET_DATA.type:
      newState = state.merge({
        initStatus: 'ing', // ing,end
        isSuccess: true,
        queryPeriod: 31,
        barChartData: null,
        barDetailData: null,
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
    monitors: vehicleIds, startTime,
    endTime,
  } = payload;
  yield put({
    type: INIT_START_ACTION.type,
  });

  nowEndTime = (endTime >= getCurrentTime(1)) ? timeFormator(new Date()) : `${endTime} 23:59:59`;// ?????????????????????????????????????????????
  const param = {
    vehicleIds,
    startTime: `${startTime} 00:00:00`,
    endTime: nowEndTime,
  };
  const barResult = yield call(getStopBar, param);

  if (barResult === false || barResult.statusCode !== 200) {
    yield put({ type: INIT_FAIL_ACTION.type });
    return;
  }

  const { obj } = barResult;
  yield put({
    type: INIT_SUCCESS_ACTION.type,
    payload: {
      barChartData: obj,
      extraState: payload.extraState,
    },
  });
}

function* getDetailData ({ payload }) {
  try {
    const {
      moniterId, startTime,
      // endTime,
      index,
    } = payload;

    yield put({
      type: GET_DETAILS_START_ACTION.type,
    });

    const param = {
      moniterId,
      startTime: `${startTime} 00:00:00`,
      endTime: nowEndTime,
    };
    const result = yield call(getStopDetailData, param);

    if (result === false || result.statusCode !== 200) {
      yield put({ type: GET_DETAILS_FAIL_ACTION.type });
      return;
    }

    yield put({
      type: GET_DETAILS_SUCCESS_ACTION.type,
      payload: {
        details: result.obj,
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

function* stopStatisticsSaga () {
  yield takeLatest(INIT_ACTION.type, initRequest);
  yield takeLatest(GET_DETAILS_ACTION.type, getDetailData);
  yield takeLatest(RESET_DETAIL_ACTION.type, resetDetails);
}

// ??????
export default {
  stopStatisticsReducers,
  stopStatisticsSaga,
};
