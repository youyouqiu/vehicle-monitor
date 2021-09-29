import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';

// style
const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: -21,
    right: 21,
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: '#26A2FF',
    backgroundColor: '#26A2FF',
    borderRadius: 21,
    zIndex: 1000,
  },
  menu_txt: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    lineHeight: 45,
    fontWeight: 'bold',
  },
});

class Menu extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    return (
      <View style={styles.menu}>
        <Text style={styles.menu_txt}>
            导航
        </Text>
      </View>
    );
  }
}

export default Menu;