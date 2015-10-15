var path = require('path');
var tl = require('./lib/vso-task-lib-proxy.js');

var echo = new tl.ToolRunner(tl.which('echo', true));

var msg = tl.getInput('msg', true);
echo.arg(msg);

var cwd = tl.getPathInput('cwd', false);

// will error and fail task if it doesn't exist
tl.checkPath(cwd, 'cwd');
tl.cd(cwd);

echo.exec({ failOnStdErr: false})
.then(function(code) {
    tl.exit(code);
})
.fail(function(err) {
    console.error(err.message);
    tl.debug('taskRunner fail');
    tl.exit(1);
});

function callTaco(code) {
    var tacoCmd = 'taco-cli';
}
