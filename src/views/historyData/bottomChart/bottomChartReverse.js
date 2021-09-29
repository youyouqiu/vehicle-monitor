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
import { getTextFromSecond, getObjFromSecond } from '../../../utils/function';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 1,
    height: 180,
  },
  chart: {
    height: 150,
    backgroundColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  title: {
    color: '#333333',
    fontSize: 13,
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


class ChartReverse extends Component {
  data={
    prevData: null,
    svgData: null,
  }

  static propTypes={
    data: PropTypes.object,
    playIndex: PropTypes.number.isRequired,
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
      const mileage = rawData.get('mileage').toArray();
      const dataSize = mileage.length;
      const data = rawData.getIn(['data', 'motor']).toArray();

      const color = { 1: '#e14877', 2: '#f9cc42', null: 'transparent' };
      let totalUpTime = 0; // 正转时长，以秒为单位
      let totalDownTime = 0; // 反转时长，以秒为单位
      let upTimeLength = 0; // 以秒为单位
      let downTimeLength = 0; // 以秒为单位
      let prevType = null;
      let upStartTime = null;
      let downStartTime = null;
      const upTimeArr = [];
      let prevUpIndex = 0;
      const downTimeArr = [];
      let prevDownIndex = 0;
      const dataArr = [];
      let i = 0;

      for (; i < dataSize; i += 1) {
        const item = data[i];
        const newItem = {};
        let type = item.get('orientation');
        const time = item.get('time');
        const rotationStatus = item.get('rotationStatus');
        if (rotationStatus === '1' || rotationStatus === null) {
          type = null;
        }
        if (type === null || i === dataSize - 1) {
          // 停止
          if (prevType === 1) {
            upTimeLength = data[(type === 1 ? i : i - 1)].get('time') - upStartTime;
            totalUpTime += upTimeLength;
            upTimeArr.push({
              startIndex: prevUpIndex,
              endIndex: (type === 1 ? i : i - 1),
              timeLength: upTimeLength,
            });
          } else if (prevType === 2) {
            downTimeLength = data[(type === 2 ? i : i - 1)].get('time') - downStartTime;
            totalDownTime += downTimeLength;
            downTimeArr.push({
              startIndex: prevDownIndex,
              endIndex: (type === 2 ? i : i - 1),
              timeLength: downTimeLength,
            });
          }
        } else if (type === 1) {
          // 正转
          if (prevType === 2 || prevType === null) {
            upStartTime = time;
            prevUpIndex = i;
            if (prevType === 2) {
              downTimeLength = data[i - 1].get('time') - downStartTime;
              totalDownTime += downTimeLength;
              downTimeArr.push({
                startIndex: prevDownIndex,
                endIndex: i - 1,
                timeLength: downTimeLength,
              });
            }
          }
        } else if (type === 2) {
          // 反转
          if (prevType === 1 || prevType === null) {
            downStartTime = time;
            prevDownIndex = i;
            if (prevType === 1) {
              upTimeLength = data[i - 1].get('time') - upStartTime;
              totalUpTime += upTimeLength;
              upTimeArr.push({
                startIndex: prevUpIndex,
                endIndex: i - 1,
                timeLength: upTimeLength,
              });
            }
          }
        }
        prevType = type;

        newItem.date = time === 0 ? null : new Date(time * 1000);
        newItem.value = 1;
        newItem.index = i;
        newItem.color = color[type];
        newItem.type = type;

        dataArr.push(newItem);
      }

      const series = [
        {
          data: dataArr,
          width: 3,
          label: getLocale('reverseText'),
          unit: 'h',
          upTimeArr,
          downTimeArr,
          yValueFunc(item, serie) {
            const { yValue } = item;
            if (!yValue || yValue.type === null) {
              return '---';
            }

            const {
              index, type, date,
            } = yValue;

            if (date === null) {
              return getLocale('noData');
            }
            const { upTimeArr: upTimeArrInSerie, downTimeArr: downTimeArrInSerie } = serie;
            if (type === 1) {
              // 正转
              for (let ii = 0; ii < upTimeArrInSerie.length; ii += 1) {
                const ele = upTimeArrInSerie[ii];
                if (ele.startIndex <= index && index <= ele.endIndex) {
                  return `${getLocale('upRotate')}\n${getTextFromSecond(ele.timeLength)}`;
                }
              }
            } else if (type === 2) {
              for (let ii = 0; ii < downTimeArrInSerie.length; ii += 1) {
                const ele = downTimeArrInSerie[ii];
                if (ele.startIndex <= index && index <= ele.endIndex) {
                  return `${getLocale('downRotate')}\n${getTextFromSecond(ele.timeLength)}`;
                }
              }
            } else if (type === null) {
              return getLocale('stopRorate');
            }

            return '---';
          },
          yMinValue: 0,
          yMaxValue: 1.8,
        },
      ];
      const newSvgData = {
        totalUpTime,
        totalDownTime,
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
    const { totalUpTime, totalDownTime, series } = svgData;

    const totalUpTimeObj = getObjFromSecond(totalUpTime);
    const totalDownTimeObj = getObjFromSecond(totalDownTime);

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
          />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {getLocale('upRotateTime')}
              {
                totalUpTimeObj.h ? (
                  <Text><Text style={styles.titleActive}> {totalUpTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {totalUpTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {totalUpTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
            </Text>
            <Text style={styles.title}>
              {getLocale('downRotateTime')}
              {
                totalDownTimeObj.h ? (
                  <Text><Text style={styles.titleActive}> {totalDownTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {totalDownTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {totalDownTimeObj.s} </Text>
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

export default ChartReverse;