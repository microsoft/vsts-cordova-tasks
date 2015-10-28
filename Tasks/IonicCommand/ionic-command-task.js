/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    taskLibrary = require('./lib/vso-task-lib-proxy.js'),
    buildUtilities = require('taco-team-build');


var buildSourceDirectory = taskLibrary.getVariable('build.sourceDirectory') || taskLibrary.getVariable('build.sourcesDirectory');
//Process working directory
var workingDirectory = taskLibrary.getInput('cwd', /*required*/ false) || buildSourceDirectory;
taskLibrary.cd(workingDirectory);

callCordova().fail(function (err) {
    console.error(err.message);
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

// Main Cordova build exec
function callCordova(code) {
    // Ionic requires the Cordova CLI in the path		
    return buildUtilities.cacheModule({
        projectPath: workingDirectory,
        nodePackageName: 'cordova',
        moduleVersion: taskLibrary.getInput('cordovaVersion', /*required*/ false)
    }).then(function (result) {
        // Add Cordova to path, then get Ionic
        process.env.PATH = path.resolve(result.path, '..', '.bin') + path.delimiter + process.env.PATH;
        return buildUtilities.cacheModule({
            projectPath: workingDirectory,
            nodePackageName: 'ionic',
            moduleVersion: taskLibrary.getInput('ionicVersion', /*required*/ false)
        });
    }).then(function (result) {
        var ionicPath = path.resolve(result.path, '..', '.bin', 'ionic');
        var commandRunner = new taskLibrary.ToolRunner(ionicPath, true);
        commandRunner.arg(taskLibrary.getDelimitedInput('ionicCommand', /*delim*/ ' ', /*required*/ true));
        var args = taskLibrary.getDelimitedInput('ionicArgs', /*delim*/ ' ', /*required*/ false);
        if (args) {
            commandRunner.arg(args);
        }

        return commandRunner.exec();
    });
}
