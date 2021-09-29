import React from 'react';
import {
  View, Text, YellowBox, StyleSheet,
} from 'react-native';
import { LineChart } from '../../common/reactNativeD3Charts';

const styles = StyleSheet.create({
  timeContainer: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: 'white',
    paddingRight: 5,
    marginTop: 50,
    marginBottom: 50,
  },
  dateContainer: {
    flex: 5,
  },
  customContainer: {
    flex: 1,
  },
  swiper: {
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  swiperItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateItem: {
    width: '20%',
    padding: 2,
  },
  date: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: '#f5f5f5',
  },
  itemText: {
    color: '#333333',
  },
  today: {
    backgroundColor: '#d7f3ff',
  },
  active: {
    backgroundColor: '#33bbff',
    borderWidth: 0,
  },
  activeText: {
    color: 'white',
  },
  custom: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    marginLeft: 2,
  },
  itemContaier: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

YellowBox.ignoreWarnings(['Warning:']);
export default class AreaChartExample extends React.PureComponent {
  state={
    xValue: '',
  }

  handleOnDrag = (data) => {
    this.setState({
      xValue: JSON.stringify(data.xValue),
    });
  }

  handleOnDragEnd = (data) => {
    this.setState({
      xValueOnEnd: JSON.stringify(data.xValue),
    });
  }

  render() {
    const { xValue, xValueOnEnd } = this.state;
    const series = [
      {
        data: [
          { index: 0, date: new Date(2007, 4, 1, 1, 34, 55), value: 23.24 },
          { index: 1, date: new Date(2007, 4, 1, 2, 34, 55), value: 95.35 },
          { index: 2, date: new Date(2007, 4, 1, 3, 34, 55), value: 48.84 },
          { index: 3, date: new Date(2007, 4, 1, 4, 34, 55), value: 111.92 },
          { index: 4, date: new Date(2007, 4, 1, 5, 34, 55), value: 19.80 },
          { index: 5, date: new Date(2007, 4, 1, 8, 34, 55), value: 99.47 },
        ],
        color: 'skyblue',
        width: 1,
        label: '温度',
        unit: '℃',
        dotts: [{
          value: 1,
          color: 'red',
        }, {
          value: 4,
          color: 'blue',
        }],
      },
      {
        data: [
          { index: 0, date: new Date(2007, 4, 1, 1, 4, 55), value: 13.24 },
          { index: 1, date: new Date(2007, 4, 1, 2, 4, 55), value: 112.24 },
          { index: 2, date: new Date(2007, 4, 1, 3, 4, 55), value: 31.24 },
          { index: 3, date: new Date(2007, 4, 1, 4, 9, 55), value: 83.24 },
          { index: 4, date: new Date(2007, 4, 1, 5, 34, 55), value: 35.35 },
          { index: 5, date: new Date(2007, 4, 1, 6, 24, 55), value: 198.84 },
          { index: 5, date: new Date(2007, 4, 1, 7, 34, 55), value: 99.92 },
          { index: 6, date: new Date(2007, 4, 1, 8, 34, 55), value: 69.80 },
          { index: 7, date: new Date(2007, 4, 1, 9, 34, 55), value: 199.47 },
        ],
        color: 'red',
        width: 1,
        label: '湿度',
        unit: '%',
        line: [{
          value: 25,
          color: 'darkgreen',
        }, {
          value: 150,
          color: 'darkred',
        }],
      },
    ];

    const seriesBreak = [
      {
        data: [
          {
            index: 0, date: new Date(2007, 4, 1, 1, 34, 55), value: null, color: 'transparent',
          },
          {
            index: 1, date: null, value: null, color: 'transparent',
          },
          {
            index: 2, date: null, value: null, color: 'transparent',
          },
          {
            index: 3, date: new Date(2007, 4, 1, 4, 34, 55), value: 111.92, color: '#0000ff',
          },
          {
            index: 4, date: new Date(2007, 4, 1, 5, 34, 55), value: 95.35, color: '#0000ff',
          },
          {
            index: 5, date: new Date(2007, 4, 1, 6, 34, 55), value: 48.84, color: '#0000ff',
          },
          {
            index: 6, date: new Date(2007, 4, 1, 7, 34, 55), value: 111.92, color: '#ff0000',
          },
          {
            index: 7, date: new Date(2007, 4, 1, 8, 34, 55), value: 19.80, color: '#ff0000',
          },
          {
            index: 8, date: new Date(2007, 4, 1, 9, 34, 55), value: 99.47, color: '#ff0000',
          },
        ],
        color: 'skyblue',
        width: 1,
        label: '温度',
        unit: '℃',
        autoConnectPartition: 'NONE',
      },
      {
        data: [
          {
            index: 0, date: new Date(2007, 4, 1, 1, 4, 55), value: null, color: 'transparent',
          },
          {
            index: 1, date: null, value: null, color: 'transparent',
          },
          {
            index: 2, date: new Date(2007, 4, 1, 3, 4, 55), value: null, color: 'transparent',
          },
          {
            index: 3, date: new Date(2007, 4, 1, 4, 4, 55), value: 111.92, color: 'yellow',
          },
          {
            index: 4, date: new Date(2007, 4, 1, 5, 4, 55), value: 95.35, color: 'blue',
          },
          {
            index: 5, date: new Date(2007, 4, 1, 6, 4, 55), value: 48.84, color: 'blue',
          },
          {
            index: 6, date: new Date(2007, 4, 1, 7, 4, 55), value: 111.92, color: 'green',
          },
          {
            index: 7, date: new Date(2007, 4, 1, 8, 4, 55), value: 19.80, color: 'green',
          },
          {
            index: 8, date: new Date(2007, 4, 1, 9, 4, 55), value: 99.47, color: 'green',
          },
        ],
        color: 'skyblue',
        width: 3,
        label: '里程',
        unit: 'KM',
        autoConnectPartition: 'BEFORE',
        dotts: [
          { value: 3, color: 'red' },
          { value: 6, color: 'blue' },
        ],
      },
    ];

    return (
      <View>
        <View style={styles.timeContainer}>
          <View style={styles.customContainer}>
            <View style={[styles.custom, styles.active]}>
              <Text style={[styles.itemText, styles.activeText]}>自定义</Text>
              <Text style={styles.itemText}>{'时间 >'}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.itemText}>
          折线图
        </Text>

        <View>
          <LineChart
            data={series}
            yMinValue={0}
            yMaxValue={200}
            style={{ height: 200, backgroundColor: 'white' }}
            onDrag={this.handleOnDrag}
            onDragEnd={this.handleOnDragEnd}
            snap
            playIndex={0}
          />

        </View>
        <Text style={styles.itemText}>
          拖动时的时间：
          {xValue}
        </Text>
        <Text style={styles.itemText}>
          拖动结束时的时间：
          {xValueOnEnd}
        </Text>
        <View>
          <LineChart
            data={seriesBreak}
            yMinValue={0}
            yMaxValue={200}
            style={{ height: 200, backgroundColor: 'white' }}
            snap
            playIndex={0}
          />

        </View>
      </View>
    );
  }
}