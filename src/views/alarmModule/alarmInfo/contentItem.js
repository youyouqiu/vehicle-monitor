// 报警信息时间轴内容组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as timeFormat from 'd3-time-format';// 时间格式转换

import { go, isAlreadyExist } from '../../../utils/routeCondition';
import { getLocale } from '../../../utils/locales';
import histroy from '../../../static/image/histroy.png';
import timeIco from '../../../static/image/time.png';
import weiIco from '../../../static/image/wei.png';
import valueIco from '../../../static/image/value.png';
import { toastShow } from '../../../utils/toastUtils';// 导入toast

const shortFormator = timeFormat.timeFormat('%H:%M:%S');
const shortDayFormator = timeFormat.timeFormat('%m-%d %H:%M:%S');
const getDay = timeFormat.timeFormat('%d');

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 50,
    paddingRight: 10,
  },
  // 时间轴左侧小圆
  circle: {
    position: 'absolute',
    width: 7,
    height: 7,
    left: 27,
    // left:-23,
    top: 30,
    zIndex: 1,
    borderRadius: 11,
    backgroundColor: 'rgb(255,131,131)',
  },
  // 时间轴左侧线条
  leftLine: {
    position: 'absolute',
    width: 1,
    left: 30,
    top: 0,
    bottom: 0,
    // height: '100%',
    backgroundColor: 'rgb(160,160,160)',
  },
  itemStyle: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  statusBox: {
    position: 'absolute',
    // width: 40,
    height: 20,
    top: 10,
    right: 20,
    zIndex: 1,
  },
  statusYes: {
    fontSize: 12,
    textAlign: 'right',
    color: 'rgb(193,193,193)',
  },
  statusNo: {
    fontSize: 12,
    textAlign: 'right',
    color: 'rgb(255,131,131)',
  },
  itemHeader: {
    color: 'rgb(51,51,51)',
    fontSize: 16,
  },
  textBox: {
    flex: 1,
    marginLeft: 5,
    fontSize: 14,
    color: 'rgb(86,86,86)',
  },
  rowBox: {
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  useIcon: {
    width: 16,
    height: 16,
  },
  valueBox: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  histroyBox: {
    // flex: 1,
    // width: 100,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  histroyInfo: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderStyle: 'solid',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  histroyIcon: {
    width: 12,
    height: 12,
    marginTop: 1,
    marginRight: 5,
  },
});

