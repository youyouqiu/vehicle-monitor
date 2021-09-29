import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';

// import Switch from 'react-native-switchbutton';


const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度


const styles = StyleSheet.create({
  textColor: {
    color: '#333',
    fontSize: 16,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    // fontWeight: 'bold',
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  iosSwitch: {
    position: 'relative',
    top: Platform.OS === 'android' ? 0 : -5,
  },
});
class SwitchBar extends Component {
    static propTypes = {
      style: PropTypes.shape(styles.container), // 样式
      title: PropTypes.string.isRequired,
      switchChange: PropTypes.func.isRequired,
      value: PropTypes.bool.isRequired,
      // eslint-disable-next-line react/require-default-props
      renderDOM: PropTypes.any,
    }

    static defaultProps = {
      style: null,
    }

    switchChange=(val) => {
      const { switchChange } = this.props;
      switchChange(val);
    }

    render() {
      const { style, title, value, renderDOM } = this.props;
      return (
        <View style={[styles.container, style]}>
          <Text style={styles.textColor}>
            {title}
          </Text>
          {
            renderDOM ? renderDOM : null
          }
          <View style={[{ height: 10 }, styles.iosSwitch]}>
            <Switch
              value={value}
              trackColor={{ false: 'rgb(208,208,208)', true: '#3399ff' }}
              thumbColor="#fff"
              // onTintColor="#3399ff"
              // thumbTintColor={Platform.OS === 'android' ? '#fff' : ''}
              onValueChange={this.switchChange}
            />
          </View>
        </View>
      );
    }
}

export default SwitchBar;
