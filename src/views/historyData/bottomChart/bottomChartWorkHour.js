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
import { getObjFromSecond } from '../../../utils/function';

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
    lineHeight: 12,
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

const workHourIds = ['0x80', '0x81'];

class ChartWorkHour extends Component {
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
    attachList: PropTypes.object.isRequired,
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
      const dataSize = rawData.get('mileage').size;
      const selfData = rawData.get('data');

      const workInspectionMethod = selfData.getIn(['workInspectionMethod', attachIndex]);

      let series = null;
      let workDuration = '--';
      let standByDuration = '--';
      let haltDuration = '--';

      if (selfData.has('workHourInfo')) {
        const workHourData = selfData.get('workHourInfo').toArray();
        workDuration = selfData.getIn(['workDuration', attachIndex]);
        standByDuration = selfData.getIn(['standByDuration', attachIndex]);
        haltDuration = selfData.getIn(['haltDuration', attachIndex]);

        const color = {
          0: '#5a5a5a', 1: '#606dcf', 2: '#deb741', null: 'transparent',
        };
        const getColor = (x) => {
          if (x.getIn(['effectiveData', attachIndex]) === 0) {
            return color[x.getIn(['workingPosition', attachIndex])];
          }
          return 'transparent';
        };
        const getValue = (x) => {
          const value = x.getIn(['checkData', attachIndex]);
          if (value === null) {
            return null;
          }
          return parseFloat(value);
        };

        let maxValue = 0;
        const serieData = [];
        for (let i = 0; i < dataSize; i += 1) {
          const x = workHourData[i];
          const value = getValue(x);
          serieData.push({
            index: i,
            date: new Date(x.get('time') * 1000),
            value,
            color: getColor(x),
            validate: x.getIn(['effectiveData', attachIndex]), // 0有效,1显示横线,2显示空
          });
          if (value > maxValue) {
            maxValue = value;
          }
        }

        if (workInspectionMethod === 0) {
        // 电压比较式
          series = [{
            data: serieData,
            width: 1,
            label: getLocale('voltage'),
            unit: 'V',
            autoConnectPartition: 'BEFORE',
            yValueFunc: rItem => rItem.text,
            yMinValue: 0,
            yMaxValue: maxValue + 10,
          }];
          const thresholdValue = selfData.getIn(['thresholdValue', attachIndex]);

          if (thresholdValue !== null && thresholdValue > 0) {
            series[0].line = [{
              value: parseFloat(thresholdValue),
              color: 'darkgray',
            }];
            series[0].yMaxValue = Math.max(series[0].yMaxValue, parseFloat(thresholdValue) + 10);
          }
        } else if (workInspectionMethod === 1) {
        // 油耗阈值式
          series = [{
            data: serieData,
            width: 1,
            label: getLocale('secondFlow'),
            unit: 'L/h',
            autoConnectPartition: 'BEFORE',
            yValueFunc: rItem => rItem.text,
            yMinValue: 0,
            yMaxValue: maxValue + 10,
          }];
          const thresholdValue = selfData.getIn(['thresholdValue', attachIndex]);

          if (thresholdValue !== null && thresholdValue > 0) {
            series[0].line = [{
              value: parseFloat(thresholdValue),
              color: 'darkgray',
            }];
            series[0].yMaxValue = Math.max(series[0].yMaxValue, parseFloat(thresholdValue) + 10);
          }
        } else {
        // 油耗波动式
          const mileageData = rawData.getIn(['mileage']).toArray();

          series = [
            {
              data: serieData,
              width: 1,
              label: getLocale('secondFlow'),
              unit: 'L/h',
              autoConnectPartition: 'BEFORE',
              yMinValue: 0,
              yMaxValue: maxValue + 10,
              yValueFunc: rItem => rItem.text,
            },
            {
              data: mileageData.map((x, i) => {
                const value = x.get('speed');
                return {
                  index: i,
                  date: new Date(x.get('time') * 1000),
                  value: value === null ? null : parseFloat(value),
                  color: value === null ? 'transparent' : '#a3d843',
                };
              }),
              width: 1,
              label: getLocale('speed'),
              unit: 'km/h',
              yMinValue: 0,
              yMaxValue: 240,
            },
          ];
        }
      }

      const newSvgData = {
        workInspectionMethod,
        workDuration,
        standByDuration,
        haltDuration,
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
      playIndex, onDrag, onDragEnd, attachList, data, uniqueKey,
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
      workInspectionMethod, workDuration, standByDuration, haltDuration, series,
    } = svgData;

    const workDurationObj = getObjFromSecond(workDuration);
    const standByDurationObj = getObjFromSecond(standByDuration);
    const haltDurationObj = getObjFromSecond(haltDuration);

    return (
      <View style={styles.topContainer}>
        <View style={styles.container}>
          <View style={styles.chartContainer}>
            <LineChart
              data={series}
              playIndex={playIndex}
              style={styles.chart}
              onDrag={(...param) => { onDrag(...param); }}
              onDragEnd={(...param) => { onDragEnd(...param); }}
              snap
              key={`workHourChart${attachIndex.toString()}`}
              uniqueKey={uniqueKeyAttach}
            />

          </View>
          <View style={styles.selector}>
            <ScrollView>
              {
                attachList.filter(item => (workHourIds.indexOf(item) > -1)).map((item, index) => (
                  <Text
                    style={[styles.selectorText, index === attachIndex ? styles.activeText : null]}
                    onPress={() => { this.handleAttachChange(item, index); }}
                  >
                    {item - '0x7f'}#
                  </Text>
                ))
            }
            </ScrollView>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {getLocale('valideWorkHour')}
            {
              workDuration === '--' ? '--' : (
                workDurationObj.h ? (
                  <Text><Text style={styles.titleActive}> {workDurationObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {workDurationObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {workDurationObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                )
              )
            }
          </Text>
          {
                (workInspectionMethod === 2 || workInspectionMethod === 1) && (
                <Text style={styles.title}>
                  {getLocale('waitWorkHour')}
                  {
                standByDuration === '--' ? '--' : (standByDurationObj.h ? (
                  <Text><Text style={styles.titleActive}> {standByDurationObj.h} </Text>
                    <Text style={styles.titleUnit}>h</Text>
                  </Text>
                ) : (
                  <Text>
                    <Text style={styles.titleActive}> {standByDurationObj.m} </Text>
                    <Text style={styles.titleUnit}>m</Text>
                    <Text style={styles.titleActive}> {standByDurationObj.s} </Text>
                    <Text style={styles.titleUnit}>s</Text>
                  </Text>
                ))
              }
                </Text>
                )
            }
          <Text style={styles.title}>
            {getLocale('stopWorkHour')}
            {
                haltDuration === '--' ? '--' : (
                  haltDurationObj.h ? (
                    <Text><Text style={styles.titleActive}> {haltDurationObj.h} </Text>
                      <Text style={styles.titleUnit}>h</Text>
                    </Text>
                  ) : (
                    <Text>
                      <Text style={styles.titleActive}> {haltDurationObj.m} </Text>
                      <Text style={styles.titleUnit}>m</Text>
                      <Text style={styles.titleActive}> {haltDurationObj.s} </Text>
                      <Text style={styles.titleUnit}>s</Text>
                    </Text>
                  )
                )
              }
          </Text>
        </View>
      </View>
    );
  }
}

export default ChartWorkHour;