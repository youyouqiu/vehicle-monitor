import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import Welcome1Png500350 from '../../static/image/welcome/500_350/welcome1.jpg';
import Welcome2Png500350 from '../../static/image/welcome/500_350/welcome2.jpg';
import Welcome3Png500350 from '../../static/image/welcome/500_350/welcome3.jpg';

import Welcome1Png900550 from '../../static/image/welcome/900_550/welcome1.jpg';
import Welcome2Png900550 from '../../static/image/welcome/900_550/welcome2.jpg';
import Welcome3Png900550 from '../../static/image/welcome/900_550/welcome3.jpg';

import Welcome1Png1300800 from '../../static/image/welcome/1300_800/welcome1.jpg';
import Welcome2Png1300800 from '../../static/image/welcome/1300_800/welcome2.jpg';
import Welcome3Png1300800 from '../../static/image/welcome/1300_800/welcome3.jpg';

import Welcome1Png1600900 from '../../static/image/welcome/1600_900/welcome1.jpg';
import Welcome2Png1600900 from '../../static/image/welcome/1600_900/welcome2.jpg';
import Welcome3Png1600900 from '../../static/image/welcome/1600_900/welcome3.jpg';

import Welcome1Png20001100 from '../../static/image/welcome/2000_1100/welcome1.jpg';
import Welcome2Png20001100 from '../../static/image/welcome/2000_1100/welcome2.jpg';
import Welcome3Png20001100 from '../../static/image/welcome/2000_1100/welcome3.jpg';

import Welcome1Png24001200 from '../../static/image/welcome/2400_1200/welcome1.jpg';
import Welcome2Png24001200 from '../../static/image/welcome/2400_1200/welcome2.jpg';
import Welcome3Png24001200 from '../../static/image/welcome/2400_1200/welcome3.jpg';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度
const windowHeight = Dimensions.get('window').height; // 获取屏幕高度

const styles = StyleSheet.create({
  fullPage: {
    width: windowWidth,
    height: '100%',
  },
});

class Welcome extends Component {
    static propTypes = {
      onEnter: PropTypes.func.isRequired,
    }


    render() {
      const ratioArray = [1.428, 1.8, 1.625, 1.777, 1.818, 2];
      const ratio = windowHeight * 1.0 / windowWidth;
      const ratioDiffAbs = ratioArray.map(x => Math.abs(x - ratio));
      const min = Math.min.apply(null, ratioDiffAbs);
      const minIndex = ratioDiffAbs.indexOf(min);
      const { onEnter } = this.props;
      let png1; let png2; let
        png3;
      if (minIndex === 0) {
        png1 = Welcome1Png500350; // 1.428
        png2 = Welcome2Png500350;
        png3 = Welcome3Png500350;
      } else if (minIndex === 1) {
        png1 = Welcome1Png900550; // 1.8
        png2 = Welcome2Png900550;
        png3 = Welcome3Png900550;
      } else if (minIndex === 2) {
        png1 = Welcome1Png1300800; // 1.625
        png2 = Welcome2Png1300800;
        png3 = Welcome3Png1300800;
      } else if (minIndex === 3) {
        png1 = Welcome1Png1600900; // 1.777
        png2 = Welcome2Png1600900;
        png3 = Welcome3Png1600900;
      } else if (minIndex === 4) {
        png1 = Welcome1Png20001100; // 1.818
        png2 = Welcome2Png20001100;
        png3 = Welcome3Png20001100;
      } else if (minIndex === 5) {
        png1 = Welcome1Png24001200; // 2
        png2 = Welcome2Png24001200;
        png3 = Welcome3Png24001200;
      }

      return (
        <View style={[styles.fullPage, { backgroundColor: 'black' }]}>
          <ScrollView
            bounces={false}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            horizontal
            style={styles.fullPage}
          >
            <View style={styles.fullPage}>
              <Image source={png1} resizeMode="stretch" style={styles.fullPage} />
            </View>
            <View style={styles.fullPage}>
              <Image source={png2} resizeMode="stretch" style={styles.fullPage} />
            </View>
            <TouchableOpacity style={styles.fullPage} onPress={onEnter}>
              <Image source={png3} resizeMode="stretch" style={styles.fullPage} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
}

export default Welcome;