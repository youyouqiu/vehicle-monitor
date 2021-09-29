import React, { Component } from 'react';
import { is } from 'immutable';
import {
  StyleSheet,
  View,
  BackHandler,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import ScrollableTabView, { DefaultTabBar } from 'react-native-scrollable-tab-view';
import { getLocale } from '../../utils/locales';
import Panel from './componentPanel';
import SearchPanel from './componentSearchPanel';
import ToolBar from '../../common/toolBar';
import { getUserStorage } from '../../server/getStorageData';
import SearchHistory from '../../common/searchHistory';
import { back } from '../../utils/routeCondition';
import SearchBar from './componentSearchBar';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  active: {
    height: 2,
    backgroundColor: '#3399FF',
  },
  tabTxt: {
    width: 120,
    textAlign: 'center',
    fontSize: 15,
    paddingTop: 11,
  },
  handleDisabled: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    opacity: 0,
  },
});

class TabsBar extends Component {
  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
    monitorGroupAction: PropTypes.func.isRequired,
    monitorEmptyAction: PropTypes.func.isRequired,
    monitorCounterAction: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    changeHistoryValueAction: PropTypes.func.isRequired,
    searchHistoryVisible: PropTypes.bool.isRequired,
    handleStatus: PropTypes.bool.isRequired,
    changeHandleStatusAction: PropTypes.func.isRequired,
    emptySearchAction: PropTypes.func.isRequired,
  }

  // 属性默认值
  static defaultProps = {
    monitors: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      total: 0,
      online: 0,
      offline: 0,
      tabPage: 0,
      search: 0,
      searchList: [],
      searchLoad: false,
      tab: -1,
    };
    // 初始化界面时,隐藏搜索记录模块
    this.checkCallBack(null);
  }

  // 组件加载完毕
  componentDidMount () {
    // 统计
    const { monitorCounterAction } = this.props;
    monitorCounterAction({
      type: 0,
    });

    // 分组数据
    const { tab } = this.state;
    if (tab === -1) {
      this.tabChange({
        i: 0,
      });
    }

    // 监听安卓返回键
    BackHandler.addEventListener('hardwareBackPress', this.backFun);
  }

  // 点击安卓返回键触发方法
  backFun = () => {
    // eslint-disable-next-line react/prop-types
    const { searchHistoryVisible, changeHistoryValueAction, emptySearchAction } = this.props;
    if (!searchHistoryVisible) {
      back(); // 返回上一页
      emptySearchAction();
    }
    Keyboard.dismiss();
    changeHistoryValueAction({ searchHistoryVisible: false });
    return true;
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (nextProps) {
    // eslint-disable-next-line react/prop-types
    const {
      counter,
      page,
    } = nextProps;
    const { page: currentPage } = this.props;
    // 统计
    if (counter.size > 0) {
      this.setState({
        total: counter.get('total'), // 全部数
        online: counter.get('online'), // 在线数
        offline: counter.get('offline'), // 离线数
      });
    }

    // 页面切换(1为切换到搜索页)
    this.setState({
      tabPage: page,
    });

    // 搜索页返回重新获取分组数据
    if (page === 0 && currentPage !== 0) {
      this.tabChange({
        i: 0,
      }, 'search');
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount () {
    // 离开页面时,移除安卓返回键绑定事件
    BackHandler.removeEventListener('hardwareBackPress', this.backFun);
    const { emptySearchAction } = this.props;
    emptySearchAction();
    this.setState({
      tab: -1,
      tabPage: 0,
    });
  }

  // tab切换
  tabChange = (obj, type) => {
    const {
      monitorGroupAction, monitorEmptyAction, changeHandleStatusAction,
    } = this.props;
    const { tab } = this.state;
    const currentTab = obj.i;
    if (tab === currentTab && !type) {
      return;
    }

    this.setState({
      tab: currentTab,
    });

    monitorEmptyAction();// 页面置空
    monitorGroupAction({
      type: currentTab,
    });
    changeHandleStatusAction({ handleStatus: false });
  }

  checkCallBack = (value) => {
    const { changeHistoryValueAction } = this.props;
    const param = { historyValue: value, searchHistoryVisible: false };
    changeHistoryValueAction(param);
  }

  render () {
    const {
      total,
      online,
      offline,
      tabPage,
    } = this.state;

    const {
      monitors,
      route: { params },
      searchHistoryVisible,
      handleStatus,
    } = this.props;
    let activeMonitor;
    if (params) {
      const { activeMonitor: A } = params;
      activeMonitor = A;
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#339eff' }}>
        <View style={styles.container}>
          <SearchBar />
          {
            !handleStatus ? <View style={styles.handleDisabled} /> : null
          }
          {
            searchHistoryVisible
              ? (
                <SearchHistory
                  getDataFun={getUserStorage}
                  storeKey="searchHistory"
                  checkCallBack={this.checkCallBack}
                />
              )
              : null
          }
          {
            tabPage === 1 // 为1显示搜索页面
              ? (
                <SearchPanel />
              )
              : (
                <ScrollableTabView
                  tabBarUnderlineStyle={styles.active}
                  tabBarBackgroundColor="#F4F7FA"
                  tabBarActiveTextColor="#3399FF"
                  tabBarInactiveTextColor="#616161"
                  locked
                  renderTabBar={() => <DefaultTabBar />}
                  tabBarTextStyle={styles.tabTxt}
                  onChangeTab={this.tabChange}
                >
                  <Panel tabLabel={`${getLocale('monitorSearchTab1')} (${total})`} />
                  <Panel tabLabel={`${getLocale('monitorSearchTab2')} (${online})`} />
                  <Panel tabLabel={`${getLocale('monitorSearchTab3')} (${offline})`} />
                </ScrollableTabView>
              )
          }

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
    counter: state.getIn(['monitorSearchReducers', 'counter']), // 统计数量
    page: state.getIn(['monitorSearchReducers', 'page']), // 搜索页面切换
    searchHistoryVisible: state.getIn(['monitorSearchReducers', 'searchHistoryVisible']), // 搜索历史显示
    handleStatus: state.getIn(['monitorSearchReducers', 'handleStatus']),
  }),
  dispatch => ({
    // 数量统计
    monitorCounterAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/GET_COUNTER_ACTION', params });
    },
    emptySearchAction: () => {
      dispatch({ type: 'monitorSearch/SEARCH_EMPTY_ACTION' });// 清空搜索
    },
    // tab切换
    monitorGroupAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/GET_MONITORGROUP_ACTION', params });
    },
    // 清空数据
    monitorEmptyAction: (params) => {
      dispatch({ type: 'monitorSearch/GROUP_EMPTY_ACTION', params });
    },
    // 改变搜索历史显示或者搜索框值
    changeHistoryValueAction: (datas) => {
      dispatch({ type: 'monitorSearch/CHANGE_HISTORYVALUE_ACTION', datas });
    },
    changeHandleStatusAction: (datas) => {
      dispatch({ type: 'monitorSearch/CHANGE_HANDLESTATUS_ACTION', datas });
    },
  }),
)(TabsBar);