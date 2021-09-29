import React, { Component } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import * as timeFormat from 'd3-time-format';
import PropTypes from 'prop-types';
import { deepEqual } from '../../utils/function';

const timeFormator = timeFormat.timeFormat('%H:%M:%S');

// style
const styles = StyleSheet.create({
  container: {
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.7)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },

  text: {
    color: '#333333',

  },

});


export default class TopText extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    startTime: PropTypes.object.isRequired,
    stopAddress: PropTypes.string.isRequired,
  }

  state={}

  shouldComponentUpdate(nextProps, nextState) {
    const propsEqual = deepEqual(this.props, nextProps, ['title', 'startTime', 'stopAddress']);
    const stateEqual = deepEqual(this.state, nextState);

    return !propsEqual || !stateEqual;
  }

  scrollContChange=() => {
    this.scrollView.scrollToEnd();
  }

  render() {
    const { title, startTime, stopAddress } = this.props;
    const startTimeStr = timeFormator(startTime);
    const titleStr = title.length > 8 ? `${title.substr(0, 8)}...` : title;

    return (
      <View style={styles.container}>
        <Text style={[styles.text, { width: 100 }]}>{titleStr}</Text>
        <Text style={[styles.text, { width: 80 }]}>{startTimeStr}</Text>
        <ScrollView
          horizontal
          style={{ width: 100 }}
          onContentSizeChange={this.scrollContChange}
          ref={(view) => { this.scrollView = view; }}
        >
          <View>
            <Text
                  // allowFontScaling={false}
              style={styles.text}
            >
              {stopAddress}
            </Text>

          </View>
        </ScrollView>
      </View>
    );
  }
}