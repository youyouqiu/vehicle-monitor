import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

import VideoItem from './videoItem';// 音视频通道窗口

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

// style
const styles = StyleSheet.create({
  swiper: {
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dotsContainer: {
    // flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: 'green',
    // height: 20,
    backgroundColor: 'rgb(244,247,250)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D4D8',
    marginHorizontal: 5,
    marginVertical: 5,
  },
  dot_activeDot: {
    backgroundColor: '#A7A9AB',
  },
  swiperItem: {
    height: '100%',
    padding: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: windowWidth,
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
  hidenVideoItem: {
    position: 'absolute',
    top: -500,
  },
  fullScreenItem: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 2,
    right: 0,
    bottom: 0,
    zIndex: 5000,
  },
});

class SwiperVideo extends Component {
  viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  }

  static propTypes = {
    channels: PropTypes.array.isRequired,
    brand: PropTypes.string.isRequired,
    currentVideoFun: PropTypes.func.isRequired,
    currentChooseVideoNum: PropTypes.number.isRequired,
    onSwiperIndexChange: PropTypes.func.isRequired, // 滑动事件
    refreshVideoFun: PropTypes.func.isRequired, // 刷新视频
    videoStateChangeFun: PropTypes.func.isRequired, // 播放状态改变
    captureCallback: PropTypes.func.isRequired, // 拍照
    screenFlag: PropTypes.bool.isRequired, // 全屏
    fullScreenFun: PropTypes.func.isRequired,
    swiperIndex: PropTypes.number.isRequired,
    playMessage: PropTypes.object,
    // eslint-disable-next-line react/require-default-props
    isStopVideo: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    playMessage: null,
    // eslint-disable-next-line react/default-props-match-prop-types
    isStopVideo: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      choosenVideo: 0, // 当前选中的视频，以通道号标示
      ifCanScroll: true,
      currentDotindex: 0,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { currentChooseVideoNum, swiperIndex } = nextProps;
    this.setState({
      choosenVideo: currentChooseVideoNum,
      currentDotindex: swiperIndex,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  handleListIndexChanged = ({ changed }) => {
    const [{ index, isViewable }] = changed;
    if (!isViewable) {
      return;
    }

    this.setState({
      currentDotindex: index,
    });
    this.swiperIndexChange(index);
  }


  videoChoose = (item) => { // 选择当前视频
    const { choosenVideo } = this.state;

    if (choosenVideo !== item.physicsChannel) {
      const { currentVideoFun } = this.props;
      currentVideoFun(item);

      this.setState({
        choosenVideo: item.physicsChannel,
      });
    }
  }

  //  刷新视频
  refreshVideoFun = (item) => {
    const { refreshVideoFun } = this.props;
    if (typeof refreshVideoFun === 'function') {
      this.videoChoose(item); // 切换到刷新的视频上
      refreshVideoFun(item);
    }
  }

  videoStateChangeFun = (item, state) => {
    const { videoStateChangeFun } = this.props;
    if (typeof videoStateChangeFun === 'function') {
      videoStateChangeFun(item, state);
    }
  }

  swiperIndexChange = (index) => {
    const { onSwiperIndexChange } = this.props;
    if (typeof onSwiperIndexChange === 'function') {
      onSwiperIndexChange(index);
    }
  }

  // 拍照
  captureCallback = (item, success) => {
    const { captureCallback } = this.props;
    captureCallback(item, success);
  }

  fullScreenFun = (bool) => {
    // const canScroll = !bool;
    const { fullScreenFun } = this.props;
    fullScreenFun(bool);
    this.setState({
      ifCanScroll: !bool,
    });
  }

  handleOnScrollEndDrag = (e) => {
    const offset = e.nativeEvent.contentOffset;
    if (offset) {
      const page = Math.round(offset.x / windowWidth);

      const { currentDotindex } = this.state;
      if (currentDotindex !== page) {
        this.setState({ currentDotindex: page });
        this.swiperIndexChange(page);
      }
    }
  }

  // 视频通道视图组装
  renderSwiper = (data) => {
    // const itemArr = this.moniData();
    // const len = Math.ceil(itemArr.count / 4);// 轮播屏数
    // const targetView = []

    // const len = Math.ceil(channels.length / 4);// 轮播屏数
    const targetView = [];
    const {
      // eslint-disable-next-line react/prop-types
      channels, brand, screenFlag, playMessage, isStopVideo,
    } = this.props;
    for (let i = 0; i < data.length; i += 1) {
      const index = data[i];

      if (index < 0) {
        targetView.push((
          <View style={styles.swiperItem} key={index}>
            {
              [0, 1, 2, 3].map(keyIndex => (
                <View key={keyIndex} style={styles.videoItem}>
                  <VideoItem />
                </View>
              ))
            }
          </View>
        ));
      } else {
        const { choosenVideo } = this.state;
        targetView.push((
          <View style={styles.swiperItem} key={index}>
            {
              [0, 1, 2, 3].map((x) => {
                let style;
                const channel = channels[4 * index + x];
                if (screenFlag) {
                  if (channel && channel.physicsChannel === choosenVideo) {
                    style = styles.fullScreenItem;
                  } else {
                    style = styles.hidenVideoItem;
                  }
                } else {
                  style = styles.videoItem;
                }
                return (
                  <View
                    style={[style, channel && channel.physicsChannel === choosenVideo ? { borderColor: '#26A2FF' } : null,
                    ]}
                    key={x}
                  >
                    <VideoItem
                      item={channel}
                      brand={brand}
                      choosenVideo={choosenVideo}
                      videoChoose={this.videoChoose}
                      refreshVideoFun={this.refreshVideoFun}
                      videoStateChangeFun={this.videoStateChangeFun}
                      fullScreenFun={this.fullScreenFun}
                      captureCallback={this.captureCallback}
                      screenFlag={screenFlag}
                      playMessage={playMessage}
                      isStopVideo={isStopVideo}
                    />
                  </View>
                );
              })
            }
          </View>
        ));
      }
    }

    return targetView;
  }

  renderDots = (length, index) => {
    if (length === 1) {
      return null;
    }

    const dots = [];
    for (let i = 0; i < length; i += 1) {
      dots.push(<View style={[styles.dot, i === index ? styles.dot_activeDot : null]} />);
    }
    return dots;
  }

  render() {
    const { ifCanScroll } = this.state;
    const { channels, brand } = this.props;
    const sectionSize = Math.ceil(channels.length / 4);
    const indexArray = [];
    if (sectionSize === 0) {
      indexArray.push(-1); // 负一是在页面为空的时候强行添加4个空视频
    } else {
      for (let i = 0; i < sectionSize; i += 1) {
        indexArray.push(i);
      }
    }
    // return null;
    return (
      // <Swiper
      //   style={styles.swiper}
      //   paginationStyle={styles.swiper_pagination}
      //   activeDotStyle={styles.swiper_activeDot}
      //   dotStyle={styles.swiper_dot}
      //   index={0}
      //   onIndexChanged={this.swiperIndexChange}
      //   scrollEnabled={ifCanScroll}
      //   loop={false}
      // >
      //   {this.renderSwiper()}
      // </Swiper>
      <View style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        // borderColor: 'red',
        // borderWidth: 1,

      }}
      >
        <ScrollView
          bounces={false}
          key={brand}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          horizontal
          style={{
            // flex: 1,
            // borderColor: 'green',
            // borderWidth: 1,
            width: windowWidth,
          }}
          scrollEnabled={ifCanScroll}
          onMomentumScrollEnd={this.handleOnScrollEndDrag}
        >
          {this.renderSwiper(indexArray)}
        </ScrollView>
        {/* <View style={styles.dotsContainer}>
          {
            this.renderDots(indexArray.length, currentDotindex)
          }
        </View> */}
      </View>
    );
  }
}

export default SwiperVideo;