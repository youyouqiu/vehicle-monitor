import { Map, List } from 'immutable';


/* eslint no-continue:off */


// reducer
const defaultState = Map({
  markers: new List([
    { markerId: 1, title: '你好' },
    { markerId: 2, title: '朋友' },
  ]),
  selectedMonitors: new List([
    { id: '4527d2e2-b944-458d-ac32-b275e720b6ca', name: '模拟数据1' },
    { id: '3cc0296b-359d-4604-b651-bbaf54323c09', name: '模拟数据2' },
    { id: 'd52ebfa9-170d-4240-92d2-700324285916', name: '模拟数据3' },
    { id: '0bbba143-3aaa-41aa-be54-d4194b56eb73', name: '模拟数据4' },
    { id: '2107dc6e-04c1-4179-93f2-24cabb9792b0', name: '模拟数据5' },
    { id: 'e662972d-002e-4f26-80c7-3352bcc90ac9', name: '模拟数据6' },
    { id: '4cfd05b2-7b77-4ffe-b86a-06218aa0bd9f', name: '模拟数据7' },
  ]),
});

const integratedStatisticsReducers = (state = defaultState, { type }) => {
  switch (type) {
    default:
      return state;
  }
};


// 导出
export default {
  integratedStatisticsReducers,
};
