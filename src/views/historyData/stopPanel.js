import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as timeFormat from 'd3-time-format';
import PropTypes from 'prop-types';
import { getChineseFromSecond } from '../../utils/function';
import PrevIcon from '../../static/image/prevItem.png';
import NextIcon from '../../static/image/nextItem.png';
import PrevIconDisable from '../../static/image/prevItemDisable.png';
import NextIconDisable from '../../static/image/nextItemDisable.png';
import CloseIcon from '../../static/image/closeGray.png';

const timeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M:%S');

// style
const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#333333',
    // borderWidth: 1,
    // borderColor: 'red',
    // borderStyle: 'solid',
  },
  row: {
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  title: {
    width: 80,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // alignItems: 'center',
  },
  buttonWraper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 120,
    backgroundColor: '#4287ff',
    height: 30,
    textAlign: 'center',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  disabledBtn: {
    backgroundColor: '#dcdcdc',
  },
  buttonText: {
    color: 'white',
  },
  disabledText: {
    color: '#cccccc',
  },
  prevNextIcon: {
    width: 16,
    height: 16,
  },
  closeIconContainer: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
});


export default class StopPanel extends Component {
  static propTypes = {
    stopIndex: PropTypes.number.isRequired,
    stopPoints: PropTypes.array.isRequired,
    startTime: PropTypes.object.isRequired,
    endTime: PropTypes.object.isRequired,
    timeLength: PropTypes.number.isRequired,
    stopLocation: PropTypes.string.isRequired,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  }

  // shouldComponentUpdate(nextProps) {
  //   const { title, startTime, endTime } = this.props;
  //   if (title !== nextProps.title
  //     || startTime !== nextProps.startTime
  //     || endTime !== nextProps.endTime) {
  //     return true;
  //   }
  //   return false;
  // }

  handlePrev=() => {
    const { onPrev } = this.props;
    onPrev();
  }

  handleNext=() => {
    const { onNext } = this.props;
    onNext();
  }

  handleCancel=() => {
    const { onCancel } = this.props;
    onCancel();
  }

  render() {
    const {
      stopIndex,
      stopPoints,
      startTime,
      endTime,
      timeLength,
      stopLocation,
    } = this.props;

    if (stopIndex === -1) {
      return null;
    }

    const disabled = stopPoints && stopPoints.length === 1;

    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={[styles.text, styles.title]}>停  止  点：</Text>
          <Text style={[styles.text, styles.content]}>{(stopIndex + 1)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.text, styles.title]}>开始时间：</Text>
          <Text style={[styles.text, styles.content]}>{timeFormator(startTime)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.text, styles.title]}>停止时长：</Text>
          <Text style={[styles.text, styles.content]}>{getChineseFromSecond(timeLength)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.text, styles.title]}>结束时间：</Text>
          <Text style={[styles.text, styles.content]}>{timeFormator(endTime)}</Text>
        </View>
        <View style={[styles.row]}>
          <Text style={[styles.text, styles.title]}>停止位置：</Text>
          <Text style={[styles.text, styles.content, { height: 40 }]}>{stopLocation}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWraper}>
            <TouchableOpacity
              style={[styles.button, disabled ? styles.disabledBtn : null]}
              onPress={this.handlePrev}
              disabled={disabled}
            >
              <Image style={styles.prevNextIcon} source={disabled ? PrevIconDisable : PrevIcon} resizeMode="contain" />
              <Text style={[styles.buttonText, disabled ? styles.disabledText : null]}>上一个</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonWraper}>
            <TouchableOpacity
              style={[styles.button, disabled ? styles.disabledBtn : null]}
              onPress={this.handleNext}
              disabled={disabled}
            >
              <Text style={[styles.buttonText, disabled ? styles.disabledText : null]}>下一个</Text>
              <Image style={styles.prevNextIcon} source={disabled ? NextIconDisable : NextIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.closeIconContainer} onPress={this.handleCancel}>
          <Image style={styles.closeIcon} source={CloseIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    );
  }
}