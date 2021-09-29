import React, { Component } from 'react';
import { is } from 'immutable';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  // TextInput,
  Platform,
  Image,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { PropTypes } from 'prop-types';
import TextInput from '../../common/textInput';

import { getLocale } from '../../utils/locales';
import wSearch from '../../static/image/wSearch.png';
import deleteIcon from '../../static/image/delete.png';
import storage from '../../utils/storage';
import { getUserStorage, getCurAccont } from '../../server/getStorageData';

// style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    height: 40,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  input: {
    borderBottomWidth: 0,
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  search: {
    width: 22,
    height: 22,
    marginLeft: 10,
  },
  voice: {
    width: 15,
    height: 22,
    marginRight: 10,
  },
  clear: {
    width: 18,
    height: 18,
  },
  hide: {
    display: 'none',
  },
  clearMask: {
    position: 'absolute',
    right: 5,
    width: 18,
    height: 18,
  },
});

class SearchInput extends Component {
  static propTypes = {
    monitorSearchAction: PropTypes.func.isRequired,
    emptySearchAction: PropTypes.func.isRequired,
    loadSearchAction: PropTypes.func.isRequired,
    changeHistoryValueAction: PropTypes.func.isRequired,
    handleStatus: PropTypes.bool.isRequired,
  }

  // 属性默认值
  static defaultProps = {
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      clearShow: false,
      page: 0,
    };
    getCurAccont().then((userName) => {
      this.state.userName = userName;
    });
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (nextProps) {
    const { historyValue } = nextProps;
    if (historyValue) {
      this.setState({
        value: historyValue,
      }, () => {
        this.search();
      });
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 搜索
  search = () => {
    const {
      monitorSearchAction, loadSearchAction, emptySearchAction, handleStatus,
    } = this.props;
    const { value } = this.state;

    if (!handleStatus) return;
    emptySearchAction();
    if (value) {
      Keyboard.dismiss();

      loadSearchAction();
      monitorSearchAction({
        fuzzyParam: value,
      });
      this.setState({
        page: 1,
      });
      getUserStorage().then((res) => {
        this.updateStore(res, value);
      }).catch(() => {
        this.updateStore({}, value);
      });
    }
    this.showHistory({ historyValue: null, searchHistoryVisible: false });
  }

  // 更新用户缓存中的搜索历史数据
  updateStore = (res, value) => {
    const { userName } = this.state;
    const result = res || {};
    const userObj = result[userName] || {};
    const data = userObj.searchHistory || [];
    const index = data.indexOf(value);
    if (index !== -1) {
      data.splice(index, 1);
    } else if (data.length >= 21) {
      data.splice(-1, 1);
    }
    data.unshift(value);
    if (result[userName]) {
      result[userName].searchHistory = data;
    } else {
      result[userName] = {
        searchHistory: data,
      };
    }
    storage.save({
      key: 'userStorage',
      data: result,
    });
  }

  // input发生改变
  inputChange = (val) => {
    const reg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{0,20}$/;// 输入框输入限制
    if (Platform.OS === 'ios' || reg.test(val)) {
      this.setState({ value: val });
    }
  }

  // 获取焦点
  foucus = () => {
    this.setState({
      clearShow: true,
    }, () => {
      this.showHistory({ historyValue: null, searchHistoryVisible: true });
    });
  }

  // 失去焦点
  blur = () => {
    const { value } = this.state;
    if (value === '') {
      this.setState({
        clearShow: false,
      });
    } else {
      this.setState({
        clearShow: true,
      });
    }
  }

  // 清空input
  clear = () => {
    const { emptySearchAction, handleStatus } = this.props;
    const { page } = this.state;
    if (!handleStatus) return;
    this.setState({
      value: '',
      page: 0,
    });

    if (page === 1) {
      emptySearchAction();
      Keyboard.dismiss();
      this.showHistory({ historyValue: null, searchHistoryVisible: false });
    }
  }

  showHistory = (valueObj) => {
    const { changeHistoryValueAction } = this.props;
    changeHistoryValueAction(valueObj);
  }

  render () {
    const { handleStatus } = this.props;
    const { value, clearShow } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder={getLocale('searchInputPlaceholder')}
            placeholderTextColor="#888"
            underlineColorAndroid="transparent"
            selectionColor="#3399FF"
            value={value}
            maxLength={20}
            onChangeText={this.inputChange}
            onFocus={this.foucus}
            onBlur={this.blur}
            editable={handleStatus}
            onSubmitEditing={this.search}// 软键盘确定/搜索被点击
            clearButtonMode="while-editing"
          />

          {
            Platform.OS === 'ios'
              ? (
                <TouchableOpacity
                  activeOpacity={0}
                  onPress={this.clear}
                  style={styles.clearMask}
                />
              )
              : (
                <TouchableOpacity
                  onPress={this.clear}
                  style={!clearShow ? styles.hide : null}
                >
                  <Image
                    style={styles.clear}
                    source={deleteIcon}
                  />
                </TouchableOpacity>
              )
          }

        </View>
        <View>
          <TouchableOpacity
            onPress={this.search}
          >
            <Image
              source={wSearch}
              style={styles.search}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default connect(
  state => ({
    historyValue: state.getIn(['monitorSearchReducers', 'historyValue']),
    handleStatus: state.getIn(['monitorSearchReducers', 'handleStatus']),
  }),
  dispatch => ({
    monitorSearchAction: (params) => {
      dispatch({ type: 'monitorSearch/SAGA/SEARCH_MONITOR_ACTION', params });// 搜索
    },
    emptySearchAction: () => {
      dispatch({ type: 'monitorSearch/SEARCH_EMPTY_ACTION' });// 清空搜索
    },
    loadSearchAction: () => {
      dispatch({ type: 'monitorSearch/SEARCH_LOADING_ACTION' });// 搜索加载
    },
    // 改变搜索历史显示或者搜索框的值
    changeHistoryValueAction: (datas) => {
      dispatch({ type: 'monitorSearch/CHANGE_HISTORYVALUE_ACTION', datas });
    },
  }),
)(SearchInput);