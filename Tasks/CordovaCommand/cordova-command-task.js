/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    tl = require('./lib/vso-task-lib-proxy.js'),
    ttb = require('taco-team-build');


var buildSourceDirectory = tl.getVariable('build.sourceDirectory') || tl.getVariable('build.sourcesDirectory');
//Process working directory
var cwd = tl.getInput('cwd', /*required*/ false) || buildSourceDirectory;
tl.cd(cwd);

callCordova().fail(function (err) {
    console.error(err.message);
    tl.debug('taskRunner fail');
    tl.exit(1);
});

// Main Cordova build exec
function callCordova(code) {
    var cordovaConfig = {
        nodePackageName: 'cordova',
        projectPath: cwd
    };

    var version = tl.getInput('cordovaVersion', /*required*/ false);
    if (version) {
        cordovaConfig.moduleVersion = version;
    }

    return ttb.cacheModule(cordovaConfig).then(function (result) {
        tl.debug('Cordova Module Path: ' + result.path);
        var cordovaCmd = process.platform == 'win32' ? path.resolve(result.path, '..', '.bin', 'cordova.cmd') : path.resolve(result.path, '..', '.bin', 'cordova')
        var commandRunner = new tl.ToolRunner(cordovaCmd, true);
        commandRunner.arg(tl.getDelimitedInput('cordovaCommand', /*delim*/ ' ', /*required*/ true));
        var args = tl.getDelimitedInput('cordovaArgs', /*delim*/ ' ', /*required*/ false);
        if (args) {
            commandRunner.arg(args);
        }

        return commandRunner.exec();
    });
}

