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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as timeFormat from 'd3-time-format';// 时间格式转换
import {
  getAlarmSetting,
} from '../../../server/getData';
import { getCurAccont, getUserSetting, getCheckAlarmType } from '../../../server/getStorageData';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';
import storage from '../../../utils/storage';

import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import AlarmInfoHeader from './alarmInfoHeader';// 时间轴标题组件
import ContentItem from './contentItem';// 内容item组件

import { getLocale } from '../../../utils/locales';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');
const dayTimeFormator = timeFormat.timeFormat('%Y-%m-%d');

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
  objTitle: {
    marginTop: 15,
    marginBottom: 15,
    fontSize: 18,
    color: 'rgb(97,97,97)',
    textAlign: 'center',
  },
  wrapper: {
    paddingBottom: 10,
  },
  alarmWrapper: {
    // paddingLeft: 60,
    paddingRight: 15,
  },
  // 时间轴左侧线条
  leftLine: {
    position: 'absolute',
    width: 1,
    left: 30,
    top: 0,
    bottom: 0,
    zIndex: 1,
    // height: '100%',
    backgroundColor: 'rgb(160,160,160)',
  },
  alignCenter: {
    textAlign: 'center',
  },
  noData: {
    flex: 1,
    marginTop: 30,
    textAlign: 'center',
    color: '#999',
  },
  divideLine: {
    height: 1,
    backgroundColor: '#e8e8e8',
  },
  txtStyle: {
    paddingLeft: 60,
    paddingRight: 20,
    paddingBottom: 10,
  },
  loadMore: {
    // textAlign: 'center',
  },
});

// loading样式
const loadingStyle = (
  <View style={{ alignItems: 'center' }}>
    <Loading type="inline" color="rgb(54,176,255)" />
  </View>
);

