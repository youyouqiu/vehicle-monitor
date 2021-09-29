import React, { Component } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableHighlight, Animated,
} from 'react-native';
import PropTypes from 'prop-types';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
const windowHeight = Dimensions.get('window').height; // 获取屏幕高度

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: windowWidth,
    height: windowHeight,
    backgroundColor: 'rgba(0,0,0,0)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCont: {
    maxWidth: windowWidth * 0.6,
    position: 'relative',
    top: -50,
    backgroundColor: 'rgba(109,109,109,0.8)',
    borderRadius: 5,
    padding: 10,
  },
  text: {
    textAlign: 'center',
    color: '#fff',
  },
});
export default class CommonAlert extends Component {
  static propTypes = {
    alertText: PropTypes.array.isRequired,
    ifShow: PropTypes.bool.isRequired,
    hideFun: PropTypes.func,
  }

  static defaultProps={
    hideFun: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      showStyle: {
        display: 'none',
        height: 0,
        opacity: 0,
      },
      fadeAnim: new Animated.Value(0),
    };
  }


  // props变化
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.timer) { clearTimeout(this.timer); }
    const { ifShow, hideFun } = nextProps;
    if (ifShow) {
      this.setState({
        showStyle: {},
        fadeAnim: new Animated.Value(0),
      }, () => {
        const { fadeAnim } = this.state;
        Animated.timing( // 随时间变化而执行动画
          fadeAnim, // 动画中的变量值
          {
            toValue: 1, // 透明度最终变为1，即完全不透明
            duration: 500, // 让动画持续一段时间
          },
        ).start();

        this.timer = setTimeout(() => {
          hideFun();
        }, 3000);
      });
    } else {
      this.setState({
        showStyle: {
          display: 'none',
          height: 0,
          opacity: 1,
        },
      });
    }
  }

  componentWillUnmount() {
    if (this.timer) { clearTimeout(this.timer); }
  }

  hide=() => {
    const { hideFun } = this.props;
    if (this.timer) { clearTimeout(this.timer); }
    hideFun();
  }


  render() {
    const { alertText } = this.props;
    const { showStyle, fadeAnim } = this.state;
    return (
      <TouchableHighlight
        onPress={this.hide}
        style={[styles.container, showStyle]}
        underlayColor="transparent"
      >
        <View style={[styles.container, showStyle]}>
          <Animated.View style={[styles.textCont, { opacity: fadeAnim }]}>
            {
            alertText.map(item => (
              <Text style={styles.text}>
                {item}
              </Text>
            ))
          }
          </Animated.View>
        </View>
      </TouchableHighlight>
    );
  }
}