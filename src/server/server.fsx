#r "packages/Suave/lib/net40/Suave.dll"
#r "packages/Rx-Core/lib/net45/System.Reactive.Core.dll"
#r "packages/Rx-Linq/lib/net45/System.Reactive.Linq.dll"
#r "packages/Rx-Interfaces/lib/net45/System.Reactive.Interfaces.dll"
#r "packages/Aether/lib/net35/Aether.dll"
#r "packages/FParsec/lib/net40-client/FParsec.dll"
#r "packages/FParsec/lib/net40-client/FParsecCS.dll"
#r "packages/Chiron/lib/net40/Chiron.dll"
#r "packages/FSharp.Control.Reactive/lib/net45/FSharp.Control.Reactive.dll"

open Suave
open Suave.Http
open Suave.Filters
open Suave.Successful
open Suave.Files
open Suave.RequestErrors
open Suave.Logging

open Chiron
open Chiron.Operators
open Suave.Operators

open System
open System.Text
open System.IO

open Suave.Sockets.Control
open Suave.WebSocket

open System.Reactive.Subjects
open FSharp.Control.Reactive
open FSharp.Control.Reactive.Observable

module Obs = Observable

let sec n = TimeSpan.FromSeconds n
let ms n = TimeSpan.FromMilliseconds n

let utfStr bytes = Encoding.UTF8.GetString bytes
let utfBytes (str: string) = Encoding.UTF8.GetBytes str


type AccountId = AccountId of string

type EndpointStatus = {
  TurnedOn: bool
  Speed: int
}

type AccountState = {
  AccountId: AccountId
  StatusSet: EndpointStatus option
  StatusMeasured: EndpointStatus option
}

type AccountCommand = 
| TurnOn
| TurnOff
| SetSpeedLimit of int

type AccountEvent = 
| StatusMeasured of EndpointStatus
| StatusSet of EndpointStatus


let accountStateReducer state msg =
  match msg with
  | StatusMeasured(s) -> {state with StatusMeasured= Some(s)}
  | StatusSet(s) -> {state with StatusSet= Some(s)}


type ClientId = ClientId of Guid

type ClientEvent = 
  | ClientConnected
  | MessageReceived of string
  | ClientDisconnected 

let clientEvents = new Subject<ClientId*ClientEvent>()

// log all client events to console
clientEvents |> Obs.subscribe (printfn "%A") |> ignore 

type Agent<'T> = Microsoft.FSharp.Control.MailboxProcessor<'T>

let createEndpointAgent validateCommand (accEvents: IObserver<AccountEvent>) = 
  let agent = new Agent<AccountCommand>(fun inbox ->
    let state = ref {TurnedOn= false; Speed= 0}
    let rec handleCmd() = 
      async {
        let! cmd = inbox.Receive()
        match validateCommand !state cmd with
        | Some(TurnOn)           -> state := {!state with TurnedOn= true}
        | Some(TurnOff)          -> state := {!state with TurnedOn= false}
        | Some(SetSpeedLimit(l)) -> state := {!state with Speed= l}
        | None -> printfn "%A is not acceptable for state %A"cmd !state
        
        accEvents.OnNext (StatusSet !state)     
        return! handleCmd()
      } 

    Obs.interval (300.0 |> ms) //emulate periodic measurements
    |> Obs.map (fun i -> state)
    |> Obs.subscribe (fun s -> 
            let level = match (!s).Speed with 
                        | b when b > 0 -> let random = System.Random()
                                          random.Next(b / 2, b)
                        | b -> b 
            accEvents.OnNext (StatusMeasured({!s with Speed= level})))
    |> ignore

    handleCmd()
  )
  agent.Start()
  agent


let validateCommand status cmd = 
  match status, cmd with
  | {TurnedOn=false}, TurnOn -> Some(cmd) // turn on only when currently off
  | {TurnedOn=true}, TurnOff -> Some(cmd) // turn off only when currently on
  | {TurnedOn=true}, SetSpeedLimit(_) -> Some(cmd) // set limit only when on (?)
  | _ -> None // other cases are forbiden

// parse command messages
let (|ClientCommand|_|) (s:string) = 
  let tokens = s.Trim().Split([|' '|]) |> Array.map (fun s -> s.Trim())
  match tokens.[0] with
  | "turnOn" -> (AccountId(tokens.[1]), TurnOn) |> Some
  | "turnOff" -> (AccountId(tokens.[1]), TurnOff) |> Some
  | "setSpeedLimit" -> (AccountId(tokens.[1]), SetSpeedLimit(tokens.[2] |> int)) |> Some
  | _ -> None

// all messages sent by all clients
let clientMessages = clientEvents 
                       |> Obs.choose (function 
                                        | (id, MessageReceived(msg)) -> Some(id, msg) 
                                        | _ -> None)

// all command messages sent by all clients
let clientCommands = clientMessages
                       |> Obs.choose (function 
                                        | (id, ClientCommand(cmd)) -> Some(id, cmd) 
                                        | _ -> None)


// test data
let accounts = 
  [
    AccountId("bob.bobings")
    AccountId("sam.samings")
    AccountId("tor.torbings")
  ] 

