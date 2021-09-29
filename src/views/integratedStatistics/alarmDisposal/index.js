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

class AlarmDisposal extends Component {
  data = {
    startTime: null,
    oldStartTime: null,
  }


  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('alarmDisposal'),
  )

  static propTypes = {
    navigation: PropTypes.object.isRequired,
    startTime: PropTypes.object,
    endTime: PropTypes.object,
    monitors: PropTypes.object,
    checkMonitors: PropTypes.object.isRequired,
    activeMonitor: PropTypes.object,
    initStatus: PropTypes.string.isRequired,
    barChartData: PropTypes.object,
    isSuccess: PropTypes.bool.isRequired,
    queryPeriod: PropTypes.number.isRequired,
    onInit: PropTypes.func.isRequired,
    disposalData: PropTypes.object,
    detailsData: PropTypes.object,
    getDetailData: PropTypes.func.isRequired,
    resetDetails: PropTypes.func.isRequired,
    currentIndex: PropTypes.number,
    extraState: PropTypes.object,
    route: PropTypes.object.isRequired,
    reset: PropTypes.func.isRequired,
  }

  static defaultProps = {
    activeMonitor: null,
    monitors: null,
    barChartData: null,
    detailsData: null,
    startTime: null,
    endTime: null,
    disposalData: null,
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
      isFilter: true,
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
    initStatus: state.getIn(['alarmDisposalReducers', 'initStatus']),
    queryPeriod: state.getIn(['alarmDisposalReducers', 'queryPeriod']),
    isSuccess: state.getIn(['alarmDisposalReducers', 'isSuccess']),
    barChartData: state.getIn(['alarmDisposalReducers', 'barChartData']),
    disposalData: state.getIn(['alarmDisposalReducers', 'disposalData']),
    detailsData: state.getIn(['alarmDisposalReducers', 'detailsData']),
    currentIndex: state.getIn(['alarmDisposalReducers', 'currentIndex']),
    extraState: state.getIn(['alarmDisposalReducers', 'extraState']),
  }),
  dispatch => ({
    onInit: (payload) => {
      dispatch({ type: 'alarmDisposal/SAGA/INIT_ACTION', payload });
    },
    getDetailData: (payload) => {
      dispatch({ type: 'alarmDisposal/SAGA/GET_DETAILS_ACTION', payload });
    },
    resetDetails: (payload) => {
      dispatch({ type: 'alarmDisposal/SAGA/RESET_DETAIL_ACTION', payload });
    },
    reset: () => {
      dispatch({ type: 'alarmDisposal/RESET_DATA' });
    },
  }),
)(AlarmDisposal);