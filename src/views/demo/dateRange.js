
import React, { Component } from 'react';
import {
  View, StyleSheet, YellowBox, Text, FlatList, Image, TouchableOpacity,
} from 'react-native';
import { range } from '../../utils/function';
import LeftIcon from '../../static/image/arrowgray1.png';
import RightIcon from '../../static/image/arrowgray2.png';

const yearWidth = 100;

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: 'white',
  },
  dateContainer: {
    flex: 5,
    borderWidth: 1,
    borderColor: 'red',
  },
  submitContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'green',
  },
  title: {
    borderWidth: 1,
    borderColor: 'blue',
    textAlign: 'center',
    color: 'gray',
  },
  yearMonthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 30,
  },
  yearContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'red',
  },
  yearList: {
    width: yearWidth,
    height: 20,

  },
  year: {
    width: yearWidth,
    height: 20,
    borderWidth: 1,
    borderColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 25,
  },
});

YellowBox.ignoreWarnings(['Warning:']);
class DateRange extends Component {
  static years = range(1970, 2100, 1);

  static months = range(1, 32, 1);

  state = {

  }

  renderYear=({ item: x }) => (
    <TouchableOpacity
      style={[styles.year]}
      onPress={() => { this.handleClick(x); }}
    >
      <Text style={styles.textItem} numberOfLines={2}>
        {x}
      </Text>
    </TouchableOpacity>
  )

  yearItemWidth=(data, index) => (
    { length: yearWidth, offset: yearWidth * index, index }
  )

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.dateContainer}>
          <Text style={styles.title}>请选择开始时间</Text>
          <View style={styles.yearMonthContainer}>
            <View style={styles.yearContainer}>
              <Image source={LeftIcon} style={styles.arrow} resizeMode="center" />
              <FlatList
                style={styles.yearList}
                pagingEnabled
                horizontal
                data={DateRange.years}
                getItemLayout={this.yearItemWidth}
                renderItem={this.renderYear}
              />
              <Image source={RightIcon} style={styles.arrow} resizeMode="center" />
            </View>
          </View>
        </View>
        <View style={styles.dateContainer} />
        <View style={styles.submitContainer} />
      </View>
    );
  }
}


export default DateRange;
