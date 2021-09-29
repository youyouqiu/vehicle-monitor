import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import MapView from '../../common/MapView';// 地图
import ScaleView from '../../common/scaleAndroid';
import amplificationImage from '../../static/image/amplification.png';
import narrowImage from '../../static/image/narrow.png';

// style
const styles = StyleSheet.create({
  mapBox: {
    flex: 1,
    width: '100%',
    height: 180,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  coverView: {
    flex: 1,
    width: '100%',
    height: 180,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
    backgroundColor: '#fff',
  },
  slide: {
    height: 0,
  },
  slideUp: {
    height: 180,
  },
  map: {
    flex: 1,
  },
  scaleAndroidStyle: {
    position: 'absolute',
    left: 15,
    bottom: 15,
    zIndex: 99,
  },
  mapIcon: {
    position: 'absolute',
    right: 10,
    width: 40,
    height: 40,
    zIndex: 99,
  },
  mapIconImage: {
    width: '100%',
    height: '100%',
  },
});

class Map extends Component {
  static propTypes = {
    slideUp: PropTypes.bool.isRequired,
    videoMarker: PropTypes.array.isRequired,
    removeAnnotation: PropTypes.string,
    trackingId: PropTypes.string,
    mapShow: PropTypes.bool,
    goLatestPoin: PropTypes.array,
  }

  static defaultProps = {
    mapShow: false,
    removeAnnotation: null,
    trackingId: null,
    goLatestPoin: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      pageDet: 'monitorVideo',
      ifMapShow: false,
      baiduMapScalePosition: '15|50',
      mapInit: false,
      loadScale: false,
      scaleAndroidValue: null,
      mapAmplification: null,
      mapNarrow: null,
    };
  }


  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { mapShow } = nextProps;
    if (mapShow) {
      this.setState({
        ifMapShow: true,
      });
      setTimeout(() => {
        this.setState({
          loadScale: true,
        });
      }, 400);
    } else {
      setTimeout(() => {
        this.setState({
          ifMapShow: false,
        });
      }, 200);
    }
  }

  mapFinish() {
    this.setState({ mapInit: true });
  }

  onMyScale(data) {
    const arr = data.split(',');
    this.setState({ scaleAndroidValue: arr[0] });
  }

  // 地图放大按钮点击
  mapAmplificationClick() {
    const { mapAmplification } = this.state;
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
    this.setState({ mapNarrow: value });
  }

  render() {
    const {
      slideUp, removeAnnotation, trackingId, videoMarker, mapShow, goLatestPoin,
    } = this.props;
    const isSlideUp = slideUp ? styles.slideUp : null;

    const {
      pageDet,
      ifMapShow,
      baiduMapScalePosition,
      mapInit,
      loadScale,
      scaleAndroidValue,
      mapAmplification,
      mapNarrow,
    } = this.state;

    return (
      <Animatable.View
        duration={300}
        transition="height"
        style={[styles.slide, isSlideUp, !mapShow ? { display: 'none' } : null]}
      >
        <View style={styles.mapBox}>
          <TouchableOpacity
            onPress={() => this.mapAmplificationClick()}
            style={[styles.mapIcon, { bottom: 60 }]}
          >
            <Image
              style={styles.mapIconImage}
              source={amplificationImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.mapNarrowClick()}
            style={[styles.mapIcon, { bottom: 10 }]}
          >
            <Image
              style={styles.mapIconImage}
              source={narrowImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {
            Platform.OS === 'ios' || ifMapShow ? (

              <MapView
                style={[styles.map, { height: 0 }]}
                videoMarker={videoMarker}
                delId={removeAnnotation}
                trackingId={trackingId}
                pageDet={pageDet}
                onMapInitFinish={() => this.mapFinish()}
                mapAmplification={mapAmplification}
                mapNarrow={mapNarrow}
                baiduMapScalePosition={
                  (mapInit && ifMapShow && loadScale) ? baiduMapScalePosition : null
                }
                onMyScale={data => this.onMyScale(data)}
                goLatestPoin={goLatestPoin}
              />
            ) : null
          }
          {
            Platform.OS === 'android' ? (
              <View style={styles.scaleAndroidStyle}>
                <ScaleView scaleValue={scaleAndroidValue} />
              </View>
            ) : null
          }
        </View>
      </Animatable.View>
    );
  }
}

export default Map;