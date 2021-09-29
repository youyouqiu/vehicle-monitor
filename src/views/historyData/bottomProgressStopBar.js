import React, { Component } from 'react';
import {
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import { SimpleLine } from '../../common/reactNativeD3Charts';
import { isEmpty } from '../../utils/function';

const getColor = (type) => {
  if (type === null) {
    return 'lightgray';
  }
  if (type === 1) {
    return '#a3d843';
  }
  return '#ff9999';
};

class BottomProgressStopBar extends Component {
  static propTypes = {
    stopData: PropTypes.object,
  }

  static defaultProps={
    stopData: null,
  }

  shouldComponentUpdate(nextProps) {
    const { stopData } = this.props;
    const isSame = is(stopData, nextProps.stopData);
    if (!isSame) {
      return true;
    }
    return false;
  }

  getSvgData=(rawData) => {
    const data = rawData.toArray();
    const padEndData = data.concat([{
      get: x => `${x}:${Math.random()}`,
    }]);
    const padEndDataLength = padEndData.length;

    const dataArr = [];

    if (padEndDataLength > 0) {
      for (let i = 0; i < padEndDataLength; i += 1) {
        const element = padEndData[i];
        const currentType = element.get('status');
        const time = element.get('time');

        if (i < padEndDataLength - 1) {
          const newItem = {};
          newItem.date = new Date(time * 1000);
          newItem.value = 1;
          newItem.index = i;
          newItem.color = getColor(currentType);
          newItem.type = currentType;

          dataArr.push(newItem);
        }
      }
    }

    const series = [
      {
        data: dataArr,
        width: 3,
        yMinValue: 0,
        yMaxValue: 2,
        autoConnectPartition: 'BEFORE',
      },
    ];

    // 停止时长改为 查询总时长-行驶时长
    const newSvgData = {
      series,
    };
    return newSvgData;
  }

  render() {
    const {
      stopData,
    } = this.props;


    if (isEmpty(stopData)) {
      return null;
    }
    let svgData;
    try {
      svgData = this.getSvgData(stopData);
    } catch (error) {
      return null;
    }

    const { series } = svgData;
    return (
      <View style={{ flex: 1 }}>
        <SimpleLine
          style={{ flex: 1 }}
          data={series}
        />
      </View>
    );
  }
}

export default BottomProgressStopBar;