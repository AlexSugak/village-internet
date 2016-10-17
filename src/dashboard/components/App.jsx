import React from 'react'
import {Navbar, Nav, NavItem, Badge, ProgressBar} from 'react-bootstrap'
import Switch from 'react-bootstrap-switch'
import {connect} from 'react-redux'
import * as actions from '../actions'

const TopNav = ({projectName}) => {
    return (
        <Navbar>
            <Navbar.Header>
                <Navbar.Brand>
                    <a href="#">{projectName}</a>
                </Navbar.Brand>
                <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
                <Nav>
                    <NavItem eventKey={1} href="#">Home</NavItem>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    )
}

const SpeedBar = ({min, max, value}) => (
    <ProgressBar
            now={value} 
            min={min} 
            max={max}
            label={`${value} Mb/s`} 
            />
)

const SpeedLimit = ({endpointId, currentLimit, onSetSpeed}) => (
    <input 
        onChange={e => onSetSpeed(endpointId, e.currentTarget.valueAsNumber)} 
        value={currentLimit} 
        type="range" 
        min="0" 
        max="100" 
        step="1" />
)

const EndpointInfo = ({endpoint}) => (
    <div className="col-md-2">
        <h4 style={{display:'inline', marginRight:'5px'}}>{endpoint.id}</h4><br/>
        <span className="label label-info">{`${endpoint.speedSet} Mb/s`}</span>
    </div>
)

const Endpoint = ({endpoint, onTurnOn, onTurnOff, onSetSpeed}) => (
    <div className="row" style={{paddingBottom: '10px'}}>
        <EndpointInfo endpoint={endpoint} />
        <div className="col-md-1">
            <Switch 
                value={endpoint.turnedOn}
                onChange={(e, v) => endpoint.turnedOn ? onTurnOff(endpoint.id) : onTurnOn(endpoint.id)} 
                onColor="success" 
                offColor="danger" 
                bsSize="mini" />
        </div>
        {endpoint.turnedOn && <div className="col-md-9">
            <SpeedBar min={0} max={100} value={endpoint.speed} />
            <SpeedLimit 
                endpointId={endpoint.id}
                onSetSpeed={onSetSpeed} 
                currentLimit={endpoint.speedSet} />
        </div>}
    </div>
)

const EndpointsList = ({endpoints, onTurnOn, onTurnOff, onSetSpeed}) => (
    <div>
        {endpoints.map(e => <Endpoint 
                                key={e.id} 
                                endpoint={e} 
                                onTurnOn={onTurnOn} 
                                onTurnOff={onTurnOff} 
                                onSetSpeed={onSetSpeed} />)}
    </div>
)

export const App = ({endpoints, setSpeed, turnOn, turnOff}) => (
    <div className="container">
        <TopNav projectName="Village Internet" />
        <div>
            <EndpointsList 
                endpoints={endpoints}
                onSetSpeed={setSpeed}
                onTurnOn={turnOn}
                onTurnOff={turnOff} />
        </div>
    </div>
)

export const AppContainer = connect(
    (store) => { return {
        endpoints: store.endpoints
    }},
    actions
)(App)