import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import * as Animatable from 'react-native-animatable';
import { go } from '../../../utils/routeCondition';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
import { getUserSetting } from '../../../server/getStorageData';
// import { isEmpty } from '../../../utils/function';
// import {
//   getDefaultMonitors, judgeUserIfOwnSend, judgeUserPollingOilMassMonitor,
//   getWorkingStatisticalMonitor, getPollingOilMassMonitor,
//   getOilConsumptionMonitor,
// } from '../../../server/getData';
// import { toastShow } from '../../../utils/toastUtils';

import { getLocale } from '../../../utils/locales';
import wArrowRight from '../../../static/image/wArrowRight.png';
// import { serviceError, tokenOverdue, serviceConnectError } from '../../../utils/singleSignOn';
// import storage from '../../../utils/storage';
// import NetworkModal from '../../../utils/networkModal';
import IconAlarm1 from '../../../static/image/alarm1.png';
import IconAlarm2 from '../../../static/image/alarm2.png';
import IconRun1 from '../../../static/image/run1.png';
import IconSpeed1 from '../../../static/image/speedLimitState1.png';
import IconMeli1 from '../../../static/image/meli1.png';
import IconOnline1 from '../../../static/image/online1.png';
import StopState1 from '../../../static/image/stopState1.png';
import workIcon1 from '../../../static/image/work1.png';
import oilFuel1 from '../../../static/image/oilFuel1.png';
import oilUse1 from '../../../static/image/oilUse1.png';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  totalHeaderBox: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderTopColor: '#eee',
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  totalHeader: {
    padding: 12,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 16,
    color: '#555',
  },
  noData: {
    marginTop: 30,
    lineHeight: 25,
    textAlign: 'center',
  },
  panel_icon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
});

class IntegrativeStatistics extends Component {
  // 顶部导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('comprehensiveStatistics'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      totalData: [],
      maxNum: 100,
    };

    // 获取用户在后台配置的统计信息
    getUserSetting().then((res) => {
      const num = res.app.maxStatObjNum || 100;
      this.state.maxNum = num;

      const statistics = res.statistics || [];
      for (let i = 0; i < statistics.length; i += 1) {
        statistics[i].getType = 0;
        switch (statistics[i].name) {
          case getLocale('alarmRank'):// 报警排名
            statistics[i].goTarget = 'alarmRank';
            statistics[i].icon = IconAlarm2;
            break;
          case getLocale('alarmDisposal'):
            statistics[i].goTarget = 'alarmDisposal';// 报警处置
            statistics[i].icon = IconAlarm1;
            break;
          case getLocale('onlineStatistics'):// 上线统计
            statistics[i].goTarget = 'onlineStatistics';
            statistics[i].getType = 3;
            statistics[i].icon = IconOnline1;
            break;
          case getLocale('speedingStatistics'):// 超速统计
            statistics[i].goTarget = 'speedingStatistics';
            statistics[i].icon = IconSpeed1;
            break;
          case getLocale('mileStatistics'):// 行驶统计
            statistics[i].goTarget = 'mileStatistics';
            statistics[i].icon = IconRun1;
            break;
          case getLocale('stopStatistics'):// 停止统计
            statistics[i].goTarget = 'stopStatistics';
            statistics[i].icon = StopState1;
            break;
          case getLocale('workingStatistics'):// 工时统计
            statistics[i].goTarget = 'workingStatistics';
            statistics[i].icon = workIcon1;
            break;
          case getLocale('fuelMileageStatistics'):// 油量里程
            statistics[i].goTarget = 'fuelMileageStatistics';
            statistics[i].icon = oilFuel1;
            break;
          case getLocale('devicesStatistics'):// 里程统计
            statistics[i].goTarget = 'devicesStatistics';
            statistics[i].icon = IconMeli1;
            break;
          case getLocale('fuelConsumptionStatistics'):// 油耗里程
            statistics[i].goTarget = 'fuelConsumptionStatistics';
            statistics[i].icon = oilUse1;
            break;
          default:
            statistics[i].goTarget = '';
            statistics[i].icon = IconAlarm1;
            break;
        }
      }
      this.setState({ totalData: statistics });
    }).catch((err) => {
      this.setState({ totalData: [] });
      console.log(err);
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 跳转界面
  goTargetNav = (item) => {
    //  判断是否有监控对象
    const { route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const { maxNum } = this.state;
    const checkMonitors = {
      assIds: [],
      hasCheckItems: [],
      monitors: [],
      activeMonitor,
      item,
      maxNum,
    };
    go(item.goTarget, { checkMonitors });
  }

  renderItem(item) {
    return (
      <TouchableOpacity
        style={styles.totalHeaderBox}
        activeOpacity={0.8}
        key={item.name}
        onPress={() => { this.goTargetNav(item); }}
      >
        <View style={
          {
            display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }
        }
        >
          <Image
            source={item.icon}
            style={{ width: 20, height: 21, marginLeft: 12 }}
            resizeMode="contain"
          />
          <View style={
            {
              flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }
          }
          >
            <Text
              style={styles.totalHeader}
            >
              {item.name}
            </Text>
            <Image
              source={wArrowRight}
              style={styles.panel_icon}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const {
      totalData,
    } = this.state;
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          <ScrollView
            style={styles.container}
          >
            {totalData.map(item => this.renderItem(item))}
            {totalData.length === 0 ? (
              <Text style={styles.noData}>{getLocale('notHasStatistics')}</Text>
            ) : null}
          </ScrollView>
          <ToolBar
            activeMonitor={activeMonitor}
            monitors={monitors}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
  }),
  dispatch => ({
    // 获取报警设置数据
    getMonitorData: (payload) => {
      dispatch({ type: 'integrativeStatistics/SAGA/GETDATA_ACTION', payload });
    },
  }),
)(IntegrativeStatistics);