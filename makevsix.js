// 
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

require('shelljs/global');

var path = require('path'),
    fs = require('fs');

var argv = require('yargs')
    .usage('Usage: $0 <command>')
    .command('create', 'Create VSIX')
    .command('publishtest', 'Publish test VSIX')
    .demand(1)
    .argv;
	

var command = argv._[0];

if (! exec("npm --version", {silent: true})) {
    echo("npm not found. please install npm and run again.")
    exit(1);
}

if (exec('tfx --version', {silent: true}).code != 0)
    echoAndExec("tfx-cli not found. installing", "npm install -g tfx-cli");

installTasks()

if (command === 'create')
    echoAndExec('Creating VSIX', 'tfx extension create --manifest-globs mobiledevopscordovaextension.json --override {\\\"public\\\":true}');
else if (command === 'publishtest') {
    var token = env['PUBLISH_ACCESSTOKEN'];
    if (token === undefined) {
        echo("Must set PUBLISH_ACCESSTOKEN environment variable to publish a test VSIX");
        exit(1);
    }
    
    echoAndExec('Creating and publishing test VSIX...',
        'tfx extension publish --manifest-globs mobiledevopscordovaextension.json --override { \\\"public\\\": false, \\\"name\\\": \\\"Cordova Build-Dev\\\", \\\"id\\\": \\\"cordova-extension-dev\\\", \\\"publisher\\\": \\\"ms-mobiledevops-test\\\"} --share-with mobiledevops x04ty29er --token ' + env['PUBLISH_ACCESSTOKEN']);
}
else {
    echo("Invalid command: " + command);
    exit(1);    
}

function installTasks() {
    echo("Installing task dependencies...");

    var rootPath = process.cwd(); 
    var tasksPath = path.join(rootPath, 'Tasks');
    var tasks = fs.readdirSync(tasksPath);
    console.log(tasks.length + ' tasks found.')
    tasks.forEach(function(task) {
        console.log('Processing task ' + task);
        process.chdir(path.join(tasksPath,task));

        console.log('Installing npm dependencies for task...');
        if (exec('npm install --only=prod').code != 0) {
            console.log("npm install for task failed");
            exit(1);
        }
    });

    process.chdir(rootPath);
}

function echoAndExec(prefix, cmd) {
    if (prefix === null)
        prefix = "Executing";
    echo(prefix + ": " + cmd);
    return exec(cmd);
}