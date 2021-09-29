import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import Svg, {
  Text, Rect, Polyline, Line,
} from 'react-native-svg';
import PropTypes from 'prop-types';
import { is } from 'immutable';

const styles = StyleSheet.create({
  svgStyle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default class LineChartPaths extends Component {
    static propTypes = {
      grayColorRect: PropTypes.object.isRequired,
      outlinePoints: PropTypes.oneOfType([PropTypes.array, PropTypes.string]).isRequired,
      tickPoints: PropTypes.array.isRequired,
      textPoints: PropTypes.array.isRequired,
      greenRects: PropTypes.array.isRequired,
      axisFontSize: PropTypes.number.isRequired, // 坐标轴字体大小
      axisColor: PropTypes.string.isRequired, // 坐标轴文字颜色
      tickColor: PropTypes.string.isRequired, // 坐标轴文字颜色
      uniqueKey: PropTypes.string.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
    }

    shouldComponentUpdate(nextProps, nextState) {
      return !is(this.props, nextProps) || !is(this.state, nextState);
    }

    render() {
      const {
        grayColorRect,
        outlinePoints,
        tickPoints,
        textPoints,
        greenRects,
        tickColor,
        axisFontSize,
        axisColor,
        height,
        width,
        uniqueKey,
      } = this.props;

      if (!tickPoints || tickPoints.length === 0) {
        return null;
      }

      return (
        <Svg
          style={[
            styles.svgStyle,
            {
              height,
              width,
              zIndex: 1,
            },
          ]}
          key={uniqueKey}
        >
          <Rect
            x={grayColorRect.x.toString()}
            y={grayColorRect.y.toString()}
            width={grayColorRect.width.toString()}
            height={grayColorRect.height.toString()}
            fill="#e0e0e0"
          />
          {
          greenRects.map(x => (
            <Rect
              x={x.x.toString()}
              y={x.y.toString()}
              width={x.width.toString()}
              height={x.height.toString()}
              fill="#d4f1c0"
            />
          ))
        }
          <Polyline
            points={outlinePoints}
            fill="none"
            stroke={tickColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {
          tickPoints.map(x => (
            <Line
              x1={x.x1}
              y1={x.y1}
              x2={x.x2}
              y2={x.y2}
              stroke={tickColor}
              strokeWidth="1"
            />
          ))
        }
          {
          textPoints.map(x => (
            <Text
              fill={axisColor}
              fontSize={axisFontSize}
              x={x.x}
              y={x.y + axisFontSize + 3}
              textAnchor="middle"
            >
              {x.text}
            </Text>
          ))
        }

        </Svg>
      );
    }
}