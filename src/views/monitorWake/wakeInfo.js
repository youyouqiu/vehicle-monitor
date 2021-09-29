import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
} from 'react-native';

// import { getLocale } from '../../utils/locales';
import wCar from '../../static/image/wCar.png';// 车
import wPerson from '../../static/image/wPerson.png';// 人
import wThing from '../../static/image/wThing.png';// 物

// style
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 22,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingVertical: 10,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    width: 25,
    height: 25,
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  msg: {
    flex: 1,
    // marginLeft: -42,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distance: {
    position: 'relative',
    marginTop: 5,
  },
  line: {
    position: 'absolute',
    width: 4,
    left: 0,
    top: 14,
    bottom: 14,
    borderRightWidth: 1,
    // borderStyle: 'dashed',
    borderRightColor: '#33BBFF',
    borderRadius: 0.2,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    paddingLeft: 15,
    // alignItems: 'center',
  },
  txt: {
    flex: 1,
    lineHeight: 20,
    minHeight: 20,
    marginVertical: 2,
  },
  dot: {
    position: 'absolute',
    left: 0,
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: '#33BBFF',
    backgroundColor: '#33BBFF',
    borderRadius: 5,
    // backgroundColor: '#fff',
    zIndex: 10,
  },
});

class WakeInfo extends Component {
  static propTypes = {
    curState: PropTypes.number,
    // time: PropTypes.string,
    updateTime: PropTypes.string,
    curAddr: PropTypes.string,
    runDistance: PropTypes.any,
    runSpeed: PropTypes.any,
    // beginEndTime: PropTypes.string,
    beginEndAddr: PropTypes.string,
  }

  // 属性默认值
  static defaultProps ={
    curState: 0,
    // time: null,
    updateTime: null,
    curAddr: null,
    runDistance: null,
    runSpeed: null,
    // beginEndTime: null,
    beginEndAddr: null,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

    // 转换监控对象类型
    getAlarmType=(type) => {
      let alarmType = '';
      switch (type) {
        case 0:
          alarmType = wCar;
          break;
        case 1:
          alarmType = wPerson;
          break;
        case 2:
          alarmType = wThing;
          break;
        default:
          alarmType = wCar;
          break;
      }
      return alarmType;
    }

    render() {
      const {
        curState,
        // time,
        updateTime,
        curAddr,
        runDistance,
        runSpeed,
        // beginEndTime,
        beginEndAddr,
      } = this.props;

      return (
        <View style={styles.wrapper}>
          <View style={styles.msg}>
            <Text>{updateTime || '--'}</Text>
            <Text>{(runSpeed === null || runSpeed === undefined) ? '--' : runSpeed}km/h</Text>
            <Text>{runDistance || '0'}km</Text>
          </View>
          <View style={styles.container}>
            <Image
              source={this.getAlarmType(curState)}
              style={styles.image}
            />
            <View style={styles.content}>

              <View style={styles.distance}>
                <View style={styles.line} />
                <View style={styles.item}>
                  <View style={[styles.dot, { backgroundColor: '#fb8c96', borderColor: '#fb8c96', bottom: 8 }]} />
                  <ScrollView horizontal>
                    <View>
                      <Text
                        style={styles.txt}
                      >
                        {beginEndAddr || '--'}
                      </Text>

                    </View>
                  </ScrollView>
                </View>
                <View style={styles.item}>
                  <View style={[styles.dot, { top: 10 }]} />
                  <ScrollView horizontal>
                    <View>
                      <Text
                        style={styles.txt}
                      >
                        {curAddr || '--'}
                      </Text>

                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }
}

export default WakeInfo;