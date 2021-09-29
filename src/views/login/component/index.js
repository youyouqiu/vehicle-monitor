import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
import BackIcon from '../../../static/image/goBack.png';
import { xy1 } from './xy1'; // 服务协议
import { xy2 } from './xy2'; // 隐私政策

const styles = StyleSheet.create({
  containerBg: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 30,
    borderWidth: 1,
    borderColor: '#eee',
    borderTopWidth: 0,
  },
  itemCon: {
    height: 60,
    lineHeight: 60,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    fontSize: 20,
    color: '#333',
  },
  itemTit: {
    height: 43,
    lineHeight: 43,
    fontSize: 16,
    color: '#B6B7B8',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  total: {
    height: 75,
    lineHeight: 75,
    textAlign: 'center',
    backgroundColor: '#F2F2F2',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B6B6B',
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  btn: {
    marginTop: 10,
    borderRadius: 5,
    backgroundColor: '#4287FF',
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  btnTxt: {
    height: 45,
    lineHeight: 45,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
  },
  header: {
    height: Platform.OS !== 'ios' ? 58 : 65,
    backgroundColor: '#339eff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  leftIcon: {
    position: 'absolute',
    left: 5,
    bottom: 15,
    zIndex: 999,
  },
  title: {
    color: 'white',
    fontSize: 20,
  },
  leftIconImage: {
    height: 20,
  },
  disable: {
    backgroundColor: '#BABABA',
    color: '#fff',
  },
  datePinker: {
    width: '1005',
    bottom: 0,
  },
  blue: {
    color: '#4287FF',
  },
});

class Index extends Component {
  // 属性声明
  static propTypes = {
    isShwoModal: PropTypes.bool, // 显示隐藏modal
    title: PropTypes.string, // 弹框标题
    hideCallBack: PropTypes.func, // 关闭弹窗
  };

  static defaultProps = {
    isShwoModal: false,
    title: '',
    hideCallBack: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      isShow: false,
      isShwoModal: false,
    };
  }

  componentDidMount() {

  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { isShwoModal } = nextProps;
    if (isShwoModal) {
      this.setState({
        isShwoModal,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 关闭弹层
  onRequestClose = () => {
    const { hideCallBack } = this.props;
    this.setState({
      isShwoModal: false,
    }, () => {
      if (hideCallBack) {
        hideCallBack();
      }
    });
  }

  onError = (err) => {
    console.warn(err);
  }

  render() {
    const { isShwoModal } = this.state;
    const { title } = this.props;

    return (
      <Modal
        animationType="slide"
        visible={isShwoModal}
        onRequestClose={this.onRequestClose}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={this.onRequestClose}
          >
            <Image
              source={BackIcon}
              resizeMode="contain"
              style={styles.leftIconImage}
            />
          </TouchableOpacity>
        </View>
        {/* content */}
        <View
          style={styles.containerBg}
        >
          <ScrollView>
            {title === '服务协议' ? xy1() : xy2()}
          </ScrollView>
        </View>
      </Modal>
    );
  }
}

export default Index;
