import React, { Component } from 'react';
import { is } from 'immutable';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import BottomText from './bottomText';
import BottomSwiper from './bottomSwiper';
import BottomProgress from './bottomProgress';
import BottomTime from './bottomTime';
import BottomChart from './bottomChart';


const styles = StyleSheet.create({
  wholeContainer: {
    backgroundColor: '#eeeeee',
  },
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: 'white',

  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  zeroHeight: {
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  class4Swiper: {
    height: 85,
    paddingLeft: 0,
    paddingRight: 0,
  },
  class4Time: {
    height: 85,
  },
  class4Progress: {
    height: 110,
  },
  class4Chart: {
    height: 180,
  },
  class4ChartStop: {
    height: 210,
  },
});

class Bottom extends Component {
  static propTypes = {
    initStatus: PropTypes.string,
    showBottom: PropTypes.bool,
    stopIndex: PropTypes.number.isRequired,
    attachList: PropTypes.object,
    locationInfo: PropTypes.object,
    startTime: PropTypes.object.isRequired,
    endTime: PropTypes.object.isRequired,
    playIndex: PropTypes.number.isRequired,
    playStatus: PropTypes.string,
    startMileage: PropTypes.number.isRequired,
    endMileage: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    currentSpeed: PropTypes.number.isRequired,
    changeEventSource: PropTypes.string,
    currentMonitorId: PropTypes.string.isRequired,
    stopAddress: PropTypes.string,
    stopData: PropTypes.object,
    onShowArrow: PropTypes.func,
    onHideArrow: PropTypes.func,
    onTimeChange: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onPause: PropTypes.func.isRequired,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onSpeedChange: PropTypes.func.isRequired,
    onSliderChange: PropTypes.func.isRequired,
    onSliderComplete: PropTypes.func.isRequired,
    onDrag: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
    onChartChange: PropTypes.func.isRequired,
    onShowSwiper: PropTypes.func,
    onHideSwiper: PropTypes.func,
    onShowClock: PropTypes.func,
    onHideClock: PropTypes.func,
    handleIndexChangeType: PropTypes.func,
  }

  static defaultProps = {
    initStatus: null,
    onShowArrow: null,
    onHideArrow: null,
    changeEventSource: null,
    playStatus: null,
    showBottom: false,
    attachList: null,
    locationInfo: null,
    stopAddress: '',
    stopData: null,
    onShowSwiper: null,
    onHideSwiper: null,
    onShowClock: null,
    onHideClock: null,
    handleIndexChangeType: null,
  }

  constructor(props) {
    super(props);
    this.state.startTime = props.startTime;
    this.state.endTime = props.endTime;
  }

  state = {
    showSwiper: false,
    showClock: false,
    oldShowSwiper: false,
    oldShowClock: false,
    showChart: false,
    startTime: null,
    endTime: null,
    chartKey: null,
  }

  shouldComponentUpdate (nextProps, nextState) {
    const { initStatus } = nextProps;
    if (initStatus === 'ing') {
      return false;
    }
    return !this.isPropsEqual(this.props, nextProps) || !is(this.state, nextState);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { currentMonitorId: prevId } = this.props;
    const { currentMonitorId, stopIndex } = nextProps;

    if (currentMonitorId !== prevId) {
      this.setState({ showChart: false });
    }

    // stopIndex 不等于 -1，表明用户在查看某一个停止点信息，此时需要将状态恢复到初始状态
    if (stopIndex !== -1) {
      this.setState({
        showSwiper: false,
        showClock: false,
        oldShowSwiper: false,
        oldShowClock: false,
        showChart: false,
        startTime: null,
        endTime: null,
        chartKey: null,
      });
    }
  }

  isPropsEqual (prevProps, nextProps) {
    const {
      initStatus,
      attachList,
      locationInfo,
      startTime,
      endTime,
      showBottom,
      stopIndex,
      playIndex,
      playStatus,
      startMileage,
      endMileage,
      size,
      currentSpeed,
      changeEventSource,
      currentMonitorId,
      stopAddress,
    } = prevProps;

    const {
      initStatus: initStatus2,
      attachList: attachList2,
      locationInfo: locationInfo2,
      startTime: startTime2,
      endTime: endTime2,
      showBottom: showBottom2,
      stopIndex: stopIndex2,
      playIndex: playIndex2,
      playStatus: playStatus2,
      startMileage: startMileage2,
      endMileage: endMileage2,
      size: size2,
      currentSpeed: currentSpeed2,
      changeEventSource: changeEventSource2,
      currentMonitorId: currentMonitorId2,
      stopAddress: stopAddress2,
    } = nextProps;

    if (initStatus !== initStatus2) return false;
    if (!is(attachList, attachList2)) return false;
    if (!is(locationInfo, locationInfo2)) return false;
    if (!is(startTime, startTime2)) return false;
    if (!is(endTime, endTime2)) return false;
    if (showBottom !== showBottom2) return false;
    if (stopIndex !== stopIndex2) return false;
    if (playIndex !== playIndex2) return false;
    if (playStatus !== playStatus2) return false;
    if (startMileage !== startMileage2) return false;
    if (endMileage !== endMileage2) return false;
    if (size !== size2) return false;
    if (currentSpeed !== currentSpeed2) return false;
    if (changeEventSource !== changeEventSource2) return false;
    if (currentMonitorId !== currentMonitorId2) return false;
    if (stopAddress !== stopAddress2) return false;
    return true;
  }

  handleOnOpenChart = (chartKey) => {
    const { onShowArrow } = this.props;
    this.setState({
      showChart: true,
      chartKey,
    });
    if (typeof onShowArrow === 'function') {
      onShowArrow();
    }
  }

  handleOnCloseChart = () => {
    const { onHideArrow } = this.props;
    this.setState({
      showChart: false,
    });
    if (typeof onHideArrow === 'function') {
      onHideArrow();
    }
  }

  handleOnToggleChart = (chartKey) => {
    const { onChartChange } = this.props;
    this.setState({
      chartKey,
    });
    onChartChange();
  }

  handleOnOpenSwiper = () => {
    const { onShowSwiper } = this.props;
    const { showClock, showSwiper } = this.state;
    this.setState({
      oldShowClock: showClock,
      oldShowSwiper: showSwiper,
      showSwiper: true,
      showClock: false,
    });
    if (typeof onShowSwiper === 'function') {
      onShowSwiper();
    }
  }

  handleOnCloseSwiper = () => {
    const { onCloseSwiper } = this.props;
    const { showClock, showSwiper } = this.state;
    this.setState({
      oldShowClock: showClock,
      oldShowSwiper: showSwiper,
      showSwiper: false,
    });
    if (typeof onCloseSwiper === 'function') {
      onCloseSwiper();
    }
  }

  handleOnOpenClock = () => {
    const { onShowClock } = this.props;
    const { showClock, showSwiper } = this.state;
    this.setState({
      oldShowClock: showClock,
      oldShowSwiper: showSwiper,
      showClock: true,
      showSwiper: false,
    });
    if (typeof onShowClock === 'function') {
      onShowClock();
    }
  }

  handleOnCloseClock = () => {
    const { onHideClock } = this.props;
    const { showClock, showSwiper } = this.state;
    this.setState({
      oldShowClock: showClock,
      oldShowSwiper: showSwiper,
      showClock: false,
    });
    if (typeof onHideClock === 'function') {
      onHideClock();
    }
  }

  handleOnTimeChange = (startTime, endTime) => {
    const { onTimeChange } = this.props;
    onTimeChange(startTime, endTime);
  }

  handleOnPlay = (playIndex) => {
    const { onPlay } = this.props;
    if (typeof onPlay === 'function') {
      onPlay(playIndex);
    }
  }

  handleOnPause = () => {
    const { onPause } = this.props;
    if (typeof onPause === 'function') {
      onPause();
    }
  }

  handleOnSpeedChange = (newSpeed) => {
    const { onSpeedChange } = this.props;
    if (typeof onSpeedChange === 'function') {
      onSpeedChange(newSpeed);
    }
  }

  handleOnPrev = () => {
    const { onPrev } = this.props;
    if (typeof onPrev === 'function') {
      onPrev();
    }
  }

  handleOnNext = () => {
    const { onNext } = this.props;
    if (typeof onNext === 'function') {
      onNext();
    }
  }

  handleOnSliderChange = (value) => {
    const { onSliderChange } = this.props;
    onSliderChange(value);
  }

  handleOnSliderComplete = (value) => {
    const { onSliderComplete } = this.props;
    onSliderComplete(value);
  }

  handleOnDrag = (param) => {
    const { onDrag } = this.props;
    onDrag(param);
  }

  handleOnDragEnd = (param) => {
    const { onDragEnd } = this.props;
    onDragEnd(param);
  }

  render () {
    const {
      showBottom,
      attachList,
      locationInfo,
      startTime: startTimeProp,
      endTime: endTimeProp,
      playIndex, playStatus,
      currentSpeed,
      startMileage,
      endMileage,
      size,
      changeEventSource,
      currentMonitorId,
      stopAddress,
      stopData,
      stopIndex,
      handleIndexChangeType,
    } = this.props;

    const {
      showSwiper, showClock, showChart, chartKey, oldShowClock, oldShowSwiper,
    } = this.state;

    let swiperClass = styles.zeroHeight;
    let progressClass = styles.class4Progress;
    let timeClass = styles.zeroHeight;
    let chartClass = styles.zeroHeight;

    // 延时，谁隐藏就不延时，谁出来就延时。先隐藏再显示
    let delaySwiper = 0;
    let delayTime = 0;

    if (showBottom === false) {
      swiperClass = styles.zeroHeight;
      progressClass = styles.zeroHeight;
      timeClass = styles.zeroHeight;
    } else {
      if (showSwiper === true) {
        swiperClass = styles.class4Swiper;
      }
      if (showClock === true) {
        timeClass = styles.class4Time;
      }
      if (showChart === true) {
        chartClass = styles.class4Chart;
        // if (chartKey === 'stopData') {
        //   chartClass = styles.class4ChartStop;
        // }
      }
      if (showClock && !oldShowSwiper) {
        delayTime = 0;
        delaySwiper = 300;
      }
      if (showSwiper && !oldShowClock) {
        delayTime = 300;
        delaySwiper = 0;
      }
      if (showClock && oldShowSwiper) {
        delayTime = 300;
        delaySwiper = 0;
      }
      if (showSwiper && oldShowClock) {
        delayTime = 0;
        delaySwiper = 300;
      }
    }

    return (
      <View style={styles.wholeContainer}>
        <View
          style={[
            styles.container,
            styles.bottomBorder,
            {
              paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
            },
            chartClass,
          ]}
        >
          <BottomChart
            playIndex={playIndex}
            chartKey={chartKey}
            currentMonitorId={currentMonitorId}
            startTime={startTimeProp}
            endTime={endTimeProp}
            changeEventSource={changeEventSource}
            onDrag={this.handleOnDrag}
            onDragEnd={this.handleOnDragEnd}
            attachList={attachList}
          />
        </View>
        <View style={[styles.container, styles.bottomBorder]}>
          <BottomText
            locationInfo={locationInfo}
            startMileage={startMileage}
            endMileage={endMileage}
            stopAddress={stopAddress}
          />
        </View>
        <Animatable.View
          duration={300}
          delay={delaySwiper}
          transition="height"
          style={[
            styles.container,
            styles.bottomBorder,
            { paddingTop: 0, paddingBottom: 0 },
            swiperClass,
          ]}
        >
          <BottomSwiper
            attachList={attachList}
            currentMonitorId={currentMonitorId}
            stopIndex={stopIndex}
            onOpenChart={this.handleOnOpenChart}
            onCloseChart={this.handleOnCloseChart}
            onToggleChart={this.handleOnToggleChart}
            handleIndexChangeType={handleIndexChangeType}
          />
        </Animatable.View>
        <Animatable.View
          duration={300}
          delay={delayTime}
          transition="height"
          style={[
            styles.container,
            styles.bottomBorder,
            {
              paddingTop: 3,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
            },
            timeClass,
          ]}
        >
          <BottomTime
            currentMonitorId={currentMonitorId}
            startTime={startTimeProp}
            endTime={endTimeProp}
            changeEventSource={changeEventSource}
            onTimeChange={this.handleOnTimeChange}
          />
        </Animatable.View>
        <View
          // duration={100}
          // transition="height"
          style={[
            styles.container,
            progressClass,
            // {
            //   borderWidth: 1,
            //   borderColor: 'red',
            // },
          ]}

        >
          <BottomProgress
            navigation={this.props.navigation}
            stopIndex={stopIndex}
            playIndex={playIndex}
            playStatus={playStatus}
            size={size}
            changeEventSource={changeEventSource}
            stopData={stopData}
            onOpenSwiper={this.handleOnOpenSwiper}
            onCloseSwiper={this.handleOnCloseSwiper}
            onOpenClock={this.handleOnOpenClock}
            onCloseClock={this.handleOnCloseClock}
            onPlay={this.handleOnPlay}
            onPause={this.handleOnPause}
            onPrev={this.handleOnPrev}
            onNext={this.handleOnNext}
            currentSpeed={currentSpeed}
            onSpeedChange={this.handleOnSpeedChange}
            onSliderChange={this.handleOnSliderChange}
            onSliderComplete={this.handleOnSliderComplete}
          />
        </View>
      </View>
    );
  }
}

export default Bottom;