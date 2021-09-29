import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View, Text, StyleSheet, Switch, ScrollView,
  LayoutAnimation, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { getCurAccont, getCheckAlarmType, getAlarmSwitchCurState } from '../../../server/getStorageData';
import storage from '../../../utils/storage';
// import PublicNavBar from '../../../common/publicNavBar';// 顶部导航
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';

import { getLocale } from '../../../utils/locales';
import wArrowRight from '../../../static/image/wArrowRight.png';
// import goBackIco from '../../../static/image/goBack.png';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  leftTouch: {
    padding: 15,
  },
  leftIcon: {
    width: 10,
    height: 20,
  },
  alarmHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderBottomColor: '#e9e9e9',
  },
  alarmHeader: {
    padding: 10,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 14,
    color: 'rgb(120,120,120)',
  },
  switchItem: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    borderBottomColor: 'rgb(245,245,245)',
    borderStyle: 'solid',
    backgroundColor: '#fff',
  },
  alarmTitle: {
    fontSize: 16,
    color: 'rgb(72,72,72)',
  },
  toggleBox: {
    width: 60,
    height: 24,
    marginRight: 12,
    padding: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  toggleOff: {
    width: 29,
    height: 22,
    lineHeight: 22,
    alignItems: 'center',
    textAlign: 'center',
    // paddingTop: 1,
    // paddingLeft: 7,
    color: '#fff',
    fontSize: 14,
    backgroundColor: '#3399ff',
  },
  toggleOn: {
    width: 29,
    height: 22,
    lineHeight: 22,
    alignItems: 'center',
    textAlign: 'center',
    // paddingTop: 2,
    // paddingLeft: 7,
    color: '#3399ff',
    fontSize: 14,
    backgroundColor: '#fff',
  },
  alignCenter: {
    textAlign: 'center',
  },
  noData: {
    marginTop: 30,
    textAlign: 'center',
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
});

