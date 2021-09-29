import React, { Component } from 'react';
import {
  View,
  Image,
  StyleSheet,
  // TextInput,
  Dimensions,
  TouchableHighlight,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import TextInput from '../../../common/textInput';
import adminIcon from '../../../static/image/admin.png'; // 用户图标
import passwordIcon from '../../../static/image/passWord.png'; // 密码图标
import ipIcon from '../../../static/image/IP.png'; // 密码图标
import arrowDownIcon from '../../../static/image/arrowDown.png'; // 箭头向下图标
import arrowUpIcon from '../../../static/image/arrowUp.png'; // 箭头向下图标
import showPasswordIcon from '../../../static/image/showPassword.png'; // 眼睛睁开图标
import hidePasswordIcon from '../../../static/image/hidePassword.png'; // 眼睛闭上图标
import deleteIcon from '../../../static/image/delete.png'; // 清空图标

const inputWidth = Dimensions.get('window').width * 0.8; // 获取屏幕宽度

const styles = StyleSheet.create({
  container: {
    width: inputWidth,
    height: 42,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e8e8e8',
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 2,
    paddingBottom: 9,
    zIndex: -1,
  },
  textInput: {
    flex: 1,
    padding: 0,
    height: 40,
    paddingRight: 20,
  },
  iconLeft: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'android' ? 8 : 4,
    width: 18,
    height: 24,
  },
  iconRight: {
    width: 18,
    height: 18,
    zIndex: 1000,
  },
  touchableHighlight: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'android' ? 12 : 8,
    width: 18,
    height: 18,
  },
  touchableHighlight2: {
    position: 'absolute',
    right: 38,
    top: Platform.OS === 'android' ? 12 : 8,
    width: 18,
    height: '100%',
    zIndex: 99999,
  },
});

export default class InputComponent extends Component {
  static propTypes = {
    style: PropTypes.shape(styles.container), // 样式
    placeholder: PropTypes.string.isRequired, // placeholder必传
    inputType: PropTypes.string.isRequired, // 输入框类型必传
    isAdminIconUP: PropTypes.bool,
    autoFocus: PropTypes.bool, // 是否自动聚焦
    showHistory: PropTypes.func,
    value: PropTypes.string,
    delfun: PropTypes.func.isRequired,
    onFocus: PropTypes.func, // 获取焦点回调
    boardType: PropTypes.string, // 弹出键盘类型
  }

  static defaultProps = {
    style: null,
    isAdminIconUP: false,
    autoFocus: false,
    showHistory: null,
    value: '',
    boardType: 'default',
    onFocus: () => {},
  }

  constructor(props) {
    super(props);
    this.state = {
      isPassword: false, // 是否是密码框
      // isAdminIconUP: false, // 用户图标是否向上
      ispasswordTextShow: false, // 密码是否显示
      deleteStyle: Platform.OS === 'android' ? { height: 0 } : { display: 'none' },
      inputVal: '',
    };
  }

