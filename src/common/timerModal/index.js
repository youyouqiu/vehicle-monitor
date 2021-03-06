import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Platform,
} from 'react-native';

import PropTypes from 'prop-types';
import DatePicker from '../timerPinker';
import { getDateDiffer, getCurrentTime } from '../../utils/function';
import { getLocale } from '../../utils/locales';

import BackIcon from '../../static/image/goBack.png';

const styles = StyleSheet.create({
  containerBg: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 30,
    borderWidth: 1,
    borderColor: '#eee',
    borderTopWidth: 0,
  },
  itemCon: {
    height: 60,
    lineHeight: 60,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    fontSize: 20,
    color: '#333',
  },
  itemTit: {
    height: 43,
    lineHeight: 43,
    fontSize: 16,
    color: '#B6B7B8',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  total: {
    height: 75,
    lineHeight: 75,
    textAlign: 'center',
    backgroundColor: '#F2F2F2',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B6B6B',
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  btn: {
    marginTop: 10,
    borderRadius: 5,
    backgroundColor: '#4287FF',
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  btnTxt: {
    height: 45,
    lineHeight: 45,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
  },
  header: {
    height: Platform.OS !== 'ios' ? 58 : 65,
    backgroundColor: '#339eff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  leftIcon: {
    position: 'absolute',
    left: 5,
    bottom: 15,
    zIndex: 999,
  },
  title: {
    color: 'white',
    fontSize: 20,
  },
  leftIconImage: {
    height: 20,
  },
  disable: {
    backgroundColor: '#BABABA',
    color: '#fff',
  },
  datePinker: {
    width: '1005',
    bottom: 0,
  },
  blue: {
    color: '#4287FF',
  },
});

class Index extends Component {
  // ????????????
  static propTypes = {
    isShwoModal: PropTypes.bool, // ????????????modal
    maxDay: PropTypes.number, // ????????????
    startDate: PropTypes.string, // ????????????
    endDate: PropTypes.string, // ????????????
    dateCallBack: PropTypes.func, // ??????????????????
    hideCallBack: PropTypes.func, // ????????????????????????
    mode: PropTypes.string, // datetime:???????????????date:??????
    title: PropTypes.string, // ????????????
    isEqualStart: PropTypes.bool, // ??????????????????????????????????????????
    maxTime: PropTypes.string, // ??????????????????
    minTime: PropTypes.string, // ??????????????????
  };

  static defaultProps = {
    isShwoModal: false,
    maxDay: 7,
    startDate: '1970-01-01 00:00:00',
    endDate: getCurrentTime(0),
    dateCallBack: null,
    mode: 'datetime',
    title: getLocale('timerPicker1'),
    isEqualStart: false,
    hideCallBack: null,
    minTime: '',
    maxTime: '',
  }

  constructor(props) {
    super(props);
    this.state = {
      isShow: false,
      isShwoModal: false,
      isError: false,
      errorMsg: '',
      tit: '',
      startDate: '',
      endDate: '',
      dateTotal: null,
      selectedValue: '',
      isStart: -1,
    };
  }

  componentDidMount() {
    this.getDateTotal();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { isShwoModal } = nextProps;
    if (isShwoModal) {
      this.setState({
        isShwoModal,
        isError: false,
        msg: '',
      }, () => {
        this.getDateTotal();
      });
    }
  }

  // ???????????????????????????
  getDateTotal = () => {
    const { startDate, endDate } = this.props;
    this.setState({
      startDate,
      endDate,
      dateTotal: getDateDiffer(startDate, endDate),
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // ????????????????????????
  startDate = () => {
    const { startDate } = this.state;
    this.setState({
      tit: getLocale('timerPicker5'),
      isShow: true,
      selectedValue: startDate,
      isInit: true,
      isStart: 1,
    });
  }

  // ????????????????????????
  endDate = () => {
    const { endDate } = this.state;
    this.setState({
      tit: getLocale('timerPicker6'),
      isShow: true,
      selectedValue: endDate,
      isInit: true,
      isStart: 0,
    });
  }

  // ??????????????????
  getDate = (data) => {
    const { tit } = this.state;
    if (tit === getLocale('timerPicker5')) { // ????????????
      this.setState({
        startDate: data,
        isShow: false,
      }, this.validateDate);
    } else { // ????????????
      this.setState({
        endDate: data,
        isShow: false,
      }, this.validateDate);
    }

    this.setState({
      isStart: -1,
    });
  }

  // ????????????
  validateDate = () => {
    const {
      startDate,
      endDate,
    } = this.state;
    const {
      maxDay,
      isEqualStart,
      mode,
      // maxTime,
      // minTime,
    } = this.props;

    const date = getDateDiffer(startDate, endDate);
    const startStamp = new Date(startDate.replace(/-/g, '/')).getTime();
    const endStamp = new Date(endDate.replace(/-/g, '/')).getTime();
    // const maxStamp = new Date(maxTime.replace(/-/g, '/')).getTime();
    // const minStamp = new Date(minTime.replace(/-/g, '/')).getTime();
    const maxDayStamp = maxDay * 24 * 60 * 60 * 1000;// ms
    const duringStamp = Math.abs(endStamp - startStamp);

    let msg = '';
    // ?????????????????????????????????????????????????????????????????????
    const compare = isEqualStart ? endStamp < startStamp : endStamp <= startStamp;
    const compare2 = isEqualStart ? duringStamp >= maxDayStamp : duringStamp > maxDayStamp;
    if (compare) {
      msg = getLocale('timerPicker7');
    } else if (compare2) {
      msg = `${getLocale('timerPicker8')}${maxDay}${getLocale('timerPicker10')}`;
    }


    // if (endStamp > maxStamp || startStamp > maxStamp) {
    //   msg = '??????????????????????????????';
    // } else if (endStamp < minStamp || startStamp < minStamp) {
    //   msg = '??????????????????????????????';
    // }
    if (mode === 'time' && startDate === endDate) {
      msg = '?????????????????????????????????';
    }

    if (msg !== '') {
      this.setState({
        isError: true,
        errorMsg: msg,
      });
    } else {
      this.setState({
        isError: false,
        errorMsg: '',
        dateTotal: date,
      });
    }
  }

  // ????????????
  onRequestClose = () => {
    const { hideCallBack } = this.props;
    this.setState({
      isShow: false,
      isStart: -1,
    }, () => {
      this.setState({
        isShwoModal: false,
      });
    });

    if (hideCallBack) {
      hideCallBack();
    }
  }

  // ??????
  submit = () => {
    const { startDate, endDate } = this.state;
    const { dateCallBack } = this.props;

    if (typeof dateCallBack === 'function') {
      dateCallBack(startDate, endDate);
    }
    this.onRequestClose();
  }

  // ?????????????????????
  timerClose = () => {
    this.setState({
      isShow: false,
      isStart: -1,
    });
  }

  render() {
    const {
      tit,
      isShow,
      startDate,
      endDate,
      dateTotal,
      isError,
      errorMsg,
      isShwoModal,
      selectedValue,
      isStart,
    } = this.state;

    const {
      title,
      mode,
      isEqualStart,
      minTime,
      maxTime,
    } = this.props;

    return (
      <Modal
        animationType="slide"
        visible={isShwoModal}
        onRequestClose={this.onRequestClose}
      >
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={this.onRequestClose}
          >
            <Image
              source={BackIcon}
              resizeMode="contain"
              style={styles.leftIconImage}
            />
          </TouchableOpacity>
        </View>

        {/* container */}
        <View
          style={styles.containerBg}
        >
          <View
            style={styles.container}
          >
            <View style={styles.time}>
              <Text style={styles.itemTit}>{isEqualStart ? getLocale('timerPicker21') : getLocale('timerPicker2')}</Text>
              <Text
                style={[styles.itemCon, isStart === 1 && styles.blue]}
                onPress={this.startDate}
              >
                {startDate}
              </Text>
            </View>
            {isError
              ? (<Text style={[styles.total, { backgroundColor: '#FB8585', color: '#fff' }]}>{errorMsg}</Text>)
              : (
                <View>
                  {mode === 'time'
                    ? <Text style={styles.total}>??????{startDate}???{startDate > endDate ? '?????????' : ''}{endDate}?????????</Text>
                    : (
                      <Text style={styles.total}>
                        {getLocale('timerPicker9')}
                        {(isEqualStart && dateTotal && dateTotal.d >= 0) ? `${dateTotal.d + 1}${getLocale('timerPicker10')}` : ''}
                        {(!isEqualStart && dateTotal && dateTotal.d > 0) ? `${dateTotal.d}${getLocale('timerPicker10')}` : ''}
                        {(dateTotal && dateTotal.h > 0) ? `${dateTotal.h}${getLocale('timerPicker11')}` : ''}
                        {(dateTotal && dateTotal.m > 0) ? `${dateTotal.m}${getLocale('timerPicker12')}` : ''}
                        {(dateTotal && dateTotal.s > 0) ? `${dateTotal.s}${getLocale('timerPicker13')}` : ''}
                      </Text>
                    )
                  }
                </View>
              )
            }

            <View style={styles.time}>
              <Text style={styles.itemTit}>{isEqualStart ? getLocale('timerPicker31') : getLocale('timerPicker3')}</Text>
              <Text
                style={[styles.itemCon, isStart === 0 && styles.blue]}
                onPress={this.endDate}
              >{endDate}
              </Text>
            </View>
          </View>
          {/* btn */}
          <TouchableOpacity
            style={styles.btn}
          >
            <Text
              onPress={!isError ? this.submit : null}
              style={[styles.btnTxt, isError ? styles.disable : null]}
            >{getLocale('timerPicker4')}
            </Text>
          </TouchableOpacity>

          <DatePicker
            isShow={isShow}
            mode={mode}
            pickerTitleText={tit}
            // defaultDate={new Date()}
            minDate={minTime}
            maxDate={maxTime}
            selectedValue={selectedValue}
            onPickerConfirm={this.getDate}
            onPickerCancle={this.timerClose}
          />
        </View>
      </Modal>
    );
  }
}

export default Index;