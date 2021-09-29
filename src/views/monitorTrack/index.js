import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  AppState,
  Alert,
  Platform,
  NativeModules,
  NativeEventEmitter,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import WebsocketUtil from '../../utils/websocket';
// import storage from '../../utils/storage';
import { getLoginState, getLoginAccont } from '../../server/getStorageData';
import { getBasicLocationInfo } from '../../server/getData';
import { monitorIcon } from '../../utils/monitorIcon';
// import httpBaseConfig from '../../utils/env';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';
import ToolChildren from './componentToolChildren';
import Map from './componentMap';
import gpsNavi from '../../static/image/gpsNavi.png';
import { toastShow } from '../../utils/toastUtils';// 导入toast
// import Menu from './componentToolMenu';// 二期实现
import { go } from '../../utils/routeCondition';

const winHeight = Dimensions.get('window').height;

let emitterManager = null;
if (Platform.OS === 'ios') {
  emitterManager = new NativeEventEmitter(NativeModules.RNAMapNaviModule);
}

const openAMapNaviEvent = {
  unableGetCurrentLocation: null,
  unableGetTargetLocation: null,
  notEnadledLocationPermission: null,
};

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bottomCantainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
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
  ico: {
    width: 40,
    height: 40,
  },
  mapIcon_left: {
    left: 10,
  },
  mapIcon_right: {
    right: 10,
    zIndex: 99999,
  },
});

