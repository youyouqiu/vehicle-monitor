/* eslint react/sort-comp :off */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  TouchableHighlight,
  Image, Text, Alert,
  TouchableOpacity,
  Keyboard,
  Platform, PanResponder,
  FlatList, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import * as Animatable from 'react-native-animatable';
import * as timeFormat from 'd3-time-format';
import { getCurAccont, getClearAlarmTime } from '../../../server/getStorageData';
import { go } from '../../../utils/routeCondition';
import storage from '../../../utils/storage';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';
import { toastShow } from '../../../utils/toastUtils';// 导入toast
// import storage from '../../../utils/storage';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import AlarmObjNum from './alarmObjNum';// 顶部显示报警数量组件
import MonitorSearch from './monitorObjSearch';// 监控对象搜索组件
import AlarmItem from './alarmItem';// 报警对象信息列表组件

import { getLocale } from '../../../utils/locales';
import setting from '../../../static/image/setting2.png';
import reverse from '../../../static/image/reverse2.png';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
const timeFormatorH = timeFormat.timeFormat('%H:%M:%S');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigator: {
    backgroundColor: 'rgb(55,152,249)',
  },
  header: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  leftTouch: {
    padding: 15,
  },
  leftIcon: {
    width: 10,
    height: 20,
  },
  rightTouch: {
    // paddingHorizontal: 20,
    paddingRight: 20,
    paddingLeft: 15,
  },
  rightTouch2: {
    // paddingHorizontal: 20,
    paddingRight: 15,
    paddingLeft: 20,
  },
  rightIcon: {
    width: 20,
    height: 20,
  },
  wrapper: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  menuBox: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    height: 30,
    zIndex: 999,
  },
  rightMenu: {
    position: 'absolute',
    right: 5,
    top: 2,
    zIndex: 9999,
    // width: 98,
    paddingTop: 3,
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: -6,
    right: 20,
    borderWidth: 6,
    borderColor: 'transparent',
    borderBottomColor: '#fff',
  },
  menuItem: {
    height: 30,
    padding: 5,
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 0,
    color: 'rgb(53,155,255)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  menuItemBottom: {
    marginTop: -1,
  },
  hide: {
    position: 'absolute',
    right: -500,
  },
  alignCenter: {
    color: '#999',
    textAlign: 'center',
  },
  refreshBox: { backgroundColor: '#339eff', margin: 0, padding: 0 },
  noData: {
    marginTop: 30,
    textAlign: 'center',
  },
  headerBg: {
    position: 'absolute',
    top: -200,
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#339eff',
  },
  navItem: {
    display: 'flex',
    flexWrap: 'nowrap',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

// loading样式
const loadingStyle = (
  <View style={{ alignItems: 'center' }}>
    <Loading type="inline" color="rgb(54,176,255)" />
  </View>
);
class AlarmCenter extends Component {
  // 顶部导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('alarmCenterTitle'),
    () => (
      <View
        style={[Platform.OS === 'android' ? null : styles.menuBox, styles.navItem]}
      >
        <TouchableHighlight
          underlayColor="transparent"
          style={styles.rightTouch2}
          onPress={() => {
            route.params.reverseItem();
          }}
        >
          <Image
            style={styles.rightIcon}
            source={reverse}
          />
        </TouchableHighlight>
        <TouchableHighlight
          underlayColor="transparent"
          style={styles.rightTouch}
          onPress={() => {
            route.params.goToItem();
          }}
        >
          <Image
            style={styles.rightIcon}
            source={setting}
          />
        </TouchableHighlight>
      </View>
    ),
  );

  static propTypes = {
    navigation: PropTypes.object,
    getAlarmData: PropTypes.func.isRequired,
    alarmData: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    monitors: PropTypes.object,
    activeMonitor: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
  }

  // 属性默认值
  static defaultProps = {
    monitors: null,
    navigation: null,
    alarmData: {},
  }

  constructor(props) {
    super(props);

    this.state = {
      getDataState: false,
      alarmNum: 0, // 报警对象数量
      dataArr: [], // 报警数据
      oldDataArr: [],
      pageCount: 1, // 当前页
      oldPageCount: 1, // 存储未模糊搜索时的页码
      pageSize: 10, // 每页显示数量
      showFooter: 0, // 控制列表底部显示文本
      menuState: false, // 顶部导航设置图标是否可点击
      searchText: '', // 模糊查询条件
      isSearch: false, // 是否模糊查询
      isPullTop: false, // 是否可上拉加载
      queryStartTime: null, // 报警查询开始时间
      queryAlarmType: null, // 报警类型
      clearAlarmTime: null, // 清除报警数据时间
      queryEndTime: null, // 上拉加载时的查询结束时间
      loadingType: true, // 加载动画样式
      showState: false, // 显示导航栏右侧菜单
      isLoading: false, // 显示下拉刷新加载动画
      refNowTime: '', // 截止时间
      clearType: false, // 清空搜索框
    };
    this.createpanResponder();
    this.getData();
  }

  // 组件加载完毕执行
  componentDidMount = () => {
    const { navigation } = this.props;
    const nowTime = timeFormatorH(new Date()); // 当前时间hms
    navigation.setParams({
      // showMenu: this.showMenu,
      reverseItem: this.reverseItem,
      goToItem: this.goToItem,
    });
    this.setState({
      refNowTime: nowTime,
    });
  }

  // props改变时触发
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { alarmData, initStatus } = nextProps;
    const {
      // getDataState,
      pageCount, pageSize,
      dataArr, alarmNum, searchText, oldPageCount,
    } = this.state;
    // if (getDataState) {
    if (alarmData.size > 0) {
      let newData = [];
      if (pageCount === 1) { // 下拉刷新
        newData = [...alarmData.get('data')];
        if (alarmData.get('setting') !== null) { // 保存缓存中的配置信息
          const settingInfo = alarmData.get('setting');
          this.setState({
            queryAlarmType: settingInfo.get('alarmType'),
            queryStartTime: settingInfo.get('newStartTime'),
            clearAlarmTime: settingInfo.get('clearAlarmTime'),
          });
        }
      } else { // 上拉加载
        newData = dataArr.concat([...alarmData.get('data')]);
      }
      const newCount = alarmData.get('count');
      this.setState({
        alarmNum: newCount === null ? alarmNum : newCount,
        dataArr: newData,
        showFooter: 1,
        isLoading: false,
        isPullTop: false,
        menuState: true,
      });
      if (searchText === '') {
        this.setState({
          oldDataArr: newData,
        });
      }
      if (alarmData.get('data').size >= pageSize) {
        this.setState({
          isPullTop: true,
          showFooter: 0,
          pageCount: pageCount + 1,
        });
        if (searchText === '') {
          this.setState({
            oldPageCount: oldPageCount + 1,
          });
        }
      }
    } else if (initStatus === 'end') { // 已到最后一页
      if (pageCount === 1) {
        this.setState({
          alarmNum: 0,
          dataArr: [],
        });
        if (searchText === '') {
          this.setState({
            oldDataArr: [],
          });
        }
      }
      this.setState({
        showFooter: 1,
        isLoading: false,
        isPullTop: false,
        menuState: true,
      });
    }
    // }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 监听搜索条件变化
  onChanegeTextKeyword = (text) => {
    this.setState({
      searchText: text,
    });
  }

  // 上拉加载
  onEndReached = () => {
    const { showFooter, isPullTop } = this.state;
    // 如果是正在加载中或没有更多数据了，则返回
    if (showFooter !== 0 || !isPullTop) {
      return;
    }
    this.setState({
      showFooter: 2,
      loadingType: false,
    });
    this.getData(null);
  }

  // 点击搜索框清空图标时恢复数据
  resetData = () => {
    const { oldDataArr, pageSize, oldPageCount } = this.state;
    const len = oldDataArr.length;
    if (len !== 0 && len % pageSize === 0) {
      this.setState({
        isPullTop: true,
        showFooter: 0,
        pageCount: oldPageCount,
      });
    }
    this.setState({
      dataArr: oldDataArr,
    });
  }

  // 获取报警对象信息
  getData = (indexCount) => {
    // this.state.getDataState = true;
    const nowTime = timeFormator(new Date());// 当前时间
    if (indexCount && indexCount !== null) {
      this.state.pageCount = indexCount;
      this.state.loadingType = false;
    }
    if (indexCount !== null) {
      this.state.queryEndTime = nowTime;
    }
    const { getAlarmData } = this.props;
    const {
      pageCount, pageSize, isSearch, searchText,
      queryStartTime, queryAlarmType, queryEndTime,
    } = this.state;
    const fuzzyParam = isSearch ? searchText : '';
    const param = {
      alarmType: queryAlarmType,
      startTime: queryStartTime,
      endTime: indexCount === null ? queryEndTime : nowTime,
      page: indexCount || pageCount,
      pageSize,
      fuzzyParam,
    };
    getAlarmData(param);
  }

  // 清空报警数据
  clearAlarmData = () => {
    Alert.alert(getLocale('clearAlarm'), getLocale('isClearAlarm'), [
      {
        text: getLocale('personalCAlert3'),
        onPress: async () => {
          this.setState({
            alarmNum: 0,
            isPullTop: false,
            dataArr: [],
          });
          getClearAlarmTime().then((res) => {
            const dataObj = res || {};
            getCurAccont().then((userName) => {
              dataObj[userName] = { time: timeFormator(new Date()) };
              storage.save({
                key: 'clearAlarmTime',
                data: dataObj,
              });
              toastShow(getLocale('clearAlarmSuccess'), { duration: 2000 });
            });
          });
        },
      },
      {
        text: getLocale('personalCAlert4'),
        onPress: () => { },
      },
    ]);
  }

  // 右侧顶部刷新按钮
  reverseItem = () => {
    const { initStatus } = this.props;
    if (initStatus === 'start') return;
    const nowTime = timeFormatorH(new Date()); // 当前时间hms
    this.setState({
      clearType: true,
      refNowTime: nowTime,
      oldPageCount: 1,
      isSearch: false,
    }, () => {
      this.pullDownRefresh();
      this.setState({
        clearType: false,
      });
    });
  };

  // 右侧顶部跳转按钮
  goToItem = () => {
    const { searchText } = this.state;
    go('alarmSwitch', {
      searchText,
      getData: this.getData,
    });
    Keyboard.dismiss();
  }

  // 控制导航右侧设置菜单显示隐藏
  // showMenu = () => {
  //   const { menuState, showState } = this.state;
  //   if (menuState) {
  //     this.setState({
  //       getDataState: !showState,
  //       showState: !showState,
  //     });
  //   }
  // }

  // 隐藏导航右侧设置菜单
  hideMenu = () => {
    this.setState({
      // getDataState: false,
      showState: false,
    }, () => {
      Keyboard.dismiss();
    });
  }

  // 下拉刷新
  pullDownRefresh = () => {
    const { searchText } = this.state;
    this.setState({
      showFooter: 2,
      isLoading: true,
    });
    if (searchText === '') {
      this.setState({
        oldPageCount: 1,
      });
    }
    this.getData(1);
  }

  // 点击搜索按钮进行模糊查询操作
  searchAlarm = () => {
    const { searchText } = this.state;
    if (searchText !== '') {
      this.setState({
        dataArr: [],
        isSearch: true,
        pageCount: 1,
        showFooter: 1,
        loadingType: true,
      }, () => {
        const reg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{0,20}$/;// 输入框输入限制
        if (!reg.test(searchText)) {
          this.setState({
            dataArr: [],
          });
          return;
        }
        this.getData(null);
      });
    } else {
      this.resetData();
    }
    Keyboard.dismiss();
  }

  // 手势触摸操作
  createpanResponder = () => {
    this.panResponder = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => {
        this.hideMenu();
      },
    });
  }

  // 列表顶部
  renderHeader = () => {
    const { alarmNum, refNowTime, clearType } = this.state;
    return (
      <View>
        <View style={styles.headerBg} />
        <View {...this.panResponder.panHandlers}>
          <AlarmObjNum num={alarmNum} nowTime={refNowTime} />
        </View>
        <MonitorSearch
          onChanegeTextKeyword={this.onChanegeTextKeyword}
          searchFun={this.searchAlarm}
          resetData={this.resetData}
          clearType={clearType}// 手动清空
        />
      </View>
    );
  }

  // 底部显示样式
  renderFooter = () => {
    const { showFooter, isPullTop } = this.state;
    if (showFooter === 2 && isPullTop) {
      return loadingStyle;
    }
    return null;
  }

  // 列表item样式
  renderRow = (item) => {
    const { queryAlarmType, queryStartTime, clearAlarmTime } = this.state;
    const settingInfo = {
      queryAlarmType, queryStartTime, clearAlarmTime,
    };
    return (
      <AlarmItem
        item={item.item}
        settingInfo={settingInfo}
        hideMenu={this.hideMenu}
      />
    );
  }

  // 绑定flatList组件
  getRef = (flatList) => {
    // eslint-disable-next-line no-underscore-dangle
    this._flatList = flatList;
    // eslint-disable-next-line no-underscore-dangle
    const reObj = this._flatList;
    return reObj;
  }

  render() {
    let activeMonitor;
    const { monitors, initStatus, route: { params } } = this.props;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const {
      dataArr,
      // showState, searchText,
      loadingType, isLoading,
    } = this.state;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          {/* 页面主体 */}
          <TouchableOpacity
            style={styles.container}
            activeOpacity={1}
            onPress={this.hideMenu}
          >
            <View style={styles.wrapper}>
              <FlatList
                ref={this.getRef}
                data={dataArr}
                style={{ flex: 1 }}
                keyExtractor={(item, index) => index.toString()}
                initialNumToRender={dataArr.length}
                renderItem={item => this.renderRow(item)}
                ListHeaderComponent={this.renderHeader}
                ListFooterComponent={this.renderFooter}
                keyboardShouldPersistTaps="always"
                ListEmptyComponent={() => (
                  (dataArr.length === 0 && initStatus === 'end')
                    ? <Text style={styles.noData}>{getLocale('noAlarmData')}</Text>
                    : null)
                }
                refreshControl={(
                  <RefreshControl
                    style={[
                      styles.refreshBox, isLoading ? { zIndex: 10 } : { zIndex: -1 },
                    ]}
                    colors={['#339eff']}
                    tintColor={['#fff']}
                    refreshing={isLoading}
                    progressViewOffset={0}
                    onRefresh={this.pullDownRefresh}
                  />
                )}
                onEndReachedThreshold={0.001}
                onEndReached={this.onEndReached}
              />
              {
                (initStatus === 'start' && loadingType) ? <Loading type="page" /> : null
              }
            </View>
            <ToolBar
              monitors={monitors}
              activeMonitor={activeMonitor}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    alarmData: state.getIn(['alarmCenterReducers', 'alarmData']),
    initStatus: state.getIn(['alarmCenterReducers', 'initStatus']),
  }),
  dispatch => ({
    getAlarmData: (payload) => {
      dispatch({ type: 'alarmCenter/SAGA/GETDATA_ACTION', payload });
    },
  }),
)(AlarmCenter);
