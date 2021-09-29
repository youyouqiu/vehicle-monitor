import * as array from 'd3-array';
import * as scale from 'd3-scale';
import * as shape from 'd3-shape';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';
import Loading from '../loading';
import { isEmpty } from '../../utils/function';
import Paths from './lineChartComponent/paths';


export default class SimpleLine extends Component {
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
    padding: PropTypes.object, // 内边距
  }

  static defaultProps = {
    padding: {
      top: 0,
      bottom: 0,
      left: 15,
      right: 15,
    },
  }

  state = {
    width: 0,
    height: 0,
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
      if (item.color && item.color.length > 0 && item.color !== prevColor) {
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
        if (index === serie.data.length - 1) {
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
   * 处理页面布局事件，此时可以获取到容器的宽高，整个图表所需的大部分数据在此计算
   * @param {Object} event 事件
   */
  handleOnLayout = (event) => {
    const { nativeEvent: { layout: { height, width } } } = event;

    this.setState({
      width,
      height,
    });
  }

  getSvgData=(width, height) => {
    const {
      data,
      padding,
    } = this.props;


    // const xArray = [];
    const extent = data.map(serie => ({
      serieXExtent: [0, serie.data.length - 1],
      serieYExtent: [0, 2],

    }));

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

    // 路径
    const paths = [];
    data.forEach((serie, index) => {
      const pathPartition = this.getPathPartition(serie);

      pathPartition.forEach((partition) => {
        const path = shape.line()
          .x(d => xScale(d.index))
          .y(d => yScale[index](d.value))(partition.data);
        paths.push({
          path,
          ...serie,
          color: partition.color,
        });
      });
    });
    return paths;
  }

  render() {
    const {
      data,
      style,
    } = this.props;

    const {
      width,
      height,
    } = this.state;

    if (data === null || data.length === 0) {
      return (
        <View style={style} />
      );
    }

    let paths;
    if (height > 0 && width > 0) {
      paths = this.getSvgData(width, height);
    }


    return (
      <View style={style}>
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
                      {
                        height, width,
                      },
                    ]}
                  >
                    {/* 折线 */}
                    <Paths paths={paths} uniqueKey={Math.random().toString(10)} />
                  </Svg>

                </View>
              ) : <Loading type="page" size={30} />
          }
        </View>
      </View>
    );
  }
}
