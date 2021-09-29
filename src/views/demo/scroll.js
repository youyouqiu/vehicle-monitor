import React, { Component } from 'react';
import {
  View, StyleSheet, ScrollView, Text,
} from 'react-native';

const styles = StyleSheet.create({
  topContainer: {
    height: 180,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 7,
    height: 150,
    backgroundColor: 'green',
  },
  chart: {
    height: 150,
    backgroundColor: 'white',
  },
  selector: {
    height: 150,
    flex: 1,
    // paddingTop: 20,
  },
  selectorText: {
    color: '#616161',
    lineHeight: 15,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 5,
  },
  activeText: {
    color: '#1b96f3',
    textDecorationColor: '#1b96f3',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  translucenseLayerTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 20,
    backgroundColor: 'rgba(255,255,255,.5)',
    zIndex: 2,
  },
  translucenseLayerBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 30,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,.5)',
  },
});

export default class Scroll extends Component {
  render() {
    const attachIndex = 1;
    const list = [' ', '传感器一', '传感器二', '传感器三', '传感器四', '传感器五', ' '];
    return (
      <View style={{ flex: 1, backgroundColor: 'white', paddingTop: 50 }}>
        <View style={styles.container}>
          <View style={styles.chartContainer} />
          <View style={styles.selector}>

            <ScrollView>
              {
                list.map((item, index) => (
                  <Text
                    style={[styles.selectorText, index === attachIndex ? styles.activeText : null]}
                    onPress={() => { this.handleAttachChange(item, index); }}
                  >
                    {item}
                  </Text>
                ))
            }
            </ScrollView>
            <View style={styles.translucenseLayerTop} />
            <View style={styles.translucenseLayerBottom} />
          </View>
        </View>
      </View>
    );
  }
}