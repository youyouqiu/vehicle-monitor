import React, { Component } from 'react';
import {
  requireNativeComponent,
  View,
  Platform,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

// const settings = {
//   name: 'ZWOpenGLView',
//   propTypes: {
//     socketUrl: PropTypes.string,
//     ifOpenVideo: PropTypes.bool,
//     ...View.propTypes, // 包含默认的View的属性
//   },
// };
const RNTVideo = requireNativeComponent('ZWOpenGLView', null);

const styles = StyleSheet.create({
  videoBoxStyle: {
    height: 200,
    width: 200,
  },
  videoStyle: {
    width: '100%',
    height: '100%',
  },
});

class RNTVideoView extends Component {
  static propTypes={
    socketUrl: PropTypes.string.isRequired,
    ifOpenVideo: PropTypes.bool,
    ...View.propTypes,
  }

  static defaultProps ={
    ifOpenVideo: true,
  };

  getVideo=() => {
    const { socketUrl, ifOpenVideo } = this.props;
    let view;

    if (Platform.OS === 'android') {
      view = ifOpenVideo
        ? (
          <RNTVideo
            style={styles.videoStyle}
            socketUrl={socketUrl}
            ifOpenVideo={ifOpenVideo}
          />
        ) : null;
    } else {
      const ifShow = ifOpenVideo ? null : ({ display: 'none' });

      view = (
        <RNTVideo
          ifOpenVideo={ifOpenVideo}
          style={[styles.videoStyle, ifShow]}
          socketUrl={socketUrl}
          onVideoStateChange={this.onVideoStateChange}
        />
      );
    }
    return view;
  }

  render() {
    const { style } = this.props;


    return (
      <View
        style={[styles.videoBoxStyle, style]}
      >
        {
          this.getVideo()
        }
      </View>
    );
  }
}

module.exports = RNTVideoView;