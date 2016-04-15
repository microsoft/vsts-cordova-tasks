/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var childProcess = require("child_process");
var path = require("path");
var taskLibrary = require("./lib/vsts-task-lib-proxy.js");

var buildSourceDir = taskLibrary.getVariable("BUILD_SOURCEDIRECTORY", false);
var buildSourcesDir = taskLibrary.getVariable("BUILD_SOURCESDIRECTORY", false);

if (buildSourceDir) {
    process.env["BUILD_SOURCEDIRECTORY"] = buildSourceDir;
}

if (buildSourcesDir) {
    process.env["BUILD_SOURCESDIRECTORY"] = buildSourcesDir;
}

var inputs = ["CWD", "XCODEDEVELOPERDIR", "CONFIGURATION", "ARCHS", "PLATFORM", "TARGETEMULATOR", "WINDOWSAPPX", "WINDOWSONLY", "WINDOWSPHONEONLY", "UNLOCKDEFAULTKEYCHAIN", "DEFAULTKEYCHAINPASSWORD",
    "P12", "P12PWD", "IOSSIGNINGIDENTITY", "PROVPROFILEUUID", "PROVPROFILE", "REMOVEPROFILE", "ANTBUILD", "KEYSTOREFILE", "KEYSTOREPASS", "KEYSTOREALIAS", "KEYPASS", "OUTPUTPATTERN", "CORDOVAARGS", "CORDOVAVERSION"];

for (var i = 0; i < inputs.length; i++) {
    var inputValue = taskLibrary.getInput(inputs[i], false);
    if (inputValue) {
        process.env["INPUT_" + inputs[i]] = inputValue;
    }
}

var result = childProcess.spawnSync("node",
    [path.join(__dirname, "lib", "node-setup.js"), path.join(__dirname, "lib", "cordova-task.js")],
    { stdio: "inherit" });

if (result.status > 0) {
    taskLibrary.setResult(1, "Task failed");
}