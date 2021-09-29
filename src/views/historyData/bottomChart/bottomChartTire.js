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
  toFixed, isEmpty,
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


class ChartTire extends Component {
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
      const tire = data.sensorDataList.slice(0, dataSize);
      const { tireNum } = data;

      let highestTire = null;
      let lowestTire = null;
      let series;

      if (tire) {
        const line = [];
        if (data.heighPressure) {
          line.push({
            value: parseFloat(data.heighPressure),
            color: 'red',
          });
        }
        if (data.lowPressure) {
          line.push({
            value: parseFloat(data.lowPressure),
            color: 'red',
          });
        }

        const serieData = [];

        for (let i = 0; i < dataSize; i += 1) {
          const element = tire[i];
          const value = element.pressure[attachIndex];

          const newElement = {
            index: i,
            date: new Date(element.time * 1000),
            value,
            supply: element.supply,
            color: value !== null ? '#5fcc97' : 'transparent',
          };
          serieData.push(newElement);
        }

        let max = isEmpty(data.maxTirePressure) || isEmpty(data.maxTirePressure[attachIndex])
          ? 100
          : data.maxTirePressure[attachIndex];
        if (data.heighPressure > max) {
          max = data.heighPressure;
        }


        series = [{
          data: serieData,
          width: 1,
          label: `${getLocale('tirePressure')}`,
          unit: 'bar',
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
        highestTire = data.maxTirePressure[attachIndex] === null ? '--' : toFixed(data.maxTirePressure[attachIndex], 1, true);
        lowestTire = data.minTirePressure[attachIndex] === null ? '--' : toFixed(data.minTirePressure[attachIndex], 1, true);
      } else {
        series = null;
        highestTire = '--';
        lowestTire = '--';
      }


      const newSvgData = {
        highestTire,
        lowestTire,
        tireNum,
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
      highestTire,
      lowestTire,
      tireNum,
      series,
    } = svgData;

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
                !isEmpty(tireNum) ? tireNum.map((item, index) => (
                  <Text
                    style={[styles.selectorText, index === attachIndex ? styles.activeText : null]}
                    onPress={() => { this.handleAttachChange(item, index); }}
                  >
                    {`${item}#`}
                  </Text>
                )) : null
            }
            </ScrollView>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {getLocale('highestTire')}
            <Text style={styles.titleActive}> {highestTire} </Text>
            <Text style={styles.titleUnit}>{getLocale('bar')}</Text>
          </Text>
          <Text style={styles.title}>
            {getLocale('lowestTire')}
            <Text style={styles.titleActive}> {lowestTire} </Text>
            <Text style={styles.titleUnit}>{getLocale('bar')}</Text>
          </Text>

        </View>

      </View>
    );
  }
}

export default ChartTire;