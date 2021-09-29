import React, { Component } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
// import DatePicker from 'react-native-datepicker';
import PropTypes from 'prop-types';
import * as timeFormat from 'd3-time-format';
import TimeModal from '../../../common/timerModal';
import SelectMonitorModal from '../../../common/checkMonitor/index';// 顶部导航
import { getLocale } from '../../../utils/locales';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';
import { toastShow } from '../../../utils/toastUtils';
import { isEmpty } from '../../../utils/function';
import { BarChart, PieChart } from '../../../common/reactNativeD3Charts';
import IconAlarm2 from '../../../static/image/alarm2.png';
import IconList from '../../../static/image/list.png';

import { getUserSetting } from '../../../server/getStorageData';
import { getDefaultMonitors } from '../../../server/getData';
import { serviceError, tokenOverdue, serviceConnectError } from '../../../utils/singleSignOn';
import storage from '../../../utils/storage';
import NetworkModal from '../../../utils/networkModal';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  block: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eeeeee',
    marginBottom: 5,
  },
  rightTouch: {
    borderColor: 'white',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginRight: 10,
  },
  rightTouchText: {
    color: 'white',
    fontSize: 12,
  },
  toolBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100,
  },
  dateContainer: {
    height: 40,
    backgroundColor: '#fafbfd',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    bottom: 30,
    zIndex: 99,
  },
  dateWraper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  date: {
    fontSize: 15,
    color: '#616161',
  },
  dateActive: {
    color: '#3399ff',
  },
  selected: {
    borderLeftColor: '#dedede',
    borderLeftWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    flex: 1,
  },
  listIcon: {
    width: 22,
    height: 22,
    bottom: -2,
  },
  listText: {
    fontSize: 17,
    color: '#616161',
  },
  currentDate: {
    height: 20,
    fontSize: 14,
    textAlign: 'center',
    color: '#898989',
    paddingTop: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    paddingHorizontal: 30,
  },
  totalWraper: {
    borderBottomColor: '#e2e2e2',
    borderBottomWidth: 1,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmIcon: {
    width: 20,
    height: 20,
    bottom: -6,
    left: -3,
  },
  totalText: {
    fontSize: 14,
    color: '#333333',
  },
  totalNumber: {
    fontSize: 30,
  },
  maxMinContainer: {
    paddingBottom: 5,
    paddingLeft: 30,
    marginBottom: 10,
    minWidth: 130,
  },
  maxContainer: {
    paddingLeft: 0,
    borderRightColor: '#e2e2e2',
    borderRightWidth: 1,
  },
  maxMinText: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
  },
  txtRight: {
    paddingRight: 30,
    textAlign: 'center',
  },
  maxMinNumber: {
    fontSize: 25,
    fontStyle: 'italic',
    marginRight: 3,
  },
  barContainer: {
    height: 200,
    backgroundColor: 'white',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 30,
    flexWrap: 'wrap',
  },
  tag: {
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 13,
  },
  tagActiveText: {
    color: 'white',
  },
  whole: {
    borderColor: '#3399ff',
  },
  wholeText: {
    color: '#3399ff',
  },
  wholeActive: {
    backgroundColor: '#3399ff',
  },

  exception: {
    borderColor: '#df77be',
  },
  exceptionText: {
    color: '#df77be',
  },
  exceptionActive: {
    backgroundColor: '#df77be',
  },

  crash: {
    borderColor: '#f3627b',
  },
  crashText: {
    color: '#f3627b',
  },
  crashActive: {
    backgroundColor: '#f3627b',
  },
  cluster: {
    borderColor: '#fbd536',
  },
  clusterText: {
    color: '#fbd536',
  },
  clusterActive: {
    backgroundColor: '#fbd536',
  },

  tired: {
    borderColor: '#4dcb73',
  },
  tiredText: {
    color: '#4dcb73',
  },
  tiredActive: {
    backgroundColor: '#4dcb73',
  },

  distraction: {
    borderColor: '#37cbcb',
  },
  distractionText: {
    color: '#37cbcb',
  },
  distractionActive: {
    backgroundColor: '#37cbcb',
  },
  intenseDriving: {
    borderColor: '#FDA127',
  },
  intenseDrivingText: {
    color: '#FDA127',
  },
  intenseDrivingActive: {
    backgroundColor: '#FDA127',
  },
  pieContainer: {
    height: 300,
    backgroundColor: 'white',
    justifyContent: 'flex-start',
    paddingTop: 15,
  },
});
const timeFormator = timeFormat.timeFormat('%Y-%m-%d');

