/* eslint no-bitwise:off */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,

} from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../../utils/locales';
import { isEmpty } from '../../../utils/function';
import { getDefaultMonitors } from '../../../server/getData';
import { toastShow } from '../../../utils/toastUtils';
import { serviceError, tokenOverdue, serviceConnectError } from '../../../utils/singleSignOn';
import NetworkModal from '../../../utils/networkModal';
import storage from '../../../utils/storage';
import Loading from '../../../common/loading';
import Content from './content';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

class SpeedingStatistics extends Component {
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('speedingStatistics'),
  )

  static propTypes = {
    startTime: PropTypes.object,
    endTime: PropTypes.object,
    monitors: PropTypes.object,
    activeMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    barChartData: PropTypes.object,
    isSuccess: PropTypes.bool.isRequired,
    onInit: PropTypes.func.isRequired,
    navigation: PropTypes.object.isRequired,
    checkMonitors: PropTypes.object.isRequired,
    queryPeriod: PropTypes.number.isRequired,
    detailsData: PropTypes.object,
    getDetails: PropTypes.func.isRequired,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
    route: PropTypes.object.isRequired,
    reset: PropTypes.func.isRequired,
  }

  static defaultProps = {
    monitors: null,
    barChartData: null,
    activeMonitor: null,
    startTime: null,
    endTime: null,
    detailsData: null,
    currentIndex: null,
    extraState: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      initStatus: 'ing',
    };
  }

  componentDidMount() {
    const { initStatus } = this.props;
    this.setState({
      initStatus,
    }, () => {
      this.getDefaultMonitorsFun();
    });
  }

  // 获取默认勾选的监控对象
  getDefaultMonitorsFun = () => {
    const { route: { params: { checkMonitors } } } = this.props;
    if (isEmpty(checkMonitors.activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }
    const params = {
      type: checkMonitors.item.getType ? checkMonitors.item.getType : '0',
      defaultSize: checkMonitors.maxNum ? checkMonitors.maxNum : 100,
      isFilter: false,
    };
    // 获取默认选中监控对象
    getDefaultMonitors(params).then((res) => {
      const monitorsObj = res;
      if (monitorsObj.statusCode === 200) {
        checkMonitors.monitors = monitorsObj.obj;
        if (monitorsObj.obj.length > 0) {
          this.setState({
            initStatus: '',
          });
        } else {
          toastShow(getLocale('notHasMonitor'), { duration: 2000 });
        }
      } else if (monitorsObj.error === 'invalid_token') {
        storage.remove({
          key: 'loginState',
        });
        tokenOverdue();
      } else if (monitorsObj.error === 'request_timeout') {
        NetworkModal.show({ type: 'timeout' });
      } else if (monitorsObj.error !== 'network_lose_connected') {
        serviceError();
      } else {
        serviceConnectError();
      }
    });
  }

  componentWillUnmount() {
    const { reset } = this.props;
    reset();
  }

  render() {
    // const { initStatus } = this.props;
    const { initStatus } = this.state;
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.container}>
          {
            initStatus === 'ing' ? <Loading type="modal" /> : null
          }
          {
            initStatus !== 'ing' ? <Content {...this.props} /> : null
          }
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    initStatus: state.getIn(['speedingStatisticsReducers', 'initStatus']),
    isSuccess: state.getIn(['speedingStatisticsReducers', 'isSuccess']),
    barChartData: state.getIn(['speedingStatisticsReducers', 'barChartData']),
    queryPeriod: state.getIn(['speedingStatisticsReducers', 'queryPeriod']),
    detailsData: state.getIn(['speedingStatisticsReducers', 'detailsData']),
    currentIndex: state.getIn(['speedingStatisticsReducers', 'currentIndex']),
    extraState: state.getIn(['speedingStatisticsReducers', 'extraState']),
  }),
  dispatch => ({
    onInit: (payload) => {
      dispatch({ type: 'speedingStatistics/SAGA/INIT_ACTION', payload });
    },
    getDetails: (payload) => {
      dispatch({ type: 'speedingStatistics/SAGA/GET_DETAILS_ACTION', payload });
    },
    resetDetails: (payload) => {
      dispatch({ type: 'speedingStatistics/SAGA/RESET_DETAIL_ACTION', payload });
    },
    reset: () => {
      dispatch({ type: 'speedingStatistics/RESET_DATA' });
    },
  }),
)(SpeedingStatistics);