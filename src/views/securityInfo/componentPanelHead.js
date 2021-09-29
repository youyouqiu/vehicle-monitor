import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import alarmIco from '../../static/image/alarm.png';
import { getLocale } from '../../utils/locales';
import { formateDate } from '../../utils/function';

const dis = 55;// 日期宽度
const styles = StyleSheet.create({
  wraper: {
    flex: 1,
    backgroundColor: 'rgb(244,247,250)',
  },
  container: {
    flex: 1,
    marginLeft: dis,
    marginRight: 15,
  },
  panel_head: {
    height: 45,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
  first: {
    top: 24,
  },
  last: {
    bottom: 24,
  },
  leftLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgb(160,160,160)',
    left: 5,
    top: 0,
    bottom: 0,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 11,
    backgroundColor: 'rgb(170,170,170)',
    marginRight: 5,
  },
  dotRed: {
    backgroundColor: 'rgb(255,131,131)',
  },
  content: {
    flex: 1,
    height: 45,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  alarmIcon: {
    width: 16,
    height: 16,
    marginTop: -3,
    marginRight: 2,
  },
  txt1: {
    width: 80,
    fontSize: 16,
    color: '#333',
  },
  txt2: {
    flex: 1,
    fontSize: 16,
  },
  txt3: {
    fontSize: 14,
  },
});

class PanelHead extends Component {
  static propTypes = {
    curIndex: PropTypes.number.isRequired,
    infoLen: PropTypes.number.isRequired,
    numItem: PropTypes.object.isRequired,
    isActive: PropTypes.bool.isRequired,
    eventFun: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 控制第一个或是最后一个左侧线条的位置
  getStyle=() => {
    const { curIndex, infoLen, isActive } = this.props;
    let style;
    if (curIndex === 0) {
      style = styles.first;
    } if (curIndex === (infoLen - 1) && isActive !== curIndex) {
      style = styles.last;
    }

    return style;
  }

  render() {
    const {
      numItem, isActive, eventFun, curIndex,
    } = this.props;
    return (
      <View style={styles.wraper}>
        <View style={styles.container}>
          <Text style={[styles.leftLine, this.getStyle()]} />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.panel_head}
            onPress={eventFun}
          >
            <View style={[styles.dot, isActive === curIndex ? styles.dotRed : null]} />
            <View style={styles.content}>
              <Text style={styles.txt1}>{formateDate(numItem.get('day'), '-', 2)}</Text>
              <Image
                source={alarmIco}
                resizeMode="contain"
                style={styles.alarmIcon}
              />
              <Text style={styles.txt2}>
                {numItem.get('num')}
                <Text style={styles.txt3}>{getLocale('alarmCountTxt')}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default PanelHead;