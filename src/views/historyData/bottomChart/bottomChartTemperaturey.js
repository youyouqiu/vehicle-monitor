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
import { toFixed } from '../../../utils/function';

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

const sensorName = {
  21: getLocale('sensor1'),
  22: getLocale('sensor2'),
  23: getLocale('sensor3'),
  24: getLocale('sensor4'),
  25: getLocale('sensor5'),
};

class ChartTemperaturey extends Component {
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
      const dataSize = rawData.get('mileage').size;
      const selfData = rawData.get('data');

      const nickname = selfData.get('nickname').toArray();
      let highestTemp = null;
      let lowestTemp = null;
      let series;

      if (selfData.has('temprature')) {
        const temprature = selfData.get('temprature').toArray();
        const line = [{
          value: parseFloat(selfData.getIn(['threshold', attachIndex, 'high'])),
          color: 'red',
        }, {
          value: parseFloat(selfData.getIn(['threshold', attachIndex, 'low'])),
          color: 'red',
        }];

        // if (dataSize > 0) {
        //   const firstValue = temprature[0].getIn(['sensors', attachIndex]);
        //   if (firstValue !== null) {
        //     highestTemp = firstValue;
        //     lowestTemp = firstValue;
        //   }
        // }
        const serieData = [];


        for (let i = 0; i < dataSize; i += 1) {
          const element = temprature[i];
          const value = element.getIn(['sensors', attachIndex]);

          const newElement = {
            index: i,
            date: new Date(element.get('time') * 1000),
            value,
            color: value !== null ? '#962219' : 'transparent',
          };
          serieData.push(newElement);

          if (value !== null) {
            if (highestTemp === null) {
              highestTemp = value;
              lowestTemp = value;
            } else {
              if (value >= highestTemp) {
                highestTemp = value;
              }
              if (value <= lowestTemp) {
                lowestTemp = value;
              }
            }
          }
        }
        series = [{
          data: serieData,
          width: 1,
          label: getLocale('tempText'),
          unit: '℃',
          yValueFunc: rItem => rItem.text,
          line,
          yMinValue: -55,
          yMaxValue: 125,
        }];
        highestTemp = highestTemp === null ? '--' : toFixed(highestTemp, 1, true);
        lowestTemp = lowestTemp === null ? '--' : toFixed(lowestTemp, 1, true);
      } else {
        series = null;
        highestTemp = '--';
        lowestTemp = '--';
      }

      const newSvgData = {
        nickname,
        highestTemp,
        lowestTemp,
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
      playIndex, onDrag, onDragEnd, data, uniqueKey,
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
      nickname, highestTemp, lowestTemp, series,
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
                nickname.map((item, index) => (
                  <Text
                    style={[styles.selectorText, index === attachIndex ? styles.activeText : null]}
                    onPress={() => { this.handleAttachChange(item, index); }}
                  >
                    {sensorName[item]}
                  </Text>
                ))
            }
            </ScrollView>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {getLocale('highestTemp')}
            <Text style={styles.titleActive}> {highestTemp} </Text>
            <Text style={styles.titleUnit}>℃</Text>
          </Text>
          <Text style={styles.title}>
            {getLocale('lowestTemp')}
            <Text style={styles.titleActive}> {lowestTemp} </Text>
            <Text style={styles.titleUnit}>℃</Text>
          </Text>
        </View>
      </View>
    );
  }
}

export default ChartTemperaturey;