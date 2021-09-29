/* eslint-disable no-prototype-builtins */
import React, { Component } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions,
} from 'react-native';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import { List } from 'immutable';
import wArrowLeft from '../../static/image/arrowBlue1.png';
import wArrowRight from '../../static/image/arrowBlue2.png';
// import carPic from '../../static/image/v_21.png';
import {
  setMonitor, setMonitors, refresh, getRouteKey,
} from '../../utils/routeCondition';
import { isEmpty } from '../../utils/function';
import Loading from '../loading';
import { getLocale } from '../../utils/locales';
import { checkMonitorAuth, checkMonitorOnline, getVideoChannel } from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';
import { errHandle } from '../../utils/network';
import SlideModal from './slideModal';
import storage from '../../utils/storage';
import { getUserStorage, getCurAccont } from '../../server/getStorageData';


const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
// style
const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 250,
  },
  listItem: {
    // textAlign: 'center',
    padding: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    // width: ITEM_WIDTH,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  textItem: {
    textAlign: 'center',
    fontSize: 20,
    color: '#333',
    padding: 0,
    paddingHorizontal: 0,
  },
  modaltext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    padding: 0,
    paddingHorizontal: 0,
  },
  empty: {
    fontSize: 16,
    color: '#ccc',
  },
  text: {
    alignItems: 'center',
    width: 125,
  },
  focus: {
    color: '#2c7ae7',
  },
  arrowCotnainer: {
    // borderWidth: 1,
    // borderColor: 'purple',
    flex: 1,
  },
  arrow: {
    width: 17,
    height: 23,
    marginHorizontal: 5,
  },
  carPic: {
    width: 28,
    height: 15,
    marginHorizontal: 5,
  },
});


class Monitor extends Component {
  data = {
    lastTap: null,
    clickTimeoutId: null,
  }

  viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  }

  static propTypes = {
    monitors: PropTypes.object, // 监控对象数组
    activeMonitor: PropTypes.object,
    isFocus: PropTypes.bool,
    onMonitorClick: PropTypes.func,
    onMonitorDbClick: PropTypes.func,
    onChange: PropTypes.func,
    neveronlinemonitorchange: PropTypes.func,
    addMonitor: PropTypes.func.isRequired,
  }

  static defaultProps = {
    monitors: null,
    activeMonitor: null,
    isFocus: false,
    onMonitorClick: null,
    onMonitorDbClick: null,
    onChange: null,
    neveronlinemonitorchange: null,
  }

  constructor(props) {
    super(props);
    const { activeMonitor, monitors } = props;

    if (!isEmpty(activeMonitor) && !isEmpty(monitors)) {
      const tmpIndex = monitors.findIndex(x => x.markerId === activeMonitor.markerId);
      this.state.currentIndex = tmpIndex;
      setMonitor(activeMonitor);
    } else if (isEmpty(activeMonitor) && !isEmpty(monitors)) {
      setMonitor(monitors.get(0));
    }

    if (isEmpty(monitors)) {
      setMonitor(null);
    }
    this.debounceIndexChange = debounce(this.handleOnChange, 100);
    this.debounceIndexChange500 = debounce(this.handleOnChange, 100);
  }

  state = {
    currentIndex: 0,
    isFocus: false,
    modalVisible: false,
    currentMonitorId: null,
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const {
      activeMonitor, monitors, isFocus, addMonitor,
    } = nextProps;

    let { currentIndex } = this.state;
    if (isEmpty(monitors)) {
      setMonitor(null);
      currentIndex = null;
    }
    let { currentMonitorId } = this.state;
    if (!isEmpty(activeMonitor) && !isEmpty(monitors)) {
      if (currentMonitorId === null
        || currentIndex === null
        || (currentMonitorId !== null
          && currentMonitorId !== activeMonitor.markerId)) {
        currentMonitorId = activeMonitor.markerId;
        currentIndex = monitors.findIndex(x => x.markerId === activeMonitor.markerId);
        if (currentIndex === -1) { // 底部监控对象列表中没有该监控对象时,向列表最前面塞入
          currentIndex = 0;
          addMonitor(currentMonitorId, () => {
            setTimeout(() => {
              setMonitor(activeMonitor);
            }, 60);
          });
        } else {
          setMonitor(activeMonitor);
        }
      }
    } else if (isEmpty(activeMonitor) && !isEmpty(monitors)) {
      currentIndex = 0;
      const monitor = monitors.get(currentIndex);
      setMonitor(monitor);
      currentMonitorId = monitor.markerId;
    }

    this.setState({
      isFocus,
      currentIndex,
      currentMonitorId,
    });
  }


  shouldComponentUpdate (nextProps, nextState) {
    const { activeMonitor, monitors } = nextProps;
    const { isFocus, modalVisible, currentIndex } = nextState;
    if ((monitors && this.props.monitors && monitors.length === this.props.monitors.length)
      && (activeMonitor && this.props.activeMonitor && activeMonitor.markerId === this.props.activeMonitor.markerId)
      && (isFocus === this.state.isFocus && modalVisible === this.state.modalVisible && currentIndex === this.state.currentIndex)
    ) {
      return false;
    }

    return true;
  }

  componentWillUnmount () {
    this.setState({
      modalVisible: false,
    });
  }

  checkNeverOnline = (monitorId, item, index, callback) => {
    const key = getRouteKey();
    const neverOnlineScene = ['historyData', 'monitorVideo', 'videoPlayback', 'monitorWake', 'monitorTrack', 'alarmInfo', 'home'];
    const offLineScene = ['monitorVideo', 'videoPlayback', 'monitorWake'];
    const videoScene = ['monitorVideo', 'videoPlayback'];
    const { neveronlinemonitorchange } = this.props;

    checkMonitorOnline({
      monitorId,
    }).then((res) => {
      if (res.statusCode === 200) {
        if (res.obj === 1) { // 1：校验通过
          if (key === 'videoPlayback') {
            getVideoChannel({ vehicleId: monitorId }).then((data) => {
              if (isEmpty(data.obj)) {
                toastShow(getLocale('noVideoChannelPrompt'), { duration: 2000 });
                return;
              }
              callback(item, index);
            });
          } else {
            callback(item, index);
          }
        } else if (res.obj === 2) { // 2：不在线
          if (offLineScene.indexOf(key) > -1) {
            toastShow(getLocale('monitorOffLine'), { duration: 2000 });
          } else {
            callback(item, index);
          }
        } else if (res.obj === 4) { // 4: 从未上线
          if (neverOnlineScene.indexOf(key) > -1) {
            toastShow(getLocale('monitorNeverOnLine'), { duration: 2000 });
            if (typeof neveronlinemonitorchange === 'function') {
              neveronlinemonitorchange(item, index);
            }
            callback(item, index);
          } else {
            callback(item, index);
          }
        } else if (res.obj === 3) { // 3：不为808协议
          if (videoScene.indexOf(key) > -1) {
            toastShow(getLocale(key === 'monitorVideo' ? 'video808Prompt' : 'video808PromptPlayback'), { duration: 2000 });
          } else {
            callback(item, index);
          }
        }
      } else {
        errHandle(res, this.checkNeverOnline, monitorId, item, index, callback);
        // toastShow(getLocale('requestFailed'), { duration: 2000 });
      }
    });
  }

  handleOnChange = (index) => {
    const { monitors, onChange } = this.props;
    const onChangeImmediate = (...args) => {
      setImmediate(onChange, ...args);
      // const tempFn = () => {
      //   onChange(...args);
      // };
      // InteractionManager.runAfterInteractions(tempFn);
    };
    if (!isEmpty(monitors)) {
      if (typeof onChange === 'function') {
        const item = monitors.get(index);
        setMonitor(item);

        checkMonitorAuth({
          monitorId: item.markerId,
        }).then(async (res) => {
          if (res.statusCode === 200) {
            if (res.obj === 1) { // 1：未解绑
              this.checkNeverOnline(item.markerId, item, index, onChangeImmediate);
            } else if (res.obj === 2) { // 解绑
              toastShow(getLocale('vehicleUnbindCluster'), { duration: 2000 });
              // 清除监控对象关注记录
              const curAccont = await getCurAccont();
              const userStorage = await getUserStorage();
              if (userStorage && userStorage[curAccont]) {
                const collectMonitor = userStorage[curAccont].collect;
                if (collectMonitor) {
                  const curindex = collectMonitor.index(item.markerId);
                  if (curindex !== -1) {
                    collectMonitor.splice(curindex, 1);
                    userStorage[curAccont].collect = collectMonitor;
                    storage.save({
                      key: 'userStorage',
                      data: userStorage,
                    });
                  }
                }
              }
              refresh();
            } else if (res.obj === 3) { // 没有权限
              toastShow(getLocale('noJurisdictionCluster'), { duration: 2000 });
              refresh();
            }
          } else {
            errHandle(res, this.handleOnChange, index);
            // toastShow(getLocale('requestFailed'), { duration: 2000 });
          }
        });


        // onChange(item, index);
      }
    }
    // this.setState({
    //   isFocus: false,
    // });
  }

  handleLeft = () => {
    const { monitors } = this.props;

    if (!isEmpty(monitors)) {
      const { currentIndex } = this.state;
      const newIndex = currentIndex - 1;
      if (currentIndex === 0) {
        return;
      }
      this.setState({
        currentIndex: newIndex,
      }, () => {
        this.debounceIndexChange500(newIndex);
      });
    }
  }

  handleRight = () => {
    const { monitors } = this.props;
    if (!isEmpty(monitors)) {
      const { currentIndex } = this.state;
      const newIndex = currentIndex + 1;

      if (currentIndex === monitors.size - 1) {
        return;
      }
      this.setState({
        currentIndex: newIndex,
      }, () => {
        this.debounceIndexChange500(newIndex);
      });
    }
  }

  // 点击快速切换条底部定位当前车辆
  setActiveMonitor = (item, ind) => {
    const { monitors } = this.props;
    if (!isEmpty(monitors)) {
      const newIndex = ind;
      this.debounceIndexChange500(newIndex);
      setMonitor(item);
    }
  }

  handleClick = (item, parma) => {
    const { onMonitorClick, onMonitorDbClick } = this.props;
    const now = Date.now();
    if (this.data.lastTap != null && (now - this.data.lastTap) < 300) {
      if (this.data.clickTimeoutId !== null) {
        clearTimeout(this.data.clickTimeoutId);
      }
      if (typeof onMonitorDbClick === 'function') {
        this.data.lastTap = null;
        this.data.clickTimeoutId = null;
        onMonitorDbClick(item);
        const { isFocus } = this.state;
        if (!isFocus) {
          this.setState({
            isFocus: true,
          });
        }


        if (parma !== undefined && parma !== null) {
          this.setActiveMonitor(item, parma);
        }

        return;
      }
    }
    this.data.lastTap = now;

    this.data.clickTimeoutId = setTimeout(() => {
      if (typeof onMonitorClick === 'function') {
        this.data.clickTimeoutId = null;
        onMonitorClick(item);
        this.setState({
          isFocus: false,

        });
        if (parma !== undefined && parma !== null) {
          this.setActiveMonitor(item, parma);
        }
      }
    }, 300);
  }

  handleOnModalClick = (index) => {
    this.handleOnChange(index);
  }

  onLongPress = (item) => {
    if (getRouteKey() === 'home') {
      const { monitors } = this.props;
      this.setState({
        modalVisible: true,
      });


      if (monitors !== null) {
        const monitorsArr = [...monitors.values()];
        const len = monitorsArr.length;
        if (len > 5) {
          monitorsArr.forEach((element, ind) => {
            const { markerId: eleId } = element;
            const { markerId } = item;
            if (markerId === eleId) {
              let scrollIndex;
              if (ind < 2) {
                scrollIndex = ind;
              } else if (ind > len - 3) {
                scrollIndex = len - 5;
              } else {
                scrollIndex = ind - 2;
              }


              this.modalFlatList.scrollToIndex({
                animated: true,
                index: scrollIndex,
                viewPosition: 0,
              });
            }
          });
        }
      }
    }
  }

  modalPress = () => {
    this.setState({
      modalVisible: false,
    });
  }

  unique = (arr) => {
    const obj = {};
    return arr.filter((item) => {
      // 防止key重复
      const newItem = item + JSON.stringify(item);
      // eslint-disable-next-line no-return-assign
      return obj.hasOwnProperty(newItem) ? false : obj[newItem] = true;
    });
  }

  /* eslint no-nested-ternary:off */
  render () {
    const { monitors, activeMonitor } = this.props;
    const { isFocus, modalVisible, currentIndex } = this.state;
    const itemWidth = windowWidth / 5;
    let newMonitorsArr = [];
    let newMonitor = null;
    if (!isEmpty(monitors)) {
      const monitorsArr = [...monitors.values()];
      newMonitorsArr = this.unique(monitorsArr);
      newMonitor = List(newMonitorsArr);
      setMonitors(newMonitor);
    }
    return (
      <View style={styles.textContainer}>
        <TouchableOpacity onPress={this.handleLeft} style={[styles.arrowCotnainer, { alignItems: 'flex-end' }]}>
          <Image
            source={wArrowLeft}
            style={styles.arrow}
          />
        </TouchableOpacity>

        <View
          style={styles.text}
        >

          {newMonitor === null ? <Loading type="inline" color="#3399ff" /> : (
            newMonitor.size === 0 ? <Text style={styles.empty}>{getLocale('noMonitor')}</Text> : (
              <View
                style={[styles.listItem]}
              >
                <Text
                  style={[styles.textItem,
                  // eslint-disable-next-line indent
                  isFocus && newMonitor.get(currentIndex).markerId === activeMonitor.markerId
                    // eslint-disable-next-line indent
                    ? styles.focus
                    // eslint-disable-next-line indent
                    : null, { width: windowWidth / 3 }]}
                  numberOfLines={2}
                  onLongPress={() => { this.onLongPress(newMonitor.get(currentIndex)); }}
                  onPress={() => { this.handleClick(newMonitor.get(currentIndex)); }}
                  ellipsizeMode="tail"
                >
                  {newMonitor.get(currentIndex).title}
                </Text>
              </View>
            )
          )}
        </View>
        <TouchableOpacity onPress={this.handleRight} style={styles.arrowCotnainer}>
          <Image
            source={wArrowRight}
            style={styles.arrow}
          />
        </TouchableOpacity>

        <SlideModal
          visible={modalVisible}
          animationInTiming={300}
        >
          <View style={[{ flex: 1 }, !modalVisible && { display: 'none' }]}>
            <TouchableOpacity onPress={this.modalPress} style={{ flex: 1 }}>
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
            <View style={{ height: 58, width: '100%', backgroundColor: '#fff' }}>
              {
                newMonitor === null ? <Loading type="inline" color="#3399ff" /> : (
                  <FlatList
                    ref={(view) => { this.modalFlatList = view; }}
                    horizontal
                    data={newMonitorsArr}
                    getItemLayout={(data, index) => (
                      { length: itemWidth, offset: itemWidth * index, index }
                    )}
                    initialNumToRender={10}
                    renderItem={({ item: x, index: num }) => (
                      <TouchableOpacity
                        style={[styles.listItem, { width: itemWidth }]}
                        onPress={() => { this.handleOnModalClick(num); }}
                      >
                        <View style={{
                          width: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        }}
                        >
                          <Image
                            source={{ uri: x.ico }}
                            style={styles.carPic}
                            resizeMode="contain"
                          />
                          <Text
                            style={[styles.modaltext, { width: itemWidth }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {x.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )
                    }
                  //  windowSize={300}
                  />
                )
              }
            </View>
          </View>
        </SlideModal>
      </View>

    );
  }
}

// export default Monitor;
export default connect(
  null,
  dispatch => ({
    addMonitor: (id, callback) => {
      dispatch({ type: 'HOME/SAGA/HOME_GET_MONITOR', id, callback }); // 单个分组列表action
    },
  }),
)(Monitor);