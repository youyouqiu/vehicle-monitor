import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { is } from 'immutable';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Slider,
  Text,
} from 'react-native';
import PropTypes from 'prop-types';
import IconPlay from '../../static/image/play.png';
import IconPause from '../../static/image/pause2.png';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  slider: {
    padding: 0,
    flex: 1,
  },
  controlIcon: {
    width: 35,
    height: 35,
    paddingRight: 10,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  time: {
    paddingHorizontal: 5,
  },
});
class VideoControls extends Component {
  static propTypes = {
    duration: PropTypes.number.isRequired, // 视频时长
    progress: PropTypes.number, // 视频进度
    isPaused: PropTypes.bool, // 播放状态
    onPaused: PropTypes.func.isRequired, // 播放暂停
    onSliderChange: PropTypes.func, // 进度条交互
    showTime: PropTypes.bool,
  }

  static defaultProps ={
    isPaused: true,
    progress: 0,
    onSliderChange: null,
    showTime: false,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 格式化视频进度时间
  formate=(second) => {
    const h = 0; let i = 0; let
      s = parseInt(second, 10);
    if (s > 60) {
      i = parseInt(s / 60, 10);
      s = parseInt(s % 60, 10);
    }

    const zero = function (v) {
      return v >= 0 && v < 10 ? `0${v}` : v;
    };
    return [zero(h), zero(i), zero(s)].join(':');
  }

  render() {
    const {
      onPaused, isPaused, duration, progress, onSliderChange, showTime,
    } = this.props;

    return (
      <View style={styles.container}>
        {/* 视频进度时长 */}
        {/* <Text style={styles.time}>{this.formate(progress)}</Text> */}
        {
          showTime ? <Text style={styles.time}>{this.formate(progress)}</Text> : null
        }
        <Slider
          style={styles.slider}
          maximumTrackTintColor="#5c5c5c"
          minimumTrackTintColor="#8e8e93"
          thumbTintColor="#2a8be9"
          minimumValue={0}
          maximumValue={duration}
          value={progress}
          onValueChange={onSliderChange}
          onSlidingComplete={onSliderChange}
        />
        {/* 视频总时长 */}
        {/* <Text style={styles.time}>{this.formate(duration)}</Text> */}
        {
          showTime ? <Text style={styles.time}>{this.formate(duration)}</Text> : null
        }
        <TouchableOpacity
          style={styles.controlIcon}
          onPress={onPaused}
        >
          <Image
            source={!isPaused ? IconPause : IconPlay}
            style={styles.icon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  }
}

export default VideoControls;