import { Map } from 'immutable';
import * as timeFormat from 'd3-time-format';
import {
  put, call, takeEvery, takeLatest, all, select,
} from './common';
import { getUserSetting } from '../server/getStorageData';
// import storage from '../utils/storage';
import {
  getAttached,
  getHistoryLocation,
  getMileageStatistics,
  getMileage,
  getStop,
  getOilData,
  getOilConsumption,
  getTemperaturey,
  getHumidity,
  getReverse,
  getWorkHour,
  getIoData,
  getWeight,
  getTire,
} from '../server/getData';

const longDateFormator = timeFormat.timeFormat('%Y-%m-%d');

/* eslint no-continue:off */

/**
 * 补点，如果数组的两个点时间相差大于五分钟，则按30秒一个点来补
 * @param {Array} array 需要补点的数组
 * @param {Function} cloneFunc 提供补点转换函数，接受上一个点和时间
 */
const suplementMissingPoint = (array, cloneFunc) => {
  if (!array) {
    return;
  }
  let len = array.length;
  for (let i = 0; i < len;) {
    const prevItem = array[i - 1];
    const item = array[i];
    if (!prevItem) {
      i += 1;
      continue;
    }
    const difference = item.time - prevItem.time; // 都是以秒为单位
    if (difference <= 300 || difference > 3600 * 24 * 3) { // 超过三天了也不补了，多半是数据有问题
      i += 1;
      continue;
    }

    let second30Times = Math.floor(difference / 30); // 这些秒中包含多少个30秒
    // 如果刚好是30秒间隔整数个，那么最后一个实际上不需要不点，比如10秒到70秒，差了60秒，但只需要补一个点
    if (difference / 30 === second30Times && second30Times > 0) {
      second30Times -= 1;
    }
    for (let j = 0; j < second30Times; j += 1) {
      array.splice(i + j, 0, cloneFunc(prevItem, prevItem.time + (30 * (j + 1))));
    }
    len = array.length;
    i += second30Times + 1;
  }
};


// const oilDataIds = ['0x41', '0x42', '0x43', '0x44'];
// const oilConsumptionDataIds = ['0x45', '0x46'];
// const humidityIds = ['0x26', '0x27', '0x28', '0x29', '0x2A'];
// const temperatureyIds = ['0x21', '0x22', '0x23', '0x24', '0x25'];
// const workHourIds = ['0x80', '0x81'];
// const reverseIds = ['0x51'];
// const ioDataIds = ['0x90', '0x91', '0x92'];


// action
const INIT_ACTION = { type: 'historyData/SAGA/INIT_ACTION' };
const INIT_START_ACTION = { type: 'historyData/INIT_START_ACTION' };
const INIT_SUCCESS_ACTION = { type: 'historyData/INIT_SUCCESS_ACTION' };
const INIT_FAIL_ACTION = { type: 'historyData/INIT_FAIL_ACTION' };

const INIT_TIME_ACTION = { type: 'historyData/SAGA/INIT_TIME_ACTION' };
const INIT_TIME_START_ACTION = { type: 'historyData/INIT_TIME_START_ACTION' };
const INIT_TIME_SUCCESS_ACTION = { type: 'historyData/INIT_TIME_SUCCESS_ACTION' };


const GET_CHART_DATA_ACTION = { type: 'historyData/SAGA/GET_CHART_DATA_ACTION' };
const GET_CHART_DATA_START_ACTION = { type: 'historyData/GET_CHART_DATA_START_ACTION' };
const GET_CHART_DATA_SUCCESS_ACTION = { type: 'historyData/GET_CHART_DATA_SUCCESS_ACTION' };
const GET_CHART_DATA_FAILED_ACTION = { type: 'historyData/GET_CHART_DATA_FAILED_ACTION' };

// 地图放大
const MAP_AMPLIFICATION = { type: 'historyData/MAP_AMPLIFICATION' };
// 地图缩小
const MAP_NARROW = { type: 'historyData/MAP_NARROW' };

// reducer
const defaultState = Map({
  initStatus: 'ing', // ing,end
  isSuccess: true,
  queryHistoryPeriod: 7,
  attachList: null,
  mileageData: null,
  historyLocation: null,
  getChartDataStatus: null,
  chartData: null,
  stopData: null,
  extraState: null,
  mileDayStatistics: null,
  // 地图放大
  mapAmplification: null,
  // 地图缩小
  mapNarrow: null,
  serverTime: 0,
});

