import React from 'react';
import {
  View, Slider,
} from 'react-native';
import NetworkModal from '../../utils/networkModal';
import { SimpleLine } from '../../common/reactNativeD3Charts';


// const styles = StyleSheet.create({
//   listItem: {
//     // textAlign: 'center',
//     padding: 0,
//     paddingHorizontal: 0,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flex: 1,
//     backgroundColor: 'green',
//     // width: ITEM_WIDTH,
//     // borderWidth: 1,
//     // borderColor: 'red',
//   },
//   textItem: {
//     textAlign: 'center',
//     fontSize: 20,
//     color: '#333',
//     padding: 0,
//     paddingHorizontal: 0,

//   },
// });


export default class AreaChartExample extends React.PureComponent {
  handleButton=() => {
    NetworkModal.show({ type: 'timeout' });
  }

  render() {
    return (
      <View style={{
        flex: 1, backgroundColor: 'white', paddingTop: 100,
      }}
      >
        <View style={{
          width: '100%', borderWidth: 1, borderColor: 'blue', height: 80,
        }}
        >
          <Slider minimumTrackTintColor="transparent" maximumTrackTintColor="transparent" />
          <SimpleLine
            style={{
              flex: 1,
            }}
            data={[
              {
                data: [
                  { index: 0, value: 1, color: 'green' },
                  { index: 1, value: 1, color: 'green' },
                  { index: 2, value: 1, color: 'red' },
                  { index: 3, value: 1, color: 'green' },
                  { index: 4, value: 1, color: 'red' },
                ],
                width: 3,
                autoConnectPartition: 'BEFORE',
              },
            ]}
          />
        </View>
      </View>
    );
  }
}