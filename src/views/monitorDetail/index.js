import React, { Component } from 'react';
import { is, Map } from 'immutable';
import { connect } from 'react-redux';
import {
  ScrollView, Clipboard, StyleSheet, View, Linking, Text, Image,
  TouchableOpacity,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PropTypes } from 'prop-types';
import { getLocale } from '../../utils/locales';
import storage from '../../utils/storage';
import { getUserStorage, getCurAccont } from '../../server/getStorageData';

import Loading from '../../common/loading';
// import PublicNavBar from '../../common/newPublicNavBar';// 顶部导航
// import ToolBar from '../../common/toolBar';
import Cell from './componentCell';
import CellTitle from './componentTitle';
import wCopy from '../../static/image/wCopy.png';
import wPhone from '../../static/image/wPhone.png';
import collect from '../../static/image/collect.png';
import collectActive from '../../static/image/collectActive.png';
// import { toastShow } from '../../utils/toastUtils';// 导入toast
import BackIcon from '../../static/image/goBack.png';
import Toast from '../../common/commonAlert';
// import { toastShow } from '../../utils/toastUtils';// 导入toast
const windowHeight = Dimensions.get('window').height; // 获取屏幕宽度

const styles = StyleSheet.create({
  header: {
    height: Platform.OS !== 'ios' ? 58 : 65,
    backgroundColor: '#339eff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  title: {
    width: 200,
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
  },
  leftIcon: {
    // width: 30,
    // height: 30,
    position: 'absolute',
    left: 5,
    bottom: 15,
    zIndex: 999,
  },
  leftIconImage: {
    // width: 20,
    height: 20,
  },
  rightIcon: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    zIndex: 999,
  },
  rightIconImage: {
    width: 20,
    height: 20,
  },
  container: {
    flex: 1,
  },
  tipView: {
    position: 'absolute',
    left: '50%',
    top: windowHeight / 2 - 20,
    right: 0,
    width: 130,
    marginLeft: -65,
    zIndex: 999,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 4,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  tipText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
});

let timer = null;
class Index extends Component {
  // 顶部导航
  // static navigationOptions = ({ navigation }) => PublicNavBar(
  //   navigation,
  //   navigation.state.params.title,
  // )

  static propTypes = {
    mId: PropTypes.string.isRequired,
    // navigation: PropTypes.object.isRequired,
    mName: PropTypes.string.isRequired,
    monitorDetail: PropTypes.object.isRequired,
    monitorDetailAction: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    // monitors: PropTypes.object.isRequired,
    // activeMonitor: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      basicInfo: {},
      simcardInfo: {},
      deviceInfo: {},
      employeeInfo: {},
      showToast: false,
      toastTxt: '',
      userName: '', // 用户名
      isCollect: false, // 是否已关注
      tipText: '',
    };

    const {
      monitorDetailAction, mId,
    } = props;

