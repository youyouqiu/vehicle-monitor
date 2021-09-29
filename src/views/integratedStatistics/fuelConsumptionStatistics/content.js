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

import * as timeFormat from 'd3-time-format';
import TimeModal from '../../../common/timerModal';
import { getLocale } from '../../../utils/locales';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';
import { toastShow } from '../../../utils/toastUtils';
import { isEmpty, toFixed } from '../../../utils/function';
import { BarChart } from '../../../common/reactNativeD3Charts';
import oilFuel1 from '../../../static/image/oilUse1.png';
import IconMeli1 from '../../../static/image/meli1.png';
import SelectMonitorModal from '../../../common/checkMonitor/index';
import IconList from '../../../static/image/list.png';

import { getUserSetting } from '../../../server/getStorageData';
import { getDefaultMonitors } from '../../../server/getData';
import { serviceError } from '../../../utils/singleSignOn';

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
    height: 50,
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
  btnTextDefault: {
    color: '#c4c4c4',
  },
});
const timeFormator = timeFormat.timeFormat('%Y-%m-%d');

export default class FuelMileageStatisticsContent extends Component {
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
    detailsData: PropTypes.array,
    getDetails: PropTypes.func.isRequired,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
    barChartData: null,
    activeMonitor: null,
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

  state = {
    first: true,
    selectedMonitors: null,
    currentMonitor: null,
    currentDateType: 'today', // today,week,month,custom
    startTime: null,
    startTimeStr: null,
    endTime: null,
    endTimeStr: null,
    dataTypeText: getLocale('totalConsumption'),
    dataType: 0,
    dataTypeProps: ['felConsumption', 'steerMileage'],
    unit: 'L',
    // detailsData: null,
    customStartDate: new Date(),
    showCheckModal: false,
    maxDay: 31,
    isShwoModal: false,
  }

