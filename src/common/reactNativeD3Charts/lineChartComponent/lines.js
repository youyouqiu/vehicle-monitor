import React, { Component } from 'react';
import {
  Line, G, Text,
} from 'react-native-svg';
import PropTypes from 'prop-types';

export default class LineChartPaths extends Component {
    static propTypes = {
      linePaths: PropTypes.array.isRequired,
      axisColor: PropTypes.string.isRequired,
      axisFontSize: PropTypes.number.isRequired,
      uniqueKey: PropTypes.string.isRequired,
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
        linePaths, axisColor, axisFontSize, uniqueKey,
      } = this.props;

      if (!linePaths || linePaths.length === 0) {
        return null;
      }

      return linePaths.map((lineItem, index) => (
        <G key={uniqueKey + index.toString()}>
          <Line
            x1={lineItem.x1}
            y1={lineItem.y1}
            x2={lineItem.x2}
            y2={lineItem.y1}
            stroke={lineItem.color}
          />
          <Text
            x={lineItem.x1 - 12}
            y={lineItem.y1}
            fill={axisColor}
            fontSize={axisFontSize - 1}
          >
            {lineItem.text}
          </Text>
        </G>
      ));
    }
}