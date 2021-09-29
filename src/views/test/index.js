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
} from 'react-native';

import PropTypes from 'prop-types';
import TimerModal from '../../common/timerModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  time: {
    marginTop: 10,
  },
  item: {
    textAlign: 'center',
    marginVertical: 10,
  },
  total: {
    marginVertical: 10,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#000',
    textAlign: 'center',
    height: 40,
    lineHeight: 40,
    color: '#fff',
    marginTop: 20,
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
    backgroundColor: 'gray',
  },
});

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShwoModal: false,
    };
  }

  showModal = () => {
    this.setState({
      isShwoModal: true,
    });
  }

  getDate=(start, end) => {
  }

  render() {
    const { isShwoModal } = this.state;

    return (
      <View
        style={styles.container}
      >
        <Text
          style={{ marginTop: 100 }}
          onPress={this.showModal}
        >确定
        </Text>

        <TimerModal
          isShwoModal={isShwoModal}
          dateCallBack={this.getDate}
          // isEqualStart
          startDate="2019-07-10 00:00:00"
          endDate="2019-07-10 01:01:01"
          // mode="dateTime"
          // title="选择日期"
        />
      </View>
    );
  }
}

export default Index;