  data = {
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

  // 获取默认勾选监控对象
  getCheckMonitor = (num, startTimeStr, endTimeStr) => {
    const params = {
      type: '0',
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
          onInit({
            monitors: newCheckMonitors.monitors,
            startTime: startTimeStr,
            endTime: endTimeStr,
          });
          this.state.selectedMonitors = newCheckMonitors;
        } else {
          toastShow(getLocale('notHasMonitor'), { duration: 2000 });
        }
      } else {
        // toastShow(getLocale('requestFailed'), { duration: 2000 });
        serviceError();
      }
    }).catch((err) => {
      // toastShow(getLocale('requestFailed'), { duration: 2000 });
      serviceError();
    });
  }

  showMenu = () => {
    this.setState({
      showCheckModal: true,
    });
  }

  handlePress = (index) => {
    const {
      barChartData,
      getDetails,
      resetDetails,
    } = this.props;

    if (index === null) {
      resetDetails({
        currentIndex: index,
      });
      return;
    }

    const {
      startTime,
      endTime,
      dataType,
      dataTypeProps,
    } = this.state;

    const attrName = dataTypeProps[dataType];
    const barChartDataObj = JSON.parse(barChartData.get(attrName).toJS().data);

    const { vehicleId } = barChartDataObj[index];

    getDetails({
      moniterId: vehicleId,
      startTime: timeFormator(startTime),
      endTime: timeFormator(endTime),
      index,
    });
  }

  // 标签切换
  handleTypePress(index) {
    // 0 耗油量 1 终端里程
    let unit = 'L';
    let dataTypeText = getLocale('totalConsumption');
    if (index === 1) {
      dataTypeText = getLocale('totalDevices');
      unit = 'km';
    }

    this.setState({
      dataType: index,
      dataTypeText,
      unit,
    });
    const { resetDetails } = this.props;
    resetDetails({
      currentIndex: undefined,
    });
  }

  // 日期切换
  handleDatePress(type) {
    const { onInit } = this.props;
    const {
      currentDateType,
      selectedMonitors,
    } = this.state;

    if (type !== 'custom' && currentDateType !== type) {
      this.setState({
        isShwoModal: false,
      });
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

  // 获取图表数据
  getBarDatas = (barData, attrName) => {
    const {
      dataType,
    } = this.state;

    const felConsumption = barData[attrName] ? JSON.parse(barData[attrName].data) : [];
    const barDataObject = felConsumption.map((x) => {
      let totalConsumption = '';
      if (dataType === 0) {
        totalConsumption = x.totalFuelConsumption > 99999.9
          ? 99999.9 : toFixed(parseFloat(x.totalFuelConsumption), 1, true);
      } else {
        totalConsumption = x.totalSteerMileage > 99999.9
          ? 99999.9 : toFixed(parseFloat(x.totalSteerMileage), 1, true);
      }

      return {
        value: totalConsumption,
        name: x.brand,
      };
    }).sort((a, b) => b.value - a.value);

    return barDataObject;
  }

  // 获取统计数据
  getTotalData = (barData, attrName) => {
    const {
      dataType,
    } = this.state;

    const data = barData[attrName];
    let totalObj = {};

    const maxMonitor = data.highVehicle.split(',');
    const minMonitor = data.lowVehicle.split(',');
    const highVehicle = maxMonitor.length > 1 ? `${maxMonitor[0]}...` : maxMonitor[0];
    const lowVehicle = minMonitor.length > 1 ? `${minMonitor[0]}...` : minMonitor[0];

    if (dataType === 0) {
      totalObj = {
        total: toFixed(data.totalFuelConsumption, 1, true) || 0,
        high: toFixed(data.highFuelConsumption, 1, true) || 0,
        lower: toFixed(data.lowFuelConsumption, 1, true) || 0,
        highVehicle,
        lowVehicle,
      };
    } else if (dataType === 1) {
      totalObj = {
        total: toFixed(data.totalSteerMileage, 1, true) || 0,
        high: toFixed(data.highSteerMileage, 1, true) || 0,
        lower: toFixed(data.lowSteerMileage, 1, true) || 0,
        highVehicle,
        lowVehicle,
      };
    }

    return totalObj;
  }

  // 获取图表详情数据
  detailsDataAssembly = (data) => {
    const {
      dataType,
    } = this.state;

    if (isEmpty(data)) {
      return [];
    }

    const details = [];
    for (let i = 0; i < data.length; i += 1) {
      const item = data[i];

      if (dataType === 0) { // 耗油量
        details.push({
          name: item.time.substr(-2),
          value: toFixed(item.totalFuelConsumption, 1, true) > 99999.9
            ? 99999.9 : toFixed(item.totalFuelConsumption, 1, true),
        });
      } else if (dataType === 1) { // 终端里程
        details.push({
          name: item.time.substr(-2),
          value: toFixed(item.totalSteerMileage, 1, true) > 99999.9
            ? 99999.9 : toFixed(item.totalSteerMileage, 1, true),
        });
      }
    }
    return details;
  }

  confirmFun = (data) => {
    const { onInit } = this.props;
    const {
      startTimeStr, endTimeStr,
    } = this.state;

    // 先关闭弹层再进行请求，解决选择监控对象后点击确定按钮没有及时反馈的bug
    this.setState({
      showCheckModal: false,
    }, () => {
      onInit({
        monitors: data.monitors,
        startTime: startTimeStr,
        endTime: endTimeStr,
        extraState: {
          selectedMonitors: data,
          showCheckModal: false,
        },
      });
    });
  };

  // 关闭日期选择弹层
  hideModal = () => {
    this.setState({
      isShwoModal: false,
    });
  }

  renderTotalNumber = (agg) => {
    if (agg.total > 9999999.9) {
      return '>9999999.9';
    } if (agg.total < 0) {
      return '--';
    }
    return agg.total;
  }

  renderNumber = (num) => {
    if (num > 99999.9) {
      return '>99999.9';
    } if (num < 0) {
      return '--';
    }
    return num;
  }

  render() {
    const {
      initStatus,
      monitors,
      barChartData,
      queryPeriod,
      currentIndex,
      detailsData,
    } = this.props;

    const {
      first,
      currentDateType,
      startTimeStr,
      endTimeStr,
      currentMonitor,
      dataType,
      unit,
      startTime,
      customStartDate,
      endTime,
      dataTypeText,
      showCheckModal,
      selectedMonitors,
      maxDay,
      isShwoModal,
      dataTypeProps,
    } = this.state;

    if (first) {
      return null;
    }

    const attrName = dataTypeProps[dataType];// 当前标签数据属性
    const barData = isEmpty(barChartData) ? [] : barChartData.toJS();// 接口返回总数据

    const barDataObject = this.getBarDatas(barData, attrName);// 图表数据组装
    const totalData = barData.length !== 0 ? this.getTotalData(barData, attrName) : {};// 统计数据组装
    const details = detailsData.toJS().reverse();
    const barDetailsData = this.detailsDataAssembly(details);// 图表详情数据

    // 日期
    let endMaxDate = new Date(customStartDate);
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
                dataType={5}
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
                <Image
                  source={dataType === 1 ? IconMeli1 : oilFuel1}
                  resizeMode="contain"
                  style={styles.alarmIcon}
                />
                <Text style={[styles.totalText, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>
                  {dataTypeText}
                  <Text style={[styles.totalNumber, Platform.OS !== 'ios' ? { fontFamily: '' } : null]}>{this.renderTotalNumber(totalData)}</Text>{unit}
                </Text>
              </View>
            </View>

            <View style={styles.totalContainer}>
              <View style={[styles.maxMinContainer, styles.maxContainer]}>
                <Text style={[styles.maxMinText, styles.txtRight]}>
                  {`${getLocale('highest')} `}
                  <Text style={styles.maxMinNumber}>{this.renderNumber(totalData.high)}</Text>{unit}
                </Text>
                <Text style={[styles.maxMinText, styles.txtRight]}>
                  <Text>{totalData.highVehicle && totalData.highVehicle !== 'null' ? totalData.highVehicle : '-'}</Text>
                </Text>
              </View>
              <View style={styles.maxMinContainer}>
                <Text style={styles.maxMinText}>
                  {`${getLocale('lowest')} `}
                  <Text
                    style={styles.maxMinNumber}
                  >{this.renderNumber(totalData.lower)}
                  </Text>{unit}
                </Text>
                <Text style={styles.maxMinText}>
                  <Text>{totalData.lowVehicle && totalData.lowVehicle !== 'null' ? totalData.lowVehicle : '-'}</Text>
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
                    detailData={barDetailsData}// 图表详情
                    hiddenBarText={sameDay}
                    unit={unit}
                  />
                )
              }
            </View>

            <View style={styles.btnView}>
              <TouchableOpacity
                style={[styles.defaultBtn, dataType === 0 ? styles.btnActive : null]}
                onPress={() => this.handleTypePress(0)}
              >
                <Text
                  style={[styles.btnText, dataType !== 0 ? styles.btnTextDefault : null]}
                >
                  {getLocale('consumption')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.defaultBtn,
                  { marginRight: 0 }, dataType === 1 ? styles.btnActive : null]}
                onPress={() => this.handleTypePress(1)}
              >
                <Text style={[styles.btnText, dataType !== 1 ? styles.btnTextDefault : null]}>
                  {getLocale('devices')}
                </Text>
              </TouchableOpacity>
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
