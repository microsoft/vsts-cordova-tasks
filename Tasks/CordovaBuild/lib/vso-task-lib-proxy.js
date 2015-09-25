var tl = require('vso-task-lib');

var warn = console.warn;
console.warn=function(message) {
	warn('WARN: ' + message);
}

var logDebug = (process.env['SYSTEM_DEBUG'] == 'true');

if(process.argv.length > 2 && process.argv[2] == '##vso-task-powershell' ) {
	console.log('Script is running from Windows VSO agent.');
	//tl.debug = console.log;
	tl.debug = function(message) {
		if(logDebug) {
			console.log('DEBUG: ' + message);		
		}
	}
	tl.warning = console.warn;
	tl.error = console.err;
	tl.exit = process.exit;
}

module.exports = tl;
