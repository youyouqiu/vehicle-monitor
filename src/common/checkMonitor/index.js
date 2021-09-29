import React, { Component } from 'react';
// import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View, Text, StyleSheet,
  LayoutAnimation,
  FlatList, Platform,
  TouchableOpacity, Modal, Alert,
  Image, Keyboard,
} from 'react-native';

import Loading from '../loading';
// import storage from '../../utils/storage';
import {
  getUserSetting, getCurAccont, getUserStorage,
} from '../../server/getStorageData';
import storage from '../../utils/storage';
import {
  getAlarmMonitor,
  getStatisticalMonitor,
  getWorkingStatisticalMonitor,
  getPollingOilMassMonitor,
  getOilConsumptionMonitor,
  getFuzzyMonitorOfUser,
  getFuzzyVehicleOfUser,
  getFuzzyHourPollsOfUser,
  getFuzzyPollingOilOfUser,
  getFuzzyOilSensorOfUser,
} from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';// 导入toast
import GroupHeader from './groupHeader';// 标题组件
import MonitorItem from './monitorItem';// 内容item组件
import MonitorSearch from './monitorSearch';// 搜索组件
import SearchHistory from '../searchHistory';
import closeIcon from '../../static/image/closeIcon1.png';

import { getLocale } from '../../utils/locales';


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    backgroundColor: 'rgb(244,247,250)',
  },
  flewView: {
    flex: 1,
  },
  checkHeader: {
    position: 'relative',
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 30 : 15,
    backgroundColor: '#339eff',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
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
  btnGroup: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: '#eae6e6',
    backgroundColor: '#fff',
  },
  btn: {
    width: '40%',
    minWidth: 100,
    maxWidth: 400,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: {
    color: '#fff',
  },
  closeTouch: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 34 : 19,
    right: 15,
  },
  closeIcon: {
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

class MonitorModal extends Component {
  static propTypes = {
    checkMonitorsData: PropTypes.object.isRequired, // 被勾选的分组及监控对象
    confirmFun: PropTypes.func.isRequired, // 点击确认执行方法
    cancelFun: PropTypes.func.isRequired, // 点击取消执行方法
    dataType: PropTypes.number.isRequired, // 数据类型(区分是否通过风险设置筛选监控对象)
    getMonitorType: PropTypes.number.isRequired, // 监控对象类型(0:车，1:人，2:物，3:所有)
  }

  constructor(props) {
    super(props);
    this.state = {
      infoData: [], // 分组监控对象信息
      showFooter: 0, // 控制底部加载显示文本
      isSelect: 0, // 折叠列表默认展开项
      isPullTop: false, // 是否可上拉加载
      itemHeight: 40, // 列表项高度
      sectionList: null, // 列表ref
      timer: null,
      newTimer: null,
      checkData: { // 勾选的监控对象
        assIds: [],
        hasCheckItems: [],
        monitors: [],
      },
      pageCount: 1,
      pageSize: 20,
      historyStoreKey: 'monitorSearchHistory',
      searchParam: null, // 搜索参数
      searchHistoryVisible: false, // 搜索历史记录显示
      inputValue: '', // 搜索输入框值
      initStatus: 'start',
      maxNum: 100, // 最多选择数量
      clearTextVisible: null,
    };

    const { checkMonitorsData } = this.props;
    let newObj = {
      assIds: [],
      hasCheckItems: [],
      monitors: [],
    };
    if (checkMonitorsData) { // 深度拷贝选中数据
      newObj = JSON.parse(JSON.stringify(checkMonitorsData));
    }
    this.state.checkData = newObj;

    // 获取用户在后台配置的信息
    getUserSetting().then((res) => {
      const num = res.app.maxStatObjNum || 100;
      this.state.maxNum = num;
      this.getMonitorData();
    }).catch((err) => {
      this.getMonitorData();
    });
    getCurAccont().then((userName) => {
      this.state.userName = userName;
    });
  }

  // 获取监控对象数据(param:type 0:'车',1:'人',2:'物',3:'所有')
  getMonitorData = () => {
    const { dataType, getMonitorType } = this.props;
    const {
      pageCount,
      pageSize,
      isSelect,
      searchParam,
    } = this.state;
    let param = {
      page: pageCount,
      pageSize,
      type: 0,
    };
    let getDataFun = getAlarmMonitor;// 报警排名，报警处置
    if (searchParam) {
      param = Object.assign(param, searchParam);
      getDataFun = getFuzzyVehicleOfUser;
    }
    if (dataType === 2) { // 上线统计，超速统计
      param.type = getMonitorType || 0;
      getDataFun = getStatisticalMonitor;
      if (searchParam) {
        getDataFun = getFuzzyMonitorOfUser;
      }
    } else if (dataType === 3) { // 工时统计
      getDataFun = getWorkingStatisticalMonitor;
      if (searchParam) {
        getDataFun = getFuzzyHourPollsOfUser;
      }
    } else if (dataType === 4) { // 油量里程
      getDataFun = getPollingOilMassMonitor;
      if (searchParam) {
        getDataFun = getFuzzyPollingOilOfUser;
      }
    } else if (dataType === 5) { // 油耗里程
      getDataFun = getOilConsumptionMonitor;
      if (searchParam) {
        getDataFun = getFuzzyOilSensorOfUser;
      }
    }
    this.setState({
      initStatus: 'start',
    });
    getDataFun(param).then((res) => {
      const monitorsObj = res;
      if (monitorsObj.statusCode === 200) {
        const { infoData } = this.state;
        const data = monitorsObj.obj.assignmentList;
        const isPullTop = monitorsObj.obj.anythingElse;
        const len = data.length;
        for (let i = 0; i < len; i += 1) {
          data[i].check = false;
          data[i].hasCheckItem = false;
          const item = data[i].monitors;
          const itemLen = item.length;
          for (let j = 0; j < itemLen; j += 1) {
            item[j].check = false;
          }
        }
        if (len > 0) {
          this.setCheckData(data);
        }
        let newData = data;
        if (pageCount > 1) {
          newData = infoData.concat(data);
        }
        for (let i = 0; i < newData.length; i += 1) {
          newData[i].key = i;
          newData[i].data = [];
          if (i === isSelect) {
            newData[i].data = newData[i].monitors.length > 0 ? newData[i].monitors : [{}];
          }
        }

        let count = pageCount;
        if (isPullTop) {
          count = pageCount + 1;// 更新当前页码
        }
        this.setState({
          isPullTop,
          pageCount: count,
          infoData: newData,
          showFooter: 0,
          initStatus: 'end',
        });
      } else {
        toastShow(getLocale('interfaceError'), { duration: 2000 });
        this.setState({
          isPullTop: false,
          infoData: [],
          pageCount: 1,
          showFooter: 1,
          isSelect: 0,
          initStatus: 'end',
        });
      }
    }).catch(() => {
      toastShow(getLocale('interfaceError'), { duration: 2000 });
      this.setState({
        isPullTop: false,
        infoData: [],
        pageCount: 1,
        showFooter: 1,
        isSelect: 0,
        initStatus: 'end',
        checkData: {
          assIds: [],
          hasCheckItems: [],
          monitors: [],
        },
      });
    });
  };

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount = () => {
    const { timer, newTimer } = this.state;
    if (newTimer) { clearInterval(newTimer); }
    if (timer != null) { clearInterval(timer); }
  }

  // 上拉加载
  pullTopRefresh = () => {
    const { isPullTop, showFooter } = this.state;
    // 如果是正在加载中或没有更多数据了，则返回
    if (!isPullTop || showFooter !== 0) {
      return;
    }
    this.setState({
      showFooter: 2,
    }, () => {
      this.getMonitorData();
    });
  }

  // header点击折叠展开
  itemTap = (index) => {
    // 点击的item如果是同一个, 就置为初始状态-1, 也就是折叠的状态
    let select = index;
    const {
      isSelect, infoData, timer, newTimer,
    } = this.state;
    if (newTimer) clearInterval(newTimer);
    if (timer) clearInterval(timer);
    if (isSelect === index) {
      select = -1;
    }
    infoData[index].data = infoData[index].monitors.length > 0 ? infoData[index].monitors : [{}];
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
    });
    if (select !== -1) {
      this.setState({
        infoData,
      });
    }
  }

  // 组装被勾选的分组及监控对象数据
  setCheckData = (setData) => {
    const { checkData } = this.state;
    const setDataInfo = setData;
    const allLen = setDataInfo.length;
    for (let i = 0; i < allLen; i += 1) {
      const item = setDataInfo[i].monitors;
      const itemLen = item.length;
      let checkNum = 0;
      for (let j = 0; j < itemLen; j += 1) {
        if (checkData.monitors.indexOf(item[j].id) !== -1) {
          item[j].check = true;
          setDataInfo[i].hasCheckItem = true;
          if (checkData.hasCheckItems.indexOf(setDataInfo[i].assId) === -1) {
            checkData.hasCheckItems.push(setDataInfo[i].assId);
          }
          checkNum += 1;
        } else {
          item[j].check = false;
        }
      }

      if (itemLen !== 0) {
        if (checkNum === itemLen) {
          setDataInfo[i].check = true;
          setDataInfo[i].hasCheckItem = false;
          const curIndex = checkData.hasCheckItems
            .findIndex(item1 => item1 === setDataInfo[i].assId);
          if (curIndex !== -1) {
            checkData.hasCheckItems.splice(curIndex, 1);
          }
          if (checkData.assIds.indexOf(setDataInfo[i].assId) === -1) {
            checkData.assIds.push(setDataInfo[i].assId);
          }
        } else {
          setDataInfo[i].check = false;
          const curIndex = checkData.assIds.findIndex(item1 => item1 === setDataInfo[i].assId);
          if (curIndex !== -1) {
            checkData.assIds.splice(curIndex, 1);
          }
        }

        if (checkNum === 0) {
          setDataInfo[i].check = false;
          setDataInfo[i].hasCheckItem = false;
          const curIndex = checkData.assIds.findIndex(item1 => item1 === setDataInfo[i].assId);
          if (curIndex !== -1) {
            checkData.assIds.splice(curIndex, 1);
          }
          const curIndex1 = checkData.hasCheckItems
            .findIndex(item1 => item1 === setDataInfo[i].assId);
          if (curIndex1 !== -1) {
            checkData.hasCheckItems.splice(curIndex, 1);
          }
        }
      } else if (checkData.assIds.indexOf(setDataInfo[i].assId) === -1) {
        setDataInfo[i].check = false;
      } else {
        setDataInfo[i].check = true;
      }
      setDataInfo[i].monitors = item;
    }
    return setDataInfo;
  }

  // 监控对象勾选方法
  checkItem = (type, id, checkFlag, index) => {
    const {
      infoData, isSelect, checkData, maxNum,
    } = this.state;
    if (type === 'group') { // 勾选分组
      const { monitors } = infoData[index];
      const len = monitors.length;
      let pushNum = 0;
      const newArr = [];
      for (let i = 0; i < len; i += 1) {
        if (checkFlag) {
          if (checkData.monitors.indexOf(monitors[i].id) === -1) {
            pushNum += 1;
            newArr.push(monitors[i].id);
          }
        } else {
          monitors[i].check = checkFlag;
          const curIndex = checkData.monitors.findIndex(item => item === monitors[i].id);
          if (index !== -1) {
            checkData.monitors.splice(curIndex, 1);
          }
        }
      }
      if (checkFlag) {
        const num = checkData.monitors.length + pushNum;
        if (num > maxNum) { // 勾选数量超过最多勾选数量
          Alert.alert(
            getLocale('checkTitle'),
            getLocale('checkMaxNum') + maxNum + getLocale('monitorNum'),
            [
              { text: getLocale('sure'), onPress: () => { } },
            ],
          );
          return;
        }
        for (let i = 0; i < len; i += 1) {
          monitors[i].check = checkFlag;
        }
        checkData.monitors = checkData.monitors.concat(newArr);
        if (checkData.assIds.indexOf(id) === -1) {
          checkData.assIds.push(id);
        }
      } else {
        const curIndex = checkData.assIds.findIndex(item => item === id);
        if (curIndex !== -1) {
          checkData.assIds.splice(curIndex, 1);
        }
        const curIndex1 = checkData.hasCheckItems.findIndex(item => item === id);
        if (curIndex1 !== -1) {
          checkData.hasCheckItems.splice(curIndex1, 1);
        }
      }
    } else if (checkFlag) { // 勾选监控对象
      if (checkData.monitors.indexOf(id) === -1) {
        const num = checkData.monitors.length + 1;
        if (num > maxNum) { // 勾选数量超过最多勾选数量
          Alert.alert(
            getLocale('checkTitle'),
            getLocale('checkMaxNum') + maxNum + getLocale('monitorNum'),
            [
              { text: getLocale('sure'), onPress: () => { } },
            ],
          );
          return;
        }
        checkData.monitors.push(id);
      }
    } else { // 取消勾选监控对象
      const curIndex = checkData.monitors.findIndex(item => item === id);
      if (curIndex !== -1) {
        checkData.monitors.splice(curIndex, 1);
      }
    }
    this.setCheckData(infoData);

    if (index !== undefined && checkFlag) {
      if (isSelect !== -1) { infoData[isSelect].data = []; }
      infoData[index].check = true;
      infoData[index].data = infoData[index].monitors.length > 0 ? infoData[index].monitors : [{}];
      this.setState({
        isSelect: index,
      });
    }
    this.setState({
      infoData,
      checkData,
    });
  }

  // 点击确认按钮
  confirmTap = () => {
    const { confirmFun } = this.props;
    const { checkData } = this.state;
    if (typeof confirmFun === 'function' && checkData.monitors.length > 0) {
      confirmFun(checkData);
    }
  }

  // 点击取消按钮
  cancelTap = () => {
    const { cancelFun } = this.props;
    const { searchHistoryVisible, searchParam } = this.state;
    if (searchHistoryVisible || searchParam) {
      Keyboard.dismiss();
      this.setState({
        clearTextVisible: false,
      }, () => {
        this.setState({
          clearTextVisible: null,
        });
      });
      this.changeHistoryVisible(false);
      return;
    }
    if (typeof cancelFun === 'function') {
      cancelFun();
    }
  }

  renderNewItem = (data) => {
    const { isSelect } = this.state;
    const { data: allItem } = data.item;

    return (
      <View>
        <GroupHeader
          item={data.item}
          tapFun={this.itemTap}
          checkItem={this.checkItem}
          index={data.item.key}
          isActive={isSelect === parseInt(data.item.key, 10)}
        />
        {
          isSelect === data.item.key
            ? allItem.map(item => (
              <MonitorItem
                item={item}
                checkItem={this.checkItem}
              />
            ))
            : null
        }
      </View>
    );
  }

  // sectionList设置ref
  getRef = (sectionList) => {
    this.setState({
      sectionList,
    });
  }

  // 底部显示样式
  renderFooter = () => {
    const {
      showFooter, pageCount,
    } = this.state;
    if (showFooter === 2 && pageCount > 1) {
      return loadingStyle;
    }
    return null;
  }

  // 列表顶部
  renderHeader = () => {
    const { infoData, searchParam, initStatus } = this.state;
    if (infoData.length === 0 && initStatus === 'end') {
      if (searchParam) {
        return <Text style={styles.noData}>{getLocale('noSearchMonitor')}</Text>;
      }
      return <Text style={styles.noData}>{getLocale('noMonitor')}</Text>;
    }
    return null;
  }

  // 更新缓存中的搜索历史数据
  changeHistory = (value) => {
    const { historyStoreKey } = this.state;
    getUserStorage().then((res) => {
      const { userName } = this.state;
      const result = res || {};
      const userObj = result[userName] || {};
      const data = userObj[historyStoreKey] || [];
      const index = data.indexOf(value);
      if (index !== -1) {
        data.splice(index, 1);
      } else if (data.length >= 15) {
        data.splice(-1, 1);
      }
      data.unshift(value);
      if (result[userName]) {
        result[userName][historyStoreKey] = data;
      } else {
        result[userName] = {};
        result[userName][historyStoreKey] = data;
      }
      storage.save({
        key: 'userStorage',
        data: result,
      });
    });
  }

  // 模糊搜索方法
  searchFun = (param) => {
    const { search } = param;
    this.changeHistory(search);
    this.setState({
      isSelect: 0,
      pageCount: 1,
      infoData: [],
      initStatus: 'start',
      searchParam: param,
      showFooter: 0,
      isPullTop: false,
      searchHistoryVisible: false,
    }, () => {
      this.getMonitorData();
    });
  }

  // 搜索类型切换(对象、分组)
  changeHistoryStoreKey = (tabIndex) => {
    this.setState({
      historyStoreKey: tabIndex === 0 ? 'monitorSearchHistory' : 'groupSearchHistory',
    });
  }

  // 搜索历史显示切换
  changeHistoryVisible = (value) => {
    const { searchHistoryVisible } = this.state;
    if (searchHistoryVisible !== value) {
      this.setState({
        searchHistoryVisible: value,
      });
    }
    if (!value) { // 关闭搜索结果页,重新请求列表数据
      this.setState({
        infoData: [],
        initStatus: 'start',
        isSelect: 0,
        pageCount: 1,
        showFooter: 0,
        isPullTop: false,
        searchParam: null,
      }, () => {
        this.getMonitorData();
      });
    }
  }

  // 搜索历史记录选择
  checkCallBack = (value) => {
    this.setState({
      inputValue: value,
      searchHistoryVisible: false,
    }, () => {
      this.setState({
        inputValue: null,
      });
      this.changeHistory(value);
      Keyboard.dismiss();
    });
  }

  // 关闭modal
  closeModal = () => {
    this.setState({
      searchParam: null,
      searchHistoryVisible: false,
    }, () => {
      this.cancelTap();
    });
  }

  render() {
    const {
      itemHeight, infoData, checkData,
      initStatus, pageCount, maxNum, isSelect,
      searchHistoryVisible, inputValue,
      historyStoreKey, clearTextVisible,
    } = this.state;

    const num = (isSelect === -1 || !infoData[isSelect]) ? 0 : infoData[isSelect].monitors.length;
    const initNum = infoData.length + num;

    return (
      <Modal
        animationType="slide"
        visible
        onRequestClose={this.cancelTap}
      >
        <View style={styles.container}>
          <View style={styles.checkHeader}>
            <Text style={styles.headerTitle}>
              {getLocale('checkMonitor')}({checkData.monitors ? checkData.monitors.length : 0}/{maxNum})
            </Text>
            <TouchableOpacity
              style={styles.closeTouch}
              onPress={this.closeModal}
            >
              <Image
                style={styles.closeIcon}
                source={closeIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.flewView}>
            <MonitorSearch
              searchFun={this.searchFun}
              inputValue={inputValue}
              cancelVisible={clearTextVisible}
              changeHistoryStoreKey={this.changeHistoryStoreKey}
              changeHistoryVisible={this.changeHistoryVisible}
            />
            {
              searchHistoryVisible
                ? (
                  <View style={styles.flewView}>
                    <SearchHistory
                      getDataFun={getUserStorage}
                      storeKey={historyStoreKey}
                      checkCallBack={this.checkCallBack}
                    />
                  </View>
                )
                : (
                  <View style={styles.flewView}>
                    {initStatus === 'start' && pageCount === 1
                      ? <Loading type="page" />
                      : (
                        <FlatList
                          ref={this.getRef}
                          data={infoData}
                          style={styles.flewView}
                          initialNumToRender={initNum}
                          renderItem={this.renderNewItem}
                          keyExtractor={(item, index) => index + item}// 生成一个不重复的key
                          extraData={this.state}
                          getItemLayout={(data, index) => (
                            { length: itemHeight, offset: itemHeight * index, index })
                          }
                          ListHeaderComponent={this.renderHeader}
                          ListFooterComponent={this.renderFooter}
                          onEndReachedThreshold={0.001}
                          onEndReached={this.pullTopRefresh}
                        />
                      )
                    }
                    <View style={styles.btnGroup}>
                      <TouchableOpacity
                        style={
                          [styles.btn, checkData.monitors.length > 0
                            ? { backgroundColor: 'rgb(66,135,255)' }
                            : { backgroundColor: 'rgb(194,194,194)' }]}
                        onPress={() => { this.confirmTap(); }}
                      >
                        <Text style={styles.txt}>{getLocale('sure')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
            }
          </View>
        </View>
      </Modal>
    );
  }
}

export default MonitorModal;