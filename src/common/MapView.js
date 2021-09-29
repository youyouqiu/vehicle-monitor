import React from 'react';
import PropTypes from 'prop-types';
import {
  requireNativeComponent,
  StyleSheet,
} from 'react-native';
import storage from '../utils/storage';
import { getCurAccont } from '../server/getStorageData';

const styles = StyleSheet.create({
  mapStyle: {
    flex: 1,
  },
});

class MapView extends React.Component {
  static propTypes = {
    // 实时路况
    trafficEnabled: PropTypes.bool,
    // 地图类型 1、标准地图；2、卫星地图
    bMapType: PropTypes.number,
    // 创建marker和更新位置
    markers: PropTypes.array,
    // 创建线段
    overlayPoints: PropTypes.array,
    // 路线规划
    routePlan: PropTypes.array,
    // 开始定位
    locationManager: PropTypes.bool || null,
    // 地图点击事件
    onMapClick: PropTypes.func,
    // 返回区域内的
    onInAreaOptions: PropTypes.func,
    // 中心点id
    centerPoint: PropTypes.string,
    // 轨迹回放数据
    sportPath: PropTypes.array,
    // 轨迹回放播放状态
    sportPathPlay: PropTypes.bool,
    // 设置轨迹回放播放速度
    sportSpeed: PropTypes.number,
    // 指定轨迹回放点的位置
    sportIndex: PropTypes.array,
    // 需要删除标注物id
    delId: PropTypes.string,
    trackingId: PropTypes.string,
    // 轨迹回放暂停后返回当前点的位置信息
    onAddress: PropTypes.func,
    // 定位成功或失败事件
    onLocationSuccess: PropTypes.func,
    // 设置实时尾迹界面
    realTimeWake: PropTypes.bool,
    // 路径规划距离返回
    onPlanDistance: PropTypes.func,
    // 地图初始化成功事件
    onMapInitFinish: PropTypes.func,
    // 定位到当前位置 -- 实时追踪
    trackCurrentLocation: PropTypes.bool,
    // 定位到目标位置 -- 实时追踪
    trackTargetLocation: PropTypes.bool,
    // 查询位置信息
    searchAddress: PropTypes.array,
    // 实时尾迹
    wakeData: PropTypes.array,
    // 地图放大
    mapAmplification: PropTypes.array,
    mapNarrow: PropTypes.array,
    onPointClickEvent: PropTypes.func,
    monitorFocus: PropTypes.array,
    wakeCurrentLocation: PropTypes.bool,
    wakeTargetLocation: PropTypes.bool,
    aggrNum: PropTypes.number,
    isHome: PropTypes.bool,
    latestLocation: PropTypes.object,
    appStateBackToForeground: PropTypes.bool,
    onLocationStatusDenied: PropTypes.func,
    compassOpenState: PropTypes.bool,
    fitPolyLineSpan: PropTypes.string,
    pageDet: PropTypes.string,
    videoMarker: PropTypes.array,
    trackPolyLineSpan: PropTypes.number,
    baiduMapScalePosition: PropTypes.string,
    monitorFocusTrack: PropTypes.string,
    onMonitorLoseFocus: PropTypes.func,
    onMyScale: PropTypes.func,
    goLatestPoin: PropTypes.array,
    onClustersClickEvent: PropTypes.func,
    // 停止点
    stopPoints: PropTypes.array,
    // 停止点聚焦位置
    stopIndex: PropTypes.number,
    // 停止点位置信息事件
    onStopPointDataEvent: PropTypes.func,
    // 停止点index事件
    onStopPointIndexEvent: PropTypes.func,
    // 用户设置的速度属性
    // speedValues: PropTypes.array,
    minZoomState: PropTypes.number,
    dotData: PropTypes.object,
    trajectoryData: PropTypes.object,
  }

