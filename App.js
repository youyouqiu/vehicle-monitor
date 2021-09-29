import 'react-native-gesture-handler';
import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { RootSiblingParent } from 'react-native-root-siblings';
import * as encoding from 'text-encoding';
import {
  navigationRef, setRouteKey, isReadyRef,
} from './src/utils/routeCondition';
import store from './src/store';
import Navigator from './src/navigator';
import { } from './src/utils/network';

LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs([
  'Require cycle',
  'has been renamed',
  'missing keys for items',
]);

export default function App () {
  React.useEffect(() => () => {
    isReadyRef.current = false;
  }, []);

  return (
    <Provider store={store}>
      <RootSiblingParent>
        <NavigationContainer
          onStateChange={setRouteKey}
          ref={navigationRef}
          onReady={() => {
            isReadyRef.current = true;
          }}
        >
          <Navigator />
        </NavigationContainer>
      </RootSiblingParent>
    </Provider>
  );
}
