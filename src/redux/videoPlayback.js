/* eslint-disable no-underscore-dangle */
/* eslint-disable no-use-before-define */
/* eslint-disable func-names */
import { Map, List } from 'immutable';
import * as timeFormat from 'd3-time-format';
import {
  put, call, takeLatest, select,
} from './common';
import {
  getHistoryLocation,
  getVideoChannel,
} from '../server/getData';
import {
  padZero,
  isEmpty,
  obj2Second,
  strangeDateParser,
  strangeDateFormater,
} from '../utils/function';
import { getLocale } from '../utils/locales';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
/**
 * 15分钟对应多少秒
 */
const FIFTEEN_MINUJTES_SECONDS = 900;
/**
 * 一天对应多少秒
 */
const DAY_SECONDS = 86400;

const playPrompt = getLocale('playPrompt');
const noVideoPrompt = getLocale('noVideoPrompt');
const playEndPrompt = getLocale('playEndPrompt');
const currentChannelNoVideoPrompt = getLocale('currentChannelNoVideoPrompt');

// action
// 页面一进入触发
const CONSTRUCT_ACTION = { type: 'videoPlayback/CONSTRUCT_ACTION' };

const INIT_ACTION = { type: 'videoPlayback/SAGA/INIT_ACTION' };
const INIT_START_ACTION = { type: 'videoPlayback/INIT_START_ACTION' };
const INIT_SUCCESS_ACTION = { type: 'videoPlayback/INIT_SUCCESS_ACTION' };
const INIT_FAIL_ACTION = { type: 'videoPlayback/INIT_FAIL_ACTION' };

const INIT_TIME_ACTION = { type: 'videoPlayback/SAGA/INIT_TIME_ACTION' };
const INIT_TIME_START_ACTION = { type: 'videoPlayback/INIT_TIME_START_ACTION' };
const INIT_TIME_SUCCESS_ACTION = { type: 'videoPlayback/INIT_TIME_SUCCESS_ACTION' };

// 通道改变
const BEFORE_CHANNEL_CHANGE_ACTION = { type: 'videoPlayback/SAGA/BEFORE_CHANNEL_CHANGE_ACTION' };
const CHANNEL_CHANGE_ACTION = { type: 'videoPlayback/CHANNEL_CHANGE_ACTION' };
// 一天的数据改变
const BEFORE_ONE_DAY_CHANGE_ACTION = { type: 'videoPlayback/SAGA/BEFORE_ONE_DAY_CHANGE_ACTION' };
const ONE_DAY_CHANGE_ACTION = { type: 'videoPlayback/ONE_DAY_CHANGE_ACTION' };
const ONE_DAY_CHANGE_FAILED_ACTION = { type: 'videoPlayback/ONE_DAY_CHANGE_FAILED_ACTION' };

// 订阅
const PLAYINFO_CHANGE_ACTION = { type: 'videoPlayback/SAGA/PLAYINFO_CHANGE_ACTION' };
const PLAY_ACTION = { type: 'videoPlayback/SAGA/PLAY_ACTION' };
const PLAY_START_ACTION = { type: 'videoPlayback/PLAY_START_ACTION' };
const PLAY_SUCCESS_ACTION = { type: 'videoPlayback/PLAY_SUCCESS_ACTION' };
const PLAY_FAIL_ACTION = { type: 'videoPlayback/PLAY_FAIL_ACTION' };
const GET_ONE_DAY = { type: 'videoPlayback/SAGA/GET_ONE_DAY' };
const GET_15_DAY = { type: 'videoPlayback/SAGA/GET_15_DAY' };

// 关闭
const CLOSE_ACTION = { type: 'videoPlayback/SAGA/CLOSE_ACTION' };
const CLOSE_SUCCESS_ACTION = { type: 'videoPlayback/CLOSE_SUCCESS_ACTION' };
const CLOSE_FAIL_ACTION = { type: 'videoPlayback/CLOSE_FAIL_ACTION' };

// 地图关闭
const MAP_CLOSE = { type: 'videoPlayback/MAP_CLOSE' };

// 轨迹
const INIT_TRACK_ACTION = { type: 'videoPlayback/SAGA/INIT_TRACK_ACTION' };
const INIT_TRACK_START_ACTION = { type: 'videoPlayback/INIT_TRACK_START_ACTION' };
const INIT_TRACK_SUCCESS_ACTION = { type: 'videoPlayback/INIT_TRACK_SUCCESS_ACTION' };

