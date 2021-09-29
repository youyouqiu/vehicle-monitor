import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { is } from 'immutable';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import PropTypes from 'prop-types';
import Video from 'react-native-video';
import Controls from './componentVideoControls';
import refresh from '../../static/image/refreshVideo.png';
import { getLocale } from '../../utils/locales';
// import videoUrls from '../../test/riskmedia/media1/1.mp4';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  video_box: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  refresh: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginTop: -22,
    marginLeft: -21,
    width: 44,
    height: 42,
    padding: 5,
    backgroundColor: '#eeeeee',
  },
  load: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -50,
    marginTop: -20,
    width: 100,
    height: 30,
    textAlign: 'center',
    padding: 5,
    backgroundColor: '#eeeeee',
  },
});

class PanelVideo extends Component {
  static propTypes = {
    VideoUrl: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      isPaused: false, // 控制播放暂停
      duration: 0, // 视频时长
      currentTime: 0, // 视频当前进度时长
      playFromBeginning: false, // 是否重新播放
      isVideoLoad: true, // 视频加载
      isFresh: false, // 视频刷新
      rate: 1, // 视频播放倍率
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // componentDidMount() {
  //   const { isPaused } = this.state;
  //   this.onPaused(isPaused);
  // }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { VideoUrl } = nextProps;
    if (VideoUrl) {
      this.setState({
        isPaused: false,
        duration: 0,
        currentTime: 0,
        playFromBeginning: false,
        isVideoLoad: true,
        isFresh: false,
        rate: 1,
      });
    }
  }

  // 视频播放
  onPaused=(isPaused) => {
    const { playFromBeginning } = this.state;

    if (playFromBeginning) {
      this.setState({
        currentTime: 0,
        playFromBeginning: false,
      });
    }

    this.setState({
      isPaused: !isPaused,
      rate: isPaused ? 0 : 1,
      isVideoLoad: isPaused,
      isFresh: false,
    });
  }

  // 播放结束
  onPlayEnd = () => {
    this.setState({
      isPaused: true,
      rate: 0,
      playFromBeginning: true,
    }, () => {
      this.videoRef.seek(0);
    });
  };

  // 视频开始加载事件
  onLoadStart=() => {
    this.state = {
      isPaused: true,
      currentTime: 0,
      playFromBeginning: false,
      isVideoLoad: true,
      isFresh: false,
    };
  }

  // 获取视频时长
  onLoaded=(data) => {
    this.setState({
      duration: Math.ceil(data.duration),
      isVideoLoad: false,
    });
  }

  // 获取当前播放时长
  onProgressChanged = (data) => {
    const { isPaused } = this.state;
    if (!isPaused) {
      this.setState({
        currentTime: Math.ceil(data.currentTime),
        isVideoLoad: false,
      });
    }
  };

  // 视频进度条交互事件
  onSeek=(data) => {
    this.videoRef.seek(data);
    this.setState({
      currentTime: data,
    });
  }

  // 视频播放失败
  videoError=() => {
    this.setState({
      isFresh: true,
      isPaused: true,
      duration: 0,
      currentTime: 0,
      isVideoLoad: false,
      rate: 0,
    });
  }

  // 视频刷新
  refresh=() => {
    const { isPaused } = this.state;
    this.onPaused(isPaused);
  }

  render() {
    const {
      isPaused, duration, currentTime, isVideoLoad, isFresh,
    } = this.state;
    const { VideoUrl } = this.props;

    return (
      <View style={styles.container}>
        {/* Video start */}
        <View style={styles.video_box}>
          <Video
            ref={(ref) => { this.videoRef = ref; }}
            source={{ uri: VideoUrl }}
            // source={videoUrls}
            style={styles.video}
            resizeMode="contain"
            paused={isPaused}
            onLoadStart={this.onLoadStart}
            onLoad={this.onLoaded}
            onProgress={this.onProgressChanged}
            onEnd={this.onPlayEnd}
            onError={this.videoError}
            repeat={false}
          />
          {
            isVideoLoad ? <Text style={styles.load}>{getLocale('securityVideoLoad')}</Text> : null
          }

          {
            isFresh
              ? (
                <TouchableOpacity
                  style={styles.refresh}
                  onPress={this.refresh}
                >
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    source={refresh}
                  />
                </TouchableOpacity>
              )
              : null
          }
        </View>
        {/* Video end */}

        {/* controls start */}
        <Controls
          duration={duration}
          progress={currentTime}
          isPaused={isPaused}
          onPaused={() => { this.onPaused(isPaused); }}
          onSliderChange={this.onSeek}
        />
        {/* controls end */}
      </View>
    );
  }
}

export default PanelVideo;