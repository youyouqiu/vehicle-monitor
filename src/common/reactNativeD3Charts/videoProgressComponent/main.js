import * as scale from 'd3-scale';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View, PanResponder, StyleSheet, Dimensions,
} from 'react-native';
import Svg from 'react-native-svg';
import { throttle } from 'lodash';
import {
  second2Hms, padZero, obj2Second, second2HmsText, isEmpty,
} from '../../../utils/function';

import BgSvg from './bgSvg';
import Indicator from './indicator';

const styles = StyleSheet.create({
  svgStyle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

/**
 * 屏幕宽度
 */
const WINDOW_WIDTH = Dimensions.get('window').width;
/**
 * 五分钟对应多少秒
 */
const FIVE_MINUTE_SECONDS = 300;
/**
 * 一小时对应多少秒
 */
const HOUR_SECONDS = 3600;
/**
 * 一天对应多少秒
 */
const DAY_SECONDS = 86400;


export default class VideoProgress extends Component {
  static propTypes = {
    style: PropTypes.object.isRequired, // 样式
    width: PropTypes.number,
    height: PropTypes.number,
    padding: PropTypes.object, // 内边距
    timeType: PropTypes.string, // 24小时还是1小时制
    data: PropTypes.object.isRequired, // 序列
    axisFontSize: PropTypes.number, // 坐标轴字体大小
    axisColor: PropTypes.string, // 坐标轴文字颜色
    tickColor: PropTypes.string, // 坐标轴文字颜色
    startTime: PropTypes.number, // 时间制是1小时的时候，开始时间
    endTime: PropTypes.number, // 时间制是1小时的时候，结束时间
    currentTime: PropTypes.number, // 当前播放的时间
    circleRadius: PropTypes.number, // 圆圈半径
    splitLineY: PropTypes.number, // 上下拆分位置
    colorHeight: PropTypes.number, // 颜色区域高度
    blueBgWidth: PropTypes.number, // 当前时间蓝色背景条宽度
    onDrag: PropTypes.func, // 拖拽时并且有数据点触发
    onDragEnd: PropTypes.func, // 拖拽结束时触发
  }

  static defaultProps = {
    width: WINDOW_WIDTH,
    height: 75,
    padding: {
      top: 30,
      bottom: 20,
      left: 15,
      right: 15,
    },
    timeType: '24',
    axisFontSize: 11,
    axisColor: '#333',
    tickColor: '#a1a1a1',
    startTime: null,
    endTime: null,
    currentTime: null,
    circleRadius: 8,
    splitLineY: 35,
    colorHeight: 16,
    blueBgWidth: 66,
    onDrag: null,
    onDragEnd: null,
  }

  constructor(props) {
    super(props);
    this.configPanResponder();
    this.throttleMove = throttle(this.handleOnDrag, 50);

    const {
      data, currentTime, timeType, startTime, endTime,
    } = props;
    const stateData = this.analyzeData(data, timeType, startTime, endTime);
    this.state = { ...this.state, ...stateData };
    const { xScale, minX } = stateData;
    const currentPosition = this.getPositionByTime(currentTime, xScale, minX);
    this.state.currentTime = currentTime;
    this.state.currentPosition = currentPosition;
  }

  data = {
    originalTime: null, // 拖动开始时的时间，如果拖动结束时，指针所属区域没有视频，则还原于此
    originalPosition: null,
    isDragging: false, // 是否在拖动中
  }

  state = {
    xScale: null,
    grayColorRect: null,
    outlinePoints: null,
    tickPoints: null,
    textPoints: null,
    greenRects: null,
    minX: null,
    maxX: null,
    currentTime: null,
    currentPosition: null,
    minSecond: null,
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { currentTime: prevTime, data: prevData, timeType: prevTimeType } = this.props;
    const {
      currentTime, data, timeType, startTime, endTime,
    } = nextProps;

    let newState = {};
    let { xScale, minX } = this.state;

    if (!is(data, prevData) || !is(timeType, prevTimeType)) {
      const stateData = this.analyzeData(data, timeType, startTime, endTime);
      newState = { ...stateData };
      ({ xScale } = newState);
      ({ minX } = newState);
    }

    if (
      (currentTime !== prevTime && this.data.isDragging === false)
      || !is(timeType, prevTimeType)
    ) {
      const currentPosition = this.getPositionByTime(currentTime, xScale, minX);
      newState = {
        currentTime,
        currentPosition,
        ...newState,
      };
    }
    this.setState(newState);
  }

  /**
   * 配置手势检测
   */
  configPanResponder = () => {
    this.panResponderObj = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        const { currentTime, currentPosition } = this.state;
        this.data.originalTime = currentTime;
        this.data.originalPosition = currentPosition;
        const { x0 } = gestureState;
        this.handleOnDrag(x0);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX } = gestureState;
        this.throttleMove(moveX);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { moveX, x0 } = gestureState;
        setTimeout(() => {
          this.handleOnDragEnd(moveX || x0);
        }, 60);
      },
      onPanResponderTerminate: () => {

      },
      onShouldBlockNativeResponder: () => true
      ,
    });
  }

  /**
   * 处理用户拖拽指示线的操作，更新指示线位置，并当指示线移动到有对应的数据点时触发 OnDrag 方法
   * 当所有序列任意有一条返回对应y值时判定为有对应数据点
   * @param {number} x 距离屏幕左侧的距离
   */
  handleOnDrag = (x) => {
    this.data.isDragging = true;
    const { padding: { left, right }, onDrag, width } = this.props;
    const { xScale } = this.state;

    let newX1 = Math.max(x, left);
    newX1 = Math.min(newX1, width - right);
    const newTime = parseInt(xScale.invert(newX1), 10);

    this.setState({
      currentTime: newTime,
      currentPosition: newX1,
    });

    if (typeof onDrag === 'function') {
      onDrag({
        currentTime: newTime,
        currentPosition: newX1,
      });
    }
  }

  /**
   * 处理用户拖拽指示线结束的操作，更新指示线位置，并当指示线移动到有对应的数据点时触发 OnDragEnd 方法
   * 当所有序列任意有一条返回对应y值时判定为有对应数据点
   * @param {number} x 距离屏幕左侧的距离
   */
  handleOnDragEnd = (x) => {
    const {
      padding: { left, right }, onDragEnd, width, data,
    } = this.props;
    const { xScale } = this.state;

    let newX1 = Math.max(x, left);
    newX1 = Math.min(newX1, width - right);
    let newTime = parseInt(xScale.invert(newX1), 10);

    // 如果拖动结束时，指针所属区域没有视频，则还原于 data.originalTime
    let doesExist = false;
    if (!isEmpty(data)) {
      data.forEach((val) => {
        const startSecond = obj2Second(val.get('startTime'));
        const endSecond = obj2Second(val.get('endTime'));

        if (startSecond <= newTime && newTime <= endSecond) {
          doesExist = true;
          return false;
        }
        return true;
      });
    }
    if (!doesExist) {
      newTime = this.data.originalTime;
      newX1 = this.data.originalPosition;
    }

    this.setState({
      currentTime: newTime,
      currentPosition: newX1,
    });

    if (typeof onDragEnd === 'function' && doesExist) {
      onDragEnd({
        currentTime: newTime,
        currentPosition: newX1,
      });
    }
    this.data.isDragging = false;
  }

  second2Text = (timeType) => {
    if (timeType === '24') {
      return second => second2Hms(second).hour;
    }
    return (second) => {
      const hms = second2Hms(second);
      return `${padZero(hms.hour)}:${padZero(hms.minute)}`;
    };
  }

  analyzeData = (channelDataImmutable, timeType, startTime, endTime) => {
    const {
      width, padding, splitLineY, colorHeight,
    } = this.props;


    // 24 小时制和 1 小时制 使用的一些数据不一样

    const minSecond = timeType === '24' ? 0 : startTime;
    const maxSecond = timeType === '24' ? DAY_SECONDS : endTime;

    const step = timeType === '24' ? HOUR_SECONDS : FIVE_MINUTE_SECONDS;
    const second2TextHandler = this.second2Text(timeType);

    // 比例尺
    const xScale = scale.scaleLinear()
      .domain([minSecond, maxSecond])
      .range([0 + padding.left, width - padding.right]);

    const minX = xScale(minSecond);
    const maxX = xScale(maxSecond);

    // 打底灰色背景
    const grayColorRect = {
      x: minX,
      y: splitLineY,
      width: maxX - minX,
      height: colorHeight,
    };
    // 深灰色外边框坐标值
    const outlinePoints = [
      `${minX},${splitLineY + colorHeight}`,
      `${minX},${splitLineY - 1}`,
      `${maxX},${splitLineY - 1}`,
      `${maxX},${splitLineY + colorHeight}`,
    ].join(' ');
    // 刻度坐标值
    const tickPoints = [];
    // 时间文字坐标值及文本
    const textPoints = [];
    for (let s = minSecond; s <= maxSecond || s === DAY_SECONDS; s += step) {
      const x = xScale(s);
      tickPoints.push({
        x1: x,
        x2: x,
        y1: splitLineY,
        y2: splitLineY + colorHeight,
      });
      textPoints.push({
        x,
        y: splitLineY + colorHeight,
        text: second2TextHandler(s),
      });
    }
    // 绿色区域
    const greenRects = [];

    if (!isEmpty(channelDataImmutable)) {
      const channelData = channelDataImmutable.toJS();
      for (let i = 0; i < channelData.length; i += 1) {
        let startSecond = obj2Second(channelData[i].startTime);
        let endSecond = obj2Second(channelData[i].endTime);

        if (startSecond <= maxSecond && endSecond >= minSecond) {
          if (startSecond < minSecond) {
            startSecond = minSecond;
          }
          if (endSecond > maxSecond) {
            endSecond = maxSecond;
          }

          const startPoint = xScale(startSecond);
          const endPoint = xScale(endSecond);
          greenRects.push({
            x: startPoint,
            y: splitLineY,
            width: endPoint - startPoint,
            height: colorHeight,
          });
        }
      }
    }

    return {
      xScale,
      grayColorRect,
      outlinePoints,
      tickPoints,
      textPoints,
      greenRects,
      minX,
      maxX,
      minSecond,
    };
  }

  getPositionByTime=(currentTime, xScale, minX) => {
    if (currentTime === null) {
      return minX;
    }
    const position = xScale(currentTime);
    return position;
  }

  render() {
    const {
      style,
      width,
      height,
      axisColor,
      axisFontSize,
      tickColor,
      circleRadius,
      splitLineY,
      blueBgWidth,
    } = this.props;


    const {
      grayColorRect,
      outlinePoints,
      tickPoints,
      textPoints,
      greenRects,
      currentTime,
      currentPosition,
      minX,
      maxX,
      minSecond,
    } = this.state;

    // if (isEmpty(data)) {
    //   return (
    //     <View style={style} />
    //   );
    // }

    const currentTimeText = second2HmsText(isEmpty(currentTime) ? minSecond : currentTime);
    const halfBlueBgWidth = blueBgWidth / 2.0;
    let blueBgX = currentPosition - halfBlueBgWidth;
    if (currentPosition - (halfBlueBgWidth) < minX) {
      blueBgX = minX - 1;
    }
    if (currentPosition + (halfBlueBgWidth) > maxX) {
      blueBgX = maxX - blueBgWidth + 1;
    }

    return (
      <View style={style} {...this.panResponderObj.panHandlers}>
        <View style={{ flex: 1 }}>
          <BgSvg
            grayColorRect={grayColorRect}
            outlinePoints={outlinePoints}
            tickPoints={tickPoints}
            textPoints={textPoints}
            greenRects={greenRects}
            tickColor={tickColor}
            axisFontSize={axisFontSize}
            axisColor={axisColor}
            height={height}
            width={width}
          />
          <Svg
            style={[
              styles.svgStyle,
              {
                height, width, zIndex: 2,
              },
            ]}
          >
            <Indicator
              currentPosition={currentPosition}
              splitLineY={splitLineY}
              circleRadius={circleRadius}
              tickColor={tickColor}
              axisColor={axisColor}
              axisFontSize={axisFontSize}
              blueBgX={blueBgX}
              blueBgWidth={blueBgWidth}
              currentTimeText={currentTimeText}
            />
          </Svg>
        </View>
      </View>
    );
  }
}
