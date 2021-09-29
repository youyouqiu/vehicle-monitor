/**
 * Created by wanjikun on 2018/9/28.
 */
/* eslint react/sort-comp:off */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { is } from 'immutable';

// import electricityImage from '../../static/image/electricity.png';
import mileageImage from '../../static/image/mileage.png';
import currentSpeed from '../../static/image/currentSpeed.png';
import oilMass from '../../static/image/oilMass.png';
import oilConsume from '../../static/image/oilConsume.png';
import currentTemperature from '../../static/image/currentTemperature.png';
import currentHumidity from '../../static/image/currentHumidity.png';
import currentMotor from '../../static/image/currentMotor.png';
import workHourState from '../../static/image/workHourState.png';
import zaiZ from '../../static/image/zz.png';
import taiY from '../../static/image/ty.png';
import IOSwitch from '../../static/image/IOSwitch.png';
import accPng from '../../static/image/acc.png';


const { width } = Dimensions.get('window'); // 获取屏幕宽度
// const fontSizeScaler = PixelRatio.get() / PixelRatio.getFontScale() / 2.75;


const styles = StyleSheet.create({
  otherView: {
    width,
    minHeight: 80,
  },
  firstInfoView: {
    height: 100,
    backgroundColor: '#ffffff',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eeeeee',
  },
  firstInfoListView: {
    flex: 1,
    justifyContent: 'space-around',
  },
  secondInfoView: {
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 100,
  },
  secondInfoListView: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 80,
  },
  imageView: {
    width: 15,
    marginRight: 5,
    height: 15,
  },
  moduleView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#eeeeee',
    borderBottomWidth: 1,
    paddingVertical: 10,

  },
  moduleTextView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  moduleTextWrap: {
    textAlign: 'center',
    flex: 1,
  },
  moduleTextValue: {
    fontSize: 24,
    fontWeight: '500',
  },
  moduleTextUnit: {
    fontStyle: 'italic',
  },
  describeView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewCont: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 5,
    // width: windowWidth,
  },
});

class SubOtherInfoView extends Component {
  static propTypes = {
    sensors: PropTypes.array,
    detailSensorsHChangeFun: PropTypes.func.isRequired,
    scrollToToporBtm: PropTypes.func.isRequired,
    otherInfoViewH: PropTypes.number.isRequired,
  };

  // 属性默认值
  static defaultProps = {
    sensors: [],
  }


  constructor() {
    super();
    this.state = {
      detailSensorsViewH: 80, // 当日里程等的高度
      detailSensors: [], // 当日里程等数据
      scrollTimeLimit: true,
    };
  }

