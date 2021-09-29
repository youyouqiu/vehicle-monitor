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
  // ScrollView,
  // Keyboard,
} from 'react-native';
import Loading from '../../common/loading';
import PanelHead from './componentPanelHead';
import PanelBody from './componentPanelBody';
import { getLocale } from '../../utils/locales';
// import SearchPanelItem from './searchPanelItem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  count: {
    marginTop: 13,
    height: 30,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  body: {
    paddingVertical: 5,
  },
  hide: {
    display: 'none',
  },
  queryTimeoutPrompt: {
    flex: 1,
    paddingTop: '55%',
    fontSize: 15,
    textAlign: 'center',
  },
});

class SearchPanel extends Component {
  static propTypes = {
    searchCount: PropTypes.number.isRequired,
    monitorCount: PropTypes.number.isRequired,
    recordCount: PropTypes.number.isRequired,
    monitorSearch: PropTypes.array.isRequired,
    searchStatus: PropTypes.string.isRequired,
    addMonitor: PropTypes.func.isRequired,
    monitorListAction: PropTypes.func.isRequired,
    searchVehicleList: PropTypes.array.isRequired,
    changeHandleStatusAction: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      active: 0,
      count: 0,
      monitorNum: 0,
      result: [],
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      searchCount, monitorSearch, searchStatus, monitorCount, changeHandleStatusAction,
    } = nextProps;
    const { monitorSearch: nowSearch } = this.props;
    const { pageSize } = this.state;
    let { active } = this.state;
    if (!is(nowSearch, monitorSearch)) {
      active = 0;
    }
    if (searchStatus) {
      if (searchStatus === 'success' && searchCount > 0) {
        const data = [...monitorSearch.values()];
        const flag = data.length > pageSize;
        this.setState({
          count: searchCount,
          monitorNum: monitorCount,
          result: data,
          // result: flag ? data.slice(0, pageSize) : data,
          showFooter: flag ? 0 : 1,
          isPullTop: !!flag,
          active,
        });
      } else {
        this.setState({
          active,
          count: 0,
          monitorNum: monitorCount,
          result: [],
        });
      }
      this.setState({
        listLoad: false,
      });
      changeHandleStatusAction({ handleStatus: true });
    } else {
      this.setState({
        active,
        count: 0,
        monitorNum: monitorCount,
        result: [],
        listLoad: false,
      });
      changeHandleStatusAction({ handleStatus: false });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 展开关闭列表
  getList = (index, item) => {
    const { monitorListAction } = this.props;
    const { active } = this.state;

    if (active === index) {
      this.setState({
        active: -1,
      });
      return;
    }

    this.setState({
      active: index,
      listLoad: true,
    });

    const vIds = item.get('vehicleIds');
    monitorListAction({
      vehicleIds: vIds,
    });
  }

  // FlatList 渲染列表
  renderItem = ({ item, index }) => {
    const { addMonitor, searchVehicleList } = this.props;
    const { active, listLoad } = this.state;

    // const lists = item.get('lists');
    const assigns = item.get('assigns');
    const monitorCount = item.get('monitorCount');

    const contentData = [...searchVehicleList];

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.6}
          style={{ width: '100%' }}
          onPress={() => this.getList(index, item)}
        >
          <PanelHead
            title={assigns}
            count={monitorCount}
            isActive={active === index}
          />
        </TouchableOpacity>
        {
          active === index
            ? (
              // <PanelBody
              //   eventItem={[...lists]}
              //   addMonitor={addMonitor}
              // />
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
            )
            : null
        }
      </View>
    );
  }

  getContent = () => {
    const { searchStatus } = this.props;
    const { count } = this.state;
    if (searchStatus === 'failed') {
      return <Text style={styles.queryTimeoutPrompt}>{getLocale('queryTimeoutPrompt')}</Text>;
    }
    return (
      <Text style={styles.count}>
        搜索结果：{count}条,暂无该监控对象!
      </Text>
    );
  }


  render() {
    const { recordCount } = this.props;
    const {
      result, monitorNum,
    } = this.state;
    const { searchStatus } = this.props;
    return (
      <View style={styles.container}>
        {
          !searchStatus ? <Loading type="page" />
            : (
              <View style={{ flex: 1 }}>
                {
                  result.length === 0
                    ? this.getContent()
                    : (
                      <View style={{ flex: 1 }}>
                        <Text style={styles.count}>
                          搜索结果：{monitorNum}个对象,{recordCount}条记录
                        </Text>
                        <FlatList
                          data={result}
                          initialNumToRender={result.length > 20 ? 20 : result.length}
                          renderItem={this.renderItem}
                          keyExtractor={(item, index) => index.toString()}
                          extraData={this.state}
                          onEndReachedThreshold={0.5}
                        />
                      </View>
                    )
                }
              </View>
            )
        }
      </View>
    );
  }
}

export default connect(
  state => ({
    searchStatus: state.getIn(['monitorSearchReducers', 'searchStatus']), // 搜索结果数量
    searchCount: state.getIn(['monitorSearchReducers', 'searchCount']), // 搜索结果数量
    monitorCount: state.getIn(['monitorSearchReducers', 'monitorCount']), // 搜索监控对象总数
    recordCount: state.getIn(['monitorSearchReducers', 'recordCount']), // 搜索监控记录总数
    monitorSearch: state.getIn(['monitorSearchReducers', 'monitorSearch']), // 搜索数据列表
    searchVehicleList: state.getIn(['monitorSearchReducers', 'searchVehicleList']), // 搜索当前分组下的监控对象列表

  }),
  dispatch => ({
    addMonitor: (id, callback) => {
      dispatch({ type: 'HOME/SAGA/HOME_GET_MONITOR', id, callback }); // 单个分组列表action
    },
    monitorListAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/SEARCH_MONITORLIST_ACTION', params }); // 单个分组列表action
    },
    changeHandleStatusAction: (datas) => {
      dispatch({ type: 'monitorSearch/CHANGE_HANDLESTATUS_ACTION', datas });
    },
  }),
)(SearchPanel);