  static defaultProps = {
    trafficEnabled: false,
    bMapType: 1,
    markers: [],
    overlayPoints: [],
    routePlan: [],
    // 开始定位
    locationManager: null,
    onMapClick: null,
    onInAreaOptions: null,
    centerPoint: null,
    sportPath: [],
    sportPathPlay: false,
    sportSpeed: 0.5,
    sportIndex: [],
    delId: null,
    trackingId: null,
    onAddress: null,
    onLocationSuccess: null,
    realTimeWake: false,
    onPlanDistance: null,
    onMapInitFinish: null,
    trackCurrentLocation: null,
    trackTargetLocation: null,
    searchAddress: null,
    wakeData: null,
    mapAmplification: null,
    mapNarrow: null,
    onPointClickEvent: null,
    monitorFocus: null,
    wakeCurrentLocation: null,
    wakeTargetLocation: null,
    aggrNum: null,
    isHome: false,
    latestLocation: null,
    appStateBackToForeground: false,
    onLocationStatusDenied: null,
    compassOpenState: false,
    fitPolyLineSpan: null,
    pageDet: null,
    videoMarker: [],
    trackPolyLineSpan: null,
    baiduMapScalePosition: null,
    monitorFocusTrack: null,
    onMonitorLoseFocus: null,
    onMyScale: null,
    goLatestPoin: null,
    onClustersClickEvent: null,
    stopPoints: null,
    stopIndex: null,
    onStopPointDataEvent: null,
    onStopPointIndexEvent: null,
    minZoomState: null,
    dotData: null,
    trajectoryData: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      pageLayout: false,
      speedValues: [30, 90],
    };
  }

  componentDidMount () {
    getCurAccont().then((curUser) => {
      this.readData(curUser);
    });
    setTimeout(() => {
      this.setState({ pageLayout: true });
    }, 500);
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
          speedValues: ret[curUser].speedSlider, // 速度设置
        });
      }
    }).catch((err) => {
      console.log('storage load err', err);
    });
  }

  render () {
    const {
      isHome,
      onMapInitFinish,
      trafficEnabled,
      bMapType,
      markers,
      overlayPoints,
      routePlan,
      onLocationSuccess,
      locationManager,
      onMapClick,
      onInAreaOptions,
      centerPoint,
      sportPath,
      sportPathPlay,
      sportSpeed,
      sportIndex,
      delId,
      trackingId,
      onAddress,
      realTimeWake,
      onPlanDistance,
      trackCurrentLocation,
      trackTargetLocation,
      wakeData,
      searchAddress,
      mapAmplification,
      mapNarrow,
      onPointClickEvent,
      monitorFocus,
      wakeCurrentLocation,
      wakeTargetLocation,
      aggrNum,
      latestLocation,
      appStateBackToForeground,
      onLocationStatusDenied,
      compassOpenState,
      fitPolyLineSpan,
      pageDet,
      videoMarker,
      trackPolyLineSpan,
      baiduMapScalePosition,
      monitorFocusTrack,
      onMonitorLoseFocus,
      onMyScale,
      goLatestPoin,
      onClustersClickEvent,
      stopPoints,
      stopIndex,
      onStopPointDataEvent,
      onStopPointIndexEvent,
      minZoomState,
      dotData,
      trajectoryData,
    } = this.props;
    const { pageLayout, speedValues } = this.state;
    return !pageLayout ? null : (
      <RNTMap
        style={styles.mapStyle}
        pageDet={pageDet}
        isHome={isHome}
        onMapInitFinish={onMapInitFinish ? data => onMapInitFinish(data.nativeEvent.data) : null}
        trafficEnabled={trafficEnabled}
        bMapType={bMapType}
        locationManager={locationManager}
        markers={markers}
        overlayPoints={overlayPoints}
        routePlan={routePlan}
        onPlanDistance={onPlanDistance ? data => onPlanDistance(data.nativeEvent.data) : null}
        onLocationSuccess={
          onLocationSuccess ? data => onLocationSuccess(data.nativeEvent.data) : null}
        onMapClick={onMapClick ? data => onMapClick(data.nativeEvent.data) : null}
        onInAreaOptions={onInAreaOptions ? data => onInAreaOptions(data.nativeEvent.data) : null}
        centerPoint={centerPoint}
        sportPath={sportPath}
        sportPathPlay={sportPathPlay}
        sportSpeed={sportSpeed}
        sportIndex={sportIndex}
        removeAnnotation={delId}
        pointTracking={trackingId}
        onAddress={onAddress ? data => onAddress(data.nativeEvent.data) : null}
        realTimeWake={realTimeWake}
        trackCurrentLocation={trackCurrentLocation}
        trackTargetLocation={trackTargetLocation}
        wakeCurrentLocation={wakeCurrentLocation}
        wakeTargetLocation={wakeTargetLocation}
        wakeData={wakeData}
        searchAddress={searchAddress}
        mapAmplification={mapAmplification}
        mapNarrow={mapNarrow}
        onPointClickEvent={
          onPointClickEvent ? data => onPointClickEvent(data.nativeEvent.data) : null}
        monitorFocus={monitorFocus}
        aggrNum={aggrNum}
        latestLocation={latestLocation}
        appStateBackToForeground={appStateBackToForeground}
        onLocationStatusDenied={
          onLocationStatusDenied ? data => onLocationStatusDenied(data.nativeEvent.data) : null}
        compassOpenState={compassOpenState}
        fitPolyLineSpan={fitPolyLineSpan}
        videoMarker={videoMarker}
        trackPolyLineSpan={trackPolyLineSpan}
        baiduMapScalePosition={baiduMapScalePosition}
        monitorFocusTrack={monitorFocusTrack}
        onMonitorLoseFocus={
          onMonitorLoseFocus ? data => onMonitorLoseFocus(data.nativeEvent.data) : null}
        onMyScale={onMyScale ? data => onMyScale(data.nativeEvent.data) : null}
        goLatestPoin={goLatestPoin}
        onClustersClickEvent={
          onClustersClickEvent ? data => onClustersClickEvent(data.nativeEvent.data) : null}
        stopPoints={stopPoints}
        stopIndex={stopIndex}
        onStopPointDataEvent={
          onStopPointDataEvent ? data => onStopPointDataEvent(data.nativeEvent) : null}
        onStopPointIndexEvent={
          onStopPointIndexEvent ? data => onStopPointIndexEvent(data.nativeEvent) : null}
        speedPiecewise={speedValues}
        minZoomState={minZoomState}
        dotData={dotData}
        trajectoryData={trajectoryData}
      />
    );
  }
}

const RNTMap = requireNativeComponent('RCTBaiduMap', MapView);

export default MapView;