// 播放控制
const FULL_SCREEN_ACTION = { type: 'videoPlayback/FULL_SCREEN_ACTION' };
const PLAY_CHANGE_ACTION = { type: 'videoPlayback/PLAY_CHANGE_ACTION' };
const BEFORE_PLAY_CHANGE_ACTION = { type: 'videoPlayback/SAGA/BEFORE_PLAY_CHANGE_ACTION' };
const CAMERA_ACTION = { type: 'videoPlayback/CAMERA_ACTION' };
const AUDIO_ACTION = { type: 'videoPlayback/AUDIO_ACTION' };
const CURRENT_TIME_ACTION = { type: 'videoPlayback/CURRENT_TIME_ACTION' };
const BEFORE_STEP_ACTION = { type: 'videoPlayback/SAGA/BEFORE_STEP_ACTION' };
const TIME_TYPE_CHANGE_ACTION = { type: 'videoPlayback/TIME_TYPE_CHANGE_ACTION' };
const BEFORE_TIME_TYPE_CHANGE_ACTION = { type: 'videoPlayback/SAGA/BEFORE_TIME_TYPE_CHANGE_ACTION' };
const VIDEO_PROMPT_CHANGE_ACTION = { type: 'videoPlayback/VIDEO_PROMPT_CHANGE_ACTION' };
const PLAY_END_ACTION = { type: 'videoPlayback/PLAY_END_ACTION' };
const VIDEO_15_CHANGE_ACTION = { type: 'videoPlayback/VIDEO_15_CHANGE_ACTION' };

// 重置数据
const RESET_ACTION = { type: 'videoPlayback/RESET_ACTION' };

let _segmentIndex = null;
let _audioFlag = null;

// reducer
const defaultState = Map({
  initStatus: 'ing', // ing,end
  isSuccess: true,
  oneDayMsgNum: null, // 一天具体通道里的码流数据 - 流水号
  oneDayMsgNumSocket: null, // socket 返回的流水号
  video15DayMsgNum1: null, // 十五天的数据流水号
  video15DayMsgNum2: null, // 十五天的数据流水号
  channelNames: null, // 通道名称
  currentChannelName: null, // 当前通道号
  unique: null, // 订阅返回数据
  showMap: false, // 是否显示地图
  historyLocation: null, // 位置数据
  sending9202: false, // 下发9202中
  oneDay: null, // 一天的码流数据
  oneDayCurrent: null, // 当前通道的一天码流数据
  hasVideo: null, // 是否有视频
  startTime: null,
  endTime: null,
  currentMonitor: null,
  currentTime: null,
  isFullScreen: false, // 全屏
  btmplayFlag: false, // 底部播放按钮
  cameraFlag: false, // 底部拍照
  audioFlag: true, // 音频开启
  segmentIndex: null, // 当前的播放区间
  timeType: '24', // 24小时还是1小时制
  progressStartTime: 0,
  progressEndTime: DAY_SECONDS,
  channelTaken: false, // 通道是否被占用
  videoPrompt: '', // 视频区域的提示
  video15Day1: null, // 15天的数据的前半部分
  video15Day2: null, // 15天的数据的后半部分
  playInfo: null, // 视频播放所需信息
});

