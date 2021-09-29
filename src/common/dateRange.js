import React, { Component } from 'react';
import { View, Modal, Text } from 'react-native';
import PropTypes from 'prop-types';


class PieChart extends Component {
  static propTypes = {
    visible: PropTypes.bool,
  };

  static defaultProps = {
    visible: false,
  };


  state = {

  }


  render() {
    const {
      visible,
    } = this.props;
    return (
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
      >
        <View><Text>55555555555555555</Text></View>
      </Modal>
    );
  }
}


export default PieChart;