    monitorDetailAction({
      id: mId,
    });
    this.changeMonitorCollect();
    this.createpanResponder();
    getCurAccont().then((userName) => {
      this.state.userName = userName;
    });
  }

  // componentDidMount() {
  //   const {
  //     monitorDetailAction, mId, mName
  //   } = this.props;

  //   // 标题
  //   // navigation.setParams({
  //   //   title: mName,
  //   // });

  //   // 获取详情接口数据
  //   monitorDetailAction({
  //     id: mId,
  //   });
  // }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { monitorDetail } = nextProps;

    if (monitorDetail.size > 0) {
      this.changeMonitorCollect();
      this.setState({
        type: monitorDetail.get('type'),
        basicInfo: monitorDetail.get('basic'), // 基本信息
        simcardInfo: monitorDetail.get('simcard'), // sim卡
        deviceInfo: monitorDetail.get('device'), // 终端
        employeeInfo: monitorDetail.get('employee'), // 从业人员
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount() {
    clearTimeout(timer);
  }

  // 物
  getThing = info => (
    <View>
      <Cell
        title={getLocale('thingTit1')}
        content={info.get('name')}
      />
      <Cell
        title={getLocale('thingTit2')}
        content={info.get('category')}
      />
      <Cell
        title={getLocale('thingTit3')}
        content={info.get('type')}
      />
      <Cell
        title={getLocale('thingTit4')}
        content={info.get('brand')}
      />
      <Cell
        title={getLocale('thingTit5')}
        content={info.get('number')}
      />
    </View>
  )

  // 人
  getPeople = info => (
    <View>
      <Cell
        title={getLocale('peopleTit1')}
        content={info.get('name')}
      />
      <Cell
        title={getLocale('peopleTit2')}
        content={info.get('id')}
      />
      <Cell
        title={getLocale('peopleTit3')}
        content={info.get('gender')}
      />
      <Cell
        title={getLocale('peopleTit4')}
        content={info.get('phone')}
        icon={info.get('phone') ? wPhone : null}
        onPressIcon={info.get('phone') ? () => this.phoneCall(info.get('phone')) : null}
      />
    </View>
  )

  // 车
  getVehicle = info => (
    <View>
      <Cell
        title={getLocale('vehicleTit1')}
        content={info.get('owner')}
      />
      <Cell
        title={getLocale('vehicleTit2')}
        content={info.get('phone')}
        icon={info.get('phone') ? wPhone : null}
        onPressIcon={info.get('phone') ? () => this.phoneCall(info.get('phone')) : null}
      />
      <Cell
        title={getLocale('vehicleTit3')}
        content={info.get('category')}
      />
      <Cell
        title={getLocale('vehicleTit4')}
        content={info.get('type')}
      />
    </View>
  )

  // 获取监控对象类型
  getType = () => {
    const { type, basicInfo } = this.state;
    let info = null;
    let view = null;

    if (type === '0') { // 车
      info = basicInfo.get('vehicle');
      view = this.getVehicle(info);
    } else if (type === '1') { // 人
      info = basicInfo.get('people');
      view = this.getPeople(info);
    } else if (type === '2') { // 物
      info = basicInfo.get('thing');
      view = this.getThing(info);
    }

    return view;
  }

  // 复制
  copy = (title, content) => {
    if (!content) {
      return;
    }
    Clipboard.setString(content);
    const toastTxt = title.replace(/:/, '');
    this.setState({
      toastTxt,
      showToast: true,
    });
  }

  // 电话拨号
  phoneCall = (url) => {
    const phone = `tel:${url}`;
    Linking.canOpenURL(phone).then((res) => {
      if (!res) {
        this.setState({
          toastTxt: getLocale('callToast'),
          showToast: true,
        });
        return false;
      }
      return Linking.openURL(phone);
    });
  }

  // 终端通讯类型
  endType = (type) => {
    let value = '';
    let newType = type;
    if (typeof type !== 'string') {
      newType = type.toString();
    }
    switch (newType) {
      case '0':
        value = '交通部JT/T808-2011(扩展)';
        break;
      case '1':
        value = '交通部JT/T808-2013';
        break;
      case '2':
        value = '移为';
        break;
      case '3':
        value = '天禾';
        break;
      case '5':
        value = 'BDTD-SM';
        break;
      case '6':
        value = 'KKS';
        break;
      case '8':
        value = 'BSJ-A5';
        break;
      case '9':
        value = 'ASO';
        break;
      case '10':
        value = 'F3超长待机';
        break;
      case '11':
        value = '交通部JT/T808-2019';
        break;
      case '12':
        value = '交通部JT/T808-2013(川标)';
        break;
      case '13':
        value = '交通部JT/T808-2013(冀标)';
        break;
      case '14':
        value = '交通部JT/T808-2013(桂标)';
        break;
      case '15':
        value = '交通部JT/T808-2013(苏标)';
        break;
      case '16':
        value = '交通部JT/T808-2013(浙标)';
        break;
      case '17':
        value = '交通部JT/T808-2013(吉标)';
        break;
      case '18':
        value = '交通部JT/T808-2013(陕标)';
        break;
      case '19':
        value = '交通部JT/T808-2013(赣标)';
        break;
      case '20':
        value = '交通部JT/T808-2019(沪标)';
        break;
      case '21':
        value = '交通部JT/T808-2019(中位)';
        break;
      case '22':
        value = 'KKS-EV25';
        break;
      case '23':
        value = 'JT/T808-2011(1078报批稿)';
        break;
      case '24':
        value = '交通部JT/T808-2019(京标)';
        break;
      case '25':
        value = '交通部JT/T808-2019(黑标)';
        break;
      case '26':
        value = '交通部JT/T808-2019(鲁标)';
        break;
      case '27':
        value = '交通部JT/T808-2013(湘标)';
        break;
      case '28':
        value = '交通部JT/T808-2019(粤标)';
        break;
      default:
        break;
    }

    return value;
  }

  // 手势触摸操作
  createpanResponder = () => {
    const {
      onRequestClose,
    } = this.props;
    const that = this;

    this.panResponderObj2 = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        onRequestClose();
      },
      onPanResponderTerminationRequest: () => true,
    });
    this.panResponderObj3 = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        const { isCollect } = this.state;
        that.changeMonitorCollect(!isCollect);
      },
      onPanResponderTerminationRequest: () => true,
    });
  }

  /**
   * 改变监控对象关注状态
   * @param {*} status
   * status为undefined,表示初次进入页面,用于获取监控对象是否被关注的状态
   */
  changeMonitorCollect = (status) => {
    getUserStorage().then((res) => {
      const { userName } = this.state;
      const { mId } = this.props;
      const result = res || {};
      if (userName) {
        if (result[userName] && result[userName].collect) {
          if (status === undefined) {
            this.setState({
              isCollect: result[userName].collect.indexOf(mId) !== -1,
            });
            return;
          }
          const index = result[userName].collect.indexOf(mId);
          if (status) {
            if (index !== -1) {
              result[userName].collect.splice(index, 1);
            }
            result[userName].collect.unshift(mId);
            const len = result[userName].collect.length;
            if (len > 10) { // 最多只能关注10个监控对象
              result[userName].collect.splice(len - 1, 1);
            }
          } else {
            result[userName].collect.splice(index, 1);
          }
        } else {
          if (!result[userName]) {
            result[userName] = {};
          }
          result[userName].collect = [mId];
        }
      }
      if (status === undefined) {
        this.setState({
          isCollect: false,
        });
        return;
      }
      storage.save({
        key: 'userStorage',
        data: result,
      });
      this.setState({
        isCollect: status,
        tipText: status ? '关注成功' : '您已取消关注',
      });
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.setState({
          tipText: '',
        });
      }, 2000);
    });
  }

  render() {
    const { mName } = this.props;
    const {
      basicInfo,
      simcardInfo,
      deviceInfo,
      employeeInfo,
      showToast,
      toastTxt,
      isCollect,
      tipText,
    } = this.state;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          <View style={{ flex: 1 }}>
            {!Map.isMap(basicInfo)
              ? (<Loading type="page" />)
              : (
                <View style={{ flex: 1 }}>
                  {tipText
                    ? <View style={styles.tipView}><Text style={styles.tipText}>{tipText}</Text></View>
                    : null}
                  <View style={styles.header}>
                    <Text style={styles.title}>{mName}</Text>
                    <View
                      style={styles.leftIcon}
                      {...this.panResponderObj2.panHandlers}
                    >
                      <Image source={BackIcon} resizeMode="contain" style={styles.leftIconImage} />
                    </View>
                    <View
                      style={styles.rightIcon}
                      {...this.panResponderObj3.panHandlers}
                    >
                      <Image
                        source={isCollect ? collectActive : collect}
                        style={styles.rightIconImage}
                      />
                    </View>
                  </View>
                  <ScrollView style={{ flex: 1 }}>
                    {/* 1对象基本信息 */}
                    <CellTitle title={getLocale('groupTit1')} />
                    <Cell
                      title={getLocale('basicTit1')}
                      content={basicInfo.get('group')}
                    />
                    <Cell
                      title={getLocale('basicTit2')}
                      content={basicInfo.get('assign')}
                      icon={basicInfo.get('assign') ? wCopy : null}
                      onPressIcon={() => this.copy(getLocale('basicTit2'), basicInfo.get('assign'))}
                    />

                    {/* 人、车、物基本信息 */}
                    {
                      this.getType()
                    }

                    <Cell
                      title={getLocale('basicTit3')}
                      content={basicInfo.get('createDate') && basicInfo.get('createDate').substr(0, 10)}
                    />
                    <Cell
                      title={getLocale('basicTit4')}
                      content={basicInfo.get('billingDate') && basicInfo.get('billingDate').substr(0, 10)}
                    />
                    <Cell
                      title={getLocale('basicTit5')}
                      content={basicInfo.get('expireDate') && basicInfo.get('expireDate').substr(0, 10)}
                    />

                    {/* 2终端信息 */}
                    <CellTitle title={getLocale('groupTit2')} />
                    <Cell
                      title={getLocale('vehicleTit5')}
                      content={deviceInfo.get('number')}
                      icon={deviceInfo.get('number') ? wCopy : null}
                      onPressIcon={() => this.copy(getLocale('vehicleTit5'), deviceInfo.get('number'))}
                    />
                    <Cell
                      title={getLocale('vehicleTit6')}
                      content={this.endType(deviceInfo.get('type'))}
                    />
                    <Cell
                      title={getLocale('vehicleTit7')}
                      content={simcardInfo.get('imei')}
                      icon={simcardInfo.get('imei') ? wCopy : null}
                      onPressIcon={() => this.copy(getLocale('vehicleTit7'), simcardInfo.get('imei'))}
                    />

                    {/* 3sim卡信息 */}
                    <CellTitle title={getLocale('groupTit3')} />
                    <Cell
                      title={getLocale('simTit1')}
                      content={simcardInfo.get('number')}
                      icon={simcardInfo.get('number') ? wCopy : null}
                      onPressIcon={() => this.copy(getLocale('simTit1'), simcardInfo.get('number'))}
                    />
                    <Cell
                      title={getLocale('simTit2')}
                      content={simcardInfo.get('iccid')}
                      icon={simcardInfo.get('iccid') ? wCopy : null}
                      onPressIcon={() => this.copy(getLocale('simTit2'), simcardInfo.get('iccid'))}
                    />
                    <Cell
                      title={getLocale('simTit3')}
                      content={simcardInfo.get('expireDate') && simcardInfo.get('expireDate').substr(0, 10)}
                    />

                    {/* 4从业人员 */}
                    {
                      Map.isMap(employeeInfo)
                        ? (
                          <View>
                            <CellTitle title={getLocale('groupTit4')} />
                            <Cell
                              title={employeeInfo.get('name')}
                              content={employeeInfo.get('phone')}
                              icon={employeeInfo.get('phone') ? wPhone : null}
                              onPressIcon={employeeInfo.get('phone') ? () => this.phoneCall(employeeInfo.get('phone')) : null}
                            />
                          </View>
                        ) : null
                    }

                  </ScrollView>

                </View>
              )}
          </View>

          {/* 提示框:解决模态框层级挡住toast提示语 */}
          <Toast
            alertText={[`${toastTxt}${getLocale('copyToast')}`]}
            ifShow={showToast}
            hideFun={() => { this.setState({ showToast: false }); }}
          />

          {/* 底部工具栏 */}
          {/* <ToolBar
            activeMonitor={activeMonitor}
            monitors={monitors}
          /> */}
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitorDetail: state.getIn(['monitorDetailReducers', 'monitorDetail']),
    // monitors: state.getIn(['homeReducers', 'markers']),
  }),
  dispatch => ({
    monitorDetailAction: (params) => {
      dispatch({ type: 'monitorDetail/SAGA/GET_MONITORDETAIL_ACTION', params });
    },
  }),
)(Index);