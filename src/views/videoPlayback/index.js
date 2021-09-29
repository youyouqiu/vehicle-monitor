import React, { Component } from 'react';
import { is } from 'immutable';
import {
  Alert,
  View,
  StyleSheet,
  Platform,
  AppState,
  NativeModules,
  // DeviceEventEmitter,
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';// 底部公共组件
import HandleTool from './handleTool';// 视频操作图标栏
import TimeArea from './timeArea';// 视频操作图标栏
import VideoItem from './videoItem';// 音视频通道窗口
import MapWraper from './mapWraper';// 地图模块
import Loading from '../../common/loading';
import {
  onConnectionChange, removeConnectionChange, isConnected,
} from '../../utils/network';
import { toastShow } from '../../utils/toastUtils';// 导入toast
import {
  isEmpty, second2Hms,
} from '../../utils/function';
import { getCurAccont, getLoginState } from '../../server/getStorageData';
import WebsocketUtil from '../../utils/websocket';
import { reset, getMonitor, clearHistoryRouter } from '../../utils/routeCondition';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,255)',
  },
  toolBarBasic: {
    backgroundColor: 'white',
  },
  toolBar: {
    position: 'relative',
  },
  toolBarAbs: {
    position: 'absolute',
    bottom: 0,
    zIndex: 99,
  },
  timeArea: {
    height: 190,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  timeAreaFullScreen: {
    height: 0,
    paddingBottom: 0,
  },

});