class Index extends Component {
  // 顶部导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('monitorTrackTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    activeMonitor: PropTypes.object,
    socketTime: PropTypes.number,
    route: PropTypes.object.isRequired,
  }

  // 属性默认值
  static defaultProps = {
    monitors: null,
    socketTime: null,
    activeMonitor: null,
    // accont: null,
    // monitorId: null,
  }

  constructor(props) {
    super(props);
    const {
      monitors,
      route: { params },
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
      monitorId: null,
      locationManager: true,
      token: null,
      accont: null,
      routePlan: null,
      locationState: false,
      monitorInfo: {
        monitorName: null,
        state: null,
        continueTime: null,
        updateTime: null,
        targetAddress: null,
        monitorType: null,
      },
      distance: null,
      myAddress: null,
      mapHeight: winHeight,
      currentMonitor,
      footerHeight: 250,
    };
  }

  // 组件第一次渲染后调用
  componentDidMount () {
    // 初始化websocket对象
    onConnectionChange((type) => { this.netWorkonChange(type); });
    const { route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    this.setState({
      monitorId: activeMonitor.markerId,
      bottomH: this.bottomH,
    });
    AppState.addEventListener('change', this.handleAppStateChange);
    if (Platform.OS === 'ios') {
      openAMapNaviEvent.notEnadledLocationPermission = emitterManager.addListener('notEnadledLocationPermission',
        () => toastShow(getLocale('openLocationSwitchContent'), { duration: 2000 }));
      openAMapNaviEvent.unableGetCurrentLocation = emitterManager.addListener('unableGetCurrentLocation',
        () => toastShow(getLocale('unableGetCurrentLocation'), { duration: 2000 }));
      openAMapNaviEvent.unableGetTargetLocation = emitterManager.addListener('unableGetTargetLocation',
        () => toastShow(getLocale('unableGetTargetLocation'), { duration: 2000 }));
    }
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
    this.cancelSub();
    AppState.removeEventListener('change', this.handleAppStateChange);

    if (Platform.OS === 'ios') {
      openAMapNaviEvent.notEnadledLocationPermission.remove();
      openAMapNaviEvent.unableGetCurrentLocation.remove();
      openAMapNaviEvent.unableGetTargetLocation.remove();
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      // this.cancelSub();
    } else if (nextAppState === 'active') {
      // 判断是否有定位权限,没有则跳转至监控主页
      NativeModules.LocationPermissionsModule.getLocationState('getLocationState').then((events) => {
        const { currentMonitor } = this.state;
        if (events === 0) {
          go('home', {
            activeMonitor: currentMonitor,
          });
        } else if (!WebsocketUtil.conFlag) {
          NetInfo.fetch().then((connectionInfo) => {
            if (connectionInfo.type === 'wifi' || connectionInfo.type === 'cellular') {
              this.subscribeFun();
            }
          });
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

  againSub () {
    const {
      monitorId,
      accont,
      token,
    } = this.state;
    const headers = { access_token: token };
    const { socketTime } = this.props;
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
  }

  // 设置地图高度
  onLayout = () => {
    // const { nativeEvent: { layout: { y } } } = e;
    const H = winHeight;
    this.setState({
      mapHeight: H,
    });
  }

  // 路径规划距离返回
  getPlanDistance (data) {
    let allDistance = (data / 1000);
    const index = (allDistance.toString()).indexOf('.');
    if (index > 0) {
      allDistance = allDistance.toFixed(1);// 如果有小数,取一位小数
    }
    this.setState({ distance: allDistance });
  }


  // 获取当前用户位置信息
  getAddress (data) {
    const info = data;
    if (info !== undefined) {
      this.setState({ myAddress: info });
    }
  }

  // 定位完成后回调函数
  async locationComplete (data) {
    const $this = this;
    if (data === 'true') { // 定位成功
      const { locationState } = this.state;

      if (!locationState) {
        this.getLatestPoint();
        const state = await getLoginState();
        const headers = { access_token: state.token };
        const userInfo = await getLoginAccont();
        const { monitorId } = $this.state;
        const { socketTime } = $this.props;
        // 订阅监控对象位置信息
        const param = [monitorId];
        const request = {
          desc: {
            MsgId: 40964,
            UserName: userInfo[userInfo.length - 1].accont + socketTime,
          },
          data: param,
        };
        setTimeout(() => {
          const { route: { key } } = this.props;
          WebsocketUtil.subscribe(headers, '/user/topic/location',
            $this.subCallBack.bind($this), '/app/location/subscribe', request, key);
        }, 2000);
        $this.setState({
          accont: userInfo[userInfo.length - 1].accont,
          token: state.token,
          locationState: true,
        });
      }
    } else {
      toastShow(getLocale('locationManagerFailed'), { duration: 2000 });
    }
  }

  onLocationStatusDenied () {
    Alert.alert(
      getLocale('openLocationSwitch'), // 提示标题
      getLocale('openLocationSwitchContent'), // 提示内容
      [
        {
          text: getLocale('know'),
          style: 'cancel',
        },
      ],
      { cancelable: false },
    );
  }

  // 订阅成功回调函数
  subCallBack (msg) {
    const { monitorId } = this.state;
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

          const i = Math.floor(Number(msgBody.direction) / 360);
          const angle = Number(msgBody.direction) - 360 * i + 270;

          const value = [{
            markerId: msgBody.monitorInfo.monitorId,
            latitude: coordinates.bdLat,
            longitude: coordinates.bdLng,
            title: msgBody.monitorInfo.monitorName,
            ico: objIcon,
            angle,
            speend: 10,
            status: msgBody.stateInfo,
            random: Math.random(),
          }];
          let speed = (msgBody.gpsSpeed === null || msgBody.gpsSpeed === undefined)
            ? null : msgBody.gpsSpeed;
          const index = speed === null ? 0 : (speed.toString()).indexOf('.');
          if (index > 0) {
            speed = speed.toFixed(1);// 如果有小数,取一位小数
          }
          this.setState({
            routePlan: value,
            monitorInfo: {
              monitorName: msgBody.monitorInfo.monitorName,
              state: this.monitorStateCallBack(msgBody.acc),
              continueTime: this.continueTime(msgBody.durationTime),
              updateTime: this.assemblyUpdateTime(msgBody.gpsTime),
              // distance: null,
              // myAddress: null,
              runSpeed: speed,
              targetAddress: msgBody.positionDescription,
              monitorType: msgBody.monitorInfo.monitorType,
            },
          });
        }
        // this.setState({ updateTime: this.assemblyUpdateTime(msgBody.gpsTime) });
      }
    }
  }

  // 返回行驶和停止
  monitorStateCallBack (acc) {
    let state;
    if (acc === 0) {
      state = getLocale('stop');
    } else if (acc === 1) {
      state = '行驶';
    }
    return state;
  }

  // 返回状态持续时长
  continueTime (time) {
    return (time / 1000 / 60 / 60).toFixed(2);
  }

  // 组装更新时间
  assemblyUpdateTime (time) {
    return `20${time.substring(0, 2)}-${time.substring(2, 4)}-${time.substring(4, 6)} ${time.substring(6, 8)}:${time.substring(8, 10)}:${time.substring(10, 12)}`;
  }

  // 监控对象切换
  monitorChange (item) {
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
      WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, '/user/topic/location', key);
    }

    // 订阅切换后的监控对象
    const mId = item.markerId;
    this.setState({ monitorId: mId, currentMonitor: item });
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
      footerHeight: state ? 470 : 250,
    });
  }

  startNavi () {
    if (Platform.OS === 'ios') {
      NativeModules.RNAMapNaviModule.openAMapNavi('openAMapNavi');
    } else {
      NativeModules.NavigationModule.startNavigation(Math.random());
    }
  }

  getLatestPoint = () => {
    const { monitorId } = this.state;
    getBasicLocationInfo({ id: monitorId }).then((res) => {
      if (res.statusCode === 200) {
        if (res.obj.longitude !== 0 && res.obj.latitude !== 0) {
          const monitorType = res.obj.type;
          const objIcon = monitorIcon(monitorType, res.obj.ico);
          const coordinates = bdEncrypt(res.obj.longitude, res.obj.latitude);

          const i = Math.floor(Number(res.obj.angle) / 360);
          const angle = Number(res.obj.angle) - 360 * i + 270;

          const value = [{
            markerId: res.obj.id,
            latitude: coordinates.bdLat,
            longitude: coordinates.bdLng,
            title: res.obj.name,
            ico: objIcon,
            angle,
            speend: 10,
            status: res.obj.status,
            random: Math.random(),
          }];

          let speed = (res.obj.speed === null || res.obj.speed === undefined)
            ? null : res.obj.speed;
          const index = speed === null ? 0 : (speed.toString()).indexOf('.');
          if (index > 0) {
            speed = Number(speed).toFixed(1);// 如果有小数,取一位小数
          }
          this.setState({
            routePlan: value,
            monitorInfo: {
              monitorName: res.obj.name,
              // state: this.monitorStateCallBack(res.obj.acc),
              // continueTime: this.continueTime(res.obj.durationTime),
              updateTime: this.assemblyUpdateTime(res.obj.time),
              runSpeed: speed,
              targetAddress: res.obj.address,
              monitorType: res.obj.type,
            },
          });
        }
      }
    });
  }

  // 取消訂閱
  cancelSub () {
    const { socketTime } = this.props;
    const {
      token,
      accont,
      monitorId,
    } = this.state;
    const headers = { access_token: token };
    const param = [{ vehicleId: monitorId }];
    const unRequset = {
      desc: {
        MsgId: 40964,
      },
      data: param,
    };
    if (param.length > 0) {
      const { route: { key } } = this.props;
      WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, '/user/topic/location', key);
    }
  }

  render () {
    const {
      monitors,
    } = this.props;
    const {
      locationManager,
      routePlan,
      monitorInfo,
      myAddress,
      distance,
      mapHeight,
      currentMonitor,
      footerHeight,
    } = this.state;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          <View
            style={{ height: mapHeight }}
          >
            <Map
              mapViewHeight={mapHeight}
              locationManager={locationManager}
              onLocationSuccess={data => this.locationComplete(data)}
              onLocationStatusDenied={data => this.onLocationStatusDenied(data)}
              routePlan={routePlan}
              onAddress={data => this.getAddress(data)}
              onPlanDistance={data => this.getPlanDistance(data)}
              trackPolyLineSpan={footerHeight}
              baiduMapScalePosition={`20|${footerHeight === 250 ? 233 : 393}`}
            />
          </View>

          <View
            style={styles.bottomCantainer}
          >
            {/* 二期实现导航 start */}
            {/* <Menu /> */}
            {/* 二期实现导航 end */}

            {/* 导航图标 */}
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, {
                top: -20, backgroundColor: '#339eff', height: 40, width: 40,
              }]}
              onPress={() => this.startNavi()}
            >
              <Image
                source={gpsNavi}
                style={[styles.ico, { width: 13, height: 13 }]}
              />
              <Text style={{ color: '#ffffff' }}>导航</Text>
            </TouchableOpacity>

            <ToolBar
              activeMonitor={currentMonitor}
              monitors={monitors}
              onChange={item => this.monitorChange(item)}
              toggleSlideState={this.getToggleSlideState}
            >
              <View style={{ position: 'relative' }}>
                <ToolChildren msg={monitorInfo} myAddress={myAddress} distance={distance} />
                <View onLayout={(e) => { this.onLayout(e); }} />
              </View>
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
  }),
  null,
)(Index);