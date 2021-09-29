import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getLoginAccont, getUserSetting } from '../../../server/getStorageData';
import { getLocale } from '../../../utils/locales';
import Loading from '../../../common/loading';
import PublicNavBar from '../../../common/newPublicNavBar';// 顶部导航
import ToolBar from '../../../common/toolBar';
import ListBar from '../component/listBar';
import { isEmpty } from '../../../utils/function';
// import storage from '../../../utils/storage';

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
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: windowWidth,
  },
  logoCont: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 60,
    marginTop: 20,
    marginBottom: 10,
  },
  bottom_txt: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 10,
    fontSize: 12,
    color: 'rgb(120, 120, 120)',
  },
});

class AboutUs extends Component {
  // 页面导航
  static navigationOptions = ({ route }) => PublicNavBar(
    route,
    getLocale('aboutUsTitle'),
  )

  static propTypes = {
    monitors: PropTypes.object,
    route: PropTypes.object.isRequired,
  }

  static defaultProps = {
    monitors: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      personalResult: {},
      login: {},
      barList: {},
      load: true,
      ip: null,
      imgUrl: '',
    };
  }

  componentDidMount() {
    this.getStorgetIp();
    this.getStorgetSetting();
  }

  // 组装img地址
  setImgUrl=() => {
    const { ip, logo } = this.state;

    const imgUrl = `${ip}${logo}`;
    this.setState({
      imgUrl,
    });
  }

  // 获取缓存的ip地址
  async getStorgetIp() {
    let ret = null;
    ret = await getLoginAccont();
    if (ret !== null) {
      const { ip, defaultIp } = ret[0];

      this.setState({
        ip: ip !== '' ? `http://${ip}` : defaultIp,
      });
      return true;
    }
    return null;
  }

  // 获取缓存的app设置
  async getStorgetSetting() {
    let ret = null;
    let setting = ret;

    ret = await getUserSetting();

    if (ret) {
      setting = ret;
    } else {
      setting = null;
    }

    if (setting) {
      let aboutUs = [];
      if (setting && setting.personal && setting.personal.aboutUs) {
        aboutUs = setting.personal.aboutUs.split('\\n');
      }
      this.setState({
        load: false,
        logo: setting.login.logo,
        personalResult: aboutUs, // 底部信息
        login: setting.login,
        barList: [{
          leftTit: getLocale('aboutUsLabel'),
          rightTit: setting.login.url,
        }],
      }, () => {
        this.setImgUrl();
      });
    } else {
      this.setState({
        load: false,
      });
    }
  }

  render() {
    const { monitors, route: { params } } = this.props;
    let activeMonitor;
    if (params) {
      activeMonitor = params.activeMonitor;
    }

    const {
      personalResult, login, barList, load, imgUrl,
    } = this.state;

    return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'bottom', 'left']}>
        <View style={styles.body}>
          {
          !load ? (
            <View style={{ flex: 1, alignItems: 'center' }}>
              {
                !isEmpty(personalResult)
                  ? (
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={styles.logoCont}>
                          {
                          imgUrl === '' ? null : (
                            <Image
                              resizeMode="contain"
                              style={styles.logo}
                              source={{ uri: imgUrl }}
                            />
                          )
                        }
                          <Text>
                            {login.title}
                          </Text>
                        </View>
                        <ListBar barList={barList} />
                      </View>
                      <View style={styles.bottom_txt}>
                        {
                            personalResult.map(item => (
                              <Text>
                                {item}
                              </Text>
                            ))
                        }
                      </View>
                    </View>
                  )
                  : null
              }
            </View>
          )
            : <Loading type="page" />
        }
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
  }),
  null,
)(AboutUs);
