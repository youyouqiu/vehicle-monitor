import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  requireNativeComponent,
} from 'react-native';

class MarqueeLabel extends React.Component {
    static propTypes = {
      ...View.propTypes,
      text: PropTypes.string,
      scrollDuration: PropTypes.number, // 秒
      marqueeType: PropTypes.number, // ios
      fadeLength: PropTypes.number, // ios
      leadingBuffer: PropTypes.number, // ios
      trailingBuffer: PropTypes.number, // ios
      animationDelay: PropTypes.number, //
      isRepeat: PropTypes.bool, // android
      startPoint: PropTypes.number, // android
      direction: PropTypes.number, // androidios
      color: PropTypes.string,
      fontSize: PropTypes.number,
    };

    // 属性默认值
    static defaultProps = {
      text: '',
      scrollDuration: 10,
      color: '#9e9e9e',
      fontSize: 10,
      direction: 0,
      startPoint: 0,
      isRepeat: true,
      marqueeType: 2,
      fadeLength: 0,
      leadingBuffer: 0,
      trailingBuffer: 0,
      animationDelay: 0,
    };

    render() {
      const { children, ...props } = this.props;
      const nativeProps = Object.assign({}, props, { text: children });
      return (
        <RCTMarqueeLabel {...nativeProps} />
      );
    }
}

const RCTMarqueeLabel = requireNativeComponent('RCTMarqueeLabel', MarqueeLabel);
export default MarqueeLabel;
