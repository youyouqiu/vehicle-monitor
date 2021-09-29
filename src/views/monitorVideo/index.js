/* eslint-disable no-param-reassign */
import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Alert,
  AppState,
  Platform,
  NativeModules,
  // DeviceEventEmitter,
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import { convertSeconds } from '../../utils/convertSeconds';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { getLoginState, getLoginAccont } from '../../server/getStorageData';
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';// 底部公共组件
import MapView from './componentMap';// 地图
import SwiperVideo from './swiperVideo';// 视频通道轮播模块
import HandleTool from './handleTool';// 视频操作图标栏
import WebsocketUtil from '../../utils/websocket';
import { monitorIcon } from '../../utils/monitorIcon';
import { toastShow } from '../../utils/toastUtils';
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
import { getBasicLocationInfo, getMsgFun } from '../../server/getData';
import { reset, getMonitor } from '../../utils/routeCondition';
import { isEmpty } from '../../utils/function';
// import httpBaseConfig from '../../utils/env';
// import storage from '../../utils/storage';
// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,255)',
  },
});

class MonitorVideo extends Component {
  // 顶部导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('monitorVideoTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    getVehicleChannels: PropTypes.func.isRequired, // 获取逻辑通道号接口
    channels: PropTypes.object, //  逻辑通道号数据
    // sendParamByBatchAjax: PropTypes.func.isRequired, // 订阅接口
    resetReduxData: PropTypes.func.isRequired, // 重置redux数据
    closeVideoFun: PropTypes.func.isRequired, // 关闭视频
    ifCloseVideo: PropTypes.bool, // 是否成功取消订阅
    vehicleChangeFun: PropTypes.func.isRequired, // 切换车辆
    route: PropTypes.object.isRequired,
    userName: PropTypes.string.isRequired,
    // 地图模块
    socketTime: PropTypes.number,
    route: PropTypes.object.isRequired,
    // updateMonitorInfo: PropTypes.func,
    // markers: PropTypes.object,
    navigation: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
    channels: null,
    ifCloseVideo: null,
    socketTime: 0,
    // updateMonitorInfo: null,
    // markers: [],
  }


  constructor(props) {
    super(props);
    const {
      monitors, route: { params }, userName,
    } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const d = new Date();
    const randomNum = d.getTime();
    const currentUser = userName + randomNum;
    const monitorsValue = [...monitors.values()];

    // 初始化websocket对象
    this.state = {
      slideUp: false,
      vehicleId: activeMonitor.markerId || monitorsValue[0].markerId, // 当前所选监控对象的id
      brand: activeMonitor.title || monitorsValue[0].title, // 当前所选监控对象的车牌号
      channels: [], // 通道号
      subscribeData: [], // 订阅成功后返回数据
      currentChooseVideoNum: 0, // 当前选中的播放窗口
      swiperIndex: 0, // 视频滑动页面标识索引
      BtmplayFlag: false, // 底部播放按钮
      cameraFlag: false, // 底部拍照
      screenFlag: false, // 全屏
      audioFlag: true, // 音频开启

      isUp: null, // 底部公共组件展开状态
      mapShow: false, // 地图显示状态
      subMonitorVehicleId: null, // 存贮已订阅的车辆
      removeAnnotation: null, // 存贮删除的车点标注
      trackingId: null, // 车标注移动后把位置拉到地图中心点
      monitorSubInfo: [], // 监控对象订阅数据
      activeMonitor,
      accont: currentUser,
      accontVideo: userName,
      latestPoint: null,
      playMessage: null, // 播放连接成功后需传递的msg信息
      isStopVideo: false,
    };

    this.getPlayMessage();
    // this.subMonitorFunc(monitorsValue[0].markerId);
    AppState.addEventListener('change', this.handleAppStateChange);

    onConnectionChange((type) => { this.netWorkonChange(type); });
  }

  componentDidMount () {
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const monitorsValue = [...monitors.values()];
    setTimeout(() => {
      this.getChannels(activeMonitor.markerId || monitorsValue[0].markerId);
    }, 1000);
    setTimeout(() => {
      NativeModules.IdleTimerModule.open();
    }, 2000);
    // 收到路由跳转监听监听
    // this.listener = DeviceEventEmitter.addListener('stopVideo', (message) => {
    //   // 收到监听后判断video组件是否加载
    //   console.log(message, 'messageStopVideo');
    //   if (message === 1 || message === 22) {
    //     this.setState({ isStopVideo: false }, () => {
    //     });
    //   } else {
    //     this.setState({ isStopVideo: true }, () => {
    //       this.closeAllVideo();
    //       this.playOrPauseFun(true);
    //     });
    //   }
    // });
    // eslint-disable-next-line react/destructuring-assignment
    this.didFocus = this.props.navigation.addListener('focus', this.didFocusNavigation);
    // eslint-disable-next-line react/destructuring-assignment
    this.didBlur = this.props.navigation.addListener('blur', this.didBlurNavigation);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    // const subscribeDataPre = this.props.subscribeData;
    const {
      channels, ifCloseVideo,
    } = nextProps;
    const channelsObj = JSON.parse(JSON.stringify(channels));
    if (channelsObj === null) { // 重置数据
      this.setState({
        channels: [],
        subscribeData: [],
        ifCloseVideo: false,
        currentChooseVideoNum: 0,
        BtmplayFlag: false,
      });
      return;
    }

    if (channelsObj !== null) { // 通道号数据变化
      const channelsData = [];
      let ifVehicleOnline = true;
      let ifSupportDevice = true;
      channelsObj.forEach((element) => {
        if (element.status === 3) {
          ifVehicleOnline = false;
        } else if (!this.isSupportDevice(element.deviceType)) {
          ifSupportDevice = false;
        }
        if (element.channelType !== 1) {
          const ele = element;
          ele.socketUrl = '';
          ele.playFlag = false;
          ele.ifOpenSuccess = false;// 是否成功播放

          ele.audioSampling = null; // 音频采样率
          ele.ifOpenAudio = false; // 是否播放音频

          ele.ifCapture = false; // 是否拍照

          channelsData.push(ele);
        }
      });
      if (ifVehicleOnline && ifSupportDevice) {
        this.setState({
          channels: channelsData,
        }, () => {
          if (!ifCloseVideo) { // 订阅数据变化
            this.openVideo();
          }
        });
      } else {
        if (!ifVehicleOnline) {
          toastShow(getLocale('vehicleNotOnline'), { duration: 2000 });
        }
        if (!ifSupportDevice) {
          toastShow(getLocale('vehicleNotSupportViedo'), { duration: 2000 });
        }
      }
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount () {
    NativeModules.IdleTimerModule.close();
    if (Platform.OS === 'android') {
      NativeModules.BaiduMapModule.show(Math.random());
    }
    this.cancelSub();
    const { resetReduxData } = this.props;
    this.closeAllVideo();
    resetReduxData();
    removeConnectionChange();
    // 移除监听
    // if (this.listener) { this.listener.remove(); }
    // this.didFocus();
    // this.didBlur();
  }

  didFocusNavigation = () => {
    this.setState({ isStopVideo: false }, () => {
      const { monitors, route: { params } } = this.props;
      let activeMonitor;
      if (params) {
        activeMonitor = params.activeMonitor;
      }
      const monitorsValue = monitors ? [...monitors.values()] : [{}];
      setTimeout(() => {
        this.getChannels(activeMonitor.markerId || monitorsValue[0].markerId);
      }, 1000);
      setTimeout(() => {
        NativeModules.IdleTimerModule.open();
      }, 2000);
    });
  }

  didBlurNavigation = () => {
    console.log('didBlurNavigation');
    this.setState({ isStopVideo: true }, () => {
      NativeModules.IdleTimerModule.close();
      if (Platform.OS === 'android') {
        NativeModules.BaiduMapModule.show(Math.random());
      }
      this.cancelSub();
      const { resetReduxData } = this.props;
      this.closeAllVideo();
      resetReduxData();
      removeConnectionChange();
    });
  }

  // 获取视频播放所需msg信息
  getPlayMessage = async () => {
    const { vehicleId } = this.state;
    const result = await getMsgFun({ monitorId: vehicleId });
    if (result) {
      this.setState({
        playMessage: result.obj,
      });
    }
  }

  // 判断该协议是否有音视频权限
  isSupportDevice = (newType) => {
    let result = true;
    switch (newType) {
      case '2':
      case '3':
      case '5':
      case '8':
      case '9':
      case '10':
      case '6':
      case '22':
        result = false;
        break;
      default:
        break;
    }
    return result;
  }

  // 网络变化
  netWorkonChange = (type) => {
    if (type === 'none') {
      this.closeAllVideo();
    }
    if (type === 'cellular') {
      this.closeAllVideo();
      Alert.alert(
        getLocale('flowRemind'),
        getLocale('ifContinueVideo'),
        [
          { text: getLocale('personalAlertCancle'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
          {
            text: getLocale('personalAlertSure'),
            onPress: () => {
              // const { subscribeData } = this.state;
              this.sendParamByBatch();
            },
          },
        ],
      );
    }
    if (type !== 'none' || type !== 'unknown') {
      if (!WebsocketUtil.conFlag) {
        this.subscribeFun();
      }
    }
  }

  subscribeFun = () => {
    setTimeout(() => {
      if (WebsocketUtil.conFlag) {
        this.againSubJdge();
      } else {
        this.subscribeFun();
      }
    }, 1000);
  }

  toggleAudioFun = () => {
    const { audioFlag, channels, currentChooseVideoNum } = this.state;
    const copyChannels = cloneDeep(channels);
    copyChannels.forEach((ele, index) => {
      copyChannels[index].ifOpenAudio = false;
      if (!audioFlag && copyChannels[index].physicsChannel === currentChooseVideoNum) {
        copyChannels[index].ifOpenAudio = true;
      }
    });
    this.setState({
      audioFlag: !audioFlag,
      channels: copyChannels,
    });
  }

  // 音频采样率
  audioSamplingFun = (num) => {
    let resNum = 8000;
    if (num === 0) {
      resNum = 8000;
    }
    if (num === 1) {
      resNum = 22050;
    }
    if (num === 2) {
      resNum = 44100;
    }
    if (num === 3) {
      resNum = 48000;
    }
    return resNum;
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      this.closeAllVideo();
      // this.cancelSub();
      // this.jumpHome('home');
    } else if (nextAppState === 'active') {
      const { vehicleId } = this.state;
      getBasicLocationInfo({ id: vehicleId }).then((res) => {
        if (res.statusCode === 200) {
          const coordinates = bdEncrypt(res.obj.longitude, res.obj.latitude);
          const time = convertSeconds(res.obj.time);
          this.setState({
            latestPoint: [{
              monitorId: vehicleId,
              longitude: coordinates.bdLng,
              latitude: coordinates.bdLat,
              time,
              title: res.obj.name,
              status: res.obj.status,
              index: Math.random(),
            }],
          });
        }
        if (!WebsocketUtil.conFlag) {
          this.subscribeFun();
        }
      });
    }
  }

  // 跳转首页
  jumpHome = (key) => {
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }
    reset(key);
  }

  // 获取当前监控对象信息
  getVehicleInfo = () => {

  }


  // 获取监控对象的逻辑通道号
  getChannels = (id) => {
    const { getVehicleChannels } = this.props;
    if (typeof getVehicleChannels === 'function') {
      getVehicleChannels({ id });
    }
  }

  // 切换地图显示状态
  toggleMap = (mapShow) => {
    const { slideUp, vehicleId, subMonitorVehicleId } = this.state;
    const ifIsup = mapShow ? null : false;
    // this.setState({ slideUp: !slideUp });
    this.setState({
      isUp: ifIsup,
      slideUp: !slideUp,
      mapShow: !mapShow,
    }, () => {
      if (!mapShow && vehicleId !== subMonitorVehicleId) {
        getBasicLocationInfo({ id: vehicleId }).then((res) => {
          if (res.statusCode === 200) {
            const monitorType = res.obj.type;
            const objIcon = monitorIcon(monitorType, res.obj.ico);
            const coordinates = bdEncrypt(res.obj.longitude, res.obj.latitude);
            const time = convertSeconds(res.obj.time);
            const i = Math.floor((Number(res.obj.angle) + 270) / 360);
            const angle = (Number(res.obj.angle) + 270) - 360 * i;
            const value = [{
              markerId: vehicleId,
              latitude: coordinates.bdLat,
              longitude: coordinates.bdLng,
              title: res.obj.name,
              ico: objIcon,
              speed: 30,
              status: res.obj.status,
              angle,
              time,
            }];
            this.setState({ monitorSubInfo: value });
          }
          this.subMonitorFunc(vehicleId);
        });
      }
    });
  }

  // 底部公共组件展开回调
  toolBarExpand = () => {
    this.setState({
      slideUp: false,
      mapShow: false,
      isUp: null,
    });
  }

  /**
   * 订阅实时视频
   */
  sendParamByBatch = async () => {
    const {
      channels, swiperIndex,
    } = this.state;

    const newChannels = cloneDeep(channels);
    // 每次订阅四个视频
    const channelsLen = newChannels.length;
    const startLen = swiperIndex * 4;
    let endLen;
    if ((swiperIndex * 4 + 4) > channelsLen) {
      endLen = channelsLen;
    } else {
      endLen = swiperIndex * 4 + 4;
    }
    for (let index = startLen; index < endLen; index += 1) {
      const obj = {};
      if (newChannels[index].channelType !== 1) {
        obj.number = newChannels[index].logicChannel;
        obj.streamType = newChannels[index].streamType;
        obj.channelType = newChannels[index].channelType;
      }
    }
  }

  // 播放全部视频
  openVideo = () => {
    const { channels, swiperIndex, audioFlag } = this.state;
    const newChannels = cloneDeep(channels);

    // 每次播放四个视频
    const channelsLen = newChannels.length;
    const startLen = swiperIndex * 4;
    let endLen;
    if ((swiperIndex * 4 + 4) > channelsLen) {
      endLen = channelsLen;
    } else {
      endLen = swiperIndex * 4 + 4;
    }


    for (let index = startLen; index < endLen; index += 1) {
      newChannels[index].ifOpenAudio = false;
      newChannels[index].playFlag = true;
    }

    let num = 0;
    for (let index = 0; index < newChannels.length; index += 1) {
      if (newChannels[index].playFlag) {
        num = newChannels[index].physicsChannel;
        if (audioFlag) {
          newChannels[index].ifOpenAudio = true;
        }
        break;
      }
    }
    setTimeout(() => {
      this.setState({
        channels: newChannels,
        currentChooseVideoNum: num,
      });
    }, 300);
  }

  /**
   * 底部播放停止切换
   */
  playOrPauseFun = (playFlag) => {
    const { currentChooseVideoNum, channels } = this.state;
    const newChannels = cloneDeep(channels);
    if (playFlag) { // 取消订阅
      newChannels.forEach((val, index) => {
        if (val.physicsChannel === currentChooseVideoNum) {
          // 取消订阅
          const { closeVideoFun } = this.props;
          if (typeof closeVideoFun === 'function') {
            newChannels[index].playFlag = false;
          }
        }
      });

      this.setState({
        channels: newChannels,
      });
    } else {
      newChannels.forEach((val) => {
        if (val.physicsChannel === currentChooseVideoNum) {
          // 重新订阅
          this.againSubscribe(val.logicChannel);
        }
      });
    }
  }

  /**
   * 取消订阅所有视频
   */
  closeAllVideo = () => {
    const { channels, subscribeData } = this.state;
    if (channels && channels.length && subscribeData) {
      const copyChannels = cloneDeep(channels);
      copyChannels.forEach((ele, index) => {
        copyChannels[index].playFlag = false;
      });
      this.setState({
        channels: copyChannels,
      });
    }
  }

  // 重新订阅单个视频
  againSubscribe = (currentNum) => {
    const { channels } = this.state;
    const setChannels = channels;
    channels.forEach((val, index) => {
      if (val.logicChannel === currentNum) {
        const obj = {};
        obj.number = val.logicChannel;
        obj.streamType = val.streamType;
        obj.channelType = val.channelType;

        setChannels[index].playFlag = true;
      }
    });

    this.setState({
      channels: setChannels,
    });
  }

  /**
   * 视频滑动
   */
  onSwiperIndexChange = (index) => {
    this.closeAllVideo();
    this.setState({
      swiperIndex: index,
    }, () => {
      // const { subscribeData } = this.state;
      // this.openVideo(subscribeData);
      this.sendParamByBatch();
    });
  }

  /**
   * 刷新视频
   */
  refreshVideoFun = (item) => {
    // const { currentChooseVideoNum } = this.state;

    this.setState({
      currentChooseVideoNum: item.physicsChannel,
    }, () => {
      this.againSubscribe(item.logicChannel);
    });
  }

  /**
   * 将视频组建中当前选中的存到state中
   */
  currentVideoFun = (item) => {
    const { channels, audioFlag } = this.state;
    const newChannels = cloneDeep(channels);
    newChannels.forEach((ele, index) => {
      newChannels[index].ifOpenAudio = false;
      if (audioFlag && newChannels[index].physicsChannel === item.physicsChannel) {
        newChannels[index].ifOpenAudio = true;
      }
    });

    this.setState({
      currentChooseVideoNum: item.physicsChannel,
      // playFlag,
      BtmplayFlag: item.ifOpenSuccess,
      channels: newChannels,
    });
  }

  /**
  * 播放状态改变
  */
  videoStateChangeFun = (item, state) => {
    const { channels, currentChooseVideoNum } = this.state;
    const copyChannels = cloneDeep(channels);
    for (let index = 0; index < copyChannels.length; index += 1) {
      if (copyChannels[index].logicChannel === item.logicChannel) {
        if (state === 3) {
          copyChannels[index].ifOpenSuccess = true;
        } else {
          copyChannels[index].ifOpenSuccess = false;

          // 这一段当视频播放不成功或者关闭时再次取消订阅
          if (state === 1 || state === 2 || state === 4) {
            const { closeVideoFun } = this.props;
            if (typeof closeVideoFun === 'function') {
              copyChannels[index].playFlag = false;
            }
          }
        }
      }
    }

    const iftrue = state === 3;

    if (item.physicsChannel === currentChooseVideoNum) {
      this.setState({
        channels: copyChannels,
        BtmplayFlag: iftrue,
      });
    } else {
      this.setState({
        channels: copyChannels,
      });
    }
  }

  /**
   * 底部拍照
   */
  refCaptureFun = (cameraFlag) => {
    if (!cameraFlag) {
      const { currentChooseVideoNum, channels } = this.state;
      const newChannels = cloneDeep(channels);

      let canCamera = true;

      newChannels.forEach((val, index) => {
        if (val.physicsChannel === currentChooseVideoNum) {
          if (val.ifOpenSuccess === false) {
            canCamera = false;
          } else {
            newChannels[index].ifCapture = true;
          }
        }
      });

      if (canCamera) {
        this.setState({
          channels: newChannels,
          cameraFlag: true,
        });
      }
    }
  }

  /**
   * 拍照回调
   */
  captureCallback = (item, success) => {
    const { channels } = this.state;
    const newChannels = cloneDeep(channels);

    newChannels.forEach((val, index) => {
      newChannels[index].ifCapture = false;
    });
    this.setState({
      channels: newChannels,
      cameraFlag: false,
    });

    const { physicsChannel } = item;
    if (success) {
      Alert.alert(`通道${physicsChannel}拍照成功\n请进入手机相册查看`);
    } else {
      Alert.alert(`通道${physicsChannel}拍照失败`);
    }
  }

  // 底部监控对象滑动触发事件 item 当前对象，index索引
  toolBarOnChange = (item) => {
    this.closeAllVideo();
    const { markerId, title } = item;

    const { channels, subscribeData, accontVideo } = this.state;
    const paramData = [];
    if (channels && subscribeData) {
      channels.forEach((val) => {
        if (val.playFlag) {
          const { closeVideoFun } = this.props;
          if (typeof closeVideoFun === 'function') {
            const { id, logicChannel, channelType } = val;
            const param = {
              vehicleId: id,
              userName: accontVideo,
              channelNum: logicChannel,
              orderType: 15,
              control: 0,
              closeVideoType: 0,
              changeStreamType: 0, // 固定为0
              channelType,
              requestType: 0,
            };
            paramData.push(param);
          }
        }
      });
    }

    const payloadData = {
      param: paramData,
      vehicleId: markerId,
      userName: accontVideo,
    };

    const { vehicleChangeFun } = this.props;
    if (typeof vehicleChangeFun === 'function') {
      vehicleChangeFun(payloadData);
    }

    this.setState({
      vehicleId: markerId,
      brand: title,
      screenFlag: false,
      activeMonitor: item,
      swiperIndex: 0,
    }, () => {
      this.getPlayMessage();
    });
  }

  // 地图部分begin

  // 订阅监控对象信息
  subAddressFunc = (vehicleId, token, accont) => {
    const { socketTime } = this.props;
    const headers = { access_token: token };
    const param = [vehicleId];
    const request = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: param,
    };

    setTimeout(() => {
      const { route: { key } } = this.props;
      WebsocketUtil.subscribe(headers, '/user/topic/location',
        this.subCallBack, '/app/location/subscribe', request, key);
    }, 1000);
  }

  // 位置信息订阅成功
  subCallBack = (msg) => {
    const data = JSON.parse(msg.body);
    const { vehicleId } = this.state;
    /* eslint prefer-destructuring:off */
    if (data.desc !== 'neverOnline') {
      const msgBody = data.data.msgBody;
      // 组装监控对象地图更新数据
      if (vehicleId === msgBody.monitorInfo.monitorId) {
        const monitorType = msgBody.monitorInfo.monitorType;
        const objIcon = monitorIcon(monitorType, msgBody.monitorInfo.monitorIcon);
        const coordinates = bdEncrypt(msgBody.longitude, msgBody.latitude);
        const time = convertSeconds(msgBody.gpsTime);

        const i = Math.floor((Number(msgBody.direction) + 270) / 360);
        const angle = (Number(msgBody.direction) + 270) - 360 * i;

        const value = [{
          markerId: msgBody.monitorInfo.monitorId,
          latitude: coordinates.bdLat,
          longitude: coordinates.bdLng,
          title: msgBody.monitorInfo.monitorName,
          ico: objIcon,
          speed: 10,
          status: msgBody.stateInfo,
          angle,
          time,
        }];

        this.setState({ monitorSubInfo: value });


        // const monitorMap = new Map();
        // monitorMap.set(msgBody.monitorInfo.monitorId, value);

        // const {
        //   updateMonitorInfo,
        // } = this.props;
        // updateMonitorInfo(monitorMap);

        // 订阅完成后将订阅的车辆存在 subMonitorVehicleId中
        this.setState({
          subMonitorVehicleId: msgBody.monitorInfo.monitorId,
          trackingId: msgBody.monitorInfo.monitorId,
        });
      }
    }
  }

  toggleScreenFun = () => {
    const { screenFlag, currentChooseVideoNum } = this.state;
    if (currentChooseVideoNum !== 0) {
      this.setState({
        screenFlag: !screenFlag,
      });
    }
  }


  fullScreenFun = (bool) => {
    this.setState({
      screenFlag: bool,
    });
  }

  // 取消订阅位置信息
  unSubAddressFunc (vehicleId, token, accont) {
    const headers = { access_token: token };
    const unParam = [];
    unParam.push({
      vehicleId,
    });
    const unRequset = {
      desc: {
        MsgId: 40964,
      },
      data: unParam,
    };
    if (unParam.length > 0) {
      const { route: { key } } = this.props;
      WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, '/user/topic/location', key);

      this.setState({
        removeAnnotation: vehicleId,
      });
    }
  }

  //  订阅监控对象位置信息
  async subMonitorFunc (vehicleId) {
    const { subMonitorVehicleId } = this.state;

    const state = await getLoginState();
    const userInfo = await getLoginAccont();
    //  const state = await storage.load({
    //    key: 'loginState',
    //  });
    //  const userInfo = await storage.load({
    //    key: 'loginAccont',
    //  });

    // 取消之前订阅的监控对象
    if (subMonitorVehicleId) {
      this.unSubAddressFunc(
        subMonitorVehicleId,
        state.token,
        userInfo[0].accont,
      );
    }

    // 订阅监控对象
    this.subAddressFunc(
      vehicleId,
      state.token,
      userInfo[0].accont,
    );
  }

  async againSub () {
    const state = await getLoginState();
    const userInfo = await getLoginAccont();
    const {
      vehicleId,
    } = this.state;
    const token = state.token;
    const accont = userInfo[0].accont;
    const headers = { access_token: token };
    const { socketTime } = this.props;
    const param = [vehicleId];
    const request = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: param,
    };
    const { route: { key } } = this.props;
    WebsocketUtil.subscribe(headers, '/user/topic/location',
      this.subCallBack.bind(this), '/app/location/subscribe', request, key);
  }

  // 取消订阅
  async cancelSub () {
    const state = await getLoginState();
    const userInfo = await getLoginAccont();
    const {
      vehicleId,
    } = this.state;

    const { socketTime } = this.props;
    const token = state.token;
    const accont = userInfo[0].accont;
    const headers = { access_token: token };
    const unRequset = {
      desc: {
        MsgId: 40964,
      },
      data: [{ vehicleId }],
    };
    // 取消位置信息订阅
    const { route: { key } } = this.props;
    WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, '/user/topic/location', key);
  }

  // 避免socket重复建立连接，轮询判断reconnectionState是否为true
  againSubJdge () {
    this.againSub();
  }

  // 地图部分end


  render () {
    const {
      slideUp,
      channels,
      brand,
      currentChooseVideoNum,
      BtmplayFlag,
      cameraFlag,
      isUp,
      mapShow,
      removeAnnotation,
      trackingId,
      monitorSubInfo,
      screenFlag,
      activeMonitor,
      audioFlag,
      swiperIndex,
      latestPoint,
      playMessage,
      isStopVideo,
    } = this.state;
    const {
      monitors,
      //  activeMonitor,
      // markers,
    } = this.props;
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          <MapView
            slideUp={slideUp}
            videoMarker={monitorSubInfo}
            removeAnnotation={removeAnnotation}
            trackingId={trackingId}
            mapShow={mapShow}
            goLatestPoin={latestPoint}
          />
          <SwiperVideo
            channels={channels}
            brand={brand}
            currentChooseVideoNum={currentChooseVideoNum}
            currentVideoFun={this.currentVideoFun}
            onSwiperIndexChange={this.onSwiperIndexChange}
            swiperIndex={swiperIndex}
            refreshVideoFun={this.refreshVideoFun}
            videoStateChangeFun={this.videoStateChangeFun}
            captureCallback={this.captureCallback}
            screenFlag={screenFlag}
            fullScreenFun={this.fullScreenFun}
            playMessage={playMessage}
            isStopVideo={isStopVideo}
          />
          <HandleTool
            toggleMap={this.toggleMap}
            playOrPauseFun={this.playOrPauseFun}
            playFlag={BtmplayFlag}
            cameraFlag={cameraFlag}
            refCaptureFun={this.refCaptureFun}
            mapShow={mapShow}
            screenFlag={screenFlag}
            toggleScreenFun={this.toggleScreenFun}
            currentChooseVideoNum={currentChooseVideoNum}
            audioFlag={audioFlag}
            toggleAudioFun={this.toggleAudioFun}
          />
          <ToolBar
            monitors={monitors}
            activeMonitor={activeMonitor}
            isUp={isUp}
            onChange={this.toolBarOnChange}
            onExpand={this.toolBarExpand}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    channels: state.getIn(['monitorVideoReducers', 'channels']),
    ifCloseVideo: state.getIn(['monitorVideoReducers', 'ifCloseVideo']),

    socketTime: state.getIn(['monitorVideoReducers', 'socketTime']),
    // markers: state.getIn(['monitorVideoReducers', 'monitorInfo']),
  }),
  dispatch => ({
    getVehicleChannels: (payload) => {
      dispatch({ type: 'video/SAGA/GETCHANNEL_ACTION', payload });
    },
    sendParamByBatchAjax: (payload) => {
      dispatch({ type: 'video/SAGA/SUBSCRIBE_ACTION', payload });
    },
    resetReduxData: () => {
      dispatch({ type: 'video/RESET_ACTION' });
    },
    closeVideoFun: (payload) => {
      dispatch({ type: 'video/SAGA/CLOSE_ACTION', payload });
    },
    vehicleChangeFun: (payload) => {
      dispatch({ type: 'video/SAGA/CHANGEVEHICLE_ACTION', payload });
    },
    subscribeSuccess: (payload) => {
      dispatch({ type: 'video/SUBSCRIBE_SUCCESS_ACTION', payload });
    },
  }),
)(MonitorVideo);
