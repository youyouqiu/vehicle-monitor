/**
 * Created by aoxianghua on 2018/9/5.
 */
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
// import Stomp from 'stompjs';
import { requestConfig } from './env';

const httpBaseConfig = requestConfig();

const WebsocketUtil = {
  socket: null,
  // subscribeArr: [],
  url: '',
  conFlag: false,
  // unsubscribeMap: {},
  subscribeMap: new Map(),
  stompClient: null,
  reconnectionState: false,
  init: (url, headers, success, close) => {
    const $this = WebsocketUtil;
    $this.clearData();
    $this.url = `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}${url}`;
    $this.stompClient = new Client({
      connectHeaders: headers,
      webSocketFactory: () => new SockJS($this.url),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onWebSocketClose (event) {
        console.log('Websocket close observed:', event);
      },
      onWebSocketError (event) {
        console.log('Websocket error observed:', event);
      },
      onStompError (frame) {
        console.log('Stomp error:', frame);
      },
      onConnect () {
        console.log('socket连接上了');
        $this.conFlag = true;
        if (typeof success === 'function') {
          success();
        }
        $this.reconnection();
      },
      onDisconnect () {
        console.log('socket断开了');
        $this.conFlag = false;
        if (typeof close === 'function') {
          close();
        }
      },
      debug (str) {
        // console.log(str);
      },
    });
    $this.stompClient.activate();
  },
  send: (destination, headers = {}, data = {}) => {
    const $this = WebsocketUtil;
    const header = Object.assign({}, headers);
    const skipContentLengthHeader = headers['content-length'] === false;
    if (skipContentLengthHeader) {
      delete header['content-length'];
    }
    if ($this.stompClient && $this.stompClient.connected) {
      $this.stompClient.publish({ destination, headers: header, body: JSON.stringify(data) });
    }
  },
  subscribeAndSend: (subUrl, callBack, sendUrl, headers, request, key) => {
    const $this = WebsocketUtil;
    const urlKey = `${subUrl}${key}`;
    if (!$this.subscribeMap.has(urlKey)) {
      const stompSubscribe = $this.stompClient.subscribe(subUrl, callBack);
      $this.subscribeMap.set(urlKey, {
        subUrl,
        callBack,
        sendUrl,
        headers,
        key,
        stompSubscribe,
        request,
      });
    }
    $this.send(sendUrl, headers, request);
    $this.setSubscribeData(urlKey, request);
  },
  subscribe: (headers, subUrl, callBack, sendUrl, request, key) => {
    const $this = WebsocketUtil;
    if ($this.conFlag) {
      if ($this.stompClient && $this.stompClient.connected) {
        $this.subscribeAndSend(subUrl, callBack, sendUrl, headers, request, key);
      }
    }
  },
  unsubscribealarm: (headers, url, request, subUrl, key) => {
    const $this = WebsocketUtil;
    $this.send(url, headers, request);
    const urlKey = `${subUrl}${key}`;
    $this.deleteSubscribeData(urlKey, request);
  },
  unsubscribe: (url, key) => {
    const $this = WebsocketUtil;
    const urlKey = `${url}${key}`;
    const subscribeData = $this.subscribeMap.get(urlKey);
    if (subscribeData && subscribeData.stompSubscribe) {
      subscribeData.stompSubscribe.unsubscribe();
      $this.subscribeMap.delete(urlKey);
    }
  },
  close: () => {
    const $this = WebsocketUtil;
    if ($this.stompClient) {
      $this.stompClient.deactivate();
    }
    $this.clearData();
  },
  clearData: () => {
    const $this = WebsocketUtil;
    $this.url = '';
    $this.conFlag = false;
    $this.subscribeMap = new Map();
    $this.stompClient = null;
    $this.reconnectionState = false;
  },
  // 重连
  reconnection: () => {
    const $this = WebsocketUtil;
    const values = [...$this.subscribeMap.values()];
    console.log('socket重新订阅', values);
    $this.subscribeMap = new Map();
    for (let i = 0; i < values.length; i += 1) {
      const info = values[i];
      $this.subscribe(
        info.headers,
        info.subUrl,
        info.callBack,
        info.sendUrl,
        info.request,
        info.key,
      );
    }
  },
  setSubscribeData: (key, request) => {
    const $this = WebsocketUtil;
    const subscribeData = $this.subscribeMap.get(key);
    if (subscribeData && subscribeData.request && Array.isArray(subscribeData.request.data)
      && request && Array.isArray(request.data)) {
      const data = Array.from(new Set([...subscribeData.request.data, ...request.data]));
      subscribeData.request.data = data;
      $this.subscribeMap.delete(key);
      $this.subscribeMap.set(key, subscribeData);
    }
  },
  deleteSubscribeData: (key, request) => {
    const $this = WebsocketUtil;
    const subscribeData = $this.subscribeMap.get(key);
    if (subscribeData && subscribeData.request && Array.isArray(subscribeData.request.data)
      && request && Array.isArray(request.data)) {
      const ids = request.data.map(item => item.vehicleId);
      const data = subscribeData.request.data.filter(item => ids.indexOf(item) === -1);
      subscribeData.request.data = data;
      $this.subscribeMap.delete(key);
      $this.subscribeMap.set(key, subscribeData);
    }
  },
};

export default WebsocketUtil;
