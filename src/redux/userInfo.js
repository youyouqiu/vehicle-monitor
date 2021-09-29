import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import { getUserInfo } from '../server/getData';

// action
const GET_USERINFO_ACTION = { type: 'personalCenter/SAGA/GET_USERINFO_ACTION' };
const GET_SUCCESS_ACTION = { type: 'personalCenter/GET_SUCCESS_ACTION' };
const GET_FAILED_ACTION = { type: 'personalCenter/GET_FAILED_ACTION' };

// reducer
const defaultState = Map({
  userInfo: [],
  errReason: '',
});

const userInfoReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    case GET_SUCCESS_ACTION.type:
      newState = state.merge({
        userInfo: action.datas,
      });
      return newState;

    case GET_FAILED_ACTION.type:
      newState = state.merge({
        errReason: action.datas,
      });
      return newState;
    default:
      return state;
  }
};

// saga
function* getUserMsg() {
  // 获取用户信息
  const result = yield call(getUserInfo, {});

  if (!result) { return; }

  if (result.success) {
    yield put({ type: GET_SUCCESS_ACTION.type, datas: result.obj });
  } else {
    let errReason = 'REQUEST_ERR';
    if (result.name === 'request_timeout') { // 加载超时
      errReason = 'REQUEST_TIMEOUT';
    }
    yield put({ type: GET_FAILED_ACTION.type, datas: errReason });
  }
}

function* userInfoSaga() {
  yield takeEvery(GET_USERINFO_ACTION.type, getUserMsg);
}

// 导出
export default {
  userInfoReducers,
  userInfoSaga,
};
