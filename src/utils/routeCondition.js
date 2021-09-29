import * as React from 'react';
import { StackActions } from '@react-navigation/native';
// eslint-disable-next-line import/no-cycle
import { clearAction } from './network';

const conditions = []; // 存储路由页面的条件，下标跟路由页面一一对应
let activeMonitor = null;
let monitors = null;
let currentRouteKey;

export const isReadyRef = React.createRef();
export const navigationRef = React.createRef();

const isReady = () => navigationRef.current
  && isReadyRef.current && navigationRef.current.getRootState();

export function setMonitors (monitorArr) {
  monitors = monitorArr;
}

export function getMonitors () {
  return monitors;
}

export function isAlreadyExist (id) {
  return monitors.findIndex((item => item.markerId === id)) > -1;
}

export function setMonitor (monitor) {
  activeMonitor = monitor;
  if (isReady()) {
    navigationRef.current.setParams({ activeMonitor, key: 'home' });
  }
}

export function getMonitor () {
  return activeMonitor;
}

export function setCondition (name, condition) {
  conditions.push({
    name,
    condition,
  });
}

export function getCondition () {
  if (conditions.length > 0) {
    return conditions.pop();
  }
  return null;
}

export function setRouteKey (state) {
  if (state && state.routes) {
    currentRouteKey = state.routes[state.routes.length - 1].name;
  }
}

export function getRouteKey () {
  return currentRouteKey;
}

export const go = (name, params) => {
  clearAction();
  const currentSceneCondition = { activeMonitor, ...params };
  if (isReady()) {
    navigationRef.current.navigate(name, currentSceneCondition);
  }
};

export const reset = (name) => {
  if ((currentRouteKey === 'login' && name !== 'login') || currentRouteKey !== 'login') {
    clearAction();
    if (isReady()) {
      navigationRef.current.reset({
        index: 1,
        routes: [{ name }],
      });
    }
  }
};

export const back = () => {
  clearAction();
  if (isReady()) {
    navigationRef.current.setParams({ activeMonitor });
    navigationRef.current.goBack();
  }
};

export const push = (name, params) => {
  clearAction();
  if (isReady()) {
    navigationRef.current.dispatch(
      StackActions.push(name, params),
    );
  }
};

export const pop = (count = 1) => {
  clearAction();
  if (isReady()) {
    navigationRef.current.dispatch(
      StackActions.pop(count),
    );
  }
};

export const popToTop = () => {
  clearAction();
  if (isReady()) {
    navigationRef.current.dispatch(
      StackActions.popToTop(),
    );
  }
};

export function refresh () {
  clearAction();
  const currentSceneCondition = { activeMonitor };
  if (isReady()) {
    navigationRef.current.dispatch(
      StackActions.replace(currentRouteKey, currentSceneCondition),
    );
  }
}
