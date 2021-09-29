import React, { Component } from 'react';
import {
  Path,
} from 'react-native-svg';
import PropTypes from 'prop-types';

export default class LineChartPaths extends Component {
    static propTypes = {
      paths: PropTypes.array.isRequired,
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
      const { paths, uniqueKey } = this.props;
      return paths.map((path, index) => (
        <Path
          key={uniqueKey + index.toString()}
          d={path.path}
          fill="none"
          stroke={path.color}
          strokeWidth={path.width}
        />
      ));
    }
}