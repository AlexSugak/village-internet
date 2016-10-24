# Village Internet

A demo app showing functional approach to building reactive client-server systems

![demo](https://cloud.githubusercontent.com/assets/2222587/19444726/503391e2-949a-11e6-8dcd-97732bdd5dc7.gif)

## Installation

Requires [nodejs](http://nodejs.org/) and [Mono](http://fsharp.org/use/mac/) on Mac/Linux or [F#](http://fsharp.org/use/windows/) on Windows.

Build server (Mac):
```sh
sh build.sh
```
Build server (Windows):
```sh
build.cmd
```
Then start server from bin/server.exe Or from server.fsx via REPL

Build and start client:
```sh
npm install && webpack-dev-server
```
Then open browser at localhost:8080