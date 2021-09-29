import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  StyleSheet, Image, TouchableOpacity,
  View, Keyboard,
} from 'react-native';
import { back } from '../../utils/routeCondition';
import SearchInput from './componentSearchInput';
import goBack from '../../static/image/goBack.png';

// style
const styles = StyleSheet.create({
  container: {
    paddingRight: 15,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#339eff',
  },
  back: {
    paddingHorizontal: 15,
  },
  backIcon: {
    width: 10,
    height: 20,
  },
});

class NavBar extends Component {
  static propTypes = {
    changeHistoryValueAction: PropTypes.func.isRequired,
    searchHistoryVisible: PropTypes.bool.isRequired,
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  backFun = () => {
    const { searchHistoryVisible, changeHistoryValueAction } = this.props;
    if (!searchHistoryVisible) {
      back(); // 返回上一页
    }
    Keyboard.dismiss();
    changeHistoryValueAction({ searchHistoryVisible: false });
    return true;
  }

  render () {
    return (
      <View
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.back}
          onPress={this.backFun}
        >
          <Image
            style={styles.backIcon}
            source={goBack}
          />
        </TouchableOpacity>

        <SearchInput />
      </View>
    );
  }
}

export default connect(
  state => ({
    searchHistoryVisible: state.getIn(['monitorSearchReducers', 'searchHistoryVisible']), // 搜索历史显示
  }),
  dispatch => ({
    // 改变搜索历史显示或者搜索框的值
    changeHistoryValueAction: (datas) => {
      dispatch({ type: 'monitorSearch/CHANGE_HISTORYVALUE_ACTION', datas });
    },
  }),
)(NavBar);