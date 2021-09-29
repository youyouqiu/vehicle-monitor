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
  26: getLocale('sensor1'),
  27: getLocale('sensor2'),
  28: getLocale('sensor3'),
  29: getLocale('sensor4'),
  '2A': getLocale('sensor5'),
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

      let series;
      const nickname = selfData.get('nickname').toArray();
      let highestHumi = null;
      let lowestHumi = null;


      if (selfData.has('humidity')) {
        const humidity = selfData.get('humidity').toArray();
        const line = [{
          value: selfData.getIn(['threshold', attachIndex, 'high']),
          color: 'red',
        }, {
          value: selfData.getIn(['threshold', attachIndex, 'low']),
          color: 'red',
        }];

        // if (dataSize > 0) {
        //   let firstValue = humidity[0].getIn(['sensors', attachIndex]);
        //   firstValue = firstValue === null ? 0 : firstValue;
        //   highestHumi = firstValue;
        //   lowestHumi = firstValue;
        // }
        const serieData = [];

        for (let i = 0; i < dataSize; i += 1) {
          const element = humidity[i];
          const value = element.getIn(['sensors', attachIndex]);

          const newElement = {
            index: i,
            date: new Date(element.get('time') * 1000),
            value,
            color: value !== null ? '#962219' : 'transparent',
          };
          serieData.push(newElement);

          if (value !== null) {
            if (highestHumi === null) {
              highestHumi = value;
              lowestHumi = value;
            } else if (value >= highestHumi) {
              highestHumi = value;
            } else {
              lowestHumi = value;
            }
          }
        }
        series = [{
          data: serieData,
          color: 'skyblue',
          width: 1,
          label: getLocale('humidityText'),
          unit: '%',
          yValueFunc: rItem => rItem.text,
          line,
          yMinValue: 0,
          yMaxValue: 100,
        }];

        highestHumi = highestHumi === null ? '--' : toFixed(highestHumi, 1, true);
        lowestHumi = lowestHumi === null ? '--' : toFixed(lowestHumi, 1, true);
      } else {
        series = null;
        highestHumi = '--';
        lowestHumi = '--';
      }


      const newSvgData = {
        nickname,
        highestHumi,
        lowestHumi,
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
      nickname, highestHumi, lowestHumi, series,
    } = svgData;

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
                  // rectWidth={60}
                  rectHeight={22}
                  uniqueKey={uniqueKeyAttach}
                  key={`humidityChart${attachIndex.toString()}`}
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
            {getLocale('highestHumi')}
            <Text style={styles.titleActive}> {highestHumi} </Text>
            <Text style={styles.titleUnit}>%</Text>
          </Text>
          <Text style={styles.title}>
            {getLocale('lowestHumi')}
            <Text style={styles.titleActive}> {lowestHumi} </Text>
            <Text style={styles.titleUnit}>%</Text>
          </Text>
        </View>
      </View>
    );
  }
}

export default ChartTemperaturey;