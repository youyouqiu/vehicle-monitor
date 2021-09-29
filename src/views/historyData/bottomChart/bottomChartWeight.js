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
import {
  toFixed, getObjFromSecond, isEmpty,
} from '../../../utils/function';

const styles = StyleSheet.create({
  topContainer: {
    height: 180,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 7,
    height: 120,
  },
  chart: {
    height: 120,
    backgroundColor: 'white',
  },
  selector: {
    height: 120,
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
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  title: {
    color: '#333333',
    fontSize: 13,
    // flex: 1,
    textAlign: 'left',
    paddingLeft: 10,
    width: '33.33%',
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
  if (type === '1') { // 空载
    return '#cdcdcd';
  } if (type === '6') { // 轻载
    return '#bddbff';
  } if (type === '2') { // 满载
    return '#8b84eb';
  } if (type === '7') { // 重载
    return '#95b6f2';
  } if (type === '3') { // 超载
    return '#f8a023';
  }
  return '#ffffff';
};

const weightName = { '0x70': 1, '0x71': 2 };

class ChartWeight extends Component {
  data={
    prevData: null,
    svgData: null,
  }

  static propTypes={
    data: PropTypes.object,
    playIndex: PropTypes.number.isRequired,
    attachList: PropTypes.object.isRequired,
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
    const { prevData, prevIndex: prevAttachIndex, svgData } = this.data;
    if (!is(prevData, rawData) || prevAttachIndex !== attachIndex || svgData === null) {
      const dataSize = rawData.get('mileage').size;
      const data = rawData.get('data').toJS();
      const weight = data.sensorDataList.slice(0, dataSize);

      const padEndData = weight.concat([
        {
          weight: [null, null],
          time: 2571155205,
          status: [-1, -1],
        }]);


      const padEndDataLength = padEndData.length;

      const dataArr = [];

      let emptyTime = 0; // 以秒为单位
      let fullTime = 0;
      let overTime = 0;
      let lightTime = 0;
      let heavyTime = 0;

      let maxValue = data.maxLoadWeight[attachIndex];
      if (data.overLoadValue[attachIndex] > maxValue || isEmpty(maxValue)) {
        maxValue = data.overLoadValue[attachIndex];
      }

      const unit = maxValue > 1000.0 ? 'T' : 'kg';

      if (padEndDataLength > 0) {
        const typeDict = {};
        let prevType = padEndData[0].status[attachIndex];
        let prevIndex = 0;
        let notNullIndex = 0;

        for (let i = 0; i < padEndDataLength; i += 1) {
          const element = padEndData[i];
          // 载重状态 “1”：空载， “2”：满载， “3”：超载 ，“4”：装载 ，“5”：卸载，“6”：轻载 ，“7”：重载
          const currentType = element.status[attachIndex];

          const { time } = element;

          if (i < padEndDataLength - 1) {
            let value = element.weight[attachIndex];
            if (value === undefined || value === null) {
              value = null;
            } else if (unit === 'T') {
              value = toFixed(value / 1000.0, 1, true);
            }
            const newItem = {};
            newItem.date = new Date(time * 1000);
            newItem.value = value;
            newItem.supply = element.supply;
            newItem.index = i;
            newItem.color = getColor(currentType);
            newItem.type = currentType;

            dataArr.push(newItem);
          }

          // 1.补点数据不参与计算
          // 2.两个点就算是相同状态，但时间差大于5分钟，也属于两个状态段
          // 3.如果两个状态之间时间差大于5分钟，则按状态段首尾点计算
          // 4.不然按下一个状态段第一个点 - 上一个状态段最后一点计算

          if (currentType === null) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const timeDiff = padEndData[i].time - padEndData[notNullIndex].time;


          if (currentType !== prevType || timeDiff > 300) {
            const item = typeDict[prevType];
            let endIndex = notNullIndex;
            // 如果两个状态之间时间差大于5分钟，则按状态段首尾点计算
            // 不然按下一个状态段第一个点 - 上一个状态段最后一点计算
            let timeLength = padEndData[endIndex].time - padEndData[prevIndex].time;
            if (timeDiff <= 300) {
              endIndex = i;
              timeLength = padEndData[endIndex].time - padEndData[prevIndex].time;
            }
            const segment = {
              startIndex: prevIndex,
              endIndex,
              timeLength,
              startTime: padEndData[prevIndex].time,
              endTime: padEndData[endIndex].time,
            };
            if (item) {
              item.occurrence += 1;
              item.totalTimeLength += timeLength;
              item.segment.push(segment);
            } else {
              typeDict[prevType] = {
                type: prevType,
                occurrence: 1,
                totalTimeLength: timeLength,
                segment: [segment],
              };
            }
            prevType = currentType;
            prevIndex = i;
          }
          notNullIndex = i;
        }

        if (typeDict['1']) {
          emptyTime = typeDict['1'].totalTimeLength;
        }
        if (typeDict['2']) {
          fullTime = typeDict['2'].totalTimeLength;
        }
        if (typeDict['3']) {
          overTime = typeDict['3'].totalTimeLength;
        }
        if (typeDict['6']) {
          lightTime = typeDict['6'].totalTimeLength;
        }
        if (typeDict['7']) {
          heavyTime = typeDict['7'].totalTimeLength;
        }
      }

      const line = [];
      const maxPrepare = [];
      if (data.noLoadValue[attachIndex] !== null
        && data.noLoadValue[attachIndex] !== undefined) {
        const v = parseFloat(unit === 'T' ? toFixed(data.noLoadValue[attachIndex] / 1000.0, 1, true) : data.noLoadValue[attachIndex]);
        line.push({
          value: v,
          color: 'red',
        });
        maxPrepare.push(v);
      }
      if (data.lightLoadValue[attachIndex] !== null
        && data.lightLoadValue[attachIndex] !== undefined) {
        const v = parseFloat(unit === 'T' ? toFixed(data.lightLoadValue[attachIndex] / 1000.0, 1, true) : data.lightLoadValue[attachIndex]);
        line.push({
          value: v,
          color: 'red',
        });
        maxPrepare.push(v);
      }
      if (data.fullLoadValue[attachIndex] !== null
        && data.fullLoadValue[attachIndex] !== undefined) {
        const v = parseFloat(unit === 'T' ? toFixed(data.fullLoadValue[attachIndex] / 1000.0, 1, true) : data.fullLoadValue[attachIndex]);
        line.push({
          value: v,
          color: 'red',
        });
        maxPrepare.push(v);
      }
      if (data.overLoadValue[attachIndex] !== null
        && data.overLoadValue[attachIndex] !== undefined) {
        const v = parseFloat(unit === 'T' ? toFixed(data.overLoadValue[attachIndex] / 1000.0, 1, true) : data.overLoadValue[attachIndex]);
        line.push({
          value: v,
          color: 'red',
        });
        maxPrepare.push(v);
      }

      let max = 0;
      if (!(isEmpty(data.maxLoadWeight) || isEmpty(data.maxLoadWeight[attachIndex]))) {
        max = unit === 'T' ? toFixed(data.maxLoadWeight[attachIndex] / 1000.0, 1, true) : data.maxLoadWeight[attachIndex];
      }
      for (let i = 0; i < maxPrepare.length; i += 1) {
        const element = maxPrepare[i];
        if (element > max) {
          max = element;
        }
      }

      if (max === 0) {
        max = 1;
      }

      const series = [{
        data: dataArr,
        width: 1,
        label: `${getLocale('weightText')}(${unit})`,
        unit,
        autoConnectPartition: 'BEFORE',
        yValueFunc(rItem) {
          if (!rItem.yValue) {
            return '---';
          }
          const { yValue } = rItem;
          const { supply } = yValue;
          if (supply) {
            return getLocale('noData');
          }
          if (rItem.yValue.value === null) {
            return getLocale('noSensorData');
          }
          return rItem.text;
        },
        line,
        yMinValue: 0,
        yMaxValue: max,
      }];


      const newSvgData = {
        emptyTime,
        lightTime,
        heavyTime,
        fullTime,
        overTime,
        series,
      };
      this.data.prevData = rawData;
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
      playIndex, data, onDrag, onDragEnd, uniqueKey, attachList,
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
      emptyTime,
      lightTime,
      heavyTime,
      fullTime,
      overTime,
      series,
    } = svgData;
    // const now = new Date();
    // const maxEndTime = endTime > now ? now : endTime; // 查询结束日期不能超过当前时间
    // const diffInSecond = parseInt((maxEndTime.getTime() - startTime.getTime()) / 1000, 10);
    // const stopTotalTimeLength = diffInSecond - runTotalTimeLength;

    const emptyTimeObj = getObjFromSecond(emptyTime);
    const lightTimeObj = getObjFromSecond(lightTime);
    const heavyTimeObj = getObjFromSecond(heavyTime);
    const fullTimeObj = getObjFromSecond(fullTime);
    const overTimeObj = getObjFromSecond(overTime);


    return (

      <View style={styles.topContainer}>
        <View style={styles.container}>
          <View style={styles.chartContainer}>

            {
              series === null ? (
                <View style={styles.failedContainer}>
                  <Text style={styles.failed}>{getLocale('noData')}</Text>
                </View>
              ) : (
                <LineChart
                  data={series}
                  playIndex={playIndex}
                  style={styles.chart}
                  onDrag={(...param) => { onDrag(...param); }}
                  onDragEnd={(...param) => { onDragEnd(...param); }}
                  snap

                  // rectWidth={50}
                  rectHeight={22}
                  key={`temperatureyChart${attachIndex.toString()}`}
                  uniqueKey={uniqueKeyAttach}
                />
              )
            }
          </View>
          <View style={styles.selector}>
            <ScrollView>
              {
                !isEmpty(attachList) ? attachList.filter(x => weightName[x]).map((item, index) => (
                  <Text
                    style={[styles.selectorText, index === attachIndex ? styles.activeText : null]}
                    onPress={() => { this.handleAttachChange(item, index); }}
                    key={item}
                  >
                    {`${weightName[item]}#`}
                  </Text>
                )) : null
            }
            </ScrollView>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {getLocale('weightEmpty')}
            {
                emptyTimeObj.h !== undefined ? (
                  <Text><Text style={styles.titleActive}> {emptyTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {emptyTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {emptyTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
          </Text>
          <Text style={styles.title}>
            {getLocale('weightLight')}
            {
                lightTimeObj.h !== undefined ? (
                  <Text><Text style={styles.titleActive}> {lightTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {lightTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {lightTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
          </Text>
          <Text style={styles.title}>
            {getLocale('weightHeavy')}
            {
                heavyTimeObj.h !== undefined ? (
                  <Text><Text style={styles.titleActive}> {heavyTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {heavyTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {heavyTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
          </Text>

        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {getLocale('weightFull')}
            {
                fullTimeObj.h !== undefined ? (
                  <Text><Text style={styles.titleActive}> {fullTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {fullTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {fullTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
          </Text>
          <Text style={styles.title}>
            {getLocale('weightOver')}
            {
                overTimeObj.h !== undefined ? (
                  <Text><Text style={styles.titleActive}> {overTimeObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {overTimeObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {overTimeObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              }
          </Text>
          <Text style={styles.title} />
        </View>
      </View>
    );
  }
}

export default ChartWeight;