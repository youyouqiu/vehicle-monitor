import React from 'react';
import {
  requireNativeComponent,
  StyleSheet,
  View,
  Platform,
  NativeModules,
  UIManager,
  findNodeHandle,
  Dimensions,
  // DeviceEventEmitter,
} from 'react-native';
import PropTypes from 'prop-types';
import storage from '../../utils/storage';
import { getCurAccont } from '../../server/getStorageData';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
const windowHeight = Dimensions.get('window').height; // 获取屏幕高度

const styles = StyleSheet.create({
  videoBoxStyle: {
    height: '100%',
    width: '100%',
  },
  videoStyle: {
    flex: 1,
    width: '100%',
    height: '100%',
    // backgroundColor: 'rgb(217,217,217)',
  },
});

const RNTVideo = requireNativeComponent('ZWVideoView', null);
class RNTVideoView extends React.Component {
  static receiveMsg = '';

  static timer = null;

  static propTypes = {
    style: PropTypes.any, // 样式，宽高等
    ifOpenVideo: PropTypes.bool.isRequired, // 是否开启视频
    socketUrl: PropTypes.string.isRequired, // url地址
    videoStateFun: PropTypes.func.isRequired, // 播放视频状态
    sampleRate: PropTypes.number.isRequired, // 音频采样率
    ifOpenAudio: PropTypes.bool.isRequired, // 是否播放音频
    channel: PropTypes.number.isRequired,
    playType: PropTypes.string.isRequired,
    playMessage: PropTypes.string.isRequired,
    msgChangeFun: PropTypes.func, // 服务器向前端发送状态信息
    // stopVideoType: PropTypes.bool,
  }

