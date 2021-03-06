import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  Image,
  Dimensions,
  // CameraRoll,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import { captureRef } from 'react-native-view-shot';
import VideoView from '../../common/video/VideoView';
import { requestConfig } from '../../utils/env';
import refreshVideo from '../../static/image/refreshVideo.png';

const Env = requestConfig();
const windowH = Dimensions.get('window').height;
const windowW = Dimensions.get('window').width;
// style
const styles = StyleSheet.create({
  noVideo: {
    backgroundColor: 'rgb(217,217,217)',
  },
  videoItem: {
    width: '50%',
    height: '50%',
    padding: 2,
    borderColor: '#fff',
    borderWidth: 2,
    position: 'relative',
    backgroundColor: '#fff',
    zIndex: 100,
  },
  itemTitle: {
    height: 30,
    paddingLeft: 10,
    paddingRight: 10,
    // color: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgb(51,187,255)',
  },
  titleTxt: {
    color: '#fff',
    fontSize: 15,
    maxWidth: '40%',
  },
  driveRoom: {
    height: 26,
    lineHeight: 26,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: 'rgb(228,228,228)',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgb(217,217,217)',
  },
  requestVideo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestVideoText: {
    top: 20,
    // color: '#fff',
    // fontSize: 16,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(109, 109, 109, 0.8)',
  },
  refreshCont: {
    width: 60,
    height: 60,
    position: 'absolute',
    left: '50%',
    marginLeft: -30,
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109, 109, 109, 0.8)',
    borderRadius: 5,

  },
  refreshPng: {
    width: 42,
    height: 40,
  },
  fullScreenItem: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5000,
  },
});

class VideoItem extends Component {
  static propTypes = {
    item: PropTypes.object,
    brand: PropTypes.string,
    choosenVideo: PropTypes.number,
    videoChoose: PropTypes.func, // ????????????????????????
    refreshVideoFun: PropTypes.func, // ????????????
    videoStateChangeFun: PropTypes.func, // ??????????????????
    fullScreenFun: PropTypes.func, // ????????????????????????
    captureCallback: PropTypes.func, // ??????
    screenFlag: PropTypes.bool,
    playMessage: PropTypes.object,
  }

  static defaultProps = {
    item: null,
    brand: undefined,
    choosenVideo: undefined,
    videoChoose: undefined,
    refreshVideoFun: undefined,
    videoStateChangeFun: undefined,
    fullScreenFun: undefined,
    captureCallback: undefined,
    screenFlag: undefined,
    playMessage: undefined,
  }

  constructor(props) {
    super(props);
    this.state = {
      ifOpenVideo: false,
      ifSuccess: true,
      ifFullScreen: false,
      clickTime: null, // ??????????????????
      ifState0: false,
      fullScreenStyle: { // ??????????????????

      },
      realTimeVideoPort: Env.videoRequestPort,
      realTimeVideoIp: Env.realTimeVideoIp,
      ifCaptureAndroid: false,
    };
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { item: preItem } = this.props;
    const { item, captureCallback } = nextProps;
    if (item) {
      // ??????

      if (item.ifCapture && !preItem.ifCapture) {
        if (Platform.OS === 'ios') {
          this.refCapture(item);
        }
        if (Platform.OS === 'android') {
          this.setState({
            ifCaptureAndroid: true,
          });
          setTimeout(() => {
            this.setState({
              ifCaptureAndroid: false,
            });
            captureCallback(item, true);
          }, 500);
        }
      }

      const { socketUrl, playFlag } = item;
      this.setState({
        ifOpenVideo: playFlag,
      });
    }
  }


  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // ??????????????????
  videoChoose = () => {
    const {
      clickTime,
      ifFullScreen,
      ifSuccess,
    } = this.state;
    const {
      item, videoChoose, screenFlag, refreshVideoFun,
    } = this.props;
    if (typeof videoChoose === 'function') {
      videoChoose(item);
    }

    const ifFullScreenNew = ifFullScreen;

    const time = new Date();
    const millisencod = time.getTime();
    if (clickTime) {
      const differValue = millisencod - clickTime;
      if (differValue < 500) {
        const { fullScreenFun } = this.props;
        if (typeof fullScreenFun === 'function') {
          fullScreenFun(!screenFlag);

          if (!screenFlag && refreshVideoFun && !ifSuccess) {
            refreshVideoFun(item);
          }
        }
      }
    }


    this.setState({
      clickTime: millisencod,
      ifFullScreen: ifFullScreenNew,
    });
  }

  // ???????????????????????????
  videoStateFun = (state) => {
    const sta = parseInt(state, 10);
    if (sta === 3) { // ????????????
      this.setState({
        ifSuccess: true,
      });
    }
    if (sta === 4 || sta === 2 || sta === 1) {
      this.setState({
        ifSuccess: false,
      });
    }

    if (sta === 0) {
      this.setState({
        ifSuccess: true,
        ifState0: true,
      });
    } else {
      this.setState({
        ifState0: false,
      });
    }

    // ????????????????????????????????????
    const { videoStateChangeFun, item } = this.props;
    if (typeof videoStateChangeFun === 'function') {
      videoStateChangeFun(item, sta);
    }
  }

  // ????????????
  refreshVideo = () => {
    const { refreshVideoFun, item } = this.props;
    if (typeof refreshVideoFun === 'function') {
      refreshVideoFun(item);
    }
  }

