import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import {
  ScrollView, View, StyleSheet,
  Text, TouchableOpacity,
} from 'react-native';
import {
  getCurAccont,
} from '../../server/getStorageData';
import { getLocale } from '../../utils/locales';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    paddingBottom: 10,
    backgroundColor: 'rgb(244,247,250)',
  },
  scrollBox: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 16,
    color: 'rgb(177,177,177)',
  },
  itemBox: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 20,
  },
  itemWrapper: {
    width: '33.3%',
    marginVertical: 5,
    paddingHorizontal: 6,
  },
  itemTouch: {
    width: '100%',
    padding: 6,
    // textAlign: 'center',
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  itemText: {
    color: '#333',
    textAlign: 'center',
  },
  emptyText: {
    width: '100%',
    marginTop: 30,
    fontSize: 16,
    textAlign: 'center',
    color: 'rgb(177,177,177)',
  },
});

class SearchHistory extends Component {
  static propTypes = {
    dataSource: PropTypes.array, // 数据
    getDataFun: PropTypes.func, // 获取数据源方法
    storeKey: PropTypes.string, // 存储的缓存key名
    checkCallBack: PropTypes.func.isRequired, // 选择记录后的回调方法
  }

  // 属性默认值
  static defaultProps = {
    dataSource: null,
    storeKey: '',
    getDataFun: undefined,
  }

  constructor(props) {
    super(props);
    this.state = {
      data: [],
      currentStoreKey: '',
    };
  }

  componentDidMount () {
    const { dataSource, getDataFun } = this.props;
    if (dataSource) {
      this.setState({
        data: dataSource,
      });
    } else if (typeof getDataFun === 'function') {
      this.getHistoryData();
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (nextProps) {
    const { storeKey } = nextProps;
    const { currentStoreKey } = this.state;
    if (currentStoreKey !== storeKey) {
      this.getHistoryData(storeKey);
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 获取显示数据
  getHistoryData = (newStoreKey) => {
    const { getDataFun, storeKey } = this.props;
    getDataFun().then((res) => {
      getCurAccont().then((userName) => {
        if (res) {
          const result = res[userName] || {};
          const data = result[newStoreKey || storeKey] || [];
          this.setState({
            data,
            currentStoreKey: newStoreKey || storeKey,
          });
        }
      });
    });
  }

  /**
   * 搜索记录选择
   */
  checkItem = (value) => {
    const { checkCallBack } = this.props;
    checkCallBack(value);
  }

  /**
   * 搜索记录渲染
   */
  renderItem = () => {
    const { data } = this.state;
    if (!data || data.length === 0) {
      return (
        <Text
          style={styles.emptyText}
          numberOfLines={1}
        >
          {getLocale('noInfo')}
        </Text>
      );
    }
    return data.map(item => (
      <View style={styles.itemWrapper} key={item}>
        <TouchableOpacity
          style={styles.itemTouch}
          onPress={() => { this.checkItem(item); }}
        >
          <Text
            style={styles.itemText}
            numberOfLines={1}
          >
            {item}
          </Text>
        </TouchableOpacity>
      </View>
    ));
  }


  render () {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollBox} keyboardShouldPersistTaps="always">
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {getLocale('searchHistoryTitle')}
          </Text>
          <View style={styles.itemBox}>
            {this.renderItem()}
          </View>
        </ScrollView>
      </View>
    );
  }
}

export default SearchHistory;