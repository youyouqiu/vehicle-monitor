import Immutable, { List } from 'immutable';
import {
  put, call, all, takeEvery,
} from './common';
import {
  getMonitorIds,
  getBasicLocationInfo,
  getDetailLocationInfo,
  goSecurity,
  setDetailLocationInfo,
} from '../server/getData';
import { requestConfig } from '../utils/env';
import { bdEncrypt } from '../utils/bMapCoordinates';
import { convertSeconds } from '../utils/convertSeconds';
// import storage from '../utils/storage';
import { getUserStorage, getCurAccont } from '../server/getStorageData';

const httpBaseConfig = requestConfig();

// action
// 用于路由跳出触发事件
const HOME_ROUTER_EXIT = { type: 'HOME/ROUTER_EXIT' };
// 用于路由跳入触发事件
const HOME_ROUTER_ENTER = { type: 'HOME/ROUTER_ENTER' };
// 常用功能视图显示
const COM_USE_ACTION = { type: 'COM_USE_ACTION' };
// 监控对象详情视图显示
const OBJ_DET_ACTION = { type: 'OBJ_DET_ACTION' };
// 地图路况切换
const MAP_TRAFFIC_ENABLED = { type: 'MAP_TRAFFIC_ENABLED' };
// 地图类型切换
const MAP_BMAP_TYPE = { type: 'MAP_BMAP_TYPE' };
// 地图定位切换
const MAP_LOCATION = { type: 'MAP_LOCATION' };
// 获取当前用户下所有监控对象id和经纬度
const GET_MONITOR_IDS = { type: 'home/SAGA/GET_MONITOR_IDS' };
// 保存监控对象信息
const SAVE_MONITOR_INFO = { type: 'SAVE_MONITOR_INFO' };
// 保存地图监控对象信息
const SAVE_MONITOR_MAP_INFO = { type: 'SAVE_MONITOR_MAP_INFO' };
// 保存基础位置信息
const SAVE_BASIC_LOCATION_INFO = { type: 'SAVE_BASIC_LOCATION_INFO' };
// 保存监控对象详细位置信息
const SAVE_DETAIL_LOCATION_INFO = { type: 'SAVE_DETAIL_LOCATION_INFO' };
// 同时保存监控对象详细位置信息和详细信息
const SAVE_BASIC_DETAIL_LOCATION_INFO = { type: 'SAVE_BASIC_DETAIL_LOCATION_INFO' };
// 保存订阅的监控对象信息
const SAVE_SUB_MONITOR = { type: 'SAVE_SUB_MONITOR' };
// 更新监控对象地图标注信息
const UPDATE_MARKER_INFO = { type: 'UPDATE_MARKER_INFO' };
// 地图层级变大
const CHANGE_MAP_ZOOML_BIG = { type: 'CHANGE_MAP_ZOOML_BIG' };
// 地图层级变小
const CHANGE_MAP_ZOOML_SMALL = { type: 'CHANGE_MAP_ZOOML_SMALL' };
// 保存当前显示位置信息的监控对象id
const CURRENT_MONITOR_INFO_ID = { type: 'CURRENT_MONITOR_INFO_ID' };
// 更新基础位置信息和详细位置信息
const UPDATE_MONITOR_ADDRESS_INFO = { type: 'home/SAGA/UPDATE_MONITOR_ADDRESS_INFO' };
const UPDATE_MONITOR_INFO = { type: 'home/SAGA/UPDATE_MONITOR_INFO' };

// 页面离开后清空基础信息和详细信息位置
const HOME_DELDATA = { type: 'HOME/DELDATA' };
// 地图放大
const MAP_AMPLIFICATION = { type: 'HOME/MAP_AMPLIFICATION' };
// 地图缩小
const MAP_NARROW = { type: 'HOME/MAP_NARROW' };
// 清空markers数据
const HOME_CLEARMARKERSDATA = { type: 'HOME/CLEARMARKERSDATA' };
// 添加监控对象
const HOME_GET_MONITOR = { type: 'HOME/SAGA/HOME_GET_MONITOR' };
// 添加监控对象
const HOME_ADD_MONITOR = { type: 'HOME/HOME_ADD_MONITOR' };

