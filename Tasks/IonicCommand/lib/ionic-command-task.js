/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    taskLibrary = require('./vso-task-lib-proxy.js'),
    buildUtilities = require('taco-team-build');


var buildSourceDirectory = taskLibrary.getVariable('build.sourceDirectory') || taskLibrary.getVariable('build.sourcesDirectory');
//Process working directory
var workingDirectory = taskLibrary.getInput('cwd', /*required*/ false) || buildSourceDirectory;
taskLibrary.cd(workingDirectory);

callIonic().fail(function (err) {
    console.error(err.message);
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

// Main Ionic command exec
function callIonic() {
    // Ionic requires the Cordova CLI in the path		
    return buildUtilities.cacheModule({
        projectPath: workingDirectory,
        nodePackageName: 'cordova',
        moduleVersion: taskLibrary.getInput('cordovaVersion', /*required*/ false)
    }).then(function (cordovaModule) {
        taskLibrary.debug('Cordova Module Path: ' + cordovaModule.path);

        // Add Cordova to path, then get Ionic
        process.env.PATH = path.resolve(cordovaModule.path, '..', '.bin') + path.delimiter + process.env.PATH;
        return buildUtilities.cacheModule({
            projectPath: workingDirectory,
            nodePackageName: 'ionic',
            moduleVersion: taskLibrary.getInput('ionicVersion', /*required*/ false)
        });
    }).then(function (ionicModule) {
        taskLibrary.debug('Ionic Module Path: ' + ionicModule.path);
        
        var ionicExecutable = process.platform == 'win32' ? 'ionic.cmd' : 'ionic';
        var ionicCmd = path.resolve(ionicModule.path, '..', '.bin', ionicExecutable);
        var commandRunner = new taskLibrary.ToolRunner(ionicCmd);
        
        var rawCmd = taskLibrary.getInput('ionicCommand', /* required */ false);
        commandRunner.arg(rawCmd);
        var rawArgs = taskLibrary.getInput('ionicArgs', /* required */ false);
        if (rawArgs) {
            commandRunner.arg(rawArgs);
        }

        return commandRunner.exec();
    });
}
