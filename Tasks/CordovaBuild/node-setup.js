/*
  Copyright (c) Microsoft. All rights reserved.
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    semver = require('semver'),
    nodeManager = require('./lib/node-manager.js'),
    taskLibrary = require('./lib/vso-task-lib-proxy.js'),
    teambuild = require('taco-team-build');

var nodeSetupPromise;
var version = taskLibrary.getInput('cordovaVersion', /* required */ false);
if (version) {
    if (semver.lt(version, '5.3.3')) {
        nodeSetupPromise = nodeManager.setupMaxNode('4.0.0', '0.12.7');
    } else if (semver.lt(version, '5.4.0')) {
        nodeSetupPromise = nodeManager.setupMaxNode('5.0.0', '4.2.3');
    }
} else {
    nodeSetupPromise = nodeManager.setupNode('5.0.0');
}

nodeSetupPromise.then(function () {
    var nodePath = nodeManager.getNodePath();
    var cmd = nodePath + '/node';
    var commandRunner = new taskLibrary.ToolRunner(cmd);
    commandRunner.arg(__dirname + '/cordova-task.js');

    return commandRunner.exec().fail(function (err) {
        console.error(err.message);
        taskLibrary.debug('taskRunner fail');
        taskLibrary.exit(1);
    });
});