export default class AlarmRankContent extends Component {
  data={
    startTime: null,
    oldStartTime: null,
  }


  static propTypes = {
    startTime: PropTypes.object,
    endTime: PropTypes.object,
    monitors: PropTypes.object,
    checkMonitors: PropTypes.object.isRequired,
    activeMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    barChartData: PropTypes.object,
    pieChartData: PropTypes.object,
    isSuccess: PropTypes.bool.isRequired,
    queryPeriod: PropTypes.number.isRequired,
    onInit: PropTypes.func.isRequired,
    detailsData: PropTypes.object,
    getDetailData: PropTypes.func.isRequired,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps={
    monitors: null,
    barChartData: null,
    activeMonitor: null,
    pieChartData: null,
    startTime: null,
    endTime: null,
    detailsData: null,
    currentIndex: null,
    extraState: null,
  }


  constructor(props) {
    super(props);
    const {
      activeMonitor,
      monitors,
      onInit,
      startTime: startTimeInProp,
      endTime: endTimeInProp,
    } = this.props;
    const { route: { params: { checkMonitors } } } = this.props;

    const startTime = isEmpty(startTimeInProp)
      ? new Date(new Date().setHours(0, 0, 0, 0))
      : startTimeInProp;
    const endTime = isEmpty(endTimeInProp) ? new Date() : endTimeInProp;

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

    const startTimeStr = timeFormator(startTime);
    const endTimeStr = timeFormator(endTime);

    if (checkMonitors.monitors && checkMonitors.monitors.length > 0) {
      onInit({
        monitors: checkMonitors.monitors,
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
      this.state.selectedMonitors = checkMonitors;
    } else { // 从其他页面点击返回按钮进入本页面
      getUserSetting().then((setRes) => {
        const num = setRes.app.maxStatObjNum || 100;// 获取用户在后台配置的最多勾选数量

        this.getCheckMonitor(num, startTimeStr, endTimeStr);
      }).catch((err) => {
        this.getCheckMonitor(100, startTimeStr, endTimeStr);
        console.log(err);
      });
    }

    this.state.currentMonitor = currentMonitor;
    this.state.startTime = startTime;
    this.state.endTime = endTime;
    this.state.startTimeStr = startTimeStr;
    this.state.endTimeStr = endTimeStr;
  }

  state={
    first: true,
    selectedMonitors: null,
    currentMonitor: null,
    currentDateType: 'today', // today,week,month,custom
    currentAlarmType: 'whole', // whole,exception,crash,cluster,tired,distraction
    startTime: null,
    startTimeStr: null,
    endTime: null,
    endTimeStr: null,
    // startButtonKey: null,
    customStartDate: new Date(),
    showCheckModal: false,
    maxDay: 31,
    isShwoModal: false,
  }


  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      initStatus, isSuccess, extraState,
    } = nextProps;

    if (initStatus === 'end' && isSuccess === false) {
      // toastShow(getLocale('requestFailed'), { duration: 2000 });
      // serviceError();
    }

    if (extraState) {
      const newState = {};
      const jsExtraState = extraState.toJS();
      const keys = Object.keys(jsExtraState);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        newState[key] = jsExtraState[key];
      }

      this.setState(newState);
    }

    this.setState({
      first: false,
    });
  }

  shouldComponentUpdate(nextProps) {
    const { initStatus } = nextProps;
    if (initStatus === 'ing') {
      return false;
    }
    return true;
  }

