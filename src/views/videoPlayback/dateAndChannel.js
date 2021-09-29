import React, { Component } from 'react';
import { List } from 'immutable';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text, Platform,
} from 'react-native';
import * as timeFormat from 'd3-time-format';
import PropTypes from 'prop-types';
import { Picker } from '@react-native-picker/picker';
// import Picker from 'react-native-wheel-picker';
import { isEmpty, deepEqual } from '../../utils/function';
import { getLocale } from '../../utils/locales';

const PickerItem = Picker.Item;

const styles = StyleSheet.create({
  container: {
    height: 190,
  },
  videoProgress: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  timeContainer: {
    paddingTop: 3,
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'white',
    paddingRight: 4,
  },
  dateContainer: {
    flex: 1,
  },
  customContainer: {
    // flex: 1,
    width: 80,
    padding: 2,
  },
  swiper: {
    backgroundColor: '#fff',
  },
  dateItem: {
    width: 65,
    padding: 2,
  },
  date: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: '#f5f5f5',
  },
  itemText: {
    color: '#333333',
    fontSize: 13,
  },
  today: {
    backgroundColor: '#d7f3ff',
  },
  active: {
    backgroundColor: '#33bbff',
    borderWidth: 0,
  },
  activeText: {
    color: 'white',
  },
  custom: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    marginLeft: 2,
    overflow: 'hidden',
  },
  customLayer: {
    position: 'absolute',
    flex: 1,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  weekName: {
    fontSize: 10,
    position: 'absolute',
    zIndex: 2,
    right: 3,
    top: 3,
  },
  picker: {
    width: 80,
    height: 60,
    marginTop: Platform.OS === 'ios' ? -170 : 0,
  },
});


const monthDateFormator = timeFormat.timeFormat('%m-%d');
const weekNames = getLocale('weekNames');
const todayName = getLocale('todayName');
const yestodayName = getLocale('yestodayName');
const channelName = getLocale('channel');

export default class DateAndChannel extends Component {
  static propTypes = {
    channelNumber: PropTypes.object,
    oneDay: PropTypes.object,
    currentChannel: PropTypes.number,
    activeDate: PropTypes.object,
    video15Day1: PropTypes.object,
    video15Day2: PropTypes.object,
    onSelectChange: PropTypes.func.isRequired,
    onTimeChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    channelNumber: null,
    oneDay: null,
    currentChannel: null,
    activeDate: null,
    video15Day1: null,
    video15Day2: null,
  }

  constructor(props) {
    super(props);

    const datesArr = [];
    for (let i = 14; i >= 0; i -= 1) {
      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() - i);
      datesArr.push(todayDate);
    }

    this.state.activeDate = new Date();
    this.state.datesArr = datesArr;
  }

  data = {
    firstIntoPage: true,
  }

  state = {
    activeDate: null,
    datesArr: null,
  }

  shouldComponentUpdate (nextProps, nextState) {
    const propsEqual = deepEqual(this.props, nextProps,
      ['channelNumber', 'oneDay', 'currentChannel', 'activeDate', 'video15Day1', 'video15Day2']);
    const stateEqual = deepEqual(this.state, nextState);

    return !propsEqual || !stateEqual;
  }

  handleDate = (date) => {
    const { onTimeChange } = this.props;
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 0);
    onTimeChange(startTime, endTime);
  }

  renderDates = (datesArr, videos, activeDate, channelNumber, currentChannel, oneDay) => {
    const today = new Date();
    const yestoday = new Date();
    yestoday.setDate(yestoday.getDate() - 1);

    const activeDateStr = monthDateFormator(activeDate);
    const todayStr = monthDateFormator(today);
    const yestodayStr = monthDateFormator(yestoday);

    const isEqualActive = dateStr => dateStr === activeDateStr;
    const isEqualToday = dateStr => dateStr === todayStr;
    const isEqualYestoday = dateStr => dateStr === yestodayStr;

    const hasVideo = (dateStr) => {
      if (isEmpty(videos)) {
        return false;
      }
      return videos.includes(dateStr);
    };

    let pickerSelectIndex;
    if (!isEmpty(channelNumber) && !isEmpty(currentChannel)) {
      pickerSelectIndex = channelNumber.findIndex(x => x.get('physicsChannel') === currentChannel);
    }

    return (
      <View style={styles.timeContainer}>
        <View style={styles.dateContainer}>
          <ScrollView
            style={styles.swiper}
            horizontal
            ref={(ref) => {
              if (ref !== null && this.data.firstIntoPage) {
                this.data.firstIntoPage = false;
                setTimeout(() => {
                  ref.scrollToEnd({ animated: false });
                }, 0);
              }
            }}
          >
            {
              datesArr.map((date) => {
                const dateStr = monthDateFormator(date);
                let weekName = weekNames[date.getDay()];
                if (isEqualToday(dateStr)) {
                  weekName = todayName;
                } else if (isEqualYestoday(dateStr)) {
                  weekName = yestodayName;
                }

                let activeStyle = null;
                let activeTextStyle = null;
                let hasVideoStyle = null;

                if (isEqualActive(dateStr)) {
                  activeStyle = styles.active;
                  activeTextStyle = styles.activeText;
                }
                if (hasVideo(dateStr)) {
                  hasVideoStyle = styles.today;
                }

                return (
                  <View style={styles.dateItem}>
                    <TouchableOpacity
                      style={[styles.date, hasVideoStyle, activeStyle]}
                      onPress={() => { this.handleDate(date); }}
                    >
                      <Text style={[
                        styles.itemText,
                        styles.weekName,
                        activeTextStyle]}
                      >{weekName}
                      </Text>
                      <Text style={[styles.itemText, activeTextStyle]}>{dateStr}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            }
          </ScrollView>
        </View>
        <View style={styles.customContainer}>
          <View
            style={[styles.custom]}
          >
            {
              oneDay === null ? <View style={styles.customLayer} /> : null
            }
            {
              isEmpty(channelNumber) ? null : (
                <Picker
                  mode="dropdown"
                  style={styles.picker}
                  selectedValue={pickerSelectIndex}
                  itemStyle={{ color: 'black', fontSize: 14 }}
                  itemSpace={Platform.OS === 'ios' ? 5 : 15}
                  onValueChange={index => this.onPickerSelect(index)}
                >
                  {channelNumber.map((x, i) => (<PickerItem label={`${x.get('physicsChannel')}`} value={i} key={`money${x.get('physicsChannel')}`} />
                  ))}
                </Picker>
              )
            }

          </View>
        </View>
      </View>
    );
  }

  onPickerSelect = (index) => {
    const { channelNumber, onSelectChange, currentChannel } = this.props;
    const x = channelNumber.get(index);
    const value = x.get('physicsChannel');

    if (currentChannel !== value) {
      onSelectChange(value);
    }
  }

  render () {
    const {
      video15Day1, video15Day2, channelNumber, activeDate, currentChannel, oneDay,
    } = this.props;
    const { datesArr } = this.state;

    const video15Day = List().concat(video15Day1).concat(video15Day2);
    const activeDateReal = isEmpty(activeDate) ? new Date() : activeDate;
    return (
      <View>
        {
          this.renderDates(
            datesArr,
            video15Day,
            activeDateReal,
            channelNumber,
            currentChannel,
            oneDay,
          )
        }
      </View>
    );
  }
}