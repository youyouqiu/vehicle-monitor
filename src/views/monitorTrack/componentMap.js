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

import MapView from '../../common/MapView';
import mapIcon1 from '../../static/image/mapIcon1.png';
import mapIcon3 from '../../static/image/mapIcon3.png';
// import mapIcon4 from '../../static/image/mapIcon4.png';
import mapIcon5 from '../../static/image/mapIcon5.png';
import mapIcon7 from '../../static/image/mapIcon7.png';
import targetIcon from '../../static/image/target.png';
import currentIcon from '../../static/image/current.png';
import trackIcon from '../../static/image/track.png';
import trafficEnabledDefaultImage from '../../static/image/trafficEnabled-default.png';
import mapTypeFocusImage from '../../static/image/mapType-focus.png';


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
    right: 10,
  },
  mapIcon_left: {
    left: 10,
  },
  scaleAndroidStyle: {
    position: 'absolute',
    left: 65,
    zIndex: 99,
  },
});

class Map extends Component {
  static propTypes = {
    locationManager: PropTypes.bool,
    onLocationSuccess: PropTypes.func,
    routePlan: PropTypes.array,
    onAddress: PropTypes.func,
    onPlanDistance: PropTypes.func,
    onLocationStatusDenied: PropTypes.func,
    trackPolyLineSpan: PropTypes.string,
    baiduMapScalePosition: PropTypes.string,
  }

  // 属性默认值
  static defaultProps ={
    locationManager: false,
    onLocationSuccess: null,
    routePlan: [],
    onAddress: null,
    onPlanDistance: null,
    onLocationStatusDenied: null,
    trackPolyLineSpan: null,
    baiduMapScalePosition: null,
  }

  constructor() {
    super();
    this.state = {
      trafficEnabled: false,
      bMapType: 1,
      mapAmplification: null,
      mapNarrow: null,
      mapInit: false,
      scaleAndroidValue: null,
      targetLocation: false,
      currentLocation: false,
      isShowLocation: false,
    };
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

  onMapInitFinish() {
    this.locationTimeout = setTimeout(() => {
      this.setState({ mapInit: true });
    }, 800);
  }

  componentWillUnmount() {
    if (this.locationTimeout) {
      clearTimeout(this.locationTimeout);
    }
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

  onPlanDistance(data) {
    const { onPlanDistance } = this.props;
    if (typeof onPlanDistance === 'function') {
      onPlanDistance(data);
    }
    this.setState({
      isShowLocation: true,
    });
  }

  render() {
    const {
      locationManager,
      onLocationSuccess,
      routePlan,
      onAddress,
      onLocationStatusDenied,
      trackPolyLineSpan,
      baiduMapScalePosition,
    } = this.props;

    const {
      trafficEnabled,
      bMapType,
      mapAmplification,
      mapNarrow,
      mapInit,
      scaleAndroidValue,
      targetLocation,
      currentLocation,
      isShowLocation,
    } = this.state;

    const compassOpenState = true;

    const scaleHeight = baiduMapScalePosition.split('|');

    return (
      <View
        style={styles.container}
      >
        {/* 地图 start */}
        <MapView
          style={{ width: '100%', height: '100%' }}
          locationManager={mapInit ? locationManager : null}
          onLocationSuccess={data => onLocationSuccess(data)}
          routePlan={mapInit ? routePlan : null}
          onAddress={data => onAddress(data)}
          onPlanDistance={data => this.onPlanDistance(data)}
          trafficEnabled={trafficEnabled}
          bMapType={bMapType}
          trackTargetLocation={targetLocation}
          trackCurrentLocation={currentLocation}
          mapAmplification={mapAmplification}
          onLocationStatusDenied={data => onLocationStatusDenied(data)}
          mapNarrow={mapNarrow}
          compassOpenState={compassOpenState}
          trackPolyLineSpan={trackPolyLineSpan}
          baiduMapScalePosition={mapInit ? baiduMapScalePosition : null}
          onMapInitFinish={() => { this.onMapInitFinish(); }}
          onMyScale={data => this.onMyScale(data)}
        />
        {/* 地图 end */}

        {/* 工具图标 start */}
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 20 }]}
          onPress={() => this.trafficEnabledChange()}
        >
          <Image
            source={trafficEnabled ? mapIcon5 : trafficEnabledDefaultImage}
            style={styles.ico}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 60 }]}
          onPress={() => this.bMapTypeChange()}
        >
          <Image
            source={bMapType === 1 ? mapIcon1 : mapTypeFocusImage}
            style={styles.ico}
          />
        </TouchableOpacity>

        {/* 放大缩小 */}
        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 180 }]}
          onPress={() => this.mapNarrowClick()}
        >
          <Image
            source={mapIcon7}
            style={styles.ico}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapIcon, styles.mapIcon_right, { top: 140 }]}
          onPress={() => this.mapAmplificationClick()}
        >
          <Image
            source={mapIcon3}
            style={styles.ico}
          />
        </TouchableOpacity>
        {/* 聚焦 */}
        {
          !targetLocation && !currentLocation && isShowLocation && (
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
          targetLocation && isShowLocation && (
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
        {
          currentLocation && !targetLocation && isShowLocation && (
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
        {/* 工具图标 end */}
        {
          Platform.OS === 'android' ? (
            <View style={[styles.scaleAndroidStyle, { bottom: Math.ceil(scaleHeight[1]) - 40 }]}>
              <ScaleView scaleValue={scaleAndroidValue} />
            </View>
          ) : null
        }
      </View>
    );
  }
}

export default Map;