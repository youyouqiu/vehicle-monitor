import React, { Component } from 'react';
import { Platform, TextInput } from 'react-native';

export default class LLTextInput extends Component {
  // shouldComponentUpdate(nextProps) {
  //   const { value, defaultValue } = this.props;

  //   return Platform.OS !== 'ios' || (value === nextProps.value && (nextProps.defaultValue === undefined || nextProps.defaultValue === ''))
  //       || (defaultValue === nextProps.defaultValue && (nextProps.value === undefined || nextProps.value === ''));
  // }

  render() {
    return <TextInput {...this.props} />;
  }
}