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
import { toFixed } from '../../../utils/function';

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
    fontSize: 12,
  },
  titleActive: {
    color: '#2a8be9',
    fontSize: 14,
  },
  titleUnit: {
    fontSize: 12,
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

const mileageText = getLocale('mileage');

class ChartMileage extends Component {
  data = {
    prevData: null,
    svgData: null,
  }

  static propTypes = {
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

  getSvgData = (rawData) => {
    const { prevData, svgData } = this.data;
    if (!is(prevData, rawData) || svgData === null) {
      const dataSize = rawData.get('mileage').size;
      const selfData = rawData.getIn(['data', 'mileage']);

      const data = selfData.toArray();

      let maxMileage = 0;
      let maxSpeed = 0;
      if (dataSize > 0) {
        maxSpeed = parseFloat(data[0].get('speed'));
      }

      const mileageSerieData = [];
      const speedSerieData = [];
      for (let i = 0; i < dataSize; i += 1) {
        const element = data[i];
        let mileage = element.get('total');
        mileage = mileage === null ? null : parseFloat(mileage);
        let speed = element.get('speed');
        speed = speed === null ? null : parseFloat(speed);

        const time = new Date(element.get('time') * 1000);
        /** 如果一个点的里程小于0，则向前向后寻找大于0的点来替换自己, 向前优先 */
        if (mileage !== null && mileage <= 0) {
          let toReplace = null;

          for (let j = 0, max = Math.max(i, dataSize - i - 1); j < max; j += 1) {
            const prev = data[i - j];
            const next = data[i + j];
            if (prev && (prev.get('total') > 0)) {
              toReplace = prev;
            } else if (next && (next.get('total') > 0)) {
              toReplace = next;
            }
            if (toReplace !== null) {
              break;
            }
          }

          if (toReplace !== null) {
            data[i] = toReplace;
            mileage = toReplace.get('total');
            mileage = parseFloat(mileage);
          }
        }

        mileageSerieData.push({
          index: i,
          date: time,
          value: mileage,
          color: mileage === null ? 'transparent' : '#86cdf3',
        });

        speedSerieData.push({
          index: i,
          date: time,
          value: speed,
          color: speed === null ? 'transparent' : '#a3d843',
        });

        if (speed >= maxSpeed) {
          maxSpeed = speed;
        }
      }

      if (dataSize > 0) {
        maxMileage = data[dataSize - 1].get('total') - data[0].get('total');
        maxMileage = toFixed(maxMileage, 1, true);
      }

      const series = [
        {
          data: mileageSerieData,
          width: 1,
          label: mileageText,
          unit: 'km',
          yValueFunc(item, serie) {
            const { yValue } = item;
            if (!yValue) {
              return `${mileageText}: ---`;
            }
            const { index, value } = yValue;
            if (value === null) {
              return `${mileageText}: ---`;
            }
            let startMileage = serie.data[index].value - serie.data[0].value;
            startMileage = toFixed(startMileage, 2, true);
            return `${mileageText}: ${startMileage} km`;
          },
        },
        {
          data: speedSerieData,
          width: 1,
          label: getLocale('speed'),
          unit: 'km/h',
          yMinValue: 0,
          yMaxValue: 240,
        },
      ];
      const newSvgData = {
        maxMileage,
        maxSpeed,
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
    const { maxMileage, maxSpeed, series } = svgData;
    
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
              {getLocale('mileage')}
              <Text style={styles.titleActive}> {maxMileage < 0 ? '--' : maxMileage} </Text>
              <Text style={styles.titleUnit}>km</Text>
            </Text>
            <Text style={styles.title}>
              {getLocale('maxSpeed')}
              <Text style={styles.titleActive}> {maxSpeed < 0 ? '--' : maxSpeed} </Text>
              <Text style={styles.titleUnit}>km/h</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default ChartMileage;