class AlarmSwitch extends Component {
  // 顶部导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('alarmSwitchTitle'),
    () => (
      <View style={styles.toggleBox}>
        <Animatable.Text
          animation={route.params.curState ? '' : 'bounceIn'}
          style={route.params.curState ? styles.toggleOff : styles.toggleOn}
          onPress={() => { route.params.toggleState(false); }}
        >
          {getLocale('alarmOff')}
        </Animatable.Text>
        <Animatable.Text
          animation={route.params.curState ? 'bounceIn' : ''}
          style={route.params.curState ? styles.toggleOn : styles.toggleOff}
          onPress={() => { route.params.toggleState(true); }}
        >
          {getLocale('alarmOn')}
        </Animatable.Text>
      </View>
    ),
  )

  static propTypes = {
    navigation: PropTypes.object, // 导航配置
    monitors: PropTypes.object, // 监控对象
    getAlarmSetting: PropTypes.func.isRequired, // 获取报警设置数据方法
    settingData: PropTypes.any, // 报警设置数据
    initStatus: PropTypes.string.isRequired, // 加载状态
    route: PropTypes.object.isRequired,
    reset: PropTypes.object.isRequired,
  }

  // 属性默认值
  static defaultProps = {
    monitors: null,
    navigation: null,
    settingData: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      switchData: [],
      isSelect: 0, // 折叠列表默认展开项
      stateArr: [], // 存放全部报警类型
      checkArr: [], // 放置开启状态的switch选项
      toggleState: true,
      goTopFlag: true,
    };
    // 获取用户在后台配置的信息
    getCurAccont().then((res) => {
      this.state.userName = res;
      this.getSettingData();
    });
  }

  // 组件加载完毕执行
  componentDidMount = () => {
    const { navigation } = this.props;
    getAlarmSwitchCurState().then((payload) => {
      getCurAccont().then((res) => {
        let curState = true;
        if (payload) {
          curState = payload[res] === undefined || payload[res] ? true : false;
        }
        navigation.setParams({
          curState, // 导航条右侧默认开关状态
          toggleState: this.toggleState, // 切换开关状态方法
        });
      });
    });
    
  }

  // props改变时触发
  UNSAFE_componentWillReceiveProps (nextProps) {
    const { settingData } = nextProps;
    const { toggleState } = this.state;
    //  [{
    //   category:'平台报警',
    //   value:[{
    //       name:'异动报警',
    //       type:1,
    //     }]
    //  }]
    // 组装报警设置数据(样式如上:)
    if (toggleState) {
      if (settingData.size > 0 && settingData.get('obj').get('settings').size > 0) {
        const storageCheck = settingData.get('storageData');
        const oldCheckArr = storageCheck;
        let checkArr = [];
        if (storageCheck !== null) {
          checkArr = [...settingData.get('storageData')];// 勾选的switch集合
        }
        const arr = [...settingData.get('obj').get('settings')];// 后台switch配置
        const len = arr.length;
        const newArr = [];// 放置组装好的开关信息
        let index = null;
        const stateArr = [];// 放置全部开关状态
        const newState = this.state;
        for (let i = 0; i < len; i += 1) {
          const obj = {
            category: arr[i].get('category'),
            value: [{
              name: arr[i].get('name'),
              type: arr[i].get('type'),
            }],
          };
          const type = `switch${arr[i].get('type')}`;
          if (oldCheckArr === null) {
            checkArr.push(type);
            newState[type] = true;// switch开启
          } else {
            const curIndex = checkArr.indexOf(type);
            if (curIndex > -1) {
              newState[type] = true;// switch开启
            } else {
              newState[type] = false;// switch关闭
            }
          }
          stateArr.push(type);
          index = null;
          const newLen = newArr.length;
          for (let j = 0; j < newLen; j += 1) {
            if (newArr[j].category === arr[i].get('category')) {
              index = j;
              break;
            }
          }
          if (index === null) {
            newArr.push(obj);
          } else {
            newArr[index].value.push(obj.value[0]);
          }
          index = null;
        }
        newState.checkArr = checkArr;
        newState.switchData = newArr;
        newState.stateArr = stateArr;
        this.setState(newState);
      } else {
        this.setState({
          switchData: [],
        });
      }
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 保存用户配置开关信息到缓存
  setCheckSwitch = async (checkArr) => {
    const { userName, stateArr } = this.state;
    getCheckAlarmType().then((checkType) => {
      let obj = {};
      if (checkType !== null) {
        obj = checkType;
      }
      obj[userName] = {
        checkArr,
        allType: stateArr,
      };
      storage.save({
        key: 'checkSwitch',
        data: obj,
      });
    });
  }

  componentWillUnmount () {
    const { reset } = this.props;
    reset();
  }

  // 获取报警开关配置信息
  getSettingData () {
    const { getAlarmSetting } = this.props;
    getAlarmSetting();
  }

  // header点击折叠展开
  itemTap = (index) => {
    // 点击的item如果是同一个, 就置为初始状态-1, 也就是折叠的状态
    let select = index;
    const { isSelect } = this.state;
    if (isSelect === index) {
      select = -1;
    }

    // 折叠展开动画效果
    // LayoutAnimation.easeInEaseOut();
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    this.setState({
      isSelect: select,
      goTopFlag: true,
    });
  }

  // 导航右侧切换全部开关状态功能
  toggleState = (state) => {
    const { navigation } = this.props;
    const { stateArr, userName } = this.state;
    navigation.setParams({
      curState: state,
    });
    getAlarmSwitchCurState().then((payload) => {
      let obj = {};
      if (payload) {
        payload[userName] = state;
        obj = payload;
      } else {
        obj[userName] = state;
      }
      
      storage.save({
        key: 'alarmSwitchCurState',
        data: obj,
      });
    });
    
    const newState = this.state;
    const len = stateArr.length;
    for (let i = 0; i < len; i += 1) {
      newState[`${stateArr[`${i}`]}`] = state;
    }
    let checkArr = [];
    if (state) {
      checkArr = stateArr;
    } else {
      checkArr = [];
    }
    newState.checkArr = checkArr;
    newState.toggleState = false;
    newState.goTopFlag = false;
    this.setCheckSwitch(checkArr);
    this.setState(newState);
  }

  // 改变switch状态
  changeSwitch = (value, innerItem) => {
    const newState = this.state;
    const { checkArr } = this.state;
    const type = `switch${innerItem.type}`;// 组装每个开关对应的state
    newState[`${type}`] = value;
    const arr = checkArr;// 存放勾选的switch
    const curIndex = arr.indexOf(`${type}`);
    if (value) {
      if (curIndex === -1) {
        arr.push(type);
      }
    } else if (curIndex > -1) {
      arr.splice(curIndex, 1);
    }
    newState.checkArr = arr;
    newState.goTopFlag = false;
    this.setCheckSwitch(arr);
    this.setState(newState);
  }

  // 渲染item
  renderItem = (item, index) => {
    const { isSelect } = this.state;// 当前展开项
    return (
      <View key={index}>
        <TouchableOpacity
          style={styles.alarmHeaderBox}
          activeOpacity={0.6}
          onPress={() => { this.itemTap(index); }}
        >
          <Text
            style={styles.alarmHeader}
          >
            {item.category}
          </Text>
          <Animatable.Image
            duration={300}
            transition="rotate"
            source={wArrowRight}
            style={[styles.panel_icon, isSelect === index ? styles.rotate : null]}
          />
        </TouchableOpacity>
        {isSelect === index
          ? (
            <View>
              {item.value.map((innerItem) => {
                /* eslint react/destructuring-assignment:off */
                const switchValue = this.state[`switch${innerItem.type}`];
                return (
                  <View
                    key={innerItem.type}
                    style={styles.switchItem}
                  >
                    <Text style={styles.alarmTitle}>
                      {innerItem.name}
                    </Text>
                    <Switch
                      onTintColor="rgb(53,155,255)"
                      thumbTintColor={Platform.OS === 'android' ? '#fff' : ''}
                      onValueChange={(value) => {
                        this.changeSwitch(value, innerItem);
                      }}
                      value={switchValue}
                    />
                  </View>
                );
              })}
            </View>
          ) : null}
      </View>
    );
  }

  render () {
    const { monitors, initStatus, route: { params } } = this.props;
    const { switchData, goTopFlag } = this.state;
    let activeMonitor;
    if (params) {
      const { activeMonitor: A } = params.activeMonitor;
      activeMonitor = A;
    }

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          {
            initStatus === 'start' ? <Loading type="page" /> : null
          }
          <ScrollView
            ref={(view) => {
              if (view !== null && goTopFlag) {
                setTimeout(() => {
                  view.scrollTo({ x: 0, y: 0, animated: true });
                }, 0);
              }
            }}
            style={styles.container}
          >
            {switchData.map((item, index) => (
              this.renderItem(item, index)
            ))}
            {
              (switchData.length === 0 && initStatus === 'end')
                ? <Text style={styles.noData}>{getLocale('noAlarmData')}</Text>
                : null
            }
          </ScrollView>
          <ToolBar
            monitors={monitors}
            activeMonitor={activeMonitor}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    settingData: state.getIn(['alarmSwitchReducers', 'settingData']),
    initStatus: state.getIn(['alarmSwitchReducers', 'initStatus']),
  }),
  dispatch => ({
    // 获取报警设置数据
    getAlarmSetting: (payload) => {
      dispatch({ type: 'alarmSwitch/SAGA/GETDATA_ACTION', payload });
    },
    reset: () => {
      dispatch({ type: 'alarmSwitch/RESET_DATA' });
    },
  }),
)(AlarmSwitch);