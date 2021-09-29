import React, { Component } from 'react';
import { is } from 'immutable';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal,
  FlatList,
} from 'react-native';
import PropTypes from 'prop-types';

import MonitorDetail from '../monitorDetail';
import { getLocale } from '../../utils/locales';
import wDetail from '../../static/image/wDetail2.png';
import wPosition from '../../static/image/wPosition2.png';
import wCar from '../../static/image/wCar.png';// 车
import wPerson from '../../static/image/wPerson.png';// 人
import wThing from '../../static/image/wThing.png';// 物
import wStatus1 from '../../static/image/wStatus1.png';// 在线
import wStatus2 from '../../static/image/wStatus2.png';// 心跳
import wStatus3 from '../../static/image/wStatus3.png';// 报警
import wStatus4 from '../../static/image/wStatus4.png';// 未定位
import wStatus5 from '../../static/image/wStatus5.png';// 停止
import wStatus6 from '../../static/image/wStatus6.png';// 超速
import wStatus7 from '../../static/image/wStatus7.png';// 离线
import { go, isAlreadyExist } from '../../utils/routeCondition';
import { getUserStorage, getCurAccont } from '../../server/getStorageData';


// style
const styles = StyleSheet.create({
  body: {
    paddingTop: 5,
    paddingBottom: 10,
  },
  panel_body: {
    // height: 120,
    marginHorizontal: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  cell_img: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  cell_content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  cell_btn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e7e7e7',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 22,
  },
  itemTxt: {
    fontSize: 14,
    flex: 1,
  },
  itemTxt1: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  itemTxt2: {
    fontSize: 14,
  },
  status: {
    width: 23,
    height: 23,
    alignSelf: 'flex-start',
    marginRight: -5,
    // marginTop: -5,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
  },
  border_R: {
    borderRightWidth: 1,
    borderRightColor: '#e7e7e7',
  },
  btnIcon1: {
    width: 15,
    height: 15,
    marginRight: 5,
  },
  btnIcon2: {
    width: 12,
    height: 15,
    marginRight: 5,
  },
  btnTxt: {
    fontSize: 14,
  },
  flexDirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
  },
  font14: {
    fontSize: 14,
  },
  emptyView: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e7e7e7',
  },
  empty: {
    textAlign: 'center',
    height: 60,
    lineHeight: 60,
  },
});

class PanelBody extends Component {
  // 属性声明
  static propTypes = {
    eventItem: PropTypes.array.isRequired,
    addMonitor: PropTypes.func.isRequired,
  };

  state = {
    detailVisible: false, // 详情modal是否可见
    mId: '',
    mName: '',
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 判断监控对象状态
  getStatus = (content) => {
    let status;
    switch (content.get('status')) {
      case 10:// 移动
        status = wStatus1;
        break;
      case 11:// 心跳
        status = wStatus2;
        break;
      case 5:// 报警
        status = wStatus3;
        break;
      case 2:// 未定位
        status = wStatus4;
        break;
      case 4:// 停止
        status = wStatus5;
        break;
      case 9:// 超速
        status = wStatus6;
        break;
      case 3:// 从未上线,不在线
        status = wStatus7;
        break;
      default:
        break;
    }

    return status;
  }

  // 判断监控对象类型
  getType = (content) => {
    let icon;
    switch (content.get('type')) {
      case '0':
        icon = wCar;
        break;
      case '1':
        icon = wPerson;
        break;
      case '2':
        icon = wThing;
        break;
      default:
        break;
    }

    return icon;
  }

  returnValue = (val) => {
    if (val && val !== ' -') {
      const a = val.split(' ');
      let x = a[0];
      const y = a[1];
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(x)) {
        x = Number(x).toFixed(2);
      }
      return `${x} ${y}`;
    }
    return '-';
  }


