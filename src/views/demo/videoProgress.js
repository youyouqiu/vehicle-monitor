import React from 'react';
import { Map, List } from 'immutable';
import {
  View,
} from 'react-native';
// import Picker from 'react-native-wheel-picker';
import { VideoProgress } from '../../common/reactNativeD3Charts';
import {
  second2Hms,
} from '../../utils/function';

// const PickerItem = Picker.Item;
export default class VideoProgressDemo extends React.PureComponent {
  state={
    currentTime: new Date('2019/11/26 01:00:00'),
  }


  handleOnDragEnd=({ currentTime: second }) => {
    const { currentTime } = this.state;
    const hms = second2Hms(second);
    const date = new Date(currentTime.getTime());
    date.setHours(hms.hour);
    date.setMinutes(hms.minute);
    date.setSeconds(hms.second);
    this.setState({
      currentTime: date,
    });
  }

  render() {
    const { currentTime } = this.state;


    return (
      <View style={{
        flex: 1, backgroundColor: 'white', paddingTop: 100,
      }}
      >
        <View style={{
          width: '100%', borderWidth: 1, borderColor: 'blue', height: 100,
        }}
        >
          <VideoProgress
            style={{
              flex: 1,
            }}
            data={List([
              Map({
                startTime: new Date('2019/11/26 01:00:00'),
                endTime: new Date('2019/11/26 11:00:00'),
              }),
            ])}
            currentTime={currentTime}
            channelNumber={0}
            onDragEnd={this.handleOnDragEnd}
          />

        </View>
      </View>
    );
  }
}