import React, { Component } from 'react';
import { is } from 'immutable';
import TextInput from '../textInput';

class SearchInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props, nextProps) || !is(this.state, nextState);
  }

  render() {
    return (
      <TextInput {...this.props} />
    );
  }
}

export default SearchInput;