import { Map, List } from 'immutable';
import { put, call, takeEvery } from './common';
import {
  getAssignment, getAssignmentList, searchAssignment, getSearchVehicleList,
} from '../server/getData';

// action
// 分组
const GET_MONITORGROUP_ACTION = { type: 'monitorSearch/SAGA/GET_MONITORGROUP_ACTION' };
const GET_GROUP_SUCCESS = { type: 'monitorSearch/GET_GROUP_SUCCESS' };
const GET_GROUP_FAILED = { type: 'monitorSearch/GET_GROUP_FAILED' };
const GROUP_EMPTY_ACTION = { type: 'monitorSearch/GROUP_EMPTY_ACTION' };
// 监控对象统计
const GET_COUNTER_ACTION = { type: 'monitorSearch/SAGA/GET_COUNTER_ACTION' };
const GET_COUNTER_SUCCESS = { type: 'monitorSearch/GET_COUNTER_SUCCESS' };
const GET_COUNTER_FAILED = { type: 'monitorSearch/GET_COUNTER_FAILED' };
// 分组列表
const GET_MONITORLIST_ACTION = { type: 'monitorSearch/SAGA/GET_MONITORLIST_ACTION' };
const GET_LIST_SUCCESS = { type: 'monitorSearch/GET_LIST_SUCCESS' };
const GET_LIST_FAILED = { type: 'monitorSearch/GET_LIST_FAILED' };
// 搜索
const SEARCH_MONITOR_ACTION = { type: 'monitorSearch/SAGA/SEARCH_MONITOR_ACTION' };
const SEARCH_MONITORLIST_ACTION = { type: 'monitorSearch/SAGA/SEARCH_MONITORLIST_ACTION' };
const SEARCH_MONITORLIST_SUCCESS = { type: 'monitorSearch/SEARCH_MONITORLIST_SUCCESS' };
const SEARCH_MONITOR_SUCCESS = { type: 'monitorSearch/SEARCH_MONITOR_SUCCESS' };
const SEARCH_MONITOR_FAILED = { type: 'monitorSearch/SEARCH_MONITOR_FAILED' };
const SEARCH_EMPTY_ACTION = { type: 'monitorSearch/SEARCH_EMPTY_ACTION' };
const SEARCH_LOADING_ACTION = { type: 'monitorSearch/SEARCH_LOADING_ACTION' };

// 搜索历史值改变
const CHANGE_HISTORYVALUE_ACTION = { type: 'monitorSearch/CHANGE_HISTORYVALUE_ACTION' };

// 变更页面功能按钮是否可操作状态
const CHANGE_HANDLESTATUS_ACTION = { type: 'monitorSearch/CHANGE_HANDLESTATUS_ACTION' };

// reducer
const defaultState = Map({
  tabInx: 0,
  counter: {},
  monitorGroups: new List(),
  monitorList: new List(),
  monitorSearch: [],
  searchVehicleList: [],
  searchCount: 0,
  monitorCount: 0,
  recordCount: 0,
  searchStatus: null,
  monitorStatus: null,
  page: -1,
  key_: null,
  historyValue: null, // 搜索历史value值
  searchHistoryVisible: false, // 控制搜索历史显示隐藏
  handleStatus: true, // 页面功能按钮是否可操作
});

const monitorSearchReducers = (state = defaultState, action) => {
  let newState = null;

  switch (action.type) {
    // 统计
    case GET_COUNTER_SUCCESS.type:
      newState = state.merge({
        counter: action.datas,
        page: 0,
      });
      return newState;
    case GET_COUNTER_FAILED.type:
      newState = state.merge({
        counter: {
          total: 0,
          online: 0,
          offline: 0,
        },
        page: 0,
      });
      return newState;

    // 分组获取成功
    case GET_GROUP_SUCCESS.type:
      newState = state.merge({
        tabInx: action.datas.tabInx,
        monitorGroups: action.datas.obj,
        monitorList: action.datas.monitorList,
        monitorStatus: 'success',
      });
      return newState;

    // 分组获取失败
    case GET_GROUP_FAILED.type:
      newState = state.merge({
        monitorStatus: 'failed',
      });
      return newState;

    // 清空分组
    case GROUP_EMPTY_ACTION.type:
      newState = state.merge({
        monitorGroups: new List(),
        monitorList: new List(),
        monitorStatus: null,
      });
      return newState;

    // 分组列表
    case GET_LIST_SUCCESS.type:
      newState = state.merge({
        monitorList: action.datas,
        monitorStatus: 'success',
        key_: Math.random(),
      });
      return newState;

    // 分组列表获取失败
    case GET_LIST_FAILED.type:
      newState = state.merge({
        monitorStatus: 'failed',
      });
      return newState;

    // 搜索成功
    case SEARCH_MONITOR_SUCCESS.type:
      newState = state.merge({
        searchVehicleList: action.datas.vehicleInfos,
        monitorSearch: action.datas.newObj,
        searchCount: action.datas.count,
        monitorCount: action.datas.allCount,
        recordCount: action.datas.recordCount,
        monitorGroups: new List(),
        searchStatus: 'success',
      });
      return newState;
    case SEARCH_MONITORLIST_SUCCESS.type:
      newState = state.merge({
        searchVehicleList: action.datas,
      });
      return newState;

    // 搜索失败
    case SEARCH_MONITOR_FAILED.type:
      newState = state.merge({
        searchStatus: 'failed',
      });
      return newState;

    // 搜索页切换
    case SEARCH_LOADING_ACTION.type:
      newState = state.merge({
        page: 1,
      });

      return newState;

    // 清空搜索
    case SEARCH_EMPTY_ACTION.type:
      newState = state.merge({
        monitorSearch: [],
        searchCount: 0,
        monitorCount: 0,
        page: 0,
        searchStatus: null,
      });
      return newState;
    case CHANGE_HISTORYVALUE_ACTION.type:
      newState = state.merge(action.datas);
      return newState;
    // 变更页面功能按钮是否可操作状态
    case CHANGE_HANDLESTATUS_ACTION.type:
      newState = state.merge(action.datas);
      return newState;
    default:
      return state;
  }
};