  // props变化
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { value = null } = nextProps;
    this.setState({
      inputVal: value,
    });
    // if (isAdminIconUP !== null) {
    //   this.setState({
    //     isAdminIconUP,
    //   });
    // }
  }

  // 左边图标点击事件
  rightIconPress =() => {
    const { inputType, isAdminIconUP = null } = this.props;
    const { ispasswordTextShow } = this.state;
    if (inputType === 'admin') {
      // this.setState({
      //   isAdminIconUP: !isAdminIconUP,
      // });
      const { showHistory = null } = this.props;
      // const { isAdminIconUP } = this.state;
      if (showHistory) {
        showHistory(isAdminIconUP); // 因为这个时候isAdminIconUP变了但const没变所以取反
      }
    }
    if (inputType === 'password') {
      this.setState({
        ispasswordTextShow: !ispasswordTextShow,
      });
    }
  }

  // input框获得焦点
  inputFocus=() => {
    const { inputVal } = this.state;
    const { onFocus } = this.props;
    if (inputVal) {
      this.setState({
        deleteStyle: {},
      });
    } else {
      this.setState({
        deleteStyle: Platform.OS === 'android' ? { height: 0 } : { display: 'none' },
      });
    }

    if (typeof onFocus === 'function') {
      onFocus();
    }
  }

  // input框失去焦点
  inputBlur=() => {
    this.setState({
      deleteStyle: Platform.OS === 'android' ? { height: 0 } : { display: 'none' },
    });
  }

  // 输入框内容变化
  inputChange=(val) => {
    const value = val.replace(/ /g, '');
    this.setState({
      inputVal: value,
    });
    const { inputChange } = this.props || null;
    if (inputChange) {
      inputChange(value);
    }

    // 删除按钮是否显示
    if (value.length > 0) {
      this.setState({
        deleteStyle: {},
      });
    } else {
      this.setState({
        deleteStyle: Platform.OS === 'android' ? { height: 0 } : { display: 'none' },
      });
    }
  }

  // 删除按钮点击事件
  deleteIconPress=() => {
    const { delfun } = this.props;

    this.setState({
      inputVal: '',
      deleteStyle: Platform.OS === 'android' ? { height: 0 } : { display: 'none' },
    }, () => {
      if (delfun) {
        delfun();
      }
    });
  }

  render() {
    const {
      style, placeholder, inputType, isAdminIconUP = null, autoFocus = false, boardType,
    } = this.props;
    const {
      ispasswordTextShow, deleteStyle, inputVal,
    } = this.state; // 用户图标是否向上,密码是否显示
    let iconLeft;
    let rightIcon;
    switch (inputType) {
      case 'admin':
        iconLeft = adminIcon;
        rightIcon = isAdminIconUP ? arrowUpIcon : arrowDownIcon;
        this.state.isPassword = false;
        break;
      case 'password':
        iconLeft = passwordIcon;
        rightIcon = ispasswordTextShow ? showPasswordIcon : hidePasswordIcon;
        this.state.isPassword = true;
        break;
      case 'ip':
        iconLeft = ipIcon;
        rightIcon = null;
        this.state.isPassword = false;
        // Alert.alert(JSON.stringify(autoFocus));

        break;
      default:
        iconLeft = adminIcon;
        rightIcon = arrowDownIcon;
        this.state.isPassword = false;
        break;
    }
    const { isPassword } = this.state;
    const deleteIconSty = inputType === 'ip' ? { right: 16 } : { right: 38 };
    return (
      <View
        style={[styles.container, style]}
      >
        <Image
          style={styles.iconLeft}
          source={iconLeft}
        />
        <TextInput
          maxLength={25}
          underlineColorAndroid="transparent"
          textAlignVertical="bottom"
          style={styles.textInput}
          placeholder={placeholder}
          secureTextEntry={isPassword && !ispasswordTextShow}
          onFocus={this.inputFocus}
          onBlur={this.inputBlur}
          onChangeText={this.inputChange}
          value={inputVal}
          autoFocus={autoFocus}
          keyboardType={(isPassword && Platform.OS !== 'android') ? 'ascii-capable' : boardType}
          clearButtonMode="while-editing"
        />
        {
          Platform.OS === 'ios'
            ? null
            : (
              <TouchableHighlight
                hitSlop={{
                  top: 20, bottom: 20, left: 20, right: 0,
                }}
                style={[styles.touchableHighlight2, deleteIconSty, deleteStyle]}
                underlayColor="transparent"
                onPress={this.deleteIconPress}
              >
                <Image
                  style={[styles.iconRight]}
                  source={deleteIcon}
                />
              </TouchableHighlight>
            )
        }
        <TouchableHighlight
          style={styles.touchableHighlight}
          underlayColor="transparent"
          onPress={this.rightIconPress}
          hitSlop={{
            top: 20, bottom: 20, left: 5, right: 50,
          }}
        >
          <Image
            style={styles.iconRight}
            source={rightIcon}
          />
        </TouchableHighlight>
      </View>
    );
  }
}