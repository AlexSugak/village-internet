import React from 'react'
import ReactDOM from 'react-dom'
import {createStore, applyMiddleware, combineReducers} from 'redux'
import {Provider} from 'react-redux'
import Rx from 'rx'

import {AppContainer} from './App'
import {endpoints, chart} from './reducers'
import {receivedServerState} from './actions'

let createMessagesStream = (url) => {
    let socket = new WebSocket(url)
    let observable = Rx.Observable.create(obs => {
        socket.onmessage = (e) => obs.onNext(e.data)
        socket.onclose = (e) => obs.onCompleted()
        socket.onerror = (e) => obs.onError(e)
        return Rx.Disposable.create(socket.Close)
    }).share()
    let observer = Rx.Observer.create((data) => {
        if (socket.readyState === WebSocket.OPEN) { 
          socket.send(data); 
        }
    });
    return Rx.Subject.create(observer, observable)
}

const wsUri = "ws://127.0.0.1:8080/socket"
let messages = createMessagesStream(wsUri);

const remoteMiddleware = msgObserver => store => next => action => {
  if (action.remote) {
    console.log('sending to server:', action.remote)
    msgObserver.onNext(action.remote)
  }
  return next(action)
}

const createStoreWithMiddleware = applyMiddleware(
  remoteMiddleware(messages)
)(createStore)

const reducers = combineReducers({endpoints, chart})
const store = createStoreWithMiddleware(reducers)



//log all server messages to console
//messages.subscribe(m => console.log('message received:', m));

//echo all heartbeets back to server
messages
  .filter(m => m === 'hb')
  .subscribe(hb => messages.onNext(hb));

//handle state messages
messages
  .filter(m => m !== 'hb')
  .subscribe(
      state => store.dispatch(
                      receivedServerState(
                        JSON.parse(state)))
  );


ReactDOM.render(
  <Provider store={store}>
    <AppContainer>
    </AppContainer>
  </Provider>,
  document.getElementById('app-container')
)