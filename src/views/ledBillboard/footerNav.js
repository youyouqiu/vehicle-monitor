import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { go } from '../../utils/routeCondition';
import goHomeIcon from '../../static/image/goHomeIcon.png';
import goWarnIcon from '../../static/image/goWarnIcon.png';
import goStatistics from '../../static/image/goStatistics.png';
import goCenterIcon from '../../static/image/goCenterIcon.png';

const styles = StyleSheet.create({
  navView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navList: {
    flex: 1,
    // flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // borderLeftColor: '#c4c4c4',
    // borderLeftWidth: 1,
    height: 70,
  },
  textColor: {
    color: '#a7a9ab',
    fontWeight: '800',
    marginTop: 5,
  },
  navIcon: {
    // width: 25,
    height: 25,
  },
});

class FooterNav extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navInfo: [
        {
          title: '车辆监控',
          current: 'home',
          icon: goHomeIcon,
        },
        {
          title: '报警中心',
          current: 'security',
          icon: goWarnIcon,
        },
        {
          title: '考核统计',
          current: 'integrativeStatistics',
          icon: goStatistics,
        },
        {
          title: '个人中心',
          current: 'personalCenter',
          icon: goCenterIcon,
        },
      ],
    };
  }

  goRouter(current) {
    if (current !== '') {
      go(current);
    }
  }

  render() {
    const { navInfo } = this.state;

    return (
      <View style={styles.navView}>
        {
          navInfo.map((list, index) => (
            <TouchableOpacity
              style={[styles.navList, index === 0 ? { borderLeftWidth: 0 } : null]}
              onPress={() => this.goRouter(list.current)}
            >
              <Image
                style={styles.navIcon}
                source={list.icon}
                resizeMode="contain"
              />
              <Text style={styles.textColor}>{ list.title }</Text>
            </TouchableOpacity>
          ))
        }
      </View>
    );
  }
}

export default connect(null, null)(FooterNav);