const historyDataReducers = (state = defaultState, { type, payload }) => {
  let newState = null;
  let chartData;
  switch (type) {
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        attachList: null,
        historyLocation: null,
        stopData: null,
        extraState: payload.extraState,
      });
      return newState;
    case INIT_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: true,
        attachList: payload.attachList,
        historyLocation: payload.historyLocation,
        mileageData: payload.mileageData,
        stopData: payload.stopData,
        extraState: payload.extraState,
        serverTime: payload.serverTime,
      });

      return newState;
    case INIT_FAIL_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: false,
      });
      return newState;
    case INIT_TIME_START_ACTION.type:
      newState = state.merge({
        mileDayStatistics: null,
      });
      return newState;
    case INIT_TIME_SUCCESS_ACTION.type:

      if (payload) {
        newState = state.merge({
          queryHistoryPeriod: payload.setting ? payload.setting.app.queryHistoryPeriod : state.get('queryHistoryPeriod'),
          mileDayStatistics: payload.mileDayStatistics,
        });
        return newState;
      }
      return state;
    case GET_CHART_DATA_START_ACTION.type:
      newState = state.merge({
        getChartDataStatus: 'ing',
        chartData: null,
      });
      return newState;
    case GET_CHART_DATA_SUCCESS_ACTION.type:
      chartData = {
        data: payload.data,
        mileage: state.get('mileageData'),
      };

      newState = state.merge({
        getChartDataStatus: 'success',
        chartData,
      });
      return newState;
    case GET_CHART_DATA_FAILED_ACTION.type:
      newState = state.merge({
        getChartDataStatus: 'failed',
      });
      return newState;
      // 地图放大
    case MAP_AMPLIFICATION.type:
      return state.set('mapAmplification', payload);
      // 地图缩小
    case MAP_NARROW.type:
      return state.set('mapNarrow', payload);
    default:
      return state;
  }
};


// saga

function* initTimeRequest({
  payload: {
    currentMonitorId,
    mileageStartDate,
    mileageEndDate,
  },
}) {
  yield put({
    type: INIT_TIME_START_ACTION.type,
  });

  const setting = yield call(getUserSetting);
  const result = yield call(getMileageStatistics, {
    monitorId: currentMonitorId,
    startDate: mileageStartDate,
    endDate: mileageEndDate,
  });

  if (result === false) {
    return;
  }

  const mileDayStatistics = {};
  if (result !== false && result.statusCode === 200 && result.obj.mileDayStatistics !== '') {
    const serverData = result.obj.mileDayStatistics;
    const serverDate = serverData.date;
    for (let i = 0; i < serverDate.length; i += 1) {
      const x = serverDate[i];
      const startDate = new Date(mileageStartDate);
      startDate.setDate(startDate.getDate() + x);
      mileDayStatistics[longDateFormator(startDate)] = serverData.dailyMile[i];
    }
  }
  yield put({ type: INIT_TIME_SUCCESS_ACTION.type, payload: { setting, mileDayStatistics } });
}

