import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import wArrowRight from '../../static/image/wArrowRight.png';
import wCar from '../../static/image/wSecurity1.png';
import wImg from '../../static/image/wSecurity3.png';
import wVideo from '../../static/image/wSecurity2.png';
import PanelModal from './componentModal';
import { getLocale } from '../../utils/locales';

// style
const styles = StyleSheet.create({
  panel_head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    overflow: 'hidden',
    height: 45,
  },
  img: {
    width: 25,
    height: 25,
    marginRight: 10,
    marginLeft: 15,
  },
  title_box: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    maxWidth: '98%',
    fontSize: 16,
    color: '#000',
  },
  msg: {
    maxWidth: '100%',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  tit: {
    fontSize: 12,
    marginRight: 5,
    color: 'rgb(154,158,161)',
  },
  icon: {
    width: 22,
    height: 18,
    marginRight: 10,
  },
  imgIcon: {
    width: '100%',
    height: '100%',
  },
  dealBtn: {
    fontSize: 12,
    backgroundColor: '#3399FF',
    color: '#fff',
    height: 22,
    lineHeight: 22,
    width: 40,
    textAlign: 'center',
    borderRadius: 3,
    marginRight: 5,
  },
  panel_icon: {
    width: 25,
    height: 25,
    marginRight: 5,
  },
  rotate: {
    transform: [
      // 角度
      { rotate: '90deg' },
    ],
  },
});

class PanelHead extends Component {
  // 属性声明
  static propTypes ={
    riskItem: PropTypes.object.isRequired,
    dealFun: PropTypes.func.isRequired,
    isActive: PropTypes.bool,
    // mediaInfo: PropTypes.object.isRequired,
    getMediaAction: PropTypes.func.isRequired,
  };

  static defaultProps ={
    isActive: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      type: 0,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 检测网络
  getConnect=(riskItem, type) => {
    if ((riskItem.get('picFlag') === 0 && type === 0) || (riskItem.get('videoFlag') === 0 && type === 2)) {
      return;
    }

    if (type === 2) {
      NetInfo.fetch().then((connectionInfo) => {
        if (connectionInfo.type !== 'wifi') {
          Alert.alert(
            getLocale('securityConnecTit'),
            getLocale('securityConnecCon'),
            [
              { text: getLocale('securityCancel'), onPress: () => {} },
              {
                text: getLocale('securitySure'),
                onPress: () => {
                  this.openModal(riskItem, type);
                },
              },
            ],
            { cancelable: false },
          );
        } else {
          this.openModal(riskItem, type);
        }
      });
      return;
    }

    this.openModal(riskItem, type);
  }

  // 获取风险证据
  openModal=(riskItem, type) => {
    const { getMediaAction } = this.props;
    this.setState({
      modalVisible: true,
      type,
    });

    getMediaAction({
      riskId: riskItem.get('id'),
      mediaType: type,
    });
  }

  // 关闭模态框
  modalClose=() => {
    this.setState({
      modalVisible: false,
    });
  }

  // 处理方法
  dealFun=() => {
    const { dealFun } = this.props;
    dealFun();
  }

  // 转义风险等级
  getRiskLevel=(num) => {
    let level = '';
    switch (num) {
      case 1:
        level = '一般(低)';
        break;
      case 2:
        level = '一般(中)';
        break;
      case 3:
        level = '一般(高)';
        break;
      case 4:
        level = '较重(低)';
        break;
      case 5:
        level = '较重(中)';
        break;
      case 6:
        level = '较重(高)';
        break;
      case 7:
        level = '严重(低)';
        break;
      case 8:
        level = '严重(中)';
        break;
      case 9:
        level = '严重(高)';
        break;
      case 10:
        level = '特重(低)';
        break;
      case 11:
        level = '特重(中)';
        break;
      case 12:
        level = '特重(高)';
        break;
      default:
        break;
    }
    return level;
  }

  render() {
    const { isActive, riskItem } = this.props;
    const { modalVisible, type } = this.state;
    return (
      <View
        style={styles.panel_head}
      >
        <Image
          source={wCar}
          resizeMode="contain"
          style={styles.img}
        />

        <View style={styles.title_box}>
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {riskItem.get('brand')}
          </Text>

          <View style={styles.msg}>
            <Text
              style={[styles.tit, { width: 60, marginRight: 0 }]}
            >
              {this.getRiskLevel(riskItem.get('riskLevel'))}
            </Text>
            <Text
              style={styles.tit}
            >
              {riskItem.get('riskType')}
            </Text>
            <Text
              style={styles.tit}
            >
              {riskItem.get('warningTime').substr(11)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.icon}
          onPress={() => { this.getConnect(riskItem, 0); }}
        >
          <Image
            source={riskItem.get('picFlag') ? wImg : null}
            style={styles.imgIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.icon}
          onPress={() => { this.getConnect(riskItem, 2); }}
        >
          <Image
            source={riskItem.get('videoFlag') ? wVideo : null}
            resizeMode="contain"
            style={styles.imgIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={this.dealFun}
        >
          <Text style={styles.dealBtn}>{getLocale('securityDeatl')}</Text>
        </TouchableOpacity>

        <Animatable.Image
          duration={300}
          transition="rotate"
          source={wArrowRight}
          style={[styles.panel_icon, isActive ? styles.rotate : null]}
        />

        {/* 模态框 */}
        <PanelModal
          modalVisible={modalVisible}
          type={type}
          closeFun={this.modalClose}
        />
      </View>
    );
  }
}

export default connect(
  // state => ({
  //   mediaInfo: state.getIn(['securityReducers', 'mediaInfo']), // 风险证据库
  // }),
  null,
  dispatch => ({
    getMediaAction: (params) => {
      dispatch({ type: 'security/SAGA/GET_MEDIA_ACTION', params }); // 获取风险证据
    },
  }),
)(PanelHead);