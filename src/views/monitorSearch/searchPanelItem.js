// import React, { Component } from 'react';
// import { PropTypes } from 'prop-types';
// import {
//   // StyleSheet,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import PanelHead from './componentPanelHead';
// import PanelBody from './componentPanelBody';

// /* const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   count: {
//     height: 30,
//     lineHeight: 30,
//     fontSize: 13,
//     paddingHorizontal: 10,
//   },
//   body: {
//     paddingVertical: 5,
//   },
// }); */

// class SearchPanelItem extends Component {
//     static propTypes = {
//       item: PropTypes.array.isRequired,
//       index: PropTypes.number.isRequired,
//       active: PropTypes.number.isRequired,
//       headClick: PropTypes.func.isRequired,
//       addMonitor: PropTypes.func.isRequired,
//     }

//     constructor(props) {
//       super(props);

//       this.state = {
//         lists: [],
//         assigns: '',
//       };
//     }

//     componentDidMount=() => {
//       const { item } = this.props;
//       this.setState({
//         lists: item.get('lists'),
//         assigns: item.get('assigns'),
//       });
//     }

//     UNSAFE_componentWillReceiveProps(nextProps) {
//       const { item } = nextProps;
//       this.setState({
//         lists: item.get('lists'),
//         assigns: item.get('assigns'),
//       });
//     }

//     shouldComponentUpdate(nextProps, nextState) {
//       return this.isPropsEqual(this.state, nextState);
//     }

//     isPropsEqual(prevState, nextState) {
//       const { assigns } = prevState;
//       const { assigns: assigns1 } = nextState;
//       if (assigns !== assigns1) return true;
//       return false;
//     }

//     searchHeadFun=(index) => {
//       const { headClick } = this.props;
//       if (typeof headClick === 'function') {
//         headClick(index);
//       }
//     }

//     render() {
//       const {
//         index: itemIndex, addMonitor, active,
//       } = this.props;
//       const {
//         lists, assigns,
//       } = this.state;

//       return (
//         <View>
//           <TouchableOpacity
//             activeOpacity={0.6}
//             style={{ width: '100%' }}
//             onPress={() => this.searchHeadFun(itemIndex)}
//           >
//             <PanelHead
//               title={assigns}
//               count={lists.size}
//               isActive={active === itemIndex}
//             />
//           </TouchableOpacity>
//           {active === itemIndex
//             ? (
//               <PanelBody
//                 eventItem={[...lists]}
//                 addMonitor={addMonitor}
//               />
//             )
//             : null
//             }
//         </View>
//       );
//     }
// }

// export default SearchPanelItem;