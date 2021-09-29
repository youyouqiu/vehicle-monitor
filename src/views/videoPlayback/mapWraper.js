import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { is } from 'immutable';
import { isEmpty, deepEqual } from '../../utils/function';
import TopText from './topText';
import Map from './map';
import { bdEncrypt } from '../../utils/bMapCoordinates';
import amplificationImage from '../../static/image/amplification.png';
import narrowImage from '../../static/image/narrow.png';

const styles = StyleSheet.create({
  map: {
    flex: 1,
    // height: 200,
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
  title: {
    position: 'absolute',
    top: 0,
    height: 25,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});

const winHeight = Dimensions.get('window').height; // 获取屏幕宽度

export default class MapWraper extends Component {
  static propTypes = {
    currentMonitor: PropTypes.object.isRequired,
    historyLocation: PropTypes.object.isRequired,
    startTime: PropTypes.object.isRequired,
    btmplayFlag: PropTypes.bool.isRequired,
  }


  constructor(props) {
    super(props);

    const {
      historyLocation, startTime,
    } = props;
    const pointObj = this.getClosestPoint(startTime, historyLocation);
    this.data.lastStartTime = startTime;
    if (pointObj !== null) {
      this.state.playIndex = pointObj.index;
      this.state.stopLngLat = this.getStopAddress(pointObj.index, historyLocation);
    }
  }

  state={
    mapAmplification: null,
    mapNarrow: null,
    playStatus: 'paused',
    stopAddress: '--',
    playIndex: 0,
  }

  data={
    lastStartTime: null,
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { lastStartTime } = this.data;
    const { historyLocation } = this.props;
    const {
      startTime: nextStartTime,
      historyLocation: nextHistory,
      btmplayFlag,
    } = nextProps;

    if (btmplayFlag === false
      && (!is(lastStartTime, nextStartTime) || !is(historyLocation, nextHistory))) {
      const pointObj = this.getClosestPoint(nextStartTime, historyLocation);

      if (pointObj !== null) {
        this.data.lastStartTime = nextStartTime;
        const stopLngLat = this.getStopAddress(pointObj.index, historyLocation);
        this.setState({
          playIndex: pointObj.index,
          stopLngLat,
        });
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const propsEqual = deepEqual(this.props, nextProps,
      ['currentMonitor', 'startTime', 'historyLocation', 'btmplayFlag']);
    const stateEqual = deepEqual(this.state, nextState);

    return !propsEqual || !stateEqual;
  }

  // 查找离当前时间最近的位置点
  getClosestPoint=(time, historyLocation) => {
    if (isEmpty(time) || isEmpty(historyLocation)) {
      return null;
    }

    const timeInSecond = Math.round(time.getTime() / 1000);
    let index = 0;
    let diff = null;
    historyLocation.forEach((val, i) => {
      const diffInner = Math.abs(val.get('time') - timeInSecond);
      if (diff === null || diff > diffInner) {
        diff = diffInner;
        index = i;
      }
    });
    if (diff === null) {
      return null;
    }
    return {
      index,
      point: historyLocation.get(index),
    };
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

  getStopAddress=(index, locations) => {
    let { historyLocation: locationsInProp } = this.props;
    if (!isEmpty(locations)) {
      locationsInProp = locations;
    }
    if (locationsInProp === null) return null;
    const stop = locationsInProp.get(index);
    if (isEmpty(stop)) {
      return null;
    }
    const longitude = stop.get('longitude');
    const latitude = stop.get('latitude');
    const { bdLng, bdLat } = bdEncrypt(longitude, latitude);
    return {
      bdLng,
      bdLat,
    };
  }

  handleOnAddress=(param) => {
    this.setState({ stopAddress: param });
  }

  render() {
    const {
      currentMonitor,
      startTime,
      historyLocation,
    } = this.props;
    const {
      mapAmplification,
      mapNarrow,
      playStatus,
      stopAddress,
      playIndex,
      stopLngLat,
    } = this.state;

    const mapHeight = 10;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.title}>
          <TopText
            title={currentMonitor ? currentMonitor.get('title') : ''}
            startTime={startTime}
            stopAddress={stopAddress}
          />
        </View>
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
        <Map
          style={styles.map}
          currentMonitor={currentMonitor}
          historyLocation={historyLocation}
          playStatus={playStatus}
          playIndex={playIndex}
          speedInSecond={100}
          stopLngLat={stopLngLat}
          onAddress={this.handleOnAddress}
          fitPolyLineSpan={`${mapHeight + 40}|1|${playStatus}|${winHeight}|${currentMonitor.markerId}`}
          baiduMapScalePosition={`15|${mapHeight + 30}`}
          mapAmplification={mapAmplification}
          mapNarrow={mapNarrow}
          stopPoints={null}
          stopIndex={null}
        />
      </View>
    );
  }
}