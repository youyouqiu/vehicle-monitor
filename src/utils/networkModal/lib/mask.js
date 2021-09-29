import React, {
  Component,
} from 'react';
import RootSiblings from 'react-native-root-siblings';
import MaskContainer, { positions } from './maskContainer';

let instance = null;

class Mask extends Component {
  static displayName = 'Mask';

  // static propTypes = MaskContainer.propTypes;

  static positions = positions;

  static show = (
    options = {},
  ) => {
    if (instance instanceof RootSiblings) {
      instance.destroy();
    }
    instance = new RootSiblings(
      <MaskContainer
        {...options}
        visible
        onHidden={() => {
          if (instance) {
            instance.destroy();
          }
        }}
      />,
    );
    return instance;
  };

  static hide = (mask) => {
    if (instance instanceof RootSiblings) {
      instance.destroy();
    } else {
      console.warn(`Mask.hide expected a \`RootSiblings\` instance as argument.\nBut got \`${typeof mask}\` instead.`);
    }
  };

  modalInstance = null;

  componentDidMount = () => {
    this.modalInstance = new RootSiblings(<MaskContainer
      {...this.props}
      duration={0}
    />);
  };

  UNSAFE_componentWillReceiveProps = (nextProps) => {
    this.modalInstance.update(<MaskContainer
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
export default Mask;
