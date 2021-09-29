import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  TouchableOpacity, Image, Platform,
} from 'react-native';
import { toastShow } from '../../utils/toastUtils';// 导入toast

import audio from '../../static/image/audio.png';// 声音图标
import audioActive from '../../static/image/audio_active.png';
import camera from '../../static/image/camera.png';// 相机图标
import cameraActive from '../../static/image/camera_active.png';
import playIco from '../../static/image/play_ico.png';// 播放图标
import pause from '../../static/image/pause.png';// 暂停图标
import addr from '../../static/image/addr.png';// 地址图标
import addrActive from '../../static/image/addr_active.png';
import screen from '../../static/image/screen.png';// 全屏图标
import screenActive from '../../static/image/screen_active.png';

// style
const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  iconItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    width: 26,
    height: 23,
  },
  playIco: {
    width: 20,
    height: 24,
  },
  pauseIco: {
    width: 20,
    height: 20,
  },
  addrIco: {
    width: 20,
    height: 24,
  },
  screenIco: {
    width: 20,
    height: 20,
  },
});

class HandleTool extends Component {
  static propTypes = {
    toggleMap: PropTypes.func.isRequired,
    playOrPauseFun: PropTypes.func.isRequired, // 播放停止函数
    playFlag: PropTypes.bool.isRequired,
    cameraFlag: PropTypes.bool.isRequired, // 拍照
    refCaptureFun: PropTypes.func.isRequired, // 播放停止函数
    mapShow: PropTypes.bool.isRequired, // 地图状态
    screenFlag: PropTypes.bool.isRequired, // 全屏
    toggleScreenFun: PropTypes.func.isRequired, // 全屏切换函数
    currentChooseVideoNum: PropTypes.number.isRequired,
    audioFlag: PropTypes.bool.isRequired, // 音频是否开启
    toggleAudioFun: PropTypes.func.isRequired, // 音频切换
  }

  constructor(props) {
    const time = new Date();
    const millisencod = time.getTime();

    super(props);
    this.state = {
      // audioFlag: false,
      // cameraFlag: false,
      // playFlag: false,
      addrFlag: false,
      ssreenFlag: false,
      clickTime: millisencod, // 双击时间间隔
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 声音控制
  toggleAudioFun=() => {
    const { toggleAudioFun } = this.props;
    toggleAudioFun();
  }

  // 拍照
  toggleCameraFun=() => {
    const { currentChooseVideoNum } = this.props;
    if (currentChooseVideoNum !== 0) {
      const { clickTime } = this.state;
      const time = new Date();
      const millisencod = time.getTime();
      const differValue = millisencod - clickTime;
      if (differValue > 1000) {
        const { cameraFlag } = this.props;
        const { refCaptureFun } = this.props;
        if (typeof refCaptureFun === 'function') {
          if (Platform.OS === 'android' && Platform.Version < 24) {
            toastShow('android版本不支持', { duration: 2000 });
            return;
          }
          refCaptureFun(cameraFlag);
        }
      }
      this.setState({
        clickTime: millisencod,
      });
    } else {
      toastShow('没有视频通道播放，不可拍照', { duration: 2000 });
    }
  }

  // 播放暂停
  togglePlayFun=() => {
    const { playFlag } = this.props;

    const { playOrPauseFun } = this.props;
    if (typeof playOrPauseFun === 'function') {
      playOrPauseFun(playFlag);
    }
  }

  // 切换地图显示状态
  toggleMapFun=() => {
    const { toggleMap, mapShow } = this.props;
    // const { addrFlag } = this.state;
    // this.setState({
    //   addrFlag: !addrFlag,
    // });
    if (typeof toggleMap === 'function') {
      toggleMap(mapShow);
    }
  }

  // 全屏控制
  toggleScreenFun=() => {
    // const { screenFlag } = this.state;
    // this.setState({
    //   screenFlag: !screenFlag,
    // });
    const { toggleScreenFun } = this.props;
    toggleScreenFun();
  }

  render() {
    // const {
    //   audioFlag,
    // } = this.state;

    const {
      playFlag, cameraFlag, mapShow, screenFlag, audioFlag,
    } = this.props;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.iconItem}
          onPress={this.toggleAudioFun}
        >
          <Image
            source={audioFlag ? audioActive : audio}
            style={styles.toolIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconItem}
          onPress={this.toggleCameraFun}
        >
          <Image
            source={cameraFlag ? cameraActive : camera}
            style={styles.toolIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconItem}
          onPress={this.togglePlayFun}
        >
          <Image
            source={playFlag ? pause : playIco}
            style={playFlag ? styles.pauseIco : styles.playIco}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconItem}
          onPress={this.toggleMapFun}
        >
          <Image
            source={mapShow ? addrActive : addr}
            style={styles.addrIco}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconItem}
          onPress={this.toggleScreenFun}
        >
          <Image
            source={screenFlag ? screenActive : screen}
            style={styles.screenIco}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

export default HandleTool;