const videoPlaybackReducers = (state = defaultState, { type, payload }) => {
  let newState = null;
  switch (type) {
    case RESET_ACTION.type: // 重置成功
      newState = state.merge({
        playInfo: null,
        currentMonitor: null,
        initStatus: 'ing',
        showMap: false,
      });
      return newState;
    case CONSTRUCT_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        isSuccess: true,
        oneDayMsgNum: null,
        oneDayMsgNumSocket: null,
        video15DayMsgNum1: null,
        video15DayMsgNum2: null,
        channelNames: null,
        currentChannelName: null,
        unique: null,
        showMap: false,
        historyLocation: null,
        sending9202: false,
        oneDay: null,
        oneDayCurrent: null,
        hasVideo: null,
        startTime: payload.startTime,
        endTime: payload.endTime,
        currentMonitor: payload.currentMonitor,
        currentTime: null,
        segmentIndex: null,
        timeType: '24',
        progressStartTime: 0,
        progressEndTime: DAY_SECONDS,
        channelTaken: false,
        videoPrompt: '',
        playInfo: null,
      });
      return newState;
    case PLAYINFO_CHANGE_ACTION.type:
      newState = state.merge({
        playInfo: payload.info,
        btmplayFlag: payload.btmplayFlag,
        segmentIndex: payload.segmentIndex === undefined ? _segmentIndex : payload.segmentIndex,
        initStatus: 'end',
      });
      return newState;
    case INIT_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        oneDayMsgNum: null,
        oneDayMsgNumSocket: null,
        channelNames: null,
        currentChannelName: null,
        unique: null,
        historyLocation: null,
        oneDay: null,
        oneDayCurrent: null,
        timeType: '24',
        progressStartTime: 0,
        progressEndTime: DAY_SECONDS,
        hasVideo: null,
        currentTime: null,
        segmentIndex: null,
      });
      return newState;
    case INIT_SUCCESS_ACTION.type:
      newState = state.merge({
        // initStatus: 'end',
        isSuccess: true,
        oneDayMsgNum: payload.oneDayMsgNum,
        video15DayMsgNum1: payload.video15DayMsgNum1,
        video15DayMsgNum2: payload.video15DayMsgNum2,
        channelNames: payload.channelNames,
        currentChannelName: payload.currentChannelName,
      });
      if (payload.historyLocation) {
        newState = newState.merge({
          historyLocation: payload.historyLocation,
        });
      }
      return newState;
    case INIT_FAIL_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: false,
      });
      return newState;
    case CHANNEL_CHANGE_ACTION.type:
      newState = state.merge({
        currentChannelName: payload.currentChannelName,
        oneDayCurrent: payload.oneDayCurrent,
        timeType: '24',
        progressStartTime: 0,
        progressEndTime: DAY_SECONDS,
        currentTime: payload.currentTime,
        hasVideo: payload.hasVideo,
        segmentIndex: null,
        videoPrompt: payload.videoPrompt,
      });
      return newState;
    case ONE_DAY_CHANGE_ACTION.type:
      newState = state.merge({
        oneDay: payload.oneDay,
        initStatus: 'end',
        oneDayCurrent: payload.oneDayCurrent,
        timeType: '24',
        progressStartTime: 0,
        progressEndTime: DAY_SECONDS,
        currentTime: payload.currentTime,
        oneDayMsgNumSocket: payload.oneDayMsgNumSocket,
        hasVideo: payload.hasVideo,
        segmentIndex: null,
        unique: null,
        videoPrompt: payload.videoPrompt,
      });
      return newState;
    case ONE_DAY_CHANGE_FAILED_ACTION.type:
      newState = state.merge({
        oneDay: null,
        initStatus: 'end',
        oneDayCurrent: null,
        timeType: '24',
        progressStartTime: 0,
        progressEndTime: DAY_SECONDS,
        currentTime: null,
        oneDayMsgNum: null,
        oneDayMsgNumSocket: null,
        hasVideo: false,
        segmentIndex: null,
        unique: null,
        videoPrompt: noVideoPrompt,
      });
      return newState;
    case INIT_TIME_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
        oneDayMsgNum: null,
        oneDayMsgNumSocket: null,
        unique: null,
        historyLocation: null,
        oneDay: null,
        oneDayCurrent: null,
        timeType: '24',
        progressStartTime: 0,
        progressEndTime: DAY_SECONDS,
        hasVideo: null,
        currentTime: null,
        segmentIndex: null,
      });
      return newState;
    case INIT_TIME_SUCCESS_ACTION.type:
      newState = state.merge({
        // initStatus: 'end',
        isSuccess: true,
        startTime: payload.startTime,
        endTime: payload.endTime,
        oneDayMsgNum: payload.oneDayMsgNum,
      });

      if (payload.historyLocation) {
        newState = newState.merge({
          historyLocation: payload.historyLocation,
        });
      }
      return newState;
    case PLAY_START_ACTION.type: // 订阅开始
      newState = state.merge({
        unique: null,
        sending9202: true,
        channelTaken: false,
        audioFlag: false,
        initStatus: 'ing',
      });
      return newState;
    case PLAY_SUCCESS_ACTION.type: // 订阅成功
      newState = state.merge({
        unique: payload.obj,
        segmentIndex: payload.segmentIndex,
        sending9202: false,
        channelTaken: false,
        initStatus: 'end',
        videoPrompt: playPrompt,
      });
      return newState;
    case PLAY_FAIL_ACTION.type: // 订阅成功
      newState = state.merge({
        sending9202: false,
        channelTaken: true,
        initStatus: 'end',
      });
      return newState;
    case CLOSE_SUCCESS_ACTION.type: // 取消订阅成功
      newState = state.merge({
        unique: null,
        btmplayFlag: false,
      });
      return newState;
    case CLOSE_FAIL_ACTION.type: // 取消订阅失败
      newState = state.merge({
        unique: null,
        btmplayFlag: false,
      });
      return newState;
    case INIT_TRACK_START_ACTION.type:
      newState = state.merge({
        initStatus: 'ing',
      });
      return newState;
    case INIT_TRACK_SUCCESS_ACTION.type:
      newState = state.merge({
        initStatus: 'end',
        isSuccess: true,
        historyLocation: payload.historyLocation,
        showMap: true,
      });
      return newState;
    case MAP_CLOSE.type:
      newState = state.merge({
        showMap: false,
      });
      return newState;
    case FULL_SCREEN_ACTION.type:
      newState = state.merge({
        isFullScreen: payload,
      });
      return newState;
    case PLAY_CHANGE_ACTION.type:
      newState = state.merge({
        btmplayFlag: payload.btmplayFlag,
      });
      return newState;
    case CAMERA_ACTION.type:
      newState = state.merge({
        cameraFlag: payload,
      });
      return newState;
    case AUDIO_ACTION.type:
      newState = state.merge({
        audioFlag: payload,
      });
      return newState;
    case CURRENT_TIME_ACTION.type:
      newState = state.merge({
        currentTime: payload.currentTime,
      });
      return newState;
    case TIME_TYPE_CHANGE_ACTION.type:
      newState = state.merge({
        timeType: payload.timeType,
        progressStartTime: payload.progressStartTime,
        progressEndTime: payload.progressEndTime,
      });
      return newState;
    case VIDEO_PROMPT_CHANGE_ACTION.type:
      newState = state.merge({
        videoPrompt: payload.videoPrompt,
      });
      return newState;
    case PLAY_END_ACTION.type:
      newState = state.merge({
        videoPrompt: playEndPrompt,
        sending9202: false,
        initStatus: 'end',
      });
      return newState;
    case VIDEO_15_CHANGE_ACTION.type:
      if (payload.video15Day1) {
        newState = state.merge({
          video15Day1: payload.video15Day1,
        });
      }
      if (payload.video15Day2) {
        newState = state.merge({
          video15Day2: payload.video15Day2,
        });
      }
      return newState;
    default:
      return state;
  }
};

