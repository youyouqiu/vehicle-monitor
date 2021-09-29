import React, { Component } from 'react';
import { View } from 'react-native';
import Spinner from 'react-native-spinkit';
import PropTypes from 'prop-types';
import { extend } from 'lodash';

export default class Loading extends Component {
    static propTypes = {
      styles: PropTypes.object,
      isVisible: PropTypes.bool,
      color: PropTypes.string,
      size: PropTypes.number,
      type: PropTypes.string,
      iconType: PropTypes.string,
    }

    static defaultProps = {
      styles: null,
      isVisible: true,
      color: null,
      size: null,
      type: 'inline', // inline, modal ,page
      iconType: 'ThreeBounce',
    }

    render() {
      const {
        styles,
        type,
        isVisible,
        color,
        iconType,
        size,
      } = this.props;
      if (type === 'inline') {
        return !isVisible ? null : <Spinner style={styles} type={iconType} color={color || '#ffffff'} size={size || 30} />;
      }
      if (type === 'page') {
        const pageStyle = extend({
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }, styles);
        return !isVisible ? null : (
          <View style={pageStyle}>
            <Spinner type={iconType} color={color || '#3399ff'} size={size || 50} />
          </View>
        );
      }
      return !isVisible ? null : (
        <View style={{
          position: 'absolute',
          zIndex: 9999,
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 8,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          >
            <Spinner color={color || '#ffffff'} type={iconType || 'FadingCircleAlt'} size={size || 30} />
          </View>
        </View>
      );
    }
}