import { Map } from 'immutable';
import {
  put, call, all, takeEvery,
} from 'redux-saga/effects';
import {
  getLoginState,
  getMaxLoginVersion,
} from '../server/getStorageData';
import storage from '../utils/storage';
import { requestConfig } from '../utils/env';

// const getLoginState = async () => {
//   let loginState = null;
//   try {
//     loginState = await storage.load({
//       key: 'loginState',
//     });
//     const { expireAt } = loginState;
//     const now = new Date();

//     if (expireAt < now) {
//       await storage.remove({
//         key: 'loginState',
//       });
//       loginState = false;
//     }
//   } catch (e) {
//     loginState = false;
//   }

//   return loginState;
// };

// action
const INIT_ACTION = { type: 'root/SAGA/INIT_ACTION' };
const LOGINED_ACTION = { type: 'root/LOGINED_SUCCESS' };
const LOGOUTED_ACTION = { type: 'root/LOGOUTED_ACTION' };
const ONENTER_ACTION = { type: 'root/ONENTER_ACTION' };
// reducer
const defaultState = Map({
  isLoaded: false,
  hasToken: false,
  showWelcome: false,
});

const rootReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    case LOGINED_ACTION.type:
      newState = state.merge({
        isLoaded: true,
        hasToken: true,
        showWelcome: action.payload.showWelcome,
      });
      return newState;
    case LOGOUTED_ACTION.type:
      newState = state.merge({
        isLoaded: true,
        hasToken: false,
        showWelcome: action.payload.showWelcome,
      });
      return newState;
    case ONENTER_ACTION.type:
      newState = state.merge({
        showWelcome: false,
      });
      return newState;
    default:
      return state;
  }
};


// saga

function* initRequest () {
  let loginState = null;
  let maxLoginVersion = null;
  ([loginState, maxLoginVersion] = yield all([call(getLoginState), call(getMaxLoginVersion)]));

  if (loginState !== null) {
    const { expireAt } = loginState;
    const now = new Date();

    if (expireAt < now) {
      yield storage.remove({
        key: 'loginState',
      });
      loginState = false;
    }
  } else {
    loginState = false;
  }

  const { version } = requestConfig();
  let showWelcome = false;

  if (maxLoginVersion === null || maxLoginVersion < version) {
    showWelcome = true;
    storage.save({
      key: 'maxLoginVersion',
      data: version,
    });
  }

  if (loginState === false) {
    yield put({ type: LOGOUTED_ACTION.type, payload: { showWelcome } });
  } else {
    yield put({ type: LOGINED_ACTION.type, payload: { showWelcome } });
  }
}

function* rootSaga () {
  yield takeEvery(INIT_ACTION.type, initRequest);
}

// 导出
export default {
  rootReducers,
  rootSaga,
};
