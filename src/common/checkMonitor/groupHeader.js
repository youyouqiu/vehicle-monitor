// 报警信息时间轴标题组件
import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { is } from 'immutable';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import wGroup from '../../static/image/wGroup2.png';
import isCheck from '../../static/image/check2.png';
import hasCheck from '../../static/image/check1.png';
import noCheck from '../../static/image/check.png';

const styles = StyleSheet.create({
  panel_head: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    overflow: 'hidden',
  },
  panel_title: {
    flex: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  img: {
    width: 20,
    height: 17,
    marginRight: 10,
    marginLeft: 15,
  },
  title_box: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    maxWidth: '80%',
    fontSize: 15,
    color: '#333',
  },
  count: {
    fontSize: 15,
    color: '#6dcff6',
    marginLeft: 5,
  },
  panel_check: {
    padding: 10,
    paddingRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel_img: {
    width: 18,
    height: 18,
  },
});

class GroupHeader extends Component {
  static propTypes = {
    item: PropTypes.objectOf({
      assName: PropTypes.string,
      total: PropTypes.number,
      assId: PropTypes.string,
      check: PropTypes.bool,
      hasCheckItem: PropTypes.bool,
    }).isRequired,
    tapFun: PropTypes.func.isRequired,
    checkItem: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      assName: '',
      total: 0,
      check: false,
      hasCheckItem: false,
    };
  }

  componentDidMount=() => {
    const { item } = this.props;
    this.setState({
      assName: item.assName,
      total: item.total,
      check: item.check,
      hasCheckItem: item.hasCheckItem,
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { item } = nextProps;
    this.setState({
      assName: item.assName,
      total: item.total,
      check: item.check,
      hasCheckItem: item.hasCheckItem,
    });
  }

  shouldComponentUpdate(nextProps) {
    return this.isPropsEqual(nextProps);
  }

  isPropsEqual(nextProps) {
    const {
      check, hasCheckItem, assName, total,
    } = this.state;
    const {
      assName: assName1, total: total1, check: check1, hasCheckItem: hasCheckItem1,
    } = nextProps.item;
    if (check !== check1) return true;
    if (hasCheckItem !== hasCheckItem1) return true;
    if (assName !== assName1) return true;
    if (total !== total1) return true;
    return false;
  }

  tapItem=() => {
    const { tapFun, index } = this.props;
    if (typeof tapFun === 'function') {
      tapFun(index);
    }
  }

  checkTap=() => {
    const { checkItem, index, item } = this.props;
    if (typeof checkItem === 'function') {
      checkItem('group', item.assId, !item.check, index);
    }
  }

  getImg=() => {
    const {
      check, hasCheckItem,
    } = this.state;
    if (check) return isCheck;
    if (hasCheckItem) return hasCheck;
    return noCheck;
  }

  render() {
    const {
      assName, total,
    } = this.state;

    return (
      <View style={styles.panel_head}>
        <TouchableOpacity
          style={styles.panel_title}
          // activeOpacity={0.6}
          onPress={() => { this.tapItem(); }}
        >
          <Image
            source={wGroup}
            style={styles.img}
          />
          <View style={styles.title_box}>
            <Text style={{flex:1}}>
            <Text
              style={styles.title}
              numberOfLines={1}
            >
              {assName}
            </Text>
            <Text style={styles.count}>
              {total !== 0 ? `(${total})` : null}
            </Text>
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.panel_check}
          onPress={() => { this.checkTap(); }}
        >
          <Image
            style={styles.panel_img}
            source={this.getImg()}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

export default GroupHeader;