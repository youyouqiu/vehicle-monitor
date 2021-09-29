import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  //   Dimensions,
  Text,
  Button,
} from 'react-native';
import VideoView from './VideoView';

// import PublicNavBar from '../../common/publicNavBar';// 顶部导航

// const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度


const styles = StyleSheet.create({
  body: {
    backgroundColor: '#F4F7FA',
    flex: 1,
  },
});

class Video extends Component {
  // 页面导航
  // static navigationOptions = ({ navigation }) => ({
  //   header: (
  //     <PublicNavBar title="音视频" nav={navigation} />
  //   ),
  // })

  constructor(props) {
    super(props);
    this.state = {
      ifOpenVideo: false,
    };
  }

  btnPress=() => {
    const { ifOpenVideo } = this.state;
    this.setState({
      ifOpenVideo: !ifOpenVideo,
    });
  }

  render() {
    const { ifOpenVideo } = this.state;
    return (

      <View style={styles.body}>
        <Text style={{ width: '100%', backgroundColor: 'red' }}>哈哈哈h哈h</Text>
        <VideoView
          style={{
            width: 200,
            height: 200,
            backgroundColor: '#000',
            marginLeft: 100,
            marginTop: 100,
          }}
          ifOpenVideo={ifOpenVideo}
          socketUrl="ws://192.168.24.37:7971/RealStream/017100000001/1/a990c4e7-e3a6-47b6-b812-ae61c6b76587"
        />
        <Text>hhh</Text>
        <Button title="点我sds" onPress={this.btnPress} />
      </View>

    );
  }
}

export default Video;
