// 报警中心顶部显示报警数量组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Text,
  View,
  StyleSheet,
  Image,
} from 'react-native';
import { getLocale } from '../../../utils/locales';
import numBg from '../../../static/image/alarmNum.png';

const styles = StyleSheet.create({
  objWrapper: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#339eff',
  },
  objNumBox: {
    paddingVertical: 10,
  },
  numBg: {
    width: 180,
    height: 170,
    marginLeft: 10,
  },
  alarmNum: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objNum: {
    color: '#fff',
    fontSize: 60,
    textAlign: 'center',
  },
  objNumTitle: {
    fontSize: 14,
    paddingLeft: 10,
    color: '#fff',
    textAlign: 'center',
  },
});

class AlarmObjNum extends Component {
  static propTypes = {
    num: PropTypes.number.isRequired,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  setFont=(num) => {
    if (num < 100) {
      return { fontSize: 75 };
    }
    if (num >= 100) {
      return { fontSize: 65 };
    }
    return null;
  }

  render() {
    const { num, nowTime } = this.props;
    return (
      <View style={styles.objWrapper}>
        <View style={styles.objNumBox}>
          <Image
            source={numBg}
            resizeMode="contain"
            style={styles.numBg}
          />
          <View style={styles.alarmNum}>
            <Text style={[styles.objNum, this.setFont(num)]}>
              {num > 999 ? '999+' : num}
            </Text>
            <Text style={styles.objNumTitle}>
              {getLocale('alarmObjNum')}
            </Text>
            <Text style={[styles.objNumTitle, { fontSize: 12 }]}>
              {`截止时间_${nowTime}`}
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default AlarmObjNum;