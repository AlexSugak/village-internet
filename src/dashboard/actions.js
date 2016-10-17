

export function receivedServerState(state){
    return {
        type: 'RECEIVED_SERVER_STATE',
        state
    }
}

export function setSpeed(id, volume){
    window.messages.onNext(`setSpeedLimit ${id} ${volume}`);
    return {
        type: 'SET_ENDPOINT_SPEED',
        id,
        volume
    }
}

export function turnOn(id){
    window.messages.onNext(`turnOn ${id}`);
    return {
        type: 'TURN_ENDPOINT_ON',
        id
    }
}

export function turnOff(id){
    window.messages.onNext(`turnOff ${id}`);
    return {
        type: 'TURN_ENDPOINT_ON',
        id
    }
}