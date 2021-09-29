// import {
//   Platform,
// } from 'react-native';

// toast提示方法
import Toast from 'react-native-root-toast';// 导入组件

let toast;
export const toastShow = (content, newOptions) => {
  if (toast !== undefined) {
    Toast.hide(toast);
  }
  const options = {
    duration: Toast.durations.SHORT,
    position: Toast.positions.CENTER,
    // position:Platform.OS === 'android' ? Toast.positions.CENTER : Toast.positions.CENTER,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
    textColor: '',
    backgroundColor: 'rgba(0,0,0,0.6)',
    ...newOptions,
  };
  toast = Toast.show(content.toString(), options);
  // toast = Toast.show(content, options);
};