import React, { Component } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  // ScrollView,
  FlatList,
} from 'react-native';
import PropTypes from 'prop-types';
import { getLocale } from '../../utils/locales';
import { checkMonitorAuth } from '../../server/getData';
import { toastShow } from '../../utils/toastUtils';
import closeIcon from '../../static/image/closeIcon.png';

const moduleWidth = Dimensions.get('window').width; // 获取屏幕宽度
const moduleHeight = Dimensions.get('window').height; // 获取屏幕高度


const styles = StyleSheet.create({
  viewContainer: {
    width: moduleWidth,
    height: moduleHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeIcon: {
    width: 30,
    height: 30,
  },
});

class ClusterMonitor extends Component {
  static propTypes = {
    clusters: PropTypes.array,
    isClustersViewShow: PropTypes.bool,
    clustersItemClick: PropTypes.func,
    clustersClose: PropTypes.func,
  };

  // 属性默认值
  static defaultProps = {
    clusters: null,
    isClustersViewShow: false,
    clustersItemClick: null,
    clustersClose: null,
  }

  constructor(props) {
    super(props);
    const { clusters, isClustersViewShow } = this.props;
    const newData = this.changeClusters(clusters);
    this.state = {
      clusters: newData,
      isClustersViewShow,
    };
  }

  UNSAFE_componentWillReceiveProps = (nextProps) => {
    const { clusters, isClustersViewShow } = nextProps;
    if (clusters) {
      clusters.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        } else {
          return 0;
        }
      });
      const newData = this.changeClusters(clusters);
      this.setState({ clusters: newData, isClustersViewShow });
    }
  }

  clustersItemClick = (item) => {
    this.handleOnChange(item);
  }

  handleOnChange = (item) => {
    const { clustersItemClick } = this.props;

    if (typeof clustersItemClick === 'function') {
      checkMonitorAuth({
        monitorId: item.monitorId,
      }).then((res) => {
        if (res.statusCode === 200) {
          if (res.obj === 1) { // 1：未解绑
            clustersItemClick(item);
          } else if (res.obj === 2) { // 解绑
            toastShow(getLocale('vehicleUnbind'), { duration: 2000 });
          } else if (res.obj === 3) { // 没有权限
            toastShow(getLocale('noJurisdiction'), { duration: 2000 });
          }
        }
      });
    }
  }

  /**
   * 重新组装数组，每三个一组
   */
  changeClusters = (data) => {
    if (data !== null) {
      const newData = [];
      let d = [];
      for (let i = 0; i < data.length; i += 1) {
        d.push(data[i]);
        if ((i + 1) % 3 === 0) {
          newData.push(d);
          d = [];
        } else if ((i + 1) === data.length) {
          // newData.push(d);
          // d = [];
          const j = d.length;
          for (let x = j; x < 3; x += 1) {
            d.push({});
          }
          newData.push(d);
          d = [];
        }
      }
      return newData;
    }
    return data;
  }

  /**
   * 设置每一行view
   */
  scrollLineView = item => (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <View style={{
        flex: 1,
        flexDirection: 'row',
        // justifyContent: 'space-around',
        // backgroundColor: 'blue',
      }}
      >
        {
          item.map(list => this.clustersItem(list))
        }
      </View>
    </View>
  )

  /**
   * 创建每一个view
   */
  clustersItem = (item) => {
    const { name, status } = item;

    return name === undefined ? (
      // <View style={{ width: (moduleWidth - 30) / 3 - 30 }}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      />
      // </View>
    ) : (
    // <View style={{ width: (moduleWidth - 30) / 3 - 30 }}>
      <TouchableOpacity
        style={{
          flex: 1,
          paddingVertical: 6,
          paddingHorizontal: 8,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
        onPress={() => this.clustersItemClick(item)}
      >
        {this.statusView(status)}
        <Text style={{ flex: 1 }}>{name}</Text>
      </TouchableOpacity>
    // </View>
    );
  }

  /**
   * 状态颜色view
   */
  statusView = (status) => {
    const color = this.statusColor(status);
    return (
      <View style={{
        width: 10, height: 10, borderRadius: 10, marginRight: 2, backgroundColor: color,
      }}
      />
    );
  }

  /**
   * 状态颜色
   */
  statusColor = (status) => {
    let color = null;
    if (status === 2) { // 未定位
      color = '#754801';
    } else if (status === 3) { // 未上线
      color = '#b6b6b6';
    } else if (status === 4) { // 停车
      color = '#c80002';
    } else if (status === 5) { // 报警
      color = '#ffab2d';
    } else if (status === 9) { // 超速
      color = '#960ba3';
    } else if (status === 10) { // 行驶
      color = '#78af3a';
    } else if (status === 11) { // 心跳
      color = '#fb8c96';
    }
    return color;
  }

  /**
   * 关闭数据弹窗视图
   */
  closeClusterView = () => {
    const { clustersClose } = this.props;
    if (clustersClose) {
      clustersClose();
    }
    // this.setState({ isClustersViewShow: false });
  }

  render() {
    const { clusters, isClustersViewShow } = this.state;
    if (!isClustersViewShow) {
      return null;
    }

    return (
      <View style={styles.viewContainer}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: '93%',
            backgroundColor: '#ffffff',
            minHeight: 40,
            maxHeight: moduleHeight - 300,
            borderRadius: 5,
            paddingVertical: 10,
            paddingHorizontal: 10,
          }}
          >
            {
              clusters !== null ? (
                <FlatList
                  data={clusters}
                  initialNumToRender={20}
                  renderItem={({ item }) => this.scrollLineView(item)}
                />
              ) : null
            }
          </View>
          <TouchableOpacity
            style={{ marginTop: 15 }}
            onPress={this.closeClusterView}
          >
            <Image
              style={styles.closeIcon}
              source={closeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default ClusterMonitor;