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

callTaco().fail(function (err) {
    console.error(err.message);
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

// Main TACO command exec
function callTaco() {
    var tacoConfig = {
        nodePackageName: 'taco-cli',
        projectPath: workingDirectory
    };

    var version = taskLibrary.getInput('tacoVersion', /*required*/ false);
    if (version) {
        tacoConfig.moduleVersion = version;
    }

    return buildUtilities.cacheModule(tacoConfig).then(function (tacoModule) {
        taskLibrary.debug('Taco Module Path: ' + tacoModule.path);
         
        var tacoExecutable = process.platform == 'win32' ? 'taco.cmd' : 'taco';
        var tacoCmd = path.resolve(tacoModule.path, '..', '.bin', tacoExecutable);
        var commandRunner = new taskLibrary.ToolRunner(tacoCmd);

        commandRunner.arg(taskLibrary.getDelimitedInput('tacoCommand', /*delim*/ ' ', /*required*/ true));
        var args = taskLibrary.getDelimitedInput('tacoArgs', /*delim*/ ' ', /*required*/ false);
        if (args) {
            commandRunner.arg(args);
        }

        return commandRunner.exec();
    });
}

