open System
open System.IO
open Fake.NpmHelper
// include Fake libs
#r "./packages/FAKE/tools/FakeLib.dll"

open Fake

// Directories
let buildDir  = "./build/"
let deployDir = "./deploy/"
let clientDir = "../dashboard"

// Filesets
let appReferences  =
    !! "/**/*.csproj"
      ++ "/**/*.fsproj"

let all s = true

// version info
let version = "0.1"  // or retrieve from CI server

// Targets
Target "Clean" (fun _ ->
    CleanDirs [buildDir; deployDir]
)

Target "BuildServer" (fun _ ->
    // compile all projects below src/app/
    MSBuildDebug buildDir "Build" appReferences
        |> Log "AppBuild-Output: "
)

Target "RestoreClient" (fun _ ->
    Npm (fun p ->
            { p with
                Command = NpmCommand.Install Standard
                WorkingDirectory = (clientDir)
    })
)

Target "BuildClient" (fun _ ->
    Npm (fun p ->
            { p with
                Command = NpmCommand.Run "build"
                WorkingDirectory = (clientDir)
    })
)

Target "Publish" (fun _ ->
    CopyDir (buildDir @@ "client") (clientDir @@ "dist") all
)

Target "Run" (fun _ ->
  let url = sprintf "http://127.0.0.1:8080/"
  System.Diagnostics.Process.Start(Path.GetFullPath(buildDir @@ "server.exe")) |> ignore
  System.Diagnostics.Process.Start(url) |> ignore
  System.Console.ReadLine() |> ignore
)

Target "Deploy" (fun _ ->
    !! (buildDir + "/**/*.*")
        -- "*.zip"
        |> Zip buildDir (deployDir + "ApplicationName." + version + ".zip")
)

// Build order
"Clean"
  ==> "BuildServer"
  ==> "RestoreClient"
  ==> "BuildClient"
  ==> "Publish"
  ==> "Run"

"Publish"
  ==> "Deploy"

// start build
RunTargetOrDefault "Run"
