import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  // Image,
  Dimensions,
  Linking,
  Clipboard,
  // TouchableHighlight,
//   Animated,
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import { getLocale } from '../../../utils/locales';
import ToolBar from '../../../common/toolBar';
import Loading from '../../../common/loading';
import Cell from './componentCell';
import phoneIcon from '../../../static/image/phoneIcon.png';
import eamilIcon from '../../../static/image/emailIcon.png';
import { toastShow } from '../../../utils/toastUtils';// 导入toast
import { isEmpty } from '../../../utils/function';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度


const styles = StyleSheet.create({
  body: {
    backgroundColor: '#F4F7FA',
    flex: 1,
    // alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginTop: 10,
  },
  textColor: {
    color: '#333',
    fontSize: 16,
    paddingRight: 20,
  },
  rightTextColor: {
    fontSize: 16,
    color: '#969696',
    flex: 1,
    textAlign: 'right',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  rightCont: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  rightContIcon: {
    width: 20,
    height: 22,
    marginLeft: 10,
  },
});

class UserInfo extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('userinfoTit'),
  )
  // static navigationOptions = ({ navigation }) => ({
  //   header: (
  //     <PublicNavBar title={getLocale('userinfoTit')} nav={navigation} />
  //   ),
  // })

  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
    userInfoAction: PropTypes.func.isRequired,
  }

  static defaultProps = {
    monitors: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      load: false,
      userMsg: [],
    };
  }

  componentDidMount() {
    const { userInfoAction } = this.props;
    this.setState({
      load: true,
    });
    userInfoAction();
  }

  UNSAFE_componentWillReceiveProps(nextprops) {
    const { userInfo, errReason } = nextprops;
    if (errReason === '') {
      if (!isEmpty(userInfo)) {
        this.setState({
          load: false,
          userMsg: userInfo,
        });
      }
    } else {
      this.setState({
        load: false,
      });
    }
  }

  // 复制图标
  // copyRender=(title, content) => {
  //   if (!content) {
  //     return null;
  //   }

  //   return (
  //     <View>
  //       <TouchableHighlight
  //         onPress={() => { this.copy(title, content); }}
  //         underlayColor="transparent"
  //       >
  //         <Image source={eamilIcon} style={styles.rightContIcon} />
  //       </TouchableHighlight>
  //     </View>

  //   );
  // }

  // 电话拨号
  phoneCall=(url) => {
    const phone = `tel:${url}`;
    Linking.canOpenURL(phone).then((res) => {
      if (!res) {
        toastShow(getLocale('callToast'), { duration: 2000 });
        return false;
      }
      return Linking.openURL(phone);
    });
  }

  // 复制
  copy(title, content) {
    if (!content) {
      return;
    }
    Clipboard.setString(content);
    toastShow(`${title}${getLocale('copyToast')}`, { duration: 2000 });
  }

  render() {
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }
    const { userMsg, load } = this.state;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.body}>
          <View style={{ flex: 1 }}>
            {
            !load ? (
              <View>
                {
                  !isEmpty(userMsg)
                    ? (
                      <View style={styles.container}>
                        {/* 用户名 */}
                        <Cell
                          title={getLocale('userinfoUsername')}
                          content={userMsg.get('userName')}
                          icon={userMsg.get('userName') ? eamilIcon : null}
                          onPressIcon={() => this.copy(getLocale('userinfoUsername'), userMsg.get('userName'))}
                        />
                        {/* 所属企业 */}
                        <Cell
                          title={getLocale('userinfoCompany')}
                          content={userMsg.get('groupName')}
                          icon={userMsg.get('groupName') ? eamilIcon : null}
                          onPressIcon={() => this.copy(getLocale('userinfoCompany'), userMsg.get('groupName'))}
                        />
                        {/* 状态 */}
                        <Cell
                          title={getLocale('userinfoState')}
                          content={userMsg.get('state')}
                        />
                        {/* 授权截止日期 */}
                        <Cell
                          title={getLocale('userinfoDate')}
                          content={userMsg.get('authorizationDate')}
                        />
                        {/* 真实姓名 */}
                        <Cell
                          title={getLocale('userinfoRelName')}
                          content={userMsg.get('realName')}
                          icon={userMsg.get('realName') ? eamilIcon : null}
                          onPressIcon={() => this.copy(getLocale('userinfoRelName'), userMsg.get('realName'))}
                        />
                        {/* 性别 */}
                        <Cell
                          title={getLocale('userinfoSex')}
                          content={userMsg.get('gender')}
                        />
                        {/* 电话 */}
                        <Cell
                          title={getLocale('userinfoPhone')}
                          content={userMsg.get('mobile')}
                          icon={userMsg.get('mobile') !== null ? phoneIcon : null}
                          onPressIcon={() => { this.phoneCall(userMsg.get('mobile')); }}
                        />
                        {/* 邮箱 */}
                        <Cell
                          title={getLocale('userinfoEmail')}
                          content={userMsg.get('mail')}
                          icon={userMsg.get('mail') ? eamilIcon : null}
                          onPressIcon={() => this.copy(getLocale('userinfoEmail'), userMsg.get('mail'))}
                        />
                      </View>
                    )
                    : null
                }
              </View>
            ) : <Loading type="page" />
          }
          </View>

          <ToolBar
            activeMonitor={activeMonitor}
            monitors={monitors}
          />
        </View>
      </SafeAreaView>
    );
  }
}

export default connect(
  state => ({
    monitors: state.getIn(['homeReducers', 'markers']),
    userInfo: state.getIn(['userInfoReducers', 'userInfo']), // 用户信息
    errReason: state.getIn(['userInfoReducers', 'errReason']), // 错误信息
  }),
  dispatch => ({
    userInfoAction: () => {
      dispatch({ type: 'personalCenter/SAGA/GET_USERINFO_ACTION' });// 获取用户信息
    },
  }),
)(UserInfo);
