import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  TouchableHighlight,
  ImageBackground,
} from 'react-native';
import { PropTypes } from 'prop-types';
import wArrowRight from '../../../static/image/wArrowRight.png';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度

const styles = StyleSheet.create({
  textColor: {
    color: '#333',
    marginTop: 2,
  },
  container: {
    paddingTop: 5,
    paddingBottom: 5,
    flexDirection: 'column',
    alignItems: 'center',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  touchContainer: {
    width: '100%',
  },
  infoContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingVertical: 10,
    paddingRight: 10,
  },
  infoBox: {
    flex: 1,
    marginHorizontal: 20,
  },
  textName: {
    fontSize: 20,
    color: '#333',
  },
  arrowRight: {
    width: 17,
    height: 23,
    marginTop: 2,
  },
  imgBox: {
    display: 'flex',
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 60,
    height: 60,
    // backgroundColor: '#fff',
  },
});
class CenterHeader extends Component {
  static propTypes = {
    img: PropTypes.string,
    phone: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    headClick: PropTypes.func.isRequired,
  }

  static defaultProps = {
    img: null,
  }

  headClick=() => {
    const { headClick } = this.props;
    headClick();
  }

  render() {
    const { phone, company, img } = this.props;
    const imgUrl = (img ? img : '');
    return (
      <View style={styles.container}>
        <TouchableHighlight
          onPress={this.headClick}
          underlayColor="transparent"
          style={styles.touchContainer}
        >
          <View style={styles.infoContainer}>
            <ImageBackground
              style={styles.imgBox}
            >
              <Image
                resizeMode="contain"
                style={styles.logo}
                source={{ uri: imgUrl }}
              />
            </ImageBackground>
            <View style={styles.infoBox}>
              <Text
                style={styles.textName}
                numberOfLines={1}
              >
                {phone}
              </Text>
              <Text
                style={styles.textColor}
                numberOfLines={1}
              >
                {company}
              </Text>
            </View>
            <Image
              resizeMode="contain"
              style={styles.arrowRight}
              source={wArrowRight}
            />
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

export default CenterHeader;
