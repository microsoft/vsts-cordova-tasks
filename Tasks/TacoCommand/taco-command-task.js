var path = require('path');
var tl = require('./lib/vso-task-lib-proxy.js');
var ttb = require('taco-team-build');

var buildSourceDirectory = tl.getVariable('build.sourceDirectory') || tl.getVariable('build.sourcesDirectory');
//Process working directory
var cwd = tl.getInput('cwd') || buildSourceDirectory;
tl.cd(cwd);

callTaco()
    .fail(function (err) {
    console.error(err.message);
    tl.debug('taskRunner fail');
    tl.exit(1);
});

function callTaco(code) {
    // taco requires the Cordova CLI in the path		
    return ttb.cacheModule({
        projectPath: cwd,
        cordovaVersion: tl.getInput('cordovaVersion', false)
    })
        .then(function (result) {
        // Add Cordova to path, then get Ionic
        process.env.PATH = path.resolve(result.path, '..', '.bin') + path.delimiter + process.env.PATH;

        var tacoCmd = 'taco';
        var tacoPath = tl.which(tacoCmd) || "./node_modules/taco-cli/bin/taco";
        if (tacoPath) {
            var cdv = new tl.ToolRunner(tacoPath, true);
            cdv.arg(tl.getDelimitedInput('tacoCommand', ' ', true));
            var args = tl.getDelimitedInput('tacoArgs', ' ', false);
            if (args) {
                cdv.arg(args);
            }

            return cdv.exec();
        }
    });
}