class AlarmInfo extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('alarmInfoTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    curAlarmObj: PropTypes.object,
    getAlarmInfoData: PropTypes.func.isRequired,
    getAlarmDetailData: PropTypes.func.isRequired,
    alarmInfoData: PropTypes.any.isRequired,
    alarmContent: PropTypes.array,
    initStatus: PropTypes.string.isRequired,
    key_: PropTypes.number,
    route: PropTypes.object.isRequired,
    addMonitor: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
  }

  // 属性默认值
  static defaultProps = {
    monitors: null,
    curAlarmObj: undefined,
    alarmContent: [],
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

    let currentMonitor = null;
    if (monitors) {
      const firstMonitor = monitors.get(0);
      if (activeMonitor === null) {
        currentMonitor = firstMonitor;
      } else {
        const monitor = monitors.find(x => x.markerId === activeMonitor.markerId);
        if (monitor === null) {
          currentMonitor = firstMonitor;
        } else {
          currentMonitor = monitor;
        }
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
      queryHistoryPeriod: 7, // 历史数据查询时间范围
      queryEndTime: null, // 上拉加载时的查询结束时间
      sectionList: null, // 列表ref
      timer: null,
      newTimer: null,
      isChange: false, // 是否切换了监控对象
      currentMonitor,
      // tapFlag: false,
    };
    // 获取用户在后台配置的信息
    getUserSetting().then((res) => {
      const queryDay = res.app.queryAlarmPeriod || 30;
      const queryHistoryPeriod = res.app.queryHistoryPeriod || 7;
      // 查询开始时间
      const startTime = timeFormator((new Date()).getTime() - (queryDay - 1) * 24 * 60 * 60 * 1000);
      this.state.queryStartTime = startTime;
      this.state.queryHistoryPeriod = queryHistoryPeriod;
      this.getAlarmInfo();
    });
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
      goCurAddr,
    } = this.state;
    // 报警概要信息(包括首次加载的报警详情)
    if (alarmInfoData.size > 0) {
      let newData = [];
      if (pageCount === 1) { // 下拉刷新
        newData = alarmInfoData.toJS();
        if (isSelect === 0) { // 如果展开的是第一项
          let content = newData[0].data;
          this.setState({
            loadingText: '',
            isLoadMore: false,
            innerLoading: false,
          });
          if (content === undefined || content.length === 0) {
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
          if (content.length === innerPageSize) {
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
    // 报警详细信息(点击具体日期或查看更多时修改)
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
        if (alarmContent.size === innerPageSize) {
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
    const { reset } = this.props;
    reset();
    if (timer != null) { clearInterval(timer); }
    if (newTimer != null) { clearInterval(newTimer); }
  }

  // 获取报警信息
  getAlarmInfo = (indexCount) => {
    const nowTime = timeFormator(new Date());// 当前时间
    if (indexCount !== null) {
      this.state.queryEndTime = nowTime;
    }
    const { route: { params: { curAlarmObj } }, getAlarmInfoData } = this.props;
    const {
      pageCount, pageSize, queryEndTime, innerPageSize,
      queryStartTime, currentMonitor, isChange,
    } = this.state;

    // 查询参数
    const param = {
      startTime: queryStartTime.substring(0, 10),
      endTime: indexCount === null ? queryEndTime.substring(0, 10) : nowTime.substring(0, 10),
      page: indexCount || pageCount,
      pageSize,
      innerPageSize,
    };

    if (curAlarmObj !== undefined) { // 报警中心正常跳转至本页面
      const alarmType = curAlarmObj.settingInfo.queryAlarmType;
      param.id = isChange ? currentMonitor.markerId : curAlarmObj.id;
      param.alarmType = alarmType;
      if (isChange) {
        this.setState({
          curAlarmObj: {
            id: currentMonitor ? currentMonitor.markerId : null,
            name: currentMonitor ? currentMonitor.title : null,
            settingInfo: {
              queryAlarmType: alarmType,
            },
          },
        });
      }
      getAlarmInfoData(param);
    } else { // 从其他界面跳转报警信息
      param.id = currentMonitor.markerId;
      this.getAlarmType(param);
    }
  }

  // 获取报警数据类型
  getAlarmType = (param) => {
    getAlarmSetting().then((res) => { // 获取后台接口配置的报警类型
      const alarmTypeData = res;
      let flag = false;
      if (alarmTypeData.obj.settings.length === 0) {
        flag = true;// 当前用户未配置报警类型
        getUserSetting().then((settingResult) => {
          alarmTypeData.obj.settings = settingResult.alarmTypes;
          this.alarmTypeBack(alarmTypeData, param, flag);
        });
      } else {
        this.alarmTypeBack(alarmTypeData, param, flag);
      }
    });
  }

  alarmTypeBack = (alarmTypeData, param, flag) => {
    const newParam = param;
    const { currentMonitor } = this.state;
    const { getAlarmInfoData } = this.props;
    const newAlarmType = [];
    const curAlarmObj = {
      id: currentMonitor ? currentMonitor.markerId : null,
      name: currentMonitor ? currentMonitor.title : null,
      settingInfo: {
        queryAlarmType: '',
      },
    };
    if (alarmTypeData.statusCode === 200) {
      const typeArr = alarmTypeData.obj.settings;
      const typeLen = typeArr.length;
      for (let i = 0; i < typeLen; i += 1) {
        newAlarmType.push(`switch${typeArr[i].type}`);
      }
    }

    getCheckAlarmType().then((checkRes) => {
      if (checkRes !== null) {
        getCurAccont().then((userName) => {
          const checkSwitch = checkRes[userName]
            ? checkRes[userName].checkArr : null;// 用户开启的报警数据类型
          const beforeAlarmType = checkRes[userName]
            ? checkRes[userName].allType : [];// 上一次后台配置的报警数据类型

          // 筛选出最新的报警数据类型
          let setAlarmType = [];
          if (checkSwitch !== null) {
            const len = checkSwitch.length;
            for (let i = 0; i < len; i += 1) {
              if (newAlarmType.indexOf(checkSwitch[i]) !== -1) {
                setAlarmType.push(checkSwitch[i]);
              }
            }
          } else if (flag) {
            setAlarmType = newAlarmType;
          }
          const len = newAlarmType.length;
          for (let i = 0; i < len; i += 1) {
            if (beforeAlarmType.indexOf(newAlarmType[i]) === -1) {
              setAlarmType.push(newAlarmType[i]);
            }
          }
          // 保存新的报警类型到缓存中
          const alarmObj = {};
          alarmObj[userName] = {
            checkArr: setAlarmType,
            allType: newAlarmType,
          };
          storage.save({
            key: 'checkSwitch',
            data: alarmObj,
          });

          newParam.alarmType = this.setAlarmType(setAlarmType);
          getAlarmInfoData(newParam);

          curAlarmObj.settingInfo.queryAlarmType = newParam.alarmType;
          this.setState({ curAlarmObj });
        });
      } else {
        newParam.alarmType = this.setAlarmType(newAlarmType);
        getAlarmInfoData(newParam);

        curAlarmObj.settingInfo.queryAlarmType = newParam.alarmType;
        this.setState({ curAlarmObj });
      }
    });
  }

  setAlarmType = (setAlarmType) => {
    let alarmType = '';
    const typeLen = setAlarmType.length;
    if (typeLen > 0) {
      for (let i = 0; i < typeLen; i += 1) {
        alarmType += `${setAlarmType[i].replace('switch', '')},`;
      }
    }
    return alarmType;
  }

  // 获取报警详情信息
  getAlarmInfoDetail = (time, page) => {
    const {
      innerPageCount, innerPageSize, curAlarmObj, queryEndTime,
    } = this.state;
    const { getAlarmDetailData } = this.props;

    const today = dayTimeFormator((new Date()).getTime());
    const newParam = {
      id: curAlarmObj.id,
      time: (today === time) ? queryEndTime : time,
      alarmType: curAlarmObj.settingInfo.queryAlarmType,
      page: page || innerPageCount,
      pageSize: innerPageSize,
    };
    getAlarmDetailData(newParam);
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
  itemTap = (index, time) => {
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
      loadingText: getLocale('noData'),
    });
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
          sectionIndex: isSelect,
          // viewPosition: 0,
          viewOffset: (isSelect + 1) * itemHeight,
        });
      }
      if (Platform.OS !== 'ios') {
        const newTimer1 = setTimeout(() => {
          this.getAlarmInfoDetail(time, 1);
        }, 500);
        this.setState({
          newTimer: newTimer1,
        });
      } else {
        this.getAlarmInfoDetail(time, 1);
      }
    }
  }

  // 加载更多详细报警信息
  innerLoadMore = (alarmTime) => {
    const time = dayTimeFormator(alarmTime);
    const { innerLoading } = this.state;
    if (!innerLoading) {
      this.setState({
        goCurAddr: false,
        innerLoading: true,
      }, () => {
        this.getAlarmInfoDetail(time);
      });
    }
  }

  renderItem = (data) => {
    const {
      curAlarmObj, innerPageCount, innerPageSize,
      loadingText, isLoadMore, innerLoading, queryHistoryPeriod,
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
          queryHistoryPeriod={queryHistoryPeriod}
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
                  this.innerLoadMore(data.item.alarmEndTime);
                }}
              >
                <View style={styles.leftLine} />
                {innerLoading ? loadingStyle : <Text style={{ textAlign: 'center' }}>{getLocale('lookMore')}</Text>}
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
        <AlarmInfoHeader
          item={section}
          tapFun={this.itemTap}
          index={{ curIndex: section.key, allLen: infoData.length - 1 }}
          time={section.date}
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
      return <Text style={styles.noData}>{getLocale('noAlarmData')}</Text>;
    }
    return null;
  }

  getTitle = () => {
    const { curAlarmObj, currentMonitor } = this.state;
    return curAlarmObj === null ? (currentMonitor ? currentMonitor.title : '') : curAlarmObj.name;
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
          <Text style={styles.objTitle}>
            {getLocale('monitoringObj')}
            {this.getTitle()}
          </Text>
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
    alarmInfoData: state.getIn(['alarmInfoReducers', 'alarmInfoData']),
    alarmContent: state.getIn(['alarmInfoReducers', 'alarmContent']),
    initStatus: state.getIn(['alarmInfoReducers', 'initStatus']),
    key_: state.getIn(['alarmInfoReducers', 'key_']),
  }),
  dispatch => ({
    getAlarmInfoData: (payload) => {
      dispatch({ type: 'alarmInfo/SAGA/GETDATA_ACTION', payload });
    },
    // 获取报警信息详情
    getAlarmDetailData: (payload) => {
      dispatch({ type: 'alarmInfo/SAGA/GETDETAIL_ACTION', payload });
    },
    addMonitor: (id, callback) => {
      dispatch({ type: 'HOME/SAGA/HOME_GET_MONITOR', id, callback }); // 单个分组列表action
    },
    reset: () => {
      dispatch({ type: 'alarmInfo/INIT_START_ACTION' }); // 重置数据
    },
  }),
)(AlarmInfo);