function* initRequest({ payload }) {
  const {
    monitorId, endTime, extraState, changeSource, startTime,
  } = payload;


  let prevAttach;
  if (changeSource === 'time') {
    prevAttach = yield select(state => state.getIn(['historyDataReducers', 'attachList']));
  }
  yield put({
    type: INIT_START_ACTION.type,
    payload: {
      extraState: payload.extraState,
    },
  });

  let attachResult;
  let historyLocationResult;
  let mileageDataResult;
  let stopDataResult;

  const start = new Date();
  if (changeSource === 'time') {
    ([historyLocationResult, mileageDataResult, stopDataResult] = yield all([
      call(getHistoryLocation, { monitorId, startTime, endTime }),
      call(getMileage, { monitorId, startTime, endTime }),
      call(getStop, { monitorId, startTime, endTime }),
    ]));

    attachResult = {
      statusCode: 200,
      obj: {
        attachedList: prevAttach,
      },
    };
  } else {
    ([attachResult, historyLocationResult, mileageDataResult, stopDataResult] = yield all([
      call(getAttached, { monitorId }),
      call(getHistoryLocation, { monitorId, startTime, endTime }),
      call(getMileage, { monitorId, startTime, endTime }),
      call(getStop, { monitorId, startTime, endTime }),
    ]));
  }

  const end = new Date();
  const serverTime = (end - start) / 1000;


  if (attachResult === false
    || historyLocationResult === false
    || mileageDataResult === false) {
    yield put({ type: INIT_FAIL_ACTION.type });
    return;
  }
  if (attachResult.statusCode === 200
    && historyLocationResult.statusCode === 200
    && mileageDataResult.statusCode === 200
  ) {
    /**
     * 历史数据经纬度为0的点位置取上一个，具体逻辑为：
     * 如果一个点的经纬度同时为0，则同时向前向后寻找经纬度不为0的点，向前方向优先，
     * 如果遍历所有点都找不到有经纬度的点，则该点保持原样，也就是整条线都是经纬度为0
     * 后面的经纬度是厂商的经纬度，有时候会自动跳到该点，所以也需要过滤
     */
    const locationInfo = historyLocationResult.obj.locations;

    if (locationInfo && locationInfo.length > 0) {
      // 补点
      suplementMissingPoint(locationInfo, (prevItem, time) => ({ ...prevItem, time }));
      suplementMissingPoint(mileageDataResult.obj.mileage, (prevItem, time) => ({
        total: null, speed: null, time,
      }));

      for (let i = 0, len = locationInfo.length; i < len; i += 1) {
        const element = locationInfo[i];

        if ((element.latitude === '0.0' && element.longitude === '0.0') || (element.latitude === '22.612487' && element.longitude === '114.059264')) {
          let toReplace = null;

          for (let j = 0, max = Math.max(i, len - i - 1); j < max; j += 1) {
            const prev = locationInfo[i - j];
            const next = locationInfo[i + j];
            if (prev && (prev.latitude !== '0.0' || prev.longitude !== '0.0') && (prev.latitude !== '22.612487' || prev.longitude !== '114.059264')) {
              toReplace = prev;
            } else if (next && (next.latitude !== '0.0' || next.longitude !== '0.0') && (next.latitude !== '22.612487' || next.longitude !== '114.059264')) {
              toReplace = next;
            }

            if (toReplace !== null) {
              break;
            }
          }
          if (toReplace !== null) {
            // locationInfo[i] = toReplace;
            element.latitude = toReplace.latitude;
            element.longitude = toReplace.longitude;
          }
        }
      }

      /** 如果一个点的里程小于0，则向前向后寻找大于0的点来替换自己, 向前优先 */
      const data = mileageDataResult.obj.mileage;
      const dataSize = data.length;
      for (let i = 0; i < dataSize; i += 1) {
        const element = data[i];
        let mileage = element.total;
        mileage = mileage === null ? null : parseFloat(mileage);

        if (mileage !== null && mileage <= 0) {
          let toReplace = null;

          for (let j = 0, max = Math.max(i, dataSize - i - 1); j < max; j += 1) {
            const prev = data[i - j];
            const next = data[i + j];
            if (prev && (prev.total > 0)) {
              toReplace = prev;
            } else if (next && (next.total > 0)) {
              toReplace = next;
            }
            if (toReplace !== null) {
              break;
            }
          }

          if (toReplace !== null) {
            data[i] = toReplace;
          }
        }
      }
    }

    if (stopDataResult.statusCode === 200) {
      suplementMissingPoint(stopDataResult.obj ? stopDataResult.obj.track : [],
        (_, time) => ({ status: null, time }));
    }

    let attachList = attachResult.obj.attachedList || [];
    attachList = changeSource === 'time' ? attachList : [Math.random()].concat(attachList);

    yield put({
      type: INIT_SUCCESS_ACTION.type,
      payload: {
        attachList,
        historyLocation: historyLocationResult.obj.locations || [],
        mileageData: mileageDataResult.obj.mileage || [],
        stopData: stopDataResult.obj ? stopDataResult.obj.track : null,
        extraState,
        serverTime,
      },
    });
  } else {
    yield put({ type: INIT_FAIL_ACTION.type });
  }
}

