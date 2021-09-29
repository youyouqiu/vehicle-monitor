import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
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
    borderRadius: 5,
    backgroundColor: '#fff',
    zIndex: 10,
  },
});

class Message extends Component {
  static propTypes = {
    msg: PropTypes.object,
    myAddress: PropTypes.string,
    distance: PropTypes.string,
  }

  // 属性默认值
  static defaultProps ={
    msg: null,
    myAddress: null,
    distance: null,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  getMonitorIcon(monitorType) {
    let typeIcon;
    switch (monitorType) {
      case 0:
        typeIcon = wCar;
        break;
      case 1:
        typeIcon = wPerson;
        break;
      case 2:
        typeIcon = wThing;
        break;
      default:
        typeIcon = null;
    }
    return typeIcon;
  }

  render() {
    const {
      msg,
      myAddress,
      distance,
    } = this.props;

    const typeIcon = this.getMonitorIcon(msg.monitorType);

    return (
      <View style={styles.wrapper}>
        <View style={styles.msg}>
          <Text>{msg.updateTime || '--'}</Text>
          <Text>{(msg.runSpeed === null || msg.runSpeed === undefined) ? '--' : msg.runSpeed}km/h</Text>
          <Text>距您{distance || '--'}km</Text>
          {/* <Text>{'2018-08-15' || '--'}</Text>
            <Text>距您:{distance || '--'}km</Text> */}
        </View>
        <View style={styles.container}>
          <Image
            source={typeIcon}
            style={styles.image}
          />
          <View style={styles.content}>
            <View style={styles.distance}>
              <View style={styles.line} />
              <View style={styles.item}>
                <View style={[styles.dot, { top: 10 }]} />
                {/* <Text style={styles.txt}>{'时代时代天街时代天街时代天街时代天街时代天街天街' || '--'}</Text> */}
                {/* <Text style={styles.txt}>{myAddress || '--'}</Text> */}
                <ScrollView horizontal>
                  <View>
                    <Text style={styles.txt}>{myAddress || '--'}</Text>
                  </View>
                </ScrollView>
              </View>

              <View style={styles.item}>
                <View style={[styles.dot, { borderColor: '#fb8c96', bottom: 8 }]} />
                {/* <Text style={styles.txt}>{'时代天街' || '--'}</Text> */}
                {/* <Text style={styles.txt}>{msg.targetAddress || '--'}</Text> */}
                <ScrollView horizontal>
                  <View>
                    <Text style={styles.txt}>{msg.targetAddress || '--'}</Text>
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

export default Message;