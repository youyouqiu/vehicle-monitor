import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Switch,
  Platform,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
// import DatePicker from 'react-native-datepicker';
import TimeModal from '../../../common/timerModal';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度


const styles = StyleSheet.create({
  textColor: {
    color: '#333',
    fontSize: 16,
  },
  timeText: {
    color: '#4287ff',
    fontSize: 16,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth,
    backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // fontWeight: 'bold',
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  leftCont: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeStr: {
    marginLeft: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iosSwitch: {
    position: 'relative',
    top: Platform.OS === 'android' ? 0 : -5,
  },
});
class MsgRemindSwitch extends Component {
  static propTypes = {
    style: PropTypes.shape(styles.container), // 样式
    title: PropTypes.string.isRequired,
    switchChange: PropTypes.func.isRequired,
    value: PropTypes.bool.isRequired,
    msgRemindStart: PropTypes.string, // 开始时间
    msgRemindEnd: PropTypes.string, // 结束时间
    startDateChange: PropTypes.func.isRequired, // 开始时间改变
    endDateChange: PropTypes.func.isRequired, // 结束时间改变
  }

  static defaultProps = {
    style: null,
    msgRemindStart: '00:00',
    msgRemindEnd: '00:00',
  }

  constructor(props) {
    super(props);
    this.state = {
      isShwoModal: false,
    };
  }

  switchChange = (val) => {
    const { switchChange } = this.props;
    switchChange(val);
  }

  startDateChange = (val) => { // 开始时间改变
    const { startDateChange } = this.props;
    startDateChange(val);
  }

  endDateChange = (val) => { // 结束时间改变
    const { endDateChange } = this.props;
    endDateChange(val);
  }

  handleCustomDateChange = (start, end) => {
    this.startDateChange(start);
    this.endDateChange(end);
  }

  handleCustom = (status) => {
    this.setState({
      isShwoModal: status,
    });
  }

  render() {
    const {
      style, title, value, msgRemindStart, msgRemindEnd,
    } = this.props;
    const { isShwoModal } = this.state;

    return (
      <View style={[styles.container, style]}>
        <View style={styles.leftCont}>
          <Text style={styles.textColor}>
            {title}
          </Text>
          <View style={styles.timeStr}>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => this.handleCustom(true)}
              >
                <Text style={styles.timeText}>
                  {msgRemindStart} ~ {msgRemindEnd}
                </Text>
              </TouchableOpacity>
              <TimeModal
                isShwoModal={isShwoModal}
                hideCallBack={() => this.handleCustom(false)}
                startDate={msgRemindStart}
                endDate={msgRemindEnd}
                dateCallBack={this.handleCustomDateChange}
                mode="time"
                title="选择时间"
              />
            </View>
          </View>
        </View>
        <View style={[{ height: 10 }, styles.iosSwitch]}>
          <Switch
            value={value}
            trackColor={{ false: 'rgb(208,208,208)', true: '#3399ff' }}
            thumbColor="#fff"
            // onTintColor="#3399ff"
            // thumbTintColor={Platform.OS === 'android' ? '#fff' : ''}
            onValueChange={this.switchChange}
          />
        </View>
      </View>
    );
  }
}

export default MsgRemindSwitch;