/**
 * 历史数据经纬度为0的点位置取上一个，具体逻辑为：
 * 如果一个点的经纬度同时为0，则同时向前向后寻找经纬度不为0的点，向前方向优先，
 * 如果遍历所有点都找不到有经纬度的点，则该点保持原样，也就是整条线都是经纬度为0
 * 后面的经纬度是厂商的经纬度，有时候会自动跳到该点，所以也需要过滤
 */
function filterInvalidLocation (locationInfo) {
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
}

// saga

function* initTimeRequest ({ payload }) {
  const {
    endTime, startTime, socket, headers, timeoutCB,
  } = payload;
  const startTimeStr = timeFormator(startTime);
  const endTimeStr = timeFormator(endTime);
  const currentMonitor = yield select(state => state.getIn(['videoPlaybackReducers', 'currentMonitor']));
  const showMap = yield select(state => state.getIn(['videoPlaybackReducers', 'showMap']));
  const monitorId = currentMonitor.get('markerId');

  yield put({
    type: INIT_TIME_START_ACTION.type,
  });
  send9205(socket, headers, monitorId, startTimeStr, endTimeStr, timeoutCB);
  let historyLocationResult;
  if (showMap) {
    historyLocationResult = yield call(getHistoryLocation,
      { monitorId, startTime: startTimeStr, endTime: endTimeStr });
    if (historyLocationResult === false) {
      yield put({ type: INIT_FAIL_ACTION.type });
      return;
    }

    if (historyLocationResult.statusCode === 200) {
      const locationInfo = historyLocationResult.obj.locations;

      if (locationInfo && locationInfo.length > 0) {
        filterInvalidLocation(locationInfo);
      }
      historyLocationResult = locationInfo;
    } else {
      historyLocationResult = undefined;
    }
  }

  yield put({
    type: INIT_TIME_SUCCESS_ACTION.type,
    payload: {
      // oneDayMsgNum: oneDayMsgNumResult.obj.msgSN, // 一天具体通道里的码流数据 - 流水号
      historyLocation: historyLocationResult,
      startTime,
      endTime,
    },
  });
}

let timeoutId = null;

function send9205 (socket, headers, monitorId, startTimeStr, endTimeStr, timeoutCB) {
  const param9205 = {
    vehicleId: monitorId,
    alarmType: 0,
    channlNumer: 0,
    startTime: startTimeStr,
    endTime: endTimeStr,
    videoType: '0',
    streamType: '0',
    storageType: '0',
  };

  socket.send('/app/video/history/day', headers, param9205);
  timeoutId = setTimeout(timeoutCB, 60000);
}

