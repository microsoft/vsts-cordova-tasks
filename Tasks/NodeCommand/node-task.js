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

callNvm().fail(function (err) {
    console.error(err.message);
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

// Main Nvm command exec
function callNvm() {
    var nvmConfig = {
        nvmPackageName: 'nvm',
        projectPath: workingDirectory
    };

    var version = taskLibrary.getInput('nvmVersion', /*required*/ false);
    if (version) {
        nvmConfig.moduleVersion = version;
    }

    return buildUtilities.cacheModule(nvmConfig).then(function (nvmModule) {
        taskLibrary.debug('Nvm Module Path: ' + nvmModule.path);

        var nvmExecutable = process.platform == 'win32' ? 'nvm.cmd' : 'nvm';
        var nvmCmd = path.resolve(nvmModule.path, '..', '.bin', nvmExecutable);
        var commandRunner = new taskLibrary.ToolRunner(nvmCmd);


        var rawCmd = taskLibrary.getInput('nvmCommand', /* required */ true);
        var cmd = taskLibrary.args(rawCmd);
        commandRunner.arg(cmd);
        
        var rawArgs = taskLibrary.getInput('nvmArgs', /* required */ false);
        var args = taskLibrary.args(rawArgs);
        if (args) {
            commandRunner.arg(args);
        }

        return commandRunner.exec();
    });
}

