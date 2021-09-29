import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  AppState,
  Platform,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import { convertSeconds } from '../../utils/convertSeconds';
import { checkMonitorOnline, getBasicLocationInfo } from '../../server/getData';
import { getLoginAccont, getLoginState } from '../../server/getStorageData';
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
import WebsocketUtil from '../../utils/websocket';
import { monitorIcon } from '../../utils/monitorIcon';
// import httpBaseConfig from '../../utils/env';
// import storage from '../../utils/storage';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';
import WakeInfo from './wakeInfo';// 尾迹信息
import MapView from './componentMap';// 地图
import { go } from '../../utils/routeCondition';

// import mapIcon6 from '../../static/image/target.png';
// import mapIcon2 from '../../static/image/current.png';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,255)',
  },
  map: {
    flex: 1,
  },
  bottomCantainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  ico: {
    width: 40,
    height: 40,
  },
  mapIcon: {
    position: 'absolute',
    zIndex: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon_left: {
    left: 10,
  },
});

class MonitorWake extends Component {
  // 顶部导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('monitorWakeTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    socketTime: PropTypes.number,
    activeMonitor: PropTypes.object,
    route: PropTypes.object.isRequired,
    // markers: PropTypes.object,
    // updateMonitorInfo: PropTypes.func,
    // subCallBack: PropTypes.func,
  }

  // 属性默认值
  static defaultProps = {
    monitors: null,
    socketTime: null,
    activeMonitor: null,
    // markers: new Map(),
    // updateMonitorInfo: null,
    // subCallBack: null,
  }

  constructor(props) {
    super(props);
    const {
      route: { params }, monitors,
    } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }

    const firstMonitor = monitors.get(0);
    let currentMonitor = null;
    if (activeMonitor === null) {
      currentMonitor = firstMonitor;
    } else {
      const monitor = monitors.find(x => x.markerId === activeMonitor.markerId);
      if (monitor === null) {
        currentMonitor = firstMonitor;
      } else {
        currentMonitor = monitor;
      }
    }

    this.state = {
      // subState: false,
      monitorAddressInfo: null,
      curState: null,
      // time: null,
      updateTime: null,
      curAddr: null,
      runDistance: 0,
      runSpeed: 0,
      // beginEndTime: null,
      beginEndAddr: null,
      mileage: null,
      realTimeWake: true,
      wakeData: [],
      monitorId: null,
      // latestPoints: null,
      token: null,
      accont: null,
      currentMonitor,
      defaultFooterHeight: 168,
      mapInit: false,
      toggleSlideState: false,
    };
  }

  // 组件第一次渲染后调用
  componentDidMount () {
    // 初始化websocket对象
    const { route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    onConnectionChange((type) => { this.netWorkonChange(type); });
    // this.wakeSocketConnect();
    this.setState({
      monitorId: activeMonitor.markerId,
    });
    AppState.addEventListener('change', this.handleAppStateChange);
    // 开启常亮
    setTimeout(() => {
      NativeModules.IdleTimerModule.open();
    }, 2000);
  }

  componentWillUnmount () {
    NativeModules.IdleTimerModule.close();
    if (Platform.OS === 'android') {
      NativeModules.BaiduMapModule.show(Math.random());
    }
    removeConnectionChange();
    // const { socket } = this.state;
    // socket.close();
    this.cancelSub();
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      // this.cancelSub();
    } else if (nextAppState === 'active') {
      const { monitorId, currentMonitor } = this.state;
      checkMonitorOnline({
        monitorId,
      }).then((res) => {
        if (res.statusCode === 200) {
          if (res.obj === 1) { // 监控对象在线
            // 清除之前的尾迹
            this.setState({
              wakeData: [],
              curState: null,
              updateTime: null,
              curAddr: null,
              runDistance: 0,
              beginEndAddr: null,
              mileage: null,
              runSpeed: 0,
            }, () => {
              this.getLatestPoint(monitorId);
              if (!WebsocketUtil.conFlag) {
                this.subscribeFun();
              }
            });
          } else {
            go('home', {
              activeMonitor: currentMonitor,
            });
          }
        }
      });
    }
  }

  subscribeFun () {
    setTimeout(() => {
      if (WebsocketUtil.conFlag) {
        this.againSubJdge();
      } else {
        this.subscribeFun();
      }
    }, 1000);
  }

  // 取消訂閱
  cancelSub () {
    const {
      monitorId,
      token,
    } = this.state;
    const headers = { access_token: token };
    const param = [
      { vehicleId: monitorId },
    ];
    const unRequset = {
      desc: {
        MsgId: 40964,
      },
      data: param,
    };
    // 取消位置信息订阅
    const { route: { key } } = this.props;
    WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, '/user/topic/location', key);
  }

  // 重新訂閱
  againSub () {
    const {
      monitorId,
      token,
      accont,
    } = this.state;
    const { socketTime } = this.props;
    const headers = { access_token: token };
    // 订阅监控对象位置信息
    const param = [monitorId];
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

    // const statusParam = {
    //   desc: {
    //     MsgId: 40964,
    //     UserName: accont + socketTime,
    //   },
    //   data: [{ vehicleID: monitorId }],
    // };
    // WebsocketUtil.subscribe(headers, '/user/topic/cachestatus',
    //   this.subStatusCallBack.bind(this),
    //  '/app/vehicle/subscribeCacheStatusNew', statusParam, key);
  }

  getLatestPoint = (id) => {
    getBasicLocationInfo({ id }).then((res) => {
      if (res.statusCode === 200) {
        const { mileage } = this.state;
        const icon = monitorIcon(res.obj.type, res.obj.ico);
        const time = convertSeconds(res.obj.time);
        const i = Math.floor((Number(res.obj.angle) + 270) / 360);
        const angle = (Number(res.obj.angle) + 270) - 360 * i;
        const coordinates = bdEncrypt(res.obj.longitude, res.obj.latitude);
        let speed = (res.obj.speed === null || res.obj.speed === undefined)
          ? null : res.obj.speed;
        const index = speed === null ? 0 : (speed.toString()).indexOf('.');
        if (index > 0) {
          speed = Number(speed).toFixed(1);// 如果有小数,取一位小数
        }

        const value = [{
          markerId: res.obj.id,
          latitude: coordinates.bdLat,
          longitude: coordinates.bdLng,
          title: res.obj.name,
          ico: icon,
          speed: 10,
          status: res.obj.status,
          angle,
          time,
        }];

        this.setState({
          wakeData: value,
          curState: res.obj.type,
          updateTime: this.assemblyUpdateTime(res.obj.time),
          runSpeed: speed,
          beginEndAddr: res.obj.address,
          curAddr: res.obj.address,
          runDistance: (res.obj.gpsMileage - mileage).toFixed(1),
        });
      }
    });
  };

  // 地图初始化完成事件
  onMapInitFinish () {
    const { monitorId } = this.state;
    this.getLatestPoint(monitorId);
    this.socketConnectSuccess();
    this.setState({ mapInit: true });
  }

  // socket连接成功后位置信息订阅
  socketConnectSuccess () {
    setTimeout(() => {
      if (WebsocketUtil.conFlag) {
        this.subMonitorFunc();
      } else {
        this.socketConnectSuccess();
      }
    }, 1000);
  }

  // 组装更新时间
  assemblyUpdateTime (time) {
    return `20${time.substring(0, 2)}-${time.substring(2, 4)}-${time.substring(4, 6)} ${time.substring(6, 8)}:${time.substring(8, 10)}:${time.substring(10, 12)}`;
  }

  // 返回状态持续时长
  // continueTime(time) {
  //   return (time / 1000 / 60 / 60).toFixed(2);
  // }

  // 位置信息订阅成功回掉函数
  subCallBack (msg) {
    const {
      monitorId,
      curAddr,
      // subState,
      // mileage,
    } = this.state;
    const data = JSON.parse(msg.body);
    /* eslint prefer-destructuring:off */
    if (data.desc !== 'neverOnline') {
      const msgBody = data.data.msgBody;
      const mid = msgBody.monitorInfo.monitorId;
      if (mid === monitorId) {
        // 组装监控对象地图更新数据
        // 组装图片地址  车、人和物
        if (msgBody.longitude !== 0 && msgBody.latitude !== 0) {
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
          this.setState({ wakeData: value });
          const {
            // subState,
            mileage,
          } = this.state;
          if (mileage != null) {
            this.setState({ runDistance: (msgBody.gpsMileage - mileage).toFixed(1) });
          } else {
            this.setState({ mileage: msgBody.gpsMileage });
          }
          if (curAddr === null) {
            this.setState({ curAddr: msgBody.positionDescription });
          }
          let speed = (msgBody.gpsSpeed === null || msgBody.gpsSpeed === undefined)
            ? null : msgBody.gpsSpeed;
          const index = speed === null ? 0 : (speed.toString()).indexOf('.');
          if (index > 0) {
            speed = speed.toFixed(1);// 如果有小数,取一位小数
          }
          // 更新起点时间和位置
          // if (!subState) {
          this.setState({
            runSpeed: speed,
            // beginEndTime: this.assemblyUpdateTime(msgBody.gpsTime),
            beginEndAddr: msgBody.positionDescription,
            curState: msgBody.monitorInfo.monitorType,
            // subState: true,
          });
          // }
          // }
        }
        // 更新底部位置信息
        this.setState({
          // time: this.continueTime(msgBody.durationTime),
          updateTime: this.assemblyUpdateTime(msgBody.gpsTime),
          // curAddr: msgBody.positionDescription,
          // runDistance: msgBody.gpsMileage,
        });
      }
    }
  }

  subStatusCallBack (msg) {
  }

  // 监控对象位置信息订阅
  async subMonitorFunc () {
    const state = await getLoginState();
    const headers = { access_token: state.token };
    const userInfo = await getLoginAccont();
    const { monitorId } = this.state;
    const { socketTime } = this.props;
    // 订阅监控对象位置信息
    const param = [monitorId];
    const request = {
      desc: {
        MsgId: 40964,
        UserName: userInfo[userInfo.length - 1].accont + socketTime,
      },
      data: param,
    };
    const { route: { key } } = this.props;
    WebsocketUtil.subscribe(headers, '/user/topic/location',
      this.subCallBack.bind(this), '/app/location/subscribe', request, key);

    const statusParam = {
      desc: {
        MsgId: 40964,
        UserName: userInfo[userInfo.length - 1].accont + socketTime,
      },
      data: [{ vehicleID: monitorId }],
    };
    // WebsocketUtil.subscribe(headers, '/user/topic/cachestatus',
    //   this.subStatusCallBack.bind(this), '/app/vehicle/subscribeCacheStatusNew', statusParam, key);
    this.setState({
      token: state.token,
      accont: userInfo[userInfo.length - 1].accont,
    });
  }

  // 监控对象切换
  monitorChange (item) {
    // 清空上一个监控对象的信息
    this.setState({
      curState: null,
      // time: null,
      updateTime: null,
      curAddr: null,
      runDistance: 0,
      // beginEndTime: null,
      beginEndAddr: null,
      mileage: null,
    });
    // const { runDistance } = this.state;
    // 取消订阅上一辆车辆
    const { socketTime } = this.props;
    const {
      token,
      accont,
      monitorId,
    } = this.state;
    const headers = { access_token: token };
    const unParam = [{ vehicleId: monitorId }];
    const unRequset = {
      desc: {
        MsgId: 40964,
      },
      data: unParam,
    };
    if (unParam.length > 0) {
      const { route: { key } } = this.props;
      WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, key);
    }

    // 订阅切换后的监控对象
    const mId = item.markerId;
    this.setState({
      monitorId: mId,
      currentMonitor: item,
      // latestPoints: [
      //   { vehicleId: mId },
      // ],
    });
    const param = [mId];
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
    const statusParam = {
      desc: {
        MsgId: 40964,
        UserName: accont + socketTime,
      },
      data: [{ vehicleID: monitorId }],
    };
    // WebsocketUtil.subscribe(headers, '/user/topic/cachestatus',
    //   this.subStatusCallBack.bind(this), '/app/vehicle/subscribeCacheStatusNew', statusParam, key);
  }

  // 网络变化
  netWorkonChange = (type) => {
    if (type !== 'none' || type !== 'unknown') {
      if (!WebsocketUtil.conFlag) {
        this.subscribeFun();
      }
    }
  }

  // 避免socket重复建立连接，轮询判断reconnectionState是否为true
  againSubJdge () {
    this.againSub();
  }

  getToggleSlideState = (state) => {
    this.setState({
      defaultFooterHeight: state ? 328 : 168,
      toggleSlideState: state,
    });
  }

  render () {
    const {
      monitors,
      // markers,
    } = this.props;
    // const { wakeData } = this.state;
    const {
      curState,
      // time,
      updateTime,
      curAddr,
      runDistance,
      runSpeed,
      // beginEndTime,
      beginEndAddr,
      realTimeWake,
      wakeData,
      currentMonitor,
      mapInit,
      defaultFooterHeight,
      // latestPoints,
      toggleSlideState,
    } = this.state;
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          <MapView
            style={styles.map}
            wakeData={wakeData}
            realTimeWake={realTimeWake}
            onMapInitFinish={() => this.onMapInitFinish()}
            baiduMapScalePosition={mapInit ? `20|${defaultFooterHeight}` : null}
            toggleSlideState={toggleSlideState}
          />
          <View style={styles.bottomCantainer}>
            <ToolBar
              onChange={item => this.monitorChange(item)}
              activeMonitor={currentMonitor}
              monitors={monitors}
              toggleSlideState={this.getToggleSlideState}
            >
              <WakeInfo
                curState={curState}
                // time={time}
                updateTime={updateTime}
                curAddr={curAddr}
                runDistance={runDistance}
                runSpeed={runSpeed}
                // beginEndTime={beginEndTime}
                beginEndAddr={beginEndAddr}
              />
            </ToolBar>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    socketTime: state.getIn(['homeReducers', 'socketTime']),
    // markers: state.getIn(['homeReducers', 'monitorInfo']),
  }),
  // dispatch => ({
  //   updateMonitorInfo: (value) => {
  //     dispatch({ type: 'UPDATE_MARKER_INFO', value });
  //   },
  // }),
)(MonitorWake);