import { Map } from 'immutable';
import { delay } from 'redux-saga';
// import * as timeFormat from 'd3-time-format';
import {
  put, call, takeLatest,
} from './common';
// import { getUserSetting } from '../server/getStorageData';
// import storage from '../utils/storage';
import {
  getWorkHourStatisticsInfo,
} from '../server/getData';

// const longDateFormator = timeFormat.timeFormat('%Y-%m-%d');

// action
const INIT_ACTION = { type: 'workingStatistics/SAGA/INIT_ACTION' };
const INIT_START_ACTION = { type: 'workingStatistics/INIT_START_ACTION' };
const INIT_SUCCESS_ACTION = { type: 'workingStatistics/INIT_SUCCESS_ACTION' };
const INIT_FAIL_ACTION = { type: 'workingStatistics/INIT_FAIL_ACTION' };

const GET_DETAILS_START_ACTION = { type: 'workingStatistics/GET_DETAILS_START_ACTION' };
const GET_DETAILS_ACTION = { type: 'workingStatistics/SAGA/GET_DETAILS_ACTION' };
const GET_DETAILS_SUCCESS_ACTION = { type: 'workingStatistics/GET_DETAILS_SUCCESS_ACTION' };
const GET_DETAILS_FAIL_ACTION = { type: 'workingStatistics/GET_DETAILS_FAIL_ACTION' };

const RESET_DETAIL_ACTION = { type: 'workingStatistics/SAGA/RESET_DETAIL_ACTION' };
const RESET_DETAIL_START_ACTION = { type: 'workingStatistics/RESET_DETAIL_START_ACTION' };
const RESET_DETAIL_SUCCESS_ACTION = { type: 'workingStatistics/RESET_DETAIL_SUCCESS_ACTION' };

const RESET_DATA = { type: 'workingStatistics/RESET_DATA' };

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

const workingStatisticsReducers = (state = defaultState, { type, payload }) => {
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
        // detailsData: state.get('barChartData').getIn([payload.currentIndex]),
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
    sensorNo,
  } = payload;
  yield put({
    type: INIT_START_ACTION.type,
  });

  const param = {
    monitorIds: vehicleIds.join(','),
    startTime: `${startTime}`,
    endTime: `${endTime}`,
    sensorNo,
  };
  const barResult = yield call(getWorkHourStatisticsInfo, param);

  if (barResult === false || barResult.statusCode !== 200) {
    yield put({ type: INIT_FAIL_ACTION.type });
    return;
  }

  yield put({
    type: INIT_SUCCESS_ACTION.type,
    payload: {
      barChartData: barResult.obj,
      extraState: payload.extraState,
    },
  });
}

function* getDetails ({ payload }) {
  try {
    const {
      index,
    } = payload;

    yield put({
      type: GET_DETAILS_START_ACTION.type,
    });

    yield put({
      type: GET_DETAILS_SUCCESS_ACTION.type,
      payload: {
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


function* workingStatisticsSaga () {
  yield takeLatest(INIT_ACTION.type, initRequest);
  yield takeLatest(GET_DETAILS_ACTION.type, getDetails);
  yield takeLatest(RESET_DETAIL_ACTION.type, resetDetails);
}

// 导出
export default {
  workingStatisticsReducers,
  workingStatisticsSaga,
};
