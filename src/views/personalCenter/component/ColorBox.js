import React, { Component } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
} from 'react-native';
// import PropTypes from 'prop-types';
import storage from '../../../utils/storage';
import { getCurAccont } from '../../../server/getStorageData';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
const styles = StyleSheet.create({
  box: {
    height: 4,
    // backgroundColor: '#33a3dc',
    backgroundColor: 'rgba(255,208,69,0.9)',
    borderRadius: 4,
    position: 'absolute',
    top: 66,
    left: 18,

  },
});

class ColorBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      boxWidth: 80,
      speedValues: [30, 90],
    };
  }

  componentDidMount() {
    getCurAccont().then((curUser) => {
      this.readData(curUser);
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { speedValues } = nextProps;
    if (speedValues && speedValues.length > 0) {
      this.boxChange(speedValues);
    }
  }

  // 获取存储数据
  readData = async (curUser) => {
    const { speedValues } = this.state;
    storage.load({
      key: 'userSetting',
      autoSync: true,
      syncInBackground: true,
      syncParams: {
        user: curUser,
      },
    }).then((ret) => {
      if (!ret || !ret[curUser]) {
        return;
      }
      const { speedSlider } = ret[curUser];
      if (speedValues[0] === speedSlider[0] && speedValues[1] === speedSlider[1]) {
        return;
      }
      this.setState({
        speedValues: speedSlider, // 速度设置
      }, () => {
        this.boxChange(speedSlider);
      });
    }).catch((err) => {
      console.log('storage load err', err);
    });
  }

  boxChange = (boxInfo) => {
    const i = boxInfo[0];
    let j = 0;
    if (i <= 20) {
      // 颜色条宽度 = (设置的速度值 * (屏幕宽度 - 左右margin) / 总速度值) - (设置的速度值 * 偏移修正)
      // eslint-disable-next-line radix
      j = parseInt((i * ((windowWidth - 40) / 150)) + (i * 0.8));
    } else if (i > 20) {
      // eslint-disable-next-line radix
      j = parseInt(i * (windowWidth / 150)) - (i * 0.28);
    }
    this.setState({
      // eslint-disable-next-line react/no-unused-state
      boxWidth: j,
    });
  }

  render() {
    const { boxWidth } = this.state;
    return (
      <View
        style={[styles.box, { width: boxWidth }]}
      />
    );
  }
}

export default ColorBox;
