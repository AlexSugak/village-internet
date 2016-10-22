import React from 'react'
import {Navbar, Nav, NavItem, Badge, ProgressBar} from 'react-bootstrap'
import Switch from 'react-bootstrap-switch'
import {LineChart, XAxis, YAxis, Line, Tooltip, CartesianGrid, ResponsiveContainer} from 'recharts'
import {connect} from 'react-redux'
import * as actions from '../actions'


const EndpointChart = ({data}) => (
    <div className="row">
        <div className="col-md-11" style={{height: '400px', paddingTop:'20px'}}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis tick={false}/>
                    <YAxis tickCount={10}/>
                    <Tooltip />
                    <CartesianGrid />
                    <Line dataKey="speed" isAnimationActive={false} unit="Mb/s" />
                    <Line dataKey="limit" isAnimationActive={false} unit="Mb/s" stroke="red"/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
)

const TopNav = ({projectName}) => (
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

const SpeedBar = ({min, max, value}) => (
    <ProgressBar
            now={value} 
            min={min} 
            max={max}
            label={`${value} Mb/s`} 
            />
)

const SpeedLimit = ({currentLimit, onSetSpeed}) => (
    <input 
        onChange={e => onSetSpeed(e.currentTarget.valueAsNumber)} 
        value={currentLimit} 
        type="range" 
        min="0" 
        max="100" 
        step="1" />
)

const EndpointInfo = ({endpoint, onSelectEndpoint}) => (
    <div className="col-md-2">
        <a href="#" onClick={onSelectEndpoint}>
            {endpoint.id}
        </a><br/>
        <span className="label label-info">
            {`${endpoint.speedSet} Mb/s`}
        </span>
    </div>
)

const Endpoint = ({endpoint, onTurnOn, onTurnOff, onSetSpeed, onSelectEndpoint}) => (
    <div className="row" style={{paddingBottom: '10px'}}>
        <EndpointInfo endpoint={endpoint} onSelectEndpoint={() => onSelectEndpoint(endpoint.id)} />
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
                currentLimit={endpoint.speedSet} 
                onSetSpeed={s => onSetSpeed(endpoint.id, s)} 
                />
        </div>}
    </div>
)

const EndpointsList = ({endpoints, onTurnOn, onTurnOff, onSetSpeed, onSelectEndpoint}) => (
    <div>
        {endpoints.map(e => 
            <Endpoint 
                key={e.id} 
                endpoint={e} 
                onTurnOn={onTurnOn} 
                onTurnOff={onTurnOff} 
                onSetSpeed={onSetSpeed} 
                onSelectEndpoint={onSelectEndpoint}
                />)}
    </div>
)

export const App = ({endpoints, chart, setSpeed, turnOn, turnOff, endpointSelected}) => (
    <div className="container">
        <TopNav projectName="Village Internet" />
        <EndpointsList 
            endpoints={endpoints}
            onSetSpeed={setSpeed}
            onTurnOn={turnOn}
            onTurnOff={turnOff} 
            onSelectEndpoint={endpointSelected}/>
        {chart && chart.selected && <div>
            <h4>{chart.selected} speed:</h4>
            <EndpointChart data={chart.data}/>
        </div>}
    </div>
)

export const AppContainer = connect(
    (store) => { return {
        endpoints: store.endpoints,
        chart: store.chart
    }},
    actions
)(App)