/* eslint react/no-array-index-key:off */
/* eslint no-restricted-globals:off */
import * as array from 'd3-array';
import * as scale from 'd3-scale';
import * as shape from 'd3-shape';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View, ScrollView, Text as RNText } from 'react-native';
import Svg, {
  Path, Line, Text, Rect, G,
} from 'react-native-svg';
import { getLocale } from '../../utils/locales';
// import Loading from '../loading';

class BarChart extends PureComponent {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    style: PropTypes.any,
    spacingInner: PropTypes.number,
    spacingOuter: PropTypes.number,
    contentInset: PropTypes.shape({
      top: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
    }),
    unit: PropTypes.string,
    yMin: PropTypes.any,
    yMax: PropTypes.any,
    clamp: PropTypes.bool,
    nameColor: PropTypes.string,
    activeColor: PropTypes.string,
    barColor: PropTypes.string,
    barWidth: PropTypes.number,
    linePointWidth: PropTypes.number, // 折线图每个点的所占的宽度
    axisColor: PropTypes.string,
    axisFont: PropTypes.number,
    currentIndex: PropTypes.number,
    valueColor: PropTypes.string,
    detailData: PropTypes.arrayOf(PropTypes.object),
    onPressBar: PropTypes.func,
    hiddenBarText: PropTypes.bool,
    typeLine: PropTypes.bool,
  };

  static defaultProps = {
    clamp: true,
    style: null,
    spacingInner: 0.5,
    spacingOuter: 0.4,
    contentInset: {
      top: 40,
      bottom: 55,
      left: 10,
      right: 50,
    },
    yMin: 0,
    yMax: undefined,
    unit: '',
    nameColor: '#6ecaff',
    activeColor: '#188bc2',
    barColor: '#5ecafe',
    barWidth: 20,
    linePointWidth: 22,
    axisColor: '#7b7b7b',
    axisFont: 10,
    currentIndex: null,
    valueColor: '#1494ff',
    detailData: [],
    onPressBar: undefined,
    hiddenBarText: false,
    typeLine: false,
  };

  constructor(props) {
    super(props);
    const { currentIndex } = props;
    this.state.currentIndex = currentIndex;
  }

  state = {
    width: 0,
    height: 0,
    // loading: false,
    currentIndex: null, // 如果是null，代表没有展开的柱子
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { currentIndex } = nextProps;
    this.setState({
      currentIndex,
      // loading: false,
    });
  }

  handleOnLayout(event) {
    const { nativeEvent: { layout: { height, width } } } = event;

    this.setState({ height, width });
  }

  getXScale(domain, left, right) {
    const {
      spacingInner,
      spacingOuter,
    } = this.props;

    return scale.scaleBand()
      .domain(domain)
      .range([left, right])
      .paddingInner([spacingInner])
      .paddingOuter([spacingOuter]);
  }

  getYScale(domain) {
    const {
      contentInset: {
        top = 0,
        bottom = 0,
      },
      clamp,
    } = this.props;

    const { height } = this.state;


    return scale.scaleLinear()
      .domain(domain)
      .range([height - bottom, top])
      .clamp(clamp);
  }

  getAreas1(x, y, currentIndex) {
    const { data, hiddenBarText } = this.props;
    const values = data.map(item => item.value);

    let d = data;
    if (currentIndex !== null && !hiddenBarText) {
      d = data.slice(0, currentIndex + 1);
    }

    return d.map((bar, index) => ({
      bar,
      xPoint: x(index),
      yPoint: y(values[index]),
    }));
  }

  getAreas2(x, y, currentIndex) {
    const { data } = this.props;
    const newData = data.slice(currentIndex + 1);

    const values = newData.map(item => item.value);


    return newData.map((bar, index) => ({
      bar,
      xPoint: x(index),
      yPoint: y(values[index]),
    }));
  }

  getExtent() {
    const {
      data,
    } = this.props;
    const values = data.map(item => item.value);

    const extent = array.extent([...values]);

    const {
      yMin = extent[0],
      yMax = extent[1],
    } = this.props;

    return [yMin, yMax];
  }

  getIndexes(data) {
    return data.map((_, index) => index);
  }

  getSvgTotalWidth() {
    // 计算在固定每个柱子宽度情况下svg的宽度
    // 由下式简化而来
    // spacingOuter * 2 * barWidth
    // + (barWidth * count)
    // + (barWidth * spacingInner * (count - 1));
    const {
      data, detailData, barWidth, linePointWidth, spacingOuter, spacingInner, hiddenBarText,
    } = this.props;
    const { currentIndex } = this.state;

    const count = data.length;
    let svgWidth = barWidth * (spacingOuter * 2 + count + (spacingInner * (count - 1)));

    if (currentIndex !== null && !hiddenBarText) {
      svgWidth += spacingInner * barWidth;
      svgWidth += (detailData.length - 1) * linePointWidth;
    }

    return svgWidth;
  }

  getNameLabels = (x1, x2, y) => {
    const {
      data, axisFont, valueColor, nameColor, activeColor, barWidth, hiddenBarText,
    } = this.props;
    const { currentIndex } = this.state;

    let textArray;
    let xScale = x1;

    const constructSvgElement = (item, index) => {
      const { value } = item;
      const originX = xScale(index);
      const originY = y(0) + (axisFont / 2);

      let labelOriginY;
      if (!isNaN(item.value)) {
        labelOriginY = y(item.value) - (axisFont / 2);
      }
      let fillColor = nameColor;
      let labelFillColor = valueColor;
      if (currentIndex !== null) {
        if (xScale === x1 && index === currentIndex) {
          fillColor = activeColor;
          labelFillColor = activeColor;
        }
      }
      return (
        <G>
          <Text
            key={`barLabel${Math.random()}`}
            x={xScale(index)}
            y={y(value) - (axisFont / 2)}
            fontSize={axisFont}
            fill={labelFillColor}
            alignmentBaseline="bottom"
            textAnchor="start"
            transform={!isNaN(item.value) ? `translate(${barWidth / 3}),rotate(-45, ${originX}, ${labelOriginY})` : false}
          >
            {value}
          </Text>
          <Text
            key={`barName${Math.random()}`}
            x={originX}
            y={originY}
            fontSize={axisFont}
            fill={fillColor}
            alignmentBaseline="bottom"
            textAnchor="start"
            transform={`translate(${barWidth / 3}),rotate(45, ${originX}, ${originY})`}
          >
            {item.name ? item.name.length > 7 ? `${item.name.substr(0, 7)}...` : item.name : ''}
          </Text>
        </G>
      );
    };

    if (currentIndex === null || hiddenBarText) {
      textArray = data.map(constructSvgElement);
    } else {
      textArray = data.slice(0, currentIndex + 1).map(constructSvgElement);
      xScale = x2;
      textArray = textArray.concat(data.slice(currentIndex + 1).map(constructSvgElement));
    }
    return textArray;
  }


  getDecorator = (x, y, data) => {
    const { barColor, typeLine } = this.props;

    if (!typeLine) {
      return data.map((item, index) => (
        <Rect
          key={`lineDecorator${index}`}
          x={x(index) - 2}
          y={y(item.value) - 2}
          width={4}
          height={4}
          // stroke="rgb(134, 65, 244)"
          fill={barColor}
        />
      ));
    }
    return data.map((item, index) => (
      <Rect
        key={`lineDecorator${index}`}
        x={x(index) - 2}
        y={y(0) - 10}
        width={4}
        height={4}
        // stroke="rgb(134, 65, 244)"
        fill={item.value > 0 ? 'green' : '#bdc3c7'}
      />
    ));
  }

  getDashLine = (x, y, data) => {
    const { barColor, typeLine } = this.props;
    if (!typeLine) {
      return data.map((item, index) => (
        <Line
          key={`dashLine${index}`}
          x1={x(index)}
          y1={y(0)}
          x2={x(index)}
          y2={y(item.value)}
          stroke={barColor}
          strokeWidth={1}
          strokeDasharray={[2, 2]}
        />
      ));
    }
    return data.map((item, index) => (
      <Line
        key={`dashLine${index}`}
        x1={x(index)}
        y1={y(0)}
        x2={x(index)}
        y2={y(0) - 8}
        stroke={barColor}
        strokeWidth={1}
        strokeDasharray={[2, 2]}
      />
    ));
  }

  getLineNames = (x, y, data) => {
    const { axisFont, nameColor } = this.props;
    return data.map((item, index) => (
      <Text
        key={`LineName${Math.random()}`}
        x={x(index)}
        y={y(0) + 1}
        fontSize={axisFont}
        fill={nameColor}
        alignmentBaseline="top"
        textAnchor="middle"
      >
        {item.name}
      </Text>
    ));
  }

  getLineValues = (x, y, data) => {
    const {
      axisFont, valueColor, typeLine, linePointWidth,
    } = this.props;

    if (typeLine) {
      return null;
    }
    return data.map((item, index) => {
      const originX = x(index);
      const originY = y(item.value);
      return (
        <Text
          key={`LineName${Math.random()}`}
          x={x(index)}
          y={y(item.value) - 10}
          fontSize={axisFont}
          fill={valueColor}
          alignmentBaseline="baseline"
          textAnchor="start"
          transform={`translate(${linePointWidth / 3}),rotate(-45, ${originX}, ${originY})`}
        >
          {item.value}
        </Text>
      );
    });
  }

  handlePressBar = (index) => {
    const { onPressBar, hiddenBarText } = this.props;
    const { currentIndex } = this.state;

    if (currentIndex === null || index !== currentIndex) {
      if (typeof onPressBar === 'function') {
        onPressBar(index, hiddenBarText);
      }
      // this.setState({
      //   loading: true,
      // });
    } else if (index === currentIndex) {
      if (typeof onPressBar === 'function') {
        onPressBar(null, hiddenBarText);
      }
      this.setState({
        currentIndex: null,
        // loading: false,
      });
    }
  }


  render() {
    const {
      data,
      style,
      barColor,
      activeColor,
      barWidth,
      spacingInner,
      spacingOuter,
      axisColor,
      unit,
      linePointWidth,
      contentInset: {
        left,
        right,
        bottom,
        top,
      },
      valueColor,
      detailData,
      hiddenBarText,
      typeLine,
    } = this.props;

    const {
      height, width, currentIndex,
    } = this.state;

    // if (loading) {
    //   return (
    //     <View style={style}>
    //       <Loading type="page" />
    //     </View>
    //   );
    // }

    if (data.length === 0) {
      return <View style={style} />;
    }

    if (height === 0) {
      return <View style={style} onLayout={event => this.handleOnLayout(event)} />;
    }

    const extent = this.getExtent();
    let indexes1;
    let indexes2;
    let x2;
    let areas2;
    let lineScale;
    let linePath;

    if (currentIndex === null || hiddenBarText === true) {
      indexes1 = this.getIndexes(data);
    } else {
      indexes1 = this.getIndexes(data.slice(0, currentIndex + 1));
      indexes2 = this.getIndexes(data.slice(currentIndex + 1));
    }

    const svgWidth = this.getSvgTotalWidth() + right;

    const xDomain1 = indexes1;
    const yDomain = extent;

    const count1 = indexes1.length;
    const svgWidth1 = left + barWidth * (spacingOuter * 2 + count1 + (spacingInner * (count1 - 1)));

    const x1 = this.getXScale(xDomain1, left, svgWidth1);
    const y = this.getYScale(yDomain);
    const y0 = y(0);

    if (currentIndex !== null && !hiddenBarText) {
      const x2Left = svgWidth1 + (spacingInner * barWidth)
        + ((detailData.length - 1) * linePointWidth);
      x2 = this.getXScale(indexes2, x2Left, svgWidth - right);

      lineScale = scale.scaleLinear()
        .domain([0, detailData.length - 1])
        .range([svgWidth1 + (spacingInner * barWidth), x2Left]);
      linePath = shape.line()
        .x((d, i) => lineScale(i))
        .y(d => y(d.value))(detailData);
    }

    const areas1 = this.getAreas1(x1, y, currentIndex);
    if (currentIndex !== null && !hiddenBarText) {
      areas2 = this.getAreas2(x2, y, currentIndex);
    }

    return (
      <View style={style}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            horizontal
          >
            {
              height > 0 && width > 0
              && (

                <Svg
                  style={{
                    height, width: svgWidth,
                  }}
                >
                  {
                    areas1.map((area, index) => {
                      const { xPoint, yPoint } = area;

                      return (
                        <Rect
                          x={xPoint}
                          y={yPoint}
                          width={barWidth}
                          height={y0 - yPoint}
                          fill={index === currentIndex ? activeColor : barColor}
                          onPressIn={() => { this.handlePressBar(index); }}
                        />
                      );
                    })
                  }

                  {
                    areas1.map((area, index) => {
                      const { xPoint } = area;

                      return (
                        <Rect
                          x={xPoint}
                          y={0}
                          width={barWidth}
                          height={y0 - 0}
                          fill="transparent"
                          onPressIn={() => { this.handlePressBar(index); }}
                        />
                      );
                    })
                  }

                  {
                    currentIndex !== null && !hiddenBarText && [areas2.map((area, index) => {
                      const { xPoint, yPoint } = area;

                      return (
                        <Rect
                          x={xPoint}
                          y={yPoint}
                          width={barWidth}
                          height={y0 - yPoint}
                          fill={barColor}
                          onPressIn={() => { this.handlePressBar(currentIndex + index + 1); }}
                        />
                      );
                    }), areas2.map((area, index) => {
                      const { xPoint } = area;
                      return (
                        <Rect
                          x={xPoint}
                          y={0}
                          width={barWidth}
                          height={y0 - 0}
                          fill="transparent"
                          onPressIn={() => { this.handlePressBar(currentIndex + index + 1); }}
                        />
                      );
                    })]
                  }

                  {
                    currentIndex !== null && !hiddenBarText
                    && [
                      !typeLine ? (
                        <Path
                          d={linePath}
                          fill="none"
                          stroke={barColor}
                          strokeWidth={1}
                        />
                      ) : null,
                      this.getDecorator(lineScale, y, detailData),
                      this.getDashLine(lineScale, y, detailData),
                      this.getLineNames(lineScale, y, detailData),
                      this.getLineValues(lineScale, y, detailData),
                    ]
                  }
                  {
                    this.getNameLabels(x1, x2, y)
                  }
                </Svg>
              )
            }
          </ScrollView>
          <Svg style={{
            height, width: 20, position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 100,
          }}
          >
            <Line
              x1={5}
              y1={y(0)}
              x2={5}
              y2={top}
              stroke={axisColor}
              strokeWidth={1}
            />
            <Text dx={0} dy={top - 5} fill={valueColor} fontSize={9} alignmentBaseline="baseline">{unit}</Text>
          </Svg>
          <Svg style={{
            height: 1, width, position: 'absolute', bottom: bottom - 1, left: 0, right: 0, zIndex: 100,
          }}
          >
            <Line
              x1={0}
              y1={0}
              x2={width}
              y2={0}
              stroke={axisColor}
              strokeWidth={1}
            />
          </Svg>
          <RNText style={{
            position: 'absolute', top: 5, right: 5, zIndex: 100, fontSize: 12, color: 'gray',
          }}
          >{hiddenBarText ? '' : getLocale('clickBarViewDetail')}
          </RNText>

        </View>

      </View>
    );
  }
}


export default BarChart;
