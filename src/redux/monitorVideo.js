import { Map } from 'immutable';
import { put, call, takeEvery } from 'redux-saga/effects';
// import { ungzip } from '../utils/unzip/ungzip';
import {
  getChannel, sendParamByBatch, sendVideoParam,
} from '../server/getData';
import { toastShow } from '../utils/toastUtils';

// action
// 获取通道号
const GETCHANNEL_ACTION = { type: 'video/SAGA/GETCHANNEL_ACTION' };
const GETCHANNEL_SUCCESS_ACTION = { type: 'video/GETCHANNEL_SUCCESS_ACTION' };
const GETCHANNEL_FAIL_ACTION = { type: 'video/GETCHANNEL_FAIL_ACTION' };
// 订阅
const SUBSCRIBE_ACTION = { type: 'video/SAGA/SUBSCRIBE_ACTION' };
const SUBSCRIBE_SUCCESS_ACTION = { type: 'video/SUBSCRIBE_SUCCESS_ACTION' };
const SUBSCRIBE_FAIL_ACTION = { type: 'video/SUBSCRIBE_FAIL_ACTION' };
// 关闭
const CLOSE_ACTION = { type: 'video/SAGA/CLOSE_ACTION' };
const CLOSE_SUCCESS_ACTION = { type: 'video/CLOSE_SUCCESS_ACTION' };
const CLOSE_FAIL_ACTION = { type: 'video/CLOSE_FAIL_ACTION' };

// 重置数据
const RESET_ACTION = { type: 'video/RESET_ACTION' };

// 切换车辆
const CHANGEVEHICLE_ACTION = { type: 'video/SAGA/CHANGEVEHICLE_ACTION' };

// 更新监控对象地图标注信息
const UPDATE_MARKER_INFO = { type: 'video/UPDATE_MARKER_INFO' };

// reducer 同步
const defaultState = Map({
  channels: null, // 通道号
  subscribeDataProp: null, // 订阅返回数据
  randomNumber: null, // 随机数
  ifCloseVideo: null,
  // socket订阅标识时间戳
  socketTime: (new Date()).getTime(),
  // 用户更新地图的监控对象信息存储
  monitorInfo: new Map(),
});

const monitorVideoReducers = (state = defaultState, action) => {
  let newState = null;
  const randomNumber = Math.random() * 100;
  switch (action.type) {
    case GETCHANNEL_SUCCESS_ACTION.type:
      newState = state.merge({
        channels: action.payload,
        subscribeDataProp: null,
        ifCloseVideo: null,
        randomNumber,
      });
      return newState;
    case GETCHANNEL_FAIL_ACTION.type:
      newState = state.merge({
        channels: null,
      });
      return newState;
    case SUBSCRIBE_SUCCESS_ACTION.type: // 订阅成功

      newState = state.merge({
        subscribeDataProp: action.payload,
        ifCloseVideo: null,
        randomNumber,
      });
      return newState;
      // case SUBSCRIBE_FAIL_ACTION.type: // 订阅失败
      // newState = state.merge({
      //   channels: null, // 通道号
      //   subscribeDataProp: null, // 订阅返回数据
      // });
      // return newState;

    case RESET_ACTION.type: // 重置成功
      newState = state.merge({
        channels: null,
        subscribeDataProp: null,
        ifCloseVideo: null,
        randomNumber,
      });

      return newState;

    case CLOSE_SUCCESS_ACTION.type: // 取消订阅成功
      newState = state.merge({
        // channels: null,
        // subscribeDataProp: null,
        ifCloseVideo: action.payload,
        randomNumber,
      });
      return newState;
    case CLOSE_FAIL_ACTION.type: // 取消订阅失败
      newState = state.merge({
        // channels: null,
        // subscribeDataProp: null,
        ifCloseVideo: false,
        randomNumber,
      });
      return newState;
    case UPDATE_MARKER_INFO.type: // 地图点标注
      newState = state.merge({
        monitorInfo: action.value,
      });
      return newState;
    default:
      return state;
  }
};


// saga
function* getChannelData({ payload }) { // 获取通道号
  const result = yield call(getChannel, payload);

  if (result.success) {
    const { channelList } = result.obj;
    if (channelList.length === 0) {
      toastShow('平台未对该对象设置通道，请确认', { duration: 2000 });
    }

    yield put({ type: GETCHANNEL_SUCCESS_ACTION.type, payload: channelList });
  } else {
    yield put({ type: GETCHANNEL_FAIL_ACTION.type });
  }
}

// 订阅
function* getSendParamByBatch({ payload }) {
  const result = yield call(sendParamByBatch, payload);

  if (result.success) {
    const { obj } = result;

    yield put({ type: SUBSCRIBE_SUCCESS_ACTION.type, payload: obj });
  } else {
    yield put({ type: SUBSCRIBE_FAIL_ACTION.type });
  }
}

// 取消订阅
function* getSendVideoParam({ payload }) {
  const result = yield call(sendVideoParam, payload);
  if (result.success) {
    const { success } = result;
    yield put({ type: CLOSE_SUCCESS_ACTION.type, payload: success });
  } else {
    yield put({ type: CLOSE_FAIL_ACTION.type });
  }
}

// 车辆切换
function* vehicleChange({ payload }) {
  yield put({ type: RESET_ACTION.type });
  const { vehicleId } = payload;

  const result = yield call(getChannel, { id: vehicleId });

  if (result.success) {
    const { channelList } = result.obj;

    if (channelList.length === 0) {
      toastShow('平台未对该对象设置通道，请确认', { duration: 2000 });
    }

    yield put({ type: GETCHANNEL_SUCCESS_ACTION.type, payload: channelList });
  } else {
    yield put({ type: GETCHANNEL_FAIL_ACTION.type });
  }
}


function* monitorVideoSaga() {
  // 拦截异步请求
  yield takeEvery(GETCHANNEL_ACTION.type, getChannelData);

  yield takeEvery(SUBSCRIBE_ACTION.type, getSendParamByBatch);

  yield takeEvery(CLOSE_ACTION.type, getSendVideoParam);

  yield takeEvery(CHANGEVEHICLE_ACTION.type, vehicleChange);
}

// 导出
export default {
  monitorVideoReducers,
  monitorVideoSaga,
};
