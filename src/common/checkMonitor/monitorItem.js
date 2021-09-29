// 报警信息时间轴内容组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { is } from 'immutable';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { getLocale } from '../../utils/locales';

import vehicle from '../../static/image/wCar.png';
import people from '../../static/image/wPerson.png';
import thing from '../../static/image/wThing.png';

import isCheck from '../../static/image/check2.png';
import noCheck from '../../static/image/check.png';

const styles = StyleSheet.create({
  panel_head: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgb(244,247,250)',
    // paddingVertical: 10,
    paddingHorizontal: 10,
    paddingLeft: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    overflow: 'hidden',
  },
  panel_title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  img: {
    width: 18,
    height: 18,
    marginRight: 10,
    marginLeft: 15,
  },
  title_box: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex:1,
    fontSize: 15,
    color: '#333',
  },
  count: {
    fontSize: 15,
    color: '#6dcff6',
    marginLeft: 5,
  },
  noData: {
    fontSize: 14,
    color: '#666',
    paddingLeft: 55,
    paddingVertical: 12,
  },
  panel_check: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
});

class MonitorItem extends Component {
  static propTypes = {
    item: PropTypes.arrayOf(PropTypes.shape({
      brand: PropTypes.string,
      id: PropTypes.string,
      icon: PropTypes.string,
      type: PropTypes.number,
      check: PropTypes.bool,
    })).isRequired,
    checkItem: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      brand: '',
      type: 0,
      check: false,
    };
  }

  componentDidMount=() => {
    const { item } = this.props;
    if (Object.keys(item).length === 0) return;
    this.setState({
      brand: item.name,
      type: item.type,
      check: item.check,
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { item } = nextProps;
    if (Object.keys(item).length === 0) return;
    this.setState({
      brand: item.name,
      type: item.type,
      check: item.check,
    });
  }

  shouldComponentUpdate(nextProps) {
    return this.isPropsEqual(nextProps);
  }

  isPropsEqual=(nextProps) => {
    const { brand, check, type } = this.state;
    const { name: brand1, check: check1, type: type1 } = nextProps.item;
    if (brand !== brand1) return true;
    if (check !== check1) return true;
    if (type !== type1) return true;
    return false;
  }

  checkTap=() => {
    const { checkItem, item } = this.props;
    if (typeof checkItem === 'function') {
      checkItem('monitor', item.id, !item.check);
    }
  }

  // 转换监控对象图标
  getMonitorIcon=(type) => {
    let icon = '';
    switch (type) {
      case '0':
        icon = vehicle;
        break;
      case '1':
        icon = people;
        break;
      case '2':
        icon = thing;
        break;
      default:
        icon = vehicle;
        break;
    }
    return icon;
  }

  render() {
    const { brand, check, type } = this.state;
    return (
      <View>
        {brand === ''
          ? <Text style={styles.noData}>{getLocale('monitorEmpty')}</Text>
          : (
            <TouchableOpacity
              onPress={() => { this.checkTap(); }}
            >
              <View style={styles.panel_head}>
                <View style={styles.panel_title}>
                  <Image
                    source={this.getMonitorIcon(type)}
                    style={styles.img}
                  />
                  <View style={styles.title_box}>
                    <Text
                      style={styles.title}
                      numberOfLines={1}
                    >
                      {brand}
                    </Text>
                  </View>

                </View>
                <View style={styles.panel_check}>
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    source={check ? isCheck : noCheck}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )
        }
      </View>
    );
  }
}

export default MonitorItem;