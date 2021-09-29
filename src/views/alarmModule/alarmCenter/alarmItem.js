// 报警中心报警对象信息列表组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as timeFormat from 'd3-time-format';
import { is } from 'immutable';
import {
  Text,
  View,
  TouchableHighlight,
  Image,
  StyleSheet,
} from 'react-native';
import { go } from '../../../utils/routeCondition';
// import storage from '../../../utils/storage';
import { getLocale } from '../../../utils/locales';

import vehicle from '../../../static/image/wCar.png';
import people from '../../../static/image/wPerson.png';
import thing from '../../../static/image/wThing.png';

const styles = StyleSheet.create({
  itemStyle: {
    marginBottom: 10,
    marginHorizontal: 10,
    padding: 10,
    paddingBottom: 15,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  itemTime: {
    marginBottom: 5,
    textAlign: 'center',
    color: 'rgb(154,158,161)',
  },
  itemLeftIcon: {
    position: 'absolute',
    top: 5,
    left: 20,
    width: 36,
    height: 36,
  },
  itemRight: {
    // height: 45,
    paddingLeft: 80,
  },
  topItem: {
    marginBottom: 4,
  },
  itemWeight: {
    paddingRight: 10,
    // lineHeight: 22,
    color: 'rgb(154,158,161)',
  },
  alarmName: {
    fontSize: 17,
    color: '#222',
  },
});

class AlarmItem extends Component {
  static propTypes = {
    // item: PropTypes.objectOf({
    //   id: PropTypes.string,
    //   name: PropTypes.string,
    //   type: PropTypes.string,
    // }).isRequired,
    item: PropTypes.any.isRequired,
    settingInfo: PropTypes.object.isRequired,
    hideMenu: PropTypes.func.isRequired,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 转换报警对象类型
  getAlarmType=(type) => {
    let alarmType = '';
    switch (type) {
      case '0':
        alarmType = vehicle;
        break;
      case '1':
        alarmType = people;
        break;
      case '2':
        alarmType = thing;
        break;
      default:
        alarmType = vehicle;
        break;
    }
    return alarmType;
  }

  // 跳转到报警信息界面
  goAlarmInfo= (id, name, settingInfo) => {
    const { hideMenu } = this.props;
    if (typeof hideMenu === 'function') {
      hideMenu();
    }
    go('alarmInfo', { curAlarmObj: { id, name, settingInfo } });
  }

  // 判断日期是否为今天或昨天
  nowOrYesterday(item) {
    const curTime = item.get('time');
    const date = (new Date());
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); // 今天凌晨
    const yestday = new Date(today - 24 * 3600 * 1000).getTime();
    const shortFormator = timeFormat.timeFormat('%H:%M:%S');
    if (curTime < today && yestday <= curTime) {
      return getLocale('alarmYesterday') + shortFormator(curTime);
    }
    if (new Date(curTime).toDateString() === new Date().toDateString()) {
      return getLocale('alarmToday') + shortFormator(curTime);
    }
    const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
    return timeFormator(curTime);
  }

  render() {
    const { item, settingInfo } = this.props;
    return (
      <TouchableHighlight
        key={item.get('id')}
        underlayColor="transparent"
        onPress={() => { this.goAlarmInfo(item.get('id'), item.get('name'), settingInfo); }}
      >
        <View style={styles.itemStyle}>
          <Text style={styles.itemTime}>
            {this.nowOrYesterday(item)}
          </Text>
          <View>
            <Image
              source={this.getAlarmType(item.get('type'))}
              resizeMode="contain"
              style={styles.itemLeftIcon}
            />
            <View style={styles.itemRight}>
              <Text numberOfLines={1} style={styles.topItem}>
                <Text style={[styles.itemWeight, styles.alarmName]}>
                  {item.get('name')}
                </Text>
              </Text>
              <Text numberOfLines={1}>
                <Text style={styles.itemWeight}>
                  {getLocale('alarmAddr')}
                  {item.get('address')}
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

export default AlarmItem;