import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

import PropTypes from 'prop-types';
import toolArrow from '../../static/image/upIcon.png';

// style
const styles = StyleSheet.create({
  toolTop: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  toolArrow: {
    width: 12,
    height: 12,
  },
  rotate: {
    transform: [
      { rotate: '180deg' },
    ],
  },
});

class ToolArrow extends Component {
  // 属性声明
  static propTypes ={
    isSlideUp: PropTypes.bool,
  };

  static defaultProps ={
    isSlideUp: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      translateValue: new Animated.Value(0),
      rotateValue: new Animated.Value(0),
    };
  }

  // componentDidMount() {
  //   this.loopSlide();
  // }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }


  // 箭头动画
  loopSlide=() => {
    const { translateValue } = this.state;

    Animated.sequence([
      Animated.timing(translateValue,
        {
          toValue: 1,
          duration: 480,
          easing: Easing.in(Easing.quad),
        }),

      Animated.timing(translateValue, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.quad),
      }),
    ]).start(() => this.loopSlide());
  }

  render() {
    const { isSlideUp } = this.props;
    // const { translateValue } = this.state;

    return (
      <View style={styles.toolTop}>
        <Animated.Image
          source={toolArrow}
          style={[styles.toolArrow, {
            transform: [
              {
                rotate: isSlideUp ? '180deg' : '0deg',
              },
            ],
          }]}
        />
      </View>
    );
  }
}

export default ToolArrow;