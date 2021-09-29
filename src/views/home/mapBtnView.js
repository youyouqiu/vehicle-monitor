import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { is } from 'immutable';
import { connect } from 'react-redux';
import trafficEnabledImage from '../../static/image/trafficEnabled.png';
import mapTypeImage from '../../static/image/mapType.png';
import trafficEnabledDefaultImage from '../../static/image/trafficEnabled-default.png';
import mapTypeFocusImage from '../../static/image/mapType-focus.png';
// import streetViewImage from '../../static/image/streetView.png';
// import monitoringImage from '../../static/image/monitoring.png';
import amplificationImage from '../../static/image/amplification.png';
import narrowImage from '../../static/image/narrow.png';
import panorama from '../../static/image/panorama.png';

const styles = StyleSheet.create({
  btnView: {
    // height: 265,
    // backgroundColor: 'red',
  },
  mainView: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageView: {
    width: 40,
    height: 40,
  },
});

class MapBtnView extends Component {
  static propTypes = {
    mapTrafficEnabledChange: PropTypes.func,
    mapTypeChange: PropTypes.func,
    mapAmplification: PropTypes.array,
    mapAmplificationChange: PropTypes.func,
    mapNarrow: PropTypes.array,
    mapNarrowChange: PropTypes.func,
    mapTrafficEnabled: PropTypes.bool,
    bMapType: PropTypes.number,
    openPanorama: PropTypes.func,
  }

  // 属性默认值
  static defaultProps = {
    mapTrafficEnabledChange: null,
    mapTypeChange: null,
    mapAmplification: null,
    mapAmplificationChange: null,
    mapNarrow: null,
    mapNarrowChange: null,
    mapTrafficEnabled: false,
    bMapType: 1,
    openPanorama: null,
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  componentWillUnmount () {
    const {
      mapTrafficEnabled,
      bMapType,
      mapTrafficEnabledChange,
      mapTypeChange,
    } = this.props;
    if (mapTrafficEnabled) {
      mapTrafficEnabledChange();
    }
    if (bMapType === 2) {
      mapTypeChange();
    }
  }

  // 地图放大按钮点击
  mapAmplificationClick () {
    const {
      mapAmplification,
      mapAmplificationChange,
    } = this.props;
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
    mapAmplificationChange(value);
  }

  // 地图缩小按钮点击
  mapNarrowClick () {
    const {
      mapNarrow,
      mapNarrowChange,
    } = this.props;
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
    mapNarrowChange(value);
  }

  openPanorama = () => {
    const { openPanorama } = this.props;
    if (typeof openPanorama === 'function') {
      openPanorama();
    }
  }

  render () {
    const {
      mapTrafficEnabledChange,
      mapTypeChange,
      mapTrafficEnabled,
      bMapType,
    } = this.props;

    return (
      <View style={styles.btnView}>
        {/* 路况begin */}
        <TouchableOpacity
          onPress={mapTrafficEnabledChange}
          style={styles.mainView}
        >
          <Image
            style={styles.imageView}
            source={mapTrafficEnabled ? trafficEnabledImage : trafficEnabledDefaultImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        {/* 路况end */}
        {/* 地图类型切换begin */}
        <TouchableOpacity
          onPress={mapTypeChange}
          style={styles.mainView}
        >
          <Image
            style={styles.imageView}
            source={bMapType === 1 ? mapTypeImage : mapTypeFocusImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        {/* 地图类型切换end */}
        {/* 地图全景begin */}
        {
          Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={this.openPanorama}
              style={styles.mainView}
            >
              <Image
                style={styles.imageView}
                source={panorama}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )
        }

        {/* 地图全景end */}
        {/* <TouchableOpacity */}
        {/* style={styles.mainView} */}
        {/* > */}
        {/* <Image */}
        {/* style={styles.imageView} */}
        {/* source={streetViewImage} */}
        {/* resizeMode="contain" */}
        {/* /> */}
        {/* </TouchableOpacity> */}
        {/* <TouchableOpacity>
          <Image
            style={styles.imageView}
            source={monitoringImage}
            resizeMode="contain"
          />
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={() => this.mapAmplificationClick()}
        >
          <Image
            style={[styles.imageView, { marginTop: 30 }]}
            source={amplificationImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mainView}
          onPress={() => this.mapNarrowClick()}
        >
          <Image
            style={styles.imageView}
            source={narrowImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  }
}

export default connect(
  state => ({
    mapAmplification: state.getIn(['homeReducers', 'mapAmplification']),
    mapNarrow: state.getIn(['homeReducers', 'mapNarrow']),
    mapTrafficEnabled: state.getIn(['homeReducers', 'mapTrafficEnabled']),
    bMapType: state.getIn(['homeReducers', 'bMapType']),
  }),
  dispatch => ({
    mapTrafficEnabledChange: () => {
      dispatch({ type: 'MAP_TRAFFIC_ENABLED' });
    },
    mapTypeChange: () => {
      dispatch({ type: 'MAP_BMAP_TYPE' });
    },
    // mapZoomlChangeBig: () => {
    //   dispatch({ type: 'CHANGE_MAP_ZOOML_BIG' });
    // },
    // mapZoomlChangeSmall: () => {
    //   dispatch({ type: 'CHANGE_MAP_ZOOML_SMALL' });
    // },
    mapAmplificationChange: (mapAmplification) => {
      dispatch({ type: 'HOME/MAP_AMPLIFICATION', mapAmplification });
    },
    mapNarrowChange: (mapNarrow) => {
      dispatch({ type: 'HOME/MAP_NARROW', mapNarrow });
    },
  }),
)(MapBtnView);