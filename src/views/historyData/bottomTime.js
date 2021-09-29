import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as timeFormat from 'd3-time-format';
import { getLocale } from '../../utils/locales';
import { isEmpty } from '../../utils/function';
import TimeModal from '../../common/timerModal';

const styles = StyleSheet.create({
  timeContainer: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: 'white',
    paddingRight: 4,
  },
  dateContainer: {
    flex: 5,
  },
  customContainer: {
    flex: 1,
    padding: 2,
  },
  swiper: {
    backgroundColor: '#fff',
  },
  dateItem: {
    width: 65,
    padding: 2,
  },
  date: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: '#f5f5f5',
  },
  itemText: {
    width: 61,
    textAlign: 'center',
    color: '#333333',
  },
  today: {
    backgroundColor: '#d7f3ff',
  },
  active: {
    backgroundColor: '#33bbff',
    borderWidth: 0,
  },
  activeText: {
    color: 'white',
  },
  custom: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    marginLeft: 2,
  },
  mileText: {
    fontSize: 13,
  },
  unit: {
    fontSize: 12,
  },
});

const dateFormator = timeFormat.timeFormat('%m-%d');
const longDateFormator = timeFormat.timeFormat('%Y-%m-%d');
const fullTimeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

class BottomTime extends Component {
  data = {
    startTime: null,
    oldStartTime: null,
    firstIntoPage: true,
  }

  static propTypes = {
    currentMonitorId: PropTypes.string,
    startTime: PropTypes.object.isRequired,
    endTime: PropTypes.object.isRequired,
    onTimeChange: PropTypes.func,
    queryHistoryPeriod: PropTypes.number,
    mileDayStatistics: PropTypes.object,
    changeEventSource: PropTypes.string,
    onInit: PropTypes.func.isRequired,
  }

  static defaultProps = {
    currentMonitorId: null,
    onTimeChange: null,
    queryHistoryPeriod: 7,
    mileDayStatistics: null,
    changeEventSource: null,
  }

  constructor(props) {
    super(props);
    this.state.startTime = props.startTime;
    this.state.endTime = props.endTime;

    const today = new Date();
    const datesArr = [];
    for (let i = 29; i >= 0; i -= 1) {
      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() - i);
      datesArr.push(todayDate);
    }

    this.state.today = today;
    this.state.datesArr = datesArr;

    const mileageStartDate = datesArr[0];
    const mileageEndDate = datesArr[datesArr.length - 1];
    const toSendDate = new Date(mileageEndDate);
    toSendDate.setDate(toSendDate.getDate() + 1);
    const { onInit } = this.props;

