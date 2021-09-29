import React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';

import MarqueeView from '../../common/marquee';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },

  marqueeLabel: {
    backgroundColor: 'blue',
    width: 260,
    height: 200,
    fontWeight: '800',
    color: 'white',
  },
});

export default class Marquee extends React.Component {
  state={
    visible: false,
  }

  componentDidMount=() => {
    setTimeout(() => {
      this.setState({
        visible: true,
      });
    }, 2000);
  }

  render() {
    const { visible } = this.state;
    const remindInfo = [{ value: 'sfadfa' }];
    return (
      <View style={styles.container}>
        <MarqueeView
          style={styles.marqueeLabel}
          scrollDuration={3.0}
          labelWidth={100}
        >
           fangyunjiang is a good developer
        </MarqueeView>
        <Text>Hello</Text>
      </View>
    );
  }
}