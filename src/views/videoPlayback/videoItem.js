import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  // Image,
  // CameraRoll,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import { captureRef } from 'react-native-view-shot';
import VideoView from '../../common/video/VideoView';
import { requestConfig } from '../../utils/env';
// import refreshVideo from '../../static/image/refreshVideo.png';
import { deepEqual } from '../../utils/function';
import { getLocale } from '../../utils/locales';
import { getMsgFun } from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';// 导入toast

const Env = requestConfig();
const videoRequesting = getLocale('videoRequesting');

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
    justifyContent: 'center',
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
  promptText: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
    // textAlign: 'center',
  },
  promptTextText: {
    color: '#666',
    textAlign: 'center',
  },
});

class VideoItem extends Component {
  static propTypes = {
    unique: PropTypes.string.isRequired,
    brand: PropTypes.string,
    videoPrompt: PropTypes.string.isRequired,
    choosenVideo: PropTypes.number.isRequired,
    refreshVideoFun: PropTypes.func.isRequired, // 刷新视频
    videoStateChangeFun: PropTypes.func.isRequired, // 播放状态改变
    captureCallback: PropTypes.func.isRequired, // 拍照
    screenFlag: PropTypes.bool.isRequired,
    showMap: PropTypes.bool.isRequired, // 地图是否显示，如果显示了地图，视频区域的车牌号就不显示了
    hasVideo: PropTypes.bool.isRequired,
    cameraFlag: PropTypes.bool.isRequired,
    btmplayFlag: PropTypes.bool.isRequired,
    ifOpenAudio: PropTypes.bool.isRequired,
    sending9202: PropTypes.bool.isRequired,
    onDblClick: PropTypes.bool.isRequired,
    currentMonitor: PropTypes.object.isRequired,
    channelNames: PropTypes.object,
    playInfo: PropTypes.object,
  }

