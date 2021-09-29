import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
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
import { BarChart } from '../../../common/reactNativeD3Charts';
import IconRun1 from '../../../static/image/run1.png';
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
    minWidth: 160,
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
  centerBlock: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  plateNumber: {
    color: '#333333',
    width: '100%',
    height: 50,
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 10,
  },
  aggItem: {
    padding: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#c8c8c8',
    justifyContent: 'space-between',
  },
  aggTitleWraper: {
    width: '100%',
    height: 20,
  },
  aggTitle: {
    color: '#333333',
    fontSize: 13,
  },
  aggValueWraper: {
    width: '100%',
    height: 22,
  },
  aggValue: {
    color: '#333333',
    fontSize: 18,
  },
  aggUnit: {
    color: '#333333',
    fontSize: 12,
  },
  dateElement: {
    height: 0,
  },
});
const timeFormator = timeFormat.timeFormat('%Y-%m-%d');

export default class MileStatisticsContent extends Component {
  data = {
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
    isSuccess: PropTypes.bool.isRequired,
    queryPeriod: PropTypes.number.isRequired,
    onInit: PropTypes.func.isRequired,
    getDetailData: PropTypes.func.isRequired,
    barDetailData: PropTypes.object,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
    barChartData: null,
    barDetailData: null,
    activeMonitor: null,
    startTime: null,
    endTime: null,
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

  state = {
    first: true,
    selectedMonitors: null,
    currentMonitor: null,
    currentDateType: 'today', // today,week,month,custom
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


  UNSAFE_componentWillReceiveProps (nextProps) {
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

  shouldComponentUpdate (nextProps) {
    const { initStatus } = nextProps;
    if (initStatus === 'ing') {
      return false;
    }
    return true;
  }

  // 获取默认勾选监控对象
  getCheckMonitor = (num, startTimeStr, endTimeStr) => {
    const params = {
      type: '3',
      defaultSize: num,
      isFilter: false,
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

  showMenu = () => {
    this.setState({
      showCheckModal: true,
    });
  }

  handlePress = (index) => {
    const { barChartData, getDetailData, resetDetails } = this.props;

    if (index === null) {
      resetDetails({
        currentIndex: index,
      });
      return;
    }

    const { startTime, endTime } = this.state;
    const barChartDataObj = barChartData.get('mileageReportList').toJS();
    const { vehicleId } = barChartDataObj[index];

    getDetailData({
      moniterId: vehicleId,
      startTime: timeFormator(startTime),
      endTime: timeFormator(endTime),
      index,
    });
  }


  handleDatePress = (type) => {
    const { onInit } = this.props;
    const { currentDateType, selectedMonitors } = this.state;

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
  handleCustomDateChange = (start, end) => {
    const { onInit } = this.props;
    const {
      startTime,
      selectedMonitors,
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
      extraState: {
        currentDateType: 'custom',
        startTime: startDate,
        endTime: endDate,
        startTimeStr,
        endTimeStr,
      },
    });
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
    const { selectedMonitors } = this.state;
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

    onInit({
      monitors: selectedMonitors.monitors,
      startTime: startTimeStr,
      endTime: endTimeStr,
      extraState: {
        currentDateType: 'custom',
        startTime,
        endTime,
        startTimeStr,
        endTimeStr,
      },
    });
  } */


  /* handleEndCloseModal = () => {
    const { oldStartTime } = this.data;
    // this.startDatePickerRef.props.date = oldStartTime;
    this.setState({
      startTime: oldStartTime,
      startButtonKey: `__startButtonKey__${Math.random().toString()}`,
    });
  } */

  aggregateData (data) {
    const totalMileage = data.get('totalMileage');
    const maxMileage = data.get('maxMileage');
    let maxMileageMonitors = data.get('maxMileageMonitors');
    const minMileage = data.get('minMileage');
    let minMileageMonitors = data.get('minMileageMonitors');
    maxMileageMonitors = maxMileageMonitors.split(',');
    minMileageMonitors = minMileageMonitors.split(',');

    return {
      totalMileage: totalMileage || 0,
      maxMileage: maxMileage || 0,
      maxMileageMonitors: maxMileageMonitors.length > 1 ? `${maxMileageMonitors[0]}...` : maxMileageMonitors[0],
      minMileage: minMileage || 0,
      minMileageMonitors: minMileageMonitors.length > 1 ? `${minMileageMonitors[0]}...` : minMileageMonitors[0],
    };
  }

  detailsDataAssembly = (barDetailData) => {
    if (isEmpty(barDetailData)) {
      return {};
    }
    const { barChartData, currentIndex } = this.props;
    const details = barDetailData.toJS();
    const detailsObj = details.mileageReportList.map(x => ({
      value: x.totalGpsMile > 99999.9 ? 99999.9 : x.totalGpsMile,
      name: x.dayFormat ? x.dayFormat.substr(x.dayFormat.length - 2, 2) : '--',
    }));

    return {
      barData: detailsObj,
      plateNumber: barChartData.getIn(['mileageReportList', currentIndex, 'plateNumber']),
      totalOilWearOne: details.totalOilWearOne,
      totalMileage: details.totalMileage > 99999.9 ? '>99999.9' : details.totalMileage,
      totalTravelTime: details.totalTravelTime, // 行驶时长
      totalTravelNum: details.totalTravelNum,
    };
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
          showCheckModal: false,
        },
      });
    });
  }

