/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var childProcess = require("child_process");
var path = require("path");
var taskLibrary = require("./lib/vsts-task-lib-proxy.js");

var result = childProcess.spawnSync("node", [path.join(__dirname, "lib", "node-setup.js"), path.join(__dirname, "lib", "phonegap-command-task.js")], { stdio: [0, 1, 2] });

if (result.status > 0) {
    taskLibrary.setResult(1, "Task failed");
}