

export function receivedServerState(state){
    return {
        type: 'RECEIVED_SERVER_STATE',
        state
    }
}

export function setSpeed(id, speed){
    return {
        type: 'SET_ENDPOINT_SPEED',
        id,
        speed,
        remote: `setSpeedLimit ${id} ${speed}`
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

export function endpointSelected(id){
    return {
        type: 'ENDPOINT_SELECTED',
        id
    }
}