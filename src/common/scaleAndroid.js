import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import PropTypes from 'prop-types';
import scaleAndroid from '../static/image/scaleAndroid.png';

const styles = StyleSheet.create({
  scaleFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleIcoStyle: {
    width: 30,
    height: 10,
  },
  fontStyle: {
    fontSize: 10,
  },
})

export default class ScaleAndroid extends React.Component {
  static propTypes = {
    scaleValue: PropTypes.string,
  }

  static defaultProps = {
    scaleValue: null,
  }


  render() {
    const { scaleValue } = this.props;

    return (
      <View style={styles.scaleFlex}>
        <Text style={styles.fontStyle}>{scaleValue}</Text>
        <Image
          style={styles.scaleIcoStyle}
          source={scaleAndroid}
          resizeMode="contain"
        />
      </View>
    );
  }
}
