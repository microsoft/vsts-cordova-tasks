/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require("path"),
    tl = require("./lib/vso-task-lib-proxy.js"),
    ttb = require("taco-team-build");


var buildSourceDirectory = tl.getVariable("build.sourceDirectory") || tl.getVariable("build.sourcesDirectory");
//Process working directory
var cwd = tl.getInput("cwd") || buildSourceDirectory;
tl.cd(cwd);

callCordova()
    .fail(function (err) {
    console.error(err.message);
    tl.debug("taskRunner fail");
    tl.exit(1);
});

// Main Cordova build exec
function callCordova(code) {
    // Ionic requires the Cordova CLI in the path		
    return ttb.cacheModule({
        projectPath: cwd,
        nodePackageName: "cordova",
        moduleVersion: tl.getInput("cordovaVersion", /*required*/ false)
    })
        .then(function (result) {
        // Add Cordova to path, then get Ionic
        process.env.PATH = path.resolve(result.path, "..", ".bin") + path.delimiter + process.env.PATH;
        return ttb.cacheModule({
            projectPath: cwd,
            nodePackageName: "ionic",
            moduleVersion: tl.getInput("ionicVersion", /*required*/ false) || ""  //Empty string will attempt to use latest
        });
    })
        .then(function (result) {
        var ionicPath = process.platform == "win32" ? path.resolve(result.path, "..", ".bin", "ionic.cmd") : path.resolve(result.path, "..", ".bin", "ionic")
        var commandRunner = new tl.ToolRunner(ionicPath, true);
        commandRunner.arg(tl.getDelimitedInput("ionicCommand", /*delim*/ " ", /*required*/ true));
        var args = tl.getDelimitedInput("ionicArgs", /*delim*/ " ", /*required*/ false);
        if (args) {
            commandRunner.arg(args);
        }

        return commandRunner.exec();
    });
}
