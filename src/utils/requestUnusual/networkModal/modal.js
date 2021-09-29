import React, {
  Component,
} from 'react';
import RootSiblings from 'react-native-root-siblings';
import ModalContainer, { positions } from './modalContainer';
import { refresh } from '../../routeCondition';

let instance = null;

class Modal extends Component {
  static displayName = 'Modal';

  static positions = positions;

  static show = (
    options = {},
  ) => {
    if (instance instanceof RootSiblings) {
      instance.destroy();
    }
    instance = new RootSiblings(
      <ModalContainer
        {...options}
        onHidden={() => {
          if (instance) {
            instance.destroy();
            setTimeout(() => {
              refresh();
            }, 10);
          }
        }}
      />,
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
    this.modalInstance = new RootSiblings(<ModalContainer
      {...this.props}
      duration={0}
    />);
  };

  UNSAFE_componentWillReceiveProps = (nextProps) => {
    this.modalInstance.update(<ModalContainer
      {...nextProps}
      duration={0}
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
