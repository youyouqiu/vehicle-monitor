import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Image,
} from 'react-native';

import {
  isEmpty, obj2Second,
} from '../../utils/function';
import VideoProgressMain from './videoProgressComponent/main';
import ExpandIcon from '../../static/image/expand.png';
import CollapseIcon from '../../static/image/collapse.png';


const styles = StyleSheet.create({
  container: {
    height: 95,
  },
  timeTypeStyle: {
    position: 'absolute',
    top: 0,
    right: 0,
    // borderWidth: 1,
    // borderColor: 'red',
    zIndex: 2,
    width: 60,
    height: 25,
    paddingLeft: 15,
    paddingTop: 5,
  },
  timeTypeIcon: {
    width: 30,
    height: 10,
  },
  videoProgress: {
    height: 75,
    marginTop: 20,
  },
});

export default class VideoProgress extends Component {
  static propTypes = {
    data: PropTypes.object.isRequired, // 序列
    currentTime: PropTypes.object, // 当前播放的时间
    timeType: PropTypes.string.isRequired,
    progressStartTime: PropTypes.number.isRequired,
    progressEndTime: PropTypes.number.isRequired,
    onDrag: PropTypes.func, // 拖拽时并且有数据点触发
    onDragEnd: PropTypes.func, // 拖拽结束时触发
    onTimeTypeChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    onDrag: null,
    onDragEnd: null,
    currentTime: null,
  }

  data = {
    originalTime: null, // 拖动开始时的时间，如果拖动结束时，指针所属区域没有视频，则还原于此
    originalPosition: null,
  }

  handleOnDrag=(payload) => {
    const { onDrag } = this.props;
    if (typeof onDrag === 'function') {
      onDrag(payload);
    }
  }

  handleOnDragEnd=(payload) => {
    const { onDragEnd } = this.props;
    if (typeof onDragEnd === 'function') {
      onDragEnd(payload);
    }
  }

  handleTimeTypeChange = () => {
    const { timeType, onTimeTypeChange } = this.props;
    let newTimeType;
    if (timeType === '24') {
      newTimeType = '1';
    } else {
      newTimeType = '24';
    }
    onTimeTypeChange({ timeType: newTimeType });
  }

  render() {
    const {
      data,
      currentTime,
      timeType,
      progressStartTime,
      progressEndTime,
    } = this.props;

    const currentTimeSecond = isEmpty(currentTime) ? 0 : obj2Second(currentTime);
    const icon = timeType === '24' ? ExpandIcon : CollapseIcon;

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.timeTypeStyle} onPress={this.handleTimeTypeChange}>
          <Image source={icon} resizeMode="contain" style={styles.timeTypeIcon} />
        </TouchableOpacity>
        <VideoProgressMain
          style={styles.videoProgress}
          data={data}
          timeType={timeType}
          startTime={progressStartTime}
          endTime={progressEndTime}
          currentTime={currentTimeSecond}
          onDrag={this.handleOnDrag}
          onDragEnd={this.handleOnDragEnd}
        />
      </View>
    );
  }
}
