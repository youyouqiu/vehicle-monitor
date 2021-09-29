import React, { Component } from 'react';
import {
  Line, G, Text, Rect,
} from 'react-native-svg';
import PropTypes from 'prop-types';

export default class LineChartIndicator extends Component {
    static propTypes = {
      x1: PropTypes.number.isRequired,
      y1: PropTypes.number.isRequired,
      rectHeight: PropTypes.number.isRequired,
      x2: PropTypes.number.isRequired,
      y2: PropTypes.number.isRequired,
      rectColor: PropTypes.string.isRequired,
      rectWidth: PropTypes.number.isRequired,
      axisFontSize: PropTypes.number.isRequired,
      topRectX: PropTypes.number.isRequired,
      top: PropTypes.number.isRequired,
      yValue: PropTypes.array.isRequired,
      bottomTextX: PropTypes.number.isRequired,
      topTextX: PropTypes.number.isRequired,
      bottomRectX: PropTypes.number.isRequired,
      currentXText: PropTypes.string.isRequired,
    }

    // shouldComponentUpdate(nextProps) {
    //   const { uniqueKey } = this.props;
    //   if (uniqueKey !== nextProps.uniqueKey) {
    //     return true;
    //   }
    //   return false;
    // }

    render() {
      const {
        x1,
        y1,
        rectHeight,
        x2,
        y2,
        rectColor,
        rectWidth,
        topRectX,
        top,
        yValue,
        bottomTextX,
        topTextX,
        axisFontSize,
        bottomRectX,
        currentXText,
      } = this.props;


      return (
        <G>
          <Line x1={x1} y1={y1 + 23 - (40 - rectHeight)} x2={x2} y2={y2} stroke="#30C100" strokeWidth={1} />
          <Rect
            fill={rectColor}
            width={rectWidth}
            height={rectHeight}
            x={topRectX}
            y={y1 - top / 2}
            rx={3}
            ry={3}
            opacity={0.7}
          />
          {
          (yValue.map((yValueItem, index) => yValueItem.formattedText.split('\n').map((itemText, itemIndex) => (
            <Text
              x={topTextX}
              y={y1 + (axisFontSize + 2) * (index + itemIndex)}
              fill="white"
              fontSize={axisFontSize - 1}
              key={Math.random()}
            >
              {itemText}
            </Text>
          )))
          )
        }

          <Rect fill="#30C100" width={rectWidth} height={15} x={bottomRectX} y={y2 + 1} rx={3} ry={3} opacity={0.7} />
          <Text
            x={bottomTextX}
            y={y2 + 12}
            fill="white"
            fontSize={axisFontSize - 1}
            key={Math.random()}
          >
            {currentXText}
          </Text>
        </G>
      );
    }
}