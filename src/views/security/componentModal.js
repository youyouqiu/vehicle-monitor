import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { is } from 'immutable';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import PanelPage from './componentPage';

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
        onRequestClose={() => {}}
      >
        <TouchableOpacity
          // onPress={closeFun}
          activeOpacity={1}
          style={styles.container}
        >
          <PanelPage
            closeFun={closeFun}
            type={type}
          />
        </TouchableOpacity>
      </Modal>
    );
  }
}

export default PanelModal;