function* initRequest ({ payload }) {
  const { socket, headers, timeoutCB } = payload;
  try {
    let startTime = yield select(state => state.getIn(['videoPlaybackReducers', 'startTime']));
    let endTime = yield select(state => state.getIn(['videoPlaybackReducers', 'endTime']));
    const showMap = yield select(state => state.getIn(['videoPlaybackReducers', 'showMap']));
    const currentMonitor = yield select(state => state.getIn(['videoPlaybackReducers', 'currentMonitor']));

    const monitorId = currentMonitor.get('markerId');
    startTime = timeFormator(startTime);
    endTime = timeFormator(endTime);

    yield put({
      type: INIT_START_ACTION.type,
    });
    const now = new Date();
    const nowDate = now.getDate();
    const crossMonth = nowDate < 15;
    const nowMonthStr = now.getFullYear().toString().substr(2) + padZero(now.getMonth() + 1);
    now.setMonth(now.getMonth() - 1);
    const prevMonthStr = now.getFullYear().toString().substr(2) + padZero(now.getMonth() + 1);
    let currentChannel;

    const channelNamesResult = yield call(getVideoChannel, { vehicleId: monitorId });
    if (channelNamesResult.statusCode === 200 && !isEmpty(channelNamesResult.obj)) {
      currentChannel = channelNamesResult.obj[0].physicsChannel;
      if (!crossMonth) {
        send9205(socket, headers, monitorId, startTime, endTime, timeoutCB);
        socket.send('/app/video/history/month', headers, {
          vehicleId: monitorId,
          videoType: '0',
          date: nowMonthStr,
        });
      } else {
        send9205(socket, headers, monitorId, startTime, endTime, timeoutCB);
        socket.send('/app/video/history/month', headers, {
          vehicleId: monitorId,
          videoType: '0',
          date: nowMonthStr,
        });
        socket.send('/app/video/history/month', headers, {
          vehicleId: monitorId,
          videoType: '0',
          date: prevMonthStr,
        });
      }
    }

    let historyLocationResult;
    if (showMap) {
      historyLocationResult = yield call(getHistoryLocation, { monitorId, startTime, endTime });

      if (historyLocationResult === false) {
        yield put({ type: INIT_FAIL_ACTION.type });
        return;
      }

      if (historyLocationResult.statusCode === 200) {
        const locationInfo = historyLocationResult.obj.locations;

        if (locationInfo && locationInfo.length > 0) {
          filterInvalidLocation(locationInfo);
        }
        historyLocationResult = locationInfo;
      } else {
        historyLocationResult = undefined;
      }
    }
    if (channelNamesResult.statusCode === 200) {
      // console.log(channelNamesResult.obj, 'channelNamesResult');
      yield put({
        type: INIT_SUCCESS_ACTION.type,
        payload: {
          // oneDayMsgNum: oneDayMsgNumResult.obj.msgSN, // 一天具体通道里的码流数据 - 流水号
          // video15DayMsgNum1: video15DayMsgNum1Result.obj, // 15天中哪些天有码流数据 - 流水号1
          // video15DayMsgNum2: video15DayMsgNum2Result.obj, // 15天中哪些天有码流数据 - 流水号2
          channelNames: channelNamesResult.obj, // 通道名称
          currentChannelName: currentChannel,
          historyLocation: historyLocationResult,
        },
      });
    } else {
      yield put({ type: INIT_FAIL_ACTION.type });
    }
  } catch (error) {
    console.log('wss init error:', error);
  }
}


// 订阅
function* play ({ payload }) {
  const {
    socket, headers, dragStatus, jumpStatus,
  } = payload;
  const audioFlag = yield select(state => state.getIn(['videoPlaybackReducers', 'audioFlag']));
  _audioFlag = audioFlag;
  yield put({
    type: PLAY_START_ACTION.type,
  });
  if (_audioFlag) {
    yield put({
      type: AUDIO_ACTION.type,
      payload: true,
    });
  }

  // const currentMonitor = yield select(state =>
  // state.getIn(['videoPlaybackReducers', 'currentMonitor']));
  const oneDayCurrent = yield select(state => state.getIn(['videoPlaybackReducers', 'oneDayCurrent']));
  const currentTime = yield select(state => state.getIn(['videoPlaybackReducers', 'currentTime']));
  const channelNames = yield select(state => state.getIn(['videoPlaybackReducers', 'channelNames']));
  const currentChannelName = yield select(state => state.getIn(['videoPlaybackReducers', 'currentChannelName']));
  const progressEndTime = yield select(state => state.getIn(['videoPlaybackReducers', 'progressEndTime']));

  let segmentIndex = null;
  const oneDaySegment = oneDayCurrent.find((x, index) => {
    if (x.get('startTime') <= currentTime && x.get('endTime') >= currentTime) {
      segmentIndex = index;
      return true;
    }
    return false;
  });

  const nowInSecond = obj2Second(currentTime);
  if (!oneDaySegment || nowInSecond >= progressEndTime || nowInSecond >= DAY_SECONDS - 1) {
    yield put({ type: PLAY_END_ACTION.type });
    return;
  }
  const val = channelNames.find(x => x.get('physicsChannel') === currentChannelName);
  _segmentIndex = segmentIndex;
  const param9201 = send9201(
    socket,
    headers,
    val.get('vehicleId'),
    val.get('logicChannel'),
    strangeDateFormater(currentTime),
    strangeDateFormater(oneDaySegment.get('endTime')),
  );
  param9201.jumpStatus = jumpStatus;
  if (dragStatus) { // 拖动回放
    param9201.remote = '5';
    param9201.dragPlaybackTime = strangeDateFormater(currentTime);
  }
  yield put({
    type: PLAYINFO_CHANGE_ACTION.type,
    payload: {
      info: param9201,
      btmplayFlag: true,
      segmentIndex,
    },
  });
}