  // 关闭日期选择弹层
  hideModal = () => {
    this.setState({
      isShwoModal: false,
    });
  }

  render () {
    const {
      initStatus,
      monitors,
      barChartData,
      queryPeriod,
      currentIndex,
      barDetailData,
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
      showCheckModal,
      selectedMonitors,
      maxDay,
      isShwoModal,
    } = this.state;
    if (first) {
      return null;
    }

    const detailsData = this.detailsDataAssembly(barDetailData);

    const barData = isEmpty(barChartData) || isEmpty(barChartData.get('mileageReportList')) ? [] : barChartData.get('mileageReportList').toJS();

    const agg = isEmpty(barChartData)
      ? {
        totalMileage: 0,
        maxMileage: 0,
        maxMileageMonitors: '',
        minMileage: 0,
        minMileageMonitors: '',
      } : this.aggregateData(barChartData);
    const barDataObject = barData.map(x => ({
      value: parseFloat(x.mileage) > 99999.9 ? 99999.9 : parseFloat(x.mileage),
      name: x.plateNumber,
    }));

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
                dataType={2}
              // getMonitorType={3}
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
                <Image source={IconRun1} resizeMode="contain" style={styles.alarmIcon} />
                <Text style={[styles.totalText, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>
                  {`${getLocale('totalMileNum')} `}
                  <Text style={[styles.totalNumber, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>{agg.totalMileage > 999999.9 ? '>999999.9' : `${agg.totalMileage}km`}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.totalContainer}>
              <View style={[styles.maxMinContainer, styles.maxContainer]}>
                <Text style={[styles.maxMinText, styles.txtRight]}>
                  {`${getLocale('highest')} `}
                  <Text style={styles.maxMinNumber}>{agg.maxMileage > 99999.9 ? '>99999.9' : `${agg.maxMileage}km`}</Text>
                </Text>
                <Text style={[styles.maxMinText, styles.txtRight]}>
                  <Text>{agg.maxMileageMonitors && agg.maxMileageMonitors !== 'null' ? agg.maxMileageMonitors : '-'}</Text>
                </Text>
              </View>
              <View style={styles.maxMinContainer}>
                <Text style={styles.maxMinText}>
                  {`${getLocale('lowest')} `}
                  <Text style={styles.maxMinNumber}>{`${agg.minMileage}km`}</Text>
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
                    detailData={detailsData.barData}
                    hiddenBarText={currentDateType === 'today' || sameDay}
                    unit="km"
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

          {
            currentIndex !== null && (
              <View style={[styles.block, {
                paddingBottom: 20,
                alignItems: 'center',
              }]}
              >
                <Text style={styles.plateNumber}>{`${detailsData.plateNumber}${getLocale('mileAggregation')}`}</Text>

                <ScrollView
                  horizontal
                  style={{
                    marginHorizontal: 10,
                  }}
                >
                  <View style={styles.centerBlock}>
                    <View style={styles.aggItem}>
                      <View style={styles.aggTitleWraper}>
                        <Text style={styles.aggTitle}>{getLocale('driveMileage')}</Text>
                      </View>
                      <View style={styles.aggValueWraper}>
                        <Text style={styles.aggValue}>{detailsData.totalMileage < 0 ? '--' : detailsData.totalMileage}
                          <Text style={styles.aggUnit}>km</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.aggItem}>
                      <View style={styles.aggTitleWraper}>
                        <Text style={styles.aggTitle}>{getLocale('consumeOil')}</Text>
                      </View>
                      <View style={styles.aggValueWraper}>
                        <Text style={styles.aggValue}>{detailsData.totalOilWearOne < 0 ? '--' : detailsData.totalOilWearOne}
                          <Text style={styles.aggUnit}>L</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.aggItem}>
                      <View style={styles.aggTitleWraper}>
                        <Text style={styles.aggTitle}>{getLocale('driveTime')}</Text>
                      </View>
                      <View style={styles.aggValueWraper}>
                        <Text style={styles.aggValue}>{detailsData.totalTravelTime}
                          {/* <Text style={styles.aggUnit}>h</Text> */}
                        </Text>

                      </View>
                    </View>
                    <View style={[styles.aggItem, {
                      borderRightWidth: 1,
                      borderColor: '#c8c8c8',
                    }]}
                    >
                      <View style={styles.aggTitleWraper}>
                        <Text style={styles.aggTitle}>{getLocale('driveTimes')}</Text>
                      </View>
                      <View style={styles.aggValueWraper}>
                        <Text style={styles.aggValue}>{detailsData.totalTravelNum}
                          <Text style={styles.aggUnit}>{getLocale('numberUnit')}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )
          }
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
