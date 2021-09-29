import React, { Component } from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import { stack } from 'd3-shape';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { resetHttpConfig } from './utils/env';
import Loading from './common/loading';
import Welcome from './common/welcome';
// import { back } from './utils/routeCondition';
import Login from './views/login/login';
import Home from './views/home/home';
import MonitorSearch from './views/monitorSearch';
import MonitorDetail from './views/monitorDetail';
import MonitorTrack from './views/monitorTrack';
import HistoryData from './views/historyData';
// import SearchBar from './views/monitorSearch/componentSearchBar';
import AlarmCenter from './views/alarmModule/alarmCenter';
import AlarmInfo from './views/alarmModule/alarmInfo';
import AlarmSwitch from './views/alarmModule/alarmSwitch';
import PersonalCenter from './views/personalCenter'; // 个人中心
import UserInfo from './views/personalCenter/userInfo/index';// 用户信息
import SystemSetting from './views/personalCenter/systemSetting';// 系统设置
import Feedback from './views/personalCenter/feedback';// 意见反馈
import AboutUs from './views/personalCenter/aboutUs'; // 关于我们
import ChangePassword from './views/personalCenter/changePassword'; // 关于我们
import MonitorWake from './views/monitorWake';// 实时尾迹
import MonitorVideo from './views/monitorVideo';// 音视频监控
import Security from './views/security';// 主动安全
import SecurityInfo from './views/securityInfo';// 安全信息
import IntegrativeStatistics from './views/integratedStatistics/main';// 综合统计
import AlarmRank from './views/integratedStatistics/alarmRank';// 报警排名
import OnlineStatistics from './views/integratedStatistics/onlineStatistics';// 上线统计
// import LedBillboard from './views/ledBillboard';// 领导看板
import SpeedingStatistics from './views/integratedStatistics/speedingStatistics'; // 超速统计
import AlarmDisposal from './views/integratedStatistics/alarmDisposal'; // 报警处置
import MileStatistics from './views/integratedStatistics/mileStatistics'; // 行驶统计
import StopStatistics from './views/integratedStatistics/stopStatistics'; // 停止统计
import WorkingStatistics from './views/integratedStatistics/workingStatistics'; // 工时统计
import FuelMileageStatistics from './views/integratedStatistics/fuelMileageStatistics'; // 油量里程
import DevicesStatistics from './views/integratedStatistics/devicesStatistics'; // 里程统计
import FuelConsumptionStatistics from './views/integratedStatistics/fuelConsumptionStatistics'; // 油耗里程
import ObdMonitor from './views/obdMonitor'; // obd监控
import VideoPlayback from './views/videoPlayback'; // 视频回放
import ExpireMsg from './views/personalCenter/expireMsg';

resetHttpConfig();

const Stack = createStackNavigator();

class Navigator extends Component {
  static propTypes = {
    onInit: PropTypes.func.isRequired,
    isLoaded: PropTypes.bool.isRequired,
    hasToken: PropTypes.bool.isRequired,
    showWelcome: PropTypes.bool.isRequired,
    onEnter: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    const { onInit } = props;
    onInit();
  }

