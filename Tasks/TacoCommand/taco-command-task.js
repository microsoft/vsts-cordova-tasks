var path = require('path');
var tl = require('./lib/vso-task-lib-proxy.js');

var	buildSourceDirectory = tl.getVariable('build.sourceDirectory') || tl.getVariable('build.sourcesDirectory');
//Process working directory
var	cwd = tl.getInput('cwd') || buildSourceDirectory;
tl.cd(cwd);

callTaco()
    .fail(function (err) {
    console.error(err.message);
    tl.debug('taskRunner fail');
    tl.exit(1);
});

function callTaco(code) {
    var tacoCmd = 'taco';
    var tacoPath = tl.which(tacoCmd);
    if (tacoPath) {
        var cdv = new tl.ToolRunner(tacoPath, true);
        cdv.arg(tl.getDelimitedInput('tacoCommand', ' ', true));
        var args = tl.getDelimitedInput('tacoArgs', ' ', false);
        if (args) {
            cdv.arg(args);
        }

        return cdv.exec();
    }
}
