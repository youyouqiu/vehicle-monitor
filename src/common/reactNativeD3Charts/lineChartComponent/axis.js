import React, { Component } from 'react';
import {
  Path, Text, G,
} from 'react-native-svg';
import PropTypes from 'prop-types';

export default class LineChartAxis extends Component {
    static propTypes = {
      xAxis: PropTypes.string.isRequired,
      axisColor: PropTypes.string.isRequired,
      axisWidth: PropTypes.number.isRequired,
      xScale: PropTypes.func.isRequired,
      xMax: PropTypes.number.isRequired,
      yScale: PropTypes.array.isRequired,
      yMin: PropTypes.array.isRequired,
      axisFontSize: PropTypes.number.isRequired,
      xMaxText: PropTypes.string.isRequired,
      yAxis1: PropTypes.string.isRequired,
      xMin: PropTypes.number.isRequired,
      yMax: PropTypes.array.isRequired,
      data: PropTypes.array.isRequired,
      yAxis2: PropTypes.string,
      uniqueKey: PropTypes.string.isRequired,
    }

    static defaultProps={
      yAxis2: null,
    }

    shouldComponentUpdate(nextProps) {
      const { uniqueKey } = this.props;
      if (uniqueKey !== nextProps.uniqueKey) {
        return true;
      }
      return false;
    }

    render() {
      const {
        xAxis,
        axisColor,
        axisWidth,
        xScale,
        xMax,
        yScale,
        yMin,
        axisFontSize,
        xMaxText,
        yAxis1,
        xMin,
        yMax,
        data,
        yAxis2,

      } = this.props;

      return (
        <G>
          {/* 横轴 */}
          <Path
            d={xAxis}
            fill="none"
            stroke={axisColor}
            strokeWidth={axisWidth}
          />
          <Text
            dx={xScale(xMax) - 50}
            dy={yScale[0](yMin[0]) + 15}
            fill={axisColor}
            fontSize={axisFontSize - 1}
            letterSpacing="1"
            key={xScale(xMax) - 50}
          >
            {xMaxText}
          </Text>
          {/* 纵轴左边 */}
          <Path
            d={yAxis1}
            fill="none"
            stroke={axisColor}
            strokeWidth={axisWidth}
          />
          <Text
            dx={xScale(xMin) - 10}
            dy={yScale[0](yMax[0]) - 5}
            fill={axisColor}
            fontSize={axisFontSize}
          >
            {data[0].label}
          </Text>
          {/* 纵轴右边 */}
          {
            data.length === 2 && (
            <G>
              <Path
                d={yAxis2}
                fill="none"
                stroke={axisColor}
                strokeWidth={axisWidth}
              />
              <Text
                dx={xScale(xMax) - 15}
                dy={yScale[1](yMax[1]) - 5}
                fill={axisColor}
                fontSize={axisFontSize}
                key={xScale(xMax) - 15}
              >
                {data[1].label}
              </Text>
            </G>
            )
            }
        </G>
      );
    }
}