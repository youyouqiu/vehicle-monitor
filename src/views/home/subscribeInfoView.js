import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { is } from 'immutable';

import offline from '../../static/image/offline.png';
import runImage from '../../static/image/run.png';
import warnStateImage from '../../static/image/warnState.png';
import stopStateImage from '../../static/image/stopState.png';
import missStateImage from '../../static/image/missState.png';
import heartbeatStateImage from '../../static/image/heartbeatState.png';
import speedLimitState from '../../static/image/speedLimitState.png';
// import electricityImage from '../../static/image/electricity.png';
import electricityOneImage from '../../static/image/electricity1.png';
import electricityTwoImage from '../../static/image/electricity2.png';
import electricityThreeImage from '../../static/image/electricity3.png';
import electricityFourImage from '../../static/image/electricity4.png';
import electricityFiveImage from '../../static/image/electricity5.png';
import electricQuantity from '../../static/image/electricQuantity.png';
// import signalImage from '../../static/image/signal.png';
import signalOneImage from '../../static/image/signal1.png';
import signalTwoImage from '../../static/image/signal2.png';
import signalThreeImage from '../../static/image/signal3.png';
import signalFourImage from '../../static/image/signal4.png';
import signalFiveImage from '../../static/image/signal5.png';

import wifi1 from '../../static/image/wifi1.png';
import wifi2 from '../../static/image/wifi2.png';
import wifi3 from '../../static/image/wifi3.png';
import wifi4 from '../../static/image/wifi4.png';
import wifi5 from '../../static/image/wifi5.png';
import baseStation1 from '../../static/image/baseStation1.png';
import baseStation2 from '../../static/image/baseStation2.png';
import baseStation3 from '../../static/image/baseStation3.png';
import baseStation4 from '../../static/image/baseStation4.png';
import baseStation5 from '../../static/image/baseStation5.png';
import satellite from '../../static/image/satellite.png';


const { width } = Dimensions.get('window'); // 获取屏幕宽度


const styles = StyleSheet.create({
  headerInfoView: {
    width,
    backgroundColor: '#ffffff',
    // height: 80,
    paddingRight: 20,
    paddingLeft: 20,
    paddingVertical: 10,
    minHeight: 80,
    shadowColor: '#c6c6c6',
    shadowOffset: { h: 10, w: 10 },
    shadowRadius: 3,
    shadowOpacity: 0.8,
  },
  runImage: {
    width: 12,
    height: 12,
    marginRight: 3,
  },
  electricityImageStyle: {
    width: 23,
    height: 12,
    // marginLeft: 3,
  },
  wifiImageStyle: {
    width: 16,
    height: 16,
    marginLeft: 3,
  },
  headerFirstLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 3,
    height: 21,
  },
  electricityLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 30,
  },
  headerInfoFlex: {
    flex: 1,
  },
  flexDirRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexDirRowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

class SubInfoView extends Component {
  static propTypes = {
    basicLocationInfo: PropTypes.object,
    componentOnlayOut: PropTypes.func.isRequired,
  };

  // 属性默认值
  static defaultProps = {
    basicLocationInfo: {},
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  onLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    const { componentOnlayOut } = this.props;
    if (typeof componentOnlayOut === 'function') {
      componentOnlayOut(height);
    }
  }

  scrollContChange = () => {
    this.scrollView.scrollToEnd();
  }

  setType (type, status, speed) {
    let result;
    // if (status === 4) {
    //   result = '停止';
    // }
    // if (status === 10 || status === 11 || status === 2 || status === 9) {
    //   // result = '行驶'
    //   if (type === 1) {
    //     result = '移动';
    //   } else {
    //     result = '行驶';
    //   }
    // }
    // if (status === 5) { // 报警速度>0 显示行驶时长 =0 显示停止时长
    //   if (speed > 0) {
    //     if (type === 1) {
    //       result = '移动';
    //     } else {
    //       result = '行驶';
    //     }
    //   } else {
    //     result = '停止';
    //   }
    // }
    // if (status === 3) {
    //   result = '离线';
    // }
    if (speed > 0) {
      if (type === 1) {
        result = '移动';
      } else {
        result = '行驶';
      }
    } else {
      result = '停止';
    }
    return result;
  }

