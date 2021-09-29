/**
 * 文字跑马灯组件
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Platform,
  PixelRatio,
} from 'react-native';
import MarqueeLabel from './marqueeLable';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  marqueeLabel: {
    backgroundColor: '#ffffff',
    width: '100%',
    height: 24,
  },
});

class MarqueeView extends Component {
  static propTypes = {
    dataSource: PropTypes.array.isRequired, // 轮播数据
  };

  shouldComponentUpdate(nextProps) {
    const { dataSource } = this.props;
    const { dataSource: nextSource } = nextProps;
    if (!dataSource || !dataSource[0] || !dataSource[0].value) {
      return true;
    }
    if (!nextSource || !nextSource[0] || !nextSource[0].value) {
      return true;
    }
    const text = dataSource[0].value;
    const nextText = nextSource[0].value;
    return text !== nextText;
  }

  render() {
    const { dataSource } = this.props;

    let fontSize = Platform.OS === 'android' ? 40 : 14;
    let text;
    if (!dataSource || !dataSource[0] || !dataSource[0].value) {
      text = '1';
    } else {
      text = dataSource[0].value;
    }

    const { length } = text;
    const duration = Math.round(length * 250.0 / 1000) || 10;// 按一个字250毫秒计算时长

    const pixelRatio = PixelRatio.get();// 设备像素密度
    if (Platform.OS === 'android' && pixelRatio <= 2) { // 用于解决部分机型跑马灯字体过大问题
      fontSize = Math.floor(40 * pixelRatio / 2.8);
    }

    return (
      <View
        style={styles.container}
      >
        <MarqueeLabel
          style={[styles.marqueeLabel]}
          scrollDuration={duration}
          color="#9e9e9e"
          fontSize={fontSize}
        >
          {text}
        </MarqueeLabel>
      </View>
    );
  }
}

export default MarqueeView;