  // 获取默认勾选监控对象
  getCheckMonitor=(num, startTimeStr, endTimeStr) => {
    const params = {
      type: '0',
      defaultSize: num,
      isFilter: true,
    };
    // 获取默认选中监控对象
    getDefaultMonitors(params).then((res) => {
      const monitorsObj = res;
      const newCheckMonitors = {
        assIds: [],
        hasCheckItems: [],
        monitors: [],
      };
      if (monitorsObj.statusCode === 200) {
        newCheckMonitors.monitors = monitorsObj.obj;
        if (monitorsObj.obj.length > 0) {
          const { onInit } = this.props;
          const { status } = this.state;
          onInit({
            monitors: newCheckMonitors.monitors,
            startTime: startTimeStr,
            endTime: endTimeStr,
            status,
          });
          this.state.selectedMonitors = newCheckMonitors;
        } else {
          toastShow(getLocale('notHasMonitor'), { duration: 2000 });
        }
      } else if (monitorsObj.error === 'invalid_token') {
        storage.remove({
          key: 'loginState',
        });
        tokenOverdue();
      } else if (monitorsObj.error === 'request_timeout') {
        NetworkModal.show({ type: 'timeout' });
      } else if (monitorsObj.error !== 'network_lose_connected') {
        serviceError();
      } else {
        serviceConnectError();
      }
    });
  }

  showMenu=() => {
    this.setState({
      showCheckModal: true,
    });
  }

  getTotalText=() => {
    const { currentAlarmType } = this.state;
    switch (currentAlarmType) {
      case 'whole':
        return `${getLocale('totalAlarmNum')} `;
      case 'tired':
        return `${getLocale('tiredTotalNum')} `;
      case 'distraction':
        return `${getLocale('distractionTotalNum')} `;
      case 'exception':
        return `${getLocale('exceptionTotalNum')} `;
      case 'crash':
        return `${getLocale('crashTotalNum')} `;
      case 'cluster':
        return `${getLocale('clusterTotalNum')} `;
      case 'intenseDriving':
        return `${getLocale('intenseDrivingNum')} `;

      default:
        return `${getLocale('totalAlarmNum')} `;
    }
  }

  handlePress=(index, sameDay) => {
    const { resetDetails, getDetailData } = this.props;

    if (index === null || sameDay) {
      resetDetails({
        currentIndex: index,
      });
      return;
    }

    getDetailData({
      index,
    });
  }

  getRiskType=(type) => {
    let riskType;
    switch (type) {
      case 'tired':
        riskType = 1;
        break;
      case 'distraction':
        riskType = 2;
        break;
      case 'exception':
        riskType = 3;
        break;
      case 'crash':
        riskType = 4;
        break;
      case 'cluster':
        riskType = 5;
        break;
      case 'intenseDriving':
        riskType = 6;
        break;
      default:
        riskType = '';
        break;
    }
    return riskType;
  }

  handleTypePress=(type) => {
    const { onInit } = this.props;
    const {
      currentAlarmType, selectedMonitors, startTimeStr, endTimeStr,
    } = this.state;

    if (currentAlarmType !== type) {
      // 1（疲劳），2（分心），3（异常），4,(碰撞)，5（组合），6（激烈驾驶）不传默认汇总。
      const riskType = this.getRiskType(type);

      onInit({
        monitors: selectedMonitors.monitors,
        startTime: startTimeStr,
        endTime: endTimeStr,
        riskType,
        extraState: {
          currentAlarmType: type,
        },
      });
    }
  }

