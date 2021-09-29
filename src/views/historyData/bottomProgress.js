import React, { Component } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import Slider from './bottomProgressSlider';
import Speed from './bottomProgressSpeed';
import Buttons from './bottomProgressButton';

const styles = StyleSheet.create({
  container: {
    height: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
  },
  line: {
    flex: 6,
  },
  speed: {
    flex: 1,
  },
});


class BottomProgress extends Component {
  static propTypes = {
    stopIndex: PropTypes.number.isRequired,
    playIndex: PropTypes.number.isRequired,
    playStatus: PropTypes.string.isRequired,
    startMileage: PropTypes.number.isRequired,
    endMileage: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    stopData: PropTypes.object,
    onOpenSwiper: PropTypes.func.isRequired,
    onCloseSwiper: PropTypes.func.isRequired,
    onOpenClock: PropTypes.func.isRequired,
    onCloseClock: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onPause: PropTypes.func.isRequired,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onSpeedChange: PropTypes.func.isRequired,
    currentSpeed: PropTypes.number.isRequired,
    onSliderChange: PropTypes.func.isRequired,
    onSliderComplete: PropTypes.func.isRequired,
    changeEventSource: PropTypes.string,
  }

  static defaultProps = {
    changeEventSource: null,
    stopData: null,
  }

  constructor(props) {
    super(props);
    this.throttleHandleSliderChange = throttle(this.handleSliderChange, 50);
  }

  handleSliderChange = (value) => {
    const { onSliderChange } = this.props;
    onSliderChange(value);
  }

  render () {
    const {
      stopIndex,
      playIndex,
      playStatus,
      startMileage,
      endMileage,
      size,
      changeEventSource,
      stopData,
      onOpenSwiper,
      onCloseSwiper,
      onOpenClock,
      onCloseClock,
      onPlay,
      onPause,
      onPrev,
      onNext,
      onSpeedChange,
      currentSpeed,
      onSliderComplete,
    } = this.props;


    return (

      <View>
        <View style={styles.container}>
          <View style={styles.line}>
            <Slider
              navigation={this.props.navigation}
              playIndex={playIndex}
              startMileage={startMileage}
              endMileage={endMileage}
              size={size}
              stopData={stopData}
              changeEventSource={changeEventSource}
              onSliderChange={this.throttleHandleSliderChange}
              onSliderComplete={(value) => { onSliderComplete(value); }}
            />

          </View>
          <View style={styles.speed}>
            <Speed
              currentSpeed={currentSpeed}
              onSpeedChange={(...param) => { onSpeedChange(...param); }}
            />
          </View>
        </View>
        <Buttons
          playStatus={playStatus}
          stopIndex={stopIndex}
          onPlay={(...param) => { onPlay(...param); }}
          onOpenSwiper={(...param) => { onOpenSwiper(...param); }}
          onCloseSwiper={(...param) => { onCloseSwiper(...param); }}
          onOpenClock={(...param) => { onOpenClock(...param); }}
          onCloseClock={(...param) => { onCloseClock(...param); }}
          onPause={(...param) => { onPause(...param); }}
          onPrev={(...param) => { onPrev(...param); }}
          onNext={(...param) => { onNext(...param); }}
        />
      </View>
    );
  }
}

export default BottomProgress;