  makeSubInfo (data) {
    const subData = {
      // 状态图片
      stateImage: '-',
      // 状态描述
      stateDescribe: '状态',
      // 状态
      status: '-',
      // 持续时长
      duration: '-',
      // 电量
      battery: '-',
      // 定位信号文字描述
      signalText: '定位信号',
      // 信号强度值
      signalValue: '-',
      // 当前时间
      gpsTime: '--',
      // 位置
      address: '--',
      // 0车，1人，2物,
      type: '',
      pattern: '',
      satellitesNumber: null, // 卫星数量
      signalStrength: null, // 信号强度
      signalType: null, // 信号类型
      wifi: null,
      offlineTimeStr: null,
    };
    if (data !== null) {
      /* eslint prefer-destructuring:off */
      const stateInfo = this.stateImageCallBack(data.status);
      subData.stateImage = stateInfo[0];
      subData.stateDescribe = stateInfo[1];
      subData.status = data.status;
      if (data.duration || data.duration === 0) {
        if ((data.duration / 1000 / 60 / 60) > 24) {
          subData.duration = `>${parseInt((data.duration / 1000 / 60 / 60 / 24), 10)}天`;
        } else {
          const h = parseInt((data.duration / 1000 / 60 / 60), 10);
          const m = parseInt((data.duration - (h * 60 * 60 * 1000)) / 1000 / 60, 10);
          subData.duration = `${h}小时${m}分`;
        }
      }
      // subData.battery = this.stateBatteryCallBack(data.battery);
      subData.battery = data.battery === null ? '-' : data.battery;
      const signalInfo = this.signalCallBack(data);
      subData.signalText = signalInfo[0];
      subData.signalValue = signalInfo[1];
      subData.gpsTime = data.gpsTime;
      subData.address = data.address;
      subData.pattern = data.pattern;
      subData.satellitesNumber = data.satellitesNumber;
      subData.signalStrength = data.signalStrength;
      subData.signalType = data.signalType;
      subData.wifi = data.wifi;

      let offlineTime;
      if (data.gpsTime !== null && data.gpsTime !== undefined && data.gpsTime.length > 0) {
        const handlegpstime = (new Date((data.gpsTime).replace(/-/g, '/'))).getTime();
        const now = (new Date()).getTime();
        const num = now - handlegpstime;

        if ((num / 1000 / 60 / 60) > 24) {
          offlineTime = `>${parseInt((num / 1000 / 60 / 60 / 24), 10)}天`;
        } else {
          const h = parseInt((num / 1000 / 60 / 60), 10);
          const m = parseInt((num - (h * 60 * 60 * 1000)) / 1000 / 60, 10);
          offlineTime = `${h}小时${m}分`;
        }
      } else {
        offlineTime = null;
      }

      subData.offlineTimeStr = offlineTime;


      subData.type = this.setType(data.type, data.status, data.speed);
    }
    return subData;
  }

  // 状态图片返回
  stateImageCallBack (status) {
    let stateImage;
    let stateDescribe;
    switch (status) {
      // 移动
      case 10:
        stateImage = runImage;
        stateDescribe = '行驶';
        break;
      // 心跳
      case 11:
        stateImage = heartbeatStateImage;
        stateDescribe = '心跳';
        break;
      // 报警
      case 5:
        stateImage = warnStateImage;
        stateDescribe = '报警';
        break;
      // 未定位
      case 2:
        stateImage = missStateImage;
        stateDescribe = '未定位';
        break;
      // 停止
      case 4:
        stateImage = stopStateImage;
        stateDescribe = '停止';
        break;
      // 超速
      case 9:
        stateImage = speedLimitState;
        stateDescribe = '超速';
        break;
      // 不在线
      case 3:
        stateImage = offline;
        stateDescribe = '离线';
        break;
      default:
        break;
    }
    return [stateImage, stateDescribe];
  }

  // 电量图片返回
  stateBatteryCallBack (value) {
    let battery = '-';
    if (value !== null) {
      if (value === 1) {
        battery = electricityOneImage;
      } else if (value === 2) {
        battery = electricityTwoImage;
      } else if (value === 3) {
        battery = electricityThreeImage;
      } else if (value === 4) {
        battery = electricityFourImage;
      } else if (value === 5) {
        battery = electricityFiveImage;
      }
    }
    return battery;
  }

