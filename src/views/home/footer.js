import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { connect } from 'react-redux';
import { is } from 'immutable';
import ToolBottom from '../../common/toolBar/componentMonitor';

import homeDetailsImage from '../../static/image/homeDetails.png';
import homeFooterOpenImage from '../../static/image/homeFooterOpenImage.png';
import homeFooterCloseImage from '../../static/image/close.png';
import mapIcon from '../../static/image/mapIcon.png';


const styles = StyleSheet.create({
  footerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    backgroundColor: '#ffffff',
    // borderColor: '#c6c6c6',
    borderColor: '#eee',
    borderWidth: 1,
    borderStyle: 'solid',
    // shadowColor: '#c6c6c6',
    // shadowOffset: { h: 10, w: 10 },
    // shadowRadius: 3,
    // shadowOpacity: 0.8,
  },
  footerDetView: {
    width: 65,
    // borderColor: 'red',
    // borderWidth: 1,
  },
  footerDetImage: {
    width: 25,
    marginLeft: 20,
  },
  headerObjView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // borderColor: 'orange',
    // borderWidth: 1,
  },
  leftBtnView: {
    width: 40,
  },
  leftBtnImage: {
    width: 20,
    marginLeft: 10,
  },
  rightBtnView: {
    width: 40,
  },
  rightBtnImage: {
    width: 20,
    marginLeft: 10,
  },
  footerCloseView: {
    width: 65,
  },
  footerCloseImage: {
    width: 25,
    marginLeft: 20,
  },
  objNameView: {
    fontWeight: '500',
    fontSize: 20,
  },
});

class Footer extends Component {
  // 属性声明
  static propTypes = {
    commonlyUseViewShow: PropTypes.bool,
    objDetShow: PropTypes.bool,
    objDetChange: PropTypes.func,
    comUseShow: PropTypes.func,
    monitors: PropTypes.object,
    onMonitorChange: PropTypes.func.isRequired,
    style: PropTypes.shape(styles.headerMain), // 样式
    activeMonitor: PropTypes.object,
    onMonitorClick: PropTypes.func,
    onMonitorDbClick: PropTypes.func,
    isFocus: PropTypes.bool,
    neveronlinemonitorchange: PropTypes.func,
    setCommonlyUseViewShow: PropTypes.func,
  };

  // 属性默认值
  static defaultProps = {
    commonlyUseViewShow: false,
    objDetShow: false,
    objDetChange: null,
    comUseShow: null,
    monitors: null,
    style: null,
    activeMonitor: null,
    onMonitorClick: null,
    onMonitorDbClick: null,
    isFocus: false,
    neveronlinemonitorchange: null,
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (nextProps.monitors == null) {
      return false;
    }
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 切换监控对象触发事件
  monitorChange (item) {
    const { onMonitorChange } = this.props;
    onMonitorChange(item);
  }

  // 监控对象点击事件
  monitorClick (item) {
    const { onMonitorClick } = this.props;
    onMonitorClick(item);
  }

  // 监控对象双击事件
  monitorDbClick (item) {
    const { onMonitorDbClick } = this.props;
    onMonitorDbClick(item);
  }

  neveronlinemonitorchange (item, index) {
    const { neveronlinemonitorchange } = this.props;
    if (typeof neveronlinemonitorchange === 'function') {
      neveronlinemonitorchange(item, index);
    }
  }

  UNSAFE_componentWillMount () {
    const { setCommonlyUseViewShow } = this.props;
    setCommonlyUseViewShow();
  }

  render () {
    const {
      commonlyUseViewShow,
      objDetShow,
      objDetChange,
      comUseShow,
      monitors,
      style,
      activeMonitor,
      isFocus,
    } = this.props;

    return (
      <View style={style}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            onPress={objDetChange}
          >
            <View style={styles.footerDetView}>
              <Image
                style={styles.footerDetImage}
                source={objDetShow ? mapIcon : homeDetailsImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
          <View style={styles.headerObjView}>
            <ToolBottom
              monitors={monitors}
              activeMonitor={activeMonitor}
              onChange={item => this.monitorChange(item)}
              onMonitorClick={item => this.monitorClick(item)}
              onMonitorDbClick={item => this.monitorDbClick(item)}
              isFocus={isFocus}
              neveronlinemonitorchange={(item) => { this.neveronlinemonitorchange(item); }}
            />
          </View>
          <TouchableOpacity
            activeOpacity={1}
            onPress={comUseShow}
          >
            <View
              style={styles.footerCloseView}
            >
              <Image
                style={styles.footerCloseImage}
                source={commonlyUseViewShow ? homeFooterCloseImage : homeFooterOpenImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default connect(
  state => ({
    commonlyUseViewShow: state.getIn(['homeReducers', 'commonlyUseViewShow']),
    objDetShow: state.getIn(['homeReducers', 'objDetShow']),

    currentMonitorInfoId: state.get(['homeReducers', 'currentMonitorInfoId']),
  }),
  dispatch => ({
    comUseShow: () => {
      dispatch({ type: 'COM_USE_ACTION' });
    },
    objDetChange: () => {
      dispatch({ type: 'OBJ_DET_ACTION' });
    },
    setCommonlyUseViewShow: () => {
      dispatch({ type: 'SET_COMMONLY_VIEW' });
    },
  }),
)(Footer);