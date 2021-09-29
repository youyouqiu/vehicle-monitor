import React, {
  Component,
} from 'react';
import {

  StyleSheet,
  View,

} from 'react-native';


const styles = StyleSheet.create({
  defaultStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

});

class MaskContainer extends Component {
    static displayName = 'MaskContainer';

    render() {
      return (
        <View
          style={[
            styles.defaultStyle,
          ]}
          pointerEvents="auto"
        />
      );
    }
}

export default MaskContainer;
