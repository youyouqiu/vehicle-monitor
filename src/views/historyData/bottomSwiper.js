import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { is } from 'immutable';
import PropTypes from 'prop-types';
// import Loading from '../../common/loading';
import { getLocale } from '../../utils/locales';
import { get2DimensionArray } from '../../utils/function';
import IconMile from '../../static/image/mile.png';
import IconStop from '../../static/image/runAndStop.png';
import IconOilAmount from '../../static/image/oil-amount.png';
import IconOil from '../../static/image/oil.png';
import IconWorkhour from '../../static/image/workhour.png';
import IconReverse from '../../static/image/reverse.png';
import IconHumidity from '../../static/image/humidity.png';
import IconTemperaturey from '../../static/image/temperature.png';
import IconIoData from '../../static/image/ioData.png';
import IconWeight from '../../static/image/weight.png';
import IconTire from '../../static/image/tire.png';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  swiperContainer: {
    height: 85,
    justifyContent: 'space-around',
    // backgroundColor: 'green',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultText: {
    textAlign: 'center',
    color: 'gray',
    alignItems: 'center',
  },
  swiper: {
    alignItems: 'center',
    // backgroundColor: '#fff',
  },
  swiper_item: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: windowWidth,
  },
  item: {
    // width: '25%',
    alignItems: 'center',
    paddingBottom: 0,
    justifyContent: 'center',
  },
  swiper_pagination: {
    bottom: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 16,
    // borderWidth: 1,
    // borderColor: 'green',
    // height: 10,
    paddingBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D4D8',
    marginHorizontal: 5,
  },
  dot_activeDot: {
    backgroundColor: '#A7A9AB',
  },
  swiper_icon: {
    width: 30,
    height: 30,
  },
  swiper_txt: {
    marginTop: 5,
    fontSize: 14,
    color: '#333',
  },
  activeChart: {
    color: '#4287ff',
  },
});

const chartData = {
  mileSpeed: {
    icon: IconMile,
    style: styles.swiper_icon,
    ids: ['0x53'],
  },
  stopData: {
    icon: IconStop,
    style: styles.swiper_icon,
    ids: ['0x00'],
  },
  oilData: {
    icon: IconOilAmount,
    style: styles.swiper_icon,
    ids: ['0x41', '0x42', '0x43', '0x44'],
  },
  oilConsumptionData: {
    icon: IconOil,
    style: styles.swiper_icon,
    ids: ['0x45', '0x46'],
  },
  temperaturey: {
    icon: IconTemperaturey,
    style: styles.swiper_icon,
    ids: ['0x21', '0x22', '0x23', '0x24', '0x25'],
  },
  humidity: {
    icon: IconHumidity,
    style: styles.swiper_icon,
    ids: ['0x26', '0x27', '0x28', '0x29', '0x2A'],
  },
  workHour: {
    icon: IconWorkhour,
    style: styles.swiper_icon,
    ids: ['0x80', '0x81'],
  },
  reverse: {
    icon: IconReverse,
    style: styles.swiper_icon,
    ids: ['0x51'],
  },
  weight: {
    icon: IconWeight,
    style: styles.swiper_icon,
    ids: ['0x70', '0x71'],
  },
  tire: {
    icon: IconTire,
    style: styles.swiper_icon,
    ids: ['0xE3'],
  },
  ioData: {
    icon: IconIoData,
    style: styles.swiper_icon,
    ids: ['0x90', '0x91', '0x92'],
  },
};

class BottomSwiper extends Component {
  static propTypes = {
    attachList: PropTypes.array,
    currentMonitorId: PropTypes.string.isRequired,
    stopIndex: PropTypes.number.isRequired,
    onOpenChart: PropTypes.func,
    onToggleChart: PropTypes.func,
    onCloseChart: PropTypes.func,
    handleIndexChangeType: PropTypes.func,
  }

  static defaultProps = {
    onOpenChart: null,
    onToggleChart: null,
    onCloseChart: null,
    attachList: null,
    handleIndexChangeType: null,
  }