  refCapture = (item) => {
    const { captureCallback } = this.props;


    captureRef(this[`refCapture${item.physicsChannel}`], {
      format: 'jpg',
      quality: 0.8,
    }).then(

      (uri) => {
        if (Platform.OS === 'android') {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'My App Storage Permission',
              message: 'My App needs access to your storage '
                + 'so you can save your photos',
            },
          ).then(() => {
            const promise = CameraRoll.saveToCameraRoll(uri, 'photo');
            promise.then(() => {
              captureCallback(item, true);
            }).catch(() => {
              captureCallback(item, false);
            });
          }).catch((err) => {
            captureCallback(item, false);
          });
        } else {
          const promise = CameraRoll.saveToCameraRoll(uri, 'photo');
          promise.then(() => {
            captureCallback(item, true);
          }).catch(() => {
            captureCallback(item, false);
          });
        }
      },
    );
  }


  handleOnLayout = () => {
    const { item } = this.props;
    this[`myComponent${item.physicsChannel}`].measure((fx, fy, width, height, px, py) => {
      this.setState({
        fullScreenStyle: {
          height: windowH,
          width: windowW,
          position: 'absolute',
          left: -px,
          top: -py,
          zIndex: 100000,
        },
      });
    });
  }

  // ??????????????????msg??????
  renderPlayMsg = () => {
    const { playMessage, item } = this.props;
    const { ifOpenVideo } = this.state;
    if (playMessage) {
      const message = {
        data: {
          msgHead: {
            msgID: 50001, // ??????
          },
          msgBody: {
            vehicleId: item.id, // ??????ID
            simcardNumber: playMessage.simcardNumber, // sim??????
            channelNumber: item.logicChannel, // ?????????
            sampleRate: playMessage.samplingRateStr || 8000, // ?????????
            channelCount: playMessage.vocalTractStr || 0, // ?????????
            audioFormat: playMessage.audioFormatStr, // ????????????
            playType: 'REAL_TIME', // ???????????? ?????? REAL_TIME????????? TRACK_BACK????????? BOTH_WAY????????? UP_WAY????????? DOWN_WAY
            dataType: '0', // ????????????0???????????????1????????????2??????????????????3????????????4??????????????????5?????????
            userID: playMessage.userUuid, // ??????ID
            deviceID: playMessage.deviceId, // ??????ID
            streamType: item.streamType, // ????????????0???????????????1????????????
            deviceType: playMessage.deviceType, // ????????????
          },
        },
      };
      if (!ifOpenVideo) { // ??????
        message.msgHead = 50002;
      }
      return JSON.stringify(message);
    }
    return '';
  }

  render () {
    const {
      item, brand, choosenVideo, screenFlag,
    } = this.props;
    const {
      //  ifFullScreen,
      ifOpenVideo,
      ifSuccess,
      ifCaptureAndroid,
      //  fullScreenStyle,
      ifState0,
      realTimeVideoPort,
      realTimeVideoIp,
      //  ifOpenAudio,
    } = this.state;
    let url;
    let sampleRate;
    if (item) {
      const { socketUrl, audioSampling } = item;
      // url = `ws://${realTimeVideoIp}:${realTimeVideoPort}/${socketUrl}`;
      url = `ws://${realTimeVideoIp}:${realTimeVideoPort}`;
      sampleRate = audioSampling || 8000;
    } else {
      url = '';
      sampleRate = 8000;
    }

    return (
      item
        ? (
          <View style={{ flex: 1 }}>
            <View style={styles.itemTitle}>
              <Text style={styles.titleTxt}>??????{item.physicsChannel}</Text>
              <Text style={[styles.titleTxt, { maxWidth: '60%', width: '60%', textAlign: 'right' }]} numberOfLines={1}>{brand}</Text>
            </View>
            {/* <Text style={styles.driveRoom}>{item.logicChannelName}</Text> */}
            <TouchableHighlight
              onPress={this.videoChoose}
              underlayColor="transparent"
              style={[{ flex: 1 }]}
              ref={(view) => { this[`myComponent${item.physicsChannel}`] = view; }}
            >
              <VideoView
                ref={(ref) => { this[`refCapture${item.physicsChannel}`] = ref; }}
                style={styles.video}
                ifOpenVideo={ifOpenVideo}
                socketUrl={url}
                videoStateFun={this.videoStateFun}
                sampleRate={sampleRate}
                ifOpenAudio={item.ifOpenAudio}
                screenFlag={screenFlag}
                ifCurrentScreenFlag={item.physicsChannel === choosenVideo}
                ifCaptureAndroid={ifCaptureAndroid}
                item={item}
                channel={item.physicsChannel}
                playType="RealTime"
                playMessage={this.renderPlayMsg()}
              />
            </TouchableHighlight>

            {
              !ifSuccess ? (
                <TouchableHighlight
                  onPress={this.refreshVideo}
                  underlayColor="transparent"
                  style={styles.refreshCont}
                >
                  <Image source={refreshVideo} style={styles.refreshPng} />
                </TouchableHighlight>
              ) : (null)
            }

            {
              ifState0 ? (
                <View style={styles.requestVideo}>
                  <View style={styles.requestVideoText}>
                    <Text style={{ color: '#fff' }}>???????????????...</Text>
                  </View>
                </View>
              ) : (null)
            }

          </View>
        )
        : (
          <View style={{ flex: 1 }}>
            <View style={styles.itemTitle}>
              <Text style={styles.titleTxt}>??????--</Text>
              <Text style={[styles.titleTxt, { maxWidth: '60%', width: '60%', textAlign: 'right' }]} numberOfLines={1}>{brand}</Text>
            </View>
            {/* <Text style={styles.driveRoom}>--</Text> */}
            <View style={styles.video} />
          </View>
        )
    );
  }
}

export default VideoItem;