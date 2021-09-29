// export default AlarmInfoHeader;
// 到期提醒标题组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Text,
  View,
  Image,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import arrRight from '../../../static/image/expireArrRight.png'; // 箭头
import arrDown from '../../../static/image/expireArrDown.png';
import expire from '../../../static/image/expire.png'; // 左侧图标
import notExpire from '../../../static/image/notExpire.png';
import { getLocale } from '../../../utils/locales';

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 50,
    marginRight: 10,
    backgroundColor: 'rgb(244,247,250)',
  },
  itemBox: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    // color: '#555',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  alarmDate: {
    // marginRight: 15,
    fontSize: 16,
    color: 'rgb(60,60,60)',
  },
  // 时间轴左侧线条
  leftLine: {
    position: 'absolute',
    width: 1,
    left: 30,
    top: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'rgb(160,160,160)',
  },
  // 时间轴左侧小圆
  circle: {
    position: 'absolute',
    width: 23,
    height: 23,
    left: 19,
    top: 12,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 23,
    borderColor: '#b0b0b0',
    borderWidth: 1,
  },
  arrImg: {
    width: 16,
    height: 16,
  },
  expire: {
    width: 15,
    height: 15,
    marginLeft: 3,
    marginTop: 3,
  },
  expireList: {
    width: '70%',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
});

class ExpireInfoHeader extends Component {
  static propTypes = {
    item: PropTypes.object,
    tapFun: PropTypes.func.isRequired,
    isActive: PropTypes.bool.isRequired,
    index: PropTypes.object.isRequired,
  }

  static defaultProps = {
    item: null,
  }

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  tapItem = () => {
    const { tapFun, index, item } = this.props;
    if (typeof tapFun === 'function') {
      tapFun(index.curIndex, item);
    }
  }

  getExpireType = (type) => {
    let expireType = '';
    switch (type) {
      case 'lifecycleExpireNumber':
        expireType = '服务即将到期';
        break;
      case 'alreadyLifecycleExpireNumber':
        expireType = '服务到期';
        break;
      case 'expireMaintenanceList':
        expireType = '保养到期';
        break;
      case 'expireInsuranceIdList':
        expireType = '保险即将到期';
        break;
      case 'expireDrivingLicenseList':
        expireType = '行驶证即将到期';
        break;
      case 'alreadyExpireDrivingLicenseList':
        expireType = '行驶证到期';
        break;
      case 'expireRoadTransportList':
        expireType = '运输证即将到期';
        break;
      case 'alreadyExpireRoadTransportList':
        expireType = '运输证到期';
        break;
      default:
        expireType = '';
        break;
    }
    return expireType;
  }

  render() {
    const { item, isActive, index } = this.props;
    const startStyle = (index.curIndex === 0 ? styles.startLine : null);
    const endStyle = ((index.curIndex === index.allLen && !isActive) ? styles.endLine : null);
    return (
      <View style={styles.wrapper}>
        {
          index.allLen === 0 && !isActive ? null
            : <View style={[styles.leftLine, startStyle, endStyle]} />
        }
        <View style={styles.circle}>
          <Image source={item.key <= 3 ? expire : notExpire} resizeMode="contain" style={styles.expire} />
        </View>
        <View>
          <TouchableOpacity
            style={styles.itemBox}
            activeOpacity={0.6}
            onPress={() => { this.tapItem(); }}
          >
            <View style={styles.expireList}>
              <Text style={styles.alarmDate}>
                {this.getExpireType(item.name)}
              </Text>
              <Text style={styles.alarmNum}>
                <Text style={styles.alarmNumBlod}>
                  {!item.count ? 0 : item.count}
                  {getLocale('personalCount')}
                </Text>
              </Text>
            </View>
            <Image
              source={!isActive ? arrRight : arrDown}
              resizeMode="contain"
              style={styles.arrImg}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default ExpireInfoHeader;