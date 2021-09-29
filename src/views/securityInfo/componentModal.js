import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { is } from 'immutable';
import {
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import MediaPage from './componentMediaPage';
import EventPage from './componentEventPage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

class PanelModal extends Component {
  static propTypes = {
    modalVisible: PropTypes.bool, // 控制显示隐藏
    type: PropTypes.number.isRequired, // 控制显示隐藏
    closeFun: PropTypes.func.isRequired, // 关闭
  }

  static defaultProps ={
    modalVisible: false,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    const { modalVisible, closeFun, type } = this.props;

    return (
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
      >
        <View
          // onPress={closeFun}
          style={styles.container}
        >
          {
            type === 3
              ? (
                // 事件弹层
                <EventPage
                  closeFun={closeFun}
                />
              )
              : (
                // 视频、图片弹层
                <MediaPage
                  closeFun={closeFun}
                  type={type}
                />
              )
          }
        </View>
      </Modal>
    );
  }
}

export default PanelModal;