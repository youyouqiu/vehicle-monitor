import { createStore, applyMiddleware } from 'redux';
import { Map } from 'immutable';
import createSagaMiddleware from 'redux-saga';
import { combineReducers } from 'redux-immutable';
import reducers from './redux';
import { saveAction, saveDispatch } from './utils/network';

// 组装reducer
const allReducers = {};

const keyss = Object.keys(reducers);
for (let i = 0; i < keyss.length; i += 1) {
  const model = reducers[keyss[i]];
  const reducerReg = /(.*)Reducers$/;
  const ms = Object.keys(model);
  for (let j = 0; j < ms.length; j += 1) {
    const m = ms[j];
    if (reducerReg.test(m)) {
      allReducers[m] = model[m];
    }
  }
}

const initialState = Map();

const sagaMiddleware = createSagaMiddleware({
  emitter: emit => (action) => {
    if (Array.isArray(action)) {
      action.forEach(emit);
      return;
    }
    if (/\/SAGA\//g.test(action.type)) {
      saveAction(action);
    }
    saveDispatch(emit);
    emit(action);
  },
});

const store = createStore(
  combineReducers(allReducers),
  initialState,
  applyMiddleware(sagaMiddleware),
);

// 组装saga
const keys = Object.keys(reducers);
for (let i = 0; i < keys.length; i += 1) {
  const model = reducers[keys[i]];
  const sagaReg = /(.*)Saga$/;
  const ms = Object.keys(model);
  for (let j = 0; j < ms.length; j += 1) {
    const m = ms[j];
    if (sagaReg.test(m)) {
      sagaMiddleware.run(model[m]);
    }
  }
}

export default store;
