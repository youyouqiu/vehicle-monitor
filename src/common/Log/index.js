import React from 'react';
import {
  View, Text, FlatList, ScrollView,
} from 'react-native';
import RootSiblings from 'react-native-root-siblings';

const logs = [];
let logSiblings;

export const Log = (T, C) => {
  logs.push({ title: T, content: C });
  if (logSiblings instanceof RootSiblings) {
    logSiblings.destroy();
  }
  logSiblings = new RootSiblings(
    <ScrollView
      style={{
        height: 200,
        backgroundColor: 'black',
        position: 'absolute',
        // bottom: 0,
        // left: 0,
        width: '100%',
      }}
    >

      {
        logs.map(item => <Text style={{ color: '#ffffff' }}>{`${item.title}：${item.content}`}</Text>)
      }
    </ScrollView>,
  );
};
