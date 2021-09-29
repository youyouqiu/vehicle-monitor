import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  // Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { toastShow } from '../../utils/toastUtils';// 导入toast
import { getDealRisk } from '../../server/getData';
import Loading from '../../common/loading';
import PieCharts from './componentPieChart';
import PanelHead from './componentPanelHead';
import PanelBody from './componentPanelBody';
import { getLocale } from '../../utils/locales';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pull_load: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  header: {
    width: '100%',
  },
  refreshBox: {
    // backgroundColor: '#339eff',
    margin: 0,
    padding: 0,
  },
  riskEmpty: {
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  empty_box: {
    borderTopWidth: 1,
    borderTopColor: '#CECECE',
    paddingVertical: 20,
    marginHorizontal: 10,
  },
  alertModal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.6)',
  },
  alertBox: {
    width: 300,
    padding: 20,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  alertTitle: {
    marginBottom: 5,
    fontSize: 20,
    color: '#333',
  },
  alertMsg: {
    fontSize: 16,
    color: '#333',
  },
  radioBox: {
    flex: 1,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioItem: {
    flex: 1,
    height: 20,
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIcon: {
    width: 12,
    height: 12,
    marginRight: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  alertBottom: {
    flex: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomTxt: {
    width: 55,
    height: 20,
    fontSize: 15,
    textAlign: 'right',
    color: '#42B59C',
  },
});

class Panel extends Component {
  static propTypes = {
    riskLists: PropTypes.array.isRequired,
    riskIds: PropTypes.array.isRequired,
    riskStatus: PropTypes.string.isRequired,
    riskListAction: PropTypes.func.isRequired,
    eventLists: PropTypes.array.isRequired,
    eventStatus: PropTypes.string.isRequired,
    eventListAction: PropTypes.func.isRequired,
    dealInfo: PropTypes.array.isRequired,
    dealInfoAction: PropTypes.func.isRequired,
    dealInfoStatus: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      riskData: [],
      eventData: [],
      riskIdData: [],
      hasNodata: false,
      isPullTop: 2, // 0 无数据,1 正在加载数据,2 数据加载完
      pageNum: 1,
      pageSize: 12,
      isActive: 0,
      isLoad2: true,
      isLoad3: true,
      isFresh: false,
      treated: 0,
      untreated: 0,
      changeNumber: true,
      _flatlist: null,
      isEvent: true,
      isInit: false,
      curDealInfo: [],
      dealModalShow: false,
      riskState: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentDidMount() {
    this.getRiskList(1);
    this.getDealInfo();
  }

  // 获取风险详情列表
  getRiskList=(pageNum) => {
    const { riskListAction } = this.props;
    const { pageSize, riskIdData } = this.state;

    riskListAction({
      pageNum,
      pageSize,
      riskIds: riskIdData.join(','),
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      riskLists, riskIds, riskStatus, eventLists, eventStatus, dealInfo, dealInfoStatus,
    } = nextProps;
    const { riskData, pageNum, riskIdData } = this.state;

    // 风险列表
    if (riskStatus === 'success') {
      if (riskLists.size > 0) {
        this.setState({
          riskIdData: pageNum === 1 ? [...riskIds] : riskIdData.concat([...riskIds]),
          riskData: pageNum === 1 ? [...riskLists] : riskData.concat([...riskLists]),
          isLoad2: false,
          isLoad3: false,
          isFresh: false,
          hasNodata: false,
          isPullTop: 2,
        }, () => {
          if (pageNum === 1) {
            this.setState({
              isActive: 0,
              eventData: [...eventLists],
            });
          }
        });
      } else {
        this.setState({
          isLoad2: false,
          isLoad3: false,
          isFresh: false,
          hasNodata: true,
          isPullTop: 0,
        });
      }
    } else if (riskStatus === 'failed') {
      this.setState({
        isLoad2: false,
        isFresh: false,
        hasNodata: false,
        isLoad3: false,
        isPullTop: 2,
      });
    }

    // 事件列表
    if (eventStatus === 'success') {
      if (eventLists.size > 0) {
        this.setState({
          eventData: [...eventLists],
        }, () => {
          const { _flatlist, isActive, isInit } = this.state;
          this.timer = setTimeout(() => {
            if (_flatlist !== null && isActive !== -1 && isInit) {
              _flatlist.scrollToIndex({ viewPosition: 0, index: isActive });
            }
            setTimeout(() => {
              this.setState({
                isInit: false,
              });
            }, 500);
          }, 800);
        });
      }
      this.setState({
        isLoad3: false,
        isEvent: true,
      });
    } else if (eventStatus === 'failed') {
      this.setState({
        isLoad3: false,
        isEvent: true,
      });
    }

    // 风险统计
    if (dealInfoStatus === 'success') {
      const { changeNumber } = this.state;
      if (!changeNumber) return;
      if (dealInfo.size > 0) {
        this.setState({
          treated: dealInfo.get('treated'),
          untreated: dealInfo.get('untreated'),
        });
      }
    }
    // else if (dealInfoStatus === 'failed') {
    //   this.setState({
    //     treated: 0,
    //     untreated: 0,
    //   });
    // }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  // 获取事件列表
  getEvents=(item, index) => {
    const { eventListAction } = this.props;
    const { isActive, isEvent } = this.state;
    if (index === isActive) {
      this.setState({
        isActive: -1,
        isEvent: true,
      });
      return;
    }

    if (!isEvent) {
      return;
    }
    this.setState({
      isActive: index,
      isLoad3: true,
      eventData: [],
      changeNumber: false,
      isEvent: false,
      isInit: true,
    }, () => {
      eventListAction({
        riskId: item.get('id'),
      });
    });
  }

  // 风险处理
  riskDeal=(item, index) => {
    this.setState({
      dealModalShow: true,
      curDealInfo: [item, index],
    });
    // Alert.alert(
    //   getLocale('securityTipTit'),
    //   getLocale('securityTipCon'),
    //   [
    //     { text: getLocale('securityCancel'), onPress: () => {} },
    //     {
    //       text: getLocale('securitySure'),
    //       onPress: () => {
    //         this.dealSuccess(item, index);
    //       },
    //     },
    //   ],
    //   { cancelable: false },
    // );
  }

  // 风险处理成功
  dealSuccess=() => {
    const { curDealInfo, riskState } = this.state;
    getDealRisk({
      riskId: curDealInfo[0].get('id'),
      riskResult: riskState ? 1 : 0,
    }).then((res) => {
      this.deleteRisk(curDealInfo[1]);
      if (res.statusCode === 200 && res.obj) {
        toastShow(getLocale('securityDealSuccess'), { duration: 3000 });
      } else if (res.statusCode === 200 && !res.obj) {
        toastShow(getLocale('securityDealed'), { duration: 3000 });
      } else if (res.statusCode === 500) {
        toastShow(getLocale('securityDealFailed'), { duration: 3000 });
      }
    }).catch(() => {
      toastShow(getLocale('securityDealFailed'), { duration: 3000 });
    });
    this.setState({
      riskState: false,
      dealModalShow: false,
    });
  }

  // 处理后删除风险
  deleteRisk=(index) => {
    const {
      riskData, isActive, treated, untreated,
    } = this.state;
    if (isActive === index) { // 处理风险事件展开的列表
      this.setState({
        isActive: -1,
      });
    }

    riskData.splice(index, 1);

    this.setState({
      riskData: [].concat(riskData),
      treated: treated + 1,
      untreated: untreated - 1,
    });
  }

  // 关闭事件处理弹窗
  closeRiskModal=() => {
    this.setState({
      dealModalShow: false,
      riskState: false,
    });
  }

  // FlatList 渲染列表
  renderItem=({ item, index }) => {
    const {
      isActive, eventData, isLoad3,
    } = this.state;

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => { this.getEvents(item, index); }}
        >
          <PanelHead
            dealFun={() => { this.riskDeal(item, index); }}
            riskItem={item}
            isActive={isActive === index}
          />
        </TouchableOpacity>

        {
          isActive === index
            ? (
              <View>
                {
                  isLoad3
                    ? (
                      <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                        <Loading type="inline" color="rgb(54,176,255)" />
                      </View>
                    )
                    : (
                      <PanelBody
                        eventItem={eventData}
                      />
                    )
                }
              </View>
            )
            : null
        }
      </View>
    );
  }

  // 上拉加载
  loadData=() => {
    const {
      pageNum, isPullTop, isInit, hasNodata,
    } = this.state;
    if (isInit) return;
    if (pageNum === 1) {
      this.setState({
        isInit: false,
      });
    }
    if (isPullTop !== 1 && !hasNodata) {
      this.setState({
        isPullTop: 1,
        changeNumber: false,
        pageNum: pageNum + 1,
      }, () => {
        this.getRiskList(pageNum + 1);
      });
    }
  }

  // 列表头部组件
  renderHeader=() => {
    const {
      treated, untreated, isLoad2,
    } = this.state;
    return (
      <View style={styles.header}>
        <PieCharts
          treated={treated}
          untreated={untreated}
        />

        {/* 报警为0时 */}
        {(!isLoad2 && untreated === 0 && treated === 0)
          ? <View style={styles.empty_box}><Text style={styles.riskEmpty}>{getLocale('securityAllEmpty')}</Text></View>
          : null}

        {/* 未处理报警为0时 */}
        {(!isLoad2 && untreated === 0 && treated !== 0)
          ? <View style={styles.empty_box}><Text style={styles.riskEmpty}>{getLocale('securityUndealEmpty')}</Text></View>
          : null}
      </View>
    );
  }

  // 底部上拉加载加载样式
  renderFooter=() => {
    const { isPullTop } = this.state;
    if (isPullTop === 1) {
      return (
        <View style={styles.pull_load}>
          <Loading type="inline" color="rgb(54,176,255)" />
        </View>
      );
    }

    // if (isPullTop === 0 && hasNodata) {//没有数据了
    //   return (
    //     <View style={styles.pull_load}>
    //       <Text>{getLocale('securityEmpty')}</Text>
    //     </View>
    //   );
    // }

    return null;
  }

  // 下拉刷新
  onRefresh=() => {
    this.setState({
      isActive: -1,
      eventData: [],
      riskIdData: [],
      isFresh: true,
      pageNum: 1,
      dealSuccess: false,
      changeNumber: true,
      isPullTop: false,
      hasNodata: true,
      isInit: false,
    }, () => {
      this.getDealInfo();
      this.getRiskList(1);
    });
  }

  // 获取今日风险统计
  getDealInfo=() => {
    const { dealInfoAction } = this.props;
    dealInfoAction();
  }

  // flatlist设置ref
  getRef=(flatList) => {
    this.setState({
      _flatlist: flatList,
    });
  }

  // 风险列表key
  keyExtractor=item => item.get('id')

  render() {
    const {
      riskData, isLoad2, eventData, isFresh, dealModalShow, riskState,
    } = this.state;

    return (
      <View style={styles.container}>
        {
          isLoad2
            ? <Loading type="page" />
            : (
              <View>
                <FlatList
                  ref={this.getRef}
                  data={riskData}
                  initialNumToRender={riskData.length + eventData.length}
                  extraData={this.state}
                  keyExtractor={this.keyExtractor}
                  renderItem={this.renderItem}
                  onEndReached={this.loadData}
                  onEndReachedThreshold={0.00006}
                  ListFooterComponent={this.renderFooter}
                  ListHeaderComponent={this.renderHeader}
                // getItemLayout={(data, index) => (
                //   { length: 45, offset: 45 * index, index })
                // }
                  refreshControl={(
                    <RefreshControl
                      style={[
                        styles.refreshBox, isFresh ? { zIndex: 10 } : { zIndex: -1 },
                      ]}
                      colors={['#339eff']}
                      tintColor={['#fff']}
                      refreshing={isFresh}
                      progressViewOffset={0}
                      onRefresh={this.onRefresh}
                    />
               )}
                />
                {/* 事件处理弹窗 */}
                <Modal
                  animationType="slide"
                  visible={dealModalShow}
                  transparent
                  // presentationStyle="fullScreen"
                  onRequestClose={this.closeRiskModal}
                >
                  <View style={styles.alertModal}>
                    <View style={styles.alertBox}>
                      <Text style={styles.alertTitle}>{getLocale('securityTipTit')}</Text>
                      <Text style={styles.alertMsg}>{getLocale('securityTipCon')}</Text>
                      <View style={styles.radioBox}>
                        <TouchableOpacity
                          style={styles.radioItem}
                          onPress={() => { this.setState({ riskState: false }); }}
                        >
                          <View style={styles.radioIcon}>
                            {!riskState
                              ? <View style={styles.radioCircle} />
                              : null
                            }
                          </View><Text>{getLocale('riskNoHappen')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.radioItem}
                          onPress={() => { this.setState({ riskState: true }); }}
                        >
                          <View style={styles.radioIcon}>
                            {riskState
                              ? <View style={styles.radioCircle} />
                              : null
                            }
                          </View>
                          <Text>{getLocale('riskHappen')}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.alertBottom}>
                        <TouchableOpacity
                          style={styles.bottomTxt}
                          onPress={this.closeRiskModal}
                        >
                          <Text style={styles.bottomTxt}>{getLocale('securityCancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bottomTxt} onPress={this.dealSuccess}>
                          <Text style={styles.bottomTxt}>{getLocale('securitySure')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>
            )
        }
      </View>
    );
  }
}

export default connect(
  state => ({
    dealInfo: state.getIn(['securityReducers', 'dealInfo']), // 今日风险处置统计
    dealInfoStatus: state.getIn(['securityReducers', 'dealInfoStatus']), // 今日风险处置统计
    riskLists: state.getIn(['securityReducers', 'riskLists']), // 风险列表
    riskIds: state.getIn(['securityReducers', 'riskIds']), // 风险id
    riskStatus: state.getIn(['securityReducers', 'riskStatus']), // 风险列表获取状态
    eventLists: state.getIn(['securityReducers', 'eventLists']), // 风险事件列表
    eventStatus: state.getIn(['securityReducers', 'eventStatus']), // 风险事件列表获取状态
    key_: state.getIn(['securityReducers', 'key_']), // 随机数
    dealStatus: state.getIn(['securityReducers', 'dealStatus']), // 风险处理状态
  }),
  dispatch => ({
    dealInfoAction: () => {
      dispatch({ type: 'security/SAGA/GET_DEAL_ACTION' }); // 获取风险列表action
    },
    riskListAction: (params) => {
      dispatch({ type: 'security/SAGA/GET_RISK_ACTION', params }); // 获取风险列表action
    },
    eventListAction: (params) => {
      dispatch({ type: 'security/SAGA/GET_EVENT_ACTION', params }); // 获取风险事件列表action
    },
  }),
)(Panel);