const HOME_SECURITY = { type: 'HOME/SAGA/SECURITY' };

const GOSECURITY_RES = { type: 'HOME/GOSECURITY_RES' };

const HOME_REFRESH_MONITOR = { type: 'HOME/HOME_REFRESH_MONITOR' };

// 清空详情面板数据
const CLEAR_BASIC = { type: 'HOME/CLEAR_BASIC' };

// 清空extraMarkers,登录成功后调用,extraMarkers 是通过监控对象搜索新增的
const CLEAR_EXTRA_MARKERS = { type: 'HOME/CLEAR_EXTRA_MARKERS' };
const SAVE_VEHICLE_IDS = { type: 'HOME/SAVE_VEHICLE_IDS' };

// 底部功能视图恢复默认
const SET_COMMONLY_VIEW = { type: 'SET_COMMONLY_VIEW' };

// reducer
const defaultState = Immutable.Map({
  routerIndex: 0,
  // 常用功能视图显示
  commonlyUseViewShow: false,
  // 保存当前显示位置信息的监控对象id
  currentMonitorInfoId: null,
  // 监控对象详情视图显示
  objDetShow: false,
  // 地图路况切换
  mapTrafficEnabled: false,
  // 地图类型切换
  bMapType: 1,
  // 地图定位
  locationManager: null,
  // 监控对象信息存储
  markers: null,
  // 超过1000以外的监控对象
  extraMarkers: new List(),
  // 用户更新地图的监控对象信息存储
  monitorInfo: new Map(),
  basicLocationInfo: null,
  // 监控对象详细位置信息
  detailLocationInfo: {},
  // 监控对象详细信息的当前属性
  sensors: [],
  // 订阅监控对象数组
  subMonitorArr: [],
  // 地图层级大小改变标识
  mapZooml: {},
  // socket订阅标识时间戳
  socketTime: (new Date()).getTime(),
  // 地图放大
  mapAmplification: null,
  // 地图缩小
  mapNarrow: null,
  ifGoSecurity: false,
  randomNumber: 0,
  vehicleIds: null,
  searchMarkersStatus: false,
});