function send9201 (socket, headers, vehicleId, channlNum, startTime, endTime) {
  const param9201 = {
    // 车辆id 车辆id、通道号和资源类型一一对应
    vehicleId,
    // 通道号 车辆id、通道号和资源类型一一对应
    // channlNumer: channlNum,
    // 资源类型（0：音视频 1音频 2视频） 车辆id、通道号和资源类型一一对应
    videoType: '0',
    // 码流类型(1主码流 2子码流)
    streamType: '0',
    // 存储器类型(1主存储器 2灾备存储器)
    storageType: '0',
    // 回放方式(0：正常回放 1：快进回放 2：关键帧快退回放 3：关键帧播放 4：单帧上传)
    remoteMode: '0',
    // 快进快退倍数(回放方式为1和2时，此字段有效，否则为0. 0：无效 1：1倍 2：2倍 3：4倍 4：8倍 5：16倍)
    forwardOrRewind: '1',
    startTime,
    endTime,
  };
  // socket.send('/app/video/history/play', headers, param9201);
  return param9201;
}

function send9202 (socket, headers, vehicleId) {
  const param9202 = {
    // 车辆id 车辆id、通道号和资源类型一一对应
    vehicleId,
    // 通道号 车辆id、通道号和资源类型一一对应
    // channelNums: channlNum,
    // 0：开始回放 1：暂停回放 2：结束回放 3：快进回放 4：关键帧快退回放 5：拖地回放 6：关键帧播放
    remote: '2',
    // 0：无效 1：1倍 2：2倍 3：4倍 4：8倍 5：16倍
    forwardOrRewind: '0',
    dragPlaybackTime: '0',
    closeType: 'TIMEOUT',
  };
  return param9202;
  // socket.send('/app/video/history/stop', headers, param9202);
}

// 取消订阅
function* stop ({ payload }) {
  const { socket, headers } = payload;
  const currentMonitor = yield select(state => state.getIn(['videoPlaybackReducers', 'currentMonitor']));
  const param9202 = send9202(socket, headers, currentMonitor.get('markerId'));
  yield put({
    type: PLAYINFO_CHANGE_ACTION.type,
    payload: {
      info: param9202,
      btmplayFlag: false,
    },
  });
  // return true;
}

function* initTrackRequest () {
  let startTime = yield select(state => state.getIn(['videoPlaybackReducers', 'startTime']));
  let endTime = yield select(state => state.getIn(['videoPlaybackReducers', 'endTime']));
  const currentMonitor = yield select(state => state.getIn(['videoPlaybackReducers', 'currentMonitor']));
  const monitorId = currentMonitor.get('markerId');

  startTime = timeFormator(startTime);
  endTime = timeFormator(endTime);

  yield put({
    type: INIT_TRACK_START_ACTION.type,
  });

  const historyLocationResult = yield call(getHistoryLocation, { monitorId, startTime, endTime });

  if (historyLocationResult === false) {
    yield put({ type: INIT_FAIL_ACTION.type });
    return;
  }

  if (historyLocationResult.statusCode === 200) {
    const locationInfo = historyLocationResult.obj.locations;

    if (locationInfo && locationInfo.length > 0) {
      filterInvalidLocation(locationInfo);
    }

    yield put({
      type: INIT_TRACK_SUCCESS_ACTION.type,
      payload: {
        historyLocation: historyLocationResult.obj.locations || [],
      },
    });
  } else {
    yield put({ type: INIT_FAIL_ACTION.type });
  }
}

