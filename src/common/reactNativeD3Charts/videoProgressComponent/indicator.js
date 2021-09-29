import React, { Component } from 'react';
import {
  Line, G, Text, Rect, Circle,
} from 'react-native-svg';
import PropTypes from 'prop-types';

export default class LineChartIndicator extends Component {
    static propTypes = {
      currentPosition: PropTypes.number.isRequired,
      splitLineY: PropTypes.number.isRequired,
      circleRadius: PropTypes.number.isRequired,
      tickColor: PropTypes.string.isRequired,
      axisColor: PropTypes.string.isRequired,
      axisFontSize: PropTypes.number.isRequired,
      blueBgX: PropTypes.number.isRequired,
      blueBgWidth: PropTypes.number.isRequired,
      currentTimeText: PropTypes.string.isRequired,
    }

    // shouldComponentUpdate(nextProps) {
    //   const { uniqueKey } = this.props;
    //   if (uniqueKey !== nextProps.uniqueKey) {
    //     return true;
    //   }
    //   return false;
    // }

    render() {
      const {
        currentPosition,
        splitLineY,
        circleRadius,
        tickColor,
        axisColor,
        blueBgX,
        blueBgWidth,
        axisFontSize,
        currentTimeText,
      } = this.props;


      return (
        <G>
          <Line
            x1={currentPosition}
            y1={splitLineY - 1 - circleRadius}
            x2={currentPosition}
            y2={splitLineY - 11 - circleRadius}
            stroke={tickColor}
            strokeWidth="1"
          />
          <Circle
            cx={currentPosition}
            cy={splitLineY - 1}
            r={circleRadius}
            fill="white"
            stroke={axisColor}
            strokeWidth="1"
          />
          <Rect
            x={blueBgX}
            y={splitLineY - 26 - circleRadius}
            width={blueBgWidth}
            height={18}
            rx={2}
            ry={2}
            fill="#26a3ff"
          />
          <Text
            fill={axisColor}
            fontSize={axisFontSize + 1}
            x={blueBgX + 10}
            y={splitLineY - 13 - circleRadius}
            textAnchor="start"
            key={currentPosition.toString()}
          >
            {currentTimeText}
          </Text>
        </G>
      );
    }
}