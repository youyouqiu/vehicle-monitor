import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import * as timeFormat from 'd3-time-format';
import PropTypes from 'prop-types';

const timeFormator = timeFormat.timeFormat('%m-%d %H:%M:%S');

// style
const styles = StyleSheet.create({
  container: {
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.7)',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  wraper:{
    flex:1,
    textAlign:'center',
    color: '#333333',
  },
  text: {
    marginRight: 15,
  },

});


export default class TopText extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    startTime: PropTypes.object.isRequired,
    endTime: PropTypes.object.isRequired,
  }

  shouldComponentUpdate(nextProps) {
    const { title, startTime, endTime } = this.props;
    if (title !== nextProps.title
      || startTime !== nextProps.startTime
      || endTime !== nextProps.endTime) {
      return true;
    }
    return false;
  }

  render() {
    const { title, startTime, endTime } = this.props;
    const startTimeStr = timeFormator(startTime);
    const endTimeStr = timeFormator(endTime);
    const titleStr = title.length > 8 ? `${title.substr(0, 8)}...` : title;

    return (
      <View style={styles.container}>
        <Text style={styles.wraper}>
          <Text style={styles.text}>{titleStr}&nbsp;&nbsp;&nbsp;</Text>
          <Text>{startTimeStr} ~ {endTimeStr}</Text>
        </Text>
      </View>
    );
  }
}