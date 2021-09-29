import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  AppState,
  Image,
  Text,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
// import * as timeFormat from 'd3-time-format';
import { SafeAreaView } from 'react-native-safe-area-context';
import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../utils/locales';
import ToolBar from '../../common/toolBar';
// import Loading from '../../common/loading';
import WebsocketUtil from '../../utils/websocket';
import { onConnectionChange, removeConnectionChange } from '../../utils/network';
import {
  getLoginState, getLoginAccont,
} from '../../server/getStorageData';
import { checkMonitorOnline, checkMonitorBindObd } from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';
import CarIcon from '../../static/image/wCar.png';
import { isEmpty } from '../../utils/function';
import Cell from '../monitorDetail/componentCell';
import CellTitle from '../monitorDetail/componentTitle';
import { serviceError, tokenOverdue, serviceConnectError } from '../../utils/singleSignOn';
import storage from '../../utils/storage';
import NetworkModal from '../../utils/networkModal';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  toolBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  carInfoContainer: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  carContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  carImg: {
    width: 20,
    height: 20,
    marginLeft: 2,
  },
  carText: {
    color: '#111111',
    fontSize: 18,
    paddingLeft: 10,
  },
  carMainInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 2,
  },
  carMainInfo: {
    color: '#111111',
    fontSize: 14,
  },
  position: {
    // width: 75,
  },
  positionText: {
    flex: 1,
    height: 20,
  },
  detailInfoContainer: {
    flex: 1,
    marginBottom: 20,
  },
  failedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noData: {
    textAlign: 'center',
    color: 'gray',
  },
});
// const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');

const showList = [
  'obdTotalMileage',
  'obdAccumulatedMileage',
  'obdTotalOilConsumption',
  'obdInstantOilConsumption',
  'obdInstrumentSpeed',
  'obdRotationRate',
  'obdOilPressure',
  'obdBatteryVoltage',
  'obdWaterTemperature',
  'obdOilQuantity',
  'obdOilTankLevelHeight',
  'obdShortDistanceMileage',
  'obdEngineRunningTime',
  'obdTorque',
  'obdUreaLevel',
  'obdFootBrakeStatusStr',
  'obdHighBeamStatusStr',
  'obdDippedHeadlightStatusStr',
  'obdSmallLampStatusStr',
  'obdIndicatorLampStatusStr',
  'obdFogLampStatusStr',
  'obdLeftTurnLampStatusStr',
  'obdRightTurnLampStatusStr',
  'obdEmergencyLampStatusStr',
  'obdLeftFrontDoorStatusStr',
  'obdRightFrontDoorStatusStr',
  'obdLeftRearDoorStatusStr',
  'obdRightRearDoorStatusStr',
  'obdTailBoxDoorStatusStr',
  'obdFullVehicleLockStr',
  'obdLeftFrontDoorLockStr',
  'obdRightFrontDoorLockStr',
  'obdLeftRearDoorLockStr',
  'obdRightRearDoorLockStr',
  'obdLeftFrontWindowStatusStr',
  'obdRightFrontWindowStatusStr',
  'obdLeftRearWindowStatusStr',
  'obdRightRearWindowStatusStr',
  'obdFaultSignalECMStr',
  'obdFaultSignalABSStr',
  'obdFaultSignalSRSStr',
  'obdAlarmSignalEngineOilStr',
  'obdAlarmSignalTirePressureStr',
  'obdAlarmSignalMaintainStr',
  'obdSafetyAirBagStatusStr',
  'obdHandBrakeStatusStr',
  'obdClutchStatusStr',
  'obdSafetyBeltStatusDriverStr',
  'obdSafetyBeltStatusDeputyDrivingStr',
  'obdACCSignalStr',
  'obdKeyStatusStr',
  'obdWiperStatusStr',
  'obdAirConditionerStatusStr',
  'obdGearPositionStr',
  'obdAcceleratorPedalStr',
  'obdSteeringWheelAngleStatusStr',
  'obdEnergyTypeStr',
  'obdMILFaultLampStr',
  'obdEnduranceMileage',
  'obdPercentageOfOil',
  'obdInstant100KmOilConsumption',
  'obdAverage100KmOilConsumption',
  'obdEngineIntakeTemperature',
  'obdAirConditioningTemperature',
  'obdMotorTemperature',
  'obdControllerTemperature',
  'obdTernaryCatalystTemperature',
  'obdEngineOilTemperature',
  'obdFuelTemperature',
  'obdSuperchargedAirTemperature',
  'obdSpeedByRotationalSpeedCalculation',
  'obdAirFlowRate',
  'obdIntakePressure',
  'obdFuelInjectionQuantity',
  'obdRelativePositionOfThrottlePedal',
  'obdSteeringWheelAngle',
  'obdBatteryRemainingElectricity',
  'obdVehicleTravelFuelConsumption',
  'obdNumberOfClutchesDuringTravel',
  'obdNumberOfFootBrakesDuringTravel',
  'obdNumberOfHandBrakesDuringTravel',
  'obdEngineLoad',
  'obdTorquePercentage',
  'obdAtmosphericPressure',
  'obdFrontOxygenSensorValue',
  'obdRearOxygenSensorValue',
  'obdSCR',
  'obdNitricOxideOverrunAlarmStatus',
  'obdNOxConcentrationRange',
  'obdAlarmInfo',
];

