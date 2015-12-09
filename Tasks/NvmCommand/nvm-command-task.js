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

callNode().fail(function (err) {
    console.error(err.message);
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

// Main Node command exec
function callNode() {
    var nodeConfig = {
        nodePackageName: 'node',
        projectPath: workingDirectory
    };

    var version = taskLibrary.getInput('nodeVersion', /*required*/ false);
    if (version) {
        nodeConfig.moduleVersion = version;
    }

    return buildUtilities.cacheModule(nodeConfig).then(function (nodeModule) {
        taskLibrary.debug('Node Module Path: ' + nodeModule.path);

        var nodeExecutable = process.platform == 'win32' ? 'node.cmd' : 'node';
        var nodeCmd = path.resolve(nodeModule.path, '..', '.bin', nodeExecutable);
        var commandRunner = new taskLibrary.ToolRunner(nodeCmd);


        var rawCmd = taskLibrary.getInput('nodeCommand', /* required */ true);
        var cmd = taskLibrary.args(rawCmd);
        commandRunner.arg(cmd);
        
        var rawArgs = taskLibrary.getInput('nodeArgs', /* required */ false);
        var args = taskLibrary.args(rawArgs);
        if (args) {
            commandRunner.arg(args);
        }

        return commandRunner.exec();
    });
}

