// 顶部导航公共组件
import React from 'react';
import {
  Image, View,
  StyleSheet, TouchableOpacity,
  // DeviceEventEmitter,
} from 'react-native';
import { back } from '../utils/routeCondition';
import goBackIco from '../static/image/goBack.png';

const styles = StyleSheet.create({
  leftTouch: {
    padding: 15,
  },
  leftIcon: {
    width: 10,
    height: 20,
  },
});

// 跳转监听
// const jumpEmit = (type) => {
//   // 发送监听，是否跳转路由（1-其他页面，21-实时视频，22-视频回放, 3-返回, 4-android返回键）
//   const message = type;
//   DeviceEventEmitter.emit('stopVideo', message);
//   DeviceEventEmitter.emit('stopBackVideo', message);
// };

const StackOptions = (route, title, rightView) => {
  const headerTitle = title;
  const headerStyle = {
    elevation: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'black',
    shadowOpacity: 0, // 透明度
    shadowRadius: 0,
    borderWidth: 0,
    borderBottomColor: '#339eff',
    backgroundColor: '#339eff',
  };

  const headerTitleStyle = {
    color: '#fff',
    textAlign: 'center',
  };
  const headerBackTitle = false;

  const isShowLeft = route.params?.isShowLeft;
  const headerLeft = () => (isShowLeft ? <View /> : (
    <TouchableOpacity
      style={styles.leftTouch}
      onPress={() => {
        // jumpEmit(3);
        back();
      }}
    >
      <Image
        style={styles.leftIcon}
        source={goBackIco}
      />
    </TouchableOpacity>
  ));
  const headerRight = rightView || (() => <View />);
  const isShowHeader = route.params?.isShowHeader;// 用于控制是否显示标题
  if (isShowHeader !== undefined && !isShowHeader) {
    return {
      header: null,
    };
  }
  return {
    headerStyle, headerTitle, headerTitleStyle, headerBackTitle, headerLeft, headerRight,
  };
};

export default StackOptions;