  handleDatePress=(type) => {
    const { onInit } = this.props;
    const { currentDateType, selectedMonitors, currentAlarmType } = this.state;

    if (type !== 'custom' && currentDateType !== type) {
      let startTime;
      let endTime;
      const now = new Date();
      if (type === 'today') {
        startTime = new Date(now.setHours(0, 0, 0, 0));
        endTime = new Date();
      } else if (type === 'week') {
        now.setDate(now.getDate() - 6);
        now.setHours(0, 0, 0, 0);
        startTime = now;
        endTime = new Date();
      } else if (type === 'month') {
        now.setDate(now.getDate() - 30);
        now.setHours(0, 0, 0, 0);
        startTime = now;
        endTime = new Date();
      }
      const startTimeStr = timeFormator(startTime);
      const endTimeStr = timeFormator(endTime);

      const riskType = this.getRiskType(currentAlarmType);
      onInit({
        monitors: selectedMonitors.monitors,
        startTime: startTimeStr,
        endTime: endTimeStr,
        riskType,
        extraState: {
          currentDateType: type,
          startTime,
          endTime,
          startTimeStr,
          endTimeStr,
        },
      });
    } else if (type === 'custom') {
      // this.startDatePickerRef.onPressDate();
      this.setState({
        isShwoModal: true,
      });
    }
  }

  // 日期选择回调
  handleCustomDateChange=(start, end) => {
    const { onInit } = this.props;
    const {
      startTime,
      selectedMonitors,
      currentAlarmType,
    } = this.state;

    const startDate = new Date(start.replace(/-/g, '/'));
    const endDate = new Date(end.replace(/-/g, '/'));
    this.data.oldStartTime = startTime;
    this.data.startTime = startDate;

    const startTimeStr = timeFormator(startDate);
    const endTimeStr = timeFormator(endDate);
    this.setState({
      customStartDate: startDate,
      isShwoModal: false,
    });

    const riskType = this.getRiskType(currentAlarmType);
    onInit({
      monitors: selectedMonitors.monitors,
      startTime: startTimeStr,
      endTime: endTimeStr,
      riskType,
      extraState: {
        currentDateType: 'custom',
        startTime: startDate,
        endTime: endDate,
        startTimeStr,
        endTimeStr,
      },
    });
    this.setState();
  }

  /* handleStartDateChange=(date) => {
    const { startTime } = this.state;
    this.data.startTime = new Date(date.replace(/-/g, '/'));
    this.data.oldStartTime = startTime;
    this.setState({
      customStartDate: this.data.startTime,
    }, () => {
      setTimeout(() => {
        this.endDatePickerRef.onPressDate();
      }, 500);
    });
  }

  handleEndDateChange=(date) => {
    const { queryPeriod, onInit } = this.props;
    const { selectedMonitors, currentAlarmType } = this.state;
    const { startTime } = this.data;
    const endTime = new Date(date.replace(/-/g, '/'));

    if (startTime > endTime) {
      toastShow(getLocale('timePrompt'), { duration: 2000 });
      return;
    }

    const tmpStartTime = new Date(startTime);
    if (queryPeriod !== null && queryPeriod > 0) {
      tmpStartTime.setDate(
        tmpStartTime.getDate() + queryPeriod - 1,
      );
      if (tmpStartTime < endTime) {
        toastShow(getLocale('timePrompt2').replace('$d', queryPeriod), { duration: 2000 });
        return;
      }
    }

    const startTimeStr = timeFormator(startTime);
    const endTimeStr = timeFormator(endTime);
    const riskType = this.getRiskType(currentAlarmType);
    onInit({
      monitors: selectedMonitors.monitors,
      startTime: startTimeStr,
      endTime: endTimeStr,
      riskType,
      extraState: {
        currentDateType: 'custom',
        startTime,
        endTime,
        startTimeStr,
        endTimeStr,
      },
    });
    this.setState();
  }


  handleEndCloseModal = () => {
    const { oldStartTime } = this.data;
    // this.startDatePickerRef.props.date = oldStartTime;
    this.setState({
      startTime: oldStartTime,
      startButtonKey: `__startButtonKey__${Math.random().toString()}`,
    });
  } */

  isEmptyOrNull=(data) => {
    if (isEmpty(data)) {
      return true;
    }
    let flag = true;
    for (let i = 0; i < data.length; i += 1) {
      const element = data[i];
      if (element.value > 0) {
        flag = false;
        break;
      }
    }
    return flag;
  }

