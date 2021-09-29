import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import {
  View, StyleSheet,
} from 'react-native';
import { PieChart } from '../../common/reactNativeD3Charts';
import Loading from '../../common/loading';
import { getLocale } from '../../utils/locales';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  total_box: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  box: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%',
  },
  item: {
    fontSize: 16,
  },
  item1: {
    color: '#85D6AA',
  },
  item2: {
    color: '#5813DD',
  },
  num: {
    fontSize: 20,
    marginHorizontal: 5,
    color: '#111111',
  },
});

class PieCharts extends Component {
  static propTypes = {
    treated: PropTypes.number.isRequired,
    untreated: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      pieData: [],
      initAngle: 0.3 * Math.PI,
      startAngle: 0,
      endAngle: 0,
    };
  }

  componentDidMount() {
    const { untreated, treated } = this.props;
    this.setStartAngle(untreated, treated);
    this.setPieCharts(untreated, treated);
  }

  UNSAFE_componentWillReceiveProps(nextprops) {
    const { untreated, treated } = nextprops;
    this.setStartAngle(untreated, treated);
    this.setPieCharts(untreated, treated);
  }

  // 设置环形图
  setPieCharts=(untreated, treated) => {
    /* eslint no-bitwise:off */
    const pieColor = ['#5813DD', '#85D6AA'];
    const labelText = [getLocale('securityDealNum'), getLocale('securityUndealNum')];

    const newData = [treated, untreated]
      .filter(value => value >= 0)
      .map((value, index) => ({
        value,
        svg: { fill: pieColor[index] },
        key: `${index}`,
        label: labelText[index],
      }));

    this.setState({
      pieData: newData,
    });
  }

  // 设置已处理startAngle
  setStartAngle=(untreated, treated) => {
    const { initAngle } = this.state;
    const halfPI = Math.PI * 0.5;
    const TwoPI = 2 * Math.PI;

    const halfAngle = (untreated + treated) === 0 ? halfPI
      : ((treated / (untreated + treated)) * TwoPI) / 2;

    let startAngle = 0;
    if (halfAngle < halfPI) {
      startAngle = initAngle + halfAngle;
    } else {
      startAngle = initAngle - halfAngle;
    }
    const endAngle = startAngle + TwoPI;

    this.setState({
      startAngle,
      endAngle,
    });
  }

  render() {
    const {
      pieData, startAngle, endAngle,
    } = this.state;

    return (
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          {
            pieData.length === 0
              ? <Loading type="page" />
              : (
                <PieChart
                  style={{ height: 140 }}
                  data={pieData}
                  title={getLocale('securityTotal')}
                  labelFormat="VALUE999"
                  labelFontSize={14}
                  unit={getLocale('securityUnit')}
                  titleFontSize={12}
                  innerRadius="60%"
                  outerRadius="75%"
                  startAngle={startAngle}
                  endAngle={endAngle}
                  labelColor="#333"
                  replaceZero
                />
              )
          }
        </View>
      </View>
    );
  }
}

export default PieCharts;