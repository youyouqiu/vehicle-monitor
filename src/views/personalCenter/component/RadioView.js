import React, { PureComponent } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  rBox: {
    display: 'flex',
    flexWrap: 'nowrap',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rContent: {
    width: 69,
    display: 'flex',
    flexWrap: 'nowrap',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rView: {
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 50,
    borderColor: '#d9d9d9',
    borderWidth: 1,
  },
});

class RadioView extends PureComponent {
  static propTypes = {
    defaultId: PropTypes.number,
    radioList: PropTypes.array,
    onCheck: PropTypes.func,
  };

  static defaultProps = {
    defaultId: 1,
    radioList: [],
    onCheck: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      checkId: 2,
    };
  }

  componentDidMount() {
    const { defaultId } = this.props;
    this.setState({
      checkId: defaultId,
    });
  }

  pressed = (id) => {
    const { onCheck } = this.props;
    this.setState({
      checkId: id,
    }, () => {
      onCheck(id);
    });
  }

  render() {
    const { checkId } = this.state;
    const { radioList } = this.props;

    return (
      <View style={styles.rBox}>
        {
          // eslint-disable-next-line arrow-body-style
          radioList.map((item, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <View key={index} style={styles.rContent}>
                <TouchableOpacity
                  onPress={() => { this.pressed(item.id); }}
                  style={[styles.rView, checkId === radioList.length - index ? { backgroundColor: 'rgb(33,150,243)' } : null]}
                />
                <Text>{item.name}</Text>
              </View>
            );
          })
        }
      </View>
    );
  }
}

export default RadioView;
