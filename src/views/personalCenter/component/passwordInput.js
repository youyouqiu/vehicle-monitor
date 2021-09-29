import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Image,
  // TextInput,
  TouchableHighlight,
} from 'react-native';
import PropTypes from 'prop-types';
import TextInput from '../../../common/textInput';
import hidePassword from '../../../static/image/hidePassword.png';
import showPassword from '../../../static/image/showPassword.png';

const styles = StyleSheet.create({
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 26,
    alignItems: 'center',
    // paddingVertical: 14,
    height: 50,
    lineHeight: 50,
  },
  input: {
    flex: 1,
    marginRight: 10,
    paddingHorizontal: 0,
  },
  iconBox: {
    width: 24,
    height: 50,
    lineHeight: 50,
    textAlign: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 18,
    height: 18,
    marginTop: 16,
  },
});

class PasswordInput extends Component {
    static propTypes = {
      // onChangeText: PropTypes.func,
      style: PropTypes.shape(styles.container), // 样式
      placeholder: PropTypes.string.isRequired,
      value: PropTypes.string,
      onFocus: PropTypes.func,
    }

    static defaultProps = {
      style: null,
      value: '',
      onFocus: () => {},
      // onChangeText: () => {},
    }

    constructor(props) {
      super(props);
      this.state = {
        secureTextEntry: true,
        inputVal: '',
      };
    }

    // props变化
    UNSAFE_componentWillReceiveProps(nextProps) {
      const { value = null } = nextProps;
      this.setState({
        inputVal: value.replace(/ /g, ''),
      });
    }

  onChangeText=(val) => {
    const value = val.replace(/ /g, '');
    this.setState({
      inputVal: value,
    });
    const { onChangeText } = this.props || null;
    if (onChangeText) {
      onChangeText(value);
    }
  }

  ifShowPw=() => {
    const { secureTextEntry } = this.state;
    this.setState({
      secureTextEntry: !secureTextEntry,
    });
  }

  render() {
    const {
      style, placeholder, onFocus,
    } = this.props;
    const { secureTextEntry, inputVal } = this.state;
    const icon = secureTextEntry ? hidePassword : showPassword;
    return (

      <View style={[styles.inputBox, style]}>
        <TextInput
          maxLength={25}
          underlineColorAndroid="transparent"
          placeholderTextColor="#B5B5B5"
          style={styles.input}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          onChangeText={this.onChangeText}
          value={inputVal}
          onFocus={onFocus}
        />
        <TouchableHighlight
          underlayColor="transparent"
          onPress={this.ifShowPw}
          style={styles.iconBox}
          hitSlop={{
            left: 5, right: 26,
          }}
        >
          <Image source={icon} style={styles.icon} />
        </TouchableHighlight>
      </View>

    );
  }
}

export default PasswordInput;