class ContentItem extends Component {
  static propTypes = {
    // item: PropTypes.arrayOf(PropTypes.shape({
    //   name: PropTypes.string,
    //   alarmStarTime: PropTypes.string,
    //   alarmEndTime: PropTypes.string,
    //   address: PropTypes.string,
    //   alarmValue: PropTypes.string,
    // })).isRequired,
    item: PropTypes.any.isRequired,
    queryHistoryPeriod: PropTypes.number.isRequired,
    curAlarmObj: PropTypes.object.isRequired,
    addMonitor: PropTypes.func.isRequired,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  /**
   * 跳转至历史数据界面
   * 1、瞬时报警,取报警时间前后十分钟，如果当前时间 - 报警时间 < 10分钟，则设置成当前时间之前20分钟；
   * 2、持续报警跳转到历史数据的时间范围变为：开始时间前10分钟 至 结束时间后10分钟。如果结束时间后10分钟超出了当前时间，则当前时间作为结束时间；
   * 3、如果持续报警是疲劳驾驶，则跳转到历史数据时间范围为：报警开始时间前4个小时至结束时间；
   */
  goHistroy = () => {
    const {
      curAlarmObj, addMonitor, queryHistoryPeriod, item: { type, alarmStarTime, alarmEndTime },
    } = this.props;
    // const { speedValues } = this.state;
    const num = 1000 * 60 * 10;
    let sTime;
    let eTime = alarmEndTime;
    const nowTime = (new Date()).getTime();
    const alarmArr = ['1', '2', '79', '67', '6511', '6512', '6511', '6521', '6522', '6523',
      '6531', '6532', '6533', '6541', '6542', '6543', '6551', '6552', '6553', '6611',
      '6612', '6613', '6621', '6622', '6623', '6631', '6632', '6633', '6642', '6642',
      '6643', '6651', '6652', '6654', '6811', '6812', '6813', '6821', '6822', '6823',
      '6831', '6832', '6834', '6841', '6842', '6843', '18177', '18178', '18180',
      '18433', '18434', '18435', '18689', '18691', '18691', '18945', '18946', '18947',
      '19201', '19202', '19203', '19457', '19458', '19459', '19713', '19714', '19715',
      '19969', '19970', '19971', '12411', '124', '7012', '7021', '14000', '14001',
      '14002', '14003', '14004', '14100', '14101', '14102', '14103', '14104', '14105',
      '14106', '14107', '14108', '14109', '14110', '14112', '14112', '14113', '14114',
      '14115', '14116', '14117', '14118', '14119', '14120', '14122', '14122', '14123',
      '14124', '14125', '14126', '14127', '14128', '14129', '14130', '14131', '141000',
      '14200', '14201', '14202', '14203', '14204', '14205', '14206', '14207', '14208',
      '14209', '14210', '14211', '14212', '14213', '14214', '14215', '14217', '14217',
      '14218', '14219', '14220', '14221', '14222', '14223', '14224', '14225', '14226',
      '14227', '14228', '14229', '14230', '14231', '142000', '14311', '14511', '14521', '14411',
      '12511', '12512', '12513', '12514', '12515', '12516', '12517', '12518',
      '12519', '12520', '12521', '12521', '12523', '12524', '12525', '12526', '12527', '12528', '12529',
      '12530', '12531', '12532', '12533', '12534', '12535', '12536', '12537', '12538', '12539',
      '12539', '12541', '12542', '12611', '12612', '12613', '12614', '12615', '12616', '12616',
      '12618', '12619', '12620', '12621', '12622', '12623', '12624',
      '12625', '12626', '12627', '12628', '12629', '12630', '12631', '12632', '12633', '12634',
      '12635', '12636', '12637', '12638', '12639', '12639', '12641', '12642', '12711', '12712', '12713',
      '12714', '12715', '12716', '12717', '12718', '12719',
      '12720', '12721', '12722', '12723', '12724', '12725', '12726', '13011', '13012', '13013', '13211', '13212', '13213', '13214'];

    if (alarmArr.indexOf(type.toString()) !== -1) { // 持续报警
      if (type === 2 || type === 79) { // 疲劳驾驶
        sTime = alarmStarTime - 1000 * 60 * 60 * 4;// 报警开始时间前4小时
      } else {
        sTime = alarmStarTime - num;
        eTime += num;
        if (eTime > nowTime) {
          eTime = nowTime;
        }
      }
      const dayTime = 1000 * 60 * 60 * 24;
      if (eTime - sTime > queryHistoryPeriod * dayTime) {
        toastShow(`该报警持续时间超过了${queryHistoryPeriod}天 建议平台查询`, { duration: 2000 });
        return;
      }
    } else { // 瞬时报警
      // eslint-disable-next-line no-lonely-if
      if (nowTime - eTime < num) {
        sTime = nowTime - 2 * num;
        eTime = nowTime;
      } else {
        sTime = eTime - num;
        eTime += num;
      }
    }

    const { id, name } = curAlarmObj;
    const isExist = isAlreadyExist(id);
    if (isExist) {
      go('historyData', {
        activeMonitor: {
          markerId: id,
          title: name,
        },
        startTime: new Date(sTime),
        endTime: new Date(eTime),
        // speedValues, // 用户设置的默认速度属性
      });
      return;
    }
    addMonitor(id, () => {
      setTimeout(() => {
        go('historyData', {
          activeMonitor: {
            markerId: id,
            title: name,
          },
          startTime: new Date(sTime),
          endTime: new Date(eTime),
          // speedValues, // 用户设置的默认速度属性
        });
      }, 800);
    });
  }

  render() {
    const { item } = this.props;

    let startTime = shortFormator(item.alarmStarTime);
    let endTime = shortFormator(item.alarmEndTime);
    if (getDay(item.alarmStarTime) !== getDay(item.alarmEndTime)) { // 报警时间跨天,则需显示月日
      startTime = shortDayFormator(item.alarmStarTime);
      endTime = shortDayFormator(item.alarmEndTime);
    }

    return (
      <View style={styles.wrapper}>
        <View style={styles.circle} />
        <View style={styles.leftLine} />
        <View style={styles.statusBox}>
          {
            item.status === 0
              ? <Text style={styles.statusNo}>{getLocale('noDealWith')}</Text>
              : <Text style={styles.statusYes}>{getLocale('alreadyDealWith')}</Text>
          }
        </View>
        <View style={styles.itemStyle}>
          <Text numberOfLines={2} style={styles.itemHeader}>
            {item.name}
          </Text>
          <View style={styles.rowBox}>
            <Image
              source={timeIco}
              resizeMode="contain"
              style={styles.useIcon}
            />
            {item.alarmStarTime === item.alarmEndTime
              ? (
                <Text numberOfLines={2} style={styles.textBox}>
                  {shortFormator(item.alarmStarTime)}
                </Text>
              ) : (
                <Text numberOfLines={2} style={styles.textBox}>
                  {startTime}
                  ~
                  {endTime}
                </Text>
              )
            }
          </View>
          <View style={styles.rowBox}>
            <Image
              source={weiIco}
              resizeMode="contain"
              style={styles.useIcon}
            />
            {/* <Text numberOfLines={1} style={styles.textBox}>
              {item.address}
            </Text> */}
            <ScrollView horizontal>
              <View>
                <Text style={styles.textBox}>
                  {item.address}
                </Text>
              </View>
            </ScrollView>
          </View>
          <View style={[styles.rowBox, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              {(item.alarmValue !== '' && item.alarmValue !== null)
                ? (
                  <View style={styles.valueBox}>
                    <Image
                      source={valueIco}
                      resizeMode="contain"
                      style={styles.useIcon}
                    />
                    <Text numberOfLines={1} style={styles.textBox}>
                      {item.alarmValue ? item.alarmValue : ''}
                    </Text>
                  </View>
                ) : null
              }
            </View>
            <View style={styles.histroyBox}>
              <TouchableOpacity
                style={styles.histroyInfo}
                onPress={() => this.goHistroy()}
              >
                <Image
                  source={histroy}
                  resizeMode="contain"
                  style={styles.histroyIcon}
                />
                <Text style={{ fontSize: 12 }}>
                  {getLocale('historyTitle')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default ContentItem;