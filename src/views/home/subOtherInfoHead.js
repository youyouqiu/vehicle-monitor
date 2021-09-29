/**
 * Created by wanjikun on 2018/9/25.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Image,
  ScrollView,
  // TouchableOpacity,
  PanResponder,
} from 'react-native';
import { is } from 'immutable';
import MonitorDetail from '../monitorDetail';
import detailIcon from '../../static/image/mainDetail.png';

const { width } = Dimensions.get('window'); // 获取屏幕宽度

const styles = StyleSheet.create({
  otherView: {
    width,
  },
  firstInfoView: {
    height: 100,
    backgroundColor: '#ffffff',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eeeeee',
  },
  firstInfoListView: {
    flex: 1,
    justifyContent: 'space-around',
    position: 'relative',
  },
  cell: {
    flexDirection: 'row',
    height: 22,
    // lineHeight: 22,
  },
  scrollText: {
    flex: 1,
    marginRight: 10,
  },
  devicesCon: {
    flex: 1,
  },
  detailIcon: {
    width: 22,
    height: 22,
    marginRight: 4,
  },
});

class SubOtherInfoHead extends Component {
  static propTypes ={
    detailLocationInfo: PropTypes.array,
    activeMonitorInState: PropTypes.object.isRequired,
  };

  // 属性默认值
  static defaultProps ={
    detailLocationInfo: [],
  }

  constructor() {
    super();
    this.state = {
      detailVisible: false,
    };
    this.createpanResponder();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 手势触摸操作
  createpanResponder=() => {
    this.panResponderObj2 = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        this.setState({
          detailVisible: true,
        });
      },
      onPanResponderTerminationRequest: () => true,
    });
  }

  // 隐藏详情
  cancelTap=() => {
    this.setState({
      detailVisible: false,
    });
  }

  // 终端通讯类型
  endType=(type) => {
    let value = '';
    let newType = type;
    if (typeof type !== 'string') {
      newType = type.toString();
    }
    switch (newType) {
      case '0':
        value = '交通部JT/T808-2011(扩展)';
        break;
      case '1':
        value = '交通部JT/T808-2013';
        break;
      case '2':
        value = '移为';
        break;
      case '3':
        value = '天禾';
        break;
      case '5':
        value = 'BDTD-SM';
        break;
      case '6':
        value = 'KKS';
        break;
      case '8':
        value = 'BSJ-A5';
        break;
      case '9':
        value = 'ASO';
        break;
      case '10':
        value = 'F3超长待机';
        break;
      case '11':
        value = '交通部JT/T808-2019';
        break;
      case '12':
        value = '交通部JT/T808-2013(川标)';
        break;
      case '13':
        value = '交通部JT/T808-2013(冀标)';
        break;
      case '14':
        value = '交通部JT/T808-2013(桂标)';
        break;
      case '15':
        value = '交通部JT/T808-2013(苏标)';
        break;
      case '16':
        value = '交通部JT/T808-2013(浙标)';
        break;
      case '17':
        value = '交通部JT/T808-2013(吉标)';
        break;
      case '18':
        value = '交通部JT/T808-2013(陕标)';
        break;
      default:
        break;
    }

    return value;
  }

  // name显示格式转换
  changeName=(name, category) => {
    let newName = name;

    switch (name) {
      case '计费日期':
        newName = '服务计费日期';
        break;
      case '到期日期':
        newName = category === 'SIM卡信息' ? 'SIM卡到期日期' : '服务到期日期';
        break;
      case '':
        newName = 'SIM卡到期日期';
        break;
      default:
        break;
    }

    return newName;
  }

  // value值格式转换
  changeValue=(name, value) => {
    let newValue = value;

    switch (name) {
      case '创建日期':
      case '到期日期':
      case '计费日期':
        newValue = (value && value !== '') ? value.substr(0, 10) : '';
        break;
      case '通讯类型':
        newValue = this.endType(value);
        break;
      default:
        break;
    }

    return newValue;
  }

  render() {
    const {
      detailLocationInfo,
      activeMonitorInState,
    } = this.props;
    const { detailVisible } = this.state;

    return (
      <View style={styles.otherView}>
        {/* 第一栏信息begin */}
        <View style={styles.firstInfoView}>
          <View style={styles.firstInfoListView}>
            {
              detailLocationInfo.map((item, index) => {
                let {
                  value,
                  name,
                } = item;
                const { category } = item;
                value = this.changeValue(name, value);
                name = this.changeName(name, category);

                return (
                  <View
                    style={styles.cell}
                    key={item.name}
                  >
                    <Text>
                      {name}：
                    </Text>

                    <ScrollView
                      horizontal
                      style={styles.scrollText}
                    >
                      <Text>
                        {value}
                      </Text>
                    </ScrollView>

                    {/* 查看详情图标 */}
                    {
                      index === 0 && (
                      <View
                        style={styles.detailIcon}
                        {...this.panResponderObj2.panHandlers}
                      >
                        <Image
                          source={detailIcon}
                          style={styles.detailIcon}
                        />
                      </View>
                      )
                    }
                  </View>
                );
              })
            }
          </View>
        </View>

        {/* 监控对象详情 */}
        <Modal
          animationType="slide"
          visible={detailVisible}
          onRequestClose={this.cancelTap}
        >
          <MonitorDetail
            mId={activeMonitorInState.markerId}
            mName={activeMonitorInState.title}
            onRequestClose={this.cancelTap}
          />
        </Modal>

      </View>
    );
  }
}

export default SubOtherInfoHead;