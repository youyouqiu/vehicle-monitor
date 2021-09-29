
import React, { Component } from 'react';
import {
  View, StyleSheet, Dimensions,
} from 'react-native';
import BaiduPano from '../../common/baiduPanoView';

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  view: {
    width,
    height,
  },
});


class BaiduPanoDemo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      customPanoView: {
        latitude: 39.914134,
        longitude: 116.3034,
      },
    };
  }

  render() {
    const { customPanoView } = this.state;
    return (
      <View style={styles.view}>
        <BaiduPano
          customPanoView={customPanoView}
          onPanoramaScreenChange={this.ss}
        />
      </View>
    );
  }
}


export default BaiduPanoDemo;
