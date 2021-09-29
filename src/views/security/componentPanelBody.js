import React, { Component } from 'react';
import { is } from 'immutable';
import { PropTypes } from 'prop-types';
import {
  View, Text, StyleSheet, FlatList,
} from 'react-native';
import { getLocale } from '../../utils/locales';

// style
const styles = StyleSheet.create({
  panel_body: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
  },
  list: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: '#DCDCDC',
    borderLeftWidth: 1,
    borderLeftColor: '#DCDCDC',
  },
  item: {
    // flex: 1,
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
});

class PanelBody extends Component {
  // 属性声明
  static propTypes ={
    eventItem: PropTypes.array.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  // 风险事件列表
  renderItem = ({ item, index }) => {
    const flag = (index % 2) === 0;

    return (
      <View style={[styles.list, flag ? styles.grayBg : null]}>
        {/* <View style={[styles.item, { width: '21%' }]}>
          <Text style={styles.txt}>{item.get('riskType')}</Text>
        </View> */}
        <View style={[styles.item, { width: '31%' }]}>
          <Text style={[styles.txt, { textAlign: 'center' }]}>{item.get('riskEvent')}</Text>
        </View>
        <View style={[styles.item, { width: '20%' }]}>
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

  // 列表key
  keyExtractor=(item, index) => (index)

  render() {
    const { eventItem } = this.props;
    return (
      <View>
        {
          eventItem.length > 0
            ? (
              <FlatList
                style={styles.panel_body}
                data={eventItem}
                initialNumToRender={eventItem.length}
                extraData={this.state}
                keyExtractor={this.keyExtractor}
                renderItem={this.renderItem}
              />
            )
            : (
              <View style={styles.empty}>
                <Text>{getLocale('securityEventEmpty')}</Text>
              </View>
            )
        }
      </View>

    );
  }
}

export default PanelBody;