function* getChartData({
  payload: {
    chartKey,
    currentMonitorId,
    startTime,
    endTime,
  },
}) {
  yield put({ type: GET_CHART_DATA_START_ACTION.type });
  let dataResult = null;
  // let availableIds;
  // let currentAttach;
  // let workHourResult;
  // let mileageResult;

  switch (chartKey) {
    case 'mileSpeed':
      dataResult = yield call(getMileage, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'stopData':
      dataResult = yield call(getStop, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'oilData':
      dataResult = yield call(getOilData, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'oilConsumptionData':
      dataResult = yield call(getOilConsumption,
        { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'temperaturey':
      dataResult = yield call(getTemperaturey, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'humidity':
      dataResult = yield call(getHumidity, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'workHour':
      // availableIds = workHourIds.filter(x => attachList.indexOf(x) > -1);
      // currentAttach = availableIds[attachIndex];
      dataResult = yield call(getWorkHour, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'reverse':
      dataResult = yield call(getReverse, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'ioData':
      dataResult = yield call(getIoData, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'weight':
      dataResult = yield call(getWeight, { monitorId: currentMonitorId, startTime, endTime });
      break;
    case 'tire':
      dataResult = yield call(getTire, { monitorId: currentMonitorId, startTime, endTime });
      break;
    default:
      break;
  }

  if (dataResult === false || dataResult === null) {
    yield put({ type: GET_CHART_DATA_FAILED_ACTION.type });
    return;
  }
  if (dataResult.statusCode === 200) {
    switch (chartKey) {
      case 'mileSpeed':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.mileage : [],
          (_, time) => ({
            speed: null, total: null, time, supply: true,
          }));
        break;
      case 'stopData':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.track : [],
          (_, time) => ({ status: null, time, supply: true }));
        break;
      case 'oilData':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.oilMass : [],
          (prevItem, time) => ({
            oilTank: prevItem.oilTank.map(() => null),
            fuelAmount: prevItem.fuelAmount.map(() => null),
            fuelSpill: prevItem.fuelSpill.map(() => null),
            time,
            supply: true,
          }));
        break;
      case 'oilConsumptionData':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.oilConsume : [],
          (_, time) => ({
            amount: null, mileage: null, time, supply: true,
          }));
        break;
      case 'temperaturey':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.temprature : [],
          (prevItem, time) => ({ sensors: prevItem.sensors.map(() => null), time, supply: true }));
        break;
      case 'humidity':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.humidity : [],
          (prevItem, time) => ({ sensors: prevItem.sensors.map(() => null), time, supply: true }));
        break;
      case 'workHour':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.workHourInfo : [],
          (prevItem, time) => ({
            checkData: [null, null],
            effectiveData: [null, null],
            workingPosition: [null, null],
            time,
            supply: true,
          }));
        break;
      case 'reverse':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.motor : [],
          (prevItem, time) => ({
            orientation: null,
            rotationSpeed: null,
            rotationStatus: null,
            workTime: null,
            pulseCount: null,
            rotationTime: null,
            time,
            supply: true,
          }));
        break;
      case 'ioData':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.data : [],
          (prevItem, time) => ({
            statuses: prevItem.statuses.map(() => null),
            time,
            supply: true,
          }));
        break;
      case 'weight':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.sensorDataList : [],
          (prevItem, time) => ({
            status: prevItem.status.map(() => null),
            weight: prevItem.weight.map(() => null),
            time,
            supply: true,
          }));
        break;
      case 'tire':
        suplementMissingPoint(dataResult.obj ? dataResult.obj.sensorDataList : [],
          (prevItem, time) => ({
            pressure: prevItem.pressure.map(() => null),
            time,
            supply: true,
          }));
        break;
      default:
        break;
    }
    yield put({
      type: GET_CHART_DATA_SUCCESS_ACTION.type,
      payload: { chartKey, data: dataResult.obj },
    });
  } else {
    yield put({ type: GET_CHART_DATA_FAILED_ACTION.type });
  }
}


function* historyDataSaga() {
  yield takeLatest(INIT_ACTION.type, initRequest);
  yield takeEvery(INIT_TIME_ACTION.type, initTimeRequest);
  yield takeLatest(GET_CHART_DATA_ACTION.type, getChartData);
}

// 导出
export default {
  historyDataReducers,
  historyDataSaga,
};
