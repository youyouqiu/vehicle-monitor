import React, { Component } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import PublicNavBar from '../../common/newPublicNavBar';
import { getLocale } from '../../utils/locales';
import Panel from './componentPanel';
import ToolBar from '../../common/toolBar';

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
class Index extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('securityTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
  }

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  componentDidMount() {

  }

  render() {
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.body}>
          <Panel />

          <ToolBar
            activeMonitor={activeMonitor}
            monitors={monitors}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
  }),
  null,
)(Index);
