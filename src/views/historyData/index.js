import React, { Component } from 'react';
import { is } from 'immutable';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  NativeModules,
  AppState,
  TouchableOpacity,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as timeFormat from 'd3-time-format';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';
import Loading from '../../common/loading';
import TopText from './topText';
import StopPanel from './stopPanel';
import Bottom from './bottom';
import Map from './map';
import { toFixed, isEmpty } from '../../utils/function';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import amplificationImage from '../../static/image/amplification.png';
import narrowImage from '../../static/image/narrow.png';
import mapTypeImage from '../../static/image/mapType.png';
import mapTypeFocusImage from '../../static/image/mapType-focus.png';
import { toastShow } from '../../utils/toastUtils';
import { getLoginAccont } from '../../server/getStorageData';
import storage from '../../utils/storage';
// import { getspeedValues } from '../../server/getStorageData';

const winHeight = Dimensions.get('window').height; // 获取屏幕宽度

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    position: 'absolute',
    top: 0,
    height: 25,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  stopPanel: {
    position: 'absolute',
    bottom: 0,
    height: 200,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  map: {
    flex: 1,
    // height: 200,
  },
  mapIcon: {
    position: 'absolute',
    right: 10,
    width: 40,
    height: 40,
    zIndex: 99,
  },
  mapIconImage: {
    width: '100%',
    height: '100%',
  },
  toolBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});
const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
const speedBase = 500; // 速度的基准，毫秒
const speedList = [0.5, 1, 2, 4];

