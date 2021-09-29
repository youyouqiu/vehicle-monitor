import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import { postChangePassword } from '../server/getData';

// action
const CHANGE_PWD_ACTION = { type: 'changePassword/SAGA/CHANGE_PWD_ACTION' };
const CHANGE_PWD_SUCCESS = { type: 'changePassword/CHANGE_PWD_SUCCESS' };
const CHANGE_PWD_FAILED = { type: 'changePassword/CHANGE_PWD_FAILED' };

// reducer
const defaultState = Map({
  result: false,
  errReason: '',
  key_: null,
});

const changePasswordReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    case CHANGE_PWD_SUCCESS.type:
      newState = state.merge({
        result: true,
        errReason: '',
        key_: Math.random(),
      });
      return newState;

    case CHANGE_PWD_FAILED.type:
      newState = state.merge({
        result: false,
        errReason: action.datas,
        key_: Math.random(),
      });
      return newState;

    default:
      return state;
  }
};

// saga
function* changePassword({ params }) {
  // 修改密码
  const result = yield call(postChangePassword, params);

  if (!result) { return; }

  let errReason = '';
  if (result.success) {
    yield put({ type: CHANGE_PWD_SUCCESS.type });
  } else {
    const { exceptionDetailMsg } = result;
    errReason = exceptionDetailMsg;
    if (result.name === 'request_timeout') { // 加载超时
      errReason = 'REQUEST_TIMEOUT';
    }
    yield put({ type: CHANGE_PWD_FAILED.type, datas: errReason });
  }
}

function* changePasswordSaga() {
  yield takeEvery(CHANGE_PWD_ACTION.type, changePassword);
}

// 导出
export default {
  changePasswordReducers,
  changePasswordSaga,
};
