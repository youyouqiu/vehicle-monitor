import React, {
  Component,
} from 'react';
import RootSiblings from 'react-native-root-siblings';
import ModalContainer from './index';


let instance = null;

class Modal extends Component {
  static displayName = 'SelectMonitorModal';


  static show = (checkMonitorsData, dataType, confirmFun) => {
    if (instance instanceof RootSiblings) {
      instance.destroy();
    }
    instance = new RootSiblings(
      <ModalContainer
        checkMonitorsData={checkMonitorsData}
        dataType={dataType}
        cancelFun={() => {
          if (instance) {
            instance.destroy();
          }
        }}
        confirmFun={(checkData) => {
          if (instance) {
            instance.destroy();
            confirmFun(checkData);
          }
        }}
      />,
    );
    return instance;
  };

  static hide = () => {
    if (instance instanceof RootSiblings) {
      instance.destroy();
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
