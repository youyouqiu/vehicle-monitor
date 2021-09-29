import React, { Component } from 'react';
import { connect } from 'react-redux';
import { is } from 'immutable';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Alert, Modal,
  ScrollView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import PropTypes from 'prop-types';
import { isEmpty } from '../../utils/function';
import wImg from '../../static/image/wSecurity3.png';
import wVideo from '../../static/image/wSecurity2.png';
import wEvent from '../../static/image/wSecurity4.png';
import PanelModal from './componentModal';
import { getLocale } from '../../utils/locales';
import { getDealRisk } from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';// 导入toast
import Loading from '../../common/loading';

const dis = 55;// 日期宽度
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    width: dis,
    textAlign: 'center',
    color: 'rgb(154,158,161)',
  },
  panel_body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 46,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  leftLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgb(160,160,160)',
    left: 5,
    top: 0,
    bottom: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: 'rgb(255,131,131)',
    marginRight: 7,
    marginLeft: 2,
  },
  level: {
    // width: 60,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // backgroundColor: 'red',
  },
  icon_box: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  icon: {
    width: 19,
    height: 16,
    marginLeft: 8,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  dealBtn: {
    fontSize: 12,
    height: 20,
    lineHeight: 20,
    width: 42,
    textAlign: 'center',
    borderRadius: 3,
    marginLeft: 8,
  },
  dealBg: {
    color: '#fff',
    backgroundColor: '#3399FF',
  },
  borderLine: {
    borderLeftWidth: 1,
    borderColor: 'rgb(160,160,160)',
    marginLeft: dis + 5,
    textAlign: 'center',
    paddingTop: 5,
    paddingBottom: 10,
    alignItems: 'center',
  },
  txt: {
    fontSize: 13,
    color: '#333',
  },
  alertModal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.6)',
  },
  alertBox: {
    width: 300,
    padding: 20,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  alertTitle: {
    marginBottom: 5,
    fontSize: 20,
    color: '#333',
  },
  alertMsg: {
    fontSize: 16,
    color: '#333',
  },
  radioBox: {
    flex: 1,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioItem: {
    flex: 1,
    height: 20,
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIcon: {
    width: 12,
    height: 12,
    marginRight: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  alertBottom: {
    flex: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomTxt: {
    width: 55,
    height: 20,
    fontSize: 15,
    textAlign: 'right',
    color: '#42B59C',
  },
});

class PanelBody extends Component {
  static propTypes = {
    riskItem: PropTypes.object.isRequired,
    getMediaAction: PropTypes.func.isRequired,
    eventListAction: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      type: 0,
      dealState: false,
      load: false,
      curDealInfo: null,
      dealModalShow: false,
      riskState: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 检测网络
  getConnect=(riskItem, type) => {
    if ((riskItem.get('picFlag') === 0 && type === 0) || (riskItem.get('videoFlag') === 0 && type === 2)) {
      return;
    }

    if (type === 2) {
      NetInfo.fetch().then((connectionInfo) => {
        if (connectionInfo.type !== 'wifi') {
          Alert.alert(
            getLocale('securityConnecTit'),
            getLocale('securityConnecCon'),
            [
              { text: getLocale('securityCancel'), onPress: () => {} },
              {
                text: getLocale('securitySure'),
                onPress: () => {
                  this.openModal(riskItem, type);
                },
              },
            ],
            { cancelable: false },
          );
        } else {
          this.openModal(riskItem, type);
        }
      });
      return;
    }

    this.openModal(riskItem, type);
  }

  // 打开模态框
  openModal=(riskItem, type) => {
    const { getMediaAction, eventListAction } = this.props;
    this.setState({
      modalVisible: true,
      type,
    });

    // 报警事件
    if (type === 3) {
      eventListAction({
        riskId: riskItem.get('id'),
      });
    } else {
      // 报警证据库
      getMediaAction({
        riskId: riskItem.get('id'),
        mediaType: type,
      });
    }
  }

  // 关闭模态框
  modalClose=() => {
    this.setState({
      modalVisible: false,
    });
  }

// 转义风险等级
getRiskLevel=(num) => {
  let level = '';
  switch (num) {
    case 1:
      level = '一般(低)';
      break;
    case 2:
      level = '一般(中)';
      break;
    case 3:
      level = '一般(高)';
      break;
    case 4:
      level = '较重(低)';
      break;
    case 5:
      level = '较重(中)';
      break;
    case 6:
      level = '较重(高)';
      break;
    case 7:
      level = '严重(低)';
      break;
    case 8:
      level = '严重(中)';
      break;
    case 9:
      level = '严重(高)';
      break;
    case 10:
      level = '特重(低)';
      break;
    case 11:
      level = '特重(中)';
      break;
    case 12:
      level = '特重(高)';
      break;
    default:
      break;
  }
  return level;
}

  // 风险处理
  riskDeal=(riskItem) => {
    this.setState({
      dealModalShow: true,
      curDealInfo: riskItem,
    });
    // Alert.alert(
    //   getLocale('securityTipTit'),
    //   getLocale('securityTipCon'),
    //   [
    //     { text: getLocale('securityCancel'), onPress: () => {} },
    //     {
    //       text: getLocale('securitySure'),
    //       onPress: () => {
    //         this.setState({
    //           load: true,
    //         });
    //         this.dealSuccess(riskItem);
    //       },
    //     },
    //   ],
    //   { cancelable: false },
    // );
  }

  // 风险处理成功
  dealSuccess=() => {
    const { curDealInfo, riskState } = this.state;
    getDealRisk({
      riskId: curDealInfo.get('id'),
      riskResult: riskState ? 1 : 0,
    }).then((res) => {
      if (res.statusCode === 200 && res.obj) {
        this.setState({
          dealState: true,
        });
        toastShow(getLocale('securityDealSuccess'), { duration: 3000 });
      } else if (res.statusCode === 200 && !res.obj) {
        this.setState({
          dealState: true,
        });
        toastShow(getLocale('securityDealed'), { duration: 3000 });
      } else if (res.statusCode === 500) {
        toastShow(getLocale('securityDealFailed'), { duration: 3000 });
      }
      this.setState({
        load: false,
      });
    }).catch(() => {
      toastShow(getLocale('securityDealFailed'), { duration: 3000 });
    });
    this.setState({
      riskState: false,
      dealModalShow: false,
    });
  }

   // 关闭事件处理弹窗
   closeRiskModal=() => {
     this.setState({
       dealModalShow: false,
       riskState: false,
     });
   }

   render() {
     const {
       riskItem,
     } = this.props;
     const {
       modalVisible, type, dealState, load, dealModalShow, riskState,
     } = this.state;
     return (
       <View>
         {isEmpty(riskItem) ? <View style={styles.borderLine}><Text>{getLocale('securityInfoRiskEmpty')}</Text></View>
           : (
             <View style={styles.container}>
               <Text style={styles.date}>{riskItem.get('warningTime').substr(11)}</Text>

               <View style={styles.panel_body}>
                 <Text style={[styles.leftLine]} />

                 <View style={styles.dot} />

                 <View
                   style={styles.content}
                 >
                   <ScrollView
                     horizontal
                     style={{ maxWidth: 60, marginRight: 5 }}
                   >
                     <Text style={styles.txt}>
                       {riskItem.get('riskType')}
                     </Text>
                   </ScrollView>

                   <View style={styles.level}>
                     <Text style={styles.txt}>{this.getRiskLevel(riskItem.get('riskLevel'))}</Text>
                     {/* <Text>{getLocale('securityUnit2')}</Text> */}
                   </View>

                   <View style={styles.icon_box}>
                     {/* 图片证据 */}
                     <TouchableOpacity
                       style={styles.icon}
                       onPress={() => { this.getConnect(riskItem, 0); }}
                     >
                       <Image
                         source={riskItem.get('picFlag') ? wImg : null}
                         style={[styles.img, {
                           width: 18,
                           height: 15,
                         }]}
                       />
                     </TouchableOpacity>

                     {/* 视频证据 */}
                     <TouchableOpacity
                       style={styles.icon}
                       onPress={() => { this.getConnect(riskItem, 2); }}
                     >
                       <Image
                         source={riskItem.get('videoFlag') ? wVideo : null}
                         resizeMode="contain"
                         style={styles.img}
                       />
                     </TouchableOpacity>

                     {/* 报警事件 */}
                     <TouchableOpacity
                       style={styles.icon}
                       onPress={() => { this.getConnect(riskItem, 3); }}
                     >
                       <Image
                         source={wEvent}
                         resizeMode="contain"
                         style={styles.img}
                       />
                     </TouchableOpacity>
                   </View>

                   {
                    (riskItem.get('riskStatus') !== '已处理' && !dealState)
                      ? (
                        <TouchableOpacity
                          onPress={() => this.riskDeal(riskItem)}
                        >
                          <Text style={[styles.dealBtn, styles.dealBg]}>{getLocale('securityDeatl')}</Text>
                        </TouchableOpacity>
                      )
                      : <Text style={styles.dealBtn}>{getLocale('securityDealNum')}</Text>
                  }

                   {load ? <Loading type="modal" color="rgb(54,176,255)" /> : null}
                 </View>
               </View>
             </View>
           )
      }
         {/* 事件处理弹窗 */}
         <Modal
           animationType="slide"
           visible={dealModalShow}
           transparent
          //  presentationStyle="fullScreen"
           onRequestClose={this.closeRiskModal}
         >
           <View style={styles.alertModal}>
             <View style={styles.alertBox}>
               <Text style={styles.alertTitle}>{getLocale('securityTipTit')}</Text>
               <Text style={styles.alertMsg}>{getLocale('securityTipCon')}</Text>
               <View style={styles.radioBox}>
                 <TouchableOpacity
                   style={styles.radioItem}
                   onPress={() => { this.setState({ riskState: false }); }}
                 >
                   <View style={styles.radioIcon}>
                     {!riskState
                       ? <View style={styles.radioCircle} />
                       : null
                    }
                   </View>

                   <Text>{getLocale('riskNoHappen')}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={styles.radioItem}
                   onPress={() => { this.setState({ riskState: true }); }}
                 >
                   <View style={styles.radioIcon}>
                     {riskState
                       ? <View style={styles.radioCircle} />
                       : null
                    }
                   </View>
                   <Text>{getLocale('riskHappen')}</Text>
                 </TouchableOpacity>
               </View>
               <View style={styles.alertBottom}>
                 <TouchableOpacity
                   style={styles.bottomTxt}
                   onPress={this.closeRiskModal}
                 >
                   <Text style={styles.bottomTxt}>{getLocale('securityCancel')}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.bottomTxt} onPress={this.dealSuccess}>
                   <Text style={styles.bottomTxt}>{getLocale('securitySure')}</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         </Modal>
         {/* 模态框 */}
         <PanelModal
           modalVisible={modalVisible}
           type={type}
           closeFun={this.modalClose}
         />
       </View>
     );
   }
}

export default connect(
  null,
  dispatch => ({
    eventListAction: (params) => {
      dispatch({ type: 'security/SAGA/GET_EVENT_ACTION', params }); // 获取风险事件列表action
    },
    getMediaAction: (params) => {
      dispatch({ type: 'security/SAGA/GET_MEDIA_ACTION', params }); // 获取风险证据
    },
  }),
)(PanelBody);