/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var childProcess = require("child_process");
var path = require("path");
var taskLibrary = require("./lib/vsts-task-lib-proxy.js");

process.env["BUILD_SOURCEDIRECTORY"] = taskLibrary.getVariable('BUILD_SOURCEDIRECTORY', false);
process.env["BUILD_SOURCESDIRECTORY"] = taskLibrary.getVariable('BUILD_SOURCESDIRECTORY', false);
process.env["INPUT_CWD"] = taskLibrary.getInput('CWD', false);
process.env["INPUT_XCODEDEVELOPERDIR"] = taskLibrary.getInput('XCODEDEVELOPERDIR', false);
process.env["INPUT_CONFIGURATION"] = taskLibrary.getInput('CONFIGURATION', false);
process.env["INPUT_ARCHS"] = taskLibrary.getInput('ARCHS', false);
process.env["INPUT_PLATFORM"] = taskLibrary.getInput('PLATFORM', false);
process.env["INPUT_TARGETEMULATOR"] = taskLibrary.getInput('TARGETEMULATOR', false);
process.env["INPUT_WINDOWSAPPX"] = taskLibrary.getInput('WINDOWSAPPX', false);
process.env["INPUT_WINDOWSONLY"] = taskLibrary.getInput('WINDOWSONLY', false);
process.env["INPUT_WINDOWSPHONEONLY"] = taskLibrary.getInput('WINDOWSPHONEONLY', false);
process.env["INPUT_UNLOCKDEFAULTKEYCHAIN"] = taskLibrary.getInput('UNLOCKDEFAULTKEYCHAIN', false);
process.env["INPUT_DEFAULTKEYCHAINPASSWORD"] = taskLibrary.getInput('DEFAULTKEYCHAINPASSWORD', false);
process.env["INPUT_P12"] = taskLibrary.getInput('P12', false);
process.env["INPUT_P12PWD"] = taskLibrary.getInput('P12PWD', false);
process.env["INPUT_IOSSIGNINGIDENTITY"] = taskLibrary.getInput('IOSSIGNINGIDENTITY', false);
process.env["INPUT_PROVPROFILEUUID"] = taskLibrary.getInput('PROVPROFILEUUID', false);
process.env["INPUT_PROVPROFILE"] = taskLibrary.getInput('PROVPROFILE', false);
process.env["INPUT_REMOVEPROFILE"] = taskLibrary.getInput('REMOVEPROFILE', false);
process.env["INPUT_ANTBUILD"] = taskLibrary.getInput('ANTBUILD', false);
process.env["INPUT_KEYSTOREFILE"] = taskLibrary.getInput('KEYSTOREFILE', false);
process.env["INPUT_KEYSTOREPASS"] = taskLibrary.getInput('KEYSTOREPASS', false);
process.env["INPUT_KEYSTOREALIAS"] = taskLibrary.getInput('KEYSTOREALIAS', false);
process.env["INPUT_KEYPASS"] = taskLibrary.getInput('KEYPASS', false);
process.env["INPUT_OUTPUTPATTERN"] = taskLibrary.getInput('OUTPUTPATTERN', false);
process.env["INPUT_CORDOVAARGS"] = taskLibrary.getInput('CORDOVAARGS', false);
process.env["INPUT_CORDOVAVERSION"] = taskLibrary.getInput('CORDOVAVERSION', false);

var result = childProcess.spawnSync("node",
    [path.join(__dirname, "lib", "node-setup.js"), path.join(__dirname, "lib", "cordova-task.js")],
    { stdio: "inherit" });

if (result.status > 0) {
    taskLibrary.setResult(1, "Task failed");
}