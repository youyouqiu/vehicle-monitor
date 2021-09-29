import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import FooterNav from './footerNav';
import showImg from '../../static/image/ledBillboard.png';
import PublicNavBar from '../../common/newPublicNavBar';
import { getLocale } from '../../utils/locales';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  view: {
    flex: 1,
  },
  footerView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 70,
    width,
    borderTopColor: '#dbdbdb',
    borderTopWidth: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 70,
    right: 0,
    // width,
    // height,
    backgroundColor: '#ffffff',
  },
  contentImg: {
    flex: 1,
    width,
  },
});

class LedBillboard extends Component {
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('ledBillboardTitle'),
  )

  static propTypes = {
    navigation: PropTypes.objectOf.isRequired, // 导航配置
    getMonitorIds: PropTypes.func,
  }

  static defaultProps ={
    getMonitorIds: null,
  }

  componentDidMount() {
    const { getMonitorIds, navigation } = this.props;
    getMonitorIds(null);
    navigation.setParams({
      isShowLeft: true,
    });
  }

  render() {
    return (
      <View style={styles.view}>
        <View style={styles.content}>
          <Image
            source={showImg}
            resizeMode="contain"
            style={styles.contentImg}
          />
        </View>
        <View style={styles.footerView}>
          <FooterNav />
        </View>
      </View>
    );
  }
}

export default connect(
  null,
  dispatch => ({
    getMonitorIds: (activeMonitor) => {
      dispatch({ type: 'home/SAGA/GET_MONITOR_IDS', activeMonitor });
    },
  }),
)(LedBillboard);