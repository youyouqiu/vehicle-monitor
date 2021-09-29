import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import PropTypes from 'prop-types';
import { go, back, getMonitor } from '../../utils/routeCondition';
import { requestConfig } from '../../utils/env';
import { isEmpty } from '../../utils/function';
import { toastShow } from '../../utils/toastUtils';
import { getLocale } from '../../utils/locales';
import wHome from '../../static/image/toolHome.png';
import wShare from '../../static/image/toolShare.png';
import Monitor from './componentMonitor';

const httpBaseConfig = requestConfig();

// style
const styles = StyleSheet.create({
  toolBottom: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  icon: {
    width: 25,
    height: 20,
  },
});

class ToolBottom extends Component {
  static propTypes = {
    monitors: PropTypes.object, // 监控对象数组
    onChange: PropTypes.func,
    activeMonitor: PropTypes.object,
  }

  static defaultProps = {
    monitors: null,
    onChange: null,
    activeMonitor: null,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  handleOnChange=(item, index) => {
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange(item, index);
    }
  }

  handleJump=(key) => {
    const activeMonitor = getMonitor();
    if (key !== 'home') {
      if (isEmpty(activeMonitor)) {
        toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
        return;
      }
    }
    go(key, { activeMonitor });
  }

  render() {
    const { monitors, activeMonitor } = this.props;

    if (monitors == null) {
      return null;
    }
    return (
      <View style={styles.toolBottom}>
        <TouchableOpacity
          hitSlop={{
            top: 20, bottom: 20, left: 22, right: 25,
          }}
          onPress={() => this.handleJump(httpBaseConfig.ledBillboardState ? 'ledBillboard' : 'home')}
        >
          <Image
            source={wHome}
            style={styles.icon}
          />
        </TouchableOpacity>

        <Monitor monitors={monitors} activeMonitor={activeMonitor} onChange={this.handleOnChange} />

        <TouchableOpacity
          hitSlop={{
            top: 20, bottom: 20, left: 25, right: 22,
          }}
          onPress={() => {
            back(); // 返回上一页
          }}
        >
          <Image
            source={wShare}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

export default ToolBottom;