// 拦截并分析一天的数据
function* analyzeOneDay ({ payload }) {
  const { resourcesList, msgSn } = payload;

  const startTime = yield select(state => state.getIn(['videoPlaybackReducers', 'startTime']));
  const endTime = yield select(state => state.getIn(['videoPlaybackReducers', 'endTime']));
  const currentChannelName = yield select(state => state.getIn(['videoPlaybackReducers', 'currentChannelName']));

  const channelData = [];
  const channelDataCurrent = [];
  let currentTime = null;
  for (let i = 0; i < resourcesList.length; i += 1) {
    const x = resourcesList[i];
    let resourceStartTime = strangeDateParser(x.startTime);
    const itemDay = resourceStartTime.getDate();
    const curDay = new Date(startTime.getTime()).getDate();
    if (itemDay !== curDay) continue;// 过滤掉包含非当前日期的视频资源

    let resourceEndTime = strangeDateParser(x.endTime);
    if (resourceStartTime < startTime) {
      resourceStartTime = new Date(startTime.getTime());
    }
    if (resourceEndTime > endTime) {
      resourceEndTime = new Date(endTime.getTime());
    }
    if ((currentTime === null || currentTime > resourceStartTime)
      && x.channelNum === currentChannelName) {
      currentTime = resourceStartTime;
    }

    const item = {
      channelNum: x.channelNum,
      startTime: resourceStartTime,
      endTime: resourceEndTime,
      streamType: x.streamType,
      videoType: x.videoType,
      physicsChannel: x.physicsChannel,
      storageType: x.storageType,
    };
    channelData.push(item);
    if (item.channelNum === currentChannelName) {
      channelDataCurrent.push(item);
    }
  }

  const videoPrompt = channelDataCurrent.length > 0 ? playPrompt : currentChannelNoVideoPrompt;

  yield put({
    type: ONE_DAY_CHANGE_ACTION.type,
    payload: {
      oneDay: channelData,
      oneDayCurrent: channelDataCurrent,
      currentTime,
      oneDayMsgNumSocket: parseInt(msgSn, 10),
      hasVideo: currentTime !== null,
      videoPrompt,
    },
  });
}

// 拦截通道号改变时
function* beforeChannelChange ({ payload }) {
  const { currentChannelName } = payload;


  let oneDay = yield select(state => state.getIn(['videoPlaybackReducers', 'oneDay']));

  const channelDataCurrent = [];
  let currentTime = null;
  if (!isEmpty(oneDay)) {
    oneDay = oneDay.toJS();
    for (let i = 0; i < oneDay.length; i += 1) {
      const x = oneDay[i];
      if ((currentTime === null || currentTime > x.startTime)
        && x.channelNum === currentChannelName) {
        currentTime = x.startTime;
      }
      if (x.channelNum === currentChannelName) {
        channelDataCurrent.push(x);
      }
    }
  }

  const videoPrompt = channelDataCurrent.length > 0 ? playPrompt : currentChannelNoVideoPrompt;

  yield put({
    type: CHANNEL_CHANGE_ACTION.type,
    payload: {
      currentChannelName,
      oneDayCurrent: channelDataCurrent,
      currentTime,
      hasVideo: currentTime !== null,
      videoPrompt,
    },
  });
}

function* step () {
  const btmplayFlag = yield select(state => state.getIn(['videoPlaybackReducers', 'btmplayFlag']));
  if (!btmplayFlag) {
    return;
  }
  const currentTime = yield select(state => state.getIn(['videoPlaybackReducers', 'currentTime']));
  const oneDayCurrent = yield select(state => state.getIn(['videoPlaybackReducers', 'oneDayCurrent']));
  const oldSegmentIndex = yield select(state => state.getIn(['videoPlaybackReducers', 'segmentIndex']));
  const progressEndTime = yield select(state => state.getIn(['videoPlaybackReducers', 'progressEndTime']));

  const now = new Date(currentTime.getTime());
  const nowInSecond = obj2Second(now);

  let segmentIndex;
  const oneDaySegment = oneDayCurrent.find((x, index) => {
    if (x.get('startTime') <= currentTime && x.get('endTime') >= currentTime) {
      segmentIndex = index;
      return true;
    }
    return false;
  });
  if (!oneDaySegment || oldSegmentIndex !== segmentIndex || nowInSecond >= progressEndTime
    || nowInSecond >= DAY_SECONDS - 1) {
    if (nowInSecond < progressEndTime
      && oldSegmentIndex > 0
      && nowInSecond < DAY_SECONDS - 1) {
      const nextSegmentIndex = oldSegmentIndex - 1;
      const nextSegment = oneDayCurrent.get(nextSegmentIndex);

      const resourceStartTime = nextSegment.get('startTime');
      yield put({
        type: CURRENT_TIME_ACTION.type,
        payload: {
          currentTime: resourceStartTime,
        },
      });
      yield* play({ payload: { jumpStatus: true } });
    } else {
      yield* stop({ payload: {} });
    }
    return;
  }

  now.setSeconds(now.getSeconds() + 1);
  yield put({
    type: CURRENT_TIME_ACTION.type,
    payload: {
      currentTime: now,
    },
  });
}

function* beforePlayChange ({ payload }) {
  yield put({
    type: PLAY_CHANGE_ACTION.type,
    payload: {
      btmplayFlag: payload.play,
    },
  });
}

