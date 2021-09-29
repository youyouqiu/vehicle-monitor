import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import { postFeedBack } from '../server/getData';

// action
const SEND_FEEDBACK_ACTION = { type: 'feedBack/SAGA/SEND_FEEDBACK_ACTION' };
const SEND_FEEDBACK_SUCCESS = { type: 'feedBack/SEND_FEEDBACK_SUCCESS' };
const SEND_FEEDBACK_FAILED = { type: 'feedBack/SEND_FEEDBACK_FAILED' };
const RESET_DATA = { type: 'feedBack/RESET_DATA' };

// reducer
const defaultState = Map({
  result: false,
  key_: null,
  errReason: '',
});

const feedBackReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    case SEND_FEEDBACK_SUCCESS.type:
      newState = state.merge({
        result: true,
        errReason: '',
        key_: Math.random(),
      });
      return newState;
    case SEND_FEEDBACK_FAILED.type:
      newState = state.merge({
        result: false,
        errReason: action.datas,
        key_: Math.random(),
      });
      return newState;
    case RESET_DATA.type:
      newState = state.merge({
        result: false,
        errReason: '',
      });
      return newState;
    default:
      return state;
  }
};

// saga
function* sendFeedBack ({ params }) {
  // 发送意见反馈
  const result = yield call(postFeedBack, params);
  if (!result) { return; }

  if (result.success) {
    yield put({ type: SEND_FEEDBACK_SUCCESS.type });
  } else {
    let errReason = 'REQUEST_ERR';// 数据加载失败
    if (result.name === 'request_timeout') { // 加载超时
      errReason = 'REQUEST_TIMEOUT';
    }
    yield put({ type: SEND_FEEDBACK_FAILED.type, datas: errReason });
  }
}

function* feedBackSaga () {
  yield takeEvery(SEND_FEEDBACK_ACTION.type, sendFeedBack);
}

// 导出
export default {
  feedBackReducers,
  feedBackSaga,
};
