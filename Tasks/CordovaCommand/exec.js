/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var childProcess = require("child_process");
var path = require("path");
var taskLibrary = require("./lib/vsts-task-lib-proxy.js");

process.env["BUILD_SOURCEDIRECTORY"] = taskLibrary.getVariable("BUILD_SOURCEDIRECTORY", false);
process.env["BUILD_SOURCESDIRECTORY"] = taskLibrary.getVariable("BUILD_SOURCESDIRECTORY", false);
process.env["INPUT_CWD"] = taskLibrary.getInput("CWD", false);
process.env["INPUT_CORDOVAARGS"] = taskLibrary.getInput("CORDOVAARGS", false);
process.env["INPUT_CORDOVAVERSION"] = taskLibrary.getInput("CORDOVAVERSION", false);
process.env["INPUT_CORDOVACOMMAND"] = taskLibrary.getInput("CORDOVACOMMAND", false);

var result = childProcess.spawnSync("node",
    [path.join(__dirname, "lib", "node-setup.js"), path.join(__dirname, "lib", "cordova-command-task.js")],
    { stdio: "inherit" });

if (result.status > 0) {
    taskLibrary.setResult(1, "Task failed");
}