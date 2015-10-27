var path = require("path");
var tl = require("./lib/vso-task-lib-proxy.js");
var ttb = require("taco-team-build");

var buildSourceDirectory = tl.getVariable("build.sourceDirectory") || tl.getVariable("build.sourcesDirectory");
//Process working directory
var cwd = tl.getInput("cwd") || buildSourceDirectory;
tl.cd(cwd);

callTaco()
    .fail(function (err) {
    console.error(err.message);
    tl.debug("taskRunner fail");
    tl.exit(1);
});

function callTaco(code) {
    // taco requires the Cordova CLI in the path		
    return ttb.cacheModule({
        projectPath: cwd,
        nodePackageName: "taco-cli",
        moduleVersion: tl.getInput("tacoVersion", /*required*/ false)
    })
        .then(function (result) {
        // Add TACO cli to PATH
        process.env.PATH = path.resolve(result.path, "..", ".bin") + path.delimiter + process.env.PATH;

        // and have the system resolve the location for us
        var tacoPath = tl.which("taco");
        if (tacoPath) {
            var commandRunner = new tl.ToolRunner(tacoPath, true);
            commandRunner.arg(tl.getDelimitedInput("tacoCommand", /*delim*/ " ", /*required*/ true));
            var args = tl.getDelimitedInput("tacoArgs", /*delim*/ " ", /*required*/ false);
            if (args) {
                commandRunner.arg(args);
            }

            return commandRunner.exec();
        }
    });
}
