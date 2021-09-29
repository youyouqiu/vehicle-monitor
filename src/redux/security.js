import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import {
  getRiskList, getDealInfos, getMediaInfo, getRiskEvent,
  // getDealRisk,
} from '../server/getData';

// action
const GET_RISK_ACTION = { type: 'security/SAGA/GET_RISK_ACTION' };
const GET_RISK_SUCCESS = { type: 'security/GET_RISK_SUCCESS' };
const GET_RISK_FAILED = { type: 'security/GET_RISK_FAILED' };

const GET_DEAL_ACTION = { type: 'security/SAGA/GET_DEAL_ACTION' };
const GET_DEAL_SUCCESS = { type: 'security/GET_DEAL_SUCCESS' };
const GET_DEAL_FAILED = { type: 'security/GET_DEAL_FAILED' };

const GET_EVENT_ACTION = { type: 'security/SAGA/GET_EVENT_ACTION' };
const GET_EVENT_SUCCESS = { type: 'security/GET_EVENT_SUCCESS' };
const GET_EVENT_FAILED = { type: 'security/GET_EVENT_FAILED' };

// const DEAL_RISK_ACTION = { type: 'security/DEAL_RISK_ACTION' };
// const DEAL_RISK_SUCCESS = { type: 'security/DEAL_RISK_SUCCESS' };
// const DEAL_RISK_FAILED = { type: 'security/DEAL_RISK_FAILED' };

const GET_MEDIA_ACTION = { type: 'security/SAGA/GET_MEDIA_ACTION' };
const GET_MEDIA_SUCCESS = { type: 'security/GET_MEDIA_SUCCESS' };
const GET_MEDIA_FAILED = { type: 'security/GET_MEDIA_FAILED' };

// reducer
const defaultState = Map({
  riskLists: [],
  riskIds: [],
  riskStatus: 'failed',
  dealInfo: [],
  dealInfoStatus: 'failed',
  eventLists: [],
  eventStatus: 'failed',
  dealStatus: 'failed',
  mediaInfo: [],
  mediaStatus: 'failed',
  key_: -1,
});

const securityReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    // 风险列表
    case GET_RISK_SUCCESS.type:
      newState = state.merge({
        eventLists: action.datas.eventLists,
        riskLists: action.datas.riskLists,
        riskIds: action.datas.riskIds,
        riskStatus: 'success',
        eventStatus: 'empty',
        dealInfoStatus: 'empty',
        key_: (action.datas && action.datas.riskLists && action.datas.riskLists.length === 0)
          ? Math.random() : -1,
      });
      return newState;
    case GET_RISK_FAILED.type:
      newState = state.merge({
        riskStatus: 'failed',
        eventStatus: 'empty',
        dealInfoStatus: 'empty',
        key_: (action.datas && action.datas.riskLists && action.datas.riskLists.length === 0)
          ? Math.random() : -1,
      });
      return newState;
    // 风险统计
    case GET_DEAL_SUCCESS.type:
      newState = state.merge({
        dealInfo: action.datas,
        dealInfoStatus: 'success',
        riskStatus: 'empty',
        eventStatus: 'empty',
      });
      return newState;
    case GET_DEAL_FAILED.type:
      newState = state.merge({
        dealInfoStatus: 'failed',
        riskStatus: 'empty',
        eventStatus: 'empty',
      });
      return newState;
    // 风险事件
    case GET_EVENT_SUCCESS.type:
      newState = state.merge({
        eventLists: action.datas,
        eventStatus: 'success',
        riskStatus: 'empty',
        dealInfoStatus: 'empty',
        key_: (action.datas && action.datas.length === 0) ? Math.random() : -1,
      });
      return newState;
    case GET_EVENT_FAILED.type:
      newState = state.merge({
        eventStatus: 'failed',
        riskStatus: 'empty',
        dealInfoStatus: 'empty',
        key_: (action.datas && action.datas.length === 0) ? Math.random() : -1,
      });
      return newState;
    // 处理风险事件
    // case DEAL_RISK_SUCCESS.type:
    //   newState = state.merge({
    //     dealStatus: 'success',
    //   });
    //   return newState;
    // case DEAL_RISK_FAILED.type:
    //   newState = state.merge({
    //     dealStatus: 'failed',
    //   });
    //   return newState;
    // 多媒体列表数据
    case GET_MEDIA_SUCCESS.type:
      newState = state.merge({
        mediaInfo: action.datas,
        mediaStatus: 'success',
      });
      return newState;
    case GET_MEDIA_FAILED.type:
      newState = state.merge({
        mediaStatus: 'failed',
      });
      return newState;

    default:
      return state;
  }
};

// 报警列表详情信息
function* getRiskLists({ params }) {
  const result = yield call(getRiskList, params);
  if (!result) {
    yield put({ type: GET_RISK_FAILED.type });
    return;
  }

  if (result.success) {
    // 获取第一个事件列表
    let data2 = [];
    if (result.obj && result.obj.length > 0 && params.pageNum === 1) {
      const result2 = yield call(getRiskEvent, { riskId: result.obj[0].id });
      if (result2.success) {
        data2 = (result2.obj && result2.obj.length > 0) ? result2.obj : [];
      }
    }

    // 获取已经存在的风险id
    const riskIds = [];
    if (result.obj && result.obj.length > 0) {
      for (let i = 0, len = result.obj.length; i < len; i += 1) {
        const item = result.obj[i];
        riskIds.push(item.id);
      }
    }

    const data = {
      riskLists: (result.obj && result.obj.length > 0) ? result.obj : [],
      eventLists: data2,
      riskIds,
    };
    yield put({ type: GET_RISK_SUCCESS.type, datas: data });
  } else {
    yield put({ type: GET_RISK_FAILED.type });
  }
}

// 今日报警处置情况
function* getDealInfo() {
  const result = yield call(getDealInfos, {});

  if (!result) {
    yield put({ type: GET_DEAL_FAILED.type });
    return;
  }

  if (result.success) {
    const data = result.obj ? result.obj : [];
    yield put({ type: GET_DEAL_SUCCESS.type, datas: data });
  } else {
    yield put({ type: GET_DEAL_FAILED.type });
  }
}

// 获取报警事件列表
function* getEventLists({ params }) {
  const result = yield call(getRiskEvent, params);

  if (!result) {
    yield put({ type: GET_EVENT_FAILED.type });
    return;
  }

  if (result.success) {
    const data = (result.obj && result.obj.length > 0) ? result.obj : [];
    yield put({ type: GET_EVENT_SUCCESS.type, datas: data });
  } else {
    yield put({ type: GET_EVENT_FAILED.type });
  }
}

// 获取多媒体数据列表
function* getMediaList({ params }) {
  const result = yield call(getMediaInfo, params);

  if (!result) {
    yield put({ type: GET_MEDIA_FAILED.type });
    return;
  }

  if (result.success) {
    const data = (result.obj && result.obj.length > 0) ? result.obj : [];
    yield put({ type: GET_MEDIA_SUCCESS.type, datas: data });
  } else {
    yield put({ type: GET_MEDIA_FAILED.type });
  }
}

function* securitySaga() {
  yield takeEvery(GET_RISK_ACTION.type, getRiskLists);
  yield takeEvery(GET_DEAL_ACTION.type, getDealInfo);
  yield takeEvery(GET_EVENT_ACTION.type, getEventLists);
  // yield takeEvery(DEAL_RISK_ACTION.type, getDealRisks);
  yield takeEvery(GET_MEDIA_ACTION.type, getMediaList);
}

// 导出
export default {
  securityReducers,
  securitySaga,
};
