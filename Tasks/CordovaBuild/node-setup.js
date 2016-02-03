/*
  Copyright (c) Microsoft. All rights reserved.
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    fs = require('fs'),
    semver = require('semver'),
    nodeManager = require('./lib/node-manager.js'),
    taskLibrary = require('./lib/vso-task-lib-proxy.js'),
    teambuild = require('taco-team-build');

var nodeSetupPromise;

var cwd = taskLibrary.getInput('cwd', /* required */ false);
var tacoFile = path.join((cwd ? cwd : '.'), 'taco.json');

var version = taskLibrary.getInput('cordovaVersion', /* required */ false);
if (!version) {
    try {
        var stats = fs.statSync(tacoFile);
        if (stats && stats.isDirectory()) {
            version = require(tacoFile)['cordova-cli'];
            console.log('Cordova version set to ' + version + ' based on the contents of taco.json');
        }
    } catch (e) { }
}

if (version) {
    if (semver.lt(version, '5.3.3')) {
        nodeSetupPromise = nodeManager.setupMaxNode('4.0.0', '0.12.7');
    } else if (semver.lt(version, '5.4.0')) {
        nodeSetupPromise = nodeManager.setupMaxNode('5.0.0', '4.2.3');
    }
} else {
    nodeSetupPromise = nodeManager.setupNode('0.12.7');
}

nodeSetupPromise.then(function () {
    var nodePath = nodeManager.getNodePath();
    var cmd = path.join(nodePath, 'node');
    var commandRunner = new taskLibrary.ToolRunner(cmd);
    commandRunner.arg(path.join(__dirname, 'cordova-task.js'));

    return commandRunner.exec().fail(function (err) {
        console.error(err.message);
        taskLibrary.debug('taskRunner fail');
        taskLibrary.exit(1);
    });
});