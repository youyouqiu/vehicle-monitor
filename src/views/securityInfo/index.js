import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  SectionList,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PanelHead from './componentPanelHead';
import Loading from '../../common/loading';
import { getLocale } from '../../utils/locales';
import PanelBody from './componentPanelBody';
import { GetDateStr, getCurrentTime } from '../../utils/function';
import { getUserSetting } from '../../server/getStorageData';
import ToolBar from '../../common/toolBar';
import { checkMonitorBindRisk } from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';
import PublicNavBar from '../../common/newPublicNavBar';
import { serviceError, tokenOverdue, serviceConnectError } from '../../utils/singleSignOn';
import storage from '../../utils/storage';
import NetworkModal from '../../utils/networkModal';

const dis = 55;// 日期宽度
const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  objTitle: {
    marginTop: 15,
    marginBottom: 15,
    fontSize: 18,
    color: 'rgb(97,97,97)',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
  },
  refreshBox: {
    backgroundColor: '#339eff',
    margin: 0,
    padding: 0,
  },
  noData: {
    flex: 1,
    marginTop: 30,
    textAlign: 'center',
    color: '#999',
  },
  borderLine: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: 'rgb(160,160,160)',
    marginLeft: dis + 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 10,
  },
  pull_top: {
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// loading样式
const loadingStyle = (
  <View style={styles.pull_top}>
    <Loading type="inline" color="rgb(54,176,255)" />
  </View>
);

class Panel extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('securityInfoTitle'),
  )

  static propTypes = {
    monitors: PropTypes.string.isRequired,
    route: PropTypes.object.isRequired,
    dayNumList: PropTypes.object.isRequired,
    dayNumStatus: PropTypes.string.isRequired,
    getRiskNumAction: PropTypes.func.isRequired,
    riskListAction: PropTypes.func.isRequired,
    riskIds: PropTypes.array.isRequired,
    riskLists: PropTypes.object.isRequired,
    riskStatus: PropTypes.string.isRequired,
    reset: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    const currentMonitor = this.getCurMornitor();
    this.state = {
      infoData: [],
      infoLen: 0,
      load: true,
      isPullTop: 0,
      hasNodata: false,
      pageNum: 1,
      pageSize: 10,
      innerPageNum: 1, // 报警详情当前页码
      innerPageSize: 10, // 报警详情每页数量
      currentMonitor,
      vehicleId: currentMonitor.markerId, // 报警车辆id
      startTime: `${GetDateStr(new Date(), 0)} 00:00:00`,
      endTime: getCurrentTime(0),
      sectionList: '',
      sectionsData: [],
      riskData: [],
      riskIdData: '',
      isEvent: true,
      isActive: 0,
      isLoad2: true,
      todayEndTime: getCurrentTime(0),
      itemHeight: 50,
      isLoadMore: true,
      goCurAddr: true, // 是否跳转至具体报警日期位置
      innerLoading: false, // 详情信息加载状态
      loadingType: true,
      isTop: false,
    };

    // 后台配置查询时间范围
    getUserSetting().then((res) => {
      const queryDay = res.app.queryAlarmPeriod || 30;
      this.state.maxQueryDay = queryDay;
      this.getRiskNum(1);
    });
  }

  // componentDidMount() {
  //   this.getRiskNum(1);
  // }

  // 进入页面获取当前监控对象id
  getCurMornitor = () => {
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const firstMonitor = monitors.get(0);

    let currentMonitor = null;
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

    return currentMonitor;
  }

  /**
   * 监控对象切换
   */
  handleMonitorChange = (currentMonitor) => {
    // 监控对象风险设置权限判断
    checkMonitorBindRisk({
      vehicleId: currentMonitor.markerId,
    }).then((data) => {
      if (data.statusCode === 200) {
        if (data.obj) {
          this.setState({
            currentMonitor,
            pageNum: 1,
            innerPageNum: 1,
            isPullTop: 0,
            isActive: 0,
            vehicleId: currentMonitor.markerId,
            isTop: true,
            endTime: getCurrentTime(0),
          }, () => { this.getRiskNum(1); });
        } else {
          toastShow(getLocale('vehicleUnbindRisk'), { duration: 2000 });
        }
      } else if (data.error === 'invalid_token') {
        storage.remove({
          key: 'loginState',
        });
        tokenOverdue();
      } else if (data.error === 'request_timeout') {
        NetworkModal.show({ type: 'timeout' });
      } else if (data.error !== 'network_lose_connected') {
        serviceError();
      } else {
        serviceConnectError();
      }
    });
  }

  // 获取报警数量列表
  getRiskNum = (pageNum) => {
    const { getRiskNumAction } = this.props;
    const {
      pageSize, maxQueryDay, vehicleId, innerPageNum, innerPageSize, endTime,
    } = this.state;
    getRiskNumAction({
      pageNum,
      pageSize,
      maxQueryDay,
      vehicleId,
      innerPageNum,
      innerPageSize,
      endTime,
    });
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const {
      dayNumList, dayNumStatus, riskLists, riskIds, riskStatus,
    } = nextProps;
    const {
      pageNum, infoData, riskData, riskIdData,
      innerPageNum, sectionsData, innerPageSize, isActive,
    } = this.state;

    // 每天报警数量统计
    if (dayNumStatus === 'success') {
      const state = {
        infoData: pageNum === 1 ? [...dayNumList] : infoData.concat([...dayNumList]),
        riskIdData: pageNum === 1 ? [...riskIds] : riskIdData,
        riskData: pageNum === 1 ? [...riskLists] : riskData,
        isPullTop: 2,
        hasNodata: false,
        loadingType: true,
      };

      if (dayNumList.size > 0) {
        this.setState(state, () => {
          this.setData();
        });
      } else {
        this.setState({
          isPullTop: 0,
          hasNodata: true,
          loadingType: true,
        });
      }

      this.setState({
        load: false,
        isLoad2: false,
      });
    } else if (dayNumStatus === 'failed') {
      this.setState({
        load: false,
        isLoad2: false,
        isPullTop: 2,
        hasNodata: false,
      });
    }

    // 报警详情列表
    if (riskStatus === 'success') {
      if (riskLists.size > 0) {
        this.setState({
          riskData: innerPageNum === 1 ? [...riskLists] : riskData.concat([...riskLists]),
          riskIdData: innerPageNum === 1 ? [...riskIds] : riskIdData.concat([...riskIds]),
        }, () => {
          const { riskData: newRiskData } = this.state;
          if (isActive !== -1) {
            sectionsData[isActive].data = newRiskData;
          }

          this.setState({
            sectionsData,
            isLoad2: false,
            innerLoading: false,
            innerPageNum: newRiskData.length >= innerPageSize ? innerPageNum + 1 : innerPageNum,
          }, () => {
            // 置顶
            this.goTop(isActive);
          });
        });
      } else {
        if (innerPageNum === 1 && isActive !== -1) {
          sectionsData[isActive].data = [{}];
        }
        this.setState({
          sectionsData,
          isLoad2: false,
          isEvent: true,
          innerLoading: false,
        });
      }
    } else if (riskStatus === 'failed') {
      this.setState({
        isLoad2: false,
        isEvent: true,
        innerLoading: false,
      });
    }
  }

  componentWillUnmount () {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    const { reset } = this.props;
    reset();
  }

  // 列表置顶
  goTop = (isActive) => {
    const { goCurAddr, itemHeight } = this.state;
    if (goCurAddr) {
      const { sectionList } = this.state;
      this.timer = setTimeout(() => {
        if (sectionList !== null && isActive !== -1) {
          sectionList.scrollToLocation({
            itemIndex: 0,
            sectionIndex: isActive,
            viewOffset: (isActive + 1) * itemHeight, // 内部列表滚动条置顶
          });
          sectionList.recordInteraction();
        }

        setTimeout(() => {
          this.setState({
            isEvent: true,
          });
        }, 100);
      }, 200);
    }
  }

  // 组装sections数据
  setData = () => {
    const {
      isActive, infoData, riskData, innerPageNum, innerPageSize, isTop,
    } = this.state;
    const newData = [];

    for (let i = 0, len = infoData.length; i < len; i += 1) {
      const item = infoData[i];
      const newObj = {};
      newObj.key = i;// 索引
      newObj.title = item;
      newObj.data = [];

      if (i === isActive) {
        newObj.data = riskData.length === 0 ? [{}] : riskData;
      }

      newData.push(newObj);
    }

    this.setState({
      sectionsData: newData,
      infoLen: newData.length,
      innerPageNum: (riskData.length >= innerPageSize && innerPageNum === 1)
        ? innerPageNum + 1 : innerPageNum,
    }, () => {
      if (isTop) {
        this.goTop(isActive);
        this.setState({
          isTop: false,
        });
      }
    });
  }

  // 获取报警详情列表
  getRisks = (item, index) => {
    const {
      isActive, isEvent, sectionsData, todayEndTime,
    } = this.state;
    if (!isEvent) {
      return;
    }

    sectionsData[index].data = [{}];
    if (isActive !== -1) {
      sectionsData[isActive].data = [];
    }

    if (isActive === index) {
      this.setState({
        isActive: -1,
        isEvent: true,
        sectionsData,
      });
      return;
    }

    this.setState({
      goCurAddr: true,
      isActive: index,
      sectionsData,
      isLoad2: true,
      isEvent: false,
      innerPageNum: 1,
      startTime: `${item.get('day')} 00:00:00`,
      endTime: index === 0 ? todayEndTime
        : `${GetDateStr(item.get('day'), 1)} 00:00:00`,
    }, () => {
      this.getRiskData(1);
    });
  }

  // 获取报警详情
  getRiskData = (page) => {
    const { riskListAction } = this.props;
    const {
      innerPageSize, vehicleId, riskIdData, startTime, endTime,
    } = this.state;

    const params = {
      pageNum: page,
      pageSize: innerPageSize,
      vehicleId,
      startTime,
      endTime,
      riskIds: page === 1 ? '' : riskIdData.toString(),
    };
    riskListAction(params);
  }

  // section body
  renderItem = ({ item, index }) => {
    const {
      isLoad2, isLoadMore, innerPageNum, innerPageSize, innerLoading,
    } = this.state;
    const num = (innerPageNum - 1) * innerPageSize - 1;

    // 加载动画
    if (innerPageNum === 1 && isLoad2) {
      return (
        <View style={styles.borderLine}>
          <Loading type="inline" color="rgb(54,176,255)" />
        </View>
      );
    }

    return (
      <View>
        <PanelBody
          riskItem={item}
        />
        {/* 查看更多 */}
        {
          isLoadMore && index === num
            ? (
              <TouchableOpacity
                style={styles.borderLine}
                activeOpacity={0.8}
                onPress={() => { this.innerLoadMore(item); }}
              >
                {innerLoading ? <Loading type="inline" color="rgb(54,176,255)" /> : <Text>{getLocale('lookMore')}</Text>}
              </TouchableOpacity>
            )
            : null
        }
      </View>
    );
  }

  // 查看更多
  innerLoadMore = () => {
    const {
      innerPageNum, innerLoading,
    } = this.state;

    if (!innerLoading) {
      this.setState({
        goCurAddr: false,
        innerLoading: true,
      }, () => {
        this.getRiskData(innerPageNum);
      });
    }
  }

  // section head
  renderSectionHeader = (item) => {
    const { infoLen, isActive } = this.state;
    const index = item.section.key;
    const data = item.section.title;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
      >
        <PanelHead
          numItem={data}
          curIndex={index}
          infoLen={infoLen}
          isActive={isActive}
          eventFun={() => { this.getRisks(data, index); }}
        />
      </TouchableOpacity>
    );
  }

  // 下拉刷新
  pullDownRefresh = () => {
    const { sectionsData, isActive } = this.state;
    if (isActive !== -1 && sectionsData.length > 0) {
      sectionsData[isActive].data = [];
    }
    this.setState({
      pageNum: 1,
      innerPageNum: 1,
      isPullTop: 0,
      isActive: 0,
      loadingType: false,
      endTime: getCurrentTime(0),
    }, () => {
      this.getRiskNum(1);
    });
  }

  // 上拉加载
  loadData = () => {
    const {
      pageNum, isPullTop, hasNodata, isEvent,
    } = this.state;

    if (!isEvent) return;// 加载报警详情列表时，阻止日期列表上拉加载
    if (isPullTop !== 1 && !hasNodata) {
      this.setState({
        isPullTop: 1,
        pageNum: pageNum + 1,
        hasNodata: false,
      }, () => {
        this.getRiskNum(pageNum + 1);
      });
    }
  }

  // 上拉加载加载动画
  renderFooter = () => {
    const { isPullTop } = this.state;
    if (isPullTop === 1) {
      return loadingStyle;
    }

    // if (hasNodata && isPullTop === 0) { // 加载完并且无数据返回
    //   return (
    //     <View style={styles.pull_load}>
    //       <Text>{getLocale('securityEmpty')}</Text>
    //     </View>
    //   );
    // }

    return null;
  }

  // 列表顶部
  renderHeader = () => {
    const { infoData, load } = this.state;
    if (infoData.length === 0 && !load) {
      return <Text style={styles.noData}>{getLocale('securityInfoEmpty')}</Text>;
    }
    return null;
  }

  // sectionList设置ref
  getRef = (sectionList) => {
    this.setState({
      sectionList,
    });
  }

  keyExtractor = (item, index) => item + index

  render () {
    const { monitors } = this.props;
    const {
      sectionsData, load, itemHeight, loadingType, pageSize, currentMonitor,
    } = this.state;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.body}>
          {/* 监控对象 */}
          <Text style={styles.objTitle}>
            {getLocale('monitoringObj')}
            {currentMonitor.title}
          </Text>

          <View style={styles.container}>
            {/* 页面加载动画 */}
            {load ? <Loading type="page" /> : null}
            {/* 下拉刷新加载动画 */}
            {!loadingType ? loadingStyle : null}
            {/* 报警列表 */}
            <SectionList
              sections={sectionsData}
              style={styles.panel}
              keyExtractor={this.keyExtractor}
              renderSectionHeader={this.renderSectionHeader}// head
              renderItem={this.renderItem}// body
              stickySectionHeadersEnabled
              extraData={this.state}
              onEndReached={this.loadData}// 上拉加载
              onEndReachedThreshold={0.00001}
              ListFooterComponent={this.renderFooter}
              ListHeaderComponent={this.renderHeader}
              initialNumToRender={pageSize}
              ref={this.getRef}
              getItemLayout={(data, index) => (
                { length: itemHeight, offset: itemHeight * index, index }
              )}
              refreshControl={(
                <RefreshControl
                  refreshing={false}
                  progressViewOffset={-10000}
                  onRefresh={this.pullDownRefresh}
                />
              )}
            />
          </View>

          {/* 底部工具栏 */}
          <ToolBar
            activeMonitor={currentMonitor}
            monitors={monitors}
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
    dayNumList: state.getIn(['securityInfoReducers', 'dayNumList']), // 每天报警数量列表
    dayNumStatus: state.getIn(['securityInfoReducers', 'dayNumStatus']), // 每天报警数量状态
    riskLists: state.getIn(['securityInfoReducers', 'riskLists']), // 风险列表
    riskStatus: state.getIn(['securityInfoReducers', 'riskStatus']), // 风险状态
    riskIds: state.getIn(['securityInfoReducers', 'riskIds']), // 风险列表id
    key_: state.getIn(['securityInfoReducers', 'key_']), // 随机数
  }),
  dispatch => ({
    getRiskNumAction: (params) => {
      dispatch({ type: 'securityInfo/SAGA/GET_RISKNUM_ACTION', params }); // 获取每天报警数量action
    },
    riskListAction: (params) => {
      dispatch({ type: 'securityInfo/SAGA/GET_RISK_ACTION', params }); // 获取风险列表action
    },
    reset: (params) => {
      dispatch({ type: 'securityInfo/RESET_DATA', params }); // 获取风险列表action
    },
  }),
)(Panel);