  state={
    chartOpen: false,
    activeChart: null,
    attachIds: null,
    currentDotindex: 0,
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { currentMonitorId: prevId } = this.props;
    const { attachList, currentMonitorId, stopIndex } = nextProps;
    let { chartOpen, activeChart, currentDotindex } = this.state;

    if (attachList !== null) {
      const attachListValues = [...attachList.values()];
      const prependedIds = ['0x53', '0x00'].concat(attachListValues.slice(1));

      const attachKeys = Object.keys(chartData);
      let filteredKeys = [];
      for (let i = 0; i < attachKeys.length; i += 1) {
        const key = attachKeys[i];
        const element = chartData[key];
        const { ids } = element;
        const isExist = ids.find(x => prependedIds.indexOf(x) > -1);
        if (isExist) {
          filteredKeys.push(key);
        }
      }

      filteredKeys = get2DimensionArray(filteredKeys, 4);

      if (prevId !== currentMonitorId || stopIndex > -1) {
        chartOpen = false;
        activeChart = null;
        currentDotindex = 0;
      }
      this.setState({
        attachIds: filteredKeys,
        chartOpen,
        activeChart,
        currentDotindex,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { currentMonitorId: prevId, attachList: prevIds } = this.props;
    const { currentMonitorId, attachList } = nextProps;
    const { currentDotindex: prevIndex, chartOpen: prevOpen, activeChart: prevActive } = this.state;
    const { currentDotindex, chartOpen, activeChart } = nextState;

    const should = prevId !== currentMonitorId || prevIndex !== currentDotindex
    || prevOpen !== chartOpen || prevActive !== activeChart
    || !is(prevIds, attachList);
    return should;
  }


  handleToggleChart=(key) => {
    const { chartOpen, activeChart } = this.state;
    const { onOpenChart, onToggleChart, onCloseChart, handleIndexChangeType } = this.props;
    if (chartOpen === false) {
      this.setState({
        chartOpen: true,
        activeChart: key,
      }, () => {
        if (typeof onOpenChart === 'function') {
          onOpenChart(key);
          // 打开chart后不跳点
          if (typeof handleIndexChangeType === 'function') {
            handleIndexChangeType(false);
          }
        }
      });
    } else if (key === activeChart) {
      this.setState({
        chartOpen: false,
        activeChart: null,
      }, () => {
        if (typeof onCloseChart === 'function') {
          onCloseChart();
          // 关闭chart后跳点
          if (typeof handleIndexChangeType === 'function') {
            handleIndexChangeType(true);
          }
        }
      });
    } else {
      this.setState({
        activeChart: key,
      }, () => {
        if (typeof onToggleChart === 'function') {
          onToggleChart(key);
        }
      });
    }
  }


  handleOnScrollEndDrag=(e) => {
    const offset = e.nativeEvent.contentOffset;
    if (offset) {
      const page = Math.round(offset.x / windowWidth);

      const { currentDotindex } = this.state;
      if (currentDotindex !== page) {
        this.setState({ currentDotindex: page });
      }
    }
  }

  handleRenderItem=(attachIds, activeChart) => {
    const targetView = [];
    for (let index = 0; index < attachIds.length; index += 1) {
      const item = attachIds[index];
      targetView.push((
        <View style={styles.swiper_item}>
          {
          item.map((key) => {
            const element = chartData[key];

            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => { this.handleToggleChart(key); }}
              >
                <View>
                  <Image
                    source={element.icon}
                    style={element.style}
                    resizeMode="contain"
                  />
                </View>

                <Text style={[styles.swiper_txt, activeChart === key ? styles.activeChart : null]}>
                  {getLocale(key)}
                </Text>
              </TouchableOpacity>
            );
          })
        }

        </View>
      ));
    }
    return targetView;
  }

  renderDots=(length, index) => {
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
    const {
      attachIds, currentDotindex, activeChart,
    } = this.state;

    if (attachIds === null) {
      // 注释下面的代码是考虑到用户在切换监控对象时实际上看不到传感器列表，所以这里的过渡动画实际上无意义
      // return (
      //   <View style={[styles.swiperContainer, styles.emptyContainer]}>
      //     <Loading type="inline" color="#3399ff" />
      //   </View>
      // );
      return null;
    }

    return (
      <View style={styles.swiperContainer}>
        <ScrollView
          // key={attachIdsString}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          horizontal
          style={{
            height: 79,
            width: windowWidth,
          }}
          onMomentumScrollEnd={this.handleOnScrollEndDrag}
        >
          {this.handleRenderItem(attachIds, activeChart)}
        </ScrollView>
        {
          attachIds.length > 1 ? (
            <View style={styles.dotsContainer}>
              {
            this.renderDots(attachIds.length, currentDotindex)
          }
            </View>
          ) : null
        }
      </View>
    );
  }
}

export default BottomSwiper;