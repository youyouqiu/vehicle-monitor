import React, { Component } from 'react';
// import { is } from 'immutable';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
// import BottomLine from './bottomLine';
import IconClock from '../../static/image/clock.png';
import IconClockChosen from '../../static/image/clock-chose.png';
import IconQuickBack from '../../static/image/quick-back.png';
import IconPlay from '../../static/image/play.png';
import IconPause from '../../static/image/pause2.png';
import IconQuickGo from '../../static/image/quick-go.png';
import homeFooterOpenImage from '../../static/image/homeFooterOpenImage.png';
import homeFooterCloseImage from '../../static/image/close.png';

const styles = StyleSheet.create({
  container: {
    height: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  icon: {
    width: 20,
    height: 13,
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
    paddingVertical: 5,
  },
  clock: {
    width: 25,
    height: 25,
  },
  quickBack: {
    width: 35,
    height: 35,
  },
  play: {
    width: 48,
    height: 48,
  },
  quickGo: {
    width: 35,
    height: 35,
  },
  chart: {
    width: 25,
    height: 25,
  },
  controlIcon: {
    width: '100%',
    height: '100%',
  },
});


class BottomProgress extends Component {
  static propTypes = {
    playStatus: PropTypes.string,
    stopIndex: PropTypes.number.isRequired,
    onOpenSwiper: PropTypes.func.isRequired,
    onCloseSwiper: PropTypes.func.isRequired,
    onOpenClock: PropTypes.func.isRequired,
    onCloseClock: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onPause: PropTypes.func.isRequired,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
  }

  static defaultProps = {
    playStatus: null,
  }

  state={
    playStatus: 'paused', // paused, playing
    chartOpen: false,
    clockOpen: false,
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { playStatus, stopIndex } = nextProps;

    if (playStatus != null) {
      this.setState({
        playStatus,
      });
    }
    if (stopIndex !== -1) {
      this.setState({
        chartOpen: false,
        clockOpen: false,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !this.isPropsEqual(this.props, nextProps) || !this.isStateEqual(this.state, nextState);
  }

  isPropsEqual(prevProps, nextProps) {
    const {
      playStatus,
    } = prevProps;

    const {
      playStatus: playStatus2,
    } = nextProps;

    if (playStatus !== playStatus2) return false;
    return true;
  }

  isStateEqual(prevState, nextState) {
    const {
      playStatus,
      chartOpen,
      clockOpen,
    } = prevState;

    const {
      playStatus: playStatus2,
      chartOpen: chartOpen2,
      clockOpen: clockOpen2,
    } = nextState;

    if (playStatus !== playStatus2) return false;
    if (chartOpen !== chartOpen2) return false;
    if (clockOpen !== clockOpen2) return false;
    return true;
  }

  handleToggleChart=() => {
    const { onOpenSwiper, onCloseSwiper } = this.props;
    const { chartOpen } = this.state;
    if (chartOpen === true) {
      this.setState({
        chartOpen: false,
      });
      if (typeof onCloseSwiper === 'function') {
        onCloseSwiper();
      }
    } else {
      this.setState({
        chartOpen: true,
        clockOpen: false,
      });
      if (typeof onOpenSwiper === 'function') {
        onOpenSwiper();
      }
    }
  }

  handleToggleClock = () => {
    const { onOpenClock, onCloseClock } = this.props;
    const { clockOpen } = this.state;
    if (clockOpen === true) {
      this.setState({
        clockOpen: false,
      });
      if (typeof onCloseClock === 'function') {
        onCloseClock();
      }
    } else {
      this.setState({
        clockOpen: true,
        chartOpen: false,
      });
      if (typeof onOpenClock === 'function') {
        onOpenClock();
      }
    }
  }

  handleTogglePlay=() => {
    const { playStatus, playIndex } = this.state;
    const { onPlay, onPause } = this.props;
    if (playStatus === 'paused') {
      this.setState({
        playStatus: 'playing',
      });
      if (typeof onPlay === 'function') {
        onPlay(playIndex);
      }
    } else {
      this.setState({
        playStatus: 'paused',
      });
      if (typeof onPause === 'function') {
        onPause();
      }
    }
  }

  handleNext=() => {
    const { onPause, onNext } = this.props;
    const { playStatus } = this.state;
    // 先暂停
    if (playStatus === 'playing') {
      this.setState({
        playStatus: 'paused',
      });
      if (typeof onPause === 'function') {
        onPause();
      }
    }
    onNext();
  }

  handlePrev=() => {
    const { onPause, onPrev } = this.props;
    const { playStatus } = this.state;
    // 先暂停
    if (playStatus === 'playing') {
      this.setState({
        playStatus: 'paused',
      });
      if (typeof onPause === 'function') {
        onPause();
      }
    }
    onPrev();
  }

  render() {
    const {
      chartOpen, clockOpen, playStatus,
    } = this.state;

    let clockIcon = IconClock;
    if (clockOpen === true) {
      clockIcon = IconClockChosen;
    }
    return (

      <View style={styles.controlContainer}>
        <TouchableOpacity style={styles.clock} onPress={this.handleToggleClock}>
          <Image
            source={clockIcon}
            style={styles.controlIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBack} onPress={this.handlePrev}>
          <Image
            source={IconQuickBack}
            style={styles.controlIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.play} onPress={this.handleTogglePlay}>
          <Image
            source={playStatus === 'paused' ? IconPlay : IconPause}
            style={styles.controlIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickGo} onPress={this.handleNext}>
          <Image
            source={IconQuickGo}
            style={styles.controlIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.chart} onPress={this.handleToggleChart}>
          <Image
            source={chartOpen ? homeFooterCloseImage : homeFooterOpenImage}
            style={styles.controlIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

    );
  }
}

export default BottomProgress;