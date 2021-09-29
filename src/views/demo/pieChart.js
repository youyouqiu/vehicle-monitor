import React from 'react';
import {
  View, YellowBox, StyleSheet,
} from 'react-native';
import { PieChart } from '../../common/reactNativeD3Charts';

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    flex: 1,
    backgroundColor: 'white',
  },
});

YellowBox.ignoreWarnings(['Warning:']);
export default class AreaChartExample extends React.PureComponent {
  render() {
    // const data = [1, 20497111];
    // const color = ['red', 'green', 'purple', 'steelblue', 'blue'];
    /* eslint no-bitwise:off */
    // const randomColor = () =>
    // (`#${(Math.random() * 0xFFFFFF << 0).toString(16)}000000`).slice(0, 7);

    const pieData = [
      { label: '组合', svg: { fill: 'red' }, value: 75.5 },
      { label: '碰撞', svg: { fill: 'orange' }, value: 24.3 },
      { label: '异常', svg: { fill: 'green' }, value: 0 },
      { label: '分心', svg: { fill: 'blue' }, value: 0 },
      { label: '疲劳', svg: { fill: 'gray' }, value: 0 },
    ].sort((x1, x2) => x2.value - x1.value);

    return (
      <View style={styles.container}>
        <PieChart
          style={{ height: 300 }}
          data={pieData}
          title="所有事件"
          labelFormat="VALUE"
          labelColor="#333333"
          unit="个"
          replaceZero
        />
      </View>
    );
  }
}