    onInit({
      currentMonitorId: props.currentMonitorId,
      mileageStartDate: longDateFormator(mileageStartDate),
      mileageEndDate: longDateFormator(toSendDate),
    });
  }

  state = {
    isCustom: true,
    startTime: null,
    endTime: null,
    today: null,
    datesArr: null,
    activeDate: null,
    startButtonKey: null,
    mileDayStatistics: null,
    customStartDate: new Date(),
    isShwoModal: false,
  }


  UNSAFE_componentWillReceiveProps(nextProps) {
    const { currentMonitorId } = this.props;
    const { currentMonitorId: nextMonitorId, mileDayStatistics } = nextProps;

    if (!is(currentMonitorId, nextMonitorId)) {
      const { datesArr } = this.state;

      const mileageStartDate = datesArr[0];
      const mileageEndDate = datesArr[datesArr.length - 1];
      const toSendDate = new Date(mileageEndDate);
      toSendDate.setDate(toSendDate.getDate() + 1);

      this.data.swipedIndex = [0];

      const { onInit } = this.props;
      onInit({
        currentMonitorId: nextMonitorId,
        mileageStartDate: longDateFormator(mileageStartDate),
        mileageEndDate: longDateFormator(toSendDate),
      });
      return;
    }

    if (mileDayStatistics !== null) {
      const newMile = {
        // ...mileInState,
        ...mileDayStatistics.toObject(),
      };

      this.setState({
        mileDayStatistics: newMile,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { changeEventSource, mileDayStatistics } = nextProps;

    if (mileDayStatistics === null) {
      return false;
    }

    if (changeEventSource === 'time' && is(this.state, nextState)) {
      return false;
    }
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  handleCustom = () => {
    // this.startDatePickerRef.onPressDate();
    this.setState({
      isShwoModal: true,
    });
  }

  // 关闭日期选择弹层
  hideModal = () => {
    this.setState({
      isShwoModal: false,
    });
  }

  handleTimeChange = (startTime, endTime) => {
    const { onTimeChange } = this.props;
    if (typeof onTimeChange === 'function') {
      onTimeChange(startTime, endTime);
    }
  }

  handleDate = (date) => {
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 0);
    this.setState({
      startTime,
      endTime,
      activeDate: date,
      isCustom: false,
    });
    this.handleTimeChange(startTime, endTime);
  }

  // handleStartDateChange=(date) => {
  //   const { startTime } = this.state;
  //   this.data.startTime = new Date(date.replace(/-/g, '/'));
  //   this.data.oldStartTime = startTime;
  //   this.setState({
  //     customStartDate: this.data.startTime,
  //   }, () => {
  //     setTimeout(() => {
  //       this.endDatePickerRef.onPressDate();
  //     }, 500);
  //   });
  // }

  // handleEndDateChange=(date) => {
  //   const { queryHistoryPeriod } = this.props;
  //   const { startTime } = this.data;
  //   const endTime = new Date(date.replace(/-/g, '/'));

  //   if (startTime > endTime) {
  //     toastShow(getLocale('timePrompt'), { duration: 2000 });
  //     return;
  //   }

  //   const tmpStartTime = new Date(startTime);
  //   if (queryHistoryPeriod !== null && queryHistoryPeriod > 0) {
  //     tmpStartTime.setDate(
  //       tmpStartTime.getDate() + queryHistoryPeriod,
  //     );
  //     if (tmpStartTime < endTime) {
  // toastShow(getLocale('timePrompt2').replace('$d', queryHistoryPeriod), { duration: 2000 });
  //       return;
  //     }
  //   }

  //   this.setState({
  //     startTime,
  //     endTime,
  //     isCustom: true,
  //   });
  //   this.handleTimeChange(startTime, endTime);
  // }


  // handleEndCloseModal = () => {
  //   const { oldStartTime } = this.data;
  //   // this.startDatePickerRef.props.date = oldStartTime;
  //   this.setState({
  //     startTime: oldStartTime,
  //     startButtonKey: `__startButtonKey__${Math.random().toString()}`,
  //   });
  // }

  handleCustomDateChange = (start, end) => {
    const startTime = new Date(start.replace(/-/g, '/'));
    const endTime = new Date(end.replace(/-/g, '/'));
    this.setState({
      startTime,
      endTime,
      isCustom: true,
      isShwoModal: false,
    });
    this.handleTimeChange(startTime, endTime);
  }

  renderDates = (datesArr, miles, activeDate, today, isCustom) => {
    const activeDateStr = longDateFormator(activeDate);
    const todayStr = longDateFormator(today);
    const isEqualActive = dateStr => dateStr === activeDateStr && !isCustom;
    const isEqualToday = dateStr => dateStr === todayStr;
    const getMile = (dateStr) => {
      if (isEmpty(miles)) {
        return '-';
      }
      const mile = miles[dateStr];
      if (mile === undefined) {
        return '-';
      }
      return mile;
    };
    let customStyle = null;
    let customTextStyle = null;
    if (isCustom) {
      customStyle = styles.active;
      customTextStyle = styles.activeText;
    }
    return (
      <View style={styles.timeContainer}>
        <View style={styles.dateContainer}>
          <ScrollView
            style={styles.swiper}
            horizontal
            ref={(ref) => {
              if (ref !== null && this.data.firstIntoPage) {
                this.data.firstIntoPage = false;
                setTimeout(() => {
                  ref.scrollToEnd({ animated: false });
                }, 0);
              }
            }}
          >
            {
              datesArr.map((date) => {
                const dateStr = longDateFormator(date);
                const dateName = dateFormator(date);
                const weekName = weekNames[date.getDay()];
                const mile = getMile(dateStr);
                let todayStyle = null;
                let activeStyle = null;
                let activeTextStyle = null;

                if (isEqualToday(dateStr)) {
                  todayStyle = styles.today;
                }
                if (isEqualActive(dateStr)) {
                  activeStyle = styles.active;
                  activeTextStyle = styles.activeText;
                }
                return (
                  <View style={styles.dateItem}>
                    <TouchableOpacity
                      style={[styles.date, todayStyle, activeStyle]}
                      onPress={() => { this.handleDate(date); }}
                    >
                      <Text style={[styles.itemText, activeTextStyle]}>{dateName}</Text>
                      <Text style={[styles.itemText, activeTextStyle]}>{weekName}</Text>
                      <Text style={[styles.itemText, activeTextStyle, styles.mileText]}>
                        {mile}
                        {
                          mile === '-' ? null : (
                            <Text style={styles.unit}>km</Text>
                          )
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            }
          </ScrollView>
        </View>
        <View style={styles.customContainer}>
          <TouchableOpacity
            style={[styles.custom, customStyle]}
            onPress={this.handleCustom}
          >
            <Text style={[styles.itemText, customTextStyle]}>{getLocale('custom')}</Text>
            <Text style={[styles.itemText, customTextStyle]}>{getLocale('timeArrow')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  render() {
    const {
      startTime,
      endTime,
      // startButtonKey,
      datesArr,
      activeDate,
      isCustom,
      today,
      mileDayStatistics,
      customStartDate,
      isShwoModal,
    } = this.state;
    const { queryHistoryPeriod } = this.props;

    const endMaxDate = new Date(customStartDate);
    const startMinDate = new Date(customStartDate);

    startMinDate.setMinutes(
      startMinDate.getMinutes() + 1,
    );

    if (queryHistoryPeriod !== null && queryHistoryPeriod > 0) {
      endMaxDate.setDate(
        endMaxDate.getDate() + queryHistoryPeriod - 1,
      );
    } else {
      endMaxDate.setDate(
        endMaxDate.getDate() + 1,
      );
    }

    if (mileDayStatistics === null) {
      return null;
    }


    return (
      <View style={styles.container}>
        <TimeModal
          isShwoModal={isShwoModal}
          hideCallBack={this.hideModal}
          maxDay={queryHistoryPeriod}
          startDate={fullTimeFormator(startTime)}
          endDate={fullTimeFormator(endTime)}
          dateCallBack={this.handleCustomDateChange}
          mode="datetime"
          title="请选择时间"
        />
        {
          this.renderDates(
            datesArr, mileDayStatistics, activeDate, today, isCustom,
          )
        }
      </View>
    );
  }
}

export default connect(
  state => ({
    queryHistoryPeriod: state.getIn(['historyDataReducers', 'queryHistoryPeriod']),
    mileDayStatistics: state.getIn(['historyDataReducers', 'mileDayStatistics']),
  }),
  dispatch => ({
    onInit: (payload) => {
      dispatch({ type: 'historyData/SAGA/INIT_TIME_ACTION', payload });
    },
  }),
)(BottomTime);