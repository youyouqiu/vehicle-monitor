import React, { Component } from 'react';
import {
  View, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { VideoProgress } from '../../common/reactNativeD3Charts';
import DateAndChannel from './dateAndChannel';
import { deepEqual } from '../../utils/function';

const styles = StyleSheet.create({
  container: {
    height: 190,
  },
  videoProgress: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  timeContainer: {
    paddingTop: 3,
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'white',
    paddingRight: 4,
  },
  dateContainer: {
    flex: 5,
  },
  customContainer: {
    flex: 1,
    padding: 2,
  },
  swiper: {
    backgroundColor: '#fff',
  },
  dateItem: {
    width: 65,
    padding: 2,
  },
  date: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: '#f5f5f5',
  },
  itemText: {
    color: '#333333',
    fontSize: 13,
  },
  today: {
    backgroundColor: '#d7f3ff',
  },
  active: {
    backgroundColor: '#33bbff',
    borderWidth: 0,
  },
  activeText: {
    color: 'white',
  },
  custom: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    marginLeft: 2,
  },
  weekName: {
    fontSize: 10,
    position: 'absolute',
    zIndex: 2,
    right: 3,
    top: 3,
  },
});

export default class TimeArea extends Component {
    static propTypes = {
      currentTime: PropTypes.object,
      channelNumber: PropTypes.object,
      currentChannel: PropTypes.number,
      activeDate: PropTypes.object,
      oneDayCurrent: PropTypes.object,
      oneDay: PropTypes.object,
      video15Day1: PropTypes.object,
      video15Day2: PropTypes.object,
      timeType: PropTypes.string.isRequired,
      progressStartTime: PropTypes.number.isRequired,
      progressEndTime: PropTypes.number.isRequired,
      onSelectChange: PropTypes.func.isRequired,
      onTimeChange: PropTypes.func.isRequired,
      onDragEnd: PropTypes.func, // 拖拽结束时触发
      onTimeTypeChange: PropTypes.func.isRequired,
    }

    static defaultProps={
      currentTime: null,
      channelNumber: null,
      currentChannel: null,
      activeDate: null,
      oneDayCurrent: null,
      oneDay: null,
      video15Day1: null,
      video15Day2: null,
      onDragEnd: null,
    }

    state={}


    shouldComponentUpdate(nextProps, nextState) {
      const propsEqual = deepEqual(this.props, nextProps,
        ['currentTime',
          'channelNumber',
          'currentChannel',
          'activeDate',
          'oneDayCurrent',
          'oneDay',
          'video15Day1',
          'video15Day2',
          'timeType',
          'progressStartTime',
          'progressEndTime',
        ]);
      const stateEqual = deepEqual(this.state, nextState);

      return !propsEqual || !stateEqual;
    }

    onTimeChange = (startTime, endTime) => {
      const { onTimeChange } = this.props;
      onTimeChange(startTime, endTime);
    }

    onSelectChange=(value) => {
      const { onSelectChange } = this.props;
      onSelectChange(value);
    }

    handleOnDragEnd=(payload) => {
      const { onDragEnd } = this.props;
      if (typeof onDragEnd === 'function') {
        onDragEnd(payload);
      }
    }

    onTimeTypeChange=({ timeType }) => {
      const { onTimeTypeChange } = this.props;

      onTimeTypeChange({ timeType });
    }

    render() {
      const {
        oneDayCurrent,
        oneDay,
        video15Day1,
        video15Day2,
        channelNumber,
        activeDate,
        currentChannel,
        currentTime,
        timeType,
        progressStartTime,
        progressEndTime,
      } = this.props;

      return (
        <View style={styles.container}>
          <View style={styles.videoProgress}>
            <VideoProgress
              data={oneDayCurrent}
              currentTime={currentTime}
              timeType={timeType}
              progressStartTime={progressStartTime}
              progressEndTime={progressEndTime}
              onDragEnd={this.handleOnDragEnd}
              onTimeTypeChange={this.onTimeTypeChange}
            />
          </View>
          <DateAndChannel
            video15Day1={video15Day1}
            video15Day2={video15Day2}
            channelNumber={channelNumber}
            activeDate={activeDate}
            oneDay={oneDay}
            currentChannel={currentChannel}
            onTimeChange={this.onTimeChange}
            onSelectChange={this.onSelectChange}
          />
        </View>
      );
    }
}