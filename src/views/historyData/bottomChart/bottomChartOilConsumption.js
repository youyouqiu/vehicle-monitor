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
import { toFixed, tryParseFloat, isEmpty } from '../../../utils/function';

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


class ChartOilConsumption extends Component {
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
      const dataSize = rawData.get('mileage').size;
      const data = rawData.getIn(['data', 'oilConsume']).toArray();

      let totalOilConsumption = 0;
      let totalOilConsumption100 = 0;
      const serieData = [];

      for (let i = 0; i < dataSize; i += 1) {
        let color = '#e88031';
        const x = data[i];
        let amount = x.get('amount');

        if (amount === null) {
          color = 'transparent';
        } else {
          amount = parseFloat(amount);
          /** 如果一个点的油耗小于等于0，则向前向后寻找大于等于0的点来替换自己, 向前优先
           * 只有第一个和最后一个点这样循环寻找，中间的点向前找一个点就可以了
           */
          if (amount <= 0) {
            let toReplace = null;

            if (i === 0 || i === dataSize - 1) {
              for (let j = 1, max = Math.max(i, dataSize - i - 1); j < max; j += 1) {
                const prev = data[i - j];
                const next = data[i + j];

                if (prev && (prev.get('amount') > 0)) {
                  toReplace = prev;
                } else if (next && (next.get('amount') > 0)) {
                  toReplace = next;
                }
                if (toReplace !== null) {
                  break;
                }
              }
            } else if (data[i - 1] && (data[i - 1].get('amount') > 0)) {
              toReplace = data[i - 1];
            }

            if (toReplace !== null) {
              data[i] = toReplace;
              amount = toReplace.get('amount');
              amount = isEmpty(amount) ? 0 : parseFloat(amount);
            }
          }
        }


        serieData.push({
          index: i,
          date: new Date(x.get('time') * 1000),
          value: amount,
          color,
        });
      }

      if (dataSize > 0) {
        let firstIndex = null;
        let lastIndex = null;

        for (let i = 0, halfLen = Math.ceil(dataSize / 2); i < halfLen; i += 1) {
          if (firstIndex === null && !isEmpty(data[i].get('amount'))) {
            firstIndex = i;
          }
          if (lastIndex === null && !isEmpty(data[dataSize - i - 1].get('amount'))) {
            lastIndex = dataSize - i - 1;
          }
          if (firstIndex !== null && lastIndex !== null) {
            break;
          }
        }

        if (firstIndex !== null && lastIndex !== null) {
          const firstAmount = tryParseFloat(data[firstIndex].get('amount'), 0);
          const lastAmount = tryParseFloat(data[lastIndex].get('amount'), 0);
          const firstMileage = tryParseFloat(data[firstIndex].get('mileage'), 0);
          const lastMileage = tryParseFloat(data[lastIndex].get('mileage'), 0);

          totalOilConsumption = lastAmount - firstAmount;
          if (lastMileage - firstMileage === 0) {
            totalOilConsumption100 = '--';
          } else {
            totalOilConsumption100 = (lastAmount - firstAmount)
            / (lastMileage - firstMileage) * 100;
            totalOilConsumption100 = toFixed(totalOilConsumption100, 1, true);
          }
        }
      }
      const series = [
        {
          data: serieData,
          width: 1,
          label: getLocale('oilConsumption'),
          unit: 'L',
          yValueFunc(item) {
            const { yValue } = item;
            if (!yValue || yValue.value === null) {
              return '---';
            }
            const { value } = yValue;
            return `${value} L`;
            // let usedOil = serie.data[index].value - serie.data[0].value;
            // usedOil = toFixed(usedOil, 2, true);
            // return `${getLocale('useOil')}:${usedOil} L`;
          },
        },
      ];
      const newSvgData = {
        totalOilConsumption,
        totalOilConsumption100,
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

    // const svgData = this.getSvgData(data);
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
    const { totalOilConsumption, totalOilConsumption100, series } = svgData;

    return (
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          <LineChart
            data={series}
            playIndex={playIndex}
            style={styles.chart}
            onDrag={(...param) => { onDrag(...param); }}
            onDragEnd={(...param) => { onDragEnd(...param); }}
            // rectWidth={60}
            rectHeight={22}
            snap
            uniqueKey={uniqueKey}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {getLocale('oilConsumption')}
              <Text style={styles.titleActive}> {toFixed(totalOilConsumption, 1, true)} </Text>
              <Text style={styles.titleUnit}>L</Text>
            </Text>
            <Text style={styles.title}>
              {getLocale('oilConsumption100')}
              <Text style={styles.titleActive}> {totalOilConsumption100} </Text>
              <Text style={styles.titleUnit}>L/100km</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default ChartOilConsumption;