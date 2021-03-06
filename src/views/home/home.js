import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Vibration,
  ImageBackground,
  Platform,
  AppState,
  Alert,
  NativeModules,
  NativeEventEmitter,
  Text,
  BackHandler,
} from 'react-native';
import { throttle } from 'lodash';
import Sound from 'react-native-sound';
import * as Animatable from 'react-native-animatable';
import {
  getAlarmSetting,
  setRollCallIssued,
  checkMonitorOnline,
  getBasicLocationInfo,
} from '../../server/getData';
import {
  getLoginState, getLoginAccont, getCheckAlarmType, getUserSetting,
  getUserStorage, getCurAccont, getDueToRemind,
} from '../../server/getStorageData';
import { go, getMonitor } from '../../utils/routeCondition';
import { removeConnectionChange } from '../../utils/network';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import { convertSeconds } from '../../utils/convertSeconds';
import { monitorIcon } from '../../utils/monitorIcon';
import WebsocketUtil from '../../utils/websocket';
import storage from '../../utils/storage';
import MapView from '../../common/MapView';
import BaiduPano from '../../common/baiduPanoView';
import Loading from '../../common/loading';
import Header from './header';
import MapBtnView from './mapBtnView';
import SubInfoView from './subscribeInfoView';
import Footer from './footer';
import CompentToolSlider from '../../common/toolBar/componentToolSlider';
import SubOtherInfoView from './subOtherInfo';
import SubOtherInfoHead from './subOtherInfoHead';
import localtionPng from '../../static/image/localtion.png';
import CNIcon from '../../static/image/CN.png';
import waring from '../../static/image/warning.png';
import activeSafetyImg from '../../static/image/activeSafety.png';
import activeSafetyGif from '../../static/image/activesafetyGif.gif';
import alarmgif from '../../static/image/alarmgif.gif';
import warningBg from '../../static/image/warningBg.png';
import { isEmpty, strangeDateParser } from '../../utils/function';
import { getLocale } from '../../utils/locales';
import { toastShow } from '../../utils/toastUtils';
import warningaudio from '../../static/image/Beep.mp3';
import ScaleView from '../../common/scaleAndroid';
import ClusterMonitor from './clusterMonitor';
import MarqueeView from '../../common/marquee';
import msgImg from '../../static/image/msg.png';
import closeMsg from '../../static/image/closeMsg.png';

Sound.setCategory('Playback');

const { height, width } = Dimensions.get('window');

const emitterManager = new NativeEventEmitter(NativeModules.OCREmitterModule);