class VideoPlayback extends Component {
  // 顶部导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('videoPlayback'),
  )


  static propTypes = {
    monitors: PropTypes.object,
    activeMonitor: PropTypes.object,
    currentMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    oneDayMsgNum: PropTypes.number,
    oneDayMsgNumSocket: PropTypes.number,
    channelNames: PropTypes.object,
    currentChannelName: PropTypes.number,
    sTime: PropTypes.object,
    eTime: PropTypes.object,
    unique: PropTypes.string, // 订阅数据
    showMap: PropTypes.bool.isRequired, // 地图显示状态
    historyLocation: PropTypes.object.isRequired, // 位置数据
    sending9202: PropTypes.bool.isRequired, // 是否开始播放
    startTime: PropTypes.object.isRequired,
    endTime: PropTypes.object.isRequired,
    oneDayCurrent: PropTypes.object.isRequired,
    oneDay: PropTypes.object.isRequired,
    hasVideo: PropTypes.bool.isRequired,
    currentTime: PropTypes.object.isRequired,
    isFullScreen: PropTypes.bool.isRequired,
    btmplayFlag: PropTypes.bool.isRequired,
    cameraFlag: PropTypes.bool.isRequired,
    audioFlag: PropTypes.bool.isRequired,
    timeType: PropTypes.string.isRequired,
    progressStartTime: PropTypes.number.isRequired,
    progressEndTime: PropTypes.number.isRequired,
    channelTaken: PropTypes.bool.isRequired,
    videoPrompt: PropTypes.string.isRequired,
    video15Day1: PropTypes.object.isRequired,
    video15Day2: PropTypes.object.isRequired,
    onConstruct: PropTypes.func.isRequired,
    onInit: PropTypes.func.isRequired,
    onInitTime: PropTypes.func.isRequired,
    onChannelChange: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired, // 订阅接口
    onInitTrack: PropTypes.func.isRequired, // 获取位置数据
    onMapClose: PropTypes.func.isRequired, // 关闭地图
    closeVideoFun: PropTypes.func.isRequired, // 取消订阅
    onFullScreenChange: PropTypes.func.isRequired,
    onPlayChange: PropTypes.func.isRequired,
    onCameraChange: PropTypes.func.isRequired,
    onAudioChange: PropTypes.func.isRequired,
    onCurrentTimeChange: PropTypes.func.isRequired,
    onStep: PropTypes.func.isRequired,
    onOneDayChangeFailed: PropTypes.func.isRequired,
    onTimeTypeChange: PropTypes.func.isRequired,
    // onSubscribe: PropTypes.func.isRequired,
    onGetOneDay: PropTypes.func.isRequired,
    onGet15Day: PropTypes.func.isRequired,
    playInfo: PropTypes.object,
    resetReduxData: PropTypes.func.isRequired, // 重置redux数据
    route: PropTypes.object.isRequired,
    navigation: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
    oneDayMsgNum: null,
    oneDayMsgNumSocket: null,
    channelNames: null,
    currentChannelName: null,
    activeMonitor: null,
    currentMonitor: 'abc',
    sTime: null,
    eTime: null,
    unique: null,
    playInfo: null,
  }

  state = {
    isUp: false, // 底部公共组件展开状态
    startTime: null, // 查询开始时间
    endTime: null, // 查询结束时间
    currentTime: null, // 当前播放时间
    oneDayMsgNumSocket: null, // state 中保存的oneDayMsgNum，这是当socket返回时携带的流水号
    playState: false,
    token: null,
    // isStopVideo: false,
  }

  data = {
    interval: null, // 播放进度条定时器
    timeoutId: null, // 查询一天数据超时id
    segmentIndex: null,
    lastVideoState: null, // 视频播放状态
    subscribeOneDay: null,
    subscribe15Day: null,
    offlineTime: null, // 上次断网时间，如果断网30秒以内再次点击播放，先下发一个9202
  }

  constructor(props) {
    super(props);
    const {
      route: { params }, monitors, sTime, eTime, onConstruct,
    } = this.props;

    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }

    const startTime = isEmpty(sTime) ? new Date(new Date().setHours(0, 0, 0, 0)) : sTime;
    const endTime = isEmpty(eTime) ? new Date() : eTime;
    const firstMonitor = monitors ? monitors.get(0) : [{}];
    let currentMonitor = null;

    if (activeMonitor === null) {
      currentMonitor = firstMonitor;
    } else {
      // eslint-disable-next-line max-len
      const monitor = monitors ? monitors.find(x => x.markerId === activeMonitor.markerId) : undefined;
      if (monitor === undefined) {
        currentMonitor = firstMonitor;
      } else {
        currentMonitor = monitor;
      }
    }
    this.videoSocketConnect();

    onConstruct({
      currentMonitor,
      startTime,
      endTime,
    });
  }

  // socket建立连接
  async videoSocketConnect () {
    const state = await getLoginState();
    const headers = { access_token: state.token };
    this.setState({
      token: state.token,
    });
    const { onInit } = this.props;

    this.subscribeResource();
    onInit({ socket: WebsocketUtil, headers, timeoutCB: this.timeoutCB });
  }

  componentDidMount () {
    // const { onInit } = this.props;
    AppState.addEventListener('change', this.handleAppStateChange);
    setTimeout(() => {
      onConnectionChange((type) => { this.netWorkonChange(type); });
    }, 2000);
    setTimeout(() => {
      NativeModules.IdleTimerModule.open();
    }, 2000);
    // 收到路由跳转监听监听
    // this.listener = DeviceEventEmitter.addListener('stopBackVideo', (message) => {
    //   // 收到监听后判断video组件是否加载
    //   console.log(message, 'messageStopBackVideo');
    //   if (message === 1 || message === 21) {
    //     this.setState({ isStopVideo: false });
    //   } else {
    //     this.setState({ isStopVideo: true });
    //   }
    // });
    // this.didFocus = this.props.navigation.addListener('focus', this.didFocusNavigation);
    // this.didBlur = this.props.navigation.addListener('blur', this.didBlurNavigation);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { channelTaken: prevChannelTaken } = this.props;
    const {
      btmplayFlag,
      // oneDayMsgNum,
      // oneDayMsgNumSocket,
      channelTaken,
      currentChannelName,
    } = nextProps;

    if (btmplayFlag !== true && this.data.interval !== null) {
      clearInterval(this.data.interval);
      this.data.interval = null;
    }

    // if (oneDayMsgNum !== oneDayMsgNumSocket) {
    //   this.getOneDayTimeout();
    // }
    if (channelTaken === true && prevChannelTaken === false) {
      toastShow(getLocale('channelTaken').replace('$c', currentChannelName), { duration: 2000 });
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
    const { btmplayFlag, resetReduxData } = this.props;

    // 取消订阅
    this.unSubscribeResource();
    AppState.removeEventListener('change', this.handleAppStateChange);
    removeConnectionChange();
    if (btmplayFlag === true) {
      this.stop(true);
    }
    resetReduxData();
    // 移除监听
    // if (this.listener) { this.listener.remove(); }
    // this.didFocus();
    // this.didBlur();
  }

  didFocusNavigation = () => {
    this.setState({ isStopVideo: true }, () => {
      setTimeout(() => {
        onConnectionChange((type) => { this.netWorkonChange(type); });
      }, 2000);
      setTimeout(() => {
        NativeModules.IdleTimerModule.open();
      }, 2000);
      const {
        route: { params }, monitors, sTime, eTime, onConstruct,
      } = this.props;
      let activeMonitor;
      if (params) {
        activeMonitor = params.activeMonitor;
      }
      const startTime = isEmpty(sTime) ? new Date(new Date().setHours(0, 0, 0, 0)) : sTime;
      const endTime = isEmpty(eTime) ? new Date() : eTime;
      const firstMonitor = monitors ? monitors.get(0) : [{}];
      let currentMonitor = null;
      if (activeMonitor === null) {
        currentMonitor = firstMonitor;
      } else {
        // eslint-disable-next-line max-len
        const monitor = monitors ? monitors.find(x => x.markerId === activeMonitor.markerId) : undefined;
        if (monitor === undefined) {
          currentMonitor = firstMonitor;
        } else {
          currentMonitor = monitor;
        }
      }
      this.videoSocketConnect();
      onConstruct({
        currentMonitor,
        startTime,
        endTime,
      });
    });
  }

  didBlurNavigation = () => {
    this.setState({ isStopVideo: false }, () => {
      NativeModules.IdleTimerModule.close();
      if (Platform.OS === 'android') {
        NativeModules.BaiduMapModule.show(Math.random());
      }
      const { btmplayFlag, resetReduxData } = this.props;
      // 取消订阅
      this.unSubscribeResource();
      AppState.removeEventListener('change', this.handleAppStateChange);
      removeConnectionChange();
      if (btmplayFlag === true) {
        this.stop(true);
      }
      resetReduxData();
    });
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      const { btmplayFlag } = this.props;
      if (btmplayFlag === true) {
        this.stop(true);
      }
      // clearHistoryRouter();
      // this.jumpHome('home');
    }
  }

  // 跳转首页
  jumpHome = (key) => {
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }
    reset(key, { activeMonitor });
  }

  subscribeResource = () => {
    const { token } = this.state;
    if (WebsocketUtil.conFlag) {
      const headers = { access_token: token };
      const {
        onGet15Day, onGetOneDay,
      } = this.props;
      const { route: { key } } = this.props;
      WebsocketUtil.subscribe(headers, '/user/topic/video/history/day', (msg) => {
        const body = JSON.parse(msg.body);
        if (body.success && body.obj) {
          onGetOneDay(body.obj);
        }
      }, null, null, key);
      WebsocketUtil.subscribe(headers, '/user/topic/video/history/month', (msg) => {
        const body = JSON.parse(msg.body);
        if (body.success && body.obj) {
          onGet15Day(body.obj);
        }
      }, null, null, key);
    } else {
      console.log('wss:页面初始化成功后singleSocket 为 null');
    }
  }

  unSubscribeResource = () => {
    // 取消订阅
    getCurAccont().then(() => {
      const { route: { key } } = this.props;
      WebsocketUtil.unsubscribe('/user/topic/video/history/day', key);
      // 15天的
      WebsocketUtil.unsubscribe('/user/topic/video/history/month', key);
      return true;
    });
  }

  timeoutCB = () => {
    const { onOneDayChangeFailed } = this.props;

    onOneDayChangeFailed();
  }

  /**
   * 获取一天的视频数据超时的处理
   * 将对应数据设置为null
   */
  getOneDayTimeout = () => {
    this.data.timeoutId = setTimeout(() => {
      const { oneDayMsgNum, oneDayMsgNumSocket, onOneDayChangeFailed } = this.props;

      if (oneDayMsgNum !== oneDayMsgNumSocket) {
        onOneDayChangeFailed();
      }
    }, 60000);
  }

  // 网络变化
  netWorkonChange = (type) => {
    const { btmplayFlag } = this.props;
    if (!btmplayFlag) {
      return;
    }
    if (type === 'none') {
      this.stop();
      this.data.offlineTime = new Date();
      return;
    }
    if (type === 'cellular') {
      this.stop(true);
      this.alertCellular();
    }
  }

  // 底部监控对象滑动触发事件 item 当前对象，index索引
  toolBarOnChange = (item) => {
    const {
      onInit, onConstruct, btmplayFlag, startTime, endTime,
    } = this.props;
    if (btmplayFlag) {
      this.stop(true);
    }

    if (!isEmpty(item)) {
      onConstruct({
        currentMonitor: item,
        startTime,
        endTime,
      });
      const { token } = this.state;
      if (WebsocketUtil.conFlag) {
        const headers = { access_token: token };
        onInit({ socket: WebsocketUtil, headers, timeoutCB: this.timeoutCB });
      }
    }
  }

  // 底部公共组件展开回调
  toolBarExpand = () => {
    this.setState({
      slideUp: false,
      isUp: true,
    });
  }

  // 底部公共组件展开回调
  toolBarCollapse = () => {
    this.setState({
      slideUp: false,
      isUp: false,
    });
  }

  toggleFullScreen = () => {
    const { isFullScreen, onFullScreenChange } = this.props;
    onFullScreenChange(!isFullScreen);
  }

  onlyFullScreen = () => {
    const { isFullScreen, onFullScreenChange } = this.props;
    console.log(!isFullScreen);
    // if (!isFullScreen) {
      onFullScreenChange(!isFullScreen);
    // }
  }

  onSelectChange = (value) => {
    const { onChannelChange, btmplayFlag } = this.props;
    if (btmplayFlag === true) {
      this.stop(true);
    }

    onChannelChange({
      currentChannelName: value,
    });
  }

  playOrPauseFun = (playFlag) => {
    if (playFlag === false) {
      if (!isConnected()) {
        return;
      }
      this.play();
    } else {
      this.stop(true);
    }
  }

  play = (dragStatus) => {
    const {
      onPlay, hasVideo, currentTime, oneDayCurrent,
    } = this.props;
    if (!hasVideo || !currentTime || !oneDayCurrent) {
      return;
    }
    if (typeof onPlay === 'function') {
      const now = new Date();
      // 如果断网30秒以内再次点击播放，先下发一个9202
      let send9202 = false;
      if (this.data.offlineTime !== null) {
        const secondDiff = Math.round((now.getTime() - this.data.offlineTime.getTime()) / 1000);
        if (secondDiff < 30) {
          send9202 = true;
        }
      }
      if (WebsocketUtil.conFlag) {
        const { token } = this.state;
        const headers = { access_token: token };
        onPlay({
          shouldSend9202: send9202,
          socket: WebsocketUtil,
          headers,
          dragStatus,
        });
      }
    }
  }

  stop = (needCancelSubscribe) => {
    const { onPlayChange, closeVideoFun, btmplayFlag } = this.props;

    if (this.data.interval) {
      clearInterval(this.data.interval);
      this.data.interval = null;
    }
    if (btmplayFlag) {
      onPlayChange({ play: false });

      if (needCancelSubscribe) {
        if (WebsocketUtil.conFlag) {
          const { token } = this.state;
          const headers = { access_token: token };
          closeVideoFun({
            socket: WebsocketUtil,
            headers,
          });
        }
      }
    }
  }

  alertCellular = () => {
    Alert.alert(
      getLocale('flowRemind'),
      getLocale('ifContinueVideo'),
      [
        {
          text: getLocale('personalAlertCancle'),
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: getLocale('personalAlertSure'),
          onPress: () => {
            // const { subscribeData } = this.state;
            this.play();
          },
        },
      ],
    );
  };

  refreshVideoFun = () => {
    const { btmplayFlag } = this.props;
    if (btmplayFlag === false) {
      this.play();
    }
  }


  onTimeChange = (startTime, endTime) => {
    const { currentMonitor, onInitTime, btmplayFlag } = this.props;
    if (btmplayFlag === true) {
      this.stop(true);
    }

    if (!isEmpty(currentMonitor)) {
      if (WebsocketUtil.conFlag) {
        const { token } = this.state;
        const headers = { access_token: token };
        onInitTime({
          startTime,
          endTime,
          socket: WebsocketUtil,
          headers,
          timeoutCB: this.timeoutCB,
        });
      }
    }
  }

  toggleMap = (mapFlag) => {
    const { onMapClose, onInitTrack } = this.props;
    if (!mapFlag) {
      // 打开地图
      onInitTrack();
    } else {
      // 关闭地图
      onMapClose();
    }
  }

  toggleAudioFun = () => {
    const { audioFlag, onAudioChange } = this.props;
    onAudioChange(!audioFlag);
  }

  /**
   * 拍照回调
   */
  captureCallback = (success) => {
    const { onCameraChange, currentChannelName } = this.props;
    onCameraChange(false);

    if (success) {
      Alert.alert(`通道${currentChannelName}拍照成功\n请进入手机相册查看`);
    } else {
      Alert.alert(`通道${currentChannelName}拍照失败`);
    }
  }

  refCaptureFun = () => {
    const { onCameraChange } = this.props;
    onCameraChange(true);
  }

  /**
   * 播放状态改变
   * state意义：
   * 0:connected 底层socket连接成功，即将播放视频
   * 1:failed 播放异常
   * 2:disconnected 底层socket断开
   * 3:success 每播放成功一帧触发一次
   * 4:video_closed 关闭播放
   */
  videoStateChangeFun = (state) => {
    const lastState = this.data.lastVideoState;
    this.data.lastVideoState = state;
    // 完整的播放开始都是先0，然后再3
    this.setState({
      playState: false,
    });
    if (state === 3 && lastState === 0) {
      if (!this.data.interval) {
        this.data.interval = setInterval(this.step, 1000);
      }
      this.setState({
        playState: true,
      });
    } else if (state === 4) {
      this.stop(true);
    }
  }

  step = () => {
    const { onStep } = this.props;
    onStep();
  }

  /**
   * second 表示的秒数
   */
  handleOnDragEnd = ({ currentTime: second }) => {
    const { currentTime, btmplayFlag, onCurrentTimeChange } = this.props;
    if (!isEmpty(currentTime)) {
      const hms = second2Hms(second);
      const date = new Date(currentTime.getTime());
      date.setHours(hms.hour);
      date.setMinutes(hms.minute);
      date.setSeconds(hms.second);

      onCurrentTimeChange({
        currentTime: date,
      });
    }
    if (btmplayFlag === true) {
      // this.stop(true);
      this.play(true);
    }
  }

  onTimeTypeChange = ({ timeType }) => {
    const { onTimeTypeChange } = this.props;
    onTimeTypeChange({ timeType });
  }

  render () {
    const {
      monitors,
      route: { params },
      currentMonitor,
      channelNames,
      currentChannelName,
      showMap,
      historyLocation,
      initStatus,
      // oneDayMsgNum,
      startTime,
      currentTime,
      // oneDayMsgNumSocket,
      unique,
      hasVideo,
      btmplayFlag,
      cameraFlag,
      audioFlag,
      sending9202,
      oneDayCurrent,
      oneDay,
      isFullScreen,
      timeType,
      progressStartTime,
      progressEndTime,
      videoPrompt,
      video15Day1,
      video15Day2,
      playInfo,
    } = this.props;

    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const { isUp, playState, isStopVideo } = this.state;
    const hasInterval = this.data.interval !== null;
    const title = isEmpty(currentMonitor) ? activeMonitor.title : currentMonitor.get('title');
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          {
            initStatus === 'ing' ? <Loading type="modal" /> : null
          }
          {
            showMap ? (
              <MapWraper
                currentMonitor={currentMonitor}
                historyLocation={historyLocation}
                startTime={currentTime}
                btmplayFlag={btmplayFlag}
              />
            ) : null
          }
          <View style={{ flex: 1 }}>
            <VideoItem
              brand={title}
              unique={unique}
              choosenVideo={currentChannelName}
              showMap={showMap}
              hasVideo={hasVideo}
              cameraFlag={cameraFlag}
              btmplayFlag={btmplayFlag}
              ifOpenAudio={audioFlag}
              sending9202={sending9202}
              videoPrompt={videoPrompt}
              currentMonitor={isEmpty(currentMonitor) ? activeMonitor : currentMonitor}
              channelNames={channelNames}
              playInfo={playInfo}
              refreshVideoFun={this.refreshVideoFun}
              videoStateChangeFun={this.videoStateChangeFun}
              captureCallback={this.captureCallback}
              onDblClick={this.onlyFullScreen}
            // isStopVideo={isStopVideo}
            />
          </View>
          <View style={{ height: 50 }}>
            <HandleTool
              toggleMap={this.toggleMap}
              playOrPauseFun={this.playOrPauseFun}
              playFlag={btmplayFlag}
              cameraFlag={cameraFlag}
              refCaptureFun={this.refCaptureFun}
              mapShow={showMap}
              screenFlag={isFullScreen}
              toggleScreenFun={this.toggleFullScreen}
              unique={unique}
              playState={playState}
              audioFlag={audioFlag}
              hasInterval={hasInterval}
              toggleAudioFun={this.toggleAudioFun}
            />
          </View>
          <View style={[(isFullScreen ? styles.timeAreaFullScreen : styles.timeArea)]}>
            <TimeArea
              channelNumber={channelNames}
              currentChannel={currentChannelName}
              oneDayCurrent={oneDayCurrent}
              oneDay={oneDay}
              onSelectChange={this.onSelectChange}
              video15Day1={video15Day1}
              video15Day2={video15Day2}
              activeDate={startTime}
              currentTime={currentTime}
              timeType={timeType}
              progressStartTime={progressStartTime}
              progressEndTime={progressEndTime}
              onTimeChange={this.onTimeChange}
              onDragEnd={this.handleOnDragEnd}
              onTimeTypeChange={this.onTimeTypeChange}
            />
          </View>

          <View style={[styles.toolBarBasic, (isFullScreen ? styles.toolBar : styles.toolBarAbs)]}>
            <ToolBar
              monitors={monitors}
              // eslint-disable-next-line max-len
              activeMonitor={currentMonitor ? currentMonitor.toJS() : activeMonitor}
              isUp={isUp}
              onChange={this.toolBarOnChange}
              onExpand={this.toolBarExpand}
              onCollapse={this.toolBarCollapse}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    initStatus: state.getIn(['videoPlaybackReducers', 'initStatus']),
    isSuccess: state.getIn(['videoPlaybackReducers', 'isSuccess']),
    oneDayMsgNum: state.getIn(['videoPlaybackReducers', 'oneDayMsgNum']),
    oneDayMsgNumSocket: state.getIn(['videoPlaybackReducers', 'oneDayMsgNumSocket']),
    video15DayMsgNum1: state.getIn(['videoPlaybackReducers', 'video15DayMsgNum1']),
    video15DayMsgNum2: state.getIn(['videoPlaybackReducers', 'video15DayMsgNum2']),
    channelNames: state.getIn(['videoPlaybackReducers', 'channelNames']),
    currentChannelName: state.getIn(['videoPlaybackReducers', 'currentChannelName']),
    unique: state.getIn(['videoPlaybackReducers', 'unique']),
    showMap: state.getIn(['videoPlaybackReducers', 'showMap']),
    historyLocation: state.getIn(['videoPlaybackReducers', 'historyLocation']),
    sending9202: state.getIn(['videoPlaybackReducers', 'sending9202']),
    oneDay: state.getIn(['videoPlaybackReducers', 'oneDay']),
    oneDayCurrent: state.getIn(['videoPlaybackReducers', 'oneDayCurrent']),
    hasVideo: state.getIn(['videoPlaybackReducers', 'hasVideo']),
    startTime: state.getIn(['videoPlaybackReducers', 'startTime']),
    endTime: state.getIn(['videoPlaybackReducers', 'endTime']),
    currentMonitor: state.getIn(['videoPlaybackReducers', 'currentMonitor']),
    currentTime: state.getIn(['videoPlaybackReducers', 'currentTime']),
    isFullScreen: state.getIn(['videoPlaybackReducers', 'isFullScreen']),
    btmplayFlag: state.getIn(['videoPlaybackReducers', 'btmplayFlag']),
    cameraFlag: state.getIn(['videoPlaybackReducers', 'cameraFlag']),
    audioFlag: state.getIn(['videoPlaybackReducers', 'audioFlag']),
    timeType: state.getIn(['videoPlaybackReducers', 'timeType']),
    progressStartTime: state.getIn(['videoPlaybackReducers', 'progressStartTime']),
    progressEndTime: state.getIn(['videoPlaybackReducers', 'progressEndTime']),
    channelTaken: state.getIn(['videoPlaybackReducers', 'channelTaken']),
    videoPrompt: state.getIn(['videoPlaybackReducers', 'videoPrompt']),
    video15Day1: state.getIn(['videoPlaybackReducers', 'video15Day1']),
    video15Day2: state.getIn(['videoPlaybackReducers', 'video15Day2']),
    playInfo: state.getIn(['videoPlaybackReducers', 'playInfo']),
  }),
  dispatch => ({
    resetReduxData: () => {
      dispatch({ type: 'videoPlayback/RESET_ACTION' });
    },
    onConstruct: (payload) => {
      dispatch({ type: 'videoPlayback/CONSTRUCT_ACTION', payload });
    },
    onInit: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/INIT_ACTION', payload });
    },
    onInitTime: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/INIT_TIME_ACTION', payload });
    },
    onInitTrack: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/INIT_TRACK_ACTION', payload });
    },
    onSubscribe: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/SUBSCRIBE_ACTION', payload });
    },
    onChannelChange: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/BEFORE_CHANNEL_CHANGE_ACTION', payload });
    },
    onMapClose: (payload) => {
      dispatch({ type: 'videoPlayback/MAP_CLOSE', payload });
    },
    onPlay: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/PLAY_ACTION', payload });
    },
    closeVideoFun: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/CLOSE_ACTION', payload });
    },
    onFullScreenChange: (payload) => {
      dispatch({ type: 'videoPlayback/FULL_SCREEN_ACTION', payload });
    },
    onPlayChange: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/BEFORE_PLAY_CHANGE_ACTION', payload });
    },
    onCameraChange: (payload) => {
      dispatch({ type: 'videoPlayback/CAMERA_ACTION', payload });
    },
    onAudioChange: (payload) => {
      dispatch({ type: 'videoPlayback/AUDIO_ACTION', payload });
    },
    onCurrentTimeChange: (payload) => {
      dispatch({ type: 'videoPlayback/CURRENT_TIME_ACTION', payload });
    },
    onStep: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/BEFORE_STEP_ACTION', payload });
    },
    onOneDayChangeFailed: (payload) => {
      dispatch({ type: 'videoPlayback/ONE_DAY_CHANGE_FAILED_ACTION', payload });
    },
    onTimeTypeChange: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/BEFORE_TIME_TYPE_CHANGE_ACTION', payload });
    },
    onGetOneDay: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/GET_ONE_DAY', payload });
    },
    onGet15Day: (payload) => {
      dispatch({ type: 'videoPlayback/SAGA/GET_15_DAY', payload });
    },
  }),
)(VideoPlayback);
