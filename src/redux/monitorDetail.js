import { Map } from 'immutable';
import { put, call, takeEvery } from './common';
import { getAssignmentDetail } from '../server/getData';

// action
const GET_MONITORDETAIL_ACTION = { type: 'monitorDetail/SAGA/GET_MONITORDETAIL_ACTION' };
const GET_DETAIL_SUCCESS = { type: 'monitorDetail/GET_DETAIL_SUCCESS' };
// reducer
const defaultState = Map({
  monitorDetail: [],
});

const monitorDetailReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    case GET_DETAIL_SUCCESS.type:
      newState = state.merge({
        monitorDetail: action.datas,
      });
      return newState;

    default:
      return state;
  }
};

// saga
function* getMonitorDetail({ params }) {
  // 监控对象详情
  const assignmentResult = yield call(getAssignmentDetail, params);
  if (!assignmentResult.success) { return; }

  if (assignmentResult.success) {
    const { obj } = assignmentResult;

    yield put({ type: GET_DETAIL_SUCCESS.type, datas: obj });
  }
}

function* monitorDetailSaga() {
  yield takeEvery(GET_MONITORDETAIL_ACTION.type, getMonitorDetail);
}

// 导出
export default {
  monitorDetailReducers,
  monitorDetailSaga,
};
