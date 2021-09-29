import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  StyleSheet,
  View,
  Image,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import modalClose from '../../static/image/close.png';
import Loading from '../../common/loading';
import { getLocale } from '../../utils/locales';

const windowWidth = Dimensions.get('window').width * 0.95; // 获取屏幕宽度
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    width: windowWidth,
    height: 230,
  },
  item_title: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 16,
  },
  item_content: {
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#DCDCDC',
  },
  panel_body: {
    flex: 1,
  },
  list: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
    borderLeftWidth: 1,
    borderLeftColor: '#DCDCDC',
  },
  item: {
    height: 40,
    borderRightWidth: 1,
    alignItems: 'center',
    borderRightColor: '#DCDCDC',
    textAlign: 'center',
    justifyContent: 'center',
    color: '#111111',
    paddingHorizontal: 5,
  },
  txt: {
    fontSize: 13,
    color: '#111',
  },
  grayBg: {
    backgroundColor: '#F5F5F5',
  },
  empty: {
    paddingVertical: 10,
    alignItems: 'center',
    textAlign: 'center',
  },
  eventEmpty: {
    paddingVertical: 20,
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 32,
    height: 32,
  },
});

class EventPage extends Component {
  static propTypes = {
    closeFun: PropTypes.func.isRequired, // 关闭弹窗
    eventLists: PropTypes.object.isRequired,
    eventStatus: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      eventData: [],
      isLoad: true,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { eventLists, eventStatus } = nextProps;
    // 报警事件
    if (eventStatus === 'success') {
      this.setState({
        eventData: [...eventLists],
        isLoad: false,
      });
    } else if (eventStatus === 'failed') {
      this.setState({
        isLoad: false,
      });
    }
  }

  // 风险事件列表
  renderItem = (item, index) => {
    const flag = (index % 2) === 0;

    return (
      <View
        style={[styles.list, flag ? styles.grayBg : null]}
      >
        <View style={[styles.item, { width: '21%' }]}>
          <Text style={styles.txt}>{item.get('riskType')}</Text>
        </View>
        <View style={[styles.item, { width: '21%' }]}>
          <Text style={styles.txt}>{item.get('riskEvent')}</Text>
        </View>
        <View style={[styles.item, { width: '21%' }]}>
          <Text style={styles.txt}>{item.get('eventTime').substr(11)}</Text>
        </View>
        <View style={[styles.item, { flex: 1 }]}>
          <Text
            style={styles.txt}
            numberOfLines={2}
          >{item.get('address') ? item.get('address') : getLocale('addressEmpty')}
          </Text>
        </View>
      </View>
    );
  };

  render() {
    const { isLoad, eventData } = this.state;
    const { closeFun } = this.props;
    return (
      <View
        style={styles.container}
      >
        {/* 事件列表 start */}
        <Text style={styles.item_title}>
          {getLocale('securityInfoEventTitle')}
        </Text>
        <View style={styles.item_content}>
          {
              isLoad ? <Loading type="page" />
                : (
                  <ScrollView style={styles.panel_body}>
                    {
                      eventData.length === 0 ? <Text style={styles.eventEmpty}>{getLocale('securityEventEmpty')}</Text>
                        : eventData.map(this.renderItem)
                    }
                  </ScrollView>
                )
            }
        </View>
        {/* 事件列表 end */}

        {/* 关闭按钮 start */}
        <TouchableOpacity
          style={styles.close}
          onPress={closeFun}
        >
          <Image
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            source={modalClose}
          />
        </TouchableOpacity>
        {/* 关闭按钮 end */}
      </View>
    );
  }
}

export default connect(
  state => ({
    eventLists: state.getIn(['securityReducers', 'eventLists']), // 风险事件列表
    eventStatus: state.getIn(['securityReducers', 'eventStatus']), // 风险事件状态
  }),
  null,
)(EventPage);