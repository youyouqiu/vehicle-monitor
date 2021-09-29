import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
const styles = StyleSheet.create({

  textColor: {
    color: 'rgb(120,120,120)',
    fontSize: 16,
  },
  title: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth,
  },

});

class Title extends Component {
    static propTypes = {
      title: PropTypes.string.isRequired,

    }

    render() {
      const {
        title,
      } = this.props;
      return (
        <View style={styles.title}>
          <Text style={{ fontSize: 14 }}>
            {title}
          </Text>
        </View>
      );
    }
}

export default Title;
