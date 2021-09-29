import React, { Component } from 'react';
// import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';

import PropTypes from 'prop-types';
import { toastShow } from '../../utils/toastUtils';
import UShare from './ShareUtil';
import SharePlatform from './componentPlatform';
import toolIcon1 from '../../static/image/share1.png';
import toolIcon2 from '../../static/image/share2.png';
import toolIcon3 from '../../static/image/share3.png';
import toolIcon4 from '../../static/image/share4.png';

const styles = StyleSheet.create({
  modalBg: {
    position: 'relative',
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.6)',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    zIndex: 200,
    backgroundColor: '#ECE8E8',
  },
  title: {
    height: 40,
    lineHeight: 50,
    textAlign: 'center',
    fontSize: 16,
  },
  btn: {
    height: 50,
    lineHeight: 50,
    borderTopWidth: 1,
    textAlign: 'center',
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
    fontSize: 18,
    color: '#5C5C5C',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  item: {
    // flex: 1,
    // justifyContent: 'center',
    // marginHorizontal: 10,
    alignItems: 'center',
  },
  imgBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  shareIcon: {
    width: 40,
    height: 40,
  },
  name: {
    height: 25,
    lineHeight: 25,
    fontSize: 14,
    color: '#333',
    marginTop: 10,
  },
});

class Index extends Component {
  // 属性声明
  static propTypes ={
    slideUp: PropTypes.bool,
    coloseModal: PropTypes.func,
  };

  // 属性默认值
  static defaultProps ={
    slideUp: false,
    coloseModal: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      slideUp: false,
      content: [{
        id: 'WECHAT',
        name: '微信',
        icon: toolIcon3,
      },
      {
        id: 'WECHATMOMENT',
        name: '微信朋友圈',
        icon: toolIcon4,
      }, {
        id: 'QQ',
        name: 'QQ',
        icon: toolIcon2,
      },
      {
        id: 'QQZONE',
        name: 'QQ空间',
        icon: toolIcon1,
      },
      ],
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { slideUp } = nextProps;
    this.setState({
      slideUp,
    });
  }

  // shouldComponentUpdate(nextProps, nextState) {

  // }

  hideShare=() => {
    const { coloseModal } = this.props;
    this.setState({
      slideUp: false,
    });
    coloseModal();
  }

  shareHandler=(id) => {
    let platform = SharePlatform.WECHAT;
    if (id === 'QQ') {
      platform = SharePlatform.QQ;
    } else if (id === 'WECHAT') {
      platform = SharePlatform.WECHAT;
    } else if (id === 'WECHATMOMENT') {
      platform = SharePlatform.WECHATMOMENT;
    } else if (id === 'QQZONE') {
      platform = SharePlatform.QQZONE;
    }

    UShare.share('您身边的物联网监控应用,中位科技', 'https://pp.myapp.com/ma_icon/0/icon_52574670_1567591073/96', 'https://a.app.qq.com/o/simple.jsp?pkgname=com.zwf3lbs.zwf3lbsapp', 'F3监控', platform, (message) => {
      // message:分享成功、分享失败、取消分享
      if (message === 200) {
        toastShow('分享成功');
      } else if (message === 0) {
        toastShow('分享失败,请检查是否安装相关应用程序');
      }
    });

    this.hideShare();
  }

  render() {
    const { content, slideUp } = this.state;
    // const isSlideUp = slideUp ? styles.slideUp : null;

    return (
      <Modal
        visible={slideUp}
        transparent
        animationType="slide"
        onRequestClose={this.hideShare}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={this.hideShare}
          style={styles.modalBg}
        >
          <View
            style={styles.container}
          >
            <Text style={styles.title}>分享</Text>

            <View
              style={styles.content}
            >
              {
            content.map(item => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => this.shareHandler(item.id)}
              >
                <View
                  style={styles.imgBox}
                >
                  <Image
                    style={styles.shareIcon}
                    source={item.icon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.name}>{item.name}</Text>
              </TouchableOpacity>
            ))
          }
            </View>

            <Text
              style={styles.btn}
              onPress={this.hideShare}
            >取消
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
}

export default Index;