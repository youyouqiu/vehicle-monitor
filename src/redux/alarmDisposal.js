import { Map } from 'immutable';
import { delay } from 'redux-saga';
import { all } from 'redux-saga/effects';
import {
  put, call, takeLatest,
} from './common';
// import { getUserSetting } from '../server/getStorageData';
// import storage from '../utils/storage';
import {
  getAlarmDisposal,
  getDisposalNumber,
} from '../server/getData';

// const longDateFormator = timeFormat.timeFormat('%Y-%m-%d');

// action
const INIT_ACTION = { type: 'alarmDisposal/SAGA/INIT_ACTION' };
const INIT_START_ACTION = { type: 'alarmDisposal/INIT_START_ACTION' };
const INIT_SUCCESS_ACTION = { type: 'alarmDisposal/INIT_SUCCESS_ACTION' };
const INIT_FAIL_ACTION = { type: 'alarmDisposal/INIT_FAIL_ACTION' };

const GET_DETAILS_START_ACTION = { type: 'alarmDisposal/GET_DETAILS_START_ACTION' };
const GET_DETAILS_ACTION = { type: 'alarmDisposal/SAGA/GET_DETAILS_ACTION' };
const GET_DETAILS_SUCCESS_ACTION = { type: 'alarmDisposal/GET_DETAILS_SUCCESS_ACTION' };
const GET_DETAILS_FAIL_ACTION = { type: 'alarmDisposal/GET_DETAILS_FAIL_ACTION' };

const RESET_DETAIL_ACTION = { type: 'alarmDisposal/SAGA/RESET_DETAIL_ACTION' };
const RESET_DETAIL_START_ACTION = { type: 'alarmDisposal/RESET_DETAIL_START_ACTION' };
const RESET_DETAIL_SUCCESS_ACTION = { type: 'alarmDisposal/RESET_DETAIL_SUCCESS_ACTION' };

const RESET_DATA = { type: 'alarmDisposal/RESET_DATA' };

// reducer
const defaultState = Map({
  initStatus: 'ing', // ing,end
  isSuccess: true,
  queryPeriod: 31,
  barChartData: null,
  disposalData: null,
  detailsData: null,
  currentIndex: null,
  extraState: null,
});

const alarmDisposalReducers = (state = defaultState, { type, payload }) => {
  let newState = null;
  switch (type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        isSuccess: true,
        barChartData: null,
        disposalData: null,
        detailsData: null,
        currentIndex: null,
        extraState: null,
      });
      return newState;
    case INIT_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: true,
        barChartData: payload.barChartData,
        disposalData: payload.disposalData,
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
        detailsData: state.get('barChartData').getIn([payload.currentIndex, 'dayToal']),
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
        detailsData: null,
        currentIndex: payload.currentIndex,
      });
      return newState;
    case RESET_DATA.type:
      newState = state.merge({
        initStatus: 'ing', // ing,end
        isSuccess: true,
        queryPeriod: 31,
        barChartData: null,
        disposalData: null,
        detailsData: null,
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
    status,
  } = payload;
  yield put({
    type: INIT_START_ACTION.type,
  });

  const param = {
    vehicleIds: vehicleIds.join(','),
    startTime,
    endTime,
    status,
  };

  const [barResult, disposalNumber] = yield all([
    call(getAlarmDisposal, param),
    call(getDisposalNumber, { vehicleIds: vehicleIds.join(','), startTime, endTime }),
  ]);

  if (barResult === false || barResult.statusCode !== 200
    || disposalNumber === false || disposalNumber.statusCode !== 200) {
    yield put({ type: INIT_FAIL_ACTION.type });
    return;
  }

  yield put({
    type: INIT_SUCCESS_ACTION.type,
    payload: {
      barChartData: barResult.obj,
      disposalData: disposalNumber.obj,
      extraState: payload.extraState,
    },
  });
}

function* getDetailData ({ payload }) {
  try {
    const {
      index,
    } = payload;
    yield put({ type: GET_DETAILS_START_ACTION.type });

    yield delay(100);

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

function* alarmDisposalSaga () {
  yield takeLatest(INIT_ACTION.type, initRequest);
  yield takeLatest(GET_DETAILS_ACTION.type, getDetailData);
  yield takeLatest(RESET_DETAIL_ACTION.type, resetDetails);
}

// ??????
export default {
  alarmDisposalReducers,
  alarmDisposalSaga,
};
