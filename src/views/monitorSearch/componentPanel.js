import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
} from 'react-native';
import { getLocale } from '../../utils/locales';
import Loading from '../../common/loading';
// import PanelItem from './panelItem';
import PanelHead from './componentPanelHead';
import PanelBody from './componentPanelBody';
const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  queryTimeoutPrompt: {
    flex: 1,
    paddingTop: '55%',
    fontSize: 15,
    textAlign: 'center',
  },
});
class Panel extends Component {
  static propTypes = {
    monitorGroups: PropTypes.object,
    tabInx: PropTypes.number.isRequired,
    monitorList: PropTypes.object,
    monitorStatus: PropTypes.string,
    monitorListAction: PropTypes.func.isRequired,
    addMonitor: PropTypes.func.isRequired,
    changeHandleStatusAction: PropTypes.func.isRequired,
  }

  // 属性默认值
  static defaultProps = {
    monitorGroups: null,
    monitorList: null,
    monitorStatus: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      tabInx: 0,
      active: 0,
      content: [],
      group: [],
      sectionData: [],
      groupLoad: true,
      _flatlist: null,
      pageSize: 20,
      pageCount: 1,
      isPullTop: false, // 上拉加载
      firstFlag: false, // 首次进入页面
      isLoad: false, // 加载状态
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      monitorGroups,
      monitorList,
      tabInx,
      monitorStatus,
      changeHandleStatusAction,
    } = nextProps;

    const {
      pageSize, pageCount, _flatlist, active, firstFlag,
    } = this.state;

    // 分组
    if (monitorStatus) {
      if (monitorStatus === 'success') {
        // 当tab切换时展开第一个分组
        this.setState((previousState) => {
          if (tabInx === previousState.tabInx) {
            return false;
          }
          return { active: 0 };
        });

        if (monitorGroups.size > 0) {
          this.setState({
            group: monitorGroups.get('assigns'), // 分组
            sectionData: [...monitorGroups.get('assigns')].slice(0, pageSize * pageCount),
          });
        }

        if (monitorList.size > 0) {
          this.setState({
            content: monitorList, // 第一个分组列表
          }, () => {
            this.timer = setTimeout(() => {
              if (_flatlist !== null && active !== -1 && firstFlag) {
                _flatlist.scrollToIndex({ viewPosition: 0, index: active });
              }
            }, 200);
          });
        }

        this.setState({
          tabInx,
          groupLoad: false,
          listLoad: false,
        });
      } else {
        this.setState({
          groupLoad: false,
          listLoad: false,
        });
      }
      changeHandleStatusAction({ handleStatus: true });
    } else {
      this.setState({
        content: [],
        group: [],
        sectionData: [],
        pageCount: 1,
        tabInx,
        firstFlag: false,
        groupLoad: true,
        listLoad: false,
      });
      changeHandleStatusAction({ handleStatus: false });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  // 获取分组列表
  getList = (index, item) => {
    const { active, tabInx } = this.state;
    const { monitorListAction } = this.props;

    if (index === active) {
      this.setState({
        active: -1,
      });
      return;
    }

    // const { _flatlist } = this.state;
    this.setState({
      active: index,
      content: [],
      listLoad: true,
      isPullTop: false,
      firstFlag: true,
    });

    // 获取分组列表
    const vId = item.get('id');
    monitorListAction({
      assignmentId: vId,
      type: tabInx,
      page: 1,
      pageSize: 10,
    });
  }

  // flatlist设置ref
  getRef = (flatList) => {
    this.setState({
      _flatlist: flatList,
    });
  }

  // FlatList 渲染列表
  renderItem = ({ item, index }) => {
    const { addMonitor } = this.props;
    const {
      active, content, listLoad,
    } = this.state;
    const contentData = [...content];// 分组列表

    return (
      <View>
        <TouchableOpacity
          onPress={() => (this.getList(index, item))}
        >
          <PanelHead
            title={item.get('name')}
            isActive={active === index}
          />
        </TouchableOpacity>

        {
          active === index
            ? (
              <View>
                {
                  listLoad
                    ? (
                      <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                        <Loading type="inline" color="rgb(54,176,255)" />
                      </View>
                    )
                    : (
                      <PanelBody
                        eventItem={contentData}
                        addMonitor={addMonitor}
                      />
                    )
                }
              </View>
            ) : null
        }
      </View>
    );
  }

  // 前端分页,实现上拉加载动画效果
  loadData = () => {
    const {
      group, sectionData, pageCount, pageSize, isLoad,
    } = this.state;
    const groupData = [...group];// 分组
    const groupLen = groupData.length;
    const sectionLen = sectionData.length;
    if (sectionLen < groupLen && !isLoad) {
      this.setState({
        isPullTop: true,
        isLoad: true,
        pageCount: pageCount + 1,
      });
      let newData = [];
      const curNum = pageSize * pageCount;
      if (groupLen - sectionLen >= pageSize) {
        newData = groupData.slice(curNum, curNum + pageSize);
      } else {
        newData = groupData.slice(curNum, groupLen);
      }
      const setData = sectionData.concat(newData);
      this.setState({
        isLoad: false,
        sectionData: setData,
      });
    } else {
      this.setState({
        isPullTop: false,
      });
    }
  }

  // 底部显示样式
  renderFooter = () => {
    const { isPullTop } = this.state;
    if (isPullTop) {
      return (
        <View style={{ alignItems: 'center' }}>
          <Loading type="inline" color="rgb(54,176,255)" />
        </View>
      );
    }
    return null;
  }

  getContent = () => {
    const { monitorStatus } = this.props;
    const { sectionData } = this.state;
    if (monitorStatus === 'failed') {
      return <Text style={styles.queryTimeoutPrompt}>{getLocale('queryTimeoutPrompt')}</Text>;
    }
    return (
      <FlatList
        ref={this.getRef}
        data={sectionData}
        initialNumToRender={sectionData.length > 50 ? 50 : sectionData.length}
        onEndReached={this.loadData}
        onEndReachedThreshold={0.001}
        ListFooterComponent={this.renderFooter}
        renderItem={this.renderItem}
        keyExtractor={item => (item.get('id'))}
        extraData={this.state}
        removeClippedSubviews
      />
    );
  }


  render() {
    const { groupLoad } = this.state;

    return (
      <View style={styles.container}>
        {
          groupLoad
            ? <Loading type="page" />
            : this.getContent()
        }
      </View>
    );
  }
}

export default connect(
  state => ({
    tabInx: state.getIn(['monitorSearchReducers', 'tabInx']), // tab
    monitorGroups: state.getIn(['monitorSearchReducers', 'monitorGroups']), // 分组数据
    monitorList: state.getIn(['monitorSearchReducers', 'monitorList']), // 分组数据列表
    monitorStatus: state.getIn(['monitorSearchReducers', 'monitorStatus']), // 数据获取成功失败状态
    key_: state.getIn(['monitorSearchReducers', 'key_']), // 随机数
  }),
  dispatch => ({
    monitorListAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/GET_MONITORLIST_ACTION', params }); // 单个分组列表action
    },
    addMonitor: (id, callback) => {
      dispatch({ type: 'HOME/SAGA/HOME_GET_MONITOR', id, callback }); // 单个分组列表action
    },
    changeHandleStatusAction: (datas) => {
      dispatch({ type: 'monitorSearch/CHANGE_HANDLESTATUS_ACTION', datas });
    },
  }),
)(Panel);