/* eslint no-bitwise:off */
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
// import DatePicker from 'react-native-datepicker';
import * as timeFormat from 'd3-time-format';
import TimeModal from '../../../common/timerModal';
import { getLocale } from '../../../utils/locales';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';
import { toastShow } from '../../../utils/toastUtils';
import { isEmpty, getHourFromSecond, getObjFromSecond } from '../../../utils/function';
import { BarChart } from '../../../common/reactNativeD3Charts';
import workIcon1 from '../../../static/image/work1.png';
import sensorIcon1 from '../../../static/image/sensor1.png';
import sensorActiveIcon1 from '../../../static/image/sensorActive1.png';
import sensorIcon2 from '../../../static/image/sensor2.png';
import sensorActiveIcon2 from '../../../static/image/sensorActive2.png';
import SelectMonitorModal from '../../../common/checkMonitor/index';
import IconList from '../../../static/image/list.png';
// const randomColor = () => (`#${(Math.random() * 0xFFFFFF << 0).toString(16)}000000`).slice(0, 7);

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
    // bottom: -6,
    // left: -3,
    marginRight: 3,
    marginBottom: -6,
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
    fontSize: 24,
    fontStyle: 'normal',
    marginRight: 4,
  },
  barContainer: {
    height: 200,
    backgroundColor: 'white',
  },
  pieContainer: {
    height: 300,
    backgroundColor: 'white',
  },
  defaultBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#c4c4c4',
    borderWidth: 1,
    marginRight: 20,
    width: 70,
    height: 30,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnView: {
    height: 30,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 3,
  },
  btnActive: {
    backgroundColor: '#339eff',
    borderColor: '#339eff',
  },
  btnText: {
    borderRadius: 3,
    height: 30,
    lineHeight: 30,
    width: 70,
    textAlign: 'center',
    color: '#ffffff',
  },
  engineBtn: {
    width: 24,
    height: 24,
    marginRight: 20,
    borderRadius: 12,
  },
  engineIcon: {
    width: 24,
    height: 24,
  },
  btnTextDefault: {
    color: '#c4c4c4',
  },
});
const timeFormator = timeFormat.timeFormat('%Y-%m-%d');

