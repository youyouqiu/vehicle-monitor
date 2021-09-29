// 报警信息时间轴标题组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Text,
  View,
  Image,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import * as timeFormat from 'd3-time-format';// 时间格式转换
import alarmIco from '../../../static/image/alarm.png';
import { getLocale } from '../../../utils/locales';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d');

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 50,
    marginRight: 10,
    backgroundColor: 'rgb(244,247,250)',
  },
  itemBox: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    // color: '#555',
    borderRadius: 4,
    alignItems: 'center',
    // justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  alarmDate: {
    width:95,
    marginRight: 15,
    fontSize: 16,
    color: 'rgb(60,60,60)',
  },
  alarmIcon: {
    width: 16,
    height: 16,
    marginTop: -3,
    marginRight: 2,
  },
  alarmNum: {
    width:150,
    fontSize: 14,
  },
  alarmNumBlod: {
    fontSize: 16,
  },
  // 时间轴左侧线条
  leftLine: {
    position: 'absolute',
    width: 1,
    left: 30,
    top: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'rgb(160,160,160)',
  },
  startLine: {
    top: 18,
  },
  endLine: {
    bottom: 32,
  },

  // 时间轴左侧小圆
  circle: {
    position: 'absolute',
    width: 11,
    height: 11,
    left: 25,
    top: 16,
    zIndex: 20,
    borderRadius: 11,
    backgroundColor: 'rgb(170,170,170)',
  },
});

class AlarmInfoHeader extends Component {
  static propTypes = {
    // item: PropTypes.objectOf({
    //   date: PropTypes.string,
    //   alarmCount: PropTypes.number,
    // }).isRequired,
    item: PropTypes.any.isRequired,
    tapFun: PropTypes.func.isRequired,
    isActive: PropTypes.bool.isRequired,
    index: PropTypes.object.isRequired,
    time: PropTypes.number.isRequired,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  tapItem=() => {
    const { tapFun, index, time } = this.props;
    if (typeof tapFun === 'function') {
      tapFun(index.curIndex, timeFormator(time));
    }
  }

  render() {
    const { item, isActive, index } = this.props;
    const startStyle = (index.curIndex === 0 ? styles.startLine : null);
    const endStyle = ((index.curIndex === index.allLen && !isActive) ? styles.endLine : null);
    return (
      <View style={styles.wrapper}>
        {
          index.allLen === 0 && !isActive ? null
            : <View style={[styles.leftLine, startStyle, endStyle]} />
        }
        <View
          style={[styles.circle, (isActive ? { backgroundColor: 'rgb(248,70,70)' } : '')]}
        />
        <View>
          <TouchableOpacity
            style={styles.itemBox}
            activeOpacity={0.6}
            onPress={() => { this.tapItem(); }}
          >
            <Text style={{width:100,alignItems:'flex-start'}}>
            <Text style={styles.alarmDate}>
              {timeFormator(item.date)}
            </Text>
            </Text>
            <Image
              source={alarmIco}
              resizeMode="contain"
              style={styles.alarmIcon}
            />
            <Text style={{flex:1,alignItems:'flex-start'}}>
            <Text
              style={styles.alarmNum}
            >
              <Text style={styles.alarmNumBlod}>
                {item.alarmCount}
              </Text>
              {getLocale('alarmCountTxt')}
            </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default AlarmInfoHeader;