  // 监控对象为车
  getVehicelDom = content => (
    <View>
      <View style={styles.item}>
        <Text
          style={[styles.itemTxt]}
          numberOfLines={1}
        >
          {getLocale('monitorSearchTit4')} {this.returnValue(content.get('dayMileage'))}
        </Text>

        <Text
          numberOfLines={1}
          style={[styles.itemTxt]}
        >
          {getLocale('monitorSearchTit5')} {content.get('speed')}
        </Text>

        {/* <Text
            numberOfLines={1}
            style={[styles.itemTxt2]}
          >
            {getLocale('monitorSearchTit6')} {content.get('acc')}
          </Text> */}
      </View>

      {/* <View style={styles.flexDirRow}>
          <Text
            numberOfLines={1}
            style={[styles.itemTxt2]}
          >
            {getLocale('monitorSearchTit6')} {content.get('acc')}
          </Text>
        </View> */}

      <View style={[styles.flexDirRow]}>
        <Text
          style={[styles.font14, { flex: 1 }]}
        >
          {getLocale('monitorSearchTit7')} {content.get('gpsTime')}
        </Text>
        <Text
          // numberOfLines={1}
          style={[styles.itemTxt2, { width: 60 }]}
        >
          {getLocale('monitorSearchTit6')} {content.get('acc')}
        </Text>
      </View>

      <View style={styles.flexDirRow}>
        <Text
          style={styles.font14}
        >
          {getLocale('monitorSearchTit8')}
        </Text>
        <ScrollView horizontal>
          <View>
            <Text>
              {content.get('location')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );

  // 监控对象为人、物
  getPersonDom = content => (
    <View>
      <View style={styles.item}>
        <Text
          style={[styles.itemTxt, styles.itemTxt2]}
          numberOfLines={1}
        >
          {getLocale('monitorSearchTit1')}{content.get('deviceNo')}
        </Text>

        <Text
          numberOfLines={1}
          style={[styles.itemTxt, styles.itemTxt2, { marginRight: 15 }]}
        >
          {getLocale('monitorSearchTit2')}{content.get('simNo')}
        </Text>
      </View>

      <View style={styles.flexDirRow}>
        <Text
          style={styles.font14}
        >
          {getLocale('monitorSearchTit3')}
        </Text>
        <ScrollView horizontal>
          <View>
            <Text>
              {content.get('location')}
            </Text>

          </View>
        </ScrollView>
      </View>
    </View>
  )

  // 查看位置跳转
  handleJump = async (id, name, type) => {
    // 判断监控对象是否已被关注
    const curAccont = await getCurAccont();
    const userStorage = await getUserStorage() || {};
    const collectMonitor = userStorage[curAccont] ? userStorage[curAccont].collect : [];
    let isCollect = false;
    if (collectMonitor && collectMonitor.indexOf(id) !== -1) {
      isCollect = true;
    }
    if (isAlreadyExist(id) || isCollect) {
      go('home', {
        activeMonitor: {
          markerId: id,
          title: name,
          monitorType: type,
        },
      });
      return;
    }
    const { addMonitor } = this.props;
    addMonitor(id, () => {
      setTimeout(() => {
        go('home', {
          activeMonitor: {
            markerId: id,
            title: name,
            monitorType: type,
          },
        });
      }, 60);
    });
  }

  openDetail = (id, name) => {
    this.setState({
      detailVisible: true,
      mId: id,
      mName: name,
    });
  }

  cancelTap = () => {
    this.setState({
      detailVisible: false,
    });
  }

  renderItem = ({ item }) => (
    <View
      style={styles.panel_body}
    >
      {/* content */}
      <View style={styles.cell_content}>
        <View style={styles.item}>
          <Image
            source={this.getType(item)}
            style={styles.cell_img}
          />

          <Text style={[styles.itemTxt, styles.itemTxt1]} numberOfLines={1}>
            {item.get('name')}
          </Text>

          <Image
            source={this.getStatus(item)}
            style={styles.status}
          />
        </View>

        {
          item.get('type') === '0'
            ? this.getVehicelDom(item)
            : this.getPersonDom(item)
        }
      </View>
      {/* content end */}

      {/* btn */}
      <View style={styles.cell_btn}>
        <TouchableOpacity
          style={[styles.btn, styles.border_R]}
          onPress={() => {
            this.openDetail(item.get('id'), item.get('name'));
          }}
        >
          <Image
            source={wDetail}
            style={styles.btnIcon1}
          />
          <Text style={styles.btnTxt}>
            {getLocale('monitorDetailBtn')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            this.handleJump(item.get('id'), item.get('name'), item.get('type'));
          }}
        >
          <Image
            source={wPosition}
            style={styles.btnIcon2}
          />
          <Text style={styles.btnTxt}>
            {getLocale('monitorPositionBtn')}
          </Text>
        </TouchableOpacity>
      </View>
      {/* btn end */}
    </View>
  )


  render () {
    const { eventItem } = this.props;
    const {
      detailVisible,
      mName,
      mId,
    } = this.state;

    return (
      <View>
        {/* modal */}
        <Modal
          animationType="slide"
          visible={detailVisible}
          onRequestClose={this.cancelTap}
        >
          <MonitorDetail
            mId={mId}
            mName={mName}
            onRequestClose={this.cancelTap}
          />
        </Modal>

        {
          eventItem.length === 0
            ? (
              <View style={styles.emptyView}>
                <Text style={styles.empty}>{getLocale('monitorEmpty')}</Text>
              </View>
            )
            : (
              <View
                style={styles.body}
              >
                <FlatList
                  data={eventItem}
                  initialNumToRender={eventItem > 20 ? 20 : eventItem.length}
                  renderItem={this.renderItem}
                  keyExtractor={(item, index) => index.toString()}
                  extraData={this.state}
                  removeClippedSubviews
                />
              </View>
            )
        }
      </View>
    );
  }
}

export default PanelBody;