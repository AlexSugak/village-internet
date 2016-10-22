
const initialState = [
    //{ id: "acc1", turnedOn: true, speed: 35, speedSet: 40},
    //{ id: "acc2", turnedOn: false}
]

const setSpeedSet = (endpoint, speed) => {
    if(speed !== undefined) {
        endpoint.speedSet = speed
    }
    return endpoint
}

export function endpoints(state=initialState, action){
    switch (action.type) {
        case 'RECEIVED_SERVER_STATE':
            return action.state
        case 'SET_ENDPOINT_SPEED':
            return state.map(e => e.id === action.id 
                                ? setSpeedSet(e, action.speed)
                                : e)
        default:
            return state
    }
}

const rememberSpeed = (history, id, newSpeed) => {
    let newHistory = history || []
    let newRecord = newSpeed
                        .filter(d => d.id === id)
                        .map(d => { 
                            return { 
                                speed: d.speed, 
                                limit: d.speedSet
                            }
                        })[0]

    newHistory.push(newRecord)

    if(newHistory.length > 20){
        newHistory = newHistory.slice(1);
    }

    if(newHistory.length < 20){
        while(newHistory.length < 20){
            newHistory.push(newRecord);
        }
    }

    return newHistory
}

export function chart(state={}, action){
    switch (action.type) {
        case 'RECEIVED_SERVER_STATE':
            return state.selected 
                    ? Object.assign(state, {data: rememberSpeed(state.data, state.selected, action.state)}) 
                    : state
        case 'ENDPOINT_SELECTED':
            return Object.assign(state, {selected: action.id, data: []})
        default:
            return state
    }
}