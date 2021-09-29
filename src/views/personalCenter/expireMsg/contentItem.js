// 到期提醒内容组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Text,
  View,
  StyleSheet,
} from 'react-native';

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 50,
    paddingRight: 10,
  },
  // 时间轴左侧小圆
  circle: {
    position: 'absolute',
    width: 7,
    height: 7,
    left: 27,
    top: 19,
    zIndex: 1,
    borderRadius: 11,
    backgroundColor: '#cdcdcd',
  },
  // 时间轴左侧线条
  leftLine: {
    position: 'absolute',
    width: 1,
    left: 30,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgb(160,160,160)',
  },
  itemStyle: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textName: {
    flex: 1,
    fontSize: 14,
    color: 'rgb(86,86,86)',
    width: 80,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 190,
    justifyContent: 'flex-end',
  },
  textBox: {
    width: 85,
    textAlign: 'center',
  },
});

class ContentItem extends Component {
  static propTypes = {
    item: PropTypes.object,
  }

  static defaultProps = {
    item: null,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    const { item } = this.props;
    return (
      <View style={styles.wrapper}>
        <View style={styles.circle} />
        <View style={styles.leftLine} />
        <View style={styles.itemStyle}>
          <View>
            <Text numberOfLines={1} style={styles.textName}>{item.monitorName}</Text>
          </View>
          <View style={styles.textRow}>
            <Text style={styles.textBox}>{!item.startTime ? '-' : item.startTime}</Text>
            <Text style={{ marginRight: 5, marginLeft: 5 }}> ~ </Text>
            <Text style={styles.textBox}>{!item.endTime ? '-' : item.endTime}</Text>
          </View>
        </View>
      </View>
    );
  }
}

export default ContentItem;