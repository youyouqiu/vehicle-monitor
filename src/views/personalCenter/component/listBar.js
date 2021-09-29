import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableHighlight,
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
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    height: 46,
    paddingHorizontal: 26,
    alignItems: 'center',
  },
});
class ListBar extends Component {
    static propTypes = {
      barList: PropTypes.array.isRequired,
      clickFun: PropTypes.func,
    }

    static defaultProps = {
      clickFun: null,
    }

    click=(val) => {
      const { clickFun } = this.props;
      if (clickFun) {
        clickFun(val);
      }
    }

    render() {
      const { barList } = this.props;
      const Len = barList.length - 1;
      return (
        <View style={styles.container}>
          {
                barList.map((val, index) => (
                  (Len === index) ? (
                    <TouchableHighlight
                      underlayColor="transparent"
                      onPress={() => this.click(val.urlComponent)}
                    >
                      <View style={[styles.item, { borderBottomWidth: 0 }]}>
                        <Text style={styles.textColor}>
                          {val.leftTit}
                        </Text>
                        {
                          val.rightTit ? (
                            <Text style={{ fontSize: 12, marginVertical: 3 }}>
                              {val.rightTit}
                            </Text>
                          ) : (null)
                      }
                      </View>
                    </TouchableHighlight>
                  ) : (
                    <TouchableHighlight
                      // key={val}
                      underlayColor="transparent"
                      onPress={() => this.click(val.urlComponent)}
                    >
                      <View style={[styles.item]}>
                        <Text style={styles.textColor}>
                          {val.leftTit}
                        </Text>
                        {
                          val.rightTit ? (
                            <Text style={{ fontSize: 12, marginVertical: 3 }}>
                              {val.rightTit}
                            </Text>
                          ) : (null)
                      }
                      </View>
                    </TouchableHighlight>
                  )
                ))
            }
        </View>
      );
    }
}

export default ListBar;