let accountEvents = accounts
                      |> List.map (fun id ->
                                    let s = new Subject<AccountEvent>()
                                    (id, s))
                      //|> Observable.ofSeq   // if we need to make list of accounts dynamic 
                                              // e.g. new accounts are connected at runtime

let accountStates = accountEvents
                      |> List.map (fun (id, e) -> 
                                    e 
                                    |> Obs.scanInit { AccountId= id
                                                      StatusMeasured= None
                                                      StatusSet= None }
                                                    accountStateReducer
                                    |> fun s -> (id, s))

let connectEndpoint commands events accountId = 
  let agent = createEndpointAgent validateCommand events

  commands
  |> Obs.map snd // we need all commands
  |> Obs.filter (fun (id, _) -> id = accountId) // to our endpoint
  |> Obs.map snd // and we only care about the command itself
  |> Obs.subscribe agent.Post // that we send to an agent
  |> ignore

  agent // return agent created

// connect all account endpoints
accountEvents 
|> Seq.iter (fun (id, events) -> 
              connectEndpoint clientCommands events id 
              |> ignore)

//type used as payload when sending server state to clients
type AccountDetails = 
  { AccountId: string
    TurnedOn: bool
    SpeedMeasured: int
    SpeedSet: int }
  static member ToJson(x: AccountDetails) =
    Json.write "id" x.AccountId 
    *> Json.write "turnedOn" x.TurnedOn
    *> Json.write "speed" x.SpeedMeasured
    *> Json.write "speedSet" x.SpeedSet
  static member FromState(state: AccountState) = 
    { AccountId = (match state.AccountId with AccountId(s) -> s) 
      TurnedOn = match state.StatusMeasured with 
                 | Some(s) -> s.TurnedOn
                 | None -> false
      SpeedMeasured = match state.StatusMeasured with 
                           | Some(s) -> s.Speed
                           | None -> 0
      SpeedSet = match state.StatusSet with 
                           | Some(s) -> s.Speed
                           | None -> 0}

let appState = accountStates 
                |> Seq.map snd
                |> Obs.combineLatestSeq
                |> Obs.map List.ofSeq

//need to buffer latest state so that new clients receive it when connected
let appStateBuffer = new ReplaySubject<AccountDetails list>(1)
appState
    |> Obs.map (List.map AccountDetails.FromState)
    |> Obs.distinctUntilChanged
    |> Obs.subscribe appStateBuffer.OnNext

let send (ws: WebSocket) text =
  async { 
    do! ws.send Text (text |> utfBytes) true |> Async.Ignore
  }
  |> Async.Start
  
let sendOp (ws: WebSocket) opCode bytes =
  async { 
    do! ws.send opCode bytes true |> Async.Ignore
  } 
  |> Async.Start

let ping ws = 
  Obs.interval (1.0 |> sec) |> Obs.subscribe (fun _ -> send ws "hb")

let listenForEcho clientId messages (events: IObserver<ClientId*ClientEvent>) =
  messages 
  |> Obs.startWith ["hb"]
  |> Obs.filter (fun msg -> msg = "hb")
  |> Obs.throttle (5.0 |> sec)//wait 5 sec before disconnecting client
  |> Obs.subscribe (fun _ -> events.OnNext (clientId, ClientDisconnected))

let socketApp (ws: WebSocket) =
  fun cx -> socket {
    let clientId = Guid.NewGuid() |> ClientId

    //subscribe client to server state updates
    appStateBuffer 
    |> Obs.subscribe (Json.serialize >> Json.format >> send ws)
    |> ignore 

    let clientDisconnected = clientEvents 
                             |> Obs.choose (function 
                                              | (id, ClientDisconnected) -> Some(id) 
                                              | _ -> None)
                             |> Obs.filter (fun id -> id = clientId)
    let loop = ref true
    clientDisconnected 
    |> Obs.subscribe (fun id -> 
                              loop := false
                              sendOp ws Close [||]) 
    |> ignore

    //all messages from connected client
    let messagesFromClient = clientMessages 
                              |> Obs.filter (fun (cId, msg) -> cId = clientId)
                              |> Obs.map snd

    //ping client and listen for echo
    ping ws |> ignore
    listenForEcho clientId messagesFromClient clientEvents |> ignore

    clientEvents.OnNext (clientId, ClientConnected)
    
    while !loop do
      let! msg = ws.read()
      match msg with
      | (Text, data, true) ->
        let str = utfStr data
        clientEvents.OnNext (clientId, MessageReceived str)
      | (Close, _, _) ->
        clientEvents.OnNext (clientId, ClientDisconnected)
        loop := false
      | _ -> ()
  }

let app : WebPart = 
    choose [
        path "/socket" >=> handShake socketApp
        GET >=> choose [
          path "/" >=> browseFileHome "index.html"
          browseHome
        ]
        NOT_FOUND "Found no handlers"
    ]

startWebServer { defaultConfig 
                  with homeFolder = Some (Path.GetFullPath(Environment.CurrentDirectory + "/../yardWeb/dist/"))
               } 
               app 
