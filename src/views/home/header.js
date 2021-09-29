import React, { Component } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ImageBackground,
} from 'react-native';
import { throttle } from 'lodash';
import PropTypes from 'prop-types';
import { is } from 'immutable';
import { go, getMonitor } from '../../utils/routeCondition';
import { getUserSetting } from '../../server/getStorageData';
import { getLocale } from '../../utils/locales';
import homePersonal from '../../static/image/homePersonal.png';
import homeSearch from '../../static/image/homeSearch.png';
import { isEmpty } from '../../utils/function';
import { toastShow } from '../../utils/toastUtils';
// import storage from '../../utils/storage';
import { requestConfig } from '../../utils/env';

const httpBaseConfig = requestConfig();
const headerWidth = Dimensions.get('window').width; // 获取屏幕宽度


const styles = StyleSheet.create({
  headerMain: {
    position: 'absolute',
    // top: 30,
    top: 0,
    left: 15,
    // zIndex: 100,
    width: headerWidth - 30,
    margin: 'auto',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#ffffff',
    borderColor: '#eeeeee',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 5,
    shadowColor: '#c6c6c6',
    shadowOffset: { h: 10, w: 10 },
    shadowRadius: 3,
    shadowOpacity: 0.8,
  },
  headerPerView: {
    width: 51,
  },
  headerPerImage: {
    width: 35,
    height: 35,
    borderRadius: 18,
  },
  imgBox: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: 17,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInputView: {
    flex: 1,
    // fontSize: 25,
    height: '100%',
    justifyContent: 'center',
  },
  headerSearchView: {
    width: 40,
    margin: 'auto',
  },
  headerSearchImage: {
    width: 20,
    height: 20,
    marginLeft: 0,
  },
});

class Header extends Component {
  static propTypes ={
    style: PropTypes.shape(styles.headerMain), // 样式
  };

  // 属性默认值
  static defaultProps ={
    style: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      personalResult: null,
      // load: true,
      ip: `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}`,
      imgUrl: '',
    };

    // this.getStorgetIp();
    // this.getStorgetSetting();

    this.debouncetoPersonalCenter = throttle(this.toPersonalCenter, 500, {
      trailing: false,
    });
    this.debouncetoMonitorSearch = throttle(this.toMonitorSearch, 500, {
      trailing: false,
    });
  }

  componentDidMount() {
    // this.getStorgetIp();
    this.getStorgetSetting();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 获取缓存的ip地址
  // async getStorgetIp() {
  //   let ret = null;
  //   try {
  //     ret = await storage.load({
  //       key: 'loginAccont',
  //     });
  //     const { ip, defaultIp } = ret[0];
  //     this.setState({
  //       ip: ip !== '' ? ip : defaultIp,
  //     });
  //     return true;
  //   } catch (error) {
  //     return null;
  //   }
  // }

  // 获取缓存的app设置
  async getStorgetSetting() {
    let ret = null;
    let setting = null;
    ret = await getUserSetting();
    if (ret !== null) {
      setting = ret || null;
    }

    this.setState({
      personalResult: setting,
      load: false,
    }, () => {
      this.setImgUrl();
    });
  }

  // 组装img地址
  setImgUrl=() => {
    const { ip, personalResult } = this.state;
    const rIp = ip;
    const img = personalResult ? personalResult.personal.groupAvatar : null;

    if (img) {
      const imgUrl = `${rIp}${img}`;
      this.setState({
        imgUrl,
      });
    }
  }

  toPersonalCenter() {
    go('personalCenter');
  }

  toMonitorSearch() {
    const activeMonitor = getMonitor();
    if (isEmpty(activeMonitor)) {
      toastShow(getLocale('noMonitorNoOperation'), { duration: 2000 });
      return;
    }
    go('monitorSearch');
  }

  render() {
    const { imgUrl } = this.state;
    const { style } = this.props;

    return (
      <View style={[styles.headerMain, style]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={this.debouncetoPersonalCenter}
          >
            <View style={styles.headerPerView}>
              <ImageBackground
                style={styles.imgBox}
              >
                {
                  imgUrl ? (
                    <Image
                      style={styles.headerPerImage}
                      source={{ uri: imgUrl }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Image
                      style={styles.headerPerImage}
                      source={homePersonal}
                      resizeMode="contain"
                    />
                  )
                }

              </ImageBackground>
              {/* <Image
                style={styles.headerPerImage}
                // source={homePersonal}
                source={imgUrl ? { uri: imgUrl } : homePersonal}
              /> */}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerInputView}
            onPress={this.debouncetoMonitorSearch}
          >
            {/* <TextInput */}
            {/* clearButtonMode */}
            {/* placeholder={getLocale('homeHeaderPlaceholder')} */}
            {/* underlineColorAndroid="transparent" */}
            {/* editable={false} */}
            {/* /> */}
            <Text style={{ color: '#ccc' }}>{getLocale('homeHeaderPlaceholder')}</Text>
          </TouchableOpacity>
          <View style={[styles.headerSearchView]}>
            <TouchableOpacity
              style={{ width: 20, height: 20 }}
              onPress={this.debouncetoMonitorSearch}
            >
              <Image
                style={styles.headerSearchImage}
                source={homeSearch}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

export default Header;