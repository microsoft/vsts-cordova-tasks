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

callPhoneGap().fail(function (err) {
    console.error(err.message);
    process.exit(1);
});

// Main PhoneGap command exec
function callPhoneGap() {
    var phonegapConfig = {
        nodePackageName: "phonegap",
        projectPath: workingDirectory
    };

    var version = process.env["INPUT_PHONEGAPVERSION"];
    if (version) {
        phonegapConfig.moduleVersion = version;
    }

    return buildUtilities.cacheModule(phonegapConfig).then(function (phonegapModule) {
        console.log("PhoneGap Module Path: " + phonegapModule.path);

        var phonegapExecutable = process.platform == "win32" ? "phonegap.cmd" : "phonegap";
        var phonegapCmd = path.resolve(phonegapModule.path, "..", ".bin", phonegapExecutable);
        var rawCmd = process.env["INPUT_PHONEGAPCOMMAND"];
        var rawArgs = process.env["INPUT_PHONEGAPARGS"];

        var result = spawnSync(phonegapCmd, [rawCmd, rawArgs], { stdio: "inherit" });

        if (result.status > 0) {
            process.exit(1);
        }

        return Q();
    });
}

