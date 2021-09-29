import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import ToolSlider from './componentToolSlider';
import ToolBottom from './componentToolBottom';
import ToolArrow from './componentToolArrow';
// import { isEmpty } from '../../utils/function';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
  },
  slide: {
    height: 0,
  },
  slideUp: {
    height: 160,
  },
});

class Index extends Component {
  // 属性声明
  static propTypes = {
    initStatus: PropTypes.string, // 修改时的状态
    children: PropTypes.element, // 计入额外的自定义扩展组件
    arrowShow: PropTypes.bool, // 控制箭头显示隐藏
    isUp: PropTypes.bool, // 控制展开收起
    onCollapse: PropTypes.func, // 收起回调函数
    onExpand: PropTypes.func, // 展开回调函数
    activeMonitor: PropTypes.object,
    monitors: PropTypes.object, // 监控对象数组
    onChange: PropTypes.func,
    toggleSlideState: PropTypes.func,
  };

  // 属性默认值
  static defaultProps = {
    monitors: null,
    initStatus: null,
    children: null,
    activeMonitor: null,
    arrowShow: true,
    onCollapse: null,
    onExpand: null,
    onChange: null,
    isUp: null,
    toggleSlideState: null,
  }

  constructor(props) {
    super(props);
    this.state.slideUp = false;

    // const { activeMonitor, monitors } = this.props;
    // if (isEmpty(activeMonitor)) {
    //   if (!isEmpty(monitors)) {
    //     this.state.activeMonitor = activeMonitor;
    //   }
    // } else {
    //   this.state.activeMonitor = activeMonitor;
    // }
  }

  state = {
    slideUp: false,
    // activeMonitor: null,
  }

  data = {
    lastClickTime: null,
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { isUp } = nextProps;
    if (isUp !== null) {
      this.setState({
        slideUp: isUp,
      });
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    const { initStatus } = nextProps;
    if (initStatus === 'ing') {
      return false;
    }
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  toggleSlide = () => {
    const { lastClickTime } = this.data;

    const now = new Date();
    if (lastClickTime !== null) {
      const secondDiff = Math.round((now.getTime() - lastClickTime.getTime()));
      if (secondDiff < 300) {
        return;
      }
    }
    this.data.lastClickTime = now;

    const { slideUp } = this.state;
    const { onCollapse, onExpand, toggleSlideState } = this.props;
    const newState = !slideUp;
    if (newState === true && typeof onExpand === 'function') {
      onExpand();
    } else if (newState === false && typeof onCollapse === 'function') {
      onCollapse();
    }
    this.setState({ slideUp: newState });

    if (typeof toggleSlideState === 'function') {
      toggleSlideState(newState);
    }
  }

  handleOnChange = (item, index) => {
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange(item, index);
    }
    // this.setState({
    //   activeMonitor: item,
    // });
  }

  render () {
    const {
      children, arrowShow, monitors, activeMonitor,
    } = this.props;
    const { slideUp } = this.state;
    const isSlideUp = slideUp ? styles.slideUp : null;

    return (
      <View
        style={styles.container}
      >
        {
          arrowShow
            ? (
              <TouchableOpacity
                onPress={this.toggleSlide}
              >
                <ToolArrow
                  isSlideUp={isSlideUp}
                />
              </TouchableOpacity>
            )
            : null
        }

        {children}

        <Animatable.View
          duration={300}
          transition="height"
          style={[styles.slide, isSlideUp]}
        >
          <ToolSlider />
          <ToolBottom
            monitors={monitors}
            activeMonitor={activeMonitor}
            onChange={this.handleOnChange}
          />
        </Animatable.View>
        <View
          style={{
            width: '100%',
            height: 34,
            position: 'absolute',
            backgroundColor: '#ffffff',
            left: 0,
            bottom: -34,
            zIndex: 1,
          }}
        />
      </View>
    );
  }
}

export default Index;