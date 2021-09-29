import React, { Component } from 'react';
import { is } from 'immutable';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  // TouchableOpacity,
} from 'react-native';

import PropTypes from 'prop-types';
import DatePicker from 'rmc-date-picker';
import * as timeFormat from 'd3-time-format';
import { getCurrentTime } from '../../utils/function';
// import zh_CN from 'rmc-date-picker/lib/locale/zh_CN';

const dateFormator = timeFormat.timeFormat('%Y-%m-%d');
const timeFormator = timeFormat.timeFormat('%H:%M');
const fullTimeFormator = timeFormat.timeFormat('%Y-%m-%d %H:%M');

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    justifyContent: 'space-between',
    height: 50,
    lineHeight: 50,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#F2F2F2',
  },
  unit: {
    height: 30,
    lineHeight: 30,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
});
class Index extends Component {
  // 属性声明
  static propTypes = {
    isShow: PropTypes.bool,
    pickerTitleText: PropTypes.string,
    selectedValue: PropTypes.array.isRequired,
    onPickerConfirm: PropTypes.func,
    onPickerCancle: PropTypes.func,
    mode: PropTypes.string, // datetime:日期时间，date:日期,time:时间
    maxDate: PropTypes.string, // 最大选择时间
    minDate: PropTypes.string, // 最小选择时间
  };

  static defaultProps = {
    isShow: false,
    pickerTitleText: '选择时间',
    onPickerConfirm: null,
    mode: 'datetime',
    onPickerCancle: () => { },
    minDate: '',
    maxDate: '',
  }

  constructor(props) {
    super(props);

    this.state = {
      selectedValue: '',
    };
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { selectedValue } = nextProps;

    this.setState({
      selectedValue,
    });
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 日期改变
  onChange = (value) => {
    const { mode } = this.props;
    let date = '';
    switch (mode) {
      case 'datetime':
        date = `${fullTimeFormator(value)}:00`;
        break;
      case 'date':
        date = dateFormator(value);
        break;
      case 'time':
        date = `${timeFormator(value)}`;
        break;
      default:
        break;
    }

    this.setState({
      selectedValue: date,
    });
  }

  updateDate = () => {
    const { selectedValue } = this.state;
    const { onPickerConfirm } = this.props;

    if (onPickerConfirm) {
      onPickerConfirm(selectedValue);
    }
  }


  render () {
    const {
      isShow,
      mode,
      selectedValue,
      maxDate,
      minDate,
      onPickerCancle,
      pickerTitleText,
    } = this.props;

    const min = minDate !== '' ? minDate : '1970-01-01 00:00:00';
    const max = maxDate !== '' ? maxDate : getCurrentTime(0);
    const timeDate = `${dateFormator(new Date())} ${selectedValue}:00`;

    return (
      <Modal
        animationType="slide"
        transparent
        visible={isShow}
        onRequestClose={() => onPickerCancle()}
      >
        <View
          activeOpacity={1}
          style={styles.container}
        // onPress={() => onPickerCancle()}
        >
          <View
            style={styles.content}
          >
            <View style={[styles.row, styles.title]}>
              <Text
                style={{ color: '#4287FF', fontSize: 16 }}
                onPress={() => onPickerCancle()}
              >取消
              </Text>
              <Text style={{ fontSize: 18 }}>{pickerTitleText}</Text>
              <Text
                style={{ color: '#4287FF', fontSize: 16 }}
                onPress={this.updateDate}
              >确定
              </Text>
            </View>
            <View />

            {
              mode === 'datetime' && (// 年月日时分
                <View
                  style={[styles.row, styles.unit]}
                >
                  <Text style={styles.cell}>年</Text>
                  <Text style={styles.cell}>月</Text>
                  <Text style={styles.cell}>日</Text>
                  <Text style={styles.cell}>时</Text>
                  <Text style={styles.cell}>分</Text>
                </View>
              )
            }
            {
              mode === 'date' && (// 年月日
                <View
                  style={[styles.row, styles.unit]}
                >
                  <Text style={styles.cell}>年</Text>
                  <Text style={styles.cell}>月</Text>
                  <Text style={styles.cell}>日</Text>
                </View>
              )
            }
            {
              mode === 'time' && (// 时分
                <View
                  style={[styles.row, styles.unit]}
                >
                  <Text style={styles.cell}>时</Text>
                  <Text style={styles.cell}>分</Text>
                </View>
              )
            }

            <DatePicker
              visible
              mode={mode}
              defaultDate={new Date((mode !== 'time' ? selectedValue : timeDate).replace(/-/g, '/'))}
              minDate={mode !== 'time' ? new Date(min.replace(/-/g, '/')) : null}
              maxDate={mode !== 'time' ? new Date(max.replace(/-/g, '/')) : null}
              // locale={zh_CN}
              style={{ fontSize: 10, color: 'red' }}
              onDateChange={this.onChange}
            />
          </View>
        </View>
      </Modal>
    );
  }
}

export default Index;