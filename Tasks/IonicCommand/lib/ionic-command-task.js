/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require("path"),
    Q = require("q"),
    buildUtilities = require("taco-team-build");

var spawnSync = require("child_process").spawnSync;

var buildSourceDirectory = process.env["BUILD_SOURCEDIRECTORY"] || process.env["BUILD_SOURCESDIRECTORY"];
//Process working directory
var workingDirectory = process.env["INPUT_CWD"] || buildSourceDirectory;
if (workingDirectory) {
    process.chdir(workingDirectory);
}

callIonic().fail(function (err) {
    console.error(err.message);
    process.exit(1);
});

// Main Ionic command exec
function callIonic() {
    // Ionic requires the Cordova CLI in the path		
    return buildUtilities.cacheModule({
        projectPath: workingDirectory,
        nodePackageName: "cordova",
        moduleVersion: process.env["INPUT_CORDOVAVERSION"]
    }).then(function (cordovaModule) {
        console.log("Cordova Module Path: " + cordovaModule.path);

        // Add Cordova to path, then get Ionic
        process.env.PATH = path.resolve(cordovaModule.path, "..", ".bin") + path.delimiter + process.env.PATH;
        return buildUtilities.cacheModule({
            projectPath: workingDirectory,
            nodePackageName: "ionic",
            moduleVersion: process.env["INPUT_IONICVERSION"]
        });
    }).then(function (ionicModule) {
        console.log("Ionic Module Path: " + ionicModule.path);

        var ionicExecutable = process.platform == "win32" ? "ionic.cmd" : "ionic";
        var ionicCmd = path.resolve(ionicModule.path, "..", ".bin", ionicExecutable);
        var rawCmd = process.env["INPUT_IONICCOMMAND"];
        var rawArgs = process.env["INPUT_IONICARGS"];

        var spawnArgs = [];

        if (rawCmd) {
            spawnArgs.push(rawCmd);
        }

        if (rawArgs) {
            spawnArgs.push(rawArgs);
        }

        var result = spawnSync(ionicCmd, spawnArgs, { stdio: "inherit" });

        if (result.status > 0) {
            process.exit(1);
        }

        return Q();
    });
}