const homeReducers = (state = defaultState, action) => {
  let newState = null;
  const ifTrue = !state.get('commonlyUseViewShow');
  const ifobjDetShow = !state.get('objDetShow');
  let currentMarkers;
  let currentExtraMarkers;
  let activeMonitor;
  let markers;
  const num = (new Date()).getTime(); // Math.round(Math.random() * 100);
  switch (action.type) {
    case SET_COMMONLY_VIEW.type:
      newState = state.merge({
        commonlyUseViewShow: false,
      });
      return newState;
    case COM_USE_ACTION.type:
      // return state.set('commonlyUseViewShow', !state.get('commonlyUseViewShow'));
      if (ifTrue) {
        newState = state.merge({
          commonlyUseViewShow: !state.get('commonlyUseViewShow'),
          objDetShow: false, // 详细列表与导航互斥
        });
      } else {
        newState = state.merge({
          commonlyUseViewShow: !state.get('commonlyUseViewShow'),
        });
      }

      return newState;
    case OBJ_DET_ACTION.type:
      // return state.set('objDetShow', !state.get('objDetShow'));
      if (ifobjDetShow) {
        newState = state.merge({
          objDetShow: !state.get('objDetShow'),
          commonlyUseViewShow: false, // 详细列表与导航互斥
        });
      } else {
        newState = state.merge({
          objDetShow: !state.get('objDetShow'),
        });
      }
      return newState;
    case MAP_TRAFFIC_ENABLED.type:
      return state.set('mapTrafficEnabled', !state.get('mapTrafficEnabled'));
    case MAP_BMAP_TYPE.type:
      return state.set('bMapType', state.get('bMapType') === 1 ? 2 : 1);
    case MAP_LOCATION.type:
      return state.set('locationManager', !state.get('locationManager'));
    case SAVE_MONITOR_INFO.type:
      // let m = state.get('extraMarkers').concat(action.markers);
      let m = action.markers;
      const O = {};
      m = m.filter((item) => {
        const newItem = item + JSON.stringify(item);
        return O.hasOwnProperty(newItem) ? false : O[newItem] = true;
      });
      m = List(m);
      return state.set('markers', m);
    case HOME_REFRESH_MONITOR.type:
      let a = state.get('extraMarkers').concat(state.get('markers'));
      const obj = {};
      a = a.filter((item) => {
        const newItem = item + JSON.stringify(item);
        return obj.hasOwnProperty(newItem) ? false : obj[newItem] = true;
      });
      a = List(a);
      return state.set('markers', a);
    case SAVE_MONITOR_MAP_INFO.type:
      return state.set('monitorInfo', action.markers);
    case UPDATE_MARKER_INFO.type:
      return state.set('monitorInfo', action.value);
    case SAVE_BASIC_LOCATION_INFO.type:
      return state.set('basicLocationInfo', action.basicInfo);
    case SAVE_DETAIL_LOCATION_INFO.type:
      return state.set('detailLocationInfo', action.detailInfo);
    case SAVE_BASIC_DETAIL_LOCATION_INFO.type:
      newState = state.merge({
        basicLocationInfo: action.basicInfo,
        detailLocationInfo: action.detailInfo,
      });
      return newState;
    case SAVE_SUB_MONITOR.type:
      return state.set('subMonitorArr', action.subParam);
    case CHANGE_MAP_ZOOML_BIG.type:
      return state.set('mapZooml', {
        type: 'BIG',
        index: state.get('mapZooml').index + 1,
      });
    case CHANGE_MAP_ZOOML_SMALL.type:
      return state.set('mapZooml', {
        type: 'SMALL',
        index: state.get('mapZooml').index + 1,
      });
    case CURRENT_MONITOR_INFO_ID.type:
      return state.set('currentMonitorInfoId', action.monitorId);
    case HOME_ROUTER_EXIT.type:
      return state.set('routerIndex', state.get('routerIndex') + 1);
    case HOME_ROUTER_ENTER.type:
      return state.set('routerIndex', state.get('routerIndex') - 1);
    // 页面离开后清空基础信息和详细信息位置和底部滑动车辆组件数据
    case HOME_DELDATA.type:
      newState = state.merge({
        basicLocationInfo: [],
        detailLocationInfo: {},
        monitorInfo: new Map(),
        subMonitorArr: [],
      });

      return newState;
    case CLEAR_BASIC.type:
      newState = state.merge({
        basicLocationInfo: [],
        detailLocationInfo: {},
      });
      return newState;

    // 清空markers数据
    case HOME_CLEARMARKERSDATA.type:
      markers = state.get('markers');
      if (markers === null) {
        newState = state.merge({
          markers: null,
          extraMarkers: new List(),
        });
      } else {
        newState = state.merge({
          markers: null,
        });
      }
      return newState;
    case CLEAR_EXTRA_MARKERS.type:
      newState = state.merge({
        markers: null,
      });
      return newState;
    // 地图放大
    case MAP_AMPLIFICATION.type:
      return state.set('mapAmplification', action.mapAmplification);
    // 地图缩小
    case MAP_NARROW.type:
      return state.set('mapNarrow', action.mapNarrow);
    case HOME_ADD_MONITOR.type:
      currentMarkers = state.get('markers');
      currentExtraMarkers = state.get('extraMarkers');

      ({ activeMonitor } = action);
      newState = state;

      if (
        (!!activeMonitor)
        && (currentMarkers.findIndex((item => item.markerId === activeMonitor.markerId)) === -1
          || currentMarkers)
        && currentExtraMarkers.findIndex((item => item.markerId === activeMonitor.markerId)) === -1
      ) {
        newState = state.set('extraMarkers', currentExtraMarkers.push(activeMonitor));
      }
      if (action.callback) {
        action.callback();
      }
      return newState;
    case GOSECURITY_RES.type:
      newState = state.merge({
        ifGoSecurity: action.ifGoSecurity,
        randomNumber: num,
      });
      return newState;
    case SAVE_VEHICLE_IDS.type:
      newState = state.merge({
        vehicleIds: action.ids,
        searchMarkersStatus: true,
      });
      return newState;
    default:
      return state;
  }
};