  render () {
    const {
      isLoaded, hasToken, showWelcome, onEnter,
    } = this.props;

    if (!isLoaded) {
      return (
        <Loading type="page" />
      );
    }

    if (showWelcome) {
      return (
        <Welcome onEnter={onEnter} />
      );
    }

    return (
      <SafeAreaProvider>

        <Stack.Navigator
          initialRouteName={hasToken ? 'home' : 'login'}
          screenOptions={() => ({
            gestureEnabled: false,
            ...TransitionPresets.SlideFromRightIOS,
          })}
        >
          <Stack.Screen
            name="login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="home"
            component={Home}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="videoPlayback"
            component={VideoPlayback}
            options={VideoPlayback.navigationOptions}
          />
          <Stack.Screen
            name="monitorDetail"
            component={MonitorDetail}
            options={MonitorDetail.navigationOptions}
          />
          <Stack.Screen
            name="monitorTrack"
            component={MonitorTrack}
            options={MonitorTrack.navigationOptions}
          />
          <Stack.Screen
            name="historyData"
            component={HistoryData}
            options={HistoryData.navigationOptions}
          />
          <Stack.Screen
            name="alarmRank"
            component={AlarmRank}
            options={AlarmRank.navigationOptions}
          />
          <Stack.Screen
            name="onlineStatistics"
            component={OnlineStatistics}
            options={OnlineStatistics.navigationOptions}
          />
          <Stack.Screen
            name="speedingStatistics"
            component={SpeedingStatistics}
            options={SpeedingStatistics.navigationOptions}
          />
          <Stack.Screen
            name="stopStatistics"
            component={StopStatistics}
            options={StopStatistics.navigationOptions}
          />
          <Stack.Screen
            name="mileStatistics"
            component={MileStatistics}
            options={MileStatistics.navigationOptions}
          />
          <Stack.Screen
            name="alarmDisposal"
            component={AlarmDisposal}
            options={AlarmDisposal.navigationOptions}
          />
          <Stack.Screen
            name="workingStatistics"
            component={WorkingStatistics}
            options={WorkingStatistics.navigationOptions}
          />
          <Stack.Screen
            name="fuelMileageStatistics"
            component={FuelMileageStatistics}
            options={FuelMileageStatistics.navigationOptions}
          />
          <Stack.Screen
            name="devicesStatistics"
            component={DevicesStatistics}
            options={DevicesStatistics.navigationOptions}
          />
          <Stack.Screen
            name="fuelConsumptionStatistics"
            component={FuelConsumptionStatistics}
            options={FuelConsumptionStatistics.navigationOptions}
          />
          <Stack.Screen
            name="monitorSearch"
            component={MonitorSearch}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="obdMonitor"
            component={ObdMonitor}
            options={ObdMonitor.navigationOptions}
          />
          <Stack.Screen
            name="alarmCenter"
            component={AlarmCenter}
            options={AlarmCenter.navigationOptions}
          />
          <Stack.Screen
            name="alarmInfo"
            component={AlarmInfo}
            options={AlarmInfo.navigationOptions}
          />
          <Stack.Screen
            name="alarmSwitch"
            component={AlarmSwitch}
            options={AlarmSwitch.navigationOptions}
          />
          <Stack.Screen
            name="integrativeStatistics"
            component={IntegrativeStatistics}
            options={IntegrativeStatistics.navigationOptions}
          />
          <Stack.Screen
            name="personalCenter"
            component={PersonalCenter}
            options={PersonalCenter.navigationOptions}
          />
          <Stack.Screen
            name="userInfo"
            component={UserInfo}
            options={UserInfo.navigationOptions}
          />
          <Stack.Screen
            name="systemSetting"
            component={SystemSetting}
            options={SystemSetting.navigationOptions}
          />
          <Stack.Screen
            name="feedback"
            component={Feedback}
            options={Feedback.navigationOptions}
          />
          <Stack.Screen
            name="aboutUs"
            component={AboutUs}
            options={AboutUs.navigationOptions}
          />
          <Stack.Screen
            name="changePassword"
            component={ChangePassword}
            options={ChangePassword.navigationOptions}
          />
          <Stack.Screen
            name="expireMsg"
            component={ExpireMsg}
            options={ExpireMsg.navigationOptions}
          />
          <Stack.Screen
            name="monitorWake"
            component={MonitorWake}
            options={MonitorWake.navigationOptions}
          />
          <Stack.Screen
            name="monitorVideo"
            component={MonitorVideo}
            options={MonitorVideo.navigationOptions}
          />
          {/* <Stack.Screen
            name="ledBillboard"
            component={LedBillboard}
            options={LedBillboard.navigationOptions}
          /> */}
          <Stack.Screen
            name="security"
            component={Security}
            options={Security.navigationOptions}
          />
          <Stack.Screen
            name="securityInfo"
            component={SecurityInfo}
            options={SecurityInfo.navigationOptions}
          />
        </Stack.Navigator>
      </SafeAreaProvider>
    );
  }
}

export default connect(
  state => ({
    isLoaded: state.getIn(['rootReducers', 'isLoaded']),
    hasToken: state.getIn(['rootReducers', 'hasToken']),
    showWelcome: state.getIn(['rootReducers', 'showWelcome']),
    key_: state.getIn(['rootReducers', 'key_']),
  }),
  dispatch => ({
    onInit: () => {
      dispatch({ type: 'root/SAGA/INIT_ACTION' });
    },
    onEnter: () => {
      dispatch({ type: 'root/ONENTER_ACTION' });
    },
  }),
)(Navigator);