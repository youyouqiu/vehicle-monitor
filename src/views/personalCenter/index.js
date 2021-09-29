import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  ScrollView,
  TouchableHighlight,
  Alert,
  Platform,
  Linking,
  NativeModules,
  DeviceEventEmitter,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import {
  getLoginAccont,
  getUserSetting,
  getCurAccont,
  getUserStorage,
  getDueToRemind,
} from '../../server/getStorageData';
import { saveLog } from '../../server/getData';
import {
  go, reset, setMonitor,
} from '../../utils/routeCondition';
import storage from '../../utils/storage';
import PublicNavBar from '../../common/newPublicNavBar';
import { getLocale } from '../../utils/locales';
import CenterHeader from './component/centerHeader';
// import SingleBar from './component/singleBar';
import ListBar from './component/listBar';
import ToolBar from '../../common/toolBar';
import Loading from '../../common/loading';
import { isEmpty } from '../../utils/function';
import { toastShow } from '../../utils/toastUtils';
import { requestConfig } from '../../utils/env';
import ShareComponent from '../../common/share';
import setting from '../../static/image/share.png';
import settingOne from '../../static/image/setting1.png';
import notice from '../../static/image/notice.png';
import pwd from '../../static/image/pwd.png';

const httpBaseConfig = requestConfig();
/* eslint prefer-template:off */
const { version: versionNumber } = httpBaseConfig;
const versionStr = versionNumber.toString().length === 5 ? '0' + (versionNumber.toString()) : versionNumber.toString();
const versionText = versionStr[1] + '.' + versionStr[3] + '.' + versionStr[5];

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
const styles = StyleSheet.create({
  body: {
    backgroundColor: '#F4F7FA',
    flex: 1,
    width: windowWidth,
  },
  outLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderTopWidth: 1,
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
  menuBox: {
    position: 'absolute',
    right: -3,
    bottom: 4,
    height: 30,
    zIndex: 999,
  },
  rightIcon: {
    width: 28,
    height: 28,
  },
  rightTouch: {
    paddingHorizontal: 20,
  },
  centerBox: {
    display: 'flex',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  itemBox: {
    width: 100,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerItemBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imgBox: {
    position: 'relative',
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  img: {
    width: 50,
    height: 50,
  },
  textBox: {
    color: '#555',
    textAlign: 'center',
  },
  redCircle: {
    position: 'absolute',
    width: 9,
    height: 9,
    top: 2,
    right: 2,
    borderRadius: 9,
    backgroundColor: 'red',
  },
});

const barList = [
  {
    leftTit: getLocale('personalCLink1'),
    urlComponent: 'feedback',
  },
  {
    leftTit: getLocale('personalCLink2'),
    urlComponent: 'aboutUs',
  },
];

const barList3 = [
  {
    leftTit: getLocale('comprehensiveStatistics'),
    urlComponent: 'comprehensiveStatistics',
  },
];

const barList4 = [
  {
    leftTit: getLocale('personalCLink3'),
    urlComponent: 'clearCache',
  },
  {
    leftTit: getLocale('personalCLink4'),
    rightTit: '当前版本：' + versionText,
    urlComponent: 'versions',
  },
];

class PersonalCenter extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('personalCTitle'),
    () => (
      <View
        style={Platform.OS === 'android' ? null : styles.menuBox}
      >
        <TouchableHighlight
          style={styles.rightTouch}
          onPress={() => {
            route.params.showShare();
          }}
        >
          <Image
            style={styles.rightIcon}
            source={setting}
          />
        </TouchableHighlight>
      </View>
    ),
  )

  static propTypes = {
    monitors: PropTypes.object,
    activeMonitor: PropTypes.object.isRequired,
    clearMarks: PropTypes.func,
    getVersion: PropTypes.func.isRequired,
    versionData: PropTypes.object.isRequired,
    versionRamdomNum: PropTypes.number.isRequired,
    navigation: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
    clearMarks: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      personalResult: null,
      load: true,
      ip: '',
      appUrl: '',
      currentUser: null,
      showReadIcon: false, // 控制消息中心小红点显示
      appVersionDetail: '', // 版本更新内容
      isShowShare: false, // 分享弹窗显示
    };

    // 防抖，节流
    this.toUserInfo = throttle(this.headClick, 500);// 个人资料
    this.toSystemSetting = throttle(this.systemSetting, 500);// 系统设置
    this.toListBarClick = throttle(this.listBarClick, 500);// 关于我们,意见反馈
    this.toListBarClick2 = throttle(this.listBarClick2, 500);// 修改密码

    if (Platform.OS === 'android') {
      this.deviceEventListener = DeviceEventEmitter.addListener('onScanningResult', this.onScanningResult);
    }

    // 消息中心是否有到期消息提醒
    this.getRemind();
  }

  componentDidMount () {
    this.getStorgetIp();
    this.getStorgetSetting();
    const { navigation } = this.props;
    navigation.setParams({
      showShare: this.showShare,
    });
  }

  componentWillUnmount () {
    if (Platform.OS === 'android') {
      this.deviceEventListener.remove();
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { versionData, versionRamdomNum } = nextProps;
    const { versionRamdomNum: prevVersionRamdomNum } = this.props;
    const versionObj = JSON.parse(JSON.stringify(versionData));
    if (versionObj !== {} && versionObj.success && versionObj.obj === null
      && versionRamdomNum !== prevVersionRamdomNum) {
      toastShow(versionObj.msg);
    }

    if (versionObj !== {} && versionObj.success && versionObj.obj !== null
      && versionRamdomNum !== prevVersionRamdomNum) {
      const { obj: { url, message } } = versionObj;
      if (Platform.OS === 'ios') {
        Alert.alert(
          '发现新版本', // 提示标题
          '立即安装更新', // 提示内容
          [
            {
              text: getLocale('cancel'),
              style: 'cancel',
            },
            {
              text: getLocale('sure'),
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.canOpenURL('https://itunes.apple.com/cn/app/f3监控/id1442032000?mt=8').then((supported) => {
                    if (!supported) {
                      toastShow('请先安装App Store');
                    } else {
                      Linking.openURL('https://itunes.apple.com/cn/app/f3监控/id1442032000?mt=8');
                    }
                  });
                }
              },
            },
          ],
          { cancelable: false },
        );
      } else {
        const { obj: { version: versionProp } } = versionObj;
        this.setState({
          appUrl: url,
          appVersionDetail: message,
        });

        // Android原生判断本地版本与更新版本差异
        NativeModules.AppVersionModule.judgeUpdate(Math.random(), Number(versionProp));
      }
    }
  }

  // 消息中心是否有到期消息提醒
  getRemind = () => {
    getDueToRemind().then((remindRes) => {
      if (remindRes !== false) {
        getUserStorage().then((res) => {
          if (res) {
            getCurAccont().then((user) => {
              let showReadIcon = false;
              if (res[user] && res[user].messageRemind && res[user].messageRemind.enable) {
                showReadIcon = true;
              }
              this.setState({
                currentUser: user,
                showReadIcon,
              });
            });
          }
        });
      }
    });
  }

  // 获取缓存的ip地址
  async getStorgetIp () {
    let ret = null;
    ret = await getLoginAccont();
    if (ret !== null) {
      const { ip, defaultIp } = ret[0];
      this.setState({
        ip: ip !== '' ? `http://${ip}` : defaultIp,
      });
      return true;
    }
    return null;
  }

  // 获取缓存的app设置
  async getStorgetSetting () {
    let ret = null;
    let settings = null;

    ret = await getUserSetting();
    if (ret) {
      settings = ret;
    } else {
      settings = null;
    }
    this.setState({
      personalResult: settings,
      load: false,
    }, () => {
      this.setImgUrl();
    });
  }

  // 显示隐藏分享弹框
  showShare = () => {
    this.setState({
      isShowShare: true,
    });
  }

  // 版本回调
  onScanningResult = (e) => {
    const { result } = e;
    const { appUrl, appVersionDetail } = this.state;
    const resNum = Number(result);
    if (resNum === 0) {
      toastShow('已是最新版本', { duration: 2000 });
      return;
    }

    const appVersionDetailTXT = appVersionDetail.replace(/\/n/g, '\n');

    if (resNum === 1) {
      Alert.alert(
        '发现新版本', // 提示标题
        appVersionDetailTXT, // 提示内容
        [
          {
            text: getLocale('personalAlertCancle'),
            style: 'cancel',
          },
          {
            text: '更新',
            onPress: () => {
              NativeModules.AppVersionModule.updateApp(Math.random(), 10200, appUrl);
            },
          },
        ],
        { cancelable: false },
      );
    }
    if (resNum === 3 || resNum === 2) {
      Alert.alert(
        '发现新版本', // 提示标题
        '是否立即安装', // 提示内容
        [
          {
            text: getLocale('personalAlertCancle'),
            style: 'cancel',
          },
          {
            text: getLocale('personalAlertSure'),
            onPress: () => {
              NativeModules.AppVersionModule.installApp(Math.random());
            },
          },
        ],
        { cancelable: false },
      );
    }
  }

  // 组装img地址
  setImgUrl = () => {
    const { ip, personalResult } = this.state;

    const img = personalResult ? personalResult.personal.groupAvatar : null;
    if (img) {
      const imgUrl = `${ip}${img}`;
      this.setState({
        imgUrl,
      });
    }
  }

  // 跳转个人中心资料
  headClick = () => {
    go('userInfo');
  }

  // 跳转消息中心
  goExpireMsg = () => {
    go('expireMsg');
  }

  // 系统设置
  goComprehensiveStatistics = () => {
    go('integrativeStatistics');
  }

  // 系统设置
  systemSetting = () => {
    const { personalResult } = this.state;
    go('systemSetting', {
      userName: personalResult.userName,
    });
  }

  // 退出登录
  outLogin = () => {
    this.confirm(getLocale('personalAlertTitle'), getLocale('personalAlertContent'), () => {
      saveLog({ registerType: 2 });
      // 清除本地存储
      storage.remove({
        key: 'loginState',
      }).then(() => {
        const { clearMarks } = this.props;
        setMonitor(null);
        clearMarks();
        reset('login');
      });
    });
  }

  // 提示框
  confirm = (titile, content, callback) => {
    Alert.alert(
      titile, // 提示标题
      content, // 提示内容
      [
        {
          text: getLocale('personalAlertCancle'),
          style: 'cancel',
        },
        {
          text: getLocale('personalAlertSure'),
          onPress: callback,
        },
      ],
      { cancelable: false },
    );
  }

  // 关于我们、意见反馈链接跳转
  listBarClick = (val) => {
    switch (val) {
      case 'feedback':
        go('feedback');
        break;
      case 'aboutUs':
        go('aboutUs');
        break;
      default:
        break;
    }
  }

  // 修改密码
  listBarClick2 = (val) => {
    const { personalResult } = this.state;

    switch (val) {
      case 'changePassword':
        go('changePassword', {
          userName: personalResult.userName,
        });
        break;
      case 'versions':
        break;
      default:
        break;
    }
  }

  // 综合统计，系统设置,消息中心点击
  toListBarClick3 = (val) => {
    switch (val) {
      case 'systemSetting':
        this.toSystemSetting();
        break;
      case 'comprehensiveStatistics':
        this.goComprehensiveStatistics();
        break;
      case 'expireMsg':
        this.goExpireMsg();
        break;
      default:
        break;
    }
  }

  // 清除缓存，检查版本
  toListBarClick4 = (val) => {
    const { currentUser } = this.state;
    switch (val) {
      case 'clearCache':
        toastShow('缓存清除中...\n请稍候', { duration: 2000 });
        // 清除当前用户缓存数据
        getUserStorage().then((res) => {
          if (currentUser) {
            const result = res || {};
            result[currentUser] = null;
            storage.save({
              key: 'userStorage',
              data: result,
            });
          }
        });
        setTimeout(() => {
          toastShow('缓存清除成功');
          this.setState({
            showReadIcon: false,
          });
        }, 2000);
        break;
      case 'versions':
        // NativeModules.AppVersionModule.judgeUpdate(Math.random(),10200);
        // toastShow('版本检查中...\n请稍候', { duration: 2000 });
        // setTimeout(() => {
        //   toastShow('已是最新版本', { duration: 2000 });
        // }, 2000);
        this.getAppVersion();
        break;
      default:
        break;
    }
  }

  getAppVersion = () => {
    const { getVersion } = this.props;
    toastShow('版本检查中...\n请稍候', { duration: 2000 });
    setTimeout(() => {
      const data = {
        version: versionNumber,
        platform: Platform.OS,
      };
      getVersion({ payload: data });
    }, 2000);
  }

  // 关闭分享弹层
  coloseModal = () => {
    this.setState({
      isShowShare: false,
    });
  }

  render () {
    const {
      personalResult,
      load,
      ip,
      imgUrl,
      isShowShare,
      showReadIcon,
    } = this.state;
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }

    return (
      <SafeAreaView 
        style={{ flex: 1, backgroundColor: '#ffffff' }} 
        edges={['right', 'bottom', 'left']}
      >
        <View style={{ flex: 1 }}>

        
        <View style={styles.body}>
          {
            !load ? (
              <ScrollView>
                {
                  (!isEmpty(personalResult) && ip)
                    ? (
                      <View style={{ flex: 1 }}>
                        <CenterHeader
                          img={imgUrl}
                          phone={personalResult.userName}
                          company={personalResult.groupName}
                          headClick={this.toUserInfo}
                        />
                        <View style={styles.centerBox}>
                          <TouchableOpacity
                            onPress={() => { this.toListBarClick3('expireMsg'); }}
                            activeOpacity={0.6}
                            style={styles.itemBox}
                          >
                            <View style={styles.imgBox}>
                              <Image
                                resizeMode="contain"
                                style={styles.img}
                                source={notice}
                              />
                              {showReadIcon
                                ? <View style={styles.redCircle} />
                                : null
                              }
                            </View>
                            <Text style={styles.textBox}>
                              {getLocale('noticeTxt')}
                            </Text>
                          </TouchableOpacity>
                          <View style={styles.centerItemBox}>
                            <TouchableOpacity
                              onPress={() => { this.toListBarClick2('changePassword'); }}
                              activeOpacity={0.6}
                              style={styles.itemBox}
                            >
                              <View style={styles.imgBox}>
                                <Image
                                  resizeMode="contain"
                                  style={styles.img}
                                  source={pwd}
                                />
                              </View>
                              <Text style={styles.textBox}>
                                {getLocale('personalCLink5')}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            onPress={() => { this.toListBarClick3('systemSetting'); }}
                            activeOpacity={0.6}
                            style={styles.itemBox}
                          >
                            <View style={styles.imgBox}>
                              <Image
                                resizeMode="contain"
                                style={styles.img}
                                source={settingOne}
                              />
                            </View>
                            <Text style={styles.textBox}>
                              {getLocale('personalCSystemSet')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <ListBar barList={barList3} clickFun={this.toListBarClick3} />
                        <ListBar barList={barList} clickFun={this.toListBarClick} />
                        <ListBar barList={barList4} clickFun={this.toListBarClick4} />
                        <TouchableHighlight
                          onPress={this.outLogin}
                          underlayColor="transparent"
                        >
                          <View style={styles.outLogin}>
                            <Text style={styles.textColor}>
                              {getLocale('personalCLoginOut')}
                            </Text>
                          </View>
                        </TouchableHighlight>
                      </View>
                    )
                    : null
                }
              </ScrollView>

            ) : <Loading type="page" />
          }

          {/* 分享 */}
          <ShareComponent
            slideUp={isShowShare}
            coloseModal={this.coloseModal}
          />

          {/* 底部菜单栏 */}
          <ToolBar
            activeMonitor={activeMonitor}
            monitors={monitors}
          />
        </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    versionData: state.getIn(['personalCenterReducers', 'versionData']),
    versionRamdomNum: state.getIn(['personalCenterReducers', 'versionRamdomNum']),
  }),
  dispatch => ({
    clearMarks: () => {
      dispatch({ type: 'HOME/CLEARMARKERSDATA' });
    },
    getVersion: (payload) => {
      dispatch({ type: 'PERSONAL/SAGA/VERSION', payload });
    },
  }),
)(PersonalCenter);