/**
 * 对获取的监控对象数据进行组装
 * @param {*} data
 * @param {*} collectMonitor:用户已关注的监控对象需放到最前面
 */
function makeMonitorIdsInfo (data) {
  const resultList = [];
  if (data.statusCode === 200) {
    const values = data.obj.monitorList;
    if (typeof values === 'object') {
      for (let i = 0; i < values.length; i += 1) {
        const info = values[i];
        // 组装图片地址  车、人和物
        let objIcon = info.ico;
        if (objIcon === '123.png' || objIcon === 'thing.png') { // 人和物
          objIcon = `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}/clbs/resources/img/${info.ico}`;
        } else { // 车
          objIcon = `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}/clbs/resources/img/vico/${info.ico}`;
        }
        if (info.id !== undefined) {
          const coordinates = bdEncrypt(info.longitude, info.latitude);
          const s = info.direction ? Math.floor(Number(info.direction) / 360) : 0;
          const angle = info.direction ? Number(info.direction) - 360 * s + 270 : 0;
          const time = info.gpsTime ? convertSeconds(info.gpsTime) : 0;
          const value = {
            markerId: info.id,
            latitude: Number.isNaN(coordinates.bdLat) ? 1000 : coordinates.bdLat,
            longitude: Number.isNaN(coordinates.bdLng) ? 1000 : coordinates.bdLng,
            title: info.name,
            ico: objIcon,
            speed: 10,
            status: info.status,
            angle,
            time,
            monitorType: info.monitorType, // 0 车 1 人 2 物
          };
          resultList.push(value);
        }
      }
    }
  }
  return List(resultList);
}

// 监控对象基础位置信息整理
function makebasicLocationInfo (data) {
  if (data.statusCode === 200) {
    const values = data.obj;
    return values;
  }
  return {};
}

// 监控对象详细位置信息
function makeDetailLocationInfo (data) {
  if (data.statusCode === 200) {
    return data.obj;
  }
  return {};
}

// saga
// 获取当前用户下所有监控对象id及经纬度
function* monitorRequest (param) {
  yield put({ type: HOME_DELDATA.type }); // 这里先清空数据
  yield put({ type: HOME_CLEARMARKERSDATA.type });
  // 直接将monitorid放进去
  const curAccont = yield call(getCurAccont);
  let userStorage = yield call(getUserStorage);
  userStorage = userStorage || {};
  let collectMonitor = userStorage[curAccont] ? userStorage[curAccont].collect : [];
  if (param.vehicleIds && param.activeMonitor) {
    if (param.vehicleIds.indexOf(param.activeMonitor.markerId) === -1) {
      collectMonitor = [param.activeMonitor.markerId].concat(collectMonitor);
    }
  }
  const result = yield call(getMonitorIds, { favoritesIds: collectMonitor ? collectMonitor.join(',') : '' });
  if (result === false) return;
  const resultMap = makeMonitorIdsInfo(result);
  yield put({ type: SAVE_MONITOR_INFO.type, markers: resultMap });
  yield put({ type: SAVE_MONITOR_MAP_INFO.type, markers: resultMap });
  if (resultMap.size > 0) {
    if (!param.searchMarkersStatus) {
      const ids = [...resultMap.values()].map(item => item.markerId);
      yield put({ type: SAVE_VEHICLE_IDS.type, ids });
    }
    // activeMonitor从其他页面跳转过来
    const firstMonitorId = param.activeMonitor ? param.activeMonitor.markerId
      : [...resultMap.values()][0].markerId;

    // 保存当前显示位置信息的监控对象id
    yield put({ type: CURRENT_MONITOR_INFO_ID.type, monitorId: firstMonitorId });
    // 获取监控对象基础位置信息
    // const basicResult = yield call(getBasicLocationInfo,
    //   { monitorId: firstMonitorId });
    const basicResult = yield call(getBasicLocationInfo,
      { id: firstMonitorId });
    if (basicResult === false) return;
    const basicInfo = makebasicLocationInfo(basicResult);
    yield put({ type: SAVE_BASIC_LOCATION_INFO.type, basicInfo });
    // 获取监控对象详细位子信息
    const detailResult = yield call(getDetailLocationInfo,
      { monitorId: firstMonitorId });
    if (detailResult === false) return;
    const detailInfo = makeDetailLocationInfo(detailResult);
    yield put({ type: SAVE_DETAIL_LOCATION_INFO.type, detailInfo });
  } else {
    yield put({ type: SAVE_MONITOR_INFO.type, markers: List([]) });
  }
  if (param.fn) {
    param.fn();
  }
}

