// 报警中心监控对象搜索组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  Image,
  View,
  // TextInput,
  StyleSheet,
  Platform,
  TouchableHighlight,
  TouchableOpacity,
} from 'react-native';
import TextInput from '../../../common/textInput';
import { getLocale } from '../../../utils/locales';
import search from '../../../static/image/search.png';
import deleteIcon from '../../../static/image/delete.png';

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 20,
    backgroundColor: 'rgb(244,247,250)',
  },
  searchBox: {
    // marginHorizontal: 20,
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
  searchBg: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    onChanegeTextKeyword: PropTypes.func.isRequired,
    searchFun: PropTypes.func.isRequired,
    resetData: PropTypes.func.isRequired,
    clearType: PropTypes.bool.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      clearShow: false,
      searchFlag: false, // 用户是否执行错查询操作
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps && nextProps.clearType === true) {
      this.clearTxt();
    }
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 监听输入框变化
  chanegeTextKeyword=(text) => {
    const { onChanegeTextKeyword } = this.props;
    const reg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{0,20}$/;// 输入框输入限制
    // const newText = text.replace(/[^0-9a-zA-Z\u4e00-\u9fa5-]/g, '');
    if (Platform.OS === 'ios' || reg.test(text)) {
      this.setState({
        value: text,
      });
      if (onChanegeTextKeyword) {
        onChanegeTextKeyword(text);
        this.setState({
          searchFlag: true,
        });
      }
    }
  }

  // 获取焦点
  foucus=() => {
    this.setState({
      clearShow: true,
    });
  }

  // 失去焦点
  blur=() => {
    this.setState({
      clearShow: false,
    });
  }

  // 清空input
  clearTxt=() => {
    const { resetData } = this.props;
    const { searchFlag } = this.state;

    this.setState({
      value: '',
      // clearShow: false,
      searchFlag: false,
    });
    this.chanegeTextKeyword('');
    if (searchFlag) {
      resetData();
    }
  }

  // 模糊搜索监控对象
  searchClick=() => {
    const { searchFun } = this.props;
    if (typeof searchFun === 'function') {
      searchFun();
    }
  }

  render() {
    const { clearShow, value } = this.state;
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.inputStyle}
            placeholder={getLocale('searchTitle')}
            placeholderTextColor="rgb(208,208,214)"
            underlineColorAndroid="transparent"
            value={value}
            maxLength={20}
            // onKeyPress={this.onKeyPress}
            clearButtonMode="while-editing"
            onChangeText={this.chanegeTextKeyword}
            onSubmitEditing={this.searchClick}
            onFocus={this.foucus}
            onBlur={this.blur}
          />
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
      </View>
    );
  }
}

export default MonitorSearch;