

export function receivedServerState(state){
    return {
        type: 'RECEIVED_SERVER_STATE',
        state
    }
}

export function setSpeed(id, volume){
    return {
        type: 'SET_ENDPOINT_SPEED',
        id,
        volume,
        remote: `setSpeedLimit ${id} ${volume}`
    }
}

export function turnOn(id){
    return {
        type: 'TURN_ENDPOINT_ON',
        id,
        remote: `turnOn ${id}`
    }
}

export function turnOff(id){
    return {
        type: 'TURN_ENDPOINT_OFF',
        id,
        remote: `turnOff ${id}`
    }
}