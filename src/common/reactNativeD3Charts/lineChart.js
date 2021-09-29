import * as array from 'd3-array';
import * as scale from 'd3-scale';
import * as shape from 'd3-shape';
import * as timeFormat from 'd3-time-format';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { throttle } from 'lodash';
import Loading from '../loading';
import { getLocale } from '../../utils/locales';
import { isEmpty } from '../../utils/function';
import Paths from './lineChartComponent/paths';
import Axis from './lineChartComponent/axis';
import Lines from './lineChartComponent/lines';
import Dotts from './lineChartComponent/dotts';
import Indicator from './lineChartComponent/indicator';

const styles = StyleSheet.create({
  svgStyle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default class LineChart extends Component {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
      data: PropTypes.object.isRequired, // 序列数据
      color: PropTypes.string.isRequired, // 序列颜色
      width: PropTypes.number.isRequired, // 序列线条宽度
      label: PropTypes.string.isRequired, // 序列名称
      unit: PropTypes.string.isRequired, // 序列单位
      autoConnectPartition: PropTypes.oneOf(['AFTER', 'BEFORE', 'NONE']), // 分组序列颜色连接方式
      yValueFunc: PropTypes.func, // y轴文本取值函数，如果不提供则按照label名称和value值取
      yMinValue: PropTypes.number, // y轴最小值，默认序列最小值
      yMaxValue: PropTypes.number, // y轴最大值，默认序列最大值
      line: PropTypes.object, // 阈值线
      dotts: PropTypes.object, // 关键点
    })).isRequired, // 序列
    style: PropTypes.object.isRequired, // 样式
    axisFontSize: PropTypes.number, // 坐标轴字体大小
    padding: PropTypes.object, // 内边距
    axisColor: PropTypes.string, // 坐标轴线颜色
    axisWidth: PropTypes.string, // 坐标轴线宽度
    onDrag: PropTypes.func, // 拖拽时并且有数据点触发
    onDragEnd: PropTypes.func, // 拖拽结束时触发
    snap: PropTypes.bool, // 是否吸附，拖拽结束后是否自动寻找最近的一个数据点
    xAxisInterval: PropTypes.number, // x轴的最小计算单位，如果两个值在这个最小计算单位内，视为相等
    playIndex: PropTypes.number.isRequired, // 当前指示线所在下标
    rectColorFunc: PropTypes.func, // 获取指示线上方矩形的背景色
    rectWidth: PropTypes.number, // 指示线上方矩形的宽度
    rectHeight: PropTypes.number, // 指示线上方矩形的高度
    uniqueKey: PropTypes.string.isRequired, // 是否整个图表需要更新的标志
  }

  static defaultProps = {
    axisFontSize: 12,
    padding: {
      top: 30,
      bottom: 20,
      left: 15,
      right: 15,
    },
    axisColor: '#999',
    axisWidth: 1,
    onDrag: null,
    onDragEnd: null,
    snap: true,
    xAxisInterval: 0.1,
    rectColorFunc: null,
    rectWidth: 80,
    rectHeight: 36,
  }

  constructor(props) {
    super(props);
    this.configPanResponder();
    this.throttleMove = throttle(this.handleOnDrag, 50);
  }

  data = {
    isDragging: false, // 是否在拖动中
  }

  state = {
    width: 0,
    height: 0,
    xScale: null,
    yScale: null, // 每条曲线一个自己的y轴比例尺，所以是数组
    xAxis: null,
    yAxis1: null,
    yAxis2: null,
    x1: 0,
    y1: null,
    x2: null,
    y2: null,
    xMax: null,
    xMaxText: null, // 横轴最左边的时间
    xMin: null, // 每条曲线一个自己的y轴比例尺，所以是数组
    yMax: null, // 每条曲线一个自己的y轴比例尺，所以是数组
    yMin: null,
    timeFormater: null,
    paths: null,
    linePaths: null,
    dotts: null,
    yValue: [],
    currentXText: null,
    rectColor: '#30C100', // 指示线上面矩形的背景色
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { playIndex: prevPlayIndex } = this.props;
    const { playIndex } = nextProps;
    if (playIndex !== prevPlayIndex && this.data.isDragging === false) {
      this.updatePositionByPlayIndex(playIndex);
    }
  }

  /**
   * 根据数据下标获取对应的x轴值，遍历所有序列，返回得到的第一个值，如未找到，返回null
   * @param {number} xValue 数据的下标
   */
  getXvalueFromPlayIndex(xValue) {
    const { data, xAxisInterval } = this.props;
    for (let i = 0; i < data.length; i += 1) {
      const serie = data[i];
      const { data: serieData } = serie;
      if (serieData.length > xValue) {
        for (let j = 0; j < serieData.length; j += 1) {
          const item = serieData[j];
          const itemXValue = item.index;

          if (itemXValue - xAxisInterval < xValue && xValue < itemXValue + xAxisInterval) {
            return item;
          }
        }
      }
    }
    return null;
  }

  /**
   * 根据x轴值获取对应的数据下标，遍历所有序列，返回得到的第一个值，如未找到，返回null
   * @param {Number} xValue x轴值 序列的下标
   */
  getPlayIndexFromXvalue(xValue) {
    const { data, xAxisInterval } = this.props;

    for (let i = 0; i < data.length; i += 1) {
      const serie = data[i];
      const { data: serieData } = serie;

      for (let j = 0; j < serieData.length; j += 1) {
        const item = serieData[j];
        const itemXValue = item.index;

        if (itemXValue - xAxisInterval < xValue && xValue < itemXValue + xAxisInterval) {
          return j;
        }
      }
    }
    return null;
  }

  /**
   * 传入一个x轴的值，寻找最近的一个有数据的点。因为传入的x轴的值可能没有对应的数据点
   * @param {Number} xValue x轴的值 序列的下标
   */
  getClosestXvalue = (xValue) => {
    const { data } = this.props;
    const neighborhoodArr = [];
    data.forEach((serie) => {
      const { data: serieData } = serie;
      const neighborhood = [null, null];
      for (let i = 0; i < serieData.length; i += 1) {
        const item = serieData[i];
        const itemXValue = item.index;
        if (xValue >= itemXValue) {
          neighborhood[0] = itemXValue;
        }
        if (xValue <= itemXValue && neighborhood[1] === null) {
          neighborhood[1] = itemXValue;
          break;
        }
      }

      neighborhoodArr.push(neighborhood);
    });
    let closestXValue = null;
    let closestDiff = null;

    neighborhoodArr.forEach((neighbor) => {
      const beforeDiff = Math.abs(xValue - neighbor[0]);
      const afterDiff = Math.abs(neighbor[1] - xValue);
      const minDiff = Math.min(beforeDiff, afterDiff);

      if (closestDiff === null || closestDiff > minDiff) {
        closestDiff = minDiff;
        closestXValue = beforeDiff > afterDiff ? neighbor[1] : neighbor[0];
      }
    });

    return closestXValue;
  }

  /**
   * 获取一条序列的分段svg所需数据
   * 根据序列的 autoConnectPartition 决定颜色的向前连接还是向后连接
   * @param {object} serie 序列
   */
  getPathPartition = (serie) => {
    const total = [];
    let partition = [];
    const serieColor = serie.color;
    let prevColor = serie.data.length > 0 && serie.data[0].color && serie.data[0].color.length > 0
      ? serie.data[0].color : serieColor;
    serie.data.forEach((item, index) => {
      if (item.color && item.color.length > 0 && item.color != prevColor) {
        total.push(
          {
            data: [].concat(partition),
            color: prevColor,
          },
        );
        partition = [item];
        if (serie.autoConnectPartition === 'BEFORE' && total.length > 0) {
          const lastPartition = total[total.length - 1].data;
          if (lastPartition.length > 0) {
            const lastItem = lastPartition[lastPartition.length - 1];
            partition.splice(0, 0, lastItem);
            if (index == serie.data.length - 1) {
              total.push({
                data: [].concat(partition),
                color: item.color,
              });
            }
          }
        } else if (serie.autoConnectPartition === 'AFTER' && total.length > 0) {
          const lastPartition = total[total.length - 1].data;
          if (lastPartition.length > 0) {
            lastPartition.push(item);
          }
        }
        prevColor = item.color;
      } else {
        partition.push(item);
        if (index == serie.data.length - 1) {
          total.push(
            {
              data: [].concat(partition),
              color: prevColor,
            },
          );
        }
      }
    });
    return total;
  }

  /**
   * 根据传入的x值获取所有序列的y值，返回一个数组，数组的每个对象包含
   * name,value,text 分别是序列的名称，值，值 + 单位
   * 如果每条序列都未找到对应的y值，返回的数组的 hasYValue 属性将为false，反之为true
   * 如果传入xValue为空，则返回空数组
   * @param {Number} xValue x值 序列的下标
   */
  getYaxisValue = (xValue) => {
    if (xValue === null) {
      return [];
    }

    const { data, xAxisInterval } = this.props;
    const r = [];

    let hasYValue = false;
    data.forEach((serie) => {
      const { data: serieData, yValueFunc } = serie;
      /* eslint {eqeqeq:'off'} */
      const yValue = serieData.find((item) => {
        const itemXValue = item.index;
        return itemXValue - xAxisInterval < xValue && xValue < itemXValue + xAxisInterval;
      });
      const rItem = {
        name: serie.label,
      };

      if (yValue === undefined) {
        rItem.value = null;
        rItem.text = '--- ';
      } else if (yValue.value === null) {
        rItem.value = null;
        rItem.text = '--- ';
        hasYValue = true;
      } else if (yValue.value === undefined || yValue.date === null || yValue.date === 0 || yValue.date === '0') {
        rItem.value = null;
        rItem.text = getLocale('noData');
      } else {
        const rItemValue = yValue.value;
        rItem.yValue = yValue;
        rItem.value = rItemValue;
        rItem.text = `${rItemValue.toString()} ${serie.unit}`;
        hasYValue = true;
      }
      if (typeof yValueFunc === 'function') {
        rItem.formattedText = yValueFunc(rItem, serie);
      } else {
        rItem.formattedText = `${rItem.name}: ${rItem.text}`;
      }
      r.push(rItem);
    });
    r.hasYValue = hasYValue;
    return r;
  }

  /**
   * 为特定序列根据x值返回y值，如果没有找到，返回null
   * @param {Number} xValue x值 序列的下标
   * @param {Object} serie 序列
   */
  getYValue4Serie = (xValue, serie) => {
    let yValue = null;
    if (serie.data && serie.data.length > 0) {
      yValue = serie.data.find(item => item.index === xValue);
    }
    return yValue;
  }

  /**
   * 配置手势检测
   */
  configPanResponder = () => {
    this.panResponderObj = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        const { x0 } = gestureState;
        this.handleOnDrag(x0);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX } = gestureState;
        this.throttleMove(moveX);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { moveX, x0 } = gestureState;
        setTimeout(() => {
          this.handleOnDragEnd(moveX || x0);
        }, 60);
      },
      onPanResponderTerminate: () => {

      },
      onShouldBlockNativeResponder: () => true
      ,
    });
  }

  /**
   * 处理用户拖拽指示线的操作，更新指示线位置，并当指示线移动到有对应的数据点时触发 OnDray 方法
   * 当所有序列任意有一条返回对应y值时判定为有对应数据点
   * @param {number} x 距离屏幕左侧的距离
   */
  handleOnDrag = (x) => {
    this.data.isDragging = true;
    const { padding: { left, right }, onDrag, rectColorFunc } = this.props;
    const { width, xScale, timeFormater } = this.state;
    let { rectColor } = this.state;

    let newX1 = Math.max(x, left);
    newX1 = Math.min(newX1, width - right);
    const xIndex = xScale.invert(newX1);
    const xValue = this.getXvalueFromPlayIndex(xIndex);
    const yValue = this.getYaxisValue(xIndex);

    let currentXText = '';
    if (xValue !== undefined && xValue !== null && xValue.date !== null && xValue.date > 0) {
      currentXText = timeFormater(xValue.date);
      if (typeof rectColorFunc === 'function') {
        const colorFromFunc = rectColorFunc(xValue);
        if (colorFromFunc !== null) {
          rectColor = colorFromFunc;
        }
      }
    }

    this.setState({
      x1: newX1,
      x2: newX1,
      currentXText,
      yValue,
      rectColor,
    });

    if (typeof onDrag === 'function' && yValue.hasYValue === true) {
      onDrag({
        xValue: xValue.index,
        playIndex: xValue.index,
      });
    }
  }

  /**
   * 处理用户拖拽指示线结束的操作，更新指示线位置，并当指示线移动到有对应的数据点时触发 OnDrayEnd 方法
   * 当所有序列任意有一条返回对应y值时判定为有对应数据点
   * @param {number} x 距离屏幕左侧的距离
   */
  handleOnDragEnd = (x) => {
    const {
      padding: { left, right }, onDragEnd, snap, rectColorFunc,
    } = this.props;
    const { width, xScale, timeFormater } = this.state;
    let { rectColor } = this.state;

    let newX1 = Math.max(x, left);
    newX1 = Math.min(newX1, width - right);
    let xIndex = xScale.invert(newX1);


    if (snap === true) {
      xIndex = this.getClosestXvalue(xIndex);
      newX1 = xScale(xIndex);
    }
    const yValue = this.getYaxisValue(xIndex);
    const xValue = this.getXvalueFromPlayIndex(xIndex);

    let currentXText = '';
    if (xValue.date !== null && xValue.date > 0) {
      currentXText = timeFormater(xValue.date);

      if (typeof rectColorFunc === 'function') {
        const colorFromFunc = rectColorFunc(xValue);
        if (colorFromFunc !== null) {
          rectColor = colorFromFunc;
        }
      }
    }

    this.setState({
      x1: newX1,
      x2: newX1,
      currentXText,
      yValue,
      rectColor,
    });

    if (typeof onDragEnd === 'function' && yValue.hasYValue === true) {
      onDragEnd({
        xValue: xValue.index,
        playIndex: xValue.index,
      });
    }
    this.data.isDragging = false;
  }

  /**
   * 处理页面布局事件，此时可以获取到容器的宽高，整个图表所需的大部分数据在此计算
   * @param {Object} event 事件
   */
  handleOnLayout = (event) => {
    const { nativeEvent: { layout: { height, width } } } = event;
    const {
      data,
      padding,
      rectColorFunc,
      playIndex,
    } = this.props;

    // const xArray = [];
    const extent = data.map((serie) => {
      const minAndMax = array.extent(serie.data.filter(x => x.value !== null), x => x.value);

      return {
        serieXExtent: [0, serie.data.length - 1],
        serieYExtent: [
          isEmpty(serie.yMinValue) ? minAndMax[0] : serie.yMinValue,
          isEmpty(serie.yMaxValue) ? minAndMax[1] : serie.yMaxValue,
        ],
      };
    });

    const xMin = array.min(extent, x => x.serieXExtent[0]);
    const xMax = array.max(extent, x => x.serieXExtent[1]);


    // 每条曲线一个自己的y轴比例尺，所以是数组
    const yMin = extent.map(x => (!x.serieYExtent[0] ? 0 : x.serieYExtent[0]));
    const yMax = extent.map(x => (!x.serieYExtent[1] ? 0 : x.serieYExtent[1]));


    // 原来如果一条曲线的值恒定，为了能表现曲线，上下各加了一，
    // 但是这样当数字为0时不太直观，现在添加处理，当数字为0，只补充上方，使曲线贴底线
    for (let i = 0; i < yMin.length; i += 1) {
      if (yMin[i] === yMax[i]) {
        if (yMin[i] === 0) {
          yMax[i] += 1;
        } else {
          yMin[i] -= 1;
          yMax[i] += 1;
        }
      }
    }

    // 比例尺
    const xScale = scale.scaleLinear()
      .domain([xMin, xMax])
      .range([0 + padding.left, width - padding.right]);
    // 每条曲线一个自己的y轴比例尺，所以是数组
    const yScale = yMin.map((x, i) => scale.scaleLinear()
      .domain([yMin[i], yMax[i]])
      .range([height - padding.bottom, 0 + padding.top]));

    // 时间格式器
    const timeFormater = timeFormat.timeFormat('%H:%M:%S');

    // 坐标轴
    const xAxisData = [
      { x: xMin, y: yMin[0] },
      { x: xMax, y: yMin[0] },
    ];
    const yAxisData1 = [
      { x: xMin, y: yMin[0] },
      { x: xMin, y: yMax[0] },
    ];
    // 横轴文本
    const xMaxValue = this.getXvalueFromPlayIndex(xMax);
    const currentXValue = this.getXvalueFromPlayIndex(playIndex);
    let xMaxText = '';
    if (xMaxValue !== undefined && xMaxValue !== null
      && xMaxValue.date !== null && xMaxValue.date > 0) {
      xMaxText = timeFormater(xMaxValue.date);
    }
    let currentXText = '';
    if (currentXValue !== undefined && currentXValue !== null
      && currentXValue.date !== null && currentXValue.date > 0) {
      currentXText = timeFormater(currentXValue.date);
    }

    const xAxis = shape.line()
      .x(d => xScale(d.x))
      .y(d => yScale[0](d.y))(xAxisData);
    const yAxis1 = shape.line()
      .x(d => xScale(d.x))
      .y(d => yScale[0](d.y))(yAxisData1);
    let yAxis2;
    if (data.length === 2) {
      const yAxisData2 = [
        { x: xMax, y: yMin[1] },
        { x: xMax, y: yMax[1] },
      ];
      yAxis2 = shape.line()
        .x(d => xScale(d.x))
        .y(d => yScale[1](d.y))(yAxisData2);
    }

    // 路径
    const paths = [];
    let linePaths = []; // 阈值线
    const dotts = [];

    data.forEach((serie, index) => {
      const pathPartition = this.getPathPartition(serie);

      pathPartition.forEach((partition) => {
        const path = shape.line()
          .x(d => xScale(d.index))
          .y(d => yScale[index](d.value))(partition.data);
        paths.push({
          path,
          width: serie.width,
          color: partition.color,
        });
      });

      if (serie.line && serie.line.length > 0) {
        linePaths = linePaths.concat(serie.line.map(lineItem => ({
          x1: xScale(xMin),
          y1: yScale[index](lineItem.value),
          x2: xScale(xMax),
          text: lineItem.value.toString(),
          ...lineItem,
        })));
      }

      if (serie.dotts && serie.dotts.length > 0) {
        serie.dotts.forEach((dot) => {
          const x = xScale(dot.value);
          const yValue = this.getYValue4Serie(dot.value, serie);

          const y = yScale[index](yValue.value);
          dotts.push({
            x,
            y,
            color: dot.color,
          });
        });
      }
    });

    // 指示线
    let { x1, rectColor } = this.state;
    // x1 += padding.left;
    x1 = xScale(playIndex);
    const y1 = yScale[0](yMax[0]);
    const x2 = x1;
    const y2 = yScale[0](yMin[0]);

    const yValue = this.getYaxisValue(playIndex);
    if (typeof rectColorFunc === 'function') {
      const colorFromFunc = rectColorFunc(currentXValue);
      if (colorFromFunc !== null) {
        rectColor = colorFromFunc;
      }
    }

    this.setState({
      width,
      height,
      xScale,
      yScale,
      xAxis,
      yAxis1,
      yAxis2,
      x1,
      y1,
      x2,
      y2,
      xMax,
      xMaxText,
      xMin,
      yMax,
      yMin,
      timeFormater,
      paths,
      linePaths,
      dotts,
      currentXText,
      yValue,
      rectColor,
    });
  }

  /**
   * 根据x轴的下标更新指示线和对应的数据
   * @param {number} playIndex x轴下标
   */
  updatePositionByPlayIndex = (playIndex) => {
    const { rectColorFunc } = this.props;
    const { xScale, timeFormater } = this.state;
    let { rectColor } = this.state;

    if (xScale === null) {
      return;
    }

    const xValue = this.getXvalueFromPlayIndex(playIndex);

    const newX1 = xScale(xValue.index);
    const yValue = this.getYaxisValue(xValue.index);
    let currentXText = '';
    if (xValue !== undefined && xValue !== null && xValue.date !== null && xValue.date > 0) {
      currentXText = timeFormater(xValue.date);
      if (typeof rectColorFunc === 'function') {
        const colorFromFunc = rectColorFunc(xValue);
        if (colorFromFunc !== null) {
          rectColor = colorFromFunc;
        }
      }
    }
    this.setState({
      x1: newX1,
      x2: newX1,
      yValue,
      currentXText,
      rectColor,
    });
  }

  render() {
    const {
      data,
      style,
      axisFontSize,
      axisColor,
      axisWidth,
      padding: { top },
      rectWidth,
      rectHeight,
      uniqueKey,
    } = this.props;

    const {
      width,
      height,
      xScale,
      yScale,
      xAxis,
      yAxis1,
      yAxis2,
      x1,
      y1,
      x2,
      y2,
      xMax,
      xMaxText,
      xMin,
      yMax,
      yMin,
      paths,
      linePaths,
      dotts,
      currentXText,
      yValue,
      rectColor,
    } = this.state;

    if (data === null || data.length === 0) {
      return (
        <View style={style} />
      );
    }

    const halfRectWidth = rectWidth / 2;
    let topRectX = x1 > rectWidth / 2 ? x1 - (rectWidth / 2) : 0;
    let topTextX = x1 > rectWidth / 2 ? x1 - (rectWidth / 2) + 2 : 2;
    let bottomRectX = x1 > rectWidth / 2 ? x1 - (rectWidth / 2) : 0;
    let bottomTextX = x1 > rectWidth / 2 ? x1 - (rectWidth / 2) + 17 : 17;

    if (x1 <= halfRectWidth) {
      topRectX = 0;
      topTextX = 2;
      bottomRectX = 0;
      bottomTextX = 18;
    } else if (x1 > halfRectWidth && x1 < (width - halfRectWidth)) {
      topRectX = x1 - (halfRectWidth);
      topTextX = x1 - (halfRectWidth) + 2;
      bottomRectX = x1 - (halfRectWidth);
      bottomTextX = x1 - (halfRectWidth) + 18;
    } else {
      const maxDistance = width - rectWidth;
      topRectX = maxDistance;
      topTextX = maxDistance + 2;
      bottomRectX = maxDistance;
      bottomTextX = maxDistance + 18;
    }

    return (
      <View style={style} {...this.panResponderObj.panHandlers}>
        <View
          style={{
            flex: 1,
          }}
          onLayout={event => this.handleOnLayout(event)}
        >
          {
            height > 0 && width > 0
              ? (
                <View style={{
                  flex: 1,
                }}
                >
                  <Svg
                    style={[
                      styles.svgStyle,
                      {
                        height, width, zIndex: 1,
                      },
                    ]}
                  >
                    {/* 坐标轴 */}
                    <Axis
                      uniqueKey={uniqueKey}
                      xAxis={xAxis}
                      axisColor={axisColor}
                      axisWidth={axisWidth}
                      xScale={xScale}
                      xMax={xMax}
                      yScale={yScale}
                      yMin={yMin}
                      axisFontSize={axisFontSize}
                      xMaxText={xMaxText}
                      yAxis1={yAxis1}
                      xMin={xMin}
                      yMax={yMax}
                      data={data}
                      yAxis2={yAxis2}
                    />

                    {/* 折线 */}
                    <Paths paths={paths} uniqueKey={uniqueKey} />

                    {/* 点 */}
                    <Dotts dotts={dotts} uniqueKey={uniqueKey} />

                    {/* 阈值线 */}
                    <Lines
                      uniqueKey={uniqueKey}
                      linePaths={linePaths}
                      axisColor={axisColor}
                      axisFontSize={axisFontSize}
                    />


                  </Svg>
                  <Svg
                    style={[
                      styles.svgStyle,
                      {
                        height, width, zIndex: 2,
                      },
                    ]}
                  >
                    {/* 指示线 */}
                    <Indicator
                      x1={x1}
                      y1={y1}
                      rectHeight={rectHeight}
                      x2={x2}
                      y2={y2}
                      rectColor={rectColor}
                      rectWidth={rectWidth}
                      axisFontSize={axisFontSize}
                      topRectX={topRectX}
                      top={top}
                      yValue={yValue}
                      bottomTextX={bottomTextX}
                      topTextX={topTextX}
                      bottomRectX={bottomRectX}
                      currentXText={currentXText}
                    />
                  </Svg>
                </View>
              ) : <Loading type="page" />
          }
        </View>
      </View>
    );
  }
}