class HistoryData extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('historyData'),
  )

  data = {
    intervalId: null,
    appState: AppState.currentState,
  }

  static propTypes = {
    startTime: PropTypes.object,
    endTime: PropTypes.object,
    monitors: PropTypes.array.isRequired,
    // activeMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    isSuccess: PropTypes.bool.isRequired,
    attachList: PropTypes.array,
    historyLocation: PropTypes.object,
    mileageData: PropTypes.object,
    extraState: PropTypes.object,
    stopData: PropTypes.object,
    onInit: PropTypes.func.isRequired,
    route: PropTypes.func.isRequired,
  }

  static defaultProps = {
    // activeMonitor: null,
    attachList: null,
    historyLocation: null,
    mileageData: null,
    extraState: null,
    stopData: null,
    startTime: null,
    endTime: null,
  }


  constructor(props) {
    super(props);
    const {
      monitors, onInit, route: { params: { startTime: startTimeInProp, endTime: endTimeInProp } },
    } = this.props;
    const { route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const startTime = isEmpty(startTimeInProp)
      ? new Date(new Date().setHours(0, 0, 0, 0))
      : startTimeInProp;
    const endTime = isEmpty(endTimeInProp) ? new Date() : endTimeInProp;
    const firstMonitor = monitors ? monitors.get(0) : [];
    let currentMonitor = null;
    if (activeMonitor === null) {
      currentMonitor = firstMonitor;
    } else {
      const monitor = monitors.find(x => x.markerId === activeMonitor.markerId);

      if (monitor === undefined) {
        currentMonitor = firstMonitor;
      } else {
        currentMonitor = monitor;
      }
    }
    if (!isEmpty(currentMonitor)) {
      onInit({
        monitorId: currentMonitor.markerId,
        startTime: timeFormator(startTime),
        endTime: timeFormator(endTime),
      });
    }
    this.state.currentMonitor = currentMonitor;
    this.state.startTime = startTime;
    this.state.endTime = endTime;
    this.state.startTimeStr = timeFormator(startTime);
    this.state.endTimeStr = timeFormator(endTime);
  }

  state = {
    playIndex: 0,
    sliderCompleteIndex: 1, // 跳点拖动时的播放进度
    playStatus: 'paused',
    showBottom: true,
    showArrow: true,
    currentMonitor: null,
    startTime: null,
    startTimeStr: null,
    endTime: null,
    endTimeStr: null,
    locationInfo: null,
    startMileage: 0,
    endMileage: 0,
    size: 0,
    currentSpeed: 1,
    changeEventSource: null,
    mapHeight: 0,
    stopAddress: null, // 停止时的详细地址
    stopLngLat: null, // 停止时的经纬度，百度地图的
    mapAmplification: null,
    mapNarrow: null,
    stopPoints: null, // 停止段开始点数组
    stopIndex: -1, // 当前选中查看的停止点索引,如果为-1，则代表没选中任何停止点
    stopLocation: null, // 当前停止点位置文本
    bMapType: 1,
    isShowSwiper: false,
    isShowClock: false,
    isShowChart: false,
    loadingStatus: Platform.OS === 'android',
    trajectoryType: true,
    trajectoryValue: 2,
    playIndexType: true, // 是否跳点
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const {
      initStatus, isSuccess, historyLocation, mileageData, extraState, stopData,
    } = nextProps;
    let { stopLngLat } = this.state;
    if (initStatus === 'end' && isSuccess === false) {
      if (!isEmpty(extraState)) {
        this.setState(extraState.toJS());
      }
      return;
    }
    if (initStatus === 'ing') {
      if (isEmpty(extraState)) {
        this.setState({
          playStatus: 'paused',

        });
      } else {
        this.setState({
          playStatus: 'paused',
        });
      }
      return;
    }
    let {
      size, locationInfo, endMileage, startMileage,
    } = this.state;
    if (historyLocation) {
      locationInfo = historyLocation.get(0);
      stopLngLat = this.getStopAddress(0, historyLocation);
    }
    if (!isEmpty(mileageData)) {
      ({ size } = mileageData);
      endMileage = mileageData.get(size - 1).get('total') - mileageData.get(0).get('total');
      endMileage = toFixed(endMileage, 2, true);
      startMileage = 0;
    } else {
      startMileage = '--';
      endMileage = '--';
      size = 0;
    }
    const newState = {
      locationInfo,
      size,
      startMileage,
      endMileage,
      playIndex: 0,
      stopLngLat,
      stopPoints: this.getPointsFromStopData(stopData, historyLocation),
    };
    if (extraState) {
      const jsExtraState = extraState.toJS();
      const keys = Object.keys(jsExtraState);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        newState[key] = jsExtraState[key];
      }
    }
    this.setState(newState);
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentDidMount () {
    if (Platform.OS === 'android') {
      this.didFocus = this.props.navigation.addListener('focus', this.didFocusNavigation.bind(this));
      this.didBlur = this.props.navigation.addListener('blur', this.didBlurNavigation.bind(this));
    } else {
      this.didFocus = this.props.navigation.addListener('focus', () => {
        this.getStroageSetting();
      });
    }
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  didFocusNavigation () {
    this.setState({ loadingStatus: false });
    this.getStroageSetting();
    const {
      initStatus, isSuccess, historyLocation, mileageData, extraState, stopData,
    } = this.props;

    let { stopLngLat } = this.state;
    if (initStatus === 'end' && isSuccess === false) {
      if (!isEmpty(extraState)) {
        this.setState(extraState.toJS());
      }
      return;
    }
    if (initStatus === 'ing') {
      if (isEmpty(extraState)) {
        this.setState({
          playStatus: 'paused',

        });
      } else {
        this.setState({
          playStatus: 'paused',
        });
      }
      return;
    }
    let {
      size, locationInfo, endMileage, startMileage,
    } = this.state;
    if (historyLocation) {
      locationInfo = historyLocation.get(0);
      stopLngLat = this.getStopAddress(0, historyLocation);
    }
    if (!isEmpty(mileageData)) {
      ({ size } = mileageData);
      endMileage = mileageData.get(size - 1).get('total') - mileageData.get(0).get('total');
      endMileage = toFixed(endMileage, 2, true);
      startMileage = 0;
    } else {
      startMileage = '--';
      endMileage = '--';
      size = 0;
    }
    const newState = {
      locationInfo,
      size,
      startMileage,
      endMileage,
      playIndex: 0,
      stopLngLat,
      stopPoints: this.getPointsFromStopData(stopData, historyLocation),
    };
    if (extraState) {
      const jsExtraState = extraState.toJS();
      const keys = Object.keys(jsExtraState);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        newState[key] = jsExtraState[key];
      }
    }
    this.setState(newState);
  }

  // 获取存储数据
  async getStroageSetting () {
    let ret = null;
    ret = await getLoginAccont();
    if (ret && ret.length > 0) {
      const user = ret[0].accont;
      // 获取缓存系统设置
      storage.load({
        key: 'userSetting',
        autoSync: true,
        syncInBackground: true,
        syncParams: {
          user,
        },
      }).then((ret2) => {
        if (ret2 && ret2[user]) {
          const setting = ret2[user];
          this.setState({
            trajectoryType: setting.trajectoryType, // 轨迹线设置
            trajectoryValue: setting.trajectoryValue, // 轨迹值设置
          });
        }
      }).catch((err) => {
        console.log('storage load err', err);
      });
    }
  }

  didBlurNavigation () {
    clearInterval(this.data.intervalId);
    this.data.intervalId = null;
    this.setState({
      loadingStatus: true,
      playStatus: 'paused',
    });
  }

  componentWillUnmount () {
    this.didFocus();
    if (Platform.OS === 'android') {
      this.didBlur();
      NativeModules.BaiduMapModule.show(Math.random());
    }
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.clearIntervalId();
  }

  getPointsFromStopData (rawData, positions) {
    if (!rawData || !positions) {
      return [];
    }
    const data = rawData.toArray();
    const padEndData = data.concat([{
      get: x => `${x}:${Math.random()}`,
    }]);
    const padEndDataLength = padEndData.length;
    const typeDict = {};
    if (padEndDataLength > 0) {
      let prevType = padEndData[0].get('status');
      let prevIndex = 0;
      let notNullIndex = 0;
      for (let i = 0; i < padEndDataLength; i += 1) {
        const element = padEndData[i];
        const currentType = element.get('status');
        const time = element.get('time');
        // 1.补点数据不参与计算
        // 2.两个点就算是相同状态，但时间差大于5分钟，也属于两个状态段
        // 3.如果两个状态之间时间差大于5分钟，则按状态段首尾点计算
        // 4.不然按下一个状态段第一个点 - 上一个状态段最后一点计算
        if (currentType === null) {
          /* eslint no-continue:off */
          continue;
        }
        const timeDiff = time - padEndData[notNullIndex].get('time');
        if (currentType !== prevType || timeDiff > 300) {
          const item = typeDict[prevType];
          let endIndex = notNullIndex;
          let timeLength = padEndData[endIndex].get('time') - padEndData[prevIndex].get('time');
          let mileageLength = padEndData[endIndex].get('mileage') - padEndData[prevIndex].get('mileage');
          if (timeDiff <= 300) {
            endIndex = i;
            timeLength = padEndData[endIndex].get('time') - padEndData[prevIndex].get('time');
            mileageLength = padEndData[endIndex].get('mileage') - padEndData[prevIndex].get('mileage');
          }
          const location = positions.get(prevIndex).toJS();
          const coordinates = bdEncrypt(location.longitude, location.latitude);
          location.longitude = coordinates.bdLng;
          location.latitude = coordinates.bdLat;
          const segment = {
            startIndex: prevIndex,
            endIndex,
            timeLength,
            mileageLength,
            startTime: padEndData[prevIndex].get('time'),
            endTime: padEndData[endIndex].get('time'),
            startLocation: location,
          };
          if (item) {
            item.occurrence += 1;
            item.totalTimeLength += timeLength;
            item.totalMileageLength += mileageLength;
            item.segment.push(segment);
          } else {
            typeDict[prevType] = {
              type: prevType,
              occurrence: 1,
              totalTimeLength: timeLength,
              totalMileageLength: mileageLength,
              segment: [segment],
            };
          }
          prevType = currentType;
          prevIndex = i;
        }
        notNullIndex = i;
      }
    }
    if (typeDict['2']) {
      return typeDict['2'].segment;
    }
    return [];
  }

  // 地图放大按钮点击
  mapAmplificationClick () {
    const { mapAmplification } = this.state;
    let value;
    if (mapAmplification === null) {
      value = [{
        type: 'big',
        index: 0,
      }];
    } else {
      value = [
        {
          type: 'big',
          index: mapAmplification[0].index + 1,
        },
      ];
    }
    this.setState({ mapAmplification: value });
  }

  // 地图缩小按钮点击
  mapNarrowClick () {
    const {
      mapNarrow,
    } = this.state;
    let value;
    if (mapNarrow === null) {
      value = [{
        type: 'small',
        index: 0,
      }];
    } else {
      value = [
        {
          type: 'small',
          index: mapNarrow[0].index + 1,
        },
      ];
    }
    this.setState({ mapNarrow: value });
  }

  getStopAddress = (index, locations) => {
    let { historyLocation: locationsInProp } = this.props;
    if (!isEmpty(locations)) {
      locationsInProp = locations;
    }
    if (locationsInProp === null) return null;
    const stop = locationsInProp.get(index);
    if (isEmpty(stop)) {
      return null;
    }
    const longitude = stop.get('longitude');
    const latitude = stop.get('latitude');
    const { bdLng, bdLat } = bdEncrypt(longitude, latitude);
    return {
      bdLng,
      bdLat,
    };
  }

  clearIntervalId = () => {
    if (this.data.intervalId !== null) {
      clearInterval(this.data.intervalId);
    }
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      this.handleOnPause();
    }
  }

  handleHideAlert = () => {
    this.setState({
      alertShow: false,
    });
  }

  // 改变handleIndexChange跳点方法
  handleIndexChangeType = (type) => {
    // true 跳点   false 不跳点
    this.setState({
      playIndexType: type,
    }, () => {
      const index = this.state.sliderCompleteIndex !== 1 ? this.state.sliderCompleteIndex : this.state.playIndex;
      // eslint-disable-next-line react/destructuring-assignment
      this.handleIndexChange(index, { stopAddress: '--', isFirst: type });
      this.setState({
        sliderCompleteIndex: 1,
      });
    });
  }

  handleIndexChange = (newPlayIndex, extraState) => {
    let playIndex = newPlayIndex;
    const { mileageData, historyLocation } = this.props;
    const { playIndexType, sliderCompleteIndex } = this.state;
    if (historyLocation) {
      // eslint-disable-next-line radix
      const newHistoryLocation = historyLocation.toJS();
      // eslint-disable-next-line radix
      const newMileageData = mileageData.toJS();
      if (newHistoryLocation.length > 0) {
        if (playIndex >= newHistoryLocation.length) {
          playIndex = newHistoryLocation.length - 1;
        } else {
          // eslint-disable-next-line no-lonely-if
          if (playIndexType) { // 跳点时
            // eslint-disable-next-line no-lonely-if
            if (extraState && extraState.butType === 'prev') {
              playIndex = newPlayIndex;
            } else if (extraState && extraState.isplay === true) {
              // eslint-disable-next-line no-plusplus
              for (let i = playIndex; i < newHistoryLocation.length; i++) {
                // eslint-disable-next-line radix
                if (parseInt(newHistoryLocation[i].speed) >= 5) {
                  playIndex = i;
                  break;
                } else {
                  // eslint-disable-next-line max-len
                  const isSpeed = newHistoryLocation && newHistoryLocation.length > 0 ? newHistoryLocation.slice(i).filter(item => item.speed >= 5) : [];
                  if (isSpeed.length === 0) {
                    playIndex = newHistoryLocation.length - 1;
                  }
                }
              }
            }
          } else { // 不跳点时
            // eslint-disable-next-line no-lonely-if
            if (extraState && extraState.isFirst === false && sliderCompleteIndex !== 1) { // 点击切换是否跳点
              playIndex = sliderCompleteIndex;
            }
          }
        }
        let startMileage;
        // if (newMileageData.get(playIndex).get('total') === null) {
        if (newMileageData[playIndex].total === null) {
          startMileage = '--';
        } else {
          // eslint-disable-next-line max-len
          // startMileage = newMileageData.get(playIndex).get('total') - newMileageData.get(0).get('total');
          startMileage = newMileageData[playIndex].total - newMileageData[0].total;
          startMileage = toFixed(startMileage, 2, true);
        }
        const locationInfo = newHistoryLocation[playIndex];
        // const stopLngLat = this.getStopAddress(playIndex);
        let newState = {
          playIndex,
          startMileage,
          locationInfo,
          // stopLngLat,
          stopLngLat: null,
        };
        newState = Object.assign({}, newState, extraState);
        this.setState(newState);
      } else {
        toastShow('无轨迹回放数据！', { duration: 2000 });
      }
    }
  }

  handleTick = () => {
    const { playIndex, size } = this.state;
    const step = 1;
    let newPlayIndex = playIndex;
    if (playIndex + step >= size) {
      clearInterval(this.data.intervalId);
      newPlayIndex = size - 1;
      this.data.intervalId = null;
      const bdLngLat = this.getStopAddress(newPlayIndex);
      this.setState({
        playStatus: 'paused',
        stopLngLat: bdLngLat,
        playIndex: newPlayIndex,
      });
    } else {
      this.handleIndexChange(playIndex + step, { stopAddress: '--', isplay: true });
    }
  }

  handleOnPause = () => {
    clearInterval(this.data.intervalId);
    this.data.intervalId = null;
    const { playIndex } = this.state;
    const bdLngLat = this.getStopAddress(playIndex);
    this.setState({
      playStatus: 'paused',
      stopLngLat: bdLngLat,
    });
  }

  handleOnPlay = (playIndex) => {
    const { currentSpeed } = this.state;
    let timeout = speedBase;
    timeout = parseInt(speedBase / currentSpeed, 10);
    this.data.intervalId = setInterval(this.handleTick, parseInt(timeout, 10));
    if (playIndex !== null && playIndex !== undefined) {
      this.setState({
        playStatus: 'playing',
        playIndex,
        changeEventSource: 'button',
        stopAddress: '--',
      });
    } else {
      this.setState({
        playStatus: 'playing',
        changeEventSource: 'button',
        stopAddress: '--',
      });
    }
  }

  handleOnSpeedChange = () => {
    const { currentSpeed } = this.state;
    const index = speedList.findIndex(x => x === currentSpeed);
    let newIndex = null;
    if (index === speedList.length - 1) {
      newIndex = 0;
    } else {
      newIndex = index + 1;
    }
    const newSpeed = speedList[newIndex];
    this.setState({
      currentSpeed: newSpeed,
    });
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
      this.data.intervalId = setInterval(this.handleTick, parseInt(speedBase / newSpeed, 10));
    }
  }

  handleOnPrev = () => {
    const { playIndex } = this.state;
    if (playIndex > 0) {
      const bdLngLat = this.getStopAddress(playIndex - 1);
      this.handleIndexChange(playIndex - 1, {
        changeEventSource: 'button', playStatus: 'paused', stopLngLat: bdLngLat, butType: 'prev',
      });
    }
  }

  handleOnNext = () => {
    const { mileageData } = this.props;
    const { playIndex } = this.state;
    const { size } = mileageData;
    if (playIndex < size - 1) {
      const bdLngLat = this.getStopAddress(playIndex + 1);
      this.handleIndexChange(playIndex + 1, {
        changeEventSource: 'button', playStatus: 'paused', stopLngLat: bdLngLat, butType: 'next',
      });
    }
  }

  handleOnExpand = () => {
    this.setState({
      showBottom: false,
    });
  }

  handleOnCollapse = () => {
    this.setState({
      showBottom: true,
    });
  }

  handleOnShowArrow = () => {
    this.setState({
      showArrow: true,
      isShowChart: true,
    });
  }

  handleOnHideArrow = () => {
    this.setState({
      showArrow: false,
      isShowChart: false,
    });
  }

  handleOnShowSwiper = () => {
    this.setState({
      isShowSwiper: true,
    });
  }

  handleOnCloseSwiper = () => {
    this.setState({
      isShowSwiper: false,
    });
  }

  handleOnShowClock = () => {
    this.setState({
      isShowClock: true,
    });
  }

  handleOnHideClock = () => {
    this.setState({
      isShowClock: false,
    });
  }

  handleOnMonitorChange = (currentMonitor) => {
    const { startTimeStr, endTimeStr } = this.state;
    const { markerId } = currentMonitor;
    const { onInit } = this.props;
    this.reset();
    const extraState = {
      currentMonitor,
      changeEventSource: 'monitor',
    };
    onInit({
      monitorId: markerId,
      startTime: startTimeStr,
      endTime: endTimeStr,
      extraState,
    });
  }

  handleOnTimeChange = (startTime, endTime) => {
    const startTimeStr = timeFormator(startTime);
    const endTimeStr = timeFormator(endTime);
    const { currentMonitor } = this.state;
    const { markerId } = currentMonitor;
    const { onInit } = this.props;
    this.reset();
    const extraState = {
      startTime,
      endTime,
      startTimeStr,
      endTimeStr,
      changeEventSource: 'time',
    };
    onInit({
      monitorId: markerId,
      startTime: startTimeStr,
      endTime: endTimeStr,
      extraState,
      changeSource: 'time',
    });
  }

  handleOnSliderChange = (value) => {
    if (value < 0) {
      return;
    }
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
    }
    this.handleIndexChange(value, { changeEventSource: 'slider', playStatus: 'paused', stopAddress: '--' });
  }

  handleOnSliderComplete = (value) => {
    const bdLngLat = this.getStopAddress(value);
    this.setState({
      stopLngLat: bdLngLat,
      sliderCompleteIndex: value,
    });
  }

  handleOnDrag = (param) => {
    const { playIndex } = param;
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
    }
    this.handleIndexChange(playIndex, { changeEventSource: 'chart', playStatus: 'paused', stopAddress: '--' });
  }

  handleOnDragEnd = (param) => {
    const { playIndex } = param;
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
    }
    const bdLngLat = this.getStopAddress(playIndex);
    this.handleIndexChange(playIndex, { changeEventSource: 'chartEnd', playStatus: 'paused', stopLngLat: bdLngLat });
  }

  handleOnChartChange = () => {
    this.setState({
      changeEventSource: 'swiper',
    });
  }

  handleOnAddress = (param) => {
    this.setState({ stopAddress: param });
  }

  reset = () => {
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
      this.data.intervalId = null;
    }
  }

  prevY = null;

  currentY = null;

  timeoutIds = [];

  // 设置地图高度
  handleOnLayout = (e) => {
    const { nativeEvent: { layout: { y } } } = e;
    if (this.prevY === null) {
      this.prevY = y;
      this.currentY = y;
    } else {
      this.currentY = y;
    }
    const id = setTimeout(() => {
      if (this.prevY === this.currentY) {
        this.setState({
          mapHeight: this.prevY,
        });
        this.timeoutIds.forEach((iid) => {
          clearTimeout(iid);
        });
        this.prevY = null;
        this.currentY = null;
      } else {
        this.prevY = this.currentY;
      }
    }, 300);
    this.timeoutIds.push(id);
  }

  handlePrevStopPoint = () => {
    const { stopIndex, stopPoints } = this.state;
    if (stopIndex !== -1 && stopPoints !== null && stopPoints.length > 0) {
      if (stopIndex === 0) {
        this.setState({
          stopIndex: stopPoints.length - 1,
        });
      } else {
        this.setState({
          stopIndex: stopIndex - 1,
        });
      }
    }
  }

  handleNextStopPoint = () => {
    const { stopIndex, stopPoints } = this.state;
    if (stopIndex !== -1
      && stopPoints !== null
      && stopPoints.length > 0
    ) {
      if (stopIndex === stopPoints.length - 1) {
        this.setState({
          stopIndex: 0,
        });
      } else {
        this.setState({
          stopIndex: stopIndex + 1,
        });
      }
    }
  }

  handleCloseStopPoint = () => {
    this.setState({
      stopIndex: -1,
    });
  }

  onStopPointDataEvent = (data) => {
    const { address } = data;
    this.setState({
      stopLocation: address,
    });
  }

  onStopPointIndexEvent = (data) => {
    const { index } = data;
    const { playStatus } = this.state;
    if (playStatus === 'playing') {
      this.handleOnPause();
    }
    if (index >= 0) {
      this.setState({
        stopIndex: index,
        showBottom: true,
      });
    } else {
      this.setState({
        stopIndex: index,
      });
    }
  }

  mapTypeChange = () => {
    const { bMapType } = this.state;
    this.setState({ bMapType: bMapType === 1 ? 2 : 1 });
  };

  render () {
    const {
      attachList,
      initStatus,
      historyLocation,
      stopData,
      monitors,
    } = this.props;

    const {
      startTime,
      endTime,
      showBottom,
      showArrow,
      currentMonitor,
      playIndex,
      playStatus,
      locationInfo,
      startMileage,
      endMileage,
      size,
      currentSpeed,
      changeEventSource,
      mapHeight,
      stopAddress,
      stopLngLat,
      mapAmplification,
      mapNarrow,
      stopPoints,
      stopIndex,
      stopLocation,
      bMapType,
      isShowSwiper,
      isShowClock,
      isShowChart,
      loadingStatus,
      trajectoryValue,
      trajectoryType,
      // speedValues,
    } = this.state;

    const narrowBottom = Math.max(210, mapHeight + 15);
    const isUp = stopIndex === -1 ? null : false;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          {
            initStatus === 'ing' || loadingStatus ? <Loading type="modal" /> : null
          }
          <View style={[styles.content]}>
            <View style={styles.title}>
              <TopText
                title={currentMonitor.title}
                startTime={startTime}
                endTime={endTime}
              />
            </View>
            {
              !(isShowChart && (isShowClock || isShowSwiper)) && (
                <TouchableOpacity
                  onPress={this.mapTypeChange}
                  style={[styles.mapIcon, { bottom: narrowBottom + 100 }]}
                >
                  <Image
                    style={styles.mapIconImage}
                    source={bMapType === 1 ? mapTypeImage : mapTypeFocusImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )
            }
            {
              !(isShowChart && (isShowClock || isShowSwiper)) && (
                <TouchableOpacity
                  onPress={() => this.mapAmplificationClick()}
                  style={[styles.mapIcon, { bottom: narrowBottom + 50 }]}
                >
                  <Image
                    style={styles.mapIconImage}
                    source={amplificationImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )
            }
            {
              !(isShowChart && (isShowClock || isShowSwiper)) && (
                <TouchableOpacity
                  onPress={() => this.mapNarrowClick()}
                  style={[styles.mapIcon, { bottom: narrowBottom }]}
                >
                  <Image
                    style={styles.mapIconImage}
                    source={narrowImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )
            }
            {
              (!loadingStatus || Platform.OS === 'ios') && (
                <Map
                  style={styles.map}
                  currentMonitor={currentMonitor}
                  historyLocation={historyLocation}
                  playStatus={playStatus}
                  playIndex={playIndex}
                  speedInSecond={parseFloat(speedBase / currentSpeed / 1000, 10)}
                  stopLngLat={stopLngLat}
                  onAddress={this.handleOnAddress}
                  fitPolyLineSpan={`${mapHeight + 40}|1|${playStatus}|${winHeight}|${currentMonitor.markerId}`}
                  baiduMapScalePosition={`15|${mapHeight + 30}`}
                  mapAmplification={mapAmplification}
                  mapNarrow={mapNarrow}
                  stopPoints={stopPoints}
                  stopIndex={stopIndex}
                  onStopPointDataEvent={this.onStopPointDataEvent}
                  onStopPointIndexEvent={this.onStopPointIndexEvent}
                  bMapType={bMapType}
                  locationInfo={locationInfo}
                  isShowChart={isShowChart}
                  trajectoryData={{ trajectoryType, trajectoryValue }}
                // speedValues={speedValues}
                />
              )
            }
          </View>
          <View style={styles.toolBarContainer}>
            <ToolBar
              initStatus={initStatus}
              onExpand={this.handleOnExpand}
              onCollapse={this.handleOnCollapse}
              arrowShow
              isUp={isUp}
              activeMonitor={currentMonitor}
              monitors={monitors}
              onChange={this.handleOnMonitorChange}
            >
              <View>
                <Bottom
                  navigation={this.props.navigation}
                  initStatus={initStatus}
                  attachList={attachList}
                  locationInfo={locationInfo}
                  startTime={startTime}
                  endTime={endTime}
                  showBottom={showBottom}
                  stopIndex={stopIndex}
                  playIndex={playIndex}
                  playStatus={playStatus}
                  startMileage={startMileage}
                  endMileage={endMileage}
                  size={size}
                  currentSpeed={currentSpeed}
                  changeEventSource={changeEventSource}
                  currentMonitorId={currentMonitor ? currentMonitor.markerId : null}
                  stopAddress={stopAddress}
                  stopData={stopData}
                  onPlay={this.handleOnPlay}
                  onPause={this.handleOnPause}
                  onPrev={this.handleOnPrev}
                  onNext={this.handleOnNext}
                  onTimeChange={this.handleOnTimeChange}
                  onSpeedChange={this.handleOnSpeedChange}
                  onSliderChange={this.handleOnSliderChange}
                  onSliderComplete={this.handleOnSliderComplete}
                  onDrag={this.handleOnDrag}
                  onDragEnd={this.handleOnDragEnd}
                  onChartChange={this.handleOnChartChange}
                  onShowArrow={this.handleOnShowArrow}
                  onHideArrow={this.handleOnHideArrow}
                  onShowSwiper={this.handleOnShowSwiper}
                  onCloseSwiper={this.handleOnCloseSwiper}
                  onShowClock={this.handleOnShowClock}
                  onHideClock={this.handleOnHideClock}
                  handleIndexChangeType={this.handleIndexChangeType}
                />
              </View>
            </ToolBar>
            <View onLayout={(e) => { this.handleOnLayout(e); }} />
          </View>
          {
            stopIndex !== -1 ? (
              <View style={styles.stopPanel}>
                <StopPanel
                  stopIndex={stopIndex}
                  stopPoints={stopPoints}
                  startTime={new Date(stopPoints[stopIndex].startTime * 1000)}
                  endTime={new Date(stopPoints[stopIndex].endTime * 1000)}
                  timeLength={stopPoints[stopIndex].timeLength}
                  stopLocation={stopLocation}
                  onPrev={this.handlePrevStopPoint}
                  onNext={this.handleNextStopPoint}
                  onCancel={this.handleCloseStopPoint}
                />
              </View>
            ) : null
          }
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    initStatus: state.getIn(['historyDataReducers', 'initStatus']),
    isSuccess: state.getIn(['historyDataReducers', 'isSuccess']),
    attachList: state.getIn(['historyDataReducers', 'attachList']),
    historyLocation: state.getIn(['historyDataReducers', 'historyLocation']),
    mileageData: state.getIn(['historyDataReducers', 'mileageData']),
    stopData: state.getIn(['historyDataReducers', 'stopData']),
    extraState: state.getIn(['historyDataReducers', 'extraState']),
  }),
  dispatch => ({
    onInit: (payload) => {
      dispatch({ type: 'historyData/SAGA/INIT_ACTION', payload });
    },
  }),
)(HistoryData);