import React, {
  Component,
} from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import RootSiblings from 'react-native-root-siblings';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';

const windowHeight = Dimensions.get('window').height; // 获取屏幕宽度
// style
const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 999999,
  },
});

class ModalCont extends Component {
  static propTypes = {
    children: PropTypes.element, // 自定义扩展组件
    visible: PropTypes.bool.isRequired, // 显示隐藏模态框
    animationInTiming: PropTypes.number, // 动画持续时间
  }

  static defaultProps = {
    children: null,
    animationInTiming: 300,
  }

  render () {
    const { children, visible, animationInTiming } = this.props;
    const topN = visible ? 0 : windowHeight;
    return (
      <View
        style={[styles.modalContainer, !visible ? { display: 'none', height: 0 } : null]}
      >
        <Animatable.View
          style={[{ flex: 1 }, visible ? { top: 0 } : { top: topN }]}
          duration={animationInTiming}
          transition="top"
        >
          <View style={{ flex: 1 }}>
            {children}
          </View>
        </Animatable.View>
      </View>
    );
  }
}


let instance = null;

class Modal extends Component {
  static displayName = 'SelectMonitorModal';


  static show = () => {
    if (instance instanceof RootSiblings) {
      instance.destroy();
    }
    instance = new RootSiblings(
      <ModalCont {...this.props} />,
    );
    return instance;
  };

  static hide = () => {
    if (instance instanceof RootSiblings) {
      instance.destroy();
    } else {
      console.warn(`Modal.hide expected a \`RootSiblings\` instance as argument.\nBut got \`${typeof instance}\` instead.`);
    }
  };

  modalInstance = null;

  componentDidMount = () => {
    this.modalInstance = new RootSiblings(<ModalCont
      {...this.props}
    />);
  };

  UNSAFE_componentWillReceiveProps = (nextProps) => {
    this.modalInstance.update(<ModalCont
      {...nextProps}
    />);
  };

  componentWillUnmount = () => {
    this.modalInstance.destroy();
  };

  render () {
    return null;
  }
}

export {
  RootSiblings as Manager,
};
export default Modal;
