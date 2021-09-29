import React, { Component } from 'react';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { getLocale } from '../../../utils/locales';
import { LineChart } from '../../../common/reactNativeD3Charts';
import {
  toFixed, getTextFromSecond, getObjFromSecond,
} from '../../../utils/function';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 1,
    height: 210,
  },
  chart: {
    height: 120,
    backgroundColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  title: {
    color: '#333333',
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
    paddingLeft: 10,
  },
  titleActive: {
    color: '#2a8be9',
    fontSize: 18,
  },
  titleUnit: {
    fontSize: 14,
    fontStyle: 'italic',
  },
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

const getColor = (type) => {
  if (type === null) {
    return 'lightgray';
  }
  if (type === 1) {
    return '#a3d843';
  }
  return '#ff9999';
};

class ChartStop extends Component {
  data={
    prevData: null,
    svgData: null,
  }

  static propTypes={
    data: PropTypes.object,
    playIndex: PropTypes.number.isRequired,
    // startTime: PropTypes.object.isRequired,
    // endTime: PropTypes.object.isRequired,
    uniqueKey: PropTypes.string.isRequired,
    onDrag: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
  }

  static defaultProps = {
    data: null,
  }


  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  getSvgData=(rawData) => {
    const { prevData, svgData } = this.data;
    if (!is(prevData, rawData) || svgData === null) {
      const data = rawData.getIn(['data', 'track']).toArray();
      const mileage = rawData.get('mileage').toArray();
      const mileageCount = mileage.length;
      const padEndData = data.slice(0, mileageCount).concat([{
        get: x => `${x}:${Math.random()}`,
      }]);
      const padEndDataLength = padEndData.length;


      let stopTotalTimeLength = 0; // 以秒为单位
      let stopTimes = 0;
      let stopTimeArr = [];
      let stopTotalMileageLength = 0;
      let runTotalTimeLength = 0; // 以秒为单位
      let runTimes = 0;
      let runTimeArr = [];
      let runTotalMileageLength = 0;

      const dataArr = [];

      if (padEndDataLength > 0) {
        const typeDict = {};
        let prevType = padEndData[0].get('status');
        let prevIndex = 0;
        let notNullIndex = 0;

        for (let i = 0; i < padEndDataLength; i += 1) {
          const element = padEndData[i];
          const currentType = element.get('status');
          const time = element.get('time');

          if (i < padEndDataLength - 1) {
            const newItem = {};
            newItem.date = new Date(time * 1000);
            newItem.value = 1;
            newItem.index = i;
            newItem.color = getColor(currentType);
            newItem.speed = mileage[i].get('speed');
            newItem.type = currentType;

            dataArr.push(newItem);
          }

          // 1.补点数据不参与计算
          // 2.两个点就算是相同状态，但时间差大于5分钟，也属于两个状态段
          // 3.如果两个状态之间时间差大于5分钟，则按状态段首尾点计算
          // 4.不然按下一个状态段第一个点 - 上一个状态段最后一点计算

          if (currentType === null) {
            /* eslint no-continue:off */
            continue;
          }

          const timeDiff = padEndData[i].get('time') - padEndData[notNullIndex].get('time');

          if (currentType !== prevType || timeDiff > 300) {
            const item = typeDict[prevType];
            let endIndex = notNullIndex;

            let timeLength = padEndData[endIndex].get('time') - padEndData[prevIndex].get('time');
            let mileageLength = padEndData[endIndex].get('mileage') - padEndData[prevIndex].get('mileage');
            if (timeDiff <= 300) {
              endIndex = i;
              timeLength = padEndData[endIndex].get('time') - padEndData[prevIndex].get('time');
              mileageLength = padEndData[endIndex].get('mileage') - padEndData[prevIndex].get('mileage');
            }
            const segment = {
              startIndex: prevIndex,
              endIndex,
              timeLength,
              mileageLength,
              startTime: padEndData[prevIndex].time,
              endTime: padEndData[endIndex].time,
            };
            if (item) {
              item.occurrence += 1;
              item.totalTimeLength += timeLength;
              item.totalMileageLength += mileageLength;
              item.segment.push(segment);
            } else {
              typeDict[prevType] = {
                type: prevType,
                occurrence: 1,
                totalTimeLength: timeLength,
                totalMileageLength: mileageLength,
                segment: [segment],
              };
            }
            prevType = currentType;
            prevIndex = i;
          }
          notNullIndex = i;
        }

        if (typeDict['2']) {
          stopTotalTimeLength = typeDict['2'].totalTimeLength;
          stopTotalMileageLength = typeDict['2'].totalMileageLength;
          stopTimes = typeDict['2'].occurrence;
          stopTimeArr = typeDict['2'].segment;
        }
        if (typeDict['1']) {
          runTotalTimeLength = typeDict['1'].totalTimeLength;
          runTotalMileageLength = typeDict['1'].totalMileageLength;
          runTimes = typeDict['1'].occurrence;
          runTimeArr = typeDict['1'].segment;
        }
      }


      const series = [
        {
          data: dataArr,
          width: 3,
          label: getLocale('runAndStop'),
          unit: 'h',
          stopTimeArr,
          runTimeArr,
          autoConnectPartition: 'BEFORE',
          yValueFunc(item, serie) {
            const { yValue } = item;
            if (!yValue) {
              return '---';
            }
            const { index, type } = yValue;
            const { stopTimeArr: stopTimeArrInSerie, runTimeArr: runTimeArrInSerie } = serie;
            if (type === 1) {
              // 行驶状态
              for (let j = 0; j < runTimeArrInSerie.length; j += 1) {
                const ele = runTimeArrInSerie[j];
                if (ele.startIndex <= index && index <= ele.endIndex) {
                  return `${getLocale('driveTime')}: ${getTextFromSecond(ele.timeLength)}\n${getLocale('mileage')}: ${toFixed(ele.mileageLength, 1, true)} km`;
                }
              }
              // return `${getLocale('driveTime')}\n${toFixed(parseFloat(speed), 1, true)} km/h`;
            }
            for (let ii = 0; ii < stopTimeArrInSerie.length; ii += 1) {
              const ele = stopTimeArrInSerie[ii];
              if (ele.startIndex <= index && index <= ele.endIndex) {
                return `${getLocale('stopTimeLength')}: ${getTextFromSecond(ele.timeLength)}\n${getLocale('stopMile')}: ${toFixed(ele.mileageLength, 1, true)} km`;
              }
            }
            return '---';
          },
          yMinValue: 0,
          yMaxValue: 1.8,
        },
      ];

      const newSvgData = {
        runTotalTimeLength,
        stopTotalTimeLength,
        runTotalMileageLength,
        stopTotalMileageLength,
        runTimes,
        stopTimes,
        series,
      };
      this.data.prevData = rawData;
      this.data.svgData = newSvgData;
      return newSvgData;
    }
    return svgData;
  }


  render() {
    const {
      playIndex, data, onDrag, onDragEnd, uniqueKey,
    } = this.props;

    let svgData;
    try {
      svgData = this.getSvgData(data);
    } catch (error) {
      return (
        <View style={styles.failedContainer}>
          <Text style={styles.failed}>{getLocale('serverDataError')}</Text>
        </View>
      );
    }
    const {
      stopTimes,
      runTimes,
      stopTotalTimeLength,
      runTotalTimeLength,
      stopTotalMileageLength,
      runTotalMileageLength,
      series,
    } = svgData;
    // const now = new Date();
    // const maxEndTime = endTime > now ? now : endTime; // 查询结束日期不能超过当前时间
    // const diffInSecond = parseInt((maxEndTime.getTime() - startTime.getTime()) / 1000, 10);
    // const stopTotalTimeLength = diffInSecond - runTotalTimeLength;

    const runTimeObj = getObjFromSecond(runTotalTimeLength);
    const stopTimeObj = getObjFromSecond(stopTotalTimeLength);


    return (
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          <LineChart
            data={series}
            playIndex={playIndex}
            style={styles.chart}
            onDrag={(...param) => { onDrag(...param); }}
            onDragEnd={(...param) => { onDragEnd(...param); }}
            snap
            uniqueKey={uniqueKey}
            // rectWidth={50}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {getLocale('driveTimes')}
              <Text style={styles.titleActive}> {runTimes} </Text>
              <Text style={styles.titleUnit}>{getLocale('times')}</Text>
            </Text>
            <Text style={styles.title}>
              {getLocale('driveMileage')}
              <Text style={styles.titleActive}> {toFixed(runTotalMileageLength, 1, true)} </Text>
              <Text style={styles.titleUnit}>km</Text>
            </Text>
            <Text style={styles.title}>
              {getLocale('driveTime')}
              {
                runTimeObj.h ? (
                  <Text><Text style={styles.titleActive}> {runTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {runTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {runTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
            </Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {getLocale('stopTimes')}
              <Text style={styles.titleActive}> {stopTimes} </Text>
              <Text style={styles.titleUnit}>{getLocale('times')}</Text>
            </Text>
            <Text style={styles.title}>
              {getLocale('stopMile')}
              <Text style={styles.titleActive}> {toFixed(stopTotalMileageLength, 1, true)} </Text>
              <Text style={styles.titleUnit}>km</Text>
            </Text>
            <Text style={styles.title}>
              {getLocale('stopTimeLength')}
              {
                stopTimeObj.h ? (
                  <Text><Text style={styles.titleActive}> {stopTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {stopTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {stopTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default ChartStop;