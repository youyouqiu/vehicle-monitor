import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';

// import { getLocale } from '../../utils/locales';

const windowWidth = Dimensions.get('window').width; // 获取屏幕宽度


const styles = StyleSheet.create({
  textColor: {
    color: '#333',
    fontSize: 16,
  },
  container: {
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eee',
    // fontWeight: 'bold',
    marginTop: 10,
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
});
class SingleBar extends Component {
    static propTypes = {
      leftTit: PropTypes.string.isRequired,
    }

      static defaultProps = {

      }

      render() {
        const { leftTit } = this.props;
        return (
          <View style={styles.container}>
            <Text style={styles.textColor}>
              {leftTit}
            </Text>
            {/* <Text style={styles.textColor}>哈哈哈</Text> */}
          </View>
        );
      }
}

export default SingleBar;
