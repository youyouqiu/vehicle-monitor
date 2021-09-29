import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
// import PropTypes from 'prop-types';
import { Slider } from '@miblanchard/react-native-slider';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 18,
    marginRight: 18,
    marginTop: 38,
    marginBottom: 38,
    // backgroundColor: 'red',
    alignItems: 'stretch',
    justifyContent: 'center',
    // width: '80%',
  },
});

class SliderBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: [30, 90],
      minimumValue: 0,
      maximumValue: 150,
      trackMarks: [0, 25, 50, 75, 100, 125, 150],
      minimumTrackTintColor: '#00cc00',
      maximumTrackTintColor: '#960ba3',
      thumbTintColor: '#FFD306',
    };
  }

  componentDidMount() {
    // eslint-disable-next-line react/prop-types
    const { speedValues } = this.props;
    this.setState({
      value: speedValues,
    });
  }

  onSliderChange = (values) => {
    // eslint-disable-next-line react/prop-types
    const { getSliderValues } = this.props;
    this.setState({
      value: values,
    }, () => {
      // eslint-disable-next-line no-unused-expressions
      getSliderValues && getSliderValues(values);
    });
  }

  onSlidingStart = (values) => {
    if (values.length > 0) {
      if (values[1] === 0) {
        this.setState({
          value: [0, 90],
        });
      }
    }
  }

  onSlidingComplete = (values) => {
    if (values.length > 0) {
      if (values[0] > 147) {
        this.setState({
          value: [150, 150],
        });
      }
    }
  }

  renderTrackMarkComponent = (num) => {
    const { trackMarks } = this.state;
    return (
      <View style={[{ marginTop: 48 }, Platform.OS !== 'ios' ? { width: 38, marginLeft: -10 } : null]}>
        <Text style={{ color: 'black', textAlign: 'center' }}>{trackMarks[num]}</Text>
      </View>
    );
  }

  renderAboveThumbComponent = (num) => {
    const { value } = this.state;
    if (value.length > 0) {
      const newValue = value[1] - value[0];
      if (newValue < 12 && newValue > 1 && num === 0) {
        return (
          <View style={{ width: 48, height: 20, backgroundColor: '#464547' }}>
            <Text style={{
              fontSize: 12, lineHeight: 20, color: 'white', textAlign: 'center',
            }}
            >{`${value[0]}-${value[1]}`}
            </Text>
          </View>
        );
      }
      if (newValue < 12 && newValue > 1 && num === 1) {
        // eslint-disable-next-line consistent-return
        return;
      }
    }
    return (
      <View style={{ width: 38, height: 20, backgroundColor: '#464547' }}>
        <Text style={{
          fontSize: 14, lineHeight: 20, color: 'white', textAlign: 'center',
        }}
        >{value[num]}
        </Text>
      </View>
    );
  }

  render() {
    const {
      value,
      minimumValue,
      maximumValue,
      trackMarks,
      minimumTrackTintColor,
      maximumTrackTintColor,
      thumbTintColor,
    } = this.state;
    return (
      <View style={styles.container}>
        <Slider
          containerStyle={{ height: 60 }}
          value={value}
          onValueChange={this.onSliderChange} // 滑块值改变时
          onSlidingStart={this.onSlidingStart} // 用户开始更改值时（例如，按下滑块时）调用的回调
          onSlidingComplete={this.onSlidingComplete} // 用户完成更改值时调用的回调（例如，释放滑块时）
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          minimumTrackTintColor={minimumTrackTintColor}
          maximumTrackTintColor={maximumTrackTintColor}
          thumbTintColor={thumbTintColor}
          step={1}
          trackMarks={trackMarks}
          renderTrackMarkComponent={this.renderTrackMarkComponent}
          renderAboveThumbComponent={this.renderAboveThumbComponent}
          trackClickable
        />
      </View>
    );
  }
}

export default SliderBar;