  aggregateData(data) {
    let min = null;
    let minCar = [];
    let sum = 0;
    let max = null;
    let maxCar = [];
    let minCarStr = '';
    let maxCarStr = '';

    for (let i = 0; i < data.length; i += 1) {
      const element = data[i].riskToal;

      sum += element;
      if (max === null || element >= max) {
        if (element > max) {
          maxCar = [data[i].name];
        } else {
          maxCar.push(data[i].name);
        }
        max = element;
      }
      if (min === null || element <= min) {
        if (element < min) {
          minCar = [data[i].name];
        } else {
          minCar.push(data[i].name);
        }
        min = element;
      }
    }

    maxCarStr = maxCar.length > 0 ? maxCar[0] : '';
    minCarStr = minCar.length > 0 ? minCar[0] : '';
    return {
      sum,
      max: max || 0,
      maxMileageMonitors: maxCar.length > 1 ? `${maxCarStr}...` : maxCarStr,
      min: min || 0,
      minMileageMonitors: minCar.length > 1 ? `${minCarStr}...` : minCarStr,
    };
  }

  detailsDataAssembly = (data) => {
    if (isEmpty(data)) {
      return [];
    }
    const info = data.toJS();

    const details = [];
    const keys = Object.keys(info).sort((x1, x2) => new Date(x1) - new Date(x2));
    for (let i = 0; i < keys.length; i += 1) {
      details.push({
        name: keys[i].substr(keys[i].length - 2, 2),
        value: info[keys[i]] > 99999 ? 99999 : info[keys[i]],
      });
    }
    return details;
  }

  confirmFun = (data) => {
    const { onInit } = this.props;
    const {
      startTimeStr, endTimeStr, riskType,
    } = this.state;

    // 先关闭弹层再进行请求，解决选择监控对象后点击确定按钮没有及时反馈的bug
    this.setState({
      showCheckModal: false,
    }, () => {
      onInit({
        monitors: data.monitors,
        startTime: startTimeStr,
        endTime: endTimeStr,
        riskType,
        extraState: {
          selectedMonitors: data,
          currentIndex: null,
          showCheckModal: false,
        },
      });
    });
  };

  // 关闭日期选择弹层
  hideModal=() => {
    this.setState({
      isShwoModal: false,
    });
  }

