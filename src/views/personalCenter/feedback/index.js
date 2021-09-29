import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  // TextInput,
  Text,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextInput from '../../../common/textInput';
import { go } from '../../../utils/routeCondition';
import { getLocale } from '../../../utils/locales';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
// import Title from '../component/title';
import Loading from '../../../common/loading';
import { toastShow } from '../../../utils/toastUtils';// 导入toast

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#F4F7FA',
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 26,
    paddingVertical: 10,
    width: windowWidth,
    marginTop: 10,
  },
  textInput: {
    height: 120,
    padding: 0,
  },
  showNumberBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  btn_box: {
    width: '100%',
    paddingHorizontal: 26,
  },
  btn: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#4287ff',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
});

class Feedback extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('feedbackTitle'),
  )

  // static navigationOptions = ({ navigation }) => ({
  //   header: (
  //     <PublicNavBar title={getLocale('feedbackTitle')} nav={navigation} />
  //   ),
  // })

  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
    feedBackAction: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
  }

  static defaultProps = {
    monitors: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      inputNum: 0,
      load: false, // 加载loading
    };
  }

  UNSAFE_componentWillReceiveProps (nextprops) {
    const { result, errReason } = nextprops;
    // 提交成功
    if (result) {
      if (errReason === '') {
        this.setState({
          value: '',
          load: false,
        });
        toastShow(getLocale('feedbackSuccess'), { duration: 2000 });
        go('personalCenter');
      }
    } else {
      this.setState({
        load: false,
      });
    }
  }

  // input 发生改变
  onChangeText = (val) => {
    const num = val.length;
    this.setState({
      value: val,
      inputNum: num,
    });
  }

  // 提交
  sendFeedBack = () => {
    const { value } = this.state;
    const { feedBackAction } = this.props;

    if (value === '') {
      toastShow(getLocale('feedbackEmpty'), { duration: 2000 });
      return;
    }

    // const pattern = new RegExp("[~'!@#$%^&]");// 过滤特殊字符
    const pattern = new RegExp('\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]');// 过滤表情符号
    if (pattern.test(value)) {
      toastShow(getLocale('feedBackErr'), { duration: 2000 });
      return;
    }

    // const regStr1 = /<script.*?>.*?<\/script>/ig;
    // value.replace(regStr1, '');// 过滤掉换行符，脚本
    const regStr2 = /\\/g;
    const val = Platform.OS === 'android' ? value.replace(regStr2, '%5c') : value;
    feedBackAction({
      feedback: val,
    });
    this.setState({
      load: true,
    });
  }

  componentWillUnmount () {
    const { reset } = this.props;
    reset();
  }

  render () {
    const { value, inputNum, load } = this.state;
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      const { activeMonitor: A } = params.activeMonitor;
      activeMonitor = A;
    }
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <TouchableOpacity
          onPress={Keyboard.dismiss}
          activeOpacity={1}
          style={styles.body}
        >
          <View style={styles.body}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              {/* <Title title={getLocale('feedbackTitle')} /> */}
              <View style={styles.container}>

                <TextInput
                  multiline
                  placeholder={getLocale('feedbackPlaceholder')}
                  style={styles.textInput}
                  underlineColorAndroid="transparent"
                  textAlignVertical="top"
                  maxLength={getLocale('feedbackCount')}
                  value={value}
                  onChangeText={this.onChangeText}
                />
                <View style={styles.showNumberBox}>
                  <Text>
                    {inputNum}
                  </Text>
                  <Text>
                    {' '}/ {getLocale('feedbackCount')}
                  </Text>
                </View>
              </View>

              <View style={styles.btn_box}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={this.sendFeedBack}
                >
                  {
                    load ? <Loading type="inline" style={{ height: '100%' }} /> : (
                      <Text style={styles.btnText}>
                        {getLocale('feedbackRefer')}
                      </Text>
                    )
                  }
                </TouchableOpacity>
              </View>
            </View>

            <ToolBar
              activeMonitor={activeMonitor}
              monitors={monitors}
            />
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    result: state.getIn(['feedBackReducers', 'result']), // 发送结果
    errReason: state.getIn(['feedBackReducers', 'errReason']), // 错误信息
    key_: state.getIn(['feedBackReducers', 'key_']), // 随机数
  }),
  dispatch => ({
    feedBackAction: (params) => {
      dispatch({ type: 'feedBack/SAGA/SEND_FEEDBACK_ACTION', params });// 意见反馈提交
    },
    reset: () => {
      dispatch({ type: 'feedBack/RESET_DATA' });
    },
  }),
)(Feedback);