  // 信号强度图片返回
  signalCallBack (data) {
    let signalType;
    let signalValue;

    if (data.wifi !== null) {
      signalType = 'WIFI';
      signalValue = data.wifi;
    } else if (data.lbs !== null) {
      signalType = 'LBS';
      signalValue = data.lbs;
    } else if (data.gps !== null) {
      signalType = '卫星';
      signalValue = data.gps;
    } else if (data.lbs_wifi !== null) {
      signalType = 'LBS/WIFI';
      signalValue = data.lbs_wifi;
    } else {
      signalType = '-';
      signalValue = '-';
    }
    if (signalValue !== '-') {
      if (signalValue === -1) {
        signalValue = '-';
      } else if (signalValue === 0) {
        signalValue = signalOneImage;
      } else if (signalValue === 2) {
        signalValue = signalTwoImage;
      } else if (signalValue === 3) {
        signalValue = signalThreeImage;
      } else if (signalValue === 4) {
        signalValue = signalFourImage;
      } else if (signalValue === 5) {
        signalValue = signalFiveImage;
      } else {
        signalValue = '-';
      }
    }

    return [signalType, signalValue];
  }

  /**
   * 处理信号类型
   */
  handlepattern = (pattern) => {
    switch (pattern) {
      case 0:
        return '卫星+基站';
      case 1:
        return '基站';
      case 2:
        return '卫星';
      case 3:
        return 'WIFI+基站';
      case 4:
        return '卫星+WIFI+基站';
      default:
        return '';
    }
  }

  /**
   * 处理Wi-Fi图片
   */
  handleWifiPic = (type) => {
    switch (type) {
      case 0:
        return null;
      case 1:
        return wifi1;
      case 2:
        return wifi2;
      case 3:
        return wifi3;
      case 4:
        return wifi4;
      case 5:
        return wifi5;
      default:
        return null;
    }
  }

  /**
   * 处理基站信号图片
   */
  handlebaseStationPic = (type) => {
    switch (type) {
      case 0:
        return null;
      case 1:
        return baseStation1;
      case 2:
        return baseStation2;
      case 3:
        return baseStation3;
      case 4:
        return baseStation4;
      case 5:
        return baseStation5;
      default:
        return null;
    }
  }

  /**
   * 处理基站信号类型
   */
  handlebaseStationType = (type) => {
    switch (type) {
      case 4:
        return '2G';
      case 5:
        return '3G';
      case 6:
        return '4G';
      case 7:
        return '5G';
      case 8:
        return 'E';
      default:
        return '';
    }
  }

  handleDriveStatusView = (info) => {
    if (info.status === 11 || info.status === 2) {
      return (
        <View style={[styles.flexDirRow, styles.headerInfoFlex]}>
          <Text style={{ fontSize: 12 }}>--</Text>
        </View>
      );
    } if (info.status === 3) {
      return (
        <View style={[styles.flexDirRow, styles.headerInfoFlex]}>
          <Text style={{ fontSize: 12 }}>
            {
              info.offlineTimeStr === null ? '--' : '离线'
            }
          </Text>
          <Text style={{ fontSize: 12 }}>
            {info.offlineTimeStr}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.flexDirRow, styles.headerInfoFlex]}>
        <Text style={{ fontSize: 12 }}>
          {!info.type ? '持续时长' : info.type}
        </Text>
        <Text style={{ fontSize: 12 }}>
          {info.duration !== 'NaNhNaNm' && info.duration !== '-' ? info.duration : '--'}
        </Text>
      </View>
    );

