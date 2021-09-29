import React from 'react';
import {
  View, YellowBox, StyleSheet,
} from 'react-native';
import { BarChart } from '../../common/reactNativeD3Charts';

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    flex: 1,
    backgroundColor: 'lightgray',
  },
});

YellowBox.ignoreWarnings(['Warning:']);
export default class AreaChartExample extends React.PureComponent {
  state={
    details: [],
    currentIndex: undefined,
  }

  handlePress=(index) => {
    this.setState({
      details: [
        { name: '01', value: 55551 },
        { name: '02', value: 25550 },
        { name: '03', value: 35551 },
        { name: '04', value: 45551 },
        { name: '05', value: 55550 },

      ],
      currentIndex: index,
    });
  }


  render() {
    const { details, currentIndex } = this.state;

    let data = [55555, 55555, 25555, 55555,
      55555, 55555, 55558, 55555, 55555, 25555, 55555, 55555, 55555, 55558, 55555];

    data = data.map(x => ({
      value: x,
      name: '渝DHA41734',
    }));

    return (
      <View style={styles.container}>
        <BarChart
          style={{ height: 200, backgroundColor: 'white' }}
          currentIndex={currentIndex}
          data={data}
          onPressBar={this.handlePress}
          detailData={details}
          unit="个"

        />
      </View>
    );
  }
}