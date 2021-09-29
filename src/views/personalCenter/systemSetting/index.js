/* eslint-disable max-len */
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Button,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
import SwitchBar from '../component/switchBar';
import SliderBar from '../component/slider';
import ColorBox from '../component/ColorBox';
import MsgRemindSwitch from '../component/msgRemindSwitch';
import storage from '../../../utils/storage';
import { getLocale } from '../../../utils/locales';
import wArrowRight from '../../../static/image/wArrowRight.png';
import {
  getCurAccont,
  getDueToRemind,
} from '../../../server/getStorageData';
import RadioView from '../component/RadioView';
import { toastShow } from '../../../utils/toastUtils';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
// const dismissKeyboard = require('dismissKeyboard');

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#F4F7FA',
    flex: 1,
  },
  outLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    // fontWeight: 'bold',
    marginTop: 10,
    paddingHorizontal: 26,
    paddingVertical: 10,
  },
  textColor: {
    color: '#333',
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
  container: {
    backgroundColor: '#fff',
    // borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  alarmHeaderBox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderBottomColor: '#e9e9e9',
  },
  alarmHeader: {
    flex: 1,
    padding: 10,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 14,
    color: 'rgb(120,120,120)',
  },
  panel_icon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  rotate: {
    transform: [
      // 角度
      { rotate: '90deg' },
    ],
  },
  rInput: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
});