function* timeTypeChange ({ payload }) {
  const { timeType } = payload;
  const currentTime = yield select(state => state.getIn(['videoPlaybackReducers', 'currentTime']));
  const oneDayCurrent = yield select(state => state.getIn(['videoPlaybackReducers', 'oneDayCurrent']));

  let currentTimeSecond;
  let startTime;
  let endTime;

  if (isEmpty(currentTime) && !isEmpty(oneDayCurrent)) {
    oneDayCurrent.forEach((val) => {
      const item = obj2Second(val.get('startTime'));
      if (currentTimeSecond === undefined || item < currentTimeSecond) {
        currentTimeSecond = item;
      }
    });
  } else if (!isEmpty(currentTime)) {
    currentTimeSecond = obj2Second(currentTime);
  } else {
    currentTimeSecond = 0;
  }

  if (timeType === '1') {
    if (currentTimeSecond < FIFTEEN_MINUJTES_SECONDS) {
      startTime = 0;
      endTime = 2 * FIFTEEN_MINUJTES_SECONDS;
    } else if (currentTimeSecond > DAY_SECONDS - FIFTEEN_MINUJTES_SECONDS) {
      startTime = DAY_SECONDS - (2 * FIFTEEN_MINUJTES_SECONDS);
      endTime = DAY_SECONDS;
    } else {
      startTime = currentTimeSecond - FIFTEEN_MINUJTES_SECONDS;
      endTime = currentTimeSecond + FIFTEEN_MINUJTES_SECONDS;
    }
  } else {
    startTime = 0;
    endTime = DAY_SECONDS;
  }
  yield put({
    type: TIME_TYPE_CHANGE_ACTION.type,
    payload: {
      timeType,
      progressStartTime: startTime,
      progressEndTime: endTime,
    },
  });
}

function* getOneDayCB ({ payload: body }) {
  // 如果是超时，或者说数据已经正确响应，新来的直接丢掉数据就可以了
  // if (oneDayMsgNum !== null && oneDayMsgNumSocket === null) {

  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  const { msgBody } = body.data;
  const { resourcesList } = msgBody;

  let { msgSn } = body.data;
  msgSn = parseInt(msgSn, 10);

  // 如果流水号不匹配，丢掉
  // if (msgSn !== oneDayMsgNum) {
  //   return;
  // }

  // if (this.data.timeoutId !== null) {
  //   clearTimeout(this.data.timeoutId);
  //   this.data.timeoutId = null;
  // }


  yield analyzeOneDay({
    payload: {
      resourcesList,
      msgSn,
    },
  });
  // }
}

function* get15DayCB ({ payload: body }) {
  if (!body || !body.monthData) {
    return;
  }
  // const { video15DayMsgNum1, video15DayMsgNum2 } = this.props;
  // const { msgSn } = body;
  // if (msgSn !== video15DayMsgNum1 && msgSn !== video15DayMsgNum2) {
  //   return;
  // }

  // 此处需要根据返回的月份识别是前一个月的还是本月的，组装到对应的 video15Day 上
  const now = new Date();
  const nowMonthStr = padZero(now.getMonth() + 1);
  const { monthData } = body;

  if (monthData.length > 0) {
    const monthStr = monthData[0].slice(0, 2);
    if (monthStr === nowMonthStr) {
      yield put({
        type: VIDEO_15_CHANGE_ACTION.type,
        payload: {
          video15Day1: List(monthData),
        },
      });
    } else {
      yield put({
        type: VIDEO_15_CHANGE_ACTION.type,
        payload: {
          video15Day2: List(monthData),
        },
      });
    }
  }
}

function* videoPlaybackSaga () {
  // yield takeLatest(SUBSCRIBE_ACTION.type, subscribe);
  yield takeLatest(INIT_ACTION.type, initRequest);
  yield takeLatest(INIT_TIME_ACTION.type, initTimeRequest);
  yield takeLatest(INIT_TRACK_ACTION.type, initTrackRequest);
  yield takeLatest(PLAY_ACTION.type, play);
  yield takeLatest(CLOSE_ACTION.type, stop);
  yield takeLatest(BEFORE_ONE_DAY_CHANGE_ACTION.type, analyzeOneDay);
  yield takeLatest(BEFORE_CHANNEL_CHANGE_ACTION.type, beforeChannelChange);
  yield takeLatest(BEFORE_STEP_ACTION.type, step);
  yield takeLatest(BEFORE_PLAY_CHANGE_ACTION.type, beforePlayChange);
  yield takeLatest(BEFORE_TIME_TYPE_CHANGE_ACTION.type, timeTypeChange);
  yield takeLatest(GET_ONE_DAY.type, getOneDayCB);
  yield takeLatest(GET_15_DAY.type, get15DayCB);
}

// 导出
export default {
  videoPlaybackReducers,
  videoPlaybackSaga,
};
