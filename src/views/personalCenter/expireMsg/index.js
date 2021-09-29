import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View, Text, StyleSheet,
  LayoutAnimation,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  TouchableHighlight,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurAccont, getUserStorage } from '../../../server/getStorageData';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';
import storage from '../../../utils/storage';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ExpireInfoHeader from './expireInfoHeader';// 时间轴标题组件
import ContentItem from './contentItem';// 内容item组件
import setting from '../../../static/image/setting.png';
import { getLocale } from '../../../utils/locales';
import { go } from '../../../utils/routeCondition';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  // 时间轴左侧线条
  leftLine: {
    position: 'absolute',
    width: 1,
    left: 30,
    top: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'rgb(160,160,160)',
  },
  noData: {
    flex: 1,
    marginTop: 30,
    textAlign: 'center',
    color: '#999',
  },
  txtStyle: {
    paddingLeft: 60,
    paddingRight: 20,
    paddingBottom: 10,
  },
  loadMore: {
    // textAlign: 'center',
  },
  msgTitle: {
    backgroundColor: '#fff',
    marginBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e4',
  },
  msgText: {
    fontSize: 17,
    color: '#3197ff',
    textAlign: 'left',
    marginLeft: 35,
    paddingTop: 10,
    paddingBottom: 10,
  },
  linellae: {
    width: 82,
    height: 2,
    backgroundColor: '#3197ff',
    marginLeft: 30,
  },
  menuBox: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    height: 30,
    zIndex: 999,
  },
  rightTouch: {
    paddingHorizontal: 20,
  },
  rightIcon: {
    width: 20,
    height: 20,
  },
});

// loading样式
const loadingStyle = (
  <View style={{ alignItems: 'center' }}>
    <Loading type="inline" color="rgb(54,176,255)" />
  </View>
);

