import React, { Component } from 'react';
import {
  Rect,
} from 'react-native-svg';
import PropTypes from 'prop-types';

export default class LineChartPaths extends Component {
    static propTypes = {
      dotts: PropTypes.array.isRequired,
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
      const { dotts, uniqueKey } = this.props;
      if (!dotts || dotts.length === 0) {
        return null;
      }

      return dotts && dotts.map((dot, index) => (
        <Rect key={uniqueKey + index.toString()} x={dot.x - 2} y={dot.y - 2} width={5} height={5} stroke="darkgray" fill={dot.color} />
      ));
    }
}