export default class WorkingStatisticsContent extends Component {
  static propTypes = {
    startTime: PropTypes.object,
    endTime: PropTypes.object,
    monitors: PropTypes.object,
    activeMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    barChartData: PropTypes.object,
    isSuccess: PropTypes.bool.isRequired,
    onInit: PropTypes.func.isRequired,
    navigation: PropTypes.object.isRequired,
    checkMonitors: PropTypes.object.isRequired,
    queryPeriod: PropTypes.number.isRequired,
    // detailsData: PropTypes.object,
    getDetails: PropTypes.func.isRequired,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps={
    monitors: null,
    barChartData: null,
    activeMonitor: null,
    startTime: null,
    endTime: null,
    // detailsData: null,
    currentIndex: null,
    extraState: null,
  }


  constructor(props) {
    super(props);
    const {
      monitors,
      onInit,
      startTime: startTimeInProp,
      endTime: endTimeInProp,
    } = this.props;
    const { route: { params: { checkMonitors, activeMonitor } } } = this.props;

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

    const { sensorNo } = this.state;

    if (checkMonitors.monitors && checkMonitors.monitors.length > 0) {
      onInit({
        monitors: checkMonitors.monitors,
        startTime: `${startTimeStr}`,
        endTime: `${endTimeStr}`,
        sensorNo,
      });
      this.state.selectedMonitors = checkMonitors;
    } else { // ????????????????????????????????????????????????
      getUserSetting().then((setRes) => {
        const num = setRes.app.maxStatObjNum || 100;// ????????????????????????????????????????????????

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
    startTime: null,
    startTimeStr: null,
    endTime: null,
    endTimeStr: null,
    dataTypeText: getLocale('totalWorkTime'),
    dataType: 0,
    sensorNo: 1,
    detailsData: null,
    // nameArr: [],
    // startButtonKey: null,
    customStartDate: new Date(),
    // startTimeSeconds: '00:00:00',
    // endTimeSeconds: '23:59:59',
    showCheckModal: false,
    maxDay: 31,
    isShwoModal: false,
  }

  data={
    startTime: null,
    oldStartTime: null,
  }

  componentDidMount() {
    const { navigation } = this.props;
    navigation.setParams({
      showMenu: this.showMenu,
    });
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

  // ??????????????????????????????
 getCheckMonitor=(num, startTimeStr, endTimeStr) => {
   const params = {
     type: '0',
     defaultSize: num,
     isFilter: false,
   };
   // ??????????????????????????????
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
         const { sensorNo } = this.state;
         onInit({
           monitors: newCheckMonitors.monitors,
           startTime: startTimeStr,
           endTime: endTimeStr,
           sensorNo,
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

  handlePress=(index, sameDay) => {
    const { getDetails, resetDetails, barChartData } = this.props;

    if (index === null || sameDay) {
      resetDetails({
        currentIndex: index,
      });
      return;
    }

    const attrName = this.getAttrName(true);
    const barData = isEmpty(barChartData) ? [] : barChartData.toJS();
    const barDataObject = barData.sort((a, b) => b[attrName] - a[attrName]);

    this.setState({
      detailsData: barDataObject[index],
    });
    getDetails({
      index,
    });
  }

  // ??????????????????????????????
  getAttrName=(flag) => {
    const { dataType } = this.state;
    let name = 'dailyWorkDuration';
    if (flag) {
      name = 'workDuration';
      if (dataType === 1) {
        name = 'standByDuration';
      } else if (dataType === 2) {
        name = 'haltDuration';
      }
    } else if (dataType === 1) {
      name = 'dailyStandByDuration';
    } else if (dataType === 2) {
      name = 'dailyHaltDuration';
    }
    return name;
  }

  aggregateData(data) {
    let min = null;
    let minCar = [];
    let sum = 0;
    let max = null;
    let maxCar = [];
    let minCarStr = '';
    let maxCarStr = '';
    const totolAttrName = this.getAttrName(true);

    for (let i = 0; i < data.length; i += 1) {
      const element = data[i][totolAttrName];
      sum += element;

      if (max === null || element >= max) {
        if (element > max) {
          maxCar = [data[i].monitorName];
        } else {
          maxCar.push(data[i].monitorName);
        }
        max = element;
      }
      if (min === null || element <= min) {
        if (element < min) {
          minCar = [data[i].monitorName];
        } else {
          minCar.push(data[i].monitorName);
        }
        min = element;
      }
    }

    maxCarStr = maxCar.length > 0 ? maxCar[0] : '';
    minCarStr = minCar.length > 0 ? minCar[0] : '';
    // ???????????????10????????????????????????
    sum = getObjFromSecond(sum);
    max = getObjFromSecond(max);
    min = getObjFromSecond(min);

    return {
      sum,
      max,
      min,
      maxMileageMonitors: maxCar.length > 1 ? `${maxCarStr}...` : maxCarStr,
      minMileageMonitors: minCar.length > 1 ? `${minCarStr}...` : minCarStr,
    };
  }

  renderTime = (data) => {
    if ('h' in data) {
      return (
        <Text>
          <Text style={[styles.maxMinNumber, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>
            {data.h || 0}
          </Text>
          h
        </Text>
      );
    }
    // ??????10?????????????????????
    return (
      <Text>
        <Text style={[styles.maxMinNumber, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>
          {data.s || 0}
        </Text>
        m
        <Text style={[styles.maxMinNumber, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>
          {data.s || 0}
        </Text>
        s
      </Text>
    );
  }

  handleTypePress(index) {
    // 0 ???????????? 1 ???????????? 2????????????
    let dataTypeText = getLocale('totalWorkTime');
    if (index === 1) {
      dataTypeText = getLocale('totalStandbyTime');
    } else if (index === 2) {
      dataTypeText = getLocale('totalStopWorkingTime');
    }
    this.setState({
      dataType: index,
      dataTypeText,
    });
    const { resetDetails } = this.props;
    resetDetails({
      currentIndex: undefined,
    });
  }

  handleSensorPress(index) {
    const { onInit } = this.props;
    const {
      startTimeStr,
      endTimeStr,
      selectedMonitors,
    } = this.state;
    onInit({
      monitors: selectedMonitors.monitors,
      startTime: startTimeStr,
      endTime: endTimeStr,
      sensorNo: index,
      extraState: {
        sensorNo: index,
      },
    });
  }

  handleDatePress(type) {
    const { onInit } = this.props;
    const {
      currentDateType,
      selectedMonitors,
      sensorNo,
    } = this.state;

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

      onInit({
        monitors: selectedMonitors.monitors,
        startTime: startTimeStr,
        endTime: endTimeStr,
        sensorNo,
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

  // ??????????????????
  handleCustomDateChange=(start, end) => {
    const { onInit } = this.props;
    const {
      startTime,
      selectedMonitors,
      sensorNo,
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

    onInit({
      monitors: selectedMonitors.monitors,
      startTime: startTimeStr,
      endTime: endTimeStr,
      sensorNo,
      extraState: {
        currentDateType: 'custom',
        startTime: startDate,
        endTime: endDate,
        startTimeStr,
        endTimeStr,
      },
    });
  }

  detailsDataAssembly = (data) => {
    if (isEmpty(data)) {
      return [];
    }
    const attrName = this.getAttrName();
    const info = data[attrName];

    const details = [];
    const keys = Object.keys(info).sort((x1, x2) => new Date(x1) - new Date(x2));
    for (let i = 0; i < keys.length; i += 1) {
      details.push({
        name: keys[i].substr(keys[i].length - 2, 2),
        value: getHourFromSecond(info[keys[i]]),
      });
    }
    return details;
  }

  confirmFun = (data) => {
    const { onInit } = this.props;
    const {
      startTimeStr, endTimeStr, sensorNo,
    } = this.state;

    // ???????????????????????????????????????????????????????????????????????????????????????????????????bug
    this.setState({
      showCheckModal: false,
    }, () => {
      onInit({
        monitors: data.monitors,
        startTime: startTimeStr,
        endTime: endTimeStr,
        sensorNo,
        extraState: {
          selectedMonitors: data,
          showCheckModal: false,
        },
      });
    });
  };

  // ????????????????????????
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
      queryPeriod,
      // detailsData,
      currentIndex,
    } = this.props;

    const {
      first,
      currentDateType,
      startTimeStr,
      endTimeStr,
      currentMonitor,
      dataType,
      sensorNo,
      startTime,
      // startButtonKey,
      customStartDate,
      endTime,
      detailsData,
      dataTypeText,
      showCheckModal,
      selectedMonitors,
      maxDay,
      isShwoModal,
    } = this.state;

    if (first) {
      return null;
    }

    const barDetailsData = this.detailsDataAssembly(detailsData);

    const barData = isEmpty(barChartData) ? [] : barChartData.toJS();

    const agg = this.aggregateData(barData);
    const attrName = this.getAttrName(true);
    const barDataObject = barData.map(x => ({
      value: getHourFromSecond(x[attrName]),
      name: x.monitorName,
    })).sort((a, b) => b.value - a.value);
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
                dataType={3}
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
        <View style={[styles.content]}>
          <View style={styles.block}>
            <Text style={styles.currentDate}>{`${startTimeStr} 00:00:00 ~ ${endTimeStr} 23:59:59`}</Text>
            <View style={styles.totalContainer}>
              <View style={styles.totalWraper}>
                <Image source={workIcon1} resizeMode="contain" style={styles.alarmIcon} />
                <Text style={[styles.totalText, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>
                  {dataTypeText}
                  {this.renderTime(agg.sum)}
                </Text>

              </View>
            </View>
            <View style={styles.totalContainer}>
              <View style={[styles.maxMinContainer, styles.maxContainer]}>
                <Text style={[styles.maxMinText, styles.txtRight]}>
                  {getLocale('highest')}
                  {
                    this.renderTime(agg.max)
                  }
                </Text>

                <Text style={[styles.maxMinText, styles.txtRight]}>
                  <Text>{agg.maxMileageMonitors && agg.maxMileageMonitors !== 'null' ? agg.maxMileageMonitors : '-'}</Text>
                </Text>
              </View>
              <View style={styles.maxMinContainer}>
                <Text style={styles.maxMinText}>
                  {getLocale('lowest')}
                  {
                    this.renderTime(agg.min)
                  }
                </Text>

                <Text style={styles.maxMinText}>
                  <Text>{agg.minMileageMonitors && agg.minMileageMonitors !== 'null' ? agg.minMileageMonitors : '-'}</Text>
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.block, { paddingBottom: 150 }]}>
            <View style={styles.barContainer}>
              {
                  !isEmpty(barChartData) && (
                    <BarChart
                      style={{ height: 200, backgroundColor: 'white' }}
                      currentIndex={currentIndex}
                      data={barDataObject}
                      onPressBar={this.handlePress}
                      detailData={barDetailsData}
                      hiddenBarText={sameDay}
                      unit="h"
                    />
                  )
                }
            </View>
            <View style={styles.btnView}>
              <TouchableOpacity
                style={[styles.defaultBtn, dataType === 0 ? styles.btnActive : null]}
                onPress={() => this.handleTypePress(0)}
              >
                <Text style={[styles.btnText, dataType !== 0 ? styles.btnTextDefault : null]}>{getLocale('workTime')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.defaultBtn, dataType === 1 ? styles.btnActive : null]}
                onPress={() => this.handleTypePress(1)}
              >
                <Text style={[styles.btnText, dataType !== 1 ? styles.btnTextDefault : null]}>{getLocale('standbyTime')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.defaultBtn,
                  { marginRight: 0 }, dataType === 2 ? styles.btnActive : null]}
                onPress={() => this.handleTypePress(2)}
              >
                <Text style={[styles.btnText, dataType !== 2 ? styles.btnTextDefault : null]}>{getLocale('stopWorkingTime')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.btnView}>
              <TouchableOpacity
                style={styles.engineBtn}
                onPress={() => this.handleSensorPress(1)}
              >
                <Image source={sensorNo === 1 ? sensorActiveIcon1 : sensorIcon1} resizeMode="contain" style={styles.engineIcon} />
                {/* <Text style={[styles.btnText, sensorNo !== 1 ? styles.btnTextDefault : null,
                  styles.engineBtn]}
                >1#
                </Text> */}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.engineBtn, { marginRight: 0 }]}
                onPress={() => this.handleSensorPress(2)}
              >
                <Image source={sensorNo === 2 ? sensorActiveIcon2 : sensorIcon2} resizeMode="contain" style={styles.engineIcon} />
                {/* <Text style={[styles.btnText, sensorNo !== 2 ? styles.btnTextDefault : null,
                  styles.engineBtn]}
                >2#
                </Text> */}
              </TouchableOpacity>
            </View>

            {/* ????????????????????? */}
            <TimeModal
              isShwoModal={isShwoModal}
              hideCallBack={this.hideModal}
              maxDay={maxDay}
              startDate={timeFormator(startTime)}
              endDate={timeFormator(endTime)}
              dateCallBack={this.handleCustomDateChange}
              isEqualStart
              mode="date"
              title="????????????"
            />
          </View>
        </View>

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
