import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import ScaleView from '../../common/scaleAndroid';

import MapView from '../../common/MapView';// 地图

import mapIcon1 from '../../static/image/mapIcon1.png';
// import mapIcon2 from '../../static/image/mapIcon2.png';
import mapIcon3 from '../../static/image/mapIcon3.png';
// import mapIcon4 from '../../static/image/mapIcon4.png';
import mapIcon5 from '../../static/image/mapIcon5.png';
// import mapIcon6 from '../../static/image/mapIcon6.png';
import mapIcon7 from '../../static/image/mapIcon7.png';
import trafficEnabledDefaultImage from '../../static/image/trafficEnabled-default.png';
import mapTypeFocusImage from '../../static/image/mapType-focus.png';
import targetIcon from '../../static/image/target.png';
import currentIcon from '../../static/image/current.png';
import trackIcon from '../../static/image/track.png';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapIcon: {
    position: 'absolute',
    zIndex: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ico: {
    width: 40,
    height: 40,
  },
  mapIcon_right: {
    right: 5,
  },
  mapIcon_left: {
    left: 5,
  },
  scaleAndroidStyle: {
    position: 'absolute',
    left: 65,
    zIndex: 99,
  },
});

class MapComponent extends Component {
  static propTypes = {
    // markers: PropTypes.object,
    realTimeWake: PropTypes.bool,
    onMapInitFinish: PropTypes.func,
    wakeData: PropTypes.array,
    baiduMapScalePosition: PropTypes.string,
    goLatestPoin: PropTypes.array,
    toggleSlideState: PropTypes.bool,
  }

  // 属性默认值
  static defaultProps ={
    // markers: new Map(),
    realTimeWake: true,
    onMapInitFinish: null,
    wakeData: null,
    baiduMapScalePosition: null,
    goLatestPoin: null,
  }

  constructor() {
    super();
    this.state = {
      trafficEnabled: false,
      bMapType: 1,
      mapAmplification: null,
      mapNarrow: null,
      scaleAndroidValue: null,
      targetLocation: true,
      currentLocation: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { wakeData } = nextProps;
    if (wakeData.length > 0 && this.props.wakeData.length > 0
      && wakeData[0].time !== this.props.wakeData[0].time
    ) {
      this.setState({
        // currentLocation: false,
        targetLocation: true,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 地图路况切换
  trafficEnabledChange() {
    const { trafficEnabled } = this.state;
    this.setState({
      trafficEnabled: !trafficEnabled,
    });
  }

  // 地图类型切换
  bMapTypeChange() {
    const { bMapType } = this.state;
    this.setState({
      bMapType: bMapType === 1 ? 2 : 1,
    });
  }

  // 地图放大按钮点击
  mapAmplificationClick() {
    const {
      mapAmplification,
    } = this.state;
    let value;
    if (mapAmplification === null) {
      value = [{
        type: 'big',
        index: 0,
      }];
    } else {
      value = [
        {
          type: 'big',
          index: mapAmplification[0].index + 1,
        },
      ];
    }
    // mapAmplificationChange(value);
    this.setState({ mapAmplification: value });
  }

  // 地图缩小按钮点击
  mapNarrowClick() {
    const {
      mapNarrow,
    } = this.state;
    let value;
    if (mapNarrow === null) {
      value = [{
        type: 'small',
        index: 0,
      }];
    } else {
      value = [
        {
          type: 'small',
          index: mapNarrow[0].index + 1,
        },
      ];
    }
    // mapNarrowChange(value);
    this.setState({ mapNarrow: value });
  }

  onMyScale(data) {
    const arr = data.split(',');
    this.setState({ scaleAndroidValue: arr[0] });
  }

  setTargetLocation() {
    this.setState({
      targetLocation: false,
      currentLocation: false,
    });
  }

  setCurrentLocation() {
    this.setState({
      targetLocation: true,
    });
  }

  setLocation() {
    this.setState({
      currentLocation: true,
    });
  }

  render() {
    const {
      // markers,
      wakeData,
      realTimeWake,
      onMapInitFinish,
      baiduMapScalePosition,
      goLatestPoin,
      toggleSlideState,
    } = this.props;

    const {
      trafficEnabled,
      bMapType,
      mapAmplification,
      mapNarrow,
      scaleAndroidValue,
      currentLocation,
      targetLocation,
    } = this.state;

    const compassOpenState = true;

    const scaleHeight = baiduMapScalePosition === null ? [0, 0] : baiduMapScalePosition.split('|');

    return (
      <View
        style={styles.container}
      >
        {/* 地图 start */}
        <MapView
          style={styles.container}
          // markers={markers}
          wakeData={wakeData}
          realTimeWake={realTimeWake}
          onMapInitFinish={() => onMapInitFinish()}
          trafficEnabled={trafficEnabled}
          bMapType={bMapType}
          mapAmplification={mapAmplification}
          mapNarrow={mapNarrow}
          wakeCurrentLocation={currentLocation}
          wakeTargetLocation={targetLocation}
          compassOpenState={compassOpenState}
          baiduMapScalePosition={baiduMapScalePosition}
          onMyScale={data => this.onMyScale(data)}
          goLatestPoin={goLatestPoin}
        />
        {/* 地图 end */}

        {/* 工具图标 start */}
        {
          !toggleSlideState && (
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, { top: 20 }]}
              onPress={() => this.trafficEnabledChange()}
            >
              <Image
                source={trafficEnabled ? mapIcon5 : trafficEnabledDefaultImage}
                style={styles.ico}
              />
            </TouchableOpacity>
          )
        }
        {
          !toggleSlideState && (
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, { top: 60 }]}
              onPress={() => this.bMapTypeChange()}
            >
              <Image
                source={bMapType === 1 ? mapIcon1 : mapTypeFocusImage}
                style={styles.ico}
              />
            </TouchableOpacity>
          )
        }
        {
          !toggleSlideState && (
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, { top: 140 }]}
              onPress={() => this.mapAmplificationClick()}
            >
              <Image
                source={mapIcon3}
                style={styles.ico}
              />
            </TouchableOpacity>
          )
        }
        {/* 放大缩小 */}
        {
          !toggleSlideState && (
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, { top: 180 }]}
              onPress={() => this.mapNarrowClick()}
            >
              <Image
                source={mapIcon7}
                style={styles.ico}
              />
            </TouchableOpacity>
          )
        }
        {/* 定位图标 start */}
        {
          !currentLocation && !targetLocation && !toggleSlideState && (
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, { top: 260 }]}
              onPress={() => this.setLocation()}
            >
              <Image
                source={trackIcon}
                style={styles.ico}
              />
            </TouchableOpacity>
          )
        }
        {
          currentLocation && !targetLocation && !toggleSlideState && (
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, { top: 260 }]}
              onPress={() => this.setCurrentLocation()}
            >
              <Image
                source={currentIcon}
                style={styles.ico}
              />
            </TouchableOpacity>
          )
        }
        {
          targetLocation && !toggleSlideState && (
            <TouchableOpacity
              style={[styles.mapIcon, styles.mapIcon_right, { top: 260 }]}
              onPress={() => this.setTargetLocation()}
            >
              <Image
                source={targetIcon}
                style={styles.ico}
              />
            </TouchableOpacity>
          )
        }
        {/* 定位图标 end */}
        {
          Platform.OS === 'android' ? (
            <View style={[styles.scaleAndroidStyle, { bottom: Math.ceil(scaleHeight[1]) - 20, left: 18 }]}>
              <ScaleView scaleValue={scaleAndroidValue} />
            </View>
          ) : null
        }
      </View>
    );
  }
}

export default MapComponent;