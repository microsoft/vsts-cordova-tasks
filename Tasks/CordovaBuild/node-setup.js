/*
  Copyright (c) Microsoft. All rights reserved.
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    semver = require('semver'),
    nodeManager = require('./lib/node-manager.js'),
    taskLibrary = require('./lib/vso-task-lib-proxy.js'),
    teambuild = require('taco-team-build');

var version = taskLibrary.getInput('cordovaVersion', /* required */ false);
if (version) {
    if (semver.lt(version, '5.3.3')) {
        nodeManager.setupMaxNode('4.0.0', '0.12.7');
    } else if (semver.lt(verion, '5.4.0')) {
        nodeManager.setupMaxNode('5.0.0', '4.2.3');
    }
}

var nodePath = nodeManager.getNodePath();
var commandRunner = new taskLibrary.ToolRunner(nodePath);
commandRunner.arg('./cordova-task.js');

commandRunner.exec();