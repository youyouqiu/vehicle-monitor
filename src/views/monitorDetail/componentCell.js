import React, { Component } from 'react';
import { is } from 'immutable';
import {
  Text, View, StyleSheet, Image, TouchableOpacity,
  PanResponder,
} from 'react-native';
import PropTypes from 'prop-types';

// style
const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 26,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cell_title: {
    color: '#333',
    fontSize: 16,
  },
  cell_content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 10,
    alignItems: 'center',
  },
  cell_icon: {
    width: 35,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: '#e7e7e7',
    marginLeft: 10,
  },
  cell_text: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  txt: {
    width:200,
    textAlign:'right',
    fontSize: 16,
    color: '#999',
  },
});

class Cell extends Component {
  // 属性声明
  static propTypes ={
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    icon: PropTypes.string,
    onPressIcon: PropTypes.func,
  };

  static defaultProps ={
    icon: null,
    onPressIcon: () => {},
  };

  constructor(props){
    super(props);
    this.createpanResponder();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 手势触摸操作
  createpanResponder=() => {
    const {
      onPressIcon
    } = this.props;

    this.panResponderObj2 = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        onPressIcon();
      },
      onPanResponderTerminationRequest: () => true,
    });
  }

  render() {
    const {
      title, content, icon,
    } = this.props;

    return (
      <View style={styles.row}>
        {/* title */}
        <Text style={styles.cell_title}>
          {title}
        </Text>
        {/* title end */}

        <View style={styles.cell_content}>
          {/* text */}
          <View style={styles.cell_text}>
            <Text style={styles.txt}>
              {content}
            </Text>
          </View>
          {/* text end */}

          {/* icon */}
          {icon
            ? (
              <View style={styles.cell_icon}>
                <View 
                // onPress={onPressIcon}
                {...this.panResponderObj2.panHandlers}
                >
                  <Image
                    style={{
                      width: 22,
                      height: 24,
                    }}
                    source={icon}
                  />
                </View>
              </View>
            ) : null
            }
        </View>
        {/* icon end */}
      </View>
    );
  }
}

export default Cell;