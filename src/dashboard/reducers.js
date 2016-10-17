
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
            return action.state;
        case 'SET_ENDPOINT_SPEED':
            return state.map(e => e.id === action.id 
                                ? setSpeedSet(e)
                                : e);
        default:
            return state;
    }
}