    // (info.status === 11 || info.status === 2) ? (
    //   <View style={styles.flexAlignCenter}>
    //     <Text style={{ fontSize: 12 }}>--</Text>
    //   </View>
    // ) : (
    //   <View style={styles.flexAlignCenter}>
    //     <Text style={{ fontSize: 12 }}>
    //       {!info.type ? '持续时长' : info.type }
    //     </Text>
    //     <Text style={{ fontSize: 12 }}>
    //       { info.duration !== 'NaNhNaNm' && info.duration !== '-' ? info.duration : '--' }
    //     </Text>
    //   </View>
    // );
  }

  render () {
    const { basicLocationInfo } = this.props;
    const info = this.makeSubInfo(basicLocationInfo);
    return (
      <View>
        <View style={styles.headerInfoView} onLayout={e => this.onLayout(e)}>
          <View style={styles.headerInfoFlex}>
            <View style={styles.headerFirstLine}>
              <View style={styles.electricityLine}>
                {
                  info.stateImage !== '-' && info.stateDescribe
                  && (
                    <Image
                      style={styles.runImage}
                      source={info.stateImage}
                      resizeMode="contain"
                    />
                  )
                }
                <Text style={{ fontSize: 12 }}>
                  {info.stateDescribe ? info.stateDescribe : '状态--'}
                </Text>
                {
                  info.stateImage === '-'
                  && <Text style={{ fontSize: 12 }}>--</Text>
                }
              </View>
              {
                this.handleDriveStatusView(info)
              }
              <View style={styles.flexDirRow}>
                {/* 电量 */}
                {
                  info.battery === '-' || info.battery === undefined ? null
                    : (
                      <View style={[styles.flexDirRow, { paddingTop: 2 }]}>
                        <View style={styles.electricityImageStyle}>

                          <Image
                            style={styles.electricityImageStyle}
                            source={electricQuantity}
                            resizeMode="contain"
                          />
                          <View style={{
                            position: 'absolute', height: 10, left: 1, top: 1, width: 19,
                          }}
                          >
                            <View style={{
                              position: 'absolute', height: 8, left: 1, top: 1, backgroundColor: '#8ee035', width: `${info.battery ? info.battery : 0}%`,
                            }}
                            />
                            <Text style={{ fontSize: 8, textAlign: 'center' }}>
                              {info.battery}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )
                }

                {/* 卫星信号 */}
                {
                  info.satellitesNumber === null || info.satellitesNumber === undefined ? (
                    null
                  )
                    : (
                      <View style={[styles.flexDirRow]}>
                        <Image
                          style={[styles.wifiImageStyle, { width: 17, height: 17 }]}
                          source={satellite}
                          resizeMode="contain"
                        />
                        <Text style={{ fontSize: 12 }}>
                          {info.satellitesNumber}
                        </Text>
                      </View>
                    )
                }

                {/* wifi */}
                {
                  info.wifi === null ? (
                    null
                  )
                    : (
                      <View style={[styles.flexDirRow]}>

                        {
                          this.handleWifiPic(info.wifi) && (
                            <Image
                              style={[styles.wifiImageStyle]}
                              source={this.handleWifiPic(info.wifi)}
                              resizeMode="contain"
                            />
                          )
                        }
                      </View>
                    )
                }

                {/* 信号强度 */}
                {
                  info.signalStrength === null ? (
                    null
                  )
                    : (
                      <View style={[styles.flexDirRow]}>
                        {
                          this.handlebaseStationPic(info.signalStrength) && (
                            <Image
                              style={styles.wifiImageStyle}
                              source={this.handlebaseStationPic(info.signalStrength)}
                              resizeMode="contain"
                            />
                          )
                        }

                        <Text style={{ fontSize: 12, paddingLeft: 5 }}>
                          {this.handlebaseStationType(info.signalType)}
                        </Text>
                      </View>
                    )
                }
              </View>
            </View>

            <View style={[styles.flexDirRowSpace, { paddingVertical: 5 }]}>
              <View style={styles.flexDirRow}>
                <Text>
                  定位时间：
                </Text>
                <Text>
                  {info.gpsTime}
                </Text>
              </View>
              <View>
                <Text>
                  {this.handlepattern(info.pattern)}
                </Text>
              </View>
            </View>
            <View style={styles.flexDirRow}>
              <View style={styles.flexDirRow}>
                <Text>最后位置：</Text>
                {/* <Text numberOfLines={3} style={{ maxWidth: '80%' }}>{ info.address }</Text> */}
                <ScrollView
                  horizontal
                  onContentSizeChange={this.scrollContChange}
                  style={{ maxWidth: '80%', height: 25 }}
                  ref={(view) => { this.scrollView = view; }}
                >
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                  >
                    <Text>
                      {info.address}
                    </Text>

                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default SubInfoView;