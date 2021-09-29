import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ScrollView,
  NativeModules,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLoginAccont } from '../../../server/getStorageData';
import { reset } from '../../../utils/routeCondition';
import { getLocale } from '../../../utils/locales';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
import Title from '../component/title';
import PasswordInput from '../component/passwordInput';
import Loading from '../../../common/loading';
import { toastShow } from '../../../utils/toastUtils';// 导入toast
import storage from '../../../utils/storage';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#F4F7FA',
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    width: windowWidth,
    // paddingVertical: 10,
  },
  btn_box: {
    width: '100%',
    paddingHorizontal: 26,
  },
  btn: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#4287ff',
    height: 46,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
  tips: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    fontSize: 14,
    color: '#B5B5B5',
  },
});

class ChangePassword extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('changePwdTitle'),
  )
  // static navigationOptions = ({ navigation }) => ({
  //   header: (
  //     <PublicNavBar title={getLocale('changePwdTitle')} nav={navigation} />
  //   ),
  // })

  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
    changePasswordAction: PropTypes.func.isRequired,
    userName: PropTypes.string.isRequired,
  }

  static defaultProps = {
    monitors: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      oldPw: '',
      newPw: '',
      confirmPw: '',
      load: false,
      btnPosY: 0,
      offset: new Animated.Value(0),
    };
  }

  componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
  }

  UNSAFE_componentWillReceiveProps(nextprops) {
    const { result, errReason, key_ } = nextprops;
    if (key_ !== this.props.key_) {
      if (result && errReason === '') { // 修改成功
        this.setState({
          oldPw: '',
          newPw: '',
          confirmPw: '',
          load: false,
        });
        toastShow(getLocale('changePwdSuccess'), { duration: 2000 });
        // 清除本地存储
        storage.remove({
          key: 'loginState',
        }).then(() => {
          this.changeStorage();
          reset('login');
        });
      } else { // 修改失败
        this.setState({
          load: false,
        });
        toastShow(errReason, { duration: 2000 });
      }
    }
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  // 获取确定按钮绝对位置
  onLayout=(e) => {
    NativeModules.UIManager.measure(e.target, (x, y, width, height, pageX, pageY) => {
      this.setState({
        btnPosY: pageY,
      });
    });
  }

  // 键盘弹出
  keyboardDidShow=(e) => {
    const { btnPosY } = this.state;
    const { screenY } = e.endCoordinates;
    this.offsetY = btnPosY - screenY + 5;
  }

  // 键盘收起
  keyboardDidHide=() => {
    const { offset } = this.state;
    this.animateOffset(offset, 0);
  }

  // 最后一个输入框获取焦点
  focus=() => {
    setTimeout(() => {
      const { offsetY } = this;
      const { offset } = this.state;
      if (offsetY > 0) {
        this.animateOffset(offset, offsetY);
      }
    }, 300);
  }

  // 第一个输入框获取焦点
  focusFirst=() => {
    const { offset } = this.state;
    this.animateOffset(offset, 0);
  }

  // 动画
  animateOffset=(offset, offsetY) => {
    Animated.timing( // 随时间变化而执行动画
      offset, // 动画中的变量值
      {
        toValue: -offsetY, // 透明度最终变为1，即完全不透明
        duration: 260, // 让动画持续一段时间
        easing: Easing.inOut(Easing.ease),
      },
    ).start();
  }

  // 清空缓存密码
  changeStorage=() => {
    const { route: { params: { userName } } } = this.props;
    getLoginAccont().then((ret) => {
      let item;
      ret.forEach((element, index) => {
        if (element.accont === userName) {
          ret.splice(index, 1);
          item = element;
        }
      });

      ret.unshift({
        accont: item.accont,
        password: '',
        ip: item.ip,
        defaultIp: item.defaultIp,
      });

      storage.save({
        key: 'loginAccont',
        data: ret,
      });
    });
  }

  // 原密码
  onChangeText=(val) => {
    this.setState({
      oldPw: val,
    });
  }

  // 新密码
  onChangeNewPwText=(val) => {
    this.setState({
      newPw: val,
    });
  }

  // 密码确认
  confirmNewPwText=(val) => {
    this.setState({
      confirmPw: val,
      load: false,
    });
  }

  // 输入验证
  checkForm=() => {
    const { oldPw, newPw, confirmPw } = this.state;
    let warning = '';
    if (oldPw === '' || newPw === '' || confirmPw === '') {
      warning = getLocale('changePwdTips5');
    } else if (newPw.length < 6 || newPw.length > 25) {
      warning = getLocale('changePwdTips3');
    } else if (newPw !== confirmPw) {
      warning = getLocale('changePwdTips4');
    }

    return warning;
  }

  // 提交
  submit=() => {
    Keyboard.dismiss();
    const {
      oldPw,
      newPw,
    } = this.state;
    const { changePasswordAction } = this.props;

    const warns = this.checkForm();

    if (warns !== '') {
      toastShow(warns, { duration: 2000 });
      return;
    }

    changePasswordAction({
      oldPassword: oldPw,
      newPassword: newPw,
    });

    this.setState({
      load: true,
    });
  }

  render() {
    const {
      load, oldPw, newPw, confirmPw, offset,
    } = this.state;
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <Animated.View style={[styles.body, { marginTop: offset }]}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1, position: 'relative' }}
            >
              {/* 原密码 */}
              <Title title={getLocale('changePwdLabel1')} />
              <View style={styles.container}>
                <PasswordInput
                  onChangeText={this.onChangeText}
                  value={oldPw}
                  placeholder={getLocale('changePwdPlaceHolder1')}
                  onFocus={this.focusFirst}
                />
              </View>

              {/* 新密码 */}
              <Title title={getLocale('changePwdLabel2')} />
              <View style={styles.container}>
                <PasswordInput
                  value={newPw}
                  onChangeText={this.onChangeNewPwText}
                  style={{ borderBottomWidth: 1, borderColor: '#eee' }}
                  placeholder={getLocale('changePwdPlaceHolder2')}
                  onFocus={this.focus}
                />
                <PasswordInput
                  value={confirmPw}
                  onChangeText={this.confirmNewPwText}
                  placeholder={getLocale('changePwdPlaceHolder3')}
                  onFocus={this.focus}
                />
              </View>
              <Text style={styles.tips}>{getLocale('changePwdTips')}</Text>

              {/* 按钮 */}
              <View
                style={styles.btn_box}
              >
                <TouchableOpacity
                  style={styles.btn}
                  onPress={this.submit}
                >
                  {
                load ? <Loading type="inline" style={{ height: '100%' }} /> : (
                  <Text style={styles.btnText}>
                    {getLocale('changePwdRefer')}
                  </Text>
                )
              }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          <ToolBar
            activeMonitor={activeMonitor}
            monitors={monitors}
          />
        </Animated.View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    result: state.getIn(['changePasswordReducers', 'result']), // 密码修改返回结果
    errReason: state.getIn(['changePasswordReducers', 'errReason']), // 错误信息
    key_: state.getIn(['changePasswordReducers', 'key_']), // 随机数
  }),
  dispatch => ({
    changePasswordAction: (params) => {
      dispatch({ type: 'changePassword/SAGA/CHANGE_PWD_ACTION', params });// 修改密码提交
    },
  }),
)(ChangePassword);
