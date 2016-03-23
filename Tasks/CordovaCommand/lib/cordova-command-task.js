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
process.chdir(workingDirectory);

callCordova().fail(function (err) {
    console.error(err.message);
    process.exit(1);
});

// Main Cordova command exec
function callCordova() {
    var cordovaConfig = {
        nodePackageName: "cordova",
        projectPath: workingDirectory
    };

    var version = process.env["INPUT_CORDOVAVERSION"];
    if (version) {
        cordovaConfig.moduleVersion = version;
    }

    return buildUtilities.cacheModule(cordovaConfig).then(function (cordovaModule) {
        console.log("Cordova Module Path: " + cordovaModule.path);

        var cordovaExecutable = process.platform == "win32" ? "cordova.cmd" : "cordova";
        var cordovaCmd = path.resolve(cordovaModule.path, "..", ".bin", cordovaExecutable);
        var rawCmd = process.env["INPUT_CORDOVACOMMAND"];
        var rawArgs = process.env["INPUT_CORDOVAARGS"];

        var result = spawnSync(cordovaCmd, [rawCmd, rawArgs], { stdio: "inherit" });

        if (result.status > 0) {
            process.exit(1);
        }

        return Q();
    });
}

