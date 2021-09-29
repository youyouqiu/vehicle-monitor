import React, { Component } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  Dimensions,
  TouchableHighlight,
  Platform,
  Alert,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import TextInput from '../../../common/textInput';
import msgIcon from '../../../static/image/msgIcon.png'; // 用户图标
import { toastShow } from '../../../utils/toastUtils';
import { getLocale } from '../../../utils/locales';

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
  getyzm: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'android' ? 12 : 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    height: 16,
    // color: '#ccc',
    minWidth: 80,
  },
});

class InputComponent extends Component {
  static propTypes = {
    style: PropTypes.shape(styles.container), // 样式
    value: PropTypes.string.isRequired,
    account: PropTypes.string.isRequired,
    getCaptcha: PropTypes.func.isRequired,
    inputChange: PropTypes.func.isRequired,
    yzmData: PropTypes.object.isRequired,
    resetYzm: PropTypes.func.isRequired,
    randomNum: PropTypes.number.isRequired,
  }

  static defaultProps = {
    style: null,
  }

  constructor(props) {
    super(props);
    const s = Date.now();

    this.state = {
      rightbtnval: '59s后重试',
      // timerNum: 59,
      ifPhoneNumber: false,
      ifTimer: false,
      timerInitTime: s,
    };
  }

  // props变化
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { account, yzmData: yzm, randomNum } = nextProps;
    const { randomNum: prevRandomNum } = this.props;
    const yzmData = JSON.parse(JSON.stringify(yzm));
    const bool = (/^1(3|4|5|7|8)\d{9}$/.test(account));
    this.setState({
      ifPhoneNumber: bool,
    });


    if (yzmData !== {} && !yzmData.success && yzmData.exceptionDetailMsg
       && randomNum !== prevRandomNum) {
      toastShow(yzmData.exceptionDetailMsg);
    }
    if (yzmData !== {} && yzmData.success && randomNum !== prevRandomNum) {
      this.setState({
        ifTimer: true,
        timerInitTime: Date.now(),
      });
      this.timer = setInterval(() => {
        const { timerInitTime } = this.state;
        const now = Date.now();

        const timeSec = 59 - parseInt((now - timerInitTime) / 1000, 10);

        if (timeSec > 1) {
          // const num = timerNum - 1;
          const timerText = `${timeSec}S后重试`;
          this.setState({
            // timerNum: num,
            rightbtnval: timerText,
          });
        } else {
          this.setState({
            rightbtnval: '59S后重试',
            // timerNum: 59,
            ifTimer: false,
          });
          clearInterval(this.timer);
        }

        // if (timerNum > 1) {
        //   const num = timerNum - 1;
        //   const timerText = `${num}S后重试`;
        //   this.setState({
        //     timerNum: num,
        //     rightbtnval: timerText,
        //   });
        // } else {
        //   this.setState({
        //     rightbtnval: '59s后重试',
        //     timerNum: 59,
        //     ifTimer: false,
        //   });
        //   clearInterval(this.timer);
        // }
      }, 1000);
    }
  }

  componentWillUnmount() {
    const { resetYzm } = this.props;
    resetYzm();
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // 右边图标点击事件
  rightIconPress =() => {
    const platform = Platform.OS;
    const version = 10200;
    const { account, getCaptcha } = this.props;
    const { ifPhoneNumber } = this.state;
    if (!ifPhoneNumber) {
      return;
    }
    if (!(/^1(3|4|5|7|8)\d{9}$/.test(account))) {
      toastShow('账号对应的手机号码有误');
      return;
    }

    Alert.alert(
      '确认手机号码', // 提示标题
      `我们将发送短信验证码到下面的号码\n${account}`, // 提示内容
      [
        {
          text: getLocale('cancel'),
          style: 'cancel',
        },
        {
          text: getLocale('sure'),
          onPress: () => {
            const data = {
              platform,
              version,
              account,
            };
            getCaptcha({ data });
          },
        },
      ],
      { cancelable: false },
    );
  }

  // 输入框内容变化
  inputChange=(val) => {
    const value = val.replace(/ /g, '');
    const { inputChange } = this.props;
    if (inputChange) {
      inputChange(value);
    }
  }

  render() {
    const {
      style, value,
    } = this.props;
    const {
      rightbtnval,
      ifTimer,
      ifPhoneNumber,
    } = this.state; // 用户图标是否向上,密码是否显示
    return (
      <View
        style={[styles.container, style]}
      >
        <Image
          style={styles.iconLeft}
          source={msgIcon}
        />
        <TextInput
          maxLength={12}
          underlineColorAndroid="transparent"
          textAlignVertical="bottom"
          style={styles.textInput}
          placeholder="请输入短信验证码"
          onChangeText={this.inputChange}
          value={value}
          keyboardType={Platform.OS !== 'android' ? 'ascii-capable' : 'default'}
        />
        <TouchableHighlight
          style={[styles.getyzm, !ifTimer ? null : { display: 'none', height: 0 }, ifPhoneNumber ? { borderLeftColor: '#4287ff' } : null]}
          underlayColor="transparent"
          onPress={this.rightIconPress}
          hitSlop={{
            top: 20, bottom: 20, left: 5, right: 50,
          }}
        >
          <Text style={[{ color: '#ccc' }, ifPhoneNumber ? { color: '#4287ff' } : null, !ifTimer ? null : { display: 'none', height: 0 }]}>获取验证码</Text>
        </TouchableHighlight>
        <View style={[styles.getyzm, ifTimer ? null : { display: 'none', height: 0 }]}>

          <Text style={[{ color: '#ccc' }, ifTimer ? null : { display: 'none', height: 0 }]}>{rightbtnval}</Text>
        </View>
      </View>
    );
  }
}

export default connect(
  state => ({
    yzmData: state.getIn(['loginReducers', 'captchaResult']),
    randomNum: state.getIn(['loginReducers', 'randomNum']),
    // key_: state.getIn(['loginReducers', 'key_']),
  }),
  dispatch => ({
    getCaptcha: (payload) => {
      dispatch({ type: 'login/SAGA/GET_CAPTCHA', payload });
    },
    resetYzm: () => {
      dispatch({ type: 'login/RESET_YZM' });
    },
  }),
)(InputComponent);