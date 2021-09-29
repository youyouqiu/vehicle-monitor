import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View, Text, StyleSheet, Image, Dimensions
} from 'react-native';

import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import wArrowRight from '../../static/image/wArrowRight.png';
// import wGroup from '../../static/image/wGroup.png';
import wGroup from '../../static/image/wGroup2.png';
const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

// style
const styles = StyleSheet.create({
  panel_head: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    overflow: 'hidden',
  },
  panel_title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  img: {
    width: 21,
    height: 18,
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
    color: '#000',
  },
  count: {
    fontSize: 15,
    color: '#6dcff6',
    marginLeft: 5,
  },
  panel_icon: {
    width: 25,
    height: 25,
    marginRight: 5,
  },
  rotate: {
    transform: [
      // 角度
      { rotate: '90deg' },
    ],
  },
});

class PanelHead extends Component {
  // 属性声明
  static propTypes ={
    title: PropTypes.string.isRequired,
    count: PropTypes.number,
    isActive: PropTypes.bool,
  };

  static defaultProps ={
    isActive: false,
    count: 0,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    const { title, isActive, count } = this.props;
    return (
      <View style={styles.panel_head}>
        <View style={styles.panel_title}>
          <Image
            source={wGroup}
            style={styles.img}
          />
          <View style={styles.title_box}>
            <Text
              style={[styles.title, { width: windowWidth / 5 * 4 }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={styles.count}>
              {count !== 0 ? `(${count})` : null}
            </Text>
          </View>

        </View>

        <Animatable.Image
          duration={300}
          transition="rotate"
          source={wArrowRight}
          style={[styles.panel_icon, isActive ? styles.rotate : null]}
        />
      </View>
    );
  }
}

export default PanelHead;