import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import IconSpeed from '../../static/image/speed.png';

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderWidth: 1,
    borderColor: '#33bbff',
    borderRadius: 3,
    alignItems: 'center',
    // width: '50%',
    height: 28,
  },
  icon: {
    width: 20,
    height: 13,
  },
});

export default class BottomProgressSpeed extends Component {
  static propTypes = {
    onSpeedChange: PropTypes.func.isRequired,
    currentSpeed: PropTypes.number.isRequired,
  }

  shouldComponentUpdate(nextProps) {
    return !this.isPropsEqual(this.props, nextProps);
  }

  isPropsEqual(prevProps, nextProps) {
    const {
      currentSpeed,
    } = prevProps;

    const {
      currentSpeed: currentSpeed2,
    } = nextProps;

    if (currentSpeed !== currentSpeed2) return false;
    return true;
  }

  handleChangeSpeed=() => {
    const { onSpeedChange } = this.props;
    if (typeof onSpeedChange === 'function') {
      onSpeedChange();
    }
  }


  render() {
    const { currentSpeed } = this.props;
    return (
      <TouchableOpacity style={styles.button} onPress={this.handleChangeSpeed}>
        <Image
          source={IconSpeed}
          style={styles.icon}
        />
        <Text>x{currentSpeed}</Text>
      </TouchableOpacity>
    );
  }
}