class ObdMonitor extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('obdMonitor'),
  )


  static propTypes = {
    monitors: PropTypes.array.isRequired,
    activeMonitor: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps = {
    activeMonitor: null,
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

    this.state.currentMonitor = currentMonitor;
  }

  data = {
    token: null,
    accont: null,
  }

  state = {
    currentMonitor: null,
    odbData: null,
  }

  // 组件第一次渲染后调用
  componentDidMount () {
    onConnectionChange((type) => { this.netWorkonChange(type); });
    // 初始化websocket对象
    this.socketConnect();
    // 前后台状态监听绑定
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  // 頁面銷毀
  componentWillUnmount () {
    this.cancelSub();
    removeConnectionChange();
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  // socket建立连接
  async socketConnect () {
    const state = await getLoginState();
    const userInfo = await getLoginAccont();
    this.data.token = state.token;
    this.data.accont = userInfo[0].accont;
    this.subscribeFun();
  }

  netWorkonChange = (type) => {
    if (type !== 'none' || type !== 'unknown') {
      if (!WebsocketUtil.conFlag) {
        this.subscribeFun();
      }
    }
  }

  // 位置信息订阅成功
  subAddressCB (msg) {
    const { currentMonitor } = this.state;
    const data = JSON.parse(msg.body);
    if (data.obj && data.obj.plateNumber !== currentMonitor.title) {
      return;
    }
    this.setState({
      odbData: data,
    });
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      if (!WebsocketUtil.conFlag) {
        this.subscribeFun();
      }
    }
  }

  subscribeFun () {
    setTimeout(() => {
      if (WebsocketUtil.conFlag) {
        this.againSub();
      } else {
        this.subscribeFun();
      }
    }, 1000);
  }

  // 取消订阅
  cancelSub () {
    const { currentMonitor } = this.state;
    const {
      token,
    } = this.data;
    const headers = { access_token: token };
    const unRequset = {
      desc: {
        MsgId: 40964,
        IsObd: 1,
      },
      data: [{ vehicleId: currentMonitor.markerId }],
    };
    // 取消位置信息订阅
    const { route: { key } } = this.props;
    WebsocketUtil.unsubscribealarm(headers, '/app/vehicle/unsubscribelocationNew', unRequset, '/user/topic/obdInfo', key);
  }

  // 重新订阅
  againSub () {
    const { currentMonitor } = this.state;
    const {
      token,
      accont,
    } = this.data;
    const headers = { access_token: token };
    const request = {
      desc: {
        MsgId: 40964,
        UserName: accont,
        IsObd: 1,
      },
      data: [currentMonitor.markerId],
    };
    const { route: { key } } = this.props;
    WebsocketUtil.subscribe(headers, '/user/topic/obdInfo', this.subAddressCB.bind(this), '/app/location/subscribe', request, key);
  }

  handleOnMonitorChange = async (currentMonitor) => {
    const res = await checkMonitorOnline({
      monitorId: currentMonitor.markerId,
    });
    if (res.statusCode === 200) {
      if (res.obj === 1) { // 1：校验通过
        const data = await checkMonitorBindObd({
          monitorId: currentMonitor.markerId,
        });

        if (data.statusCode === 200) {
          if (data.obj.isBandObdSensor === true) {
            this.cancelSub();
            this.setState({
              currentMonitor,
            }, () => {
              this.againSub();
            });
          } else {
            toastShow(getLocale('vehicleUnbindObd'), { duration: 2000 });
          }
        } else if (data.error === 'invalid_token') {
          storage.remove({
            key: 'loginState',
          });
          tokenOverdue();
        } else if (data.error === 'request_timeout') {
          NetworkModal.show({ type: 'timeout' });
        } else if (data.error !== 'network_lose_connected') {
          serviceError();
        } else {
          serviceConnectError();
        }
      } else if (res.obj === 2) { // 2：不在线
        toastShow(getLocale('monitorOffLine'), { duration: 2000 });
      } else if (res.obj === 4) { // 4: 从未上线
        toastShow(getLocale('monitorNeverOnLine'), { duration: 2000 });
      }
    } else if (res.error === 'invalid_token') {
      storage.remove({
        key: 'loginState',
      });
      tokenOverdue();
    } else if (res.error === 'request_timeout') {
      NetworkModal.show({ type: 'timeout' });
    } else if (res.error !== 'network_lose_connected') {
      serviceError();
    } else {
      serviceConnectError();
    }
  }

  strangeTime2Str (strange) {
    const d = strange.toString().split('');
    return `20${d[0]}${d[1]}-${d[2]}${d[3]}-${d[4]}${d[5]} ${d[6]}${d[7]}:${d[8]}${d[9]}:${d[10]}${d[11]}`;
  }

  render () {
    const {
      monitors,
    } = this.props;
    const { currentMonitor, odbData } = this.state;
    let fields = [];
    if (!isEmpty(odbData) && !isEmpty(odbData.obj)) {
      fields = showList.filter((key) => {
        if (odbData.obj[key] !== undefined) {
          return true;
        }
        return false;
      });
    }

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          {
            !isEmpty(odbData) && (
              <View style={styles.content}>
                <View style={styles.carInfoContainer}>
                  <View style={styles.carContainer}>
                    <Image source={CarIcon} style={styles.carImg} resizeMode="contain" />
                    <Text style={styles.carText}>{currentMonitor.title}</Text>
                  </View>
                  <View style={styles.carMainInfoContainer}>
                    <Text style={styles.carMainInfo}>{getLocale('currentTime')}</Text>
                    <Text style={styles.carMainInfo}>
                      {this.strangeTime2Str(odbData.obj.gpsTime)}
                    </Text>
                  </View>
                  <View style={styles.carMainInfoContainer}>
                    <Text style={[styles.position, styles.carMainInfo]}>{getLocale('currentPos')}</Text>
                    <ScrollView
                      horizontal
                      style={styles.positionText}
                    >
                      <Text style={styles.carMainInfo}>{odbData.obj.address}</Text>
                    </ScrollView>
                  </View>
                </View>
                <CellTitle title={getLocale('liveData')} />

                {
                  fields.length > 0 ? (
                    <ScrollView style={styles.detailInfoContainer}>
                      {
                        fields.map((key) => {
                          const text = getLocale(key).split('|');
                          const title = text[0];
                          const unit = text.length === 2 ? text[1] : '';
                          return (
                            <Cell
                              title={title}
                              content={odbData.obj[key].toString() + unit}
                            />
                          );
                        })
                      }
                    </ScrollView>
                  ) : (
                    <View style={styles.failedContainer}>
                      <Text style={styles.noData}>{getLocale('noObdData')}</Text>
                    </View>
                  )
                }
              </View>
            )
          }
          <View style={styles.toolBarContainer}>
            <ToolBar
              arrowShow
              activeMonitor={currentMonitor}
              monitors={monitors}
              onChange={this.handleOnMonitorChange}
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
  }),
)(ObdMonitor);