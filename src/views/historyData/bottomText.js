import React, { Component } from 'react';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';
import * as timeFormat from 'd3-time-format';
import { getLocale } from '../../utils/locales';

const timeFormator = timeFormat.timeFormat('%m-%d %H:%M:%S');
const styles = StyleSheet.create({

  textContainer: {
    display:'flex',
    flex:1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer2: {
    display:'flex',
    flex:1,
    flexDirection: 'row',
    color: '#333333',
    height: 22,
    fontSize: 12,
  },
  text: {
    flex:1,
    color: '#333333',
    height: 22,
    fontSize: 12,
  },
  text1:{
    // width:120,
  },
  text2:{
    // width:120,
    textAlign:'center'
  },
  text3:{
    // width:120,
    textAlign:'right'
  },
  text4:{
    width:330,
  },
  speedText: {
    fontSize: 14,
    color: '#2a8be9',
  },
  unit: {
    fontStyle: 'italic',
  },
});

class BottomText extends Component {
    static propTypes = {
      locationInfo: PropTypes.object,
      startMileage: PropTypes.number,
      endMileage: PropTypes.number,
      stopAddress: PropTypes.string.isRequired,
    }

    static defaultProps={
      locationInfo: {},
      startMileage: 0,
      endMileage: 0,
    }

    shouldComponentUpdate(nextProps, nextState) {
      return !is(this.props, nextProps) || !is(this.state, nextState);
    }

    render() {
      const {
        locationInfo,
        startMileage,
        endMileage,
        stopAddress,
      } = this.props;
      let time = '';
      let speed = 0;
      let address = '';

      if (locationInfo !== null) {
        const now = new Date();
        // now.setTime(locationInfo.get('time') * 1000);
        now.setTime((locationInfo.time || locationInfo.get('time')) * 1000);
        time = timeFormator(now);
        // speed = locationInfo.get('speed');
        speed = locationInfo.speed || locationInfo.get('speed');
        address = stopAddress;
      }
      speed = `${speed}`;
      return (
        <View>
          <View style={styles.textContainer}>
            <View style={[styles.text]}>
              <Text>
                {time}
              </Text>
            </View>
            <View style={styles.text}>
            <Text style={styles.text2}>
              <Text style={styles.speedText}>
                {speed}
              </Text>
              <Text style={styles.unit}>
                {' km/h'}
              </Text>
            </Text>
            </View>
            <View style={styles.text}>
              <Text style={styles.text3}>
              <Text style={styles.speedText}>
                {startMileage}
              </Text>
              <Text>/</Text>
              <Text style={styles.speedText}>
                {endMileage}
              </Text>
              <Text style={styles.unit}>
                {' km'}
              </Text>
              </Text>
            </View>
          </View>
          <View style={styles.textContainer2}>
            <Text style={{ width: 45 }}>
              {getLocale('location')}：
            </Text>
            <ScrollView horizontal style={{flex:1}}>
              <View style={{flex:1}}>
                <Text>
                  {address}
                </Text>

              </View>
            </ScrollView>
          </View>

        </View>
      );
    }
}

export default BottomText;