  static defaultProps = {
    brand: '',
    channelNames: null,
    playInfo: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      ifOpenVideo: false,
      ifSuccess: true,
      clickTime: null, // 双击时间间隔
      ifState0: false,
      videoPlaybackPort: Env.videoPlaybackPort,
      realTimeVideoIp: Env.realTimeVideoIp,
      ifCaptureAndroid: false,
      playMessage: null, // 播放连接成功后需传递的msg信息
    };
    // this.getStorageVideoRequestPort();
  }

  data = {
    capturing: false,
    clickTime: null,
  }

  // 获取视频播放所需msg信息
  getPlayMessage = async () => {
    const { currentMonitor } = this.props;
    const { playMessage } = this.state;
    const info = currentMonitor ? currentMonitor.toJS() : {};
    const id = info.markerId || info.vehicleId;
    if (playMessage && playMessage.vehicleId === id) return;
    const result = await getMsgFun({ monitorId: id });
    if (result) {
      this.setState({
        playMessage: result.obj,
      });
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const {
      unique, captureCallback, cameraFlag, btmplayFlag, currentMonitor,
    } = nextProps;
    const { ifSuccess } = this.state;
    if (currentMonitor) {
      this.getPlayMessage();
    }
    if (ifSuccess) {
      // 拍照
      if (cameraFlag && !this.data.capturing) {
        this.data.capturing = true;

        if (Platform.OS === 'ios') {
          this.refCapture(unique);
        }
        if (Platform.OS === 'android') {
          this.setState({
            ifCaptureAndroid: true,
          });
          setTimeout(() => {
            this.setState({
              ifCaptureAndroid: false,
            });
            captureCallback(true);
            this.data.capturing = false;
          }, 500);
        }
      }
    }
    if (btmplayFlag) {
      setTimeout(() => {
        this.setState({
          ifOpenVideo: btmplayFlag,
        });
      }, 300);
    } else {
      this.setState({
        ifOpenVideo: btmplayFlag,
      });
    }
  }


  shouldComponentUpdate (nextProps, nextState) {
    const propsEqual = deepEqual(this.props, nextProps,
      [
        'unique',
        'brand',
        'videoPrompt',
        'showMap',
        'hasVideo',
        'cameraFlag',
        'btmplayFlag',
        'ifOpenAudio',
        'sending9202',
        'playInfo',
      ]);
    const stateEqual = deepEqual(this.state, nextState);

    return !propsEqual || !stateEqual;
  }


  /**
   * 视频状态改变后触发
   * state=>
   * 0:connected 底层socket连接成功，即将播放视频
   * 1:failed 播放异常
   * 2:disconnected 底层socket断开
   * 3:success 每播放成功一帧触发一次
   * 4:video_closed 关闭播放
   */
  videoStateFun = (state) => {
    const sta = parseInt(state, 10);
    if (sta === 3) { // 播放成功
      this.setState({
        ifSuccess: true,
      });
    }
    if (sta === 4 || sta === 1) {
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

    // 播放状态改变后传给父组件
    const { videoStateChangeFun } = this.props;
    if (typeof videoStateChangeFun === 'function') {
      videoStateChangeFun(sta);
    }
  }

  // 刷新视频
  refreshVideo = () => {
    const { refreshVideoFun } = this.props;
    if (typeof refreshVideoFun === 'function') {
      refreshVideoFun();
    }
  }

  refCapture = () => {
    const { captureCallback, choosenVideo } = this.props;

    captureRef(this[`refCapture${choosenVideo}`], {
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
              captureCallback(true);
              this.data.capturing = false;
            }).catch(() => {
              captureCallback(false);
              this.data.capturing = false;
            });
          }).catch(() => {
            captureCallback(false);
          });
        } else {
          const promise = CameraRoll.saveToCameraRoll(uri, 'photo');
          promise.then(() => {
            captureCallback(true);
            this.data.capturing = false;
          }).catch(() => {
            captureCallback(false);
            this.data.capturing = false;
          });
        }
      },
    );
  }

  videoChoose = () => {
    const { onDblClick } = this.props;
    const { clickTime } = this.data;


    const time = new Date();
    const millisencod = time.getTime();
    if (clickTime) {
      const differValue = millisencod - clickTime;
      if (differValue < 500) {
        if (typeof onDblClick === 'function') {
          this.data.clickTime = null;
          onDblClick();
          console.log('videoChoose');
          return;
        }
      }
    }
    this.data.clickTime = millisencod;
  }

  // 组装视频控制msg信息
  renderPlayMsg = () => {
    const {
      choosenVideo, currentMonitor, channelNames, playInfo,
    } = this.props;
    const { playMessage, ifOpenVideo } = this.state;
    if (ifOpenVideo && (playInfo && !(playInfo.toJS().startTime))) return '';
    if (playMessage && channelNames && playInfo) {
      let curItem = {};
      channelNames.toJS().map((item) => {
        if (item.physicsChannel === choosenVideo) {
          curItem = item;
        }
        return item;
      });
      const info = playInfo.toJS();
      let message = {};
      if (!ifOpenVideo || info.remote === '5') {
        message = {
          data: {
            msgHead: {
              msgID: 50002, // 视频控制
            },
            msgBody: {
              dragPlaybackTime: (info.remote ? info.dragPlaybackTime : ''), // 拖动回放时间点（YYMMDDHHmmss）回放控制为5时有效，否则全为0
              remote: info.remote || '2', // 回放控制 0：开始回放 1：暂停回放 2：结束回放 3：快进回放 4：关键帧快退回放 5：拖地回放 6：关键帧播放
              forwardOrRewind: '0', // 快进快退 回放控制为3或4是有效，否则为0 0：无效 1：1倍 2：2倍 3：4倍 4：8倍 5：16倍
            },
          },
          panoramic: JSON.stringify(curItem.panoramic), // 是否360全景
        };
      } else {
        message = {
          data: {
            msgHead: {
              msgID: 50001, // 播放
            },
            msgBody: {
              vehicleId: currentMonitor.id, // 车辆ID
              remote: '0',
              simcardNumber: playMessage.simcardNumber, // sim卡号
              channelNumber: JSON.stringify(choosenVideo), // 通道号
              sampleRate: playMessage.samplingRateStr ? JSON.stringify(playMessage.samplingRateStr) : '8000', // 采样率
              channelCount: playMessage.vocalTractStr ? JSON.stringify(playMessage.vocalTractStr) : '1', // 声道数
              audioFormat: playMessage.audioFormatStr, // 编码格式
              playType: 'TRACK_BACK', // 播放类型 实时 REAL_TIME，回放 TRACK_BACK，对讲 BOTH_WAY，监听 UP_WAY，广播 DOWN_WAY
              dataType: '0', // 数据类型0：音视频，1：视频，2：双向对讲，3：监听，4：中心广播，5：透传
              userID: playMessage.userUuid, // 用户ID
              deviceID: playMessage.deviceId, // 终端ID
              streamType: JSON.stringify(curItem.streamType), // 码流类型0：主码流，1：子码流
              deviceType: playMessage.deviceType, // 终端类型
              ...info,
            },
          },
          panoramic: JSON.stringify(curItem.panoramic), // 是否360全景
        };
      }
      return JSON.stringify(message);
    }
    return '';
  }

  // 接收服务器向前端发送的状态信息
  msgChangeFun = ({ code, msg }) => {
    if (code < 0) {
      toastShow(msg, { duration: 2000 });
    }
  }

  componentWillUnmount = () => {
    this.msgChangeFun = null;
  }

  render () {
    const {
      unique,
      brand,
      choosenVideo,
      screenFlag,
      showMap,
      hasVideo,
      ifOpenAudio,
      sending9202,
      videoPrompt,
      // eslint-disable-next-line react/prop-types
    } = this.props;
    const {
      ifOpenVideo,
      ifCaptureAndroid,
      ifState0,
      videoPlaybackPort,
      realTimeVideoIp,
      playMessage,
    } = this.state;
    let url;
    const sampleRate = 8000;
    if (playMessage) {
      url = `ws://${realTimeVideoIp}:${videoPlaybackPort}/${playMessage && playMessage.simcardNumber}/${choosenVideo}`;
    } else {
      url = '';
    }
    // console.log(brand, videoRequesting, videoPrompt, 'brand, videoRequesting, videoPrompt');
    return (
      unique || sending9202
        ? (
          <View style={{ flex: 1 }}>
            {
              showMap ? null : (
                <View style={styles.itemTitle}>
                  <Text style={styles.titleTxt}>{brand}</Text>
                </View>
              )
            }
            <TouchableHighlight
              onPress={this.videoChoose}
              underlayColor="transparent"
              style={[{ flex: 1 }]}
              ref={(view) => { this[`myComponent${choosenVideo}`] = view; }}
            >
              <VideoView
                ref={(ref) => { this[`refCapture${choosenVideo}`] = ref; }}
                style={styles.video}
                ifOpenVideo={ifOpenVideo}
                socketUrl={url}
                videoStateFun={this.videoStateFun}
                sampleRate={sampleRate}
                ifOpenAudio={ifOpenAudio}
                screenFlag={screenFlag}
                ifCurrentScreenFlag
                ifCaptureAndroid={ifCaptureAndroid}
                channel={choosenVideo}
                playType="PlayBack"
                playMessage={this.renderPlayMsg()}
                msgChangeFun={this.msgChangeFun}
              />
            </TouchableHighlight>

            {/* {
             !ifSuccess ? (
               <TouchableHighlight
                 onPress={this.refreshVideo}
                 underlayColor="transparent"
                 style={styles.refreshCont}
               >
                 <Image source={refreshVideo} style={styles.refreshPng} />
               </TouchableHighlight>
             ) : (null)
           } */}

            {
              ifState0 && ifOpenVideo
                ? (
                  <View style={styles.requestVideo}>
                    <View style={styles.requestVideoText}>
                      <Text style={{ color: '#fff' }}>{videoRequesting}</Text>
                    </View>
                  </View>
                )
                : null
            }
          </View>
        )
        : (
          <View style={{ flex: 1 }}>
            {
              showMap ? null : (
                <View style={styles.itemTitle}>
                  <Text style={styles.titleTxt}>{brand}</Text>
                </View>
              )
            }
            <View style={styles.video}>
              {
                hasVideo === null ? null : (
                  <View style={styles.promptText}>
                    <Text style={styles.promptTextText}>
                      {videoPrompt}
                    </Text>
                  </View>
                )
              }
            </View>
          </View>
        )
    );
  }
}

export default VideoItem;