function* updateMonitorInfo (data) {
  // 清空底部栏数据
  // yield put({ type: SAVE_BASIC_LOCATION_INFO.type, basicInfo: null });
  // yield put({ type: SAVE_DETAIL_LOCATION_INFO.type, detailInfo: {} });
  // 获取监控对象基础位置信息,详细位置信息
  const [basicResult, detailResult] = yield all([
    call(getBasicLocationInfo, { id: data.monitorId }),
    call(getDetailLocationInfo, { monitorId: data.monitorId }),
  ]);
  const basicInfo = makebasicLocationInfo(basicResult);
  yield put({ type: SAVE_BASIC_LOCATION_INFO.type, basicInfo });

  const detailInfo = makeDetailLocationInfo(detailResult);
  yield put({ type: SAVE_DETAIL_LOCATION_INFO.type, detailInfo });
}

// 通过socket推送的位置信息更新监控对象数据
function* updateInfo (data) {
  const { basicInfo, msg } = data.data;
  yield put({ type: SAVE_BASIC_LOCATION_INFO.type, basicInfo });
  // 获取监控对象详细位子信息
  const detailResult = yield call(setDetailLocationInfo, { locationInfo: msg.body });
  const detailInfo = makeDetailLocationInfo(detailResult);
  yield put({ type: SAVE_DETAIL_LOCATION_INFO.type, detailInfo });
}

function* getSingleMonitor ({ id, callback }) {
  const result = yield call(getMonitorIds, { id });
  if (result === false || result.statusCode !== 200 || result.obj.monitorList.length !== 1) return;
  const activeMonitorList = makeMonitorIdsInfo(result);
  yield put({ type: HOME_ADD_MONITOR.type, activeMonitor: activeMonitorList.get(0), callback });
  yield put({ type: HOME_REFRESH_MONITOR.type });
}

function* ifGoSecurity () {
  const result = yield call(goSecurity);
  if (result.statusCode === 200) {
    const { obj: { adasMonitorFlag } } = result;
    yield put({ type: GOSECURITY_RES.type, ifGoSecurity: adasMonitorFlag });
  }
}

function* homeSaga () {
  // 获取权限下监控对象
  yield takeEvery(GET_MONITOR_IDS.type, monitorRequest);
  // 更新基础位置信息和详细位置信息
  yield takeEvery(UPDATE_MONITOR_ADDRESS_INFO.type, updateMonitorInfo);
  // 通过socket推送的位置信息更新监控对象数据
  yield takeEvery(UPDATE_MONITOR_INFO.type, updateInfo);

  yield takeEvery(HOME_GET_MONITOR.type, getSingleMonitor);

  yield takeEvery(HOME_SECURITY.type, ifGoSecurity);
}

export default {
  homeReducers,
  homeSaga,
};