// 监控对象统计
function* getMonitorCounter({ params }) {
  const assignmentResult = yield call(getAssignment, params);

  if (!assignmentResult) {
    yield put({ type: GET_COUNTER_FAILED.type });
    return;
  }

  if (assignmentResult.success) {
    const { obj } = assignmentResult;
    const data = {
      total: obj.total,
      online: obj.online,
      offline: obj.offline,
    };

    yield put({ type: GET_COUNTER_SUCCESS.type, datas: data });
  }
}

// 分组
function* getMonitorGroup({ params }) {
  const { type } = params;
  const assignmentResult = yield call(getAssignment, params);
  if (!assignmentResult) {
    yield put({ type: GET_GROUP_FAILED.type });
    return;
  }

  if (assignmentResult.success) {
    const { obj } = assignmentResult;

    let data = null;
    if (obj.assigns.length > 0) {
      const assignmentList = yield call(getAssignmentList, {
        assignmentId: obj.assigns[0].id,
        type,
        page: 1,
        pageSize: 10,
      });
      if (!assignmentList || !assignmentList.success) {
        yield put({ type: GET_GROUP_FAILED.type });
        return;
      }

      if (assignmentList.success) {
        const { monitorList } = assignmentList.obj;
        data = {
          obj,
          monitorList,
          tabInx: type,
        };
      }
    } else {
      data = {
        obj,
        monitorList: {},
        tabInx: type,
      };
    }

    yield put({ type: GET_GROUP_SUCCESS.type, datas: data });
  } else {
    yield put({ type: GET_GROUP_FAILED.type });
  }
}

// 分组列表
function* getMonitorList({ params }) {
  const assignmentList = yield call(getAssignmentList, params);
  if (!assignmentList) {
    yield put({ type: GET_LIST_FAILED.type });
    return;
  }

  if (assignmentList.success) {
    const { monitorList } = assignmentList.obj;
    yield put({ type: GET_LIST_SUCCESS.type, datas: monitorList });
  } else {
    yield put({ type: GET_LIST_FAILED.type });
  }
}

function* searchMonitorList({ params }) {
  const assignmentList = yield call(getSearchVehicleList, params);
  if (assignmentList.success) {
    const { vehicleInfos } = assignmentList.obj;
    yield put({ type: SEARCH_MONITORLIST_SUCCESS.type, datas: vehicleInfos });
  }
}

// 时间格式转换
// 模糊查询
function* searchMonitor({ params }) {
  const reg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{0,20}$/;// 输入框输入限制
  if (!reg.test(params.fuzzyParam)) {
    const data = {
      count: 0,
      allCount: 0,
      newObj: [],
    };
    yield put({ type: SEARCH_MONITOR_SUCCESS.type, datas: data });
    return;
  }
  const searchReasult = yield call(searchAssignment, params);
  if (!searchReasult || !searchReasult.success) {
    yield put({ type: SEARCH_MONITOR_FAILED.type });
    return;
  }

  if (searchReasult.success) {
    const { obj } = searchReasult;

    let data = null;
    const newObj = [];
    if (obj.assignInfos.length > 0) {
      const assignmentList = yield call(getSearchVehicleList, {
        vehicleIds: obj.assignInfos[0].vehicleIds,
      });

      if (!assignmentList || !assignmentList.success) {
        yield put({ type: SEARCH_MONITOR_FAILED.type });
        return;
      }

      if (assignmentList.success) {
        const { vehicleInfos } = assignmentList.obj;

        for (let j = 0; j < obj.assignInfos.length; j += 1) {
          const element = obj.assignInfos[j];
          const group = {
            id: element.id,
            assigns: element.name,
            vehicleIds: element.vehicleIds,
            slide: false,
            monitorCount: element.vehicleNum,
          };
          newObj.push(group);
        }

        data = {
          newObj,
          count: obj.assignInfos.length,
          allCount: obj.vehicleTotal,
          recordCount: obj.recordTotal,
          vehicleInfos,
        };
      }
    } else {
      data = {
        newObj,
        count: 0,
        allCount: 0,
      };
    }

    yield put({ type: SEARCH_MONITOR_SUCCESS.type, datas: data });
  } else {
    yield put({ type: SEARCH_MONITOR_FAILED.type });
  }
}

// saga
function* monitorSearchSaga() {
  yield takeEvery(GET_COUNTER_ACTION.type, getMonitorCounter); // 数量统计
  yield takeEvery(GET_MONITORGROUP_ACTION.type, getMonitorGroup); // 分组
  yield takeEvery(GET_MONITORLIST_ACTION.type, getMonitorList); // 分组列表
  yield takeEvery(SEARCH_MONITOR_ACTION.type, searchMonitor); // 查询
  yield takeEvery(SEARCH_MONITORLIST_ACTION.type, searchMonitorList); // 查询
}

// 导出
export default {
  monitorSearchReducers,
  monitorSearchSaga,
};
