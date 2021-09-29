import React, { Component } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  Dimensions,
  TouchableHighlight,
} from 'react-native';
import PropTypes from 'prop-types';
import deleteIcon from '../../../static/image/delete.png'; // 删除图标

const inputWidth = Dimensions.get('window').width * 0.8; // 获取input宽度

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerItem: {
    width: inputWidth,
    height: 55,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e8e8e8',
    paddingLeft: 40,
    paddingRight: 40,
    position: 'relative',
    // backgroundColor: '#fff',
  },
  text: {
    lineHeight: 55,
  },
  iconRight: {
    width: 18,
    height: 18,
  },
  touchableHighlight2: {
    position: 'absolute',
    right: 16,
    top: 18,
    width: 18,
    height: 18,
    zIndex: 10,
  },
});

export default class HistoryLogin extends Component {
  static propTypes = {
    accontList: PropTypes.array,
    deleteFun: PropTypes.func,
    chooseAccont: PropTypes.func,
    style: PropTypes.any, // 样式
  }

  static defaultProps = {
    accontList: null,
    deleteFun: null,
    chooseAccont: null,
    style: {},
  }

  // 删除按钮点击事件
  deleteIconPress(item, index) {
    const { accontList, deleteFun = null } = this.props;
    if (deleteFun) {
      deleteFun(accontList, index);
    }
  }

  // 选择历史账号
  chooseAccont(item) {
    const { chooseAccont = null } = this.props;
    if (chooseAccont) {
      chooseAccont(item);
    }
  }

  render() {
    const { accontList, style } = this.props;
    const ifAccontList = (accontList !== null);
    return (
      <View style={[styles.container, style]}>
        {
          ifAccontList ? (
            accontList.length > 0 && accontList.map((item, index) => (
              <View
                style={styles.containerItem}
                key={item.accont}
              >
                <TouchableHighlight
                  underlayColor="transparent"
                  onPress={() => this.chooseAccont(item)}
                  hitSlop={{
                    top: 20, bottom: 20, left: 30, right: 30,
                  }}
                >
                  <Text style={styles.text}>
                    {item.accont}
                  </Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={[styles.touchableHighlight2]}
                  underlayColor="transparent"
                  onPress={() => this.deleteIconPress(item.accont, index)}
                >
                  <Image
                    style={[styles.iconRight]}
                    source={deleteIcon}
                  />
                </TouchableHighlight>
              </View>
            ))

          ) : (null)
        }
      </View>
    );
  }
}