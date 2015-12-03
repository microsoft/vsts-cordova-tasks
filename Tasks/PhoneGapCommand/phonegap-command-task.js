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

callPhoneGap().fail(function (err) {
    console.error(err.message);
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

// Main PhoneGap command exec
function callPhoneGap() {
    var phonegapConfig = {
        nodePackageName: 'phonegap',
        projectPath: workingDirectory
    };

    var version = taskLibrary.getInput('phonegapVersion', /*required*/ false);
    if (version) {
        phonegapConfig.moduleVersion = version;
    }

    return buildUtilities.cacheModule(phonegapConfig).then(function (phonegapModule) {
        taskLibrary.debug('PhoneGap Module Path: ' + phonegapModule.path);
         
        var phonegapExecutable = process.platform == 'win32' ? 'phonegap.cmd' : 'phonegap';
        var phonegapCmd = path.resolve(phonegapModule.path, '..', '.bin', phonegapExecutable);
        var commandRunner = new taskLibrary.ToolRunner(phonegapCmd);

        commandRunner.arg(taskLibrary.getDelimitedInput('phonegapCommand', /*delim*/ ' ', /*required*/ true));
        var args = taskLibrary.getDelimitedInput('phonegapArgs', /*delim*/ ' ', /*required*/ false);
        if (args) {
            commandRunner.arg(args);
        }

        return commandRunner.exec();
    });
}