  static defaultProps = {
    style: null,
    msgChangeFun: null,
    // stopVideoType: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      videoWH: { w: '100%', h: '60%' },
      isVideoWH: false,
      videoValue: false,
    };
    this.messageChange = this.messageChange.bind(this);
  }

  componentDidMount() {
    getCurAccont().then((curUser) => {
      this.readData(curUser);
    });
  //   // 收到路由跳转监听监听
  //   this.listener = DeviceEventEmitter.addListener('stopVideo', (message) => {
  //     // 收到监听后改变video组件宽高
  //     console.log(message, 'messagestopVideo');
  //     if (message === 1) {
  //       this.setState({ isVideoWH: true });
  //     } else if (message === 3) {
  //       this.setState({ isVideoWH: false });
  //     }
  //   });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { ifCaptureAndroid, playMessage, isStopVideo } = nextProps;
    if (isStopVideo) {
      this.stop();
    }
    // if (!isStopVideo) {
    //   if (Platform.OS === 'ios' && this.videoRef) {
    //     /* eslint no-underscore-dangle:off */
    //     NativeModules.ZWVideoViewManager.close(this.videoRef._nativeTag);
    //   }
    //   if (this.timer) {
    //     clearTimeout(this.timer);
    //     this.timer = null;
    //   }
    //   this.receiveMsg = '';
    //   // eslint-disable-next-line no-unused-expressions
    //   this.videoRef.onChange = () => { };
    //   this.messageChange = null;
    //   this.stop();
    // }
    if (ifCaptureAndroid) {
      this.capture();
    }
    if (this.receiveMsg && this.contrastMsg(this.receiveMsg, playMessage)) {
      if (this.timer) return;
      this.timer = setTimeout(() => {
        this.sendMsg(playMessage);
      }, 300);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'ios' && this.videoRef) {
      /* eslint no-underscore-dangle:off */
      NativeModules.ZWVideoViewManager.close(this.videoRef._nativeTag);
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.receiveMsg = '';
    // eslint-disable-next-line no-unused-expressions
    this.videoRef.onChange = () => { };
    this.messageChange = null;
    // // 移除监听
    // if (this.listener) { this.listener.remove(); }
  }

  // 获取存储数据
  readData = async (curUser) => {
    storage.load({
      key: 'userSetting',
      autoSync: true,
      syncInBackground: true,
      syncParams: {
        user: curUser,
      },
    }).then((ret) => {
      if (ret && ret[curUser]) {
        this.setState({
          videoValue: ret[curUser].videoSwitch, // 速度设置
        });
      }
    }).catch((err) => {
      console.log('storage load err', err);
    });
  }

  /**
   * 比较前后msg是否有差异
   * @param {*} prevMsg
   * @param {*} nextMsg
   */
  contrastMsg = (prevMsg, nextMsg) => {
    if (!prevMsg || !nextMsg) return false;
    const newPrevMsg = JSON.parse(prevMsg);
    const newNextMsg = JSON.parse(nextMsg);
    const msgId = newPrevMsg.data.msgHead.msgID;
    const nextId = newNextMsg.data.msgHead.msgID;
    if (msgId === nextId) {
      const prevBody = newPrevMsg.data.msgBody;
      const { msgBody } = newNextMsg.data;
      if (nextId === 50001) {
        if (msgBody.dragStatus) {
          return true;
        }
        if (msgBody.startTime && prevBody.startTime && (msgBody.startTime !== prevBody.startTime)) {
          return true;
        }
      }
      if (msgId === 50002 && msgBody.remote === '5') {
        if (prevBody.dragPlaybackTime !== msgBody.dragPlaybackTime) {
          return true;
        }
        return false;
      }
      return false;
    }
    return true;
  }

  play = () => {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this),
      UIManager.ZWVideoView.Commands.play,
      [],
    );
  }

  stop = () => {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this),
      UIManager.ZWVideoView.Commands.stop,
      [],
    );
    // this.setState({
    //   isVideoWH: false,
    // });
  }

  capture = () => {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.videoRef),
      UIManager.ZWVideoView.Commands.capture,
      [],
    );
  }

  sendMsg = (msg) => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const { playMessage } = this.props;
    const msgInfo = msg || playMessage;
    if (!msgInfo || (this.receiveMsg && !this.contrastMsg(this.receiveMsg, playMessage))) return;
    this.receiveMsg = msgInfo;
    // 视频回放,下一资源播放前先下发停止指令
    const newInfo = JSON.parse(msgInfo);
    if (newInfo.data.msgBody.jumpStatus) {
      const message = {
        data: {
          msgHead: {
            msgID: 50002,
          },
          msgBody: {
            dragPlaybackTime: '',
            remote: '2',
            forwardOrRewind: '0',
          },
        },
      };
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(this.videoRef),
        UIManager.ZWVideoView.Commands.message,
        [JSON.stringify(message)],
      );
      setTimeout(() => {
        UIManager.dispatchViewManagerCommand(
          findNodeHandle(this.videoRef),
          UIManager.ZWVideoView.Commands.message,
          [msgInfo],
        );
      }, 500);
    } else {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(this.videoRef),
        UIManager.ZWVideoView.Commands.message,
        [msgInfo],
      );
    }
  }

  onVideoStateChange = (val) => {
    const { state } = val.nativeEvent;
    const { videoStateFun } = this.props;
    if (typeof videoStateFun === 'function') {
      if (Platform.OS === 'android') {
        videoStateFun(state);
        if (state === 0) {
          this.sendMsg();
        }
      } else {
        videoStateFun(state[0]);
        if (state[0] === 0) {
          this.sendMsg();
        }
      }
    }
  }

  messageChange = (val) => {
    const { message } = val.nativeEvent;
    const { msgChangeFun } = this.props;
    if (typeof msgChangeFun === 'function' && message) {
      const msg = JSON.parse(message);
      msgChangeFun(msg.data.msgBody);
    }
  }

  videoSizeChange = (val) => {
    const { width, height } = val.nativeEvent;
    const pw = windowWidth;
    const ph = windowHeight; // 父级宽高
    const vw = width;
    const vh = height; // 内容宽高
    const sw = vw / pw;
    const sh = vh / ph;

    let w;
    let h; // 子视图宽高
    if (sw > sh) {
      w = pw;
      h = vh / sw;
    } else {
      h = ph;
      w = vw / sh;
    }
    this.setState({
      videoWH: {
        w: (w / pw === 1) || ((w / h > 3) || (w / h < 0.3)) ? '100%' : `${(w / pw).toFixed(2) * 100}%`,
        h: (h / ph === 1) || ((w / h > 3) || (w / h < 0.3)) ? '100%' : `${(h / ph).toFixed(2) * 100}%`,
      },
      isVideoWH: true,
    });
  }

  render() {
    const {
      ifOpenVideo,
      socketUrl,
      sampleRate,
      ifOpenAudio,
      channel,
      playType,
      playMessage,
    } = this.props;
    const {
      videoWH,
      videoValue,
      isVideoWH,
    } = this.state;
    const playMessageObj = playMessage && playMessage.length > 1 ? JSON.parse(playMessage) : {};
    const ipanoramaType = playMessageObj && playMessageObj.panoramic === 'true' ? 1 : 0;
    return (
      <View style={[styles.videoBoxStyle, {
        flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black',
      }]}
      >
        <RNTVideo
          ref={(ref) => { this.videoRef = ref; }}
          ifOpenVideo={ifOpenVideo}
          ifOpenAudio={ifOpenAudio}
          sampleRate={sampleRate}
          style={[!videoValue ? { width: videoWH.w, height: videoWH.h } : { width: '100%', height: '100%' }, !isVideoWH ? { backgroundColor: '#000' } : null]}
          socketUrl={socketUrl}
          channel={channel}
          playType={playType}
          onStateChange={this.onVideoStateChange}
          onMessageChange={this.messageChange}
          onVideoSizeChange={this.videoSizeChange}
          panoramaType={ipanoramaType}
          // vrImageSrc="/static/image/qj360.png"
        />
      </View>
    );
  }
}
export default RNTVideoView;