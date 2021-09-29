import React from 'react';
import PropTypes from 'prop-types';
import {
  requireNativeComponent,
  StyleSheet,
} from 'react-native';

const styles = StyleSheet.create({
  mapStyle: {
    flex: 1,
  },
});

class BaiduPanoView extends React.Component {
  static propTypes = {
    customPanoView: PropTypes.object,
    onPanoramaScreenChange: PropTypes.func,
    onPanoramaClose: PropTypes.func,
    onPanoramaFailed: PropTypes.func,
    onPanoramaSuccess: PropTypes.func,
  }

  static defaultProps = {
    customPanoView: null,
    onPanoramaScreenChange: null,
    onPanoramaClose: null,
    onPanoramaFailed: null,
    onPanoramaSuccess: null,
  }

  render() {
    const {
      customPanoView,
      onPanoramaScreenChange,
      onPanoramaClose,
      onPanoramaFailed,
      onPanoramaSuccess,
    } = this.props;

    return (
      <RNTPano
        style={styles.mapStyle}
        customPanoView={customPanoView}
        onPanoramaScreenChange={
          onPanoramaScreenChange ? data => onPanoramaScreenChange(data.nativeEvent.data) : null}
        onPanoramaClose={
            onPanoramaClose ? data => onPanoramaClose(data.nativeEvent.data) : null}
        onPanoramaFailed={
            onPanoramaFailed ? data => onPanoramaFailed(data.nativeEvent.data) : null}
        onPanoramaSuccess={
            onPanoramaSuccess ? data => onPanoramaSuccess(data.nativeEvent.data) : null}
      />
    );
  }
}

const RNTPano = requireNativeComponent('BaiduPanoView', null);

export default BaiduPanoView;