class SystemSetting extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('sysSettingTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
    // userName: PropTypes.string.isRequired,
    jumpRouter: PropTypes.string, // 从哪个界面跳转至本页面
  }

  static defaultProps = {
    monitors: null,
    jumpRouter: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      isSelect: 1,
      curUser: null,
      voiceValue: true, // 声音开关
      shakeValue: true, // 震动开关
      msgRemind: true, // 免打扰开关
      remindValue: true, // 到期提醒开关
      videoValue: false, // 视频画面开关
      speedValues: [30, 90], // 速度设置
      trajectoryType: true, // 轨迹线开关
      radioList: [{ id: 3, name: '粗' }, { id: 2, name: '中' }, { id: 1, name: '细' }],
      trajectoryValue: 2, // 轨迹线
      dotType: true, // 压点设置开关
      dotValue: '31', // 压点设置
      msgRemindStart: '20:00', // 免打扰开始时间
      msgRemindEnd: '08:00', // 免打扰结束时间
    };

    getCurAccont().then((curUser) => {
      this.setState({
        curUser,
      }, () => {
        this.readData();
        this.setSelect();
      });
    });
    getDueToRemind().then((remindRes) => {
      this.setState({
        remindValue: !!((remindRes || remindRes === null)),
      });
    });
  }

  componentDidMount() {
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
  }

  componentWillUnmount() {
    this.keyboardDidHideListener.remove();
  }

  // 键盘收起
  keyboardDidHide = () => {
    // Keyboard.dismiss();
  }

  // 设置显示tab(从消息中心跳转过来时,默认展开消息中心项)
  setSelect = () => {
    const { route: { params: { jumpRouter } } } = this.props;
    if (jumpRouter) {
      this.setState({
        isSelect: 2,
      });
    }
  }

  // 声音开关切换
  voiceSetting = (val) => {
    this.setState({
      voiceValue: val,
    }, () => {
      this.saveSetting();
    });
  }

  // 震动开关切换
  shakeSetting = (val) => {
    this.setState({
      shakeValue: val,
    }, () => {
      this.saveSetting();
    });
  }

  // 免打扰开关切换
  msgRemindSetting = (val) => {
    this.setState({
      msgRemind: val,
    }, () => {
      this.saveSetting();
    });
  }

  // 免打扰开始时间改变
  startDateChange = (val) => {
    this.setState({
      msgRemindStart: val,
    }, () => {
      this.saveSetting();
    });
  }

  // 免打扰结束时间改变
  endDateChange = (val) => {
    this.setState({
      msgRemindEnd: val,
    }, () => {
      this.saveSetting();
    });
  }

  // 到期提醒开关切换
  remindSetting = (val) => {
    this.setState({
      remindValue: val,
    }, () => {
      this.saveSetting();
    });
  }

  // 视频画质开关切换
  videoSetting = (val) => {
    this.setState({
      videoValue: val,
    }, () => {
      this.saveSetting();
    });
  }

  // 速度设置开关切换
  speedSetting = (val) => {
    this.setState({
      speedValues: val,
    });
  }

  // 本地缓存系统设置
  saveSetting = () => {
    const { curUser } = this.state;
    const {
      remindValue,
      videoValue,
      speedValues,
      trajectoryType,
      trajectoryValue,
      dotType,
      dotValue,
      voiceValue,
      shakeValue,
      msgRemind,
      msgRemindStart,
      msgRemindEnd,
    } = this.state;
    const ret = {};
    ret[curUser] = {
      voice: voiceValue, // 声音
      shake: shakeValue, // 震动
      time: msgRemind, // 免打扰
      timeStart: msgRemindStart, // 免打扰开始时间
      timeEnd: msgRemindEnd, // 免打扰结束时间
      videoSwitch: videoValue, // 视频画质
      speedSlider: speedValues, // 速度设置
      trajectoryType, // 轨迹线设置
      trajectoryValue, // 轨迹值设置
      dotType, // 压点设置
      dotValue, // 压点值设置
    };
    storage.save({
      key: 'userSetting',
      data: ret,
    });
    storage.save({
      key: 'dueToRemind',
      data: remindValue,
    });
  }

  // 获取存储数据
  readData = async () => {
    const { curUser: userName } = this.state;
    storage.load({
      key: 'userSetting',
      autoSync: true,
      syncInBackground: true,
      syncParams: {
        user: userName,
      },
    }).then((ret) => {
      if (ret && ret[userName]) {
        const setting = ret[userName];
        this.setState({
          voiceValue: setting.voice, // 声音开关
          shakeValue: setting.shake, // 震动开关
          msgRemind: setting.time, // 免打扰开关
          msgRemindStart: setting.timeStart, // 免打扰开始时间
          msgRemindEnd: setting.timeEnd, // 免打扰结束时间
          videoValue: setting.videoSwitch, // 视频画质
          speedValues: setting.speedSlider, // 速度
          trajectoryType: setting.trajectoryType, // 轨迹线
          trajectoryValue: setting.trajectoryValue, // 轨迹值
          dotType: setting.dotType, // 压点
          dotValue: setting.dotValue, // 压点值
        });
      }
    }).catch((err) => {
      console.log('storage load err', err);
    });
  }

  changeSelect = (value) => {
    const { isSelect } = this.state;
    if (value === isSelect) {
      this.setState({
        isSelect: null,
      });
    } else {
      this.setState({
        isSelect: value,
      });
    }
  }

  // 获取速度设置值
  getSliderValues = (values) => {
    if (values.length > 0) {
      if (values[1] - values[0] === 1) {
        values[1] = values[0];
      }
    }
    this.setState({
      speedValues: values,
    }, () => {
      this.saveSetting();
    });
  }

  // 设置轨迹线值（1-粗，2-中，3-细）
  onTrajectoryCheck = (value) => {
    // console.log(value, 'onTrajectoryCheckValue');
    this.setState({
      trajectoryValue: value,
    }, () => {
      this.saveSetting();
    });
  }

  // 设置压点值
  onDotChange = (value) => {
    // console.log(value, 'onDotChangeValue');
    // const reg = /^[1-9]\d{0,1}$/;
    this.setState({
      dotValue: value,
    });
  }

  dotOK = () => {
    const { dotValue } = this.state;
    const reg = /^\d{1,2}$/;
    Keyboard.dismiss();
    if (reg.test(dotValue) && dotValue <= 31) {
      // console.log(dotValue, 'dotValue');
      this.saveSetting();
      toastShow('设置成功！', { duration: 2000 });
    } else {
      this.setState({
        dotValue: '',
      }, () => {
        toastShow('可输入范围为0到31秒！', { duration: 2000 });
      });
    }
  }

  render () {
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const {
      voiceValue, shakeValue, msgRemind, remindValue, videoValue, speedValues, trajectoryValue, radioList, dotValue,
      msgRemindStart, msgRemindEnd, isSelect,
    } = this.state;
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.body}>
          {/** keyboardShouldPersistTaps - 解决键盘弹起点击两次才能触发子组件 */}
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ flex: 1, paddingBottom: 100 }}>
              {/** 报警提醒 */}
              <TouchableOpacity
                style={styles.alarmHeaderBox}
                activeOpacity={0.6}
                onPress={() => { this.changeSelect(1); }}
              >
                <Text
                  style={styles.alarmHeader}
                >
                  {getLocale('alarmTitle')}
                </Text>
                <Animatable.Image
                  duration={300}
                  transition="rotate"
                  source={wArrowRight}
                  style={[styles.panel_icon, isSelect === 1 ? styles.rotate : null]}
                />
              </TouchableOpacity>
              {
                isSelect === 1
                  ? (
                    <View style={styles.container}>
                      <SwitchBar title={getLocale('sysSettingLabel1')} value={voiceValue} switchChange={this.voiceSetting} />
                      <SwitchBar title={getLocale('sysSettingLabel2')} value={shakeValue} switchChange={this.shakeSetting} />
                      <MsgRemindSwitch
                        style={{
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: 'transparent',
                          borderBottomColor: '#e9e9e9',
                        }}
                        title={getLocale('sysSettingLabel3')}
                        value={msgRemind}
                        switchChange={this.msgRemindSetting}
                        msgRemindStart={msgRemindStart}
                        startDateChange={this.startDateChange}
                        msgRemindEnd={msgRemindEnd}
                        endDateChange={this.endDateChange}
                      />
                    </View>
                  )
                  : null
              }
              {/** 消息中心 */}
              <TouchableOpacity
                style={styles.alarmHeaderBox}
                activeOpacity={0.6}
                onPress={() => { this.changeSelect(2); }}
              >
                <Text
                  style={styles.alarmHeader}
                >
                  {getLocale('noticeCenter')}
                </Text>
                <Animatable.Image
                  duration={300}
                  transition="rotate"
                  source={wArrowRight}
                  style={[styles.panel_icon, isSelect === 2 ? styles.rotate : null]}
                />
              </TouchableOpacity>
              {
                isSelect === 2
                  ? (
                    <View style={styles.container}>
                      <SwitchBar title={getLocale('dueToRemind')} value={remindValue} switchChange={this.remindSetting} />
                    </View>
                  )
                  : null
              }
              {/** 视频画质 */}
              <TouchableOpacity
                style={styles.alarmHeaderBox}
                activeOpacity={0.6}
                onPress={() => { this.changeSelect(3); }}
              >
                <Text
                  style={styles.alarmHeader}
                >
                  {getLocale('videoQuality')}
                </Text>
                <Animatable.Image
                  duration={300}
                  transition="rotate"
                  source={wArrowRight}
                  style={[styles.panel_icon, isSelect === 3 ? styles.rotate : null]}
                />
              </TouchableOpacity>
              {
                isSelect === 3
                  ? (
                    <View style={styles.container}>
                      <SwitchBar title={getLocale('qualityCovered')} value={videoValue} switchChange={this.videoSetting} />
                    </View>
                  )
                  : null
              }
              {/** 速度设置 */}
              <TouchableOpacity
                style={styles.alarmHeaderBox}
                activeOpacity={0.6}
                onPress={() => { this.changeSelect(4); }}
              >
                <Text
                  style={styles.alarmHeader}
                >
                  {getLocale('speedInstall')}
                </Text>
                <Animatable.Image
                  duration={300}
                  transition="rotate"
                  source={wArrowRight}
                  style={[styles.panel_icon, isSelect === 4 ? styles.rotate : null]}
                />
              </TouchableOpacity>
              {
                isSelect === 4
                  ? (
                    <View>
                      <View style={styles.container}>
                        <SliderBar getSliderValues={this.getSliderValues} speedValues={speedValues} />
                      </View>
                      <ColorBox speedValues={speedValues} />
                    </View>
                  )
                  : null
              }
              {/** 轨迹设置 */}
              <TouchableOpacity
                style={styles.alarmHeaderBox}
                activeOpacity={0.6}
                onPress={() => { this.changeSelect(5); }}
              >
                <Text
                  style={styles.alarmHeader}
                >
                  {getLocale('trajectoryInstall')}
                </Text>
                <Animatable.Image
                  duration={300}
                  transition="rotate"
                  source={wArrowRight}
                  style={[styles.panel_icon, isSelect === 5 ? styles.rotate : null]}
                />
              </TouchableOpacity>
              {
                isSelect === 5
                  ? (
                    <View>
                      <View style={[styles.container, {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 26,
                        paddingVertical: 15,
                      }]}
                      >
                        <View style={{ width: 80 }}>
                          <Text style={styles.textColor}>
                            {getLocale('trajectoryLine')}
                          </Text>
                        </View>
                        <View>
                          <RadioView defaultId={trajectoryValue} radioList={radioList} onCheck={this.onTrajectoryCheck} />
                        </View>
                      </View>
                      <View style={[styles.container, {
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 26,
                        // paddingVertical: 15,
                      }, Platform.OS === 'ios' && { paddingVertical: 8 }]}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <View style={{ width: 100 }}>
                            <Text style={styles.textColor}>
                              {getLocale('dotInstall')}
                            </Text>
                          </View>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          >
                            <TextInput
                              style={[{
                                width: 48,
                                paddingBottom: -10,
                                borderBottomWidth: 1,
                                borderColor: 'rgb(238,238,238)',
                                textAlign: 'center'
                              }, Platform.OS === 'android' && { marginBottom: 10 }]}
                              onChangeText={(text) => { this.onDotChange(text); }}
                              value={typeof dotValue === 'string' ? dotValue : dotValue.toString()}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                            <Text>秒</Text>
                          </View>
                        </View>
                        <View style={{ width: 69 }}>
                          <Button title="确定" onPress={() => { this.dotOK(); }} />
                        </View>
                      </View>
                    </View>
                  )
                  : null
              }
            </View>
          </ScrollView>
          <ToolBar
            activeMonitor={activeMonitor}
            monitors={monitors}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
  }),
  null,
)(SystemSetting);