const ocrEvent = {
  onEnterOCR: null,
  onExitOCR: null,
};
const styles = StyleSheet.create({
  homeMapView: {
    flex: 1,
  },
  objInoAreaView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  CNView: {
    position: 'absolute',
    top: -94,
    left: 15,
  },
  localtionView: {
    position: 'absolute',
    top: -50,
    left: 15,
  },
  activeSafetyView: {
    position: 'absolute',
    top: -94,
    right: 15,
  },
  CNImage: {
    width: 40,
    height: 40,
  },
  localtionImage: {
    width: 40,
    height: 40,
  },
  waringView: {
    position: 'absolute',
    top: -50,
    right: 15,
  },
  warningImage: {
    width: 40,
    height: 40,
  },
  // ????????????
  comUseClose: {
    height: 0,
  },
  comUseOpen: {
    height: 100,
  },
  otherInfoHide: {
    height: 0,
    backgroundColor: '#fff',
  },
  otherInfoShow: {
    height: 200,
  },
  mapBtnView: {
    position: 'absolute',
    top: 126,
    right: 15,
    zIndex: 1,
  },
  alarmIconShow: {
    height: 0,
    display: 'none',
  },
  hideModules: {
    height: 0,
    opacity: 0,
    display: 'none',
  },
  searchCont: {
    position: 'absolute',
    width,
    height: 50,
    top: 10,
    left: 0,
    zIndex: 100,
  },
  redCircle: {
    position: 'absolute',
    width: 9,
    height: 9,
    top: 8,
    left: 50,
    borderRadius: 9,
    backgroundColor: 'red',
  },
  marqueeContainer: {
    position: 'absolute',
    top: 70,
    left: 15,
    right: 15,
    zIndex: 99,
    padding: 5,
    paddingLeft: 6,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  marqueeView: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  marqueeTouch: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scaleAndroidStyle: {
    position: 'absolute',
    left: 65,
    zIndex: 99,
  },
  panoramaView: {
    width,
    height: Platform.OS === 'ios' ? height : height + 50,
    zIndex: -1,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  clusterViewStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  msgImg: {
    width: 20,
    height: 20,
  },
  msgTitle: {
    width: 86,
    lineHeight: 22,
    marginLeft: 4,
    marginRight: 6,
    color: '#555',
  },
  closeMsgBox: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  closeMsg: {
    width: 15,
    height: 15,
  },
});

class Home extends Component {
  static propTypes = {
    commonlyUseViewShow: PropTypes.bool,
    objDetShow: PropTypes.bool,
    mapTrafficEnabled: PropTypes.bool,
    bMapType: PropTypes.number,
    locationManager: PropTypes.bool,
    mapLocationChange: PropTypes.func,
    getMonitorIds: PropTypes.func,
    markers: PropTypes.object,
    basicLocationInfo: PropTypes.object,
    detailLocationInfo: PropTypes.object,
    socketTime: PropTypes.number,
    updateMonitorInfo: PropTypes.func,
    currentMonitorInfoId: PropTypes.string,
    updateMonitorAddressInfo: PropTypes.func,
    updateBasicAndDetail: PropTypes.func,
    objDetChange: PropTypes.func, // ????????????
    comUseShow: PropTypes.func,
    routerIndex: PropTypes.number,
    mapAmplification: PropTypes.array,
    mapNarrow: PropTypes.array,
    clearData: PropTypes.func.isRequired,
    changeCurrentMonitorId: PropTypes.func.isRequired,
    monitors: PropTypes.any,
    ifgoSecurity: PropTypes.func.isRequired,
    ifGoSecurity: PropTypes.bool.isRequired,
    randomNumber: PropTypes.number.isRequired,
    clearBasicInfoData: PropTypes.func.isRequired,
    vehicleIds: PropTypes.any,
    navigation: PropTypes.object.isRequired,
    searchMarkersStatus: PropTypes.bool,
    route: PropTypes.object.isRequired,
  };

  // ???????????????
  static defaultProps = {
    commonlyUseViewShow: false,
    objDetShow: false,
    mapTrafficEnabled: false,
    bMapType: 1,
    locationManager: null,
    mapLocationChange: null,
    getMonitorIds: null,
    markers: [],
    basicLocationInfo: {},
    detailLocationInfo: {},
    socketTime: 0,
    updateMonitorInfo: null,
    currentMonitorInfoId: null,
    updateMonitorAddressInfo: null,
    updateBasicAndDetail: null,
    objDetChange: null,
    comUseShow: null,
    routerIndex: null,
    mapAmplification: null,
    mapNarrow: null,
    monitors: null,
    vehicleIds: null,
    searchMarkersStatus: false,
  }

  data = {
    subscribeMonitors: [],
    subMonitorArr: [],
  }

  constructor(props) {
    super(props);
    const {
      getMonitorIds, vehicleIds, searchMarkersStatus,
    } = props;
    let activeMonitor;
    this.state = {
      otherInfoShow: { // ??????????????????????????????
        height: 80 + 100,
      },
      pageY: null, // ??????????????????????????????pageY
      initOtherInfoShowH: 0, //
      initdetailSensorsH: null, // ???????????????????????????
      refSubInfoViewH: 0, // ???????????????????????????????????? , ????????????????????????????????????????????? 80,?????????60
      alarmIconShow: true, // ???????????????????????????
      scrollEnabled: false, // ?????????????????????????????????
      canInfoContTopScroll: true, // ?????????????????????????????????
      otherInfoPosSign: 0, // ????????????????????? 0?????????1?????????2??????
      // ?????????????????????????????? UNSAFE_componentWillReceiveProps otherInfoPosSign????????????1
      distinguishOtherInfoPosSign: 0,
      timestampStart: null, // ?????????????????????
      token: null,
      accont: null,
      ifHideModules: false, // ??????????????????????????????????????????
      ifWarnInfoScoket: false, // ??????????????????????????????
      ifZhonghuanWarnScoket: false, // ??????????????????????????????????????????
      warnSocketTiming: true, // ??????????????????????????????
      voiceSetting: true, // ??????????????????
      shakeSetting: true, // ??????????????????
      msgRemind: true, // ???????????????
      msgRemindStart: '20:00', // ?????????????????????
      msgRemindEnd: '08:00', // ?????????????????????
      activeMonitorInState: null,
      waringSwitchArr: [], // ????????????????????????
      curUser: '', // ???????????????
      oldAlarmType: [], // ????????????????????????
      monitorFocus: [
        {
          monitorId: '',
          index: 0,
        },
      ], // ???????????????????????????????????????
      aggrNum: null,
      alarmTypeData: [], // ?????????????????????
      isHome: true,
      rollCallDate: null,
      callTheRollArr: [],
      mapRendered: false, // ??????????????????
      centerPointState: false,
      appStateBackground: false, // app?????????????????????
      appStateBackToForeground: false, // app ?????????????????????
      adasFlag: -1, // ??????????????????????????????
      monitorFocusId: null,
      monitorFocusState: false,
      monitorIsFocus: false,
      scaleAndroidValue: null,
      panoramaState: false,
      customPanoView: null,
      panoramaLoadSuccess: false,
      clustersData: null,
      isClustersViewShow: false,
      isSoundFlag: true,
      remindInfo: [],
      remindVisible: false,
      saveUserStorage: null,
      remindRedCircle: false,
      latestPoint: null,
      latitudeLoading: true,
      minZoomState: null,
      isFocus: true,
      dotType: true,
      dotValue: '31',
    };
    this.createpanResponder();
    getMonitorIds(activeMonitor, vehicleIds, searchMarkersStatus);

    this.debouncetoAlarmCenter = throttle(this.toAlarmCenter, 5000, {
      trailing: false,
    });

    this.activeSafetyBtnEvent = throttle(this.toActiveSafety, 5000, {
      trailing: false,
    });
    this.getAlarmType(); // ??????????????????
  }

  // ??????????????????????????????
  componentDidMount () {
    this.didFocus = this.props.navigation.addListener('focus', this.didFocusNavigation);
    this.didBlur = this.props.navigation.addListener('blur', this.didBlurNavigation);
    // ?????????????????????,????????????
    BackHandler.addEventListener('hardwareBackPress', () => false);

    setTimeout(() => {
      this.getRemind();
    }, 2000);
    // // ?????????websocket??????
    this.createSocketConnect();
    // ???????????????????????????
    AppState.addEventListener('change', this.handleAppStateChange);

    ocrEvent.onEnterOCR = emitterManager.addListener('onEnterOCR',
      () => {
        this.setState({ isSoundFlag: false });
      });
    ocrEvent.onExitOCR = emitterManager.addListener('onExitOCR',
      () => {
        this.setState({ isSoundFlag: true });
      });
    // ??????????????????
    if (Platform.OS !== 'ios') {
      const panoramaViewManager = new NativeEventEmitter(NativeModules.MyPanoramaView);
      // ???????????????????????????
      const panoramaEvent = {
        onPanoramaClose: null,
        onPanoramaFailed: null,
        onPanoramaSuccess: null,
      };
      // ??????????????????????????????
      panoramaEvent.onPanoramaClose = panoramaViewManager.addListener('onPanoramaClose',
        () => {
          this.setState({
            panoramaState: false,
            panoramaLoadSuccess: false,
          });
        });
      // ????????????????????????????????????
      panoramaEvent.onPanoramaFailed = panoramaViewManager.addListener('onPanoramaFailed',
        () => {
          this.setState({
            panoramaState: false,
            panoramaLoadSuccess: false,
          });
          toastShow(getLocale('panoramaFailed'), { duration: 2000 });
        });
      // ????????????????????????????????????
      panoramaEvent.onPanoramaSuccess = panoramaViewManager.addListener('onPanoramaSuccess',
        () => {
          this.setState({ panoramaLoadSuccess: true });
        });
    }
  }

  /**
   * ??????????????????
   */
  didFocusNavigation = () => {
    const { monitorFocus } = this.state;
    let activeMonitor;
    const {
      route: { params },
      changeCurrentMonitorId,
    } = this.props;
    this.getStroageSetting(); // ????????????????????????????????????
    if (params) { activeMonitor = params.activeMonitor; }
    const aMonitor = getMonitor();
    this.setState({ isFocus: true });
    if (activeMonitor || aMonitor) {
      if (Platform.OS === 'android') {
        this.setState({ latitudeLoading: true, mapRendered: false }, () => {
          const {
            getMonitorIds,
            vehicleIds,
            searchMarkersStatus,
          } = this.props;
          changeCurrentMonitorId(null);
          getMonitorIds(activeMonitor, vehicleIds, searchMarkersStatus, () => {
            setTimeout(() => {
              this.setState({
                isSoundFlag: true,
                activeMonitorInState: activeMonitor || aMonitor,
                monitorFocusState: false,
                monitorIsFocus: false,
                monitorFocus: [{
                  monitorId: activeMonitor ? activeMonitor.markerId : aMonitor.markerId,
                  index: monitorFocus[0].index + 1,
                }],
              }, () => {
                changeCurrentMonitorId(
                  activeMonitor ? activeMonitor.markerId : aMonitor.markerId,
                );
              });
              this.subSingleMonitor(activeMonitor ? activeMonitor.markerId : aMonitor.markerId);
            }, 500);
          });
        });
      } else {
        const {
          getMonitorIds,
          vehicleIds,
          searchMarkersStatus,
        } = this.props;
        changeCurrentMonitorId(null);
        getMonitorIds(
          activeMonitor ? activeMonitor : aMonitor, 
          vehicleIds, 
          searchMarkersStatus, 
          () => {
          setTimeout(() => {
            this.setState({
              isSoundFlag: true,
              activeMonitorInState: activeMonitor || aMonitor,
              monitorFocusState: false,
              monitorIsFocus: false,
              monitorFocus: [{
                monitorId: activeMonitor ? activeMonitor.markerId : aMonitor.markerId,
                index: monitorFocus[0].index + 1,
              }],
            }, () => {
              changeCurrentMonitorId(
                activeMonitor ? activeMonitor.markerId : aMonitor.markerId,
              );
            });
            this.subSingleMonitor(activeMonitor ? activeMonitor.markerId : aMonitor.markerId);
          }, 500);
        });
        
        // const id = activeMonitor ? activeMonitor.markerId : aMonitor.markerId;
        // changeCurrentMonitorId(null);
        // getBasicLocationInfo({ id }).then((res) => {
        //   if (res.statusCode === 200 && res.success === true) {
        //     const monitorType = res.obj.type;
        //     const objIcon = monitorIcon(monitorType, res.obj.ico);
        //     const coordinates = bdEncrypt(res.obj.longitude, res.obj.latitude);
        //     const time = convertSeconds(res.obj.time);
        //     const i = Math.floor((Number(res.obj.angle) + 270) / 360);
        //     const angle = (Number(res.obj.angle) + 270) - 360 * i;
        //     const value = {
        //       markerId: id,
        //       latitude: coordinates.bdLat,
        //       longitude: coordinates.bdLng,
        //       title: res.obj.name,
        //       ico: objIcon,
        //       speed: 10,
        //       status: res.obj.status,
        //       angle,
        //       random: Math.random(),
        //       time,
        //       monitorType,
        //     };
        //     const monitorMap = new Map();
        //     monitorMap.set(id, value);

        //     const {
        //       updateMonitorInfo,
        //     } = this.props;
        //     updateMonitorInfo(monitorMap);

        //     setTimeout(() => {
        //       this.setState({
        //         isSoundFlag: true,
        //         activeMonitorInState: activeMonitor || aMonitor,
        //         monitorFocusState: false,
        //         monitorIsFocus: false,
        //         monitorFocus: [{
        //           monitorId: activeMonitor ? activeMonitor.markerId : aMonitor.markerId,
        //           index: monitorFocus[0].index + 1,
        //         }],
        //       }, () => {
        //         changeCurrentMonitorId(
        //           activeMonitor ? activeMonitor.markerId : aMonitor.markerId,
        //         );
        //       });
        //       this.subSingleMonitor(activeMonitor ? activeMonitor.markerId : aMonitor.markerId);
        //     }, 500);
        //   }
        // });
      }
    }
    setTimeout(() => {
      NativeModules.IdleTimerModule.open();
    }, 2000);
  }

  didBlurNavigation = () => {
    const { locationManager, mapLocationChange } = this.props;
    this.setState({ isSoundFlag: false, isFocus: false });
    if (Platform.OS === 'android') {
      this.setState({ mapRendered: false });
    }
    if (locationManager) {
      mapLocationChange();
    }
  }

  // ???markers??????null?????????socket??????
  createSocketConnect () {
    setTimeout(() => {
      const { markers } = this.props;
      if (markers !== null) {
        // ?????????websocket??????
        this.socketConnect();
      } else {
        this.createSocketConnect();
      }
    }, 1000);
  }

  // state?????????????????????
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (nextProps) {
    let activeMonitor;
    const {
      objDetShow, monitors, route: { params }, ifGoSecurity, randomNumber,
    } = nextProps;
    const { latitudeLoading } = this.state;
    if (params) { activeMonitor = params.activeMonitor; }
    const { randomNumber: randomNumberprev } = this.props;
    const { initdetailSensorsH } = this.state;
    let { activeMonitorInState } = this.state;
    if (isEmpty(activeMonitorInState) && !isEmpty(monitors)) {
      if (!isEmpty(activeMonitor)) {
        activeMonitorInState = activeMonitor;
      } else {
        activeMonitorInState = monitors.get(0);
      }
    }
    if (ifGoSecurity && randomNumber !== randomNumberprev) {
      go('security');
    }
    if (!ifGoSecurity && randomNumber !== randomNumberprev) {
      toastShow('?????????????????????????????????\n????????????????????????', { duration: 2000 });
    }
    // ????????????????????????????????????
    const { updateMonitorAddressInfo } = this.props;
    if (nextProps.currentMonitorInfoId !== null
      && nextProps.currentMonitorInfoId !== this.props.currentMonitorInfoId) {
      updateMonitorAddressInfo(nextProps.currentMonitorInfoId);
    }

    if (!objDetShow) {
      this.setState({
        initOtherInfoShowH: 0,
        otherInfoShow: { // ??????????????????????????????
          height: initdetailSensorsH + 100,
        },
        alarmIconShow: true,
        scrollEnabled: false,
        canInfoContTopScroll: true,
        otherInfoPosSign: 0, // ????????????????????? 0?????????1?????????2??????
        activeMonitorInState,
        distinguishOtherInfoPosSign: 0,
      });
    } else {
      this.setState({
        otherInfoPosSign: 1,
        activeMonitorInState,
      });
    }
    if (monitors && latitudeLoading) { // ????????????????????????state???????????????????????????
      this.setState({ latitudeLoading: false });
    }
  }


  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }


  // ????????????
  componentWillUnmount () {
    NativeModules.IdleTimerModule.close();
    if (Platform.OS === 'android') {
      NativeModules.BaiduMapModule.show(Math.random());
    }
    WebsocketUtil.close();
    const {
      clearData,
      changeCurrentMonitorId,
      locationManager,
      mapLocationChange,
    } = this.props;
    clearData();
    // ?????????????????????????????????
    changeCurrentMonitorId(null);
    removeConnectionChange();
    AppState.removeEventListener('change', this.handleAppStateChange);

    if (locationManager) {
      mapLocationChange();
    }
    if (Platform.OS === 'ios') {
      ocrEvent.onEnterOCR.remove();
      ocrEvent.onExitOCR.remove();
    }
    this.didFocus();
    this.didBlur();
    this.data.subscribeMonitors = [];
    // IdleTimerManager.setIdleTimerDisabled(false); // ??????????????????;
  }

  // ????????????????????????,???????????????????????????
  getRemind = () => {
    getDueToRemind().then((remindRes) => {
      if (remindRes !== false) {
        getCurAccont().then((curUser) => {
          this.setState({
            accont: curUser,
          });
          getUserStorage().then((userStorage) => {
            const remindStorage = (userStorage && userStorage[curUser]) || null;
            let flag = false;
            if (remindStorage) {
              flag = remindStorage.messageRemind.enable;
            }
            if (flag === true) {
              this.setState({
                remindRedCircle: true,
                saveUserStorage: userStorage,
              });
              this.setRemindInfo(remindStorage.messageRemind.oldRemindInfos || {});
            } else {
              this.setState({
                saveUserStorage: userStorage,
                remindInfo: [],
                remindVisible: false,
                remindRedCircle: flag === 'close',
              });
            }
          });
        });
      }
    });
  }

  // ????????????????????????
  setRemindInfo = (data) => {
    const arr = [];
    let infoObj = [];
    Object.keys(data).map((item) => {
      if (data[item] > 0) {
        arr.push(`${data[item]}${getLocale('vehicleNum')}${this.getExpireType(item)}`);
      }
      return item;
    });
    if (arr.length > 0) {
      infoObj = [{ value: `${getLocale('hasRemind')}${arr.join(',')}` }];
    }
    this.setState({
      remindInfo: infoObj,
      remindVisible: arr.length !== 0,
    });
  }

  // ??????????????????????????????
  getExpireType = (type) => {
    let expireType = '';
    switch (type) {
      case 'lifecycleExpireNumber':
        expireType = getLocale('lifecycleExpireNumber');
        break;
      case 'alreadyLifecycleExpireNumber':
        expireType = getLocale('alreadyLifecycleExpireNumber');
        break;
      case 'expireMaintenanceList':
        expireType = getLocale('expireMaintenanceList');
        break;
      case 'expireInsuranceIdList':
        expireType = getLocale('expireInsuranceIdList');
        break;
      case 'expireDrivingLicenseList':
        expireType = getLocale('expireDrivingLicenseList');
        break;
      case 'alreadyExpireDrivingLicenseList':
        expireType = getLocale('alreadyExpireDrivingLicenseList');
        break;
      case 'expireRoadTransportList':
        expireType = getLocale('expireRoadTransportList');
        break;
      case 'alreadyExpireRoadTransportList':
        expireType = getLocale('alreadyExpireRoadTransportList');
        break;
      default:
        expireType = '';
        break;
    }
    return expireType;
  }

  // ???????????????????????????
  closeRemind = () => {
    const { saveUserStorage, accont } = this.state;
    const newStore = JSON.parse(JSON.stringify(saveUserStorage));
    newStore[accont].messageRemind.enable = 'close';
    this.setState({
      remindInfo: [],
      remindVisible: false,
    });
    storage.save({
      key: 'userStorage',
      data: newStore,
    });
  }

  handleAppStateChange = (nextAppState) => {
    const { isFocus } = this.state;
    if (nextAppState === 'background') {
      const { locationManager, mapLocationChange } = this.props;
      if (isFocus) {
        this.setState({
          appStateBackground: true,
          monitorFocusState: false,
          monitorIsFocus: false,
          centerPointState: false,
          mapRendered: false,
        });
        if (locationManager) {
          mapLocationChange();
        }
      }
    } else if (nextAppState === 'active') {
      if (isFocus) {
        const {
          getMonitorIds,
          route: { params },
          vehicleIds,
          searchMarkersStatus,
          changeCurrentMonitorId,
          currentMonitorInfoId,
        } = this.props;
        if (currentMonitorInfoId) {
          this.setState({ latitudeLoading: true, appStateBackground: false }, () => {
            let activeMonitor;
            if (params) {
              activeMonitor = params.activeMonitor;
            }
            const cId = currentMonitorInfoId;
            if (currentMonitorInfoId) {
              changeCurrentMonitorId(null);
            }
            getMonitorIds(activeMonitor, vehicleIds, searchMarkersStatus, () => {
              setTimeout(() => {
                changeCurrentMonitorId(cId);
              }, 300);
            });
          });
        }
      }
    }
  }

  // ????????????id??????????????????onMapInitFinish??????
  subSingleMonitor (monitorId) {
    const {
      token,
    } = this.state;
    if (token !== null) {
      const param = [{ vehicleId: monitorId }];
      const headers = { access_token: token };
      const request = {
        desc: {
          MsgId: 40964,
        },
        data: [monitorId], // this.getCancelSubscribeMonitors(param),
      };
      if (request.data.length > 0) {
        WebsocketUtil.subscribe(headers, '/user/topic/location', this.subCallBack.bind(this), '/app/location/subscribe', request, this.props.route.key, this.props.route.key);
      }
    }
  }

  // ?????????????????????
  onMapInitFinish () {
    this.setState({
      mapRendered: true,
      centerPointState: false,
    }, () => {
      this.setState({ centerPointState: true });
    });
  }

  // ?????????????????????
  onPointClickEvent (data) {
    const monitorId = data;
    const { changeCurrentMonitorId, monitors } = this.props;

    if (!isEmpty(monitors)) {
      let activeMonitorInStateJson;
      for (let i = 0, len = monitors.size; i < len; i += 1) {
        if (monitorId === monitors.get(i).markerId) {
          activeMonitorInStateJson = monitors.get(i);
          break;
        }
      }
      if (activeMonitorInStateJson) {
        this.subSingleMonitor(monitorId);
        setTimeout(() => {
          this.setState({
            activeMonitorInState: activeMonitorInStateJson,
          });
          changeCurrentMonitorId(null);
          setTimeout(() => {
            changeCurrentMonitorId(monitorId);
          }, 300);
        }, 100);
      }
    }
  }


  // ?????????????????????????????????
  onInAreaOptions (data) {
    const optionValues = data;
    if (optionValues.length > 0) {
      const info = {
        subMonitorArr: this.data.subMonitorArr, // ???????????????????????????
        optionValues, // ???????????????????????????
      };
      this.socketConFlagCallBack(info);
    }
  }

  // ??????????????????
  async getStroageSetting () {
    let ret = null;
    ret = await getLoginAccont();
    if (ret === null) {
      this.setState({
        storagrAccont: [],
      });
    }
    if (ret && ret.length > 0) {
      const user = ret[0].accont;
      // ????????????????????????
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
            voiceSetting: setting.voice, // ????????????
            shakeSetting: setting.shake, // ????????????
            msgRemind: setting.time, // ???????????????
            msgRemindStart: setting.timeStart, // ?????????????????????
            msgRemindEnd: setting.timeEnd, // ?????????????????????
            dotType: setting.dotType, // ????????????
            dotValue: setting.dotValue, // ???????????????
            // trajectoryType: setting.trajectoryType, // ???????????????
            // trajectoryValue: setting.trajectoryValue, // ???????????????
          });
        }
      }).catch((err) => {
        console.log('storage load err', err);
      });

      // ??????????????????????????????
      let ret3 = null;
      ret3 = await getCheckAlarmType();

      if (ret3) {
        const resust = JSON.parse(JSON.stringify(ret3));

        if (resust[user]) {
          const arr = resust[user].checkArr || [];
          const oldAlarmType = resust[user].allType || [];

          this.setState({
            curUser: user, // ???????????????
            waringSwitchArr: arr, // ????????????
            oldAlarmType, // ??????????????????
          });
        } else {
          // ?????????????????????????????????
          this.setState({
            waringSwitchArr: ['all'], // ????????????
          });
        }
      }
    }
  }

  /**
   * ???????????????????????????action
   */
  handleMonitorChange = (activeMonitor) => {
    const { monitorFocus } = this.state;
    const {
      changeCurrentMonitorId,
      locationManager,
      mapLocationChange,
    } = this.props;

    this.setState({
      activeMonitorInState: activeMonitor,
      monitorFocusState: false,
      monitorIsFocus: false,
      monitorFocus: [{
        monitorId: activeMonitor.markerId,
        index: monitorFocus[0].index + 1,
      }],
    });
    changeCurrentMonitorId(null);
    setTimeout(() => {
      changeCurrentMonitorId(activeMonitor.markerId);
    }, 300);
    if (locationManager) {
      mapLocationChange();
    }
    this.subSingleMonitor(activeMonitor.markerId);
  }

  handleMonitorClick = (activeMonitor) => {
    const { monitorFocus } = this.state;
    this.setState({
      monitorFocus: [{
        monitorId: activeMonitor.markerId,
        index: monitorFocus[0].index + 1,
      }],
      // monitorFocusId: activeMonitor.markerId,
      monitorFocusState: false,
      monitorIsFocus: false,
    });
    const { locationManager, mapLocationChange } = this.props;
    if (locationManager) {
      mapLocationChange();
    }
    this.subSingleMonitor(activeMonitor.markerId);
  }

  handleMonitorDbClick = (activeMonitor) => {
    const monitorId = activeMonitor.markerId;
    this.setState({
      monitorFocusId: monitorId,
      monitorFocusState: true,
      monitorIsFocus: true,
    });
  }

  // ???????????????????????????????????????????????????????????????
  detailSensorsHChangeFun = (H) => {
    if (Platform.OS === 'android') {
      this.setState({
        otherInfoShow: {
          height: H + 100,
        },
        initdetailSensorsH: H,
        // refSubInfoViewH: 96,
      });
    } else {
      this.refSubInfoView.measure((fx, fy, w, h) => {
        this.setState({
          otherInfoShow: {
            height: H + 100,
          },
          initdetailSensorsH: H,
          refSubInfoViewH: h,
        });
      });
    }
  }

  componentOnlayOut = (H) => {
    this.setState({
      refSubInfoViewH: H,
    });
  }

  // ??????????????????
  createpanResponder = () => {
    this.panResponderObj = PanResponder.create({
      // ????????????????????????
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        this.startTouch(evt);
      },
      onPanResponderMove: (evt) => {
        this.gestureMove(evt);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.gestureHandleFun(evt, gestureState);
      },
      onPanResponderTerminate: () => {
        // ?????????????????????????????????????????????????????????????????????????????????
        // console.log('??????????????????????????????????????????????????????????????????????????????');
      },
      onShouldBlockNativeResponder: () => true
      ,
    });
    this.otherInfoHeadpanResponderObj = PanResponder.create({
      // ????????????????????????
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        this.startTouch(evt);
      },
      onPanResponderMove: (evt) => {
        this.gestureMove(evt);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.gestureHandleFun(evt, gestureState);
      },
      onPanResponderTerminate: () => {
        // ?????????????????????????????????????????????????????????????????????????????????
        // console.log('??????????????????????????????????????????????????????????????????????????????');
      },
      onShouldBlockNativeResponder: () => true
      ,
    });
  }

  // ????????????
  startTouch = (evt) => {
    const {
      otherInfoPosSign,
      refSubInfoViewH,
      otherInfoShow: { height: H },
    } = this.state;

    const pageY = evt.nativeEvent.pageY; // ???????????????????????????
    const componentH = height - refSubInfoViewH - 140 - 10;


    const singNum = componentH === H ? 2 : otherInfoPosSign;

    this.setState({
      pageY,
      timestampStart: evt.nativeEvent.timestamp,
      distinguishOtherInfoPosSign: singNum,
      // ifzIndex: false,
    });

    const { otherInfoShow: { height: h } } = this.state;
    const { objDetShow } = this.props;
    if (objDetShow) {
      this.setState({
        initOtherInfoShowH: h,
      });
    }
  }

  // ????????????
  gestureMove = (evt) => {
    const {
      pageY: pageYState,
      initOtherInfoShowH,
    } = this.state;
    const { objDetShow, objDetChange } = this.props;
    const pageY = evt.nativeEvent.pageY;
    const differenceVal = pageY - pageYState;

    if (initOtherInfoShowH - differenceVal < 0) {
      // console.warn('initOtherInfoShowH - differenceVal',initOtherInfoShowH - differenceVal);

    }

    this.setState({
      otherInfoShow: {
        height: initOtherInfoShowH - differenceVal > 0 ? initOtherInfoShowH - differenceVal : 0,
      },
    });
    if (!objDetShow && differenceVal < 0) { // ?????????????????????????????????
      objDetChange();
    }
  }

  // ????????????????????????
  gestureHandleFun = (evt) => {
    const {
      pageY: pageYState,
      initdetailSensorsH,
      // otherInfoShow,
      refSubInfoViewH,
      timestampStart,
      distinguishOtherInfoPosSign,
    } = this.state;
    const pageY = evt.nativeEvent.pageY;
    const timestamp = evt.nativeEvent.timestamp;
    const touchTime = timestamp - timestampStart;

    const differenceVal = pageYState - pageY;
    const { objDetChange, objDetShow } = this.props;

    const componentH = height - refSubInfoViewH - 140 - 10;
    if (differenceVal > 0) { // ?????????
      if ((touchTime > 500) && (differenceVal > (initdetailSensorsH + 100))) { // ??????????????????
        this.setState({
          otherInfoShow: {
            height: componentH,
          },
          initOtherInfoShowH: componentH,
          alarmIconShow: false,
          scrollEnabled: true,
          canInfoContTopScroll: false,
          otherInfoPosSign: 2,
          distinguishOtherInfoPosSign: 2,
        });
      } else if (distinguishOtherInfoPosSign === 0) {
        this.setState({
          otherInfoShow: {
            height: initdetailSensorsH + 100,
          },
          initOtherInfoShowH: initdetailSensorsH + 100,
          alarmIconShow: true,
          scrollEnabled: false,
          otherInfoPosSign: 1,
          distinguishOtherInfoPosSign: 1,
        });
      } else {
        // const componentH = height - refSubInfoViewH - 140 - 100 - 10;

        this.setState({
          otherInfoShow: {
            height: componentH,
          },
          initOtherInfoShowH: componentH + 100,
          alarmIconShow: false,
          scrollEnabled: true,
          canInfoContTopScroll: false,
          otherInfoPosSign: 2,
          distinguishOtherInfoPosSign: 2,
        });
      }
    } else if (differenceVal < 0) { // ?????????
      if (objDetShow) {
        if (touchTime > 500 && -differenceVal > initdetailSensorsH + 100 + 100) {
          objDetChange();
        } else if (distinguishOtherInfoPosSign === 2) {
          this.setState({
            otherInfoShow: {
              height: initdetailSensorsH + 100,
            },
            initOtherInfoShowH: initdetailSensorsH + 100,
            alarmIconShow: true,
            scrollEnabled: false,
            otherInfoPosSign: 1,
            distinguishOtherInfoPosSign: 1,
          });
        } else {
          objDetChange();
        }
      } else { // ????????????????????????????????????????????????????????????????????????????????????
        this.setState({
          otherInfoShow: {
            height: 180,
          },
        });
      }
    }
  }

  scrollToToporBtm = (data) => {
    const {
      otherInfoPosSign, refSubInfoViewH, initdetailSensorsH, distinguishOtherInfoPosSign,
    } = this.state;
    const { objDetShow, objDetChange } = this.props;

    if (data === 'top') {
      // ?????????????????????????????????????????????????????????csrollview?????????????????????????????????

      if (((distinguishOtherInfoPosSign === 1) && objDetShow)
        || (distinguishOtherInfoPosSign === 0 && otherInfoPosSign === 1)) {
        objDetChange();
      } else if (distinguishOtherInfoPosSign === 2) {
        this.setState({
          otherInfoShow: {
            height: initdetailSensorsH + 100,
          },
          initOtherInfoShowH: initdetailSensorsH + 100,
          alarmIconShow: true,
          scrollEnabled: false,
          otherInfoPosSign: 1,
          distinguishOtherInfoPosSign: 1,
        });
      }
    } else if (data === 'btm') {
      if (otherInfoPosSign === 1) {
        const componentH = height - refSubInfoViewH - 140 - 10;
        this.setState({
          otherInfoShow: {
            height: componentH,
          },
          initOtherInfoShowH: componentH + 100,
          alarmIconShow: false,
          scrollEnabled: true,
          canInfoContTopScroll: false,
          otherInfoPosSign: 2,
          distinguishOtherInfoPosSign: 2,
        });
      }
    }
  }

  // ????????????
  mapClick = () => {
    // this.refSubInfoView.measure((fx, fy, w, h) => {
    const { ifHideModules } = this.state;
    const { objDetChange, objDetShow } = this.props;
    if ((objDetShow && !ifHideModules)) {
      objDetChange();
    }
    this.setState({
      ifHideModules: !ifHideModules,
      // refSubInfoViewH: h,
    });
    // });
  }

  toAlarmCenter () {
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 }); // ??????????????????
      return;
    }
    go('alarmCenter');
  }

  // socket????????????
  async socketConnect () {
    const appSettings = await getUserSetting();
    const state = await getLoginState();
    const headers = { access_token: state.token };
    WebsocketUtil.init(`/clbs/ws?access_token=${state.token}`, headers);
    this.setState({
      aggrNum: appSettings.app.aggrNum,
      adasFlag: appSettings.adasFlag,
      token: state.token,
    });
  }

  // ??????socket??????????????????
  socketConFlagCallBack (info) {
    setTimeout(() => {
      if (WebsocketUtil.conFlag) {
        this.subMonitorFunc(info);
      } else {
        this.socketConFlagCallBack(info);
      }
    }, 500);
  }

  // ?????????????????????????????????????????????
  async subMonitorFunc (info) {
    const state = await getLoginState();
    const subAffterInfo = info.subMonitorArr; // ??????????????????????????????
    const subInfo = info.optionValues; // ??????????????????????????????
    const msg = this.screenMonitor(subAffterInfo, subInfo);
    // ???????????????????????????????????????
    this.unSubAddressFunc(
      msg[0],
      state.token,
    );
    // ??????????????????
    this.subAddressFunc(
      msg[1],
      state.token,
    );
    this.data.subMonitorArr = subInfo;
  }

  // ?????????????????????????????????????????????????????????????????????
  screenMonitor (subMonitorArr, optionValues) {
    // ???????????????????????????????????????
    const subArr = [];
    for (let i = 0; i < optionValues.length; i += 1) {
      const id = optionValues[i]; // [0].markerId;
      let flag = false;
      for (let j = 0; j < subMonitorArr.length; j += 1) {
        const oid = subMonitorArr[j]; // [0].markerId;
        if (id === oid) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        subArr.push({
          vehicleId: id,
        });
      }
    }
    // ?????????????????????????????????????????????
    const unSubArr = [];
    for (let i = 0; i < subMonitorArr.length; i += 1) {
      const id = subMonitorArr[i]; // [0].markerId;
      let flag = false;
      for (let j = 0; j < optionValues.length; j += 1) {
        const oid = optionValues[j]; // [0].markerId;
        if (id === oid) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        unSubArr.push({
          vehicleId: id,
        });
      }
    }
    return [unSubArr, subArr];
  }

  // ????????????????????????
  unSubAddressFunc (info, token) {
    if (info.length > 0) {
      const headers = { access_token: token };
      const unParam = info;
      const unRequset = {
        desc: {
          MsgId: 40964,
        },
        data: unParam,
      };
      //  if (unParam.length > 0) {
      this.removeUnSubscribeMonitors(unParam);
      WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, '/user/topic/location', this.props.route.key);
      // }
    }
  }

  // ????????????????????????
  subAddressFunc (info, token) {
    const { adasFlag } = this.state;
    const headers = { access_token: token };
    const param = info;

    const request = {
      desc: {
        MsgId: 40964,
      },
      data: this.getCancelSubscribeMonitors(param),
    };

    // ??????????????????
    if (request.data.length > 0) {
      WebsocketUtil.subscribe(headers, '/user/topic/location',
        this.subCallBack.bind(this), '/app/location/subscribe', request, this.props.route.key);

      // ??????????????????
      WebsocketUtil.subscribe(headers, '/user/topic/alarm',
        this.subAlarmScribe.bind(this), '/app/vehicle/subscribeStatus', request, this.props.route.key);

      // ??????????????????????????????
      if (adasFlag === 1) {
        WebsocketUtil.subscribe(headers, '/user/topic/securityRiskRingBell',
          this.subscribeRiskCallback.bind(this), '/app/risk/security/subscribeRisk', request, this.props.route.key);
      }
    }
  }

  // ????????????????????????
  subCallBack (msg) {
    /* eslint prefer-destructuring:off */
    const data = JSON.parse(msg.body);
    const { mapRendered, isFocus } = this.state;
    if (data.desc !== 'neverOnline') {
      const msgHead = data.data.msgHead;
      const msgBody = data.data.msgBody;
      if (msgHead.msgID === 513) { // ????????????
        const { callTheRollArr } = this.state;
        const mid = msgBody.monitorInfo.monitorId;
        const arr = callTheRollArr;
        const index = arr.indexOf(mid);
        arr.splice(index, 1);
        if (index !== -1) {
          this.setState({ callTheRollArr: arr });
          toastShow(getLocale('locationUpdateSuccess'), { duration: 2000 });

          // rollCallDate
          const coordinates = bdEncrypt(msgBody.longitude, msgBody.latitude);
          const time = convertSeconds(msgBody.gpsTime);
          const i = Math.floor(Number(msgBody.direction) / 360);
          const angle = Number(msgBody.direction) - 360 * i + 270;
          const value = {
            markerId: msgBody.monitorInfo.monitorId,
            latitude: coordinates.bdLat,
            longitude: coordinates.bdLng,
            status: msgBody.stateInfo,
            angle,
            random: Math.random(),
            time,
          };
          if (mapRendered) {
            this.setState({ rollCallDate: value });
          }
        }
      } else if (msgHead.msgID === 512) {
        // ????????????????????????????????????
        // ??????????????????  ???????????????
        const monitorType = msgBody.monitorInfo.monitorType;
        const objIcon = monitorIcon(monitorType, msgBody.monitorInfo.monitorIcon);
        const coordinates = bdEncrypt(msgBody.longitude, msgBody.latitude);
        const time = convertSeconds(msgBody.gpsTime);
        const i = Math.floor((Number(msgBody.direction) + 270) / 360);
        const angle = (Number(msgBody.direction) + 270) - 360 * i;
        // console.log('socket????????????', msgBody.monitorInfo.monitorName);
        const value = {
          markerId: msgBody.monitorInfo.monitorId,
          latitude: coordinates.bdLat,
          longitude: coordinates.bdLng,
          title: msgBody.monitorInfo.monitorName,
          ico: objIcon,
          speed: 10,
          status: msgBody.stateInfo,
          angle,
          random: Math.random(),
          time,
          monitorType: msgBody.monitorInfo.monitorType,
        };

        const monitorMap = new Map();
        monitorMap.set(msgBody.monitorInfo.monitorId, value);

        const {
          updateMonitorInfo,
        } = this.props;

        // ?????????????????????????????????android
        // ???android?????????????????????????????????????????????????????????????????????
        if (mapRendered && isFocus) {
          updateMonitorInfo(monitorMap);
        }
      }
      // ?????????????????????????????????????????????
      const { currentMonitorInfoId } = this.props;
      if (currentMonitorInfoId === msgBody.monitorInfo.monitorId && mapRendered && isFocus) {
        this.assemblyMonitorInfo(msg);
      }
    }
  }

  // ?????????????????????????????????????????????
  assemblyMonitorInfo = (msg) => {
    const data = JSON.parse(msg.body);
    const msgBody = data.data.msgBody;
    const { updateBasicAndDetail } = this.props;
    const { monitorInfo } = msgBody;
    let battery = msgBody.elecData ? msgBody.elecData.deviceElectricity : null;
    if (battery !== null) {
      if (battery < 0) battery = 0;
      if (battery > 100) battery = 100;
    }

    const basicInfo = { // ????????????
      address: msgBody.positionDescription,
      angle: msgBody.direction,
      battery, // ??????
      duration: msgBody.durationTime,
      gpsMileage: msgBody.gpsMileage,
      gpsTime: strangeDateParser(msgBody.gpsTime, true),
      ico: monitorInfo.monitorIcon,
      id: monitorInfo.monitorId,
      latitude: msgBody.latitude,
      longitude: msgBody.longitude,
      name: monitorInfo.monitorName,
      pattern: msgBody.locationPattern,
      satellitesNumber: msgBody.satellitesNumber,
      signalStrength: msgBody.signalStrength,
      signalType: msgBody.signalType,
      speed: msgBody.gpsSpeed.toFixed(1),
      status: msgBody.stateInfo,
      time: msgBody.gpsTime,
      type: monitorInfo.monitorType,
      wifi: msgBody.wifiSignalStrength,
    };

    // ????????????
    updateBasicAndDetail({
      basicInfo,
      msg,
    });
  }

  // ????????????????????????
  getAlarmType = () => {
    const newAlarmType = [];
    let alarmTypeData = {};
    getAlarmSetting().then((res) => {
      alarmTypeData = res;
      if (alarmTypeData.obj.settings.length === 0) {
        getUserSetting().then((settingResult) => {
          alarmTypeData.obj.settings = settingResult.alarmTypes;
        });
      }
      if (alarmTypeData.statusCode === 200) {
        const typeArr = alarmTypeData.obj.settings;
        const typeLen = typeArr.length;
        for (let i = 0; i < typeLen; i += 1) {
          newAlarmType.push(`switch${typeArr[i].type}`);
        }
      }
      // return newAlarmType;
      this.setState({
        alarmTypeData: newAlarmType,
      });
    });
  }

  // ??????????????????
  mergeArray = (arr1, arr2) => {
    const arr = arr1;
    for (let i = 0; i < arr2.length; i += 1) {
      if (arr.indexOf(arr2[i]) === -1) {
        arr.push(arr2[i]);
      }
    }
    return arr;
  }

  // ????????????????????????????????????
  subscribeRiskCallback = () => {
    const {
      warnSocketTiming, appStateBackground, ifZhonghuanWarnScoket,
      msgRemind, shakeSetting, voiceSetting, isSoundFlag,
    } = this.state;
    if (warnSocketTiming && !appStateBackground) {
      this.setState({
        warnSocketTiming: false,
      }, () => {
        if (!ifZhonghuanWarnScoket) {
          this.setState({
            ifZhonghuanWarnScoket: true,
          }, () => {
            let ifRemind = false;
            if (msgRemind) { // ???????????????
              ifRemind = this.isDisturb();
            } else {
              ifRemind = true;
            }

            if (shakeSetting && ifRemind && isSoundFlag) { // ??????
              Vibration.vibrate();
            } else {
              Vibration.cancel();
            }

            if (voiceSetting && ifRemind && isSoundFlag) { // ????????????
              const s = new Sound(warningaudio, (e) => {
                if (e) {
                  return;
                }

                s.play(() => {
                  s.release();
                });
              });
            }
            setTimeout(() => {
              this.setState({
                ifZhonghuanWarnScoket: false,
              });
            }, 1000);
          });
        }

        setTimeout(() => {
          this.setState({
            warnSocketTiming: true,
          });
        }, 5000);
      });
    }
  }

  // ???????????????
  isDisturb = () => {
    const {
      msgRemindStart, // ?????????????????????
      msgRemindEnd, // ?????????????????????
    } = this.state;
    let ifRemind = false;
    let datStart = new Date(`2018/01/01 ${msgRemindStart}`);
    let datEnd = new Date(`2018/01/01 ${msgRemindEnd}`);
    let acrossDay = false;// ????????????
    if (datStart.getTime() > datEnd.getTime()) {
      datStart = new Date(`2018/01/01 ${msgRemindEnd}`);
      datEnd = new Date(`2018/01/01 ${msgRemindStart}`);
      acrossDay = true;
    }
    const nowDay = new Date();
    const nowH = nowDay.getHours();
    const nowM = nowDay.getMinutes();
    const nowtime = new Date(`2018/01/01 ${nowH}:${nowM}`);

    if (!(nowtime.getTime() > datStart.getTime()
      && nowtime.getTime() < datEnd.getTime())) {
      if (!acrossDay) {
        ifRemind = true;
      }
    } else if (acrossDay) {
      ifRemind = true;
    }
    return ifRemind;
  }

  // ????????????????????????
  subAlarmScribe = (data) => {
    const {
      ifWarnInfoScoket,
      shakeSetting,
      voiceSetting,
      msgRemind, // ???????????????
      waringSwitchArr,
      oldAlarmType,
      warnSocketTiming,
      alarmTypeData,
      appStateBackground,
      isSoundFlag,
    } = this.state;
    // ????????????????????????????????????

    const newAlarmType = [];
    const checkLen = waringSwitchArr.length;
    for (let i = 0; i < checkLen; i += 1) {
      if (alarmTypeData.indexOf(waringSwitchArr[i]) !== -1) {
        newAlarmType.push(waringSwitchArr[i]);
      }
    }

    if (alarmTypeData !== undefined) {
      const len = alarmTypeData.length;
      for (let i = 0; i < len; i += 1) {
        if (oldAlarmType.indexOf(alarmTypeData[i]) === -1) {
          newAlarmType.push(alarmTypeData[i]);
        }
      }
      // ????????????????????????????????????
      // const alarmObj = {};
      // alarmObj[curUser] = {
      //   checkArr: newAlarmType,
      //   allType: alarmTypeData,
      // };
      // storage.save({
      //   key: 'checkSwitch',
      //   data: alarmObj,
      // });
    }

    const dataBody = JSON.parse(data.body);
    const { data: { msgBody: { pushAlarmSet, globalAlarmSet } } } = dataBody;
    // return;

    let pushAlarmSetArr = [];
    if (pushAlarmSet !== '' && pushAlarmSet !== undefined && pushAlarmSet !== null) {
      if (pushAlarmSet.indexOf(',') === -1) {
        pushAlarmSetArr = [pushAlarmSet];
      } else {
        pushAlarmSetArr = pushAlarmSet.split(',');
      }
    } else {
      pushAlarmSetArr = [];
    }
    // const pushAlarmSetArr = pushAlarmSet !== '' ? pushAlarmSet.split(',') : [];// ????????????

    let globalAlarmSetArr = [];
    if (globalAlarmSet !== '' && globalAlarmSet !== undefined) {
      if (globalAlarmSet.indexOf(',') === -1) {
        globalAlarmSetArr = [globalAlarmSet];
      } else {
        globalAlarmSetArr = globalAlarmSet.split(',');
      }
    } else {
      globalAlarmSetArr = [];
    }

    // const globalAlarmSetArr = globalAlarmSet !== '' ? globalAlarmSet.split(',') : [];// ????????????

    const alarmSetArr = this.mergeArray(pushAlarmSetArr, globalAlarmSetArr);

    if (alarmSetArr.length && !appStateBackground) {
      // this.setState({
      //   warnSocketTiming: false,
      // }, () => {
      // ?????????????????????????????????????????????????????????
      let ifSwitch = false;


      if (newAlarmType.length && newAlarmType.length > 0) {
        // const dataBody = JSON.parse(data.body);
        // const { data: { msgBody: { pushAlarmSet } } } = dataBody;
        // const pushAlarmSetArr = pushAlarmSet.split(',');

        for (let i = 0; i < alarmSetArr.length; i += 1) {
          for (let j = 0; j < newAlarmType.length; j += 1) {
            const num = Number(newAlarmType[j].replace('switch', ''));
            if (parseInt(alarmSetArr[i], 10) === num) {
              ifSwitch = true;
            }
          }
        }
      }
      //  else {
      //   ifSwitch = true;
      // }


      if (!ifWarnInfoScoket && ifSwitch && warnSocketTiming) {
        this.setState({
          ifWarnInfoScoket: true,
          warnSocketTiming: false,
        }, () => {
          let ifRemind = false;
          if (msgRemind) { // ???????????????
            ifRemind = this.isDisturb();
          } else {
            ifRemind = true;
          }

          if (shakeSetting && ifRemind && isSoundFlag) { // ??????
            Vibration.vibrate();
          } else {
            Vibration.cancel();
          }
          if (voiceSetting && ifRemind && isSoundFlag) { // ????????????
            const s = new Sound(warningaudio, (e) => {
              if (e) {
                return;
              }
              s.play(() => {
                s.release();
              });
            });
          }


          setTimeout(() => {
            this.setState({
              ifWarnInfoScoket: false,
            });
          }, 1000);
          setTimeout(() => {
            this.setState({
              warnSocketTiming: true,
            });
          }, 5000);
        });
      }
      // });
    }
  }

  // ????????????
  rollCallIssued = (monitorId) => {
    checkMonitorOnline({
      monitorId,
    }).then((res) => {
      if (res.statusCode === 200) {
        if (res.obj === 1) { // ????????????
          this.rollCallEvent(monitorId);
        } else if (res.obj === 2) {
          toastShow(getLocale('monitorOffLine'), { duration: 2000 }); // ?????????
        } else if (res.obj === 4) {
          toastShow(getLocale('monitorNeverOnLine'), { duration: 2000 }); // ????????????
        } else if (res.obj === 3) {
          toastShow(getLocale('monitor808CancelIssued'), { duration: 2000 });
        }
      }
    });
  }

  async rollCallEvent (monitorId) {
    const state = await getLoginState();
    const token = state.token;
    const issuedState = await setRollCallIssued({ monitorId });
    if (issuedState.statusCode === 200) {
      toastShow(getLocale('getUpdateLocation'), { duration: 2000 });
      const { callTheRollArr } = this.state;
      const arr = callTheRollArr;
      arr.push(monitorId);
      this.setState({ callTheRollArr: arr });
      // ????????????
      const headers = { access_token: token };
      const request = {
        desc: {
          MsgId: 40964,
          cmsgSN: issuedState.obj.msgSN,
        },
        data: [monitorId],
      };
      WebsocketUtil.subscribe(headers, '/user/topic/realLocation', this.subCallBack.bind(this), '/app/vehicle/realLocation', request, this.props.route.key);
    } else {
      toastShow(getLocale('locationUpdateFailed'), { duration: 2000 });
    }
  }

  onLocationStatusDenied () {
    Alert.alert(
      getLocale('openLocationSwitch'), // ????????????
      getLocale('openLocationSwitchContent'), // ????????????
      [
        {
          text: getLocale('know'),
          style: 'cancel',
        },
      ],
      { cancelable: false },
    );
  }

  getBtmHeight = () => {
    const { ifHideModules, otherInfoShow: { height: h }, refSubInfoViewH } = this.state;
    const { objDetShow, commonlyUseViewShow } = this.props;
    let btmHeight = 0;
    if (!ifHideModules) {
      if (!objDetShow) {
        if (!commonlyUseViewShow) {
          btmHeight = refSubInfoViewH + 60;
        } else {
          btmHeight = refSubInfoViewH + 60 + 100;
        }
      } else {
        btmHeight = refSubInfoViewH + 60 + h;
      }
    }
    return Math.ceil(btmHeight + 32);
  }

  locationBtnEvent = () => {
    const { locationManager, mapLocationChange } = this.props;
    this.setState({ monitorFocusState: false }, () => {
      if (!locationManager) {
        mapLocationChange();
      } else {
        mapLocationChange();
        setTimeout(() => {
          mapLocationChange();
        }, 0);
      }
    });
  }

  toActiveSafety = () => {
    const { ifgoSecurity } = this.props;
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 }); // ??????????????????
      return;
    }

    ifgoSecurity();
    // go('security');
  }

  onMonitorLoseFocus () {
    this.setState({ monitorIsFocus: false, monitorFocusState: false });
  }

  onMyScale (data) {
    if (Platform.OS === 'android') {
      const { scaleAndroidValue } = this.state;
      const arr = data.split(',');
      if (scaleAndroidValue !== arr[0]) {
        this.setState({ scaleAndroidValue: arr[0] });
      }
    }
  }

  // ??????????????????
  openPanorama = () => {
    const { basicLocationInfo } = this.props;
    // const { activeLatestPoint } = this.state;
    if (!basicLocationInfo || !basicLocationInfo.address) {
      toastShow(getLocale('neverOnlinePanorama'), { duration: 2000 });
      return;
    }
    if (basicLocationInfo) {
      if (this.isDomesticLocation(basicLocationInfo.latitude, basicLocationInfo.longitude)) {
        const coordinates = bdEncrypt(basicLocationInfo.longitude, basicLocationInfo.latitude);
        const point = {
          latitude: coordinates.bdLat,
          longitude: coordinates.bdLng,
          title: basicLocationInfo.name,
        };
        if (Platform.OS === 'ios') {
          this.setState({
            panoramaState: true,
            customPanoView: point,
          });
        } else {
          NativeModules.MyPanoramaView.customPanoView(point);
        }
      } else {
        toastShow(getLocale('locationBeyondScope'), { duration: 2000 });
      }
    } else {
      toastShow(getLocale('dataInitialization'), { duration: 2000 });
    }
  }

  // ??????????????????????????????
  onPanoramaClose = () => {
    this.setState({
      panoramaState: false,
      panoramaLoadSuccess: false,
    });
  }

  // ????????????????????????????????????
  onPanoramaFailed = () => {
    this.setState({
      panoramaState: false,
      panoramaLoadSuccess: false,
    });
    toastShow(getLocale('panoramaFailed'), { duration: 2000 });
  }

  // ????????????????????????????????????
  onPanoramaSuccess = () => {
    this.setState({ panoramaLoadSuccess: true });
  }

  locationComplete = (data) => {
    if (data === 'false') { // ????????????
      toastShow(getLocale('locationManagerFailed'), { duration: 2000 });
    }
  }

  /**
   * ????????????????????????
   */
  neveronlinemonitorchange = () => {
    // this.setState({ activeLatestPoint: null });
    // const { clearBasicInfoData } = this.props;
    // clearBasicInfoData();
  }

  onClustersClickEvent = (data) => {
    if (Platform.OS === 'ios') {
      this.setState({ clustersData: data, isClustersViewShow: true });
    } else {
      this.setState({ clustersData: JSON.parse(data), isClustersViewShow: true });
    }
  }

  isDomesticLocation = (lat, lng) => (lat >= 3.86 && lat <= 53.55 && lng >= 73.66 && lng <= 135.05);

  /**
   * ??????????????????????????????????????????
   */
  clustersItemClick = (params) => {
    const { monitorId } = params;
    this.setState({ isClustersViewShow: false }, () => {
      this.onPointClickEvent(monitorId);
    });
  }

  /**
   * ??????????????????????????????
   */
  clustersClose = () => {
    this.setState({ isClustersViewShow: false });
  }

  /**
   * ????????????????????????????????????
   */
  getCancelSubscribeMonitors = (monitors) => {
    const subscribeMonitors = this.data.subscribeMonitors;
    const newData = [];
    for (let i = 0; i < monitors.length; i += 1) {
      const id = monitors[i].vehicleId;
      if (subscribeMonitors.indexOf(id) === -1) {
        newData.push(id);
        subscribeMonitors.push(id);
      }
    }
    this.data.subscribeMonitors = subscribeMonitors;
    return newData;
  }

  /**
   *  ???????????????????????????????????????id
   */
  removeUnSubscribeMonitors = (monitors) => {
    const subscribeMonitors = this.data.subscribeMonitors;
    for (let i = 0; i < monitors.length; i += 1) {
      const id = monitors[i].vehicleId;
      const index = subscribeMonitors.indexOf(id);
      if (index !== -1) {
        subscribeMonitors.splice(index, 1);
      }
    }
    this.data.subscribeMonitors = subscribeMonitors;
  }

  jumpMinZoom = () => {
    const { locationManager, mapLocationChange } = this.props;
    if (locationManager) {
      mapLocationChange();
    }
    this.setState({ monitorFocusState: false }, () => {
      this.setState({
        minZoomState: Math.random(),
      });
    });
  }

  render () {
    const {
      commonlyUseViewShow,
      objDetShow,
      mapTrafficEnabled,
      bMapType,
      locationManager,
      // mapLocationChange,
      markers,
      basicLocationInfo,
      detailLocationInfo,
      currentMonitorInfoId,
      mapAmplification,
      mapNarrow,
      monitors,
    } = this.props;

    const {
      otherInfoShow,
      // otherInfoShow: { height: otherInfoShowH },
      alarmIconShow,
      scrollEnabled,
      ifHideModules,
      ifWarnInfoScoket,
      activeMonitorInState,
      refSubInfoViewH,
      monitorFocus,
      aggrNum,
      isHome,
      rollCallDate,
      mapRendered,
      ifZhonghuanWarnScoket,
      adasFlag,
      monitorFocusId,
      monitorFocusState,
      monitorIsFocus,
      scaleAndroidValue,
      // param,
      // isBackground,
      // ifzIndex,
      panoramaState,
      customPanoView,
      panoramaLoadSuccess,
      isClustersViewShow,
      clustersData,
      appStateBackToForeground,
      centerPointState,
      remindInfo,
      remindRedCircle,
      appStateBackground,
      latestPoint,
      latitudeLoading,
      minZoomState,
      dotType,
      dotValue,
    } = this.state;

    const comUseView = commonlyUseViewShow ? styles.comUseOpen : null;
    const otherInfoView = objDetShow ? otherInfoShow : null;
    const ifHide = ifHideModules ? styles.hideModules : null;
    const btmDistance = refSubInfoViewH + 60;
    const compassOpenState = true;
    const btmHeight = this.getBtmHeight();
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <View style={{ flex: 1 }}>
          {/* ????????????begin */}
          <View
            style={styles.homeMapView}
          >
            <View style={[styles.mapBtnView, (commonlyUseViewShow || objDetShow) ? { height: 0, display: 'none', opacity: 0 } : null, ifHide]}>
              <MapBtnView openPanorama={this.openPanorama} />
            </View>
            {latitudeLoading ? <Loading type="page" /> : (
              <MapView
                isHome={isHome}
                trafficEnabled={mapTrafficEnabled}
                bMapType={bMapType}
                locationManager={mapRendered ? locationManager : null}
                markers={mapRendered ? [...markers.values()] : []}
                onInAreaOptions={data => this.onInAreaOptions(data)}
                centerPoint={centerPointState ? currentMonitorInfoId : null}
                onMapInitFinish={() => this.onMapInitFinish()}
                onMapClick={this.mapClick}
                mapAmplification={mapAmplification}
                mapNarrow={mapNarrow}
                onPointClickEvent={data => this.onPointClickEvent(data)}
                monitorFocus={monitorFocus}
                aggrNum={aggrNum}
                latestLocation={rollCallDate}
                appStateBackToForeground={appStateBackToForeground}
                onLocationStatusDenied={data => this.onLocationStatusDenied(data)}
                compassOpenState={compassOpenState}
                baiduMapScalePosition={mapRendered ? `65|${btmHeight}` : null}
                monitorFocusTrack={monitorFocusId === null ? null : `${monitorFocusId}|${monitorFocusState}`}
                onMonitorLoseFocus={() => this.onMonitorLoseFocus()}
                onMyScale={data => this.onMyScale(data)}
                goLatestPoin={latestPoint}
                onLocationSuccess={data => this.locationComplete(data)}
                onClustersClickEvent={data => this.onClustersClickEvent(data)}
                minZoomState={minZoomState}
                dotData={{ dotType, dotValue: typeof dotValue === 'string' ? dotValue : dotValue.toString() }}
              />
            )}
          </View>
          {/* ????????????end */}

          <Animatable.View
            duration={300}
            transition="top"
            style={[styles.searchCont, ifHideModules ? { top: -100 } : null]}
          >
            <Header />
            {
              remindRedCircle
                ? <View style={styles.redCircle} />
                : null
            }
          </Animatable.View>
          {/* ????????????????????? */}
          {
            remindInfo.length > 0 && alarmIconShow && !ifHideModules && !appStateBackground ? (
              <View style={styles.marqueeContainer}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.marqueeTouch}
                  onPress={() => {
                    go('expireMsg');
                  }}
                >
                  <Image
                    style={styles.msgImg}
                    source={msgImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.msgTitle}>{getLocale('remindMsg')}</Text>
                  <MarqueeView
                    style={styles.marqueeView}
                    dataSource={remindInfo}
                    speed={60}
                    labelWidth={width - 160}
                    direction="left"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.closeMsgBox}
                  onPress={this.closeRemind}
                >
                  <Image
                    style={styles.closeMsg}
                    source={closeMsg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            ) : null
          }
          {/* ????????????????????????begin */}
          <Animatable.View
            style={[styles.objInoAreaView, ifHideModules ? { bottom: -btmDistance } : null,
            ]}
            transition="bottom"
          >
            {/* ?????????????????? */}
            <TouchableOpacity
              style={[styles.CNView, !alarmIconShow ? styles.alarmIconShow : null]}
              onPress={this.jumpMinZoom}
            >
              <Image
                style={[styles.CNImage, !alarmIconShow ? styles.alarmIconShow : null]}
                source={CNIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* ????????????begin */}
            <TouchableOpacity
              style={[styles.localtionView, !alarmIconShow ? styles.alarmIconShow : null]}
              onPress={this.locationBtnEvent}
            >
              <Image
                style={[styles.localtionImage, !alarmIconShow ? styles.alarmIconShow : null]}
                source={localtionPng}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* ????????????end */}
            {/* ????????????begin */}
            {
              adasFlag === 1 ? (
                <TouchableOpacity
                  style={[styles.activeSafetyView, !alarmIconShow ? styles.alarmIconShow : null]}
                  onPress={this.activeSafetyBtnEvent}
                >
                  <ImageBackground
                    source={warningBg}
                    style={[
                      { width: 40, height: 40 },
                      !alarmIconShow ? styles.alarmIconShow : null,
                    ]}
                  >
                    {
                      !ifZhonghuanWarnScoket ? (
                        <Image
                          style={[
                            styles.localtionImage,
                            !alarmIconShow ? styles.alarmIconShow : null,
                          ]}
                          source={activeSafetyImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <Image
                          style={[{
                            width: 30, height: 30, top: 5, left: 5,
                          }, !alarmIconShow ? styles.alarmIconShow : null]}
                          source={activeSafetyGif}
                          resizeMode="contain"
                        />
                      )
                    }
                  </ImageBackground>
                </TouchableOpacity>
              ) : null
            }
            {/* ????????????end */}
            {/* ???????????? begin */}
            <TouchableOpacity
              style={[
                styles.waringView,
                ifWarnInfoScoket ? { top: -52, right: 13 } : null,
                !alarmIconShow ? styles.alarmIconShow : null,
              ]}
              onPress={this.debouncetoAlarmCenter}
            >
              <ImageBackground
                source={warningBg}
                style={[{ width: 45, height: 45 }, !alarmIconShow ? styles.alarmIconShow : null, !ifWarnInfoScoket ? { height: 0, display: 'none' } : null]}
              >
                <Image
                  style={[styles.warningImage, {
                    width: 45, height: 45,
                  }, !alarmIconShow ? styles.alarmIconShow : null, !ifWarnInfoScoket ? { height: 0, display: 'none' } : null]}
                  source={alarmgif}
                  resizeMode="contain"
                />

              </ImageBackground>
              <Image
                style={[styles.warningImage, !alarmIconShow ? styles.alarmIconShow : null, ifWarnInfoScoket ? { height: 0, display: 'none' } : null]}
                source={waring}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* ????????????end */}
            {/* ?????????????????????begin */}
            <View {...this.panResponderObj.panHandlers}>
              <View
                ref={(view) => { this.refSubInfoView = view; }}
              >
                <SubInfoView
                  componentOnlayOut={this.componentOnlayOut}
                  basicLocationInfo={basicLocationInfo}
                />
              </View>

            </View>
            <Animatable.View
              duration={300}
              transition="height"
              style={[styles.otherInfoHide, otherInfoView]}
            >
              {/* ?????????????????? */}
              <View {...this.otherInfoHeadpanResponderObj.panHandlers}>
                {
                  activeMonitorInState && JSON.stringify(detailLocationInfo) !== '{}' && (
                    <SubOtherInfoHead
                      detailLocationInfo={detailLocationInfo.monitorConfigs}
                      activeMonitorInState={activeMonitorInState}
                    />
                  )
                }
              </View>
              <View>
                {
                  JSON.stringify(detailLocationInfo) !== '{}'
                  && (
                    <SubOtherInfoView
                      sensors={detailLocationInfo.sensors}
                      detailSensorsHChangeFun={this.detailSensorsHChangeFun}
                      scrollEnabled={scrollEnabled}
                      scrollToToporBtm={this.scrollToToporBtm}
                      otherInfoViewH={otherInfoShow.height}
                    />
                  )
                }

              </View>
            </Animatable.View>
            {/* ?????????????????????end */}
            <Animatable.View
              duration={500}
              transition="height"
              style={[styles.comUseClose, comUseView, ifHide]}
            >
              <View ref={(view) => { this.refToolSlider = view; }}>
                <CompentToolSlider showOrderSend onOrderSendClick={this.rollCallIssued} />
              </View>
            </Animatable.View>

            <Footer
              ref={(view) => { this.refFooter = view; }}
              // style={ifHide}
              onMonitorChange={this.handleMonitorChange}
              onMonitorClick={this.handleMonitorClick}
              onMonitorDbClick={this.handleMonitorDbClick}
              monitors={monitors}
              activeMonitor={activeMonitorInState}
              isFocus={monitorIsFocus}
              neveronlinemonitorchange={(item, index) => {
                this.neveronlinemonitorchange(item, index);
              }}
            />
          </Animatable.View>
          {/* ????????????????????????end */}
          {
            Platform.OS === 'android' ? (
              <View
                style={[styles.scaleAndroidStyle, { bottom: btmHeight - 20 }]}
              >
                <ScaleView scaleValue={scaleAndroidValue} />
              </View>
            ) : null
          }
          {
            panoramaState && Platform.OS === 'ios' ? (
              <View style={[
                styles.panoramaView,
                panoramaLoadSuccess ? { zIndex: 999999999 } : null,
              ]}
              >
                <BaiduPano
                  customPanoView={customPanoView}
                  onPanoramaClose={this.onPanoramaClose}
                  onPanoramaFailed={this.onPanoramaFailed}
                  onPanoramaSuccess={this.onPanoramaSuccess}
                />
              </View>
            ) : null
          }
          <View style={styles.clusterViewStyle}>
            <ClusterMonitor
              clusters={clustersData}
              isClustersViewShow={isClustersViewShow}
              clustersItemClick={this.clustersItemClick}
              clustersClose={this.clustersClose}
            />
          </View>
          <View
            style={{
              width: '100%',
              height: 34,
              position: 'absolute',
              backgroundColor: '#ffffff',
              left: 0,
              bottom: -34,
              zIndex: 1,
            }}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    commonlyUseViewShow: state.getIn(['homeReducers', 'commonlyUseViewShow']),
    objDetShow: state.getIn(['homeReducers', 'objDetShow']),
    mapTrafficEnabled: state.getIn(['homeReducers', 'mapTrafficEnabled']),
    bMapType: state.getIn(['homeReducers', 'bMapType']),
    locationManager: state.getIn(['homeReducers', 'locationManager']),
    markers: state.getIn(['homeReducers', 'monitorInfo']),
    basicLocationInfo: state.getIn(['homeReducers', 'basicLocationInfo']),
    detailLocationInfo: state.getIn(['homeReducers', 'detailLocationInfo']),
    // subMonitorArr: state.getIn(['homeReducers', 'subMonitorArr']),
    socketTime: state.getIn(['homeReducers', 'socketTime']),
    mapZooml: state.getIn(['homeReducers', 'mapZooml']),
    currentMonitorInfoId: state.getIn(['homeReducers', 'currentMonitorInfoId']),
    routerIndex: state.getIn(['homeReducers', 'routerIndex']),
    mapAmplification: state.getIn(['homeReducers', 'mapAmplification']),
    mapNarrow: state.getIn(['homeReducers', 'mapNarrow']),
    monitors: state.getIn(['homeReducers', 'markers']),
    ifGoSecurity: state.getIn(['homeReducers', 'ifGoSecurity']),
    randomNumber: state.getIn(['homeReducers', 'randomNumber']),
    vehicleIds: state.getIn(['homeReducers', 'vehicleIds']),
    searchMarkersStatus: state.getIn(['homeReducers', 'searchMarkersStatus']),
  }),
  dispatch => ({
    mapLocationChange: () => {
      dispatch({ type: 'MAP_LOCATION' });
    },
    getMonitorIds: (activeMonitor, vehicleIds, searchMarkersStatus, fn) => {
      dispatch({
        type: 'home/SAGA/GET_MONITOR_IDS', activeMonitor, vehicleIds, searchMarkersStatus, fn,
      });
    },
    // saveSubInfo: (subParam) => {
    //   dispatch({ type: 'SAVE_SUB_MONITOR', subParam });
    // },
    updateMonitorInfo: (value) => {
      dispatch({ type: 'UPDATE_MARKER_INFO', value });
    },
    updateMonitorAddressInfo: (monitorId) => {
      dispatch({ type: 'home/SAGA/UPDATE_MONITOR_ADDRESS_INFO', monitorId });
    },
    updateBasicAndDetail: (data) => {
      dispatch({ type: 'home/SAGA/UPDATE_MONITOR_INFO', data });
    },
    objDetChange: () => {
      dispatch({ type: 'OBJ_DET_ACTION' });
    },
    comUseShow: () => {
      dispatch({ type: 'COM_USE_ACTION' });
    },
    increaseRouterIndex: () => {
      dispatch({ type: 'HOME/ROUTER_EXIT' });
    },
    reduceRouterIndex: () => {
      dispatch({ type: 'HOME/ROUTER_ENTER' });
    },
    clearData: () => {
      dispatch({ type: 'HOME/DELDATA' });
    },
    clearBasicInfoData: () => {
      dispatch({ type: 'HOME/CLEAR_BASIC' });
    },
    changeCurrentMonitorId: (monitorId) => {
      dispatch({ type: 'CURRENT_MONITOR_INFO_ID', monitorId });
    },
    ifgoSecurity: () => {
      dispatch({ type: 'HOME/SAGA/SECURITY' });
    },
  }),
)(Home);