  componentDidMount () {
    const { detailSensorsHChangeFun } = this.props;
    detailSensorsHChangeFun(80);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { sensors } = nextProps;
    const { sensors: preSensors, detailSensorsHChangeFun } = this.props;
    if (sensors !== preSensors) {
      // const sensorsInfo = this.getDetailInfo(JSON.parse(sensors));
      const sensorsInfo = this.getDetailInfo(sensors);
      const detailSensors = sensorsInfo.length === 4
        ? this.get2DimensionArray(sensorsInfo, 2) : this.get2DimensionArray(sensorsInfo, 3);

      const H = detailSensors.length >= 2 ? 160 : 80;

      // const { detailSensorsHChangeFun } = this.props;
      if (typeof detailSensorsHChangeFun === 'function') {
        detailSensorsHChangeFun(H);
      }
      this.setState({
        detailSensors,
        detailSensorsViewH: H,
      });
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }


  get2DimensionArray (array, radix) {
    const arr = array;

    const arrLen = arr.length;

    const newArr = [];

    while (arr.length) newArr.push(arr.splice(0, radix));

    for (let i = 0; i < newArr.length; i += 1) {
      const value = newArr[i];

      // wjk
      if (arrLen > 2) {
        const diff = radix - newArr[i].length;
        for (let j = 0; j < diff; j += 1) {
          const list = {
            name: false,
            status: null,
            type: null,
            value: null,
          };
          value.push(list);
        }
      }


      newArr.splice(i, 1, value);
    }


    return newArr;
  }

  // 对详细信息进行处理
  getDetailInfo (arr) {
    const newArr = [];

    arr.map((item) => {
      if (item.type === 'oil-consume') {
        return false;
      }
      const typeInfo = this.getTypeInfo(item.type, item);
      const list = {
        name: item.name,
        status: item.status,
        type: item.type,
        text: typeInfo.text,
        image: typeInfo.image,
        value: item.value,
      };
      newArr.push(list);
      if (item.type === 'oil-mass' && (item.dayOilWear === 0 || item.dayOilWear)) {
        const consumeTypeInfo = this.getTypeInfo('oil-consume', item);
        const consumeList = {
          name: item.name,
          status: item.status,
          type: 'oil-consume',
          text: consumeTypeInfo.text,
          image: consumeTypeInfo.image,
          value: `${item.dayOilWear} L`,
        };
        newArr.push(consumeList);
      }
      return true;
    });

    return newArr;
  }

  // 根据type值得到文字类型和图片
  getTypeInfo (type, item) {
    const list = {
      text: null,
      image: null,
    };
    switch (type) {
      case 'mileage':
        list.text = '当日里程';
        list.image = mileageImage;
        break;
      case 'speed':
        list.text = '当前速度';
        list.image = currentSpeed;
        break;
      case 'oil-mass':
        list.text = '当前油量';
        list.image = oilMass;
        break;
      case 'oil-consume':
        list.text = '当日油耗';
        list.image = oilConsume;
        break;
      case 'temperature':
        list.text = '当前温度';
        list.image = currentTemperature;
        break;
      case 'humidity':
        list.text = '当前湿度';
        list.image = currentHumidity;
        break;
      case 'motor':
        // list.text = '正反转状态';
        list.text = item.status;
        list.image = currentMotor;
        break;
      case 'work-hour':
        // list.text = '工时状态';
        list.text = item.status;
        list.image = workHourState;
        break;
      case 'loadInfo':
        // list.text = '载重';
        list.text = item.status;
        list.image = zaiZ;
        break;
      case 'tyreInfo':
        list.text = '胎压';
        list.image = taiY;
        break;
      case 'ioSignal':
        // list.text = '冷柜门';
        list.text = item.value;
        list.image = IOSwitch;
        break;
      case 'acc':
        list.text = 'ACC';
        list.image = accPng;
        break;
      default:
        break;
    }
    return list;
  }

  onScroll = (e) => {
    const offsetY = e.nativeEvent.contentOffset.y; // 滑动距离
    const contentSizeHeight = e.nativeEvent.contentSize.height; // scrollView contentSize高度
    const oriageScrollHeight = e.nativeEvent.layoutMeasurement.height; // scrollView高度
    const { scrollToToporBtm } = this.props;
    const { scrollTimeLimit } = this.state;

    // if (Platform.OS === 'android') {
    //   if (offsetY + oriageScrollHeight + 2 >= contentSizeHeight) { // +2是因为Android他妈的不支持弹性滚动
    //     scrollToToporBtm('btm');
    //   }
    //   if (offsetY <= 0) {
    //     scrollToToporBtm('top');
    //   }
    // } else {
    if (offsetY + oriageScrollHeight + 2 >= contentSizeHeight) {
      // scrollToToporBtm('btm');
      if (scrollTimeLimit) {
        scrollToToporBtm('btm');
        this.setState({
          scrollTimeLimit: false,
        }, () => {
          setTimeout(() => {
            this.setState({
              scrollTimeLimit: true,
            });
          }, 500);
        });
      }
    }
    if (offsetY <= 0) {
      if (scrollTimeLimit) {
        scrollToToporBtm('top');
        this.setState({
          scrollTimeLimit: false,
        }, () => {
          setTimeout(() => {
            this.setState({
              scrollTimeLimit: true,
            });
          }, 500);
        });
      }
    }
    // }
  }


  onScrollEndDrag = (e) => {
    const num = e.nativeEvent.velocity.y;
    const { scrollToToporBtm } = this.props;
    const { scrollTimeLimit } = this.state;
    if (Platform.OS === 'android' && scrollTimeLimit) {
      this.setState({
        scrollTimeLimit: false,
      }, () => {
        if (num < 0) {
          scrollToToporBtm('btm');
        } else {
          scrollToToporBtm('top');
        }

        setTimeout(() => {
          this.setState({
            scrollTimeLimit: true,
          });
        }, 500);
      });
    }
  }

  renderViewCont = (item) => {
    if (item.name !== false) {
      if (item.type === 'ioSignal') {
        return (
          <View style={{
            flex: 1, width: '60%', justifyContent: 'flex-end', flexDirection: 'row',
          }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* <Text style={{
                alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold',
              }}
              >
                { item.text }
              </Text> */}
              <View style={styles.scrollViewCont}>
                <Text
                  // allowFontScaling={false}
                  style={{
                    alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold',
                  }}
                >
                  {item.text}
                </Text>
              </View>
            </ScrollView>
          </View>
        );
      }
      return (
        <View style={styles.moduleTextView}>
          <Text style={styles.moduleTextWrap}>
            <Text style={styles.moduleTextValue}>
              {this.ifIOfunc(item)}
            </Text>
            <Text style={styles.moduleTextUnit}>
              {this.ifIOfunc2(item)}
            </Text>
          </Text>
        </View>
      );
    }
    return null;

    // item.name !== false ? (
    //   <View style={styles.moduleTextView}>
    //     <Text>
    //       <Text style={styles.moduleTextValue}>
    //         {this.ifIOfunc(item)}
    //       </Text>
    //       <Text style={styles.moduleTextUnit}>
    //         {this.ifIOfunc2(item)}
    //       </Text>
    //     </Text>
    //   </View>
    // ) : null
  }

  ifIOfunc = (item) => {
    if (item.type === 'ioSignal') {
      return item.text;
    }
    if (item.value === null) {
      return '--';
    }
    const value = item.value.split(' ')[0];
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(value)) {
      return value;
    }
    if (item.type !== 'temperature' && Number(value) < 0) {
      return '-';
    }
    return Number(value).toFixed(2);
  }

