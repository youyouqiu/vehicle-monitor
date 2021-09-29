/* eslint-disable no-nested-ternary */
import React, { Component } from 'react';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { getLocale } from '../../../utils/locales';
import { LineChart } from '../../../common/reactNativeD3Charts';
import { getObjFromSecond, isEmpty } from '../../../utils/function';

const upColor = '#709fa8';
const downColor = '#000000';
const alarmColor = '#f40505';

const styles = StyleSheet.create({
  topContainer: {
    height: 180,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 6,
    height: 150,
  },
  chart: {
    height: 150,
    backgroundColor: 'white',
  },
  selector: {
    height: 150,
    flex: 1,
    paddingVertical: 20,
  },
  selectorText: {
    color: '#616161',
    lineHeight: 15,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 5,
  },
  activeText: {
    color: '#1b96f3',
    textDecorationColor: '#1b96f3',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  titleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upRect: {
    width: 15,
    height: 5,
    marginRight: 3,
  },
  downRect: {
    width: 15,
    height: 5,
    marginRight: 3,
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


class ChartIoData extends Component {
  data={
    prevData: null,
    prevIndex: null,
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

  state={
    attachIndex: 0,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  getSvgData=(rawData, attachIndex) => {
    const { prevData, prevIndex, svgData } = this.data;
    if (!is(prevData, rawData) || prevIndex !== attachIndex || svgData === null) {
      const selfData = rawData.get('data');

      const mileage = rawData.get('mileage').toArray();
      const dataSize = mileage.length;
      const names = selfData.get('names').toArray();

      // 开关报警的状态(2:低电平 1 高电平)
      const alarmStatus = selfData.getIn(['alarmStatuses', attachIndex]); // 报警的值，如果data的值为此，则用红色表示

      const upText = selfData.getIn(['IOStatus', attachIndex, '0']);
      const downText = selfData.getIn(['IOStatus', attachIndex, '1']);

      const upColorItem = alarmStatus === '2' ? alarmColor : upColor;
      const downColorItem = alarmStatus === '1' ? alarmColor : downColor;

      let series;
      let totalUpTime = 0; // 开时长，以秒为单位
      let totalDownTime = 0; // 关时长，以秒为单位


      const getColor = (type) => {
        //  0-低电平 up  1-高电平 down
        if (type === null) {
          return 'transparent';
        }
        if (alarmStatus.length > 0 && type !== null) {
          if (type === 0 && alarmStatus === '2') { // 低电平
            return alarmColor;
          }
          if (type === 1 && alarmStatus === '1') { // 高电平
            return alarmColor;
          }
        }
        if (type === 0) {
          return upColor;
        }
        return downColor;
      };
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

      if (!isEmpty(selfData) && selfData.has('data')) {
        const data = selfData.get('data').toArray();
        let i = 0;
        for (; i < dataSize; i += 1) {
          const item = data[i];
          const newItem = {};
          let type = item.getIn(['statuses', attachIndex]); // 开关状态 0-低电平 1-高电平 2-IO异常 null-无数据
          if (type === 2) {
            type = null;
          }
          const time = item.get('time');

          if (type === null || i === dataSize - 1) {
            if (prevType === 0) {
              upTimeLength = data[(type === 0 ? i : i - 1)].get('time') - upStartTime;
              totalUpTime += upTimeLength;
              upTimeArr.push({
                startIndex: prevUpIndex,
                endIndex: (type === 0 ? i : i - 1),
                timeLength: upTimeLength,
              });
            } else if (prevType === 1) {
              downTimeLength = data[(type === 1 ? i : i - 1)].get('time') - downStartTime;
              totalDownTime += downTimeLength;
              downTimeArr.push({
                startIndex: prevDownIndex,
                endIndex: (type === 1 ? i : i - 1),
                timeLength: downTimeLength,
              });
            }
          } else if (type === 0) {
            if (prevType === 1 || prevType === null) {
              upStartTime = time;
              prevUpIndex = i;
              if (prevType === 1) {
                downTimeLength = data[i - 1].get('time') - downStartTime;
                totalDownTime += downTimeLength;
                downTimeArr.push({
                  startIndex: prevDownIndex,
                  endIndex: i - 1,
                  timeLength: downTimeLength,
                });
              }
            }
          } else if (type === 1) {
            if (prevType === 0 || prevType === null) {
              downStartTime = time;
              prevDownIndex = i;
              if (prevType === 0) {
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
          newItem.color = getColor(type);
          newItem.type = type;

          dataArr.push(newItem);
        }
      } else {
        series = null;
        totalUpTime = '--';
        totalDownTime = '--';
      }


      series = [
        {
          data: dataArr,
          width: 3,
          label: getLocale('io'),
          unit: 'h',
          upTimeArr,
          downTimeArr,
          autoConnectPartition: 'BEFORE',
          yValueFunc(item) {
            const { yValue } = item;
            if (!yValue || yValue.type === null) {
              return '---';
            }
            const {
              type, date,
            } = yValue;

            if (date === null) {
              return getLocale('noData');
            }
            if (type === 0 || type === 1) {
              return '';
            }

            return '---';
          },
        },
      ];
      const newSvgData = {
        upText,
        downText,
        upColorItem,
        downColorItem,
        names,
        totalUpTime,
        totalDownTime,
        series,
      };
      this.data.prevData = rawData;
      this.data.prevIndex = attachIndex;
      this.data.svgData = newSvgData;
      return newSvgData;
    }
    return svgData;
  }

  handleAttachChange=(item, index) => {
    this.setState({
      attachIndex: index,
    });
  }

  render() {
    const {
      playIndex, data, onDrag, onDragEnd, uniqueKey,
    } = this.props;
    const { attachIndex } = this.state;

    const uniqueKeyAttach = `${uniqueKey}:${attachIndex}`;

    let svgData;
    try {
      svgData = this.getSvgData(data, attachIndex);
    } catch (error) {
      return (
        <View style={styles.failedContainer}>
          <Text style={styles.failed}>{getLocale('serverDataError')}</Text>
        </View>
      );
    }
    const {
      names, upText, downText, upColorItem, downColorItem, totalUpTime, totalDownTime, series,
    } = svgData;

    const totalUpTimeObj = getObjFromSecond(totalUpTime);
    const totalDownTimeObj = getObjFromSecond(totalDownTime);

    return (
      <View style={styles.topContainer}>
        <View style={styles.container}>
          <View style={styles.chartContainer}>
            {
              series === null ? (
                <View style={styles.failedContainer}>
                  <Text style={styles.failed}>{getLocale('noSensorData')}</Text>
                </View>
              ) : (
                <LineChart
                  data={series}
                  playIndex={playIndex}
                  style={styles.chart}
                  onDrag={(...param) => { onDrag(...param); }}
                  onDragEnd={(...param) => { onDragEnd(...param); }}
                  snap
                  rectColorFunc={(xValue) => {
                    const { color } = xValue;
                    if (color === 'transparent') {
                      return null;
                    }
                    return color;
                  }}
                  // rectWidth={50}
                  rectHeight={22}
                  uniqueKey={uniqueKeyAttach}
                  key={`ioDataChart${attachIndex.toString()}`}
                />
              )
            }
          </View>
          <View style={styles.selector}>
            <ScrollView>
              {
                names.map((item, index) => (
                  <Text
                    style={[styles.selectorText, index === attachIndex ? styles.activeText : null]}
                    onPress={() => { this.handleAttachChange(item, index); }}
                  >
                    {item.length > 4 ? `${item.substr(0, 4)}` : item}
                  </Text>
                ))
              }
            </ScrollView>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.titleWrapper}>
            <View style={[styles.upRect, { backgroundColor: upColorItem }]} />
            <Text style={styles.title}>
              {upText}
              {
                totalUpTime === '--' ? '--' : (
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
                )
              }
            </Text>
          </View>
          <View style={styles.titleWrapper}>
            <View style={[styles.downRect, { backgroundColor: downColorItem }]} />
            <Text style={styles.title}>
              {downText}
              {
                totalDownTime === '--' ? '--' : (
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
                )
              }
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default ChartIoData;