class ExpireInfo extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('noticeCenter'),
    () => (
      <View
        style={Platform.OS === 'android' ? null : styles.menuBox}
      >
        <TouchableHighlight
          underlayColor="transparent"
          style={styles.rightTouch}
          onPress={() => {
            go('systemSetting', { jumpRouter: 'expireMsg' });
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
    curAlarmObj: PropTypes.object,
    getExpireInfoData: PropTypes.func.isRequired,
    getExpireDetailData: PropTypes.func.isRequired,
    alarmInfoData: PropTypes.object.isRequired,
    alarmContent: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    key_: PropTypes.number,
    route: PropTypes.object.isRequired,
    addMonitor: PropTypes.func.isRequired,
  }

  static defaultProps = {
    monitors: null,
    curAlarmObj: undefined,
    alarmContent: null,
    key_: null,
  }

  constructor(props) {
    super(props);

    const {
      route: { params }, monitors,
    } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }

    const firstMonitor = monitors ? monitors.get(0) : null;
    let currentMonitor = null;
    if (activeMonitor === null || activeMonitor === undefined) {
      currentMonitor = firstMonitor;
    } else {
      const monitor = monitors.find(x => x.markerId === activeMonitor.markerId);
      if (monitor === null) {
        currentMonitor = firstMonitor;
      } else {
        currentMonitor = monitor;
      }
    }

    this.state = {
      curAlarmObj: null, // 当前报警对象
      pageCount: 1, // 当前页码
      pageSize: 10, // 每页数量
      innerPageCount: 1, // 报警详情当前页码
      innerPageSize: 10, // 报警详情每页数量
      infoData: [], // 报警信息
      showFooter: 0, // 控制底部加载显示文本
      innerShowFooter: 0, // 控制报警详情底部加载显示文本
      isSelect: 0, // 折叠列表默认展开项
      curContent: [], // 当前显示内容数据
      isPullTop: false, // 是否可上拉加载
      itemHeight: 0, // 列表项高度
      loadingType: true, // 加载样式
      loadingText: '', // 加载文字
      isLoadMore: false, // 是否显示查看更多
      goCurAddr: true, // 是否跳转至具体报警日期位置
      innerLoading: false, // 详情信息加载状态
      queryStartTime: null, // 查询开始时间
      queryEndTime: null, // 上拉加载时的查询结束时间
      sectionList: null, // 列表ref
      timer: null,
      newTimer: null,
      isChange: false, // 是否切换了监控对象
      currentMonitor,
      // tapFlag: false,
      userName: null,
      type: 1,
      currentRemindCount: null,
    };

    this.changeRemindStorage();
    this.getAlarmInfo();
  }

  componentDidMount() {
    const { route: { params: { curAlarmObj } } } = this.props;
    if (curAlarmObj !== undefined) {
      this.setState({
        curAlarmObj,
      });
    }
  }

  // props改变时触发
  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      alarmInfoData, alarmContent, initStatus,
    } = nextProps;
    const {
      pageCount, pageSize, infoData, isSelect, itemHeight,
      innerPageCount, innerPageSize, curContent, sectionList,
      goCurAddr, currentRemindCount,
    } = this.state;
    // 到期提醒概要信息(包括首次加载的到期提醒详情)

    if (alarmInfoData.size > 0) {
      let newData = [
        { // 服务到期
          name: 'alreadyLifecycleExpireNumber', count: 0, data: [], type: 1,
        },
        { // 保养到期
          name: 'expireMaintenanceList', count: 0, data: [], type: 6,
        },
        { // 行驶证到期
          name: 'alreadyExpireDrivingLicenseList', count: 0, data: [], type: 3,
        },
        { // 运输证到期
          name: 'alreadyExpireRoadTransportList', count: 0, data: [], type: 5,
        },
        { // 服务即将到期
          name: 'lifecycleExpireNumber', count: 0, data: [], type: 0,
        },
        { // 保险即将到期
          name: 'expireInsuranceIdList', count: 0, data: [], type: 7,
        },
        { // 行驶证即将到期
          name: 'expireDrivingLicenseList', count: 0, data: [], type: 2,
        },
        { // 运输证即将到期
          name: 'expireRoadTransportList', count: 0, data: [], type: 4,
        },

      ];
      if (pageCount === 1) { // 下拉刷新
        const curInfoData = alarmInfoData.toJS();
        newData.map((item) => {
          const newItem = item;
          newItem.count = curInfoData[item.name];
          return item;
        });
        newData[0].data = curInfoData.data;
        if (isSelect === 0) { // 如果展开的是第一项
          let content = newData[0].data || [];
          this.setState({
            loadingText: '',
            isLoadMore: false,
            innerLoading: false,
            currentRemindCount: newData[0].count,
          });
          if (content && content.length === 0) {
            content = [{}];
            newData[0].data = [{}];
            this.setState({
              loadingText: getLocale('noData'),
            });
          }
          if (alarmContent === null) {
            this.setState({
              innerShowFooter: 1,
              curContent: content,
            });
          }
          if (content && content.length === innerPageSize && content.length !== newData[0].count) {
            this.setState({
              innerShowFooter: 0,
              isLoadMore: true,
              innerPageCount: innerPageCount + 1,
            });
          }
        }
      } else { // 上拉加载
        newData = infoData.concat(alarmInfoData.toJS());
      }
      const len = newData.length;
      for (let i = 0; i < len; i += 1) {
        newData[i].key = i;
        if (newData[i].data === undefined) {
          newData[i].data = [];
        }
      }
      this.setState({
        infoData: newData,
        isPullTop: false,
        showFooter: 1,
      });
      if (alarmInfoData.size === pageSize) {
        this.setState({
          isPullTop: true,
          showFooter: 0,
          pageCount: pageCount + 1,
        });
      }
    } else if (initStatus === 'end') { // 已是最后一页
      this.setState({
        showFooter: 1,
        isPullTop: false,
        loadingText: getLocale('noData'),
      });
    }
    // 到期提醒详细信息
    if (alarmContent !== null) {
      let contentData = [];
      this.setState({
        innerShowFooter: 1,
        loadingText: '',
        isLoadMore: false,
        innerLoading: false,
      });
      if (alarmContent.size !== 0) {
        const alarmDetail = alarmContent.toJS();
        if (innerPageCount === 1) {
          contentData = alarmDetail;
          this.setState({
            curContent: alarmDetail,
          });
        } else {
          contentData = curContent.concat(alarmDetail);
          this.setState({
            curContent: curContent.concat(alarmDetail),
          });
        }
        if (alarmContent.size === innerPageSize
          && currentRemindCount !== (curContent.length + alarmContent.size)) {
          this.setState({
            innerShowFooter: 0,
            isLoadMore: true,
            innerPageCount: innerPageCount + 1,
          });
        }
      } else {
        this.setState({
          loadingText: getLocale('noData'),
          innerShowFooter: 1,
        });
        contentData = curContent;
        if (innerPageCount === 1) {
          contentData = [{}];
          this.setState({
            curContent: [{}],
          });
        }
      }
      if (isSelect !== -1) {
        infoData[isSelect].data = contentData;
      }
      this.setState({
        infoData,
      }, () => {
        if (goCurAddr) {
          const timer = setTimeout(() => {
            sectionList.scrollToLocation({
              itemIndex: 0,
              sectionIndex: isSelect,
              viewOffset: (isSelect + 1) * itemHeight,
              // viewPosition: 0,
            });
            sectionList.recordInteraction();
          }, 200);
          this.setState({
            timer,
          });
        }
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount = () => {
    const { timer, newTimer } = this.state;
    if (timer != null) { clearInterval(timer); }
    if (newTimer != null) { clearInterval(newTimer); }
  }

  // 设置到期提醒缓存为已读
  changeRemindStorage = () => {
    getCurAccont().then((curUser) => {
      this.setState({ userName: curUser });
      getUserStorage().then((userStorage) => {
        const storageResult = userStorage || {};
        if (storageResult[curUser].messageRemind.enable) {
          storageResult[curUser].messageRemind.enable = false;
          storage.save({
            key: 'userStorage',
            data: storageResult,
          });
        }
      });
    });
  }

  // 获取到期提醒信息
  getAlarmInfo = () => {
    const { getExpireInfoData } = this.props;
    getExpireInfoData();
  }

  // 获取提醒详情信息
  getAlarmInfoDetail = (page) => {
    const {
      innerPageCount, innerPageSize, userName, type,
    } = this.state;
    const { getExpireDetailData } = this.props;
    const newParam = {
      userName,
      type,
      page: page || innerPageCount,
      limit: innerPageSize,
    };
    getExpireDetailData(newParam);
  }

  // 下拉刷新
  pullDownRefresh = () => {
    const { infoData, isSelect } = this.state;
    if (isSelect !== -1 && infoData.length > 0) {
      infoData[isSelect].data = [];
    }
    this.setState({
      pageCount: 1,
      innerPageCount: 1,
      showFooter: 2,
      isSelect: 0,
      loadingType: false,
    });
    this.getAlarmInfo(1);
  }

  // 上拉加载
  pullTopRefresh = () => {
    const { showFooter, isPullTop } = this.state;
    // 如果是正在加载中或没有更多数据了，则返回
    if (showFooter !== 0 || !isPullTop) {
      return;
    }
    this.setState({
      showFooter: 2,
      loadingType: false,
    });
    this.getAlarmInfo(null);
  }

  // header点击折叠展开
  itemTap = (index, item) => {
    // 点击的item如果是同一个, 就置为初始状态-1, 也就是折叠的状态
    let select = index;
    const { initStatus } = this.props;
    const {
      isSelect, infoData, sectionList, itemHeight, newTimer, loadingText,
    } = this.state;
    if (initStatus === 'start' || (loadingText === getLocale('dataLoading') && Platform.OS !== 'ios')) return;
    if (newTimer) clearInterval(newTimer);
    if (isSelect === index) {
      select = -1;
    }
    infoData[index].data = [{}];
    if (isSelect !== -1) {
      infoData[isSelect].data = [];
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
      innerPageCount: 1,
      innerShowFooter: 0,
      currentRemindCount: item.count,
      loadingText: getLocale('noData'),
      type: item.type,
    }, () => {
      if (select !== -1) {
        this.setState({
          curContent: [],
          infoData,
          tapFlag: true,
          goCurAddr: true,
          loadingText: getLocale('dataLoading'),
        });
        if (sectionList && sectionList.scrollToLocation) {
          sectionList.scrollToLocation({
            itemIndex: 0,
            sectionIndex: select,
            // viewPosition: 0,
            viewOffset: (select + 1) * itemHeight,
          });
        }
        if (Platform.OS !== 'ios') {
          const newTimer1 = setTimeout(() => {
            this.getAlarmInfoDetail(1);
          }, 500);
          this.setState({
            newTimer: newTimer1,
          });
        } else {
          this.getAlarmInfoDetail(1);
        }
      }
    });
  }

  // 加载更多详细到期提醒信息
  innerLoadMore = () => {
    const { innerLoading } = this.state;
    if (!innerLoading) {
      this.setState({
        goCurAddr: false,
        innerLoading: true,
      }, () => {
        this.getAlarmInfoDetail();
      });
    }
  }

  renderItem = (data) => {
    const {
      curAlarmObj, innerPageCount, innerPageSize,
      loadingText, isLoadMore, innerLoading,
    } = this.state;
    const num = (innerPageCount - 1) * innerPageSize - 1;
    const { key_, addMonitor } = this.props;
    if (innerPageCount === 1 && loadingText !== '') {
      return (
        <View>
          <View style={styles.leftLine} />
          <View style={styles.txtStyle}>
            <Text>{loadingText}</Text>
          </View>
        </View>
      );
    }
    return (
      <View>
        <ContentItem
          key={key_}
          item={data.item}
          curAlarmObj={curAlarmObj}
          addMonitor={addMonitor}
        />
        {
          isLoadMore && data.index === num
            ? (
              <TouchableOpacity
                style={[styles.txtStyle, styles.loadMore]}
                activeOpacity={0.8}
                onPress={() => {
                  this.innerLoadMore();
                }}
              >
                <View style={styles.leftLine} />
                {innerLoading ? loadingStyle : <Text style={styles.loadMore}>{getLocale('lookMore')}</Text>}
              </TouchableOpacity>
            )
            : null
        }
      </View>
    );
  }

  // 获取item高度
  layoutFun = (event) => {
    const { nativeEvent: { layout: { height } } } = event;
    this.setState({
      itemHeight: height,
    });
  }

  // sectionList设置ref
  getRef = (sectionList) => {
    this.setState({
      sectionList,
    });
  }

  /**
   * 工具栏监控对象改变
   */
  handleMonitorChange = (currentMonitor) => {
    this.setState({
      infoData: [],
      curContent: [],
      pageCount: 1,
      innerPageCount: 1,
      showFooter: 2,
      isSelect: 0,
      loadingType: true,
      isChange: true,
      tapFlag: false,
      currentMonitor,
    }, () => {
      this.getAlarmInfo();
    });
  }

  // 渲染每个section的头部
  renderSectionHeader = (item) => {
    const { isSelect, infoData } = this.state;
    const { section } = item;
    return (
      <View
        onLayout={(event) => { this.layoutFun(event); }}
      >
        <ExpireInfoHeader
          item={section}
          tapFun={this.itemTap}
          index={{ curIndex: section.key, allLen: infoData.length - 1 }}
          isActive={isSelect === parseInt(section.key, 10)}
        />
      </View>
    );
  }

  // 每个item的分割线
  renderItemSeparator = () => (
    <View />
  )

  // 底部显示样式
  renderFooter = () => {
    const { showFooter, isPullTop } = this.state;

    if (showFooter === 2 && isPullTop) {
      return loadingStyle;
    }
    return null;
  }

  // 列表顶部
  renderHeader = () => {
    const { infoData } = this.state;
    const { initStatus } = this.props;
    if (infoData.length === 0 && initStatus === 'end') {
      return <Text style={styles.noData}>{getLocale('noExpire')}</Text>;
    }
    return null;
  }

  getTitle = () => {
    const { curAlarmObj, currentMonitor } = this.state;
    return curAlarmObj === null ? currentMonitor.title : curAlarmObj.name;
  }

  render() {
    const { monitors, initStatus } = this.props;
    const {
      itemHeight, loadingType, infoData,
      pageCount, curContent, innerPageSize, currentMonitor,
    } = this.state;
    const initNum = infoData.length + curContent.length + innerPageSize;
    const isLoading = (initStatus === 'start' && !loadingType && pageCount === 1);

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          <View style={styles.msgTitle}>
            <Text style={styles.msgText}>
              {getLocale('personalTitle')}
            </Text>
            <View style={styles.linellae} />
          </View>
          {
            (initStatus === 'start' && loadingType) ? <Loading type="page" /> : null
          }
          {
            isLoading ? loadingStyle : null
          }
          <SectionList
            style={{ flex: 1 }}
            sections={infoData}// 数据源
            renderItem={this.renderItem} // 渲染每一个section中的每一个列表项
            keyExtractor={(item, index) => index + item}// 生成一个不重复的key
            renderSectionHeader={this.renderSectionHeader}// 渲染每个section的头部
            scrollEnabled// 默认是true，false禁止滚动
            stickySectionHeadersEnabled
            initialNumToRender={initNum}
            ListHeaderComponent={this.renderHeader}
            ListFooterComponent={this.renderFooter}
            refreshControl={(
              <RefreshControl
                refreshing={false}
                progressViewOffset={-10000}
                onRefresh={this.pullDownRefresh}
              />
            )}
            ref={this.getRef}
            getItemLayout={(data, index) => (
              { length: itemHeight, offset: itemHeight * index, index }
            )}
            // onEndReachedThreshold={0.00000001}
            // onEndReached={this.pullTopRefresh}
            /* eslint react/jsx-no-bind:off */
            ItemSeparatorComponent={this.renderItemSeparator.bind(this)}
          />
          <ToolBar
            monitors={monitors}
            activeMonitor={currentMonitor}
            onChange={this.handleMonitorChange}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    alarmInfoData: state.getIn(['expireRemindReducers', 'alarmInfoData']),
    alarmContent: state.getIn(['expireRemindReducers', 'alarmContent']),
    initStatus: state.getIn(['expireRemindReducers', 'initStatus']),
    key_: state.getIn(['expireRemindReducers', 'key_']),
  }),
  dispatch => ({
    // 获取到期提醒信息
    getExpireInfoData: (payload) => {
      dispatch({ type: 'expireRemind/SAGA/GETDATA_ACTION', payload });
    },
    // 获取到期提醒信息详情
    getExpireDetailData: (payload) => {
      dispatch({ type: 'expireRemind/SAGA/GETDETAIL_ACTION', payload });
    },
    addMonitor: (id, callback) => {
      dispatch({ type: 'HOME/SAGA/HOME_GET_MONITOR', id, callback }); // 单个分组列表action
    },
  }),
)(ExpireInfo);