  ifIOfunc2 = (item) => {
    if (item.type === 'ioSignal') {
      return '';
    }
    if (item.value === null) {
      return '';
    }
    return item.value.split(' ')[1];
  }

  makeDetailLocationInfo (data) {
    const subData = {
      deviceNo: '-',
      sim: '-',
      org: '-',
      assigns: '',
    };
    if (JSON.stringify(data) !== '{}') {
      subData.deviceNo = data.deviceNo;
      subData.sim = data.sim;
      subData.org = data.org;
      subData.assigns = data.assigns;
    }
    return subData;
  }


  render () {
    const { detailSensors } = this.state;
    const { otherInfoViewH } = this.props;
    return (
      <View style={styles.otherView}>

        <ScrollView
          onScroll={this.onScroll}
          scrollEventThrottle={20}
          style={{ height: '100%' }}
          onScrollEndDrag={this.onScrollEndDrag}
        >

          <View style={[styles.secondInfoView, { minHeight: otherInfoViewH + 20 }]}>
            {
              detailSensors.length > 0 && detailSensors.map((list, index) => (
                <View
                  style={styles.secondInfoListView}
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                >
                  {
                    list.map((item, index2) => (
                      <View
                        style={[styles.moduleView,
                        item.name === false ? { borderBottomWidth: 0, borderRightWidth: 0 } : null]}
                        // eslint-disable-next-line react/no-array-index-key
                        key={index2}
                      >
                        {this.renderViewCont(item)}
                        <View style={[styles.describeView]}>
                          <Image
                            style={[styles.imageView]}
                            source={item.image}
                            resizeMode="contain"
                          />
                          <View style={{
                            alignItems: 'center', justifyContent: 'center', maxWidth: '50%',
                          }}
                          >
                            {
                              item.type === 'ioSignal' ? (
                                <Text
                                  // allowFontScaling={false}
                                  style={{
                                    alignItems: 'center', justifyContent: 'center',
                                  }}
                                >
                                  开关状态
                                </Text>
                              ) : (
                                <ScrollView horizontal>
                                  <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                  }}
                                  >
                                    <Text
                                      // allowFontScaling={false}
                                      style={{
                                        alignItems: 'center', justifyContent: 'center',
                                      }}
                                    >
                                      {item.text}
                                    </Text>

                                  </View>
                                </ScrollView>
                              )
                            }
                          </View>
                        </View>
                        <Text
                          style={{
                            position: 'absolute', top: 0, right: 5, fontSize: 10,
                          }}
                        >
                          {item.name ? item.name : ''}
                        </Text>
                      </View>
                    ))
                  }
                </View>
              ))
            }
          </View>
        </ScrollView>

      </View>
    );
  }
}

export default SubOtherInfoView;