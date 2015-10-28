var path = require('path');
var taskLibrary = require('./lib/vso-task-lib-proxy.js');
var buildUtilities = require('taco-team-build');

var buildSourceDirectory = taskLibrary.getVariable('build.sourceDirectory') || taskLibrary.getVariable('build.sourcesDirectory');
//Process working directory
var workingDirectory = taskLibrary.getInput('cwd', /*required*/ false) || buildSourceDirectory;
taskLibrary.cd(workingDirectory);

callTaco().fail(function (err) {
    console.error(err.message);
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

function callTaco(code) {
    return buildUtilities.cacheModule({
        projectPath: workingDirectory,
        nodePackageName: 'taco-cli',
        moduleVersion: taskLibrary.getInput('tacoVersion', /*required*/ false)
    }).then(function (result) {
        // Add TACO cli to PATH
        process.env.PATH = path.resolve(result.path, '..', '.bin') + path.delimiter + process.env.PATH;

        // and have the system resolve the location for us
        var tacoPath = taskLibrary.which('taco');
        if (tacoPath) {
            var commandRunner = new taskLibrary.ToolRunner(tacoPath, true);
            commandRunner.arg(taskLibrary.getDelimitedInput('tacoCommand', /*delim*/ ' ', /*required*/ true));
            var args = taskLibrary.getDelimitedInput('tacoArgs', /*delim*/ ' ', /*required*/ false);
            if (args) {
                commandRunner.arg(args);
            }

            return commandRunner.exec();
        }
    });
}
