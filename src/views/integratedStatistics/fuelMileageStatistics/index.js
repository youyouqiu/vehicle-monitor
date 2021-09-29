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
import { judgeUserPollingOilMassMonitor, getPollingOilMassMonitor } from '../../../server/getData';
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

class FuelMileageStatistics extends Component {
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('fuelMileageStatistics'),
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
    detailsData: PropTypes.array,
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

  componentDidMount () {
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
    if (checkMonitors.item && checkMonitors.item.goTarget === 'fuelMileageStatistics') {
      const judgeFun = judgeUserPollingOilMassMonitor;
      const getDefaultMonitorFun = getPollingOilMassMonitor;
      judgeFun().then((res) => {
        if (res.statusCode === 200) {
          if (res.obj) {
            getDefaultMonitorFun({
              page: 1,
              pageSize: 20,
              defaultSize: checkMonitors.maxNum ? checkMonitors.maxNum : 100,
            }).then((result) => {
              if (result.statusCode === 200) {
                checkMonitors.monitors = result.obj.defaultCheckMonitorIdList;
                if (result.obj.defaultCheckMonitorIdList.length > 0) {
                  this.setState({
                    initStatus: '',
                  });
                }
              }
            });
          } else {
            toastShow(getLocale('notHasMonitor'), { duration: 2000 });
          }
        } else if (res.error === 'invalid_token') {
          storage.remove({
            key: 'loginState',
          });
          tokenOverdue();
        } else if (res.error === 'request_timeout') {
          NetworkModal.show({ type: 'timeout' });
        } else if (res.error !== 'network_lose_connected') {
          serviceError();
        } else {
          serviceConnectError();
        }
      });
    }
  }

  componentWillUnmount () {
    const { reset } = this.props;
    reset();
  }

  render () {
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
    initStatus: state.getIn(['fuelMileageStatisticsReducers', 'initStatus']),
    isSuccess: state.getIn(['fuelMileageStatisticsReducers', 'isSuccess']),
    barChartData: state.getIn(['fuelMileageStatisticsReducers', 'barChartData']),
    queryPeriod: state.getIn(['fuelMileageStatisticsReducers', 'queryPeriod']),
    detailsData: state.getIn(['fuelMileageStatisticsReducers', 'detailsData']),
    currentIndex: state.getIn(['fuelMileageStatisticsReducers', 'currentIndex']),
    extraState: state.getIn(['fuelMileageStatisticsReducers', 'extraState']),
  }),
  dispatch => ({
    onInit: (payload) => {
      dispatch({ type: 'fuelMileageStatistics/SAGA/INIT_ACTION', payload });
    },
    getDetails: (payload) => {
      dispatch({ type: 'fuelMileageStatistics/SAGA/GET_DETAILS_ACTION', payload });
    },
    resetDetails: (payload) => {
      dispatch({ type: 'fuelMileageStatistics/SAGA/RESET_DETAIL_ACTION', payload });
    },
    reset: () => {
      dispatch({ type: 'fuelMileageStatistics/RESET_DATA' });
    },
  }),
)(FuelMileageStatistics);