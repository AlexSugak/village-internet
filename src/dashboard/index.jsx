import React from 'react'
import ReactDOM from 'react-dom'
import {createStore, applyMiddleware, combineReducers} from 'redux'
import {Provider} from 'react-redux'


import {AppContainer} from './components/App'
import {endpoints} from './reducers'
import {receivedServerState} from './actions'

const reducers = combineReducers({endpoints})
const store = createStore(reducers)

const wsUri = "ws://localhost:8083/socket"

import Rx from 'rx'

let createMessagesStream = (url) => {
    let socket = new WebSocket(url)
    let observable = Rx.Observable.create(obs => {
        socket.onmessage = (e) => obs.onNext(e.data)
        socket.onclose = (e) => obs.onCompleted()
        socket.onerror = (e) => obs.onError(e)

        return Rx.Disposable.create(socket.Close)
    }).share()

    let observer = Rx.Observer.create((data) => {
        if (socket.readyState === WebSocket.OPEN) { socket.send(data); }
    });

    return Rx.Subject.create(observer, observable)
}

let messages = createMessagesStream(wsUri);

//log all server messages to console
messages.subscribe(m => console.log('message received:', m));

//echo all heartbeets back to server
messages.filter(m => m === 'hb').subscribe(hb => messages.onNext(hb));

//handle state messages
messages
.filter(m => m !== 'hb')
.subscribe(
    state => store.dispatch(receivedServerState(JSON.parse(state)))
);

window.messages = messages

ReactDOM.render(
  <Provider store={store}>
    <AppContainer>
    </AppContainer>
  </Provider>,
  document.getElementById('app-container')
)