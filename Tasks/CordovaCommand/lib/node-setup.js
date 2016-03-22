/*
  Copyright (c) Microsoft. All rights reserved.
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require("path"),
    fs = require("fs"),
    Q = require("q"),
    semver = require("semver"),
    nodeManager = require("./node-manager.js"),
    teambuild = require("taco-team-build"),
    spawn = Q.nfbind(require("child_process").spawn);

var nodeSetupPromise;

var cwd = process.env["INPUT_CWD"];
var execFile = process.argv[2];
var tacoFile = path.join((cwd ? cwd : "."), "taco.json");

var version = process.env["INPUT_CORDOVAVERSION"];
if (!version) {
    try {
        var stats = fs.statSync(tacoFile);
        if (stats && stats.isFile()) {
            version = require(tacoFile)["cordova-cli"];
            console.log("Cordova version set to " + version + " based on the contents of taco.json");
        } else {
            version = process.env.CORDOVA_DEFAULT_VERSION;
            console.log("Attempting to use the environment specified Cordova version " + version);
        }
    } catch (e) { }
}

nodeSetupPromise = nodeManager.useSystemNode();

if (version) {
    if (semver.lt(version, "5.3.3")) {
        nodeSetupPromise = nodeManager.setupMaxNode("4.0.0", "0.12.7");
    } else if (semver.lt(version, "5.4.0")) {
        nodeSetupPromise = nodeManager.setupMaxNode("5.0.0", "4.2.3");
    }
}

if (nodeSetupPromise) {
    nodeSetupPromise.then(function () {
        var nodePath = nodeManager.getNodePath();
        var cmd = path.join(nodePath, "node");

        return spawn(cmd, [execFile], {stdio: [0,1,2]}).fail(function (err) {
            console.error(err.message);
        });
    }).fail(function (err) {
        console.error(err.message);
    });
} else {
    console.error("node setup failed");
}