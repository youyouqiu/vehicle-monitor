import React, { Component } from 'react';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { max } from 'lodash';
import { getLocale } from '../../../utils/locales';
import { LineChart } from '../../../common/reactNativeD3Charts';
import { toFixed, isEmpty } from '../../../utils/function';

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

const oilTankName = { '0x41': getLocale('mainOil'), '0x42': getLocale('secondOil') };

class ChartOilData extends Component {
  data = {
    prevData: null,
    prevIndex: null,
    svgData: null,
  }

  static propTypes = {
    data: PropTypes.object,
    playIndex: PropTypes.number.isRequired,
    uniqueKey: PropTypes.string.isRequired,
    attachList: PropTypes.object.isRequired,
    onDrag: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
  }

  static defaultProps = {
    data: null,
  }

  state = {
    attachIndex: 0,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  getSvgData = (rawData, attachIndex) => {
    const { prevData, prevIndex, svgData } = this.data;
    if (!is(prevData, rawData) || prevIndex !== attachIndex || svgData === null) {
      const dataSize = rawData.get('mileage').size;
      const oilData = rawData.getIn(['data', 'oilMass']).toArray();

      let totalAddOil = 0;
      let totalReduceOil = 0;
      let totalUseOil = 0;
      const serieData = [];
      const dotts = [];
      let maxValue = 350;

      for (let i = 0; i < dataSize; i += 1) {
        const element = oilData[i];

        const color = '#e88031';
        let oil = element.getIn(['oilTank', attachIndex]);
        // 过滤油量小于等于0.5的数据
        oil = (oil === null || oil === undefined) ? null : parseFloat(oil);
        // if (oil !== null) {
        if (oil === null || oil === undefined) {
          oil = 0;
        }
        oil = parseFloat(oil);
        if (oil > maxValue) maxValue = null;
        /** 如果一个点的油量小于等于0.5，则向前向后寻找大于0.5的点来替换自己, 向前优先
           * 只有第一个和最后一个点这样循环寻找，中间的点向前找一个点就可以了
           * */
        if (oil <= 0.5) {
          let toReplace = null;

          if (i === 0 || i === dataSize - 1) {
            for (let j = 0, max = Math.max(i, dataSize - i - 1); j < max; j += 1) {
              const prev = oilData[i - j];
              const next = oilData[i + j];
              if (prev && (prev.getIn(['oilTank', attachIndex]) > 0.5)) {
                toReplace = prev;
              } else if (next && (next.getIn(['oilTank', attachIndex]) > 0.5)) {
                toReplace = next;
              }
              if (toReplace !== null && toReplace !== undefined) {
                break;
              }
            }
          } else if (oilData[i - 1] && (oilData[i - 1].getIn(['oilTank', attachIndex]) > 0.5)) {
            toReplace = oilData[i - 1];
          }
          if (toReplace !== null && toReplace !== undefined) {
            oilData[i] = toReplace;
            oil = toReplace.getIn(['oilTank', attachIndex]);
            oil = isEmpty(oil) ? 0 : parseFloat(oil);
          }
        }
        // } else {
        //   color = 'transparent';
        // }
        let fuelAmount = element.getIn(['fuelAmount', attachIndex]);
        let fuelSpill = element.getIn(['fuelSpill', attachIndex]);
        if (fuelAmount !== null && fuelAmount !== undefined) {
          fuelAmount = parseFloat(fuelAmount);
          totalAddOil += fuelAmount;
        }
        if (fuelSpill !== null && fuelSpill !== undefined) {
          fuelSpill = parseFloat(fuelSpill);
          totalReduceOil += fuelSpill;
        }


        const newElement = {
          index: i,
          date: new Date(element.get('time') * 1000),
          value: oil,
          color,
          fuelAmount,
          fuelSpill,
        };
        serieData.push(newElement);
        if (fuelAmount > 0) {
          dotts.push({
            value: i,
            color: 'green',
          });
        }
        if (fuelSpill > 0) {
          dotts.push({
            value: i,
            color: 'red',
          });
        }
      }
      const series = [{
        data: serieData,
        width: 1,
        dotts,
        label: getLocale('oilDataText'),
        yValueFunc: (rItem, serie) => {
          if (!rItem.yValue) {
            return `${getLocale('leftOil')} ${rItem.text}`;
          }
          const { fuelAmount, fuelSpill } = rItem.yValue;
          if (fuelAmount > 0) {
            return `${rItem.text}\n${getLocale('addOil')} ${fuelAmount}${serie.unit}`;
          }
          if (fuelSpill > 0) {
            return `${rItem.text}\n${getLocale('reduceOil')} ${fuelSpill}${serie.unit}`;
          }
          return `${getLocale('leftOil')} ${rItem.text}`;
        },
        unit: 'L',
        yMinValue: 0,
        yMaxValue: maxValue,
      }];
      if (oilData.length > 0) {
        // 用油量 = 曲线第一个点油量 + 所有加油量 – 所有漏油量 – 曲线最后一个点油量
        const firstOil = oilData[0].getIn(['oilTank', attachIndex]);
        const lastOil = oilData[oilData.length - 1].getIn(['oilTank', attachIndex]);
        let useOil = firstOil - lastOil;

        if (firstOil === null || firstOil === undefined
          || lastOil === null || lastOil === undefined) {
          useOil = 0;
        }

        totalUseOil = useOil + totalAddOil - totalReduceOil;
      }
      const newSvgData = {
        totalAddOil,
        totalReduceOil,
        totalUseOil,
        series,
      };
      this.data.prevData = rawData;
      this.data.prevIndex = attachIndex;
      this.data.svgData = newSvgData;
      return newSvgData;
    }
    return svgData;
  }

  handleAttachChange = (item, index) => {
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
      totalAddOil, totalReduceOil, totalUseOil, series,
    } = svgData;

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
              // rectWidth={60}
              // rectHeight={22}
              uniqueKey={uniqueKeyAttach}
              key={`oilDataChart${attachIndex.toString()}`}
            />

          </View>
          <View style={styles.selector}>
            <ScrollView>
              {
                !isEmpty(attachList) ? attachList.filter(x => oilTankName[x]).map((item, index) => (
                  <Text
                    style={[styles.selectorText, index === attachIndex ? styles.activeText : null]}
                    onPress={() => { this.handleAttachChange(item, index); }}
                  >
                    {oilTankName[item]}
                  </Text>
                )) : null
              }
            </ScrollView>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {getLocale('addOil')}
            <Text style={styles.titleActive}> {toFixed(totalAddOil, 1, true) < 0 ? '--' : toFixed(totalAddOil, 1, true)} </Text>
            <Text style={styles.titleUnit}>L</Text>
          </Text>
          <Text style={styles.title}>
            {getLocale('reduceOil')}
            <Text style={styles.titleActive}> {toFixed(totalReduceOil, 1, true) < 0 ? '--' : toFixed(totalReduceOil, 1, true)} </Text>
            <Text style={styles.titleUnit}>L</Text>
          </Text>
          <Text style={styles.title}>
            {getLocale('useOil')}
            <Text style={styles.titleActive}> {toFixed(totalUseOil, 1, true) < 0 ? '--' : toFixed(totalUseOil, 1, true)} </Text>
            <Text style={styles.titleUnit}>L</Text>
          </Text>
        </View>
      </View>
    );
  }
}

export default ChartOilData;