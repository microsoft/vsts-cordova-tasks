/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
	tl = require('./lib/vso-task-lib-proxy.js'),
	ttb = require('taco-team-build');


var	buildSourceDirectory = tl.getVariable('build.sourceDirectory') || tl.getVariable('build.sourcesDirectory');
//Process working directory
var	cwd = tl.getInput('cwd') || buildSourceDirectory;
tl.cd(cwd);

callCordova()													
	.fail(function(err) {
		console.error(err.message);
		tl.debug('taskRunner fail');
		tl.exit(1);
	});

// Main Cordova build exec
function callCordova(code) {
	// Ionic requires the Cordova CLI in the path		
	return ttb.cacheModule({
			projectPath: cwd,
			cordovaVersion : tl.getInput('cordovaVersion', false) 
		})
		.then(function(result) {
			// Add Cordova to path, then get Ionic
			process.env.PATH = path.resolve(result.path, '..', '.bin') + path.delimiter + process.env.PATH;
			return 	ttb.cacheModule({
				projectPath: cwd,
				cordovaPackageName: 'ionic',
				cordovaVersion : tl.getInput('ionicVersion', false) || '1.6.5'  //TODO: Attempt to use global if not specified
			});
		})
		.then(function(result) {
			var ionicPath = process.platform == 'win32' ? 	path.resolve(result.path, '..', '.bin','ionic.cmd') : path.resolve(result.path, '..', '.bin','ionic')		
			var cdv = new tl.ToolRunner(ionicPath, true);
			cdv.arg(tl.getDelimitedInput('ionicCommand', ' ', true));
			var args = tl.getDelimitedInput('ionicArgs', ' ', false);
			if(args) {
				cdv.arg(args);			
			}
			return cdv.exec();
		});
}
