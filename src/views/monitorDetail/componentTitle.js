import React, { Component } from 'react';
import { is } from 'immutable';
import {
  Text, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

// style
const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 26,
    paddingVertical: 10,
    backgroundColor: '#eeeeee',
  },
});

class CellTitle extends Component {
  // 属性声明
  static propTypes ={
    title: PropTypes.string.isRequired,
  };

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    const {
      title,
    } = this.props;
    return (
      <Text style={styles.title}>
        {title}
      </Text>
    );
  }
}

export default CellTitle;