import React, { Component } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import * as shape from 'd3-shape';
import Svg, {
  G, Path, Polyline, Text, TSpan,
} from 'react-native-svg';
import { toFixed, isEmpty } from '../../utils/function';

class PieChart extends Component {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
      svg: PropTypes.object,
      key: PropTypes.any.isRequired,
      value: PropTypes.number,
      arc: PropTypes.object,
    })).isRequired,
    title: PropTypes.string,
    innerRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    outerRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    labelRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lineRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    padAngle: PropTypes.number,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    style: PropTypes.any,
    height: PropTypes.number,
    width: PropTypes.number,
    startAngle: PropTypes.number,
    endAngle: PropTypes.number,
    labelFontSize: PropTypes.number,
    titleFontSize: PropTypes.number,
    titleFontSizeIncrese: PropTypes.number, // 标题数字和文本的差值
    labelFormat: PropTypes.string, // PERCENT,VALUE,VALUE+UNIT
    unit: PropTypes.string,
    showLabel: PropTypes.bool,
    showLabelLine: PropTypes.bool,
    labelTextPosition: PropTypes.string, // LEFT,TOP
    labelColor: PropTypes.string,
    replaceZero: PropTypes.bool,
    valueAccessor: PropTypes.func,
  };

  static defaultProps = {
    title: null,
    width: 100,
    height: 100,
    padAngle: 0,
    startAngle: 0,
    endAngle: Math.PI * 2,
    valueAccessor: ({ item }) => item.value,
    animate: true,
    animationDuration: 2000,
    style: null,
    labelRadius: '90%',
    lineRadius: '85%',
    outerRadius: '65%',
    innerRadius: '55%',
    labelFontSize: 12,
    titleFontSize: 18,
    titleFontSizeIncrese: 16,
    labelFormat: 'PERCENT',
    unit: '',
    showLabel: true,
    showLabelLine: true,
    labelTextPosition: 'TOP',
    labelColor: undefined,
    replaceZero: false,
  };


  state = {
    height: 0,
    width: 0,
  }

  handleOnLayout (event) {
    const { nativeEvent: { layout: { height, width } } } = event;

    this.setState({ height, width });
  }

  handleCalculateRadius (arg, max, defaultVal) {
    if (typeof arg === 'string') {
      return (arg.split('%')[0] / 100) * max;
    } if (arg) {
      return arg;
    }
    return defaultVal;
  }

  getLabelText (value, total) {
    const { labelFormat, unit } = this.props;
    if (labelFormat === 'PERCENT') {
      return `${(toFixed(value / total * 100, 2, true)).toString(10)}%`;
    }
    if (labelFormat === 'VALUE') {
      return value;
    }
    if (labelFormat === 'VALUE999') {
      return value > 999 ? '999+' : value;
    }
    return value + unit;
  }

  getTextAnchor (x) {
    const { labelTextPosition } = this.props;
    if (labelTextPosition === 'TOP') {
      return 'start';
    }
    if (x > 0) {
      return 'start';
    }
    return 'end';
  }

  getAlignment () {
    const { labelTextPosition } = this.props;
    if (labelTextPosition === 'LEFT') {
      return 'middle';
    }
    return 'baseline';
  }

  render () {
    const {
      data,
      title,
      innerRadius,
      outerRadius,
      labelRadius,
      // lineRadius,
      padAngle,
      animate,
      animationDuration,
      style,
      valueAccessor,
      startAngle,
      endAngle,
      labelFontSize,
      titleFontSize,
      titleFontSizeIncrese,
      showLabel,
      showLabelLine,
      labelTextPosition,
      labelColor,
      replaceZero,
      unit,
    } = this.props;

    const { height, width } = this.state;
    const count = data.length;

    if (count === 0) {
      return <View style={style} />;
    }
    if (height === 0) {
      return <View style={style} onLayout={event => this.handleOnLayout(event)} />;
    }

    const maxRadius = Math.min(width, height) / 2;

    if (Math.min(...data.map(obj => valueAccessor({ item: obj }))) < 0) {
      return <View style={style} />;
    }

    const outerRadiusValue = this.handleCalculateRadius(outerRadius, maxRadius, maxRadius);
    const innerRadiusValue = this.handleCalculateRadius(innerRadius, maxRadius, 0);
    const labelRadiusValue = this.handleCalculateRadius(labelRadius, maxRadius, outerRadiusValue);
    // const lineRadiusValue = this.handleCalculateRadius(lineRadius, maxRadius, outerRadiusValue);

    if (outerRadius > 0 && innerRadiusValue >= outerRadius) {
      return <View style={style} />;
    }

    const arc = shape.arc()
      .outerRadius(outerRadiusValue)
      .innerRadius(innerRadiusValue)
      .padAngle(padAngle); // Angle between sections

    let totalValue = 0;
    let toMapData = data;
    if (replaceZero && !toMapData.some(x => x.value > 0)) {
      toMapData = toMapData.map((x) => {
        const y = {
          label: x.label,
          value: x.value,
        };
        y.value = 1;
        return y;
      });
    }

    const arcs = toMapData.map((item, index) => {
      totalValue += data[index].value;
      if (item.arc) {
        Object.entries(item.arc)
          .forEach(([key, value]) => {
            if (typeof arc[key] === 'function') {
              if (typeof value === 'string') {
                arc[key](value.split('%')[0] / 100 * outerRadiusValue);
              } else {
                arc[key](value);
              }
            }
          });
      }

      return arc;
    });

    const pieSlices = shape.pie()
      .value(d => valueAccessor({ item: d }))
      .startAngle(startAngle)
      .endAngle(endAngle)(toMapData);
    return (
      <View style={style}>
        <View
          style={{ flex: 1 }}
        >
          {
            height > 0 && width > 0
            && (
              <Svg style={{ height, width }}>
                {/* center the progress circle */}
                <G
                  x={width / 2}
                  y={height / 2}
                >
                  {
                    !isEmpty(title) && title.length > 0 ? (
                      <G fill="#000000">
                        <Text fontSize={titleFontSize + titleFontSizeIncrese} x={0} y={0} textAnchor="middle">
                          {totalValue > 999 ? '999+' : totalValue}
                        </Text>
                        <Text fontSize={titleFontSize} x={0} y={titleFontSize * 1.5} textAnchor="middle">
                          {title}
                        </Text>
                      </G>
                    ) : null
                  }
                  {pieSlices.map((slice, index) => {
                    const {
                      key, onPress, svg, value, label,
                    } = data[index];
                    const pieCentroid = arcs[index].centroid(slice);

                    const currentLabelRadius = outerRadiusValue
                      + (labelRadiusValue - outerRadiusValue) * ((index + 1) / count);
                    const labelArc = shape.arc()
                      .outerRadius(currentLabelRadius)
                      .innerRadius(currentLabelRadius)
                      .padAngle(padAngle);

                    const labelCentroid = labelArc.centroid(slice);
                    let lineEndX;
                    let textEndX;

                    if (labelCentroid[0] > 0) {
                      if (labelTextPosition === 'LEFT') {
                        lineEndX = outerRadiusValue + 10;
                        textEndX = lineEndX + 3;
                      } else {
                        lineEndX = outerRadiusValue + 30;
                        textEndX = outerRadiusValue;
                      }
                    } else if (labelTextPosition === 'LEFT') {
                      lineEndX = -1 * outerRadiusValue - 10;
                      textEndX = lineEndX - 3;
                    } else {
                      lineEndX = -1 * outerRadiusValue - 30;
                      textEndX = -1 * outerRadiusValue;
                    }

                    if (labelTextPosition === 'TOP' && labelCentroid[0] < 0) {
                      textEndX -= ((4 + value.toString().length) * labelFontSize);
                    }

                    const polyLinePoints = [
                      `${pieCentroid[0]},${pieCentroid[1]}`,
                      `${labelCentroid[0]},${labelCentroid[1]}`,
                      `${lineEndX},${labelCentroid[1]}`,
                    ].join(' ');
                    return (
                      <G>
                        <Path
                          key={key}
                          onPress={onPress}
                          {...svg}
                          d={arcs[index](slice)}
                          animate={animate}
                          animationDuration={animationDuration}
                        />
                        {
                          showLabel && [
                            (
                              showLabelLine && (
                                <Polyline
                                  points={polyLinePoints}
                                  stroke={svg.fill}
                                  fill="none"
                                />
                              )
                            ),
                            (
                              <Text
                                key={`label${Math.random()}`}
                                x={textEndX}
                                y={labelTextPosition === 'LEFT' ? labelCentroid[1] : labelCentroid[1] - 3}
                                fill={labelColor || svg.fill}
                                fontSize={labelFontSize}
                                textAnchor={this.getTextAnchor(labelCentroid[0])}
                                alignmentBaseline={labelTextPosition === 'LEFT' ? 'middle' : 'baseline'}
                              >
                                {
                                  labelTextPosition === 'LEFT'
                                    ? `${label.length > 0 ? `${label}: ` : ''}${this.getLabelText(value, totalValue)}`
                                    : [
                                      `${label.length > 0 ? `${label}: ` : ''}`,
                                      (
                                        <TSpan
                                          fontSize={labelFontSize + 8}
                                          fill="black"
                                          fontStyle="italic"
                                        >
                                          {`${this.getLabelText(value, totalValue)}`}
                                        </TSpan>
                                      ),
                                      (
                                        <TSpan>
                                          {unit}
                                        </TSpan>
                                      ),
                                    ]

                                }
                              </Text>
                            ),
                          ]
                        }
                      </G>
                    );
                  })}

                </G>
              </Svg>
            )
          }
        </View>
      </View>
    );
  }
}


export default PieChart;