  render() {
    const {
      initStatus,
      monitors,
      barChartData,
      pieChartData,
      queryPeriod,
      detailsData,
      currentIndex,
    } = this.props;
    const {
      first,
      currentDateType,
      startTimeStr,
      endTimeStr,
      currentMonitor,
      startTime,
      endTime,
      // startButtonKey,
      customStartDate,
      currentAlarmType,
      selectedMonitors,
      showCheckModal,
      maxDay,
      isShwoModal,
    } = this.state;

    if (first) {
      return null;
    }

    const barDetailsData = this.detailsDataAssembly(detailsData);

    const barData = isEmpty(barChartData) ? [] : barChartData.toJS();

    const agg = this.aggregateData(barData);
    const barDataObject = barData.map(x => ({
      value: x.riskToal > 99999 ? 99999 : x.riskToal,
      name: x.name,
    }));

    const pieDataObject = [
      {
        value: isEmpty(pieChartData) ? 0 : pieChartData.get('cluster'),
        svg: { fill: '#fbd536' },
        label: getLocale('cluster'),
      },
      {
        value: isEmpty(pieChartData) ? 0 : pieChartData.get('exception'),
        svg: { fill: '#df77be' },
        label: getLocale('exception'),
      },
      {
        value: isEmpty(pieChartData) ? 0 : pieChartData.get('crash'),
        svg: { fill: '#f3637c' },
        label: getLocale('crash'),
      },
      {
        value: isEmpty(pieChartData) ? 0 : pieChartData.get('distraction'),
        svg: { fill: '#37cbcc' },
        label: getLocale('distraction'),
      },
      {
        value: isEmpty(pieChartData) ? 0 : pieChartData.get('tired'),
        svg: { fill: '#4dcb73' },
        label: getLocale('tired'),
      },
      {
        value: isEmpty(pieChartData) ? 0 : pieChartData.get('intenseDriving'),
        svg: { fill: '#FDA127' },
        label: getLocale('intenseDriving'),
      },
    ];

    let endMaxDate = new Date(customStartDate);
    // const startMinDate = new Date(customStartDate);

    if (queryPeriod !== null && queryPeriod > 0) {
      endMaxDate.setDate(
        endMaxDate.getDate() + queryPeriod - 1,
      );
    } else {
      endMaxDate.setDate(
        endMaxDate.getDate() + 1,
      );
    }
    const todayEndTime = new Date();
    todayEndTime.setHours(23, 59, 59);
    if (endMaxDate > todayEndTime) {
      endMaxDate = todayEndTime;
    }

    const sameDay = (Math.abs(startTime.getFullYear() - endTime.getFullYear())
    + Math.abs(startTime.getMonth() - endTime.getMonth())
    + Math.abs(startTime.getDate() - endTime.getDate())) === 0;

    const selectedLength = selectedMonitors && selectedMonitors.monitors
      ? selectedMonitors.monitors.length : 0;

    return (
      <View style={styles.container}>
        {
          initStatus === 'ing' ? <Loading type="modal" /> : null
        }
        {
          showCheckModal
            ? (
              <SelectMonitorModal
                checkMonitorsData={selectedMonitors}
                confirmFun={this.confirmFun}
                cancelFun={() => {
                  this.setState({
                    showCheckModal: false,
                  });
                }}
                dataType={1}
              />
            )
            : null
        }
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => { this.handleDatePress('today'); }} style={styles.dateWraper}>
            <Text style={[styles.date, currentDateType === 'today' && styles.dateActive]}>{getLocale('today')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { this.handleDatePress('week'); }} style={styles.dateWraper}>
            <Text style={[styles.date, currentDateType === 'week' && styles.dateActive]}>{getLocale('week')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { this.handleDatePress('month'); }} style={styles.dateWraper}>
            <Text style={[styles.date, currentDateType === 'month' && styles.dateActive]}>{getLocale('month')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { this.handleDatePress('custom'); }} style={styles.dateWraper}>
            <Text style={[styles.date, currentDateType === 'custom' && styles.dateActive]}>{getLocale('custom')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selected} onPress={() => { this.showMenu(); }}>
            <Image source={IconList} resizeMode="contain" style={styles.listIcon} />
            <Text style={styles.listText}>{`  (${selectedLength})`}</Text>
          </TouchableOpacity>
        </View>
        {/* 内容 */}
        <ScrollView>
          <View style={[styles.content]}>
            <View style={styles.block}>
              <Text style={styles.currentDate}>{`${startTimeStr} 00:00:00 ~ ${endTimeStr} 23:59:59`}</Text>
              <View style={[styles.totalContainer]}>
                <View style={styles.totalWraper}>
                  <Image source={IconAlarm2} resizeMode="contain" style={styles.alarmIcon} />
                  <Text style={styles.totalText}>
                    {this.getTotalText()}
                    <Text style={styles.totalNumber}>{agg.sum > 999999 ? '>999999' : agg.sum}</Text>
                    {`${getLocale('ge')} `}
                  </Text>
                </View>
              </View>
              <View style={styles.totalContainer}>
                <View style={[styles.maxMinContainer, styles.maxContainer]}>
                  <Text style={[styles.maxMinText, styles.txtRight]}>
                    {`${getLocale('highest')} `}
                    <Text style={styles.maxMinNumber}>{agg.max > 99999 ? '>99999' : agg.max}</Text>
                    {`${getLocale('ge')} `}
                  </Text>
                  <Text style={[styles.maxMinText, styles.txtRight]}>
                    <Text>{agg.maxMileageMonitors && agg.maxMileageMonitors !== 'null' ? agg.maxMileageMonitors : '-'}</Text>
                  </Text>
                </View>
                <View style={styles.maxMinContainer}>
                  <Text style={styles.maxMinText}>
                    {`${getLocale('lowest')} `}
                    <Text style={styles.maxMinNumber}>{agg.min}</Text>
                    {`${getLocale('ge')} `}
                  </Text>
                  <Text style={styles.maxMinText}>
                    <Text>{agg.minMileageMonitors && agg.minMileageMonitors !== 'null' ? agg.minMileageMonitors : '-'}</Text>
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.block}>
              <View style={styles.barContainer}>
                {
                  !isEmpty(barDataObject) && (
                    <BarChart
                      style={{ height: 200, backgroundColor: 'white' }}
                      currentIndex={currentIndex}
                      data={barDataObject}
                      onPressBar={this.handlePress}
                      detailData={barDetailsData}
                      hiddenBarText={currentDateType === 'today' || sameDay}
                      unit={getLocale('ge')}
                    />
                  )
                }
              </View>
              <View style={[styles.tagContainer, { justifyContent: 'center' }]}>
                <TouchableOpacity
                  style={[styles.tag, styles.whole, currentAlarmType === 'whole' && styles.wholeActive]}
                  onPress={() => { this.handleTypePress('whole'); }}
                >
                  <Text style={[styles.tagText, styles.wholeText, currentAlarmType === 'whole' && styles.tagActiveText]}>{getLocale('whole')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tag, styles.cluster, currentAlarmType === 'cluster' && styles.clusterActive]}
                  onPress={() => { this.handleTypePress('cluster'); }}
                >
                  <Text style={[styles.tagText, styles.clusterText, currentAlarmType === 'cluster' && styles.tagActiveText]}>{getLocale('cluster')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tag, styles.exception, currentAlarmType === 'exception' && styles.exceptionActive]}
                  onPress={() => { this.handleTypePress('exception'); }}
                >
                  <Text style={[styles.tagText, styles.exceptionText, currentAlarmType === 'exception' && styles.tagActiveText]}>{getLocale('exception')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tag, styles.crash, currentAlarmType === 'crash' && styles.crashActive]}
                  onPress={() => { this.handleTypePress('crash'); }}
                >
                  <Text style={[styles.tagText, styles.crashText, currentAlarmType === 'crash' && styles.tagActiveText]}>{getLocale('crash')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tag, styles.tired, currentAlarmType === 'tired' && styles.tiredActive]}
                  onPress={() => { this.handleTypePress('tired'); }}
                >
                  <Text style={[styles.tagText, styles.tiredText, currentAlarmType === 'tired' && styles.tagActiveText]}>{getLocale('tired')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tag, styles.distraction, currentAlarmType === 'distraction' && styles.distractionActive]}
                  onPress={() => { this.handleTypePress('distraction'); }}
                >
                  <Text style={[styles.tagText, styles.distractionText, currentAlarmType === 'distraction' && styles.tagActiveText]}>{getLocale('distraction')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tag, styles.intenseDriving, currentAlarmType === 'intenseDriving' && styles.intenseDrivingActive]}
                  onPress={() => { this.handleTypePress('intenseDriving'); }}
                >
                  <Text style={[styles.tagText, styles.intenseDrivingText, currentAlarmType === 'intenseDriving' && styles.tagActiveText]}>{getLocale('intenseDriving')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pieContainer}>
                {
                  !this.isEmptyOrNull(pieDataObject) && (
                    <PieChart
                      style={{ height: 240 }}
                      data={pieDataObject.sort((x1, x2) => x2.value - x1.value)}
                      labelFormat="PERCENT"
                      innerRadius={0}
                      labelTextPosition="LEFT"
                      outerRadius="50%"
                    />
                  )
                }
              </View>
              {/* 自定义日期控件 */}
              <TimeModal
                isShwoModal={isShwoModal}
                hideCallBack={this.hideModal}
                maxDay={maxDay}
                startDate={timeFormator(startTime)}
                endDate={timeFormator(endTime)}
                dateCallBack={this.handleCustomDateChange}
                isEqualStart
                mode="date"
                title="选择日期"
              />
            </View>

          </View>
        </ScrollView>
        <View style={styles.toolBarContainer}>
          <ToolBar
            initStatus={initStatus}
            activeMonitor={currentMonitor}
            monitors={monitors}
            onChange={this.handleOnMonitorChange}
          />
        </View>

      </View>
    );
  }
}
