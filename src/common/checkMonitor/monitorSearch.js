// 报警中心监控对象搜索组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Image,
  View,
  StyleSheet,
  Platform,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  Keyboard,
} from 'react-native';
import TextInput from '../textInput';
import SearchInput from './searchInput';
import search from '../../static/image/search.png';
import deleteIcon from '../../static/image/delete.png';
import { getLocale } from '../../utils/locales';

const styles = StyleSheet.create({
  searchTabs: {
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: '#eae6e6',
  },
  searchTab: {
    padding: 15,
    marginRight: 4,
    borderBottomWidth: 2,
    borderStyle: 'solid',
    borderBottomColor: 'transparent',
  },
  searchTabActive: {
    borderBottomColor: 'rgb(66,135,255)',
  },
  searchText: {
    fontSize: 16,
    color: '#333',
  },
  searchTextActive: {
    color: 'rgb(66,135,255)',
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: '#eae6e6',
    backgroundColor: 'rgb(244,247,250)',
  },
  clearText: {
    height: 40,
    lineHeight: 40,
    marginVertical: 10,
    paddingLeft: 15,
    fontSize: 17,
    color: 'rgb(66,135,255)',
  },
  searchBox: {
    flex: 1,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eae6e6',
    borderStyle: 'solid',
    backgroundColor: '#fff',
  },
  inputStyle: {
    height: 40,
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  searchIcon: {
    width: 18,
    height: 18,
  },
  searchBg: { width: 26, textAlign: 'center' },
  clearIcon: {
    width: 18,
    height: 18,
    marginRight: 5,
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

class MonitorSearch extends Component {
  static propTypes = {
    searchFun: PropTypes.func.isRequired,
    changeHistoryStoreKey: PropTypes.bool.isRequired,
    changeHistoryVisible: PropTypes.bool.isRequired,
    cancelVisible: PropTypes.bool.isRequired,
    inputValue: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      activeTab: 0,
      clearShow: false,
      changeFlag: false, // 搜索tab切换
      searchFlag: false, // 用户是否执行过查询操作
      clearTextVisible: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { inputValue, cancelVisible } = nextProps;
    const { clearTextVisible } = this.state;
    if (inputValue) {
      this.setState({
        value: inputValue,
      }, () => {
        this.searchClick();
      });
    }
    // 点击安卓物理返回键时,隐藏取消文字按钮
    if (cancelVisible !== null && clearTextVisible !== cancelVisible) {
      this.setState({
        value: '',
        clearShow: false,
        searchFlag: false,
        clearTextVisible: cancelVisible,
      });
    }
  }

  // 监听输入框变化
  chanegeTextKeyword=(text) => {
    const reg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{0,20}$/;// 输入框输入限制
    if (Platform.OS === 'ios' || reg.test(text)) {
      this.setState({
        value: text,
        clearShow: true,
      });
    }
  }

  // 获取焦点
  foucus=() => {
    const { changeHistoryVisible } = this.props;
    this.setState({
      clearShow: true,
      clearTextVisible: true,
    });
    changeHistoryVisible(true);
  }

  // 失去焦点
  blur=() => {
    this.setState({
      clearShow: false,
    });
  }

  // 清空input
  clearTxt=() => {
    this.setState({
      value: '',
    });
  }

  // 模糊搜索监控对象
  searchClick=() => {
    const { searchFun } = this.props;
    const { value, activeTab } = this.state;
    if (typeof searchFun === 'function' && value) {
      Keyboard.dismiss();
      this.setState({
        changeFlag: false,
        searchFlag: true,
      });
      searchFun({ search: value, searchType: activeTab });
    }
  }

  // 搜索类型页签切换
  changeTab=(value) => {
    const { activeTab } = this.state;
    const { changeHistoryStoreKey } = this.props;
    if (activeTab !== value) {
      this.setState({
        value: '',
        changeFlag: true,
        clearShow: false,
        activeTab: value,
      });
      changeHistoryStoreKey(value);
    }
  }

  // 隐藏搜索项
  hideSearch=() => {
    const { changeHistoryVisible } = this.props;
    Keyboard.dismiss();
    this.setState({
      value: '',
      changeFlag: false,
      searchFlag: false,
      clearTextVisible: false,
    });
    changeHistoryVisible(false);
  }

  render() {
    const {
      clearShow, value, activeTab,
      searchFlag, changeFlag, clearTextVisible,
    } = this.state;
    return (
      <View>
        <View style={styles.searchTabs}>
          <TouchableOpacity
            activeOpacity={0.6}
            style={[styles.searchTab, activeTab === 0 ? styles.searchTabActive : '']}
            onPress={() => { this.changeTab(0); }}
          >
            <Text style={[styles.searchText, activeTab === 0 ? styles.searchTextActive : '']}>{getLocale('monitorName')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.6}
            style={[styles.searchTab, activeTab === 1 ? styles.searchTabActive : '']}
            onPress={() => { this.changeTab(1); }}
          >
            <Text style={[styles.searchText, activeTab === 1 ? styles.searchTextActive : '']}>{getLocale('assigmentName')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            {searchFlag && changeFlag
              ? (
                // 此组件用于实现切换搜索tab后,输入框自动聚焦功能
                <SearchInput
                  style={styles.inputStyle}
                  placeholder={activeTab === 0 ? getLocale('inputMonitorName') : getLocale('inputAssigmentName')}
                  placeholderTextColor="rgb(208,208,214)"
                  underlineColorAndroid="transparent"
                  value={value}
                  maxLength={10}
                  autoFocus
                  clearButtonMode="while-editing"
                  onChangeText={this.chanegeTextKeyword}
                  onSubmitEditing={this.searchClick}
                  onFocus={this.foucus}
                  onBlur={this.blur}
                />
              )
              : (
                <TextInput
                  style={styles.inputStyle}
                  placeholder={activeTab === 0 ? getLocale('inputMonitorName') : getLocale('inputAssigmentName')}
                  placeholderTextColor="rgb(208,208,214)"
                  underlineColorAndroid="transparent"
                  value={value}
                  maxLength={10}
                  clearButtonMode="while-editing"
                  onChangeText={this.chanegeTextKeyword}
                  onSubmitEditing={this.searchClick}
                  onFocus={this.foucus}
                  onBlur={this.blur}
                />
              )
            }
            {
            Platform.OS === 'ios'
              ? (
                <TouchableOpacity
                  activeOpacity={0}
                  onPress={this.clearTxt}
                  style={styles.clearMask}
                />
              )
              : (
                <TouchableOpacity
                  onPress={this.clearTxt}
                  style={!clearShow ? styles.hide : null}
                >
                  <Image
                    style={styles.clearIcon}
                    source={deleteIcon}
                  />
                </TouchableOpacity>
              )
            }
            <TouchableHighlight
              style={[styles.searchIcon, styles.searchBg]}
              underlayColor="transparent"
              onPress={this.searchClick}
            >
              <Image
                source={search}
                resizeMode="contain"
                style={styles.searchIcon}
              />
            </TouchableHighlight>
          </View>
          {clearTextVisible
            ? (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={this.hideSearch}
                style={styles.clearTouch}
              >
                <Text style={styles.clearText}>{getLocale('cancel')}</Text>
              </TouchableOpacity>
            )
            : null
          }
        </View>
      </View>
    );
  }
}

export default MonitorSearch;