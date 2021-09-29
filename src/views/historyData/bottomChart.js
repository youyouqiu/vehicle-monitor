import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as timeFormat from 'd3-time-format';
import Mileage from './bottomChart/bottomChartMileage';
import Stop from './bottomChart/bottomChartStop';
import OilData from './bottomChart/bottomChartOilData';
import OilConsumption from './bottomChart/bottomChartOilConsumption';
import Temperaturey from './bottomChart/bottomChartTemperaturey';
import Humidity from './bottomChart/bottomChartHumidity';
import WorkHour from './bottomChart/bottomChartWorkHour';
import Reverse from './bottomChart/bottomChartReverse';
import IoData from './bottomChart/bottomChartIoData';
import Weight from './bottomChart/bottomChartWeight';
import Tire from './bottomChart/bottomChartTire';
import Loading from '../../common/loading';
import { getLocale } from '../../utils/locales';
import { isEmpty } from '../../utils/function';

const styles = StyleSheet.create({
  failedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failed: {
    textAlign: 'center',
    color: 'gray',
  },

});
const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');


class BottomChart extends Component {
  static propTypes={
    chartKey: PropTypes.string.isRequired,
    chartData: PropTypes.object,
    playIndex: PropTypes.number.isRequired,
    currentMonitorId: PropTypes.string.isRequired,
    startTime: PropTypes.object.isRequired,
    endTime: PropTypes.object.isRequired,
    getChartDataStatus: PropTypes.string,
    changeEventSource: PropTypes.string,
    attachList: PropTypes.object,
    onGetChartData: PropTypes.func.isRequired,
    onDrag: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
  }

  static defaultProps = {
    attachList: null,
    changeEventSource: null,
    chartData: null,
    getChartDataStatus: null,
  }

  constructor(props) {
    super(props);
    const {
      onGetChartData, chartKey, currentMonitorId, startTime, endTime,
    } = props;
    this.state.chartKey = chartKey;
    if (chartKey) {
      onGetChartData({
        chartKey,
        currentMonitorId,
        startTime: timeFormator(startTime),
        endTime: timeFormator(endTime),
      });
    }
  }

  state={
    chartKey: null,
    data: null,
    playIndex: 0,
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      onGetChartData,
      chartKey: chartKeyThisProp,
      currentMonitorId: currentMonitorIdThisProp,
      startTime: startTimeThisProp,
      endTime: endTimeThisProp,

    } = this.props;
    const {
      playIndex,
      getChartDataStatus,
      chartData,
      chartKey: chartKeyNextProp,
      currentMonitorId: currentMonitorIdNextProp,
      startTime: startTimeNextProp,
      endTime: endTimeNextProp,
      attachList,
    } = nextProps;

    if (
      (
        chartKeyThisProp !== chartKeyNextProp
      || currentMonitorIdThisProp !== currentMonitorIdNextProp
      || startTimeThisProp !== startTimeNextProp
      || endTimeThisProp !== endTimeNextProp
      ) && chartKeyNextProp !== null
    ) {
      onGetChartData({
        chartKey: chartKeyNextProp,
        currentMonitorId: currentMonitorIdNextProp,
        startTime: timeFormator(startTimeNextProp),
        endTime: timeFormator(endTimeNextProp),
        attachList,
        attachIndex: 0,
      });
      this.setState({
        data: null,
      });
      return;
    }
    if (getChartDataStatus === 'success') {
      this.setState({
        data: chartData,
        playIndex,
        chartKey: chartKeyNextProp,
      });
    }
  }

  shouldComponentUpdate(nextProps) {
    const { changeEventSource } = nextProps;
    if (changeEventSource === 'chart') {
      return false;
    }
    return true;
  }


  handleDrag=(param) => {
    const { onDrag } = this.props;
    onDrag(param);
  }

  handleDragEnd=(param) => {
    const { onDragEnd } = this.props;
    onDragEnd(param);
  }

  render() {
    const {
      getChartDataStatus, attachList, startTime, endTime, currentMonitorId,
    } = this.props;
    const { chartKey, data, playIndex } = this.state;

    const uniqueKey = `${currentMonitorId}:${startTime.getTime()}:${endTime.getTime()}:${chartKey}`;

    if (getChartDataStatus === null) {
      return null;
    }

    if (getChartDataStatus === 'ing' || (data === null && getChartDataStatus === 'success')) {
      return <Loading type="page" />;
    }
    if (getChartDataStatus === 'failed') {
      return (
        <View style={styles.failedContainer}>
          <Text style={styles.failed}>{getLocale('requestFailed')}</Text>
        </View>
      );
    } if (isEmpty(data.get('data')) || isEmpty(data.get('mileage'))) {
      return (
        <View style={styles.failedContainer}>
          <Text style={styles.failed}>{getLocale('noSensorData')}</Text>
        </View>
      );
    }
    switch (chartKey) {
      case 'mileSpeed':
        return (
          <Mileage
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            uniqueKey={uniqueKey}
          />
        );

      case 'stopData':
        return (
          <Stop
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            startTime={startTime}
            endTime={endTime}
            uniqueKey={uniqueKey}
          />
        );
      case 'oilData':
        return (
          <OilData
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            attachList={attachList}
            uniqueKey={uniqueKey}
          />
        );
      case 'oilConsumptionData':
        return (
          <OilConsumption
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            uniqueKey={uniqueKey}
          />
        );
      case 'temperaturey':
        return (
          <Temperaturey
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            uniqueKey={uniqueKey}
          />
        );
      case 'humidity':
        return (
          <Humidity
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            uniqueKey={uniqueKey}
          />
        );
      case 'workHour':
        // return (
        //   <View style={styles.failedContainer}>
        //     <Text style={styles.failed}>{getLocale('noSensorData')}</Text>
        //   </View>
        // );
        return (
          <WorkHour
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            attachList={attachList}
            uniqueKey={uniqueKey}
          />
        );
      case 'reverse':
        return (
          <Reverse
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            attachList={attachList}
            uniqueKey={uniqueKey}
          />
        );
      case 'ioData':
        return (
          <IoData
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            attachList={attachList}
            uniqueKey={uniqueKey}
          />
        );
      case 'weight':
        return (
          <Weight
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            attachList={attachList}
            uniqueKey={uniqueKey}
          />
        );
      case 'tire':
        return (
          <Tire
            playIndex={playIndex}
            data={data}
            onDrag={this.handleDrag}
            onDragEnd={this.handleDragEnd}
            attachList={attachList}
            uniqueKey={uniqueKey}
          />
        );
      default:
        return null;
    }
  }
}

export default connect(
  state => ({
    getChartDataStatus: state.getIn(['historyDataReducers', 'getChartDataStatus']),
    chartData: state.getIn(['historyDataReducers', 'chartData']),
  }),
  dispatch => ({
    onGetChartData: (payload) => {
      dispatch({ type: 'historyData/SAGA/GET_CHART_DATA_ACTION', payload });
    },
  }),
)(BottomChart);