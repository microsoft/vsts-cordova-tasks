/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
	fs = require('fs'),
	Q = require ('q'),
	glob = require('glob'),
	xcutils = require('./lib/xcode-task-utils.js'),
	tl = require('./lib/vso-task-lib-proxy.js'),
	ttb = require('taco-team-build');

// Commands
var deleteKeychain, 
	deleteProfile;

// Globals
var origXcodeDeveloperDir, configuration, platform, buildSourceDirectory, buildArgs = [], iosXcConfig = '', antProperties = {}, cwd, targetEmulator;

// Store original Xcode developer directory so we can restore it after build completes if its overridden
var origXcodeDeveloperDir = process.env['DEVELOPER_DIR'];

processInputs()														// Process inputs to task and create xcv, xcb
	.then(execBuild)												// Run main xcodebuild / xctool task
	.then(function() {
		return targetEmulator ? 0 : ttb.packageProject(platform);	// Package apps if configured
	})
	.then(copyToOutputFolder)												
	.then(function(code) {											// On success, exit
		tl.exit(code);
	})
	.fin(function(code) {
		process.env['DEVELOPER_DIR'] = origXcodeDeveloperDir;
		var promise = deleteKeychain ? deleteKeychain.exec() : Q(0);
		if(deleteProfile) {
			promise = promise.then(function(code) {
				return deleteProfile.exec();
			});
		}
		return promise;
	})
	.fail(function(err) {
		console.error(err.message);
		tl.debug('taskRunner fail');
		tl.exit(1);
	});

function processInputs() {  
	buildSourceDirectory = tl.getVariable('build.sourceDirectory') || tl.getVariable('build.sourcesDirectory');

	//Process working directory
	cwd = tl.getInput('cwd') || buildSourceDirectory;
	tl.cd(cwd);

	// Set the path to the developer tools for this process call if not the default
	var xcodeDeveloperDir = tl.getInput('xcodeDeveloperDir', false);
	if(xcodeDeveloperDir) {
		tl.debug('DEVELOPER_DIR was ' + origXcodeDeveloperDir)
		tl.debug('DEVELOPER_DIR for build set to ' + xcodeDeveloperDir);
		process.env['DEVELOPER_DIR'] = xcodeDeveloperDir;
	}
		
	configuration = tl.getInput('configuration', true).toLowerCase();
	buildArgs.push('--' + configuration);
	
	var archs = tl.getInput('archs', false);
	if(archs) {
		buildArgs.push('--archs="' + archs + '"')
	}

	targetEmulator = (tl.getInput('targetEmulator', false) == "true");
	if(targetEmulator) {
		buildArgs.push('--emulator');
	} else {
		buildArgs.push('--device')		
	}

	platform = tl.getInput('platform', true);
	switch(platform) {
		case 'android':
			if(process.platform == 'darwin') {
				console.log('Building Android on OSX. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.')
			}
			return processAndroidInputs();
		case 'ios':
			if(process.platform != 'darwin') {
				console.error('Unable to build ios on ' + process.platform + '. Add "Xcode" as a "Demand" under "General" to your build definition to cause the build to always route to a OSX agent.');
				tl.exit(1);
			}
			return iosIdentity().then(iosProfile);
		case 'windows':
			if(process.platform == 'darwin' || process.platform == 'linux') {
				console.error('Unable to build windows on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
				tl.exit(1);
			}
			return processWindowsInputs();
		case 'wp8':
			if(process.platform == 'darwin' || process.platform == 'linux') {
				console.error('Unable to build wp8 on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
				tl.exit(1);
			}
			return Q(0);
		default: 
			return Q(0);
	}
}

function processWindowsInputs() {
	var appx = tl.getInput('windowsAppx');
	if(appx) {
		buildArgs.push('--appx=' + appx);
	}
	
	var windowsOnly = (tl.getInput('windowsOnly') == 'true');
	var windowsPhoneOnly = (tl.getInput('windowsPhoneOnly') == 'true');
	if(windowsOnly) {
		if(!windowsPhoneOnly) {
			buildArgs.push('--win');			
		} else {
			console.warn('WARN: Both Target Windows Only and Target Windows Phone Only were selected. Building both.')
		}
	} else {
		if(windowsPhoneOnly) {
			buildArgs.push('--phone');
		}		
	}
	
	return Q(0);
}

function iosIdentity(code) {
	
	var input = {
		cwd: cwd,
		unlockDefaultKeychain: (tl.getInput('unlockDefaultKeychain', false)=="true"),
		defaultKeychainPassword: tl.getInput('defaultKeychainPassword',false),
		p12: tl.getPathInput('p12', false, false),
		p12pwd: tl.getInput('p12pwd', false),
		iosSigningIdentity: tl.getInput('iosSigningIdentity', false)
	}
		
	return xcutils.determineIdentity(input)
		.then(function(result) {
			tl.debug('determineIdentity result ' + JSON.stringify(result));
			if(result.identity) {
				iosXcConfig += 'CODE_SIGN_IDENTITY=' + result.identity + '\n';
				iosXcConfig += 'CODE_SIGN_IDENTITY[sdk=iphoneos*]=' + result.identity + '\n';
			} else {
				tl.debug('No explicit signing identity specified in task.')
			}
			if(result.keychain) {
				iosXcConfig += 'OTHER_CODE_SIGN_FLAGS=--keychain=' + result.keychain + '\n';
			}	
			deleteKeychain = result.deleteCommand;
		});
}

function iosProfile(code) {
	var input = {
		cwd: cwd,
		provProfileUuid:tl.getInput('provProfileUuid', false),
		provProfilePath:tl.getPathInput('provProfile', false),
		removeProfile:(tl.getInput('removeProfile', false)=="true")
	}
	
	return xcutils.determineProfile(input)
		.then(function(result) {
			tl.debug('determineProfile result ' + JSON.stringify(result));
			if(result.uuid) {
				iosXcConfig += 'PROVISIONING_PROFILE=' + result.uuid + '\n';	
			}
			deleteProfile = result.deleteCommand;
		});
}

function processAndroidInputs() {	
	if(tl.getInput('forceAnt', false) == "true") {
			buildArgs.push('--ant');			
	} else {
		buildArgs.push('--gradleArg=--no-daemon');  // Gradle daemon will hang the agent - need to turn it off								
	}
	
	// Pass in args for Android 4.0.0+, modify ant.properties before_compile for < 4.0.0 (event handler added at exec time)
	// Override gradle args
	var keystoreFile = tl.getPathInput('keystoreFile', false);
	if(fs.lstatSync(keystoreFile).isFile()) {
		antProperties['key.store'] = keystoreFile;
		antProperties.override = true;						
		buildArgs.push('--keystore="' + keystoreFile + '"');			
	}
	
	var keystorePass = tl.getInput('keystorePass', false);
	if(keystorePass) {
		antProperties['key.store.password'] = keystorePass;		
		antProperties.override = true;						
		buildArgs.push('--storePassword="' + keystorePass + '"');			
	}
	
	var keystoreAlias = tl.getInput('keystoreAlias', false);
	if(keystoreAlias) {
		antProperties['key.alias'] = keystoreAlias;		
		antProperties.override = true;		
		buildArgs.push('--alias="' + keystoreAlias + '"');
	}

	var keyPass = tl.getInput('keyPass', false);
	if(keyPass) {
		antProperties['key.alias.password'] = keyPass;		
		antProperties.override = true;						
		buildArgs.push('--password="' + keyPass + '"');			
	}
	return Q(0);
}

function copyToOutputFolder(code) {
	
	var out = path.resolve(buildSourceDirectory, tl.getInput('outputPattern', true));	
	if(out != buildSourceDirectory) {
		// Create output directory if not present
		tl.mkdirP(out);
		tl.mkdirP(path.join(out, platform));
		out=path.join(out, platform, configuration);
		tl.rmRF(out);	// Clean folder out if it was there before - incremental build scenario
		tl.mkdirP(out);
		
		var sources = [];
		switch(platform) {
			case 'android':
				sources = [	"platforms/android/ant-build/*.apk", 				// Ant Build binary
							"platforms/android/ant-build/*mapping.txt", 		// Need for HockeyApp w/ProGuard
							"platforms/android/bin/*.apk",						// One possible Gradle landing spot
							"platforms/android/bin/*mapping.txt",				//
							"platforms/android/build/outputs/apk/*.apk",		// Another possible Gralde landing spot
							"platforms/android/build/outputs/apk/*mapping.txt"];
				break;
			case 'ios':
				sources = ["platforms/ios/build/device/*.ipa", "platforms/ios/build/device/*.dSYM"];
				break;
			case 'windows':
				sources = ["platforms/windows/AppPackages"];
				break;
			case 'wp8':
				sources = ["platforms/wp8/bin/" + configuration + "/*.xap"];
				break;
		}
	
		sources.forEach(function(source) {
			var fullSource = path.join(cwd, source);
			if(fs.existsSync(fullSource.replace(/\*.*$/g,''))) {
				tl.debug('Copying ' + fullSource + ' to ' + out);
				tl.cp('-Rf', fullSource, out);			
			}
		});
	} else {
		tl.debug('No output folder specified. Skipping copy.');
	}
	
	return(0);
}


function execBuild(code) {
	var cordovaConfig = {
		projectPath: cwd
	}

	// Add optional additional args
	var args=tl.getDelimitedInput('args', ' ', false);			
	if(args) {
		args.forEach(function(arg) {
			arg = arg.replace('-- --', '--');  // Cut out double-double dash for platform specific args... not needed here	
			buildArgs.push(arg);	
		});
	}
			
	var version = tl.getInput('cordovaVersion', false);
	if(version) {
		cordovaConfig.cordovaVersion = version;
	}
			
	var updateXcconfig = (iosXcConfig != '')
	return ttb.setupCordova(cordovaConfig)
		.then(function(cordova) {
			// Add update Xcconfig hook if needed
			if(updateXcconfig) {
				tl.debug('Adding Xcconfig update hook')
				cordova.on('before_compile', writeVsoXcconfig)
			}
			if(antProperties.override) {
				console.log('WARN: Cordova versions < 5.0.0 may see build option warnings when specifying Android signing options. These can be safely ignored and do not affect signing when building with Ant.');
				tl.debug('Adding ant.properties update hook')
				cordova.on('before_compile', writeAntProperties)				
			}
			return ttb.buildProject(platform,buildArgs)
				.fin(function() {
					// Remove xcconfig hook
					if(updateXcconfig) {				
						tl.debug('Removing Xcconfig update hook')
						cordova.off('before_compile', writeVsoXcconfig)
					}
					if(antProperties.override) {
						tl.debug('Removing ant.properties update hook')
						cordova.on('before_compile', writeAntProperties)				
					}
				});
		});
}

function writeVsoXcconfig(data) {
	tl.debug('before_compile fired hook  writeVsoXcconfig');
	var includeText = '\n#include "build-vso.xcconfig"';
	var buildVsoXcconfig = path.join(cwd, 'platforms', 'ios', 'cordova', 'build-vso.xcconfig');
	var buildXccondig;
	var debugConfig = path.join(cwd, 'platforms', 'ios', 'cordova', 'build-debug.xcconfig');
	if(fs.existsSync(debugConfig)) {
		// Need to update build-debug.xcconfig and build-release.xcconfig as needed
		buildXccondig = [debugConfig, path.join(cwd, 'platforms', 'ios', 'cordova', 'build-release.xcconfig')];
	} else {
		buildXccondig = [path.join(cwd, 'platforms', 'ios', 'cordova', 'build.xcconfig')];
	}
	tl.debug('xcconfig files to add include to: ' + JSON.stringify(buildXccondig));
	// Append build-vso.xcconfig include if needed
	buildXccondig.forEach(function(xcconfig) {
		var origContents = fs.readFileSync(xcconfig) + '';
		if(origContents.indexOf(includeText) < 0) {
			fs.appendFileSync(xcconfig, includeText);
			tl.debug('Appended build-vso.xcconfig include to ' + xcconfig);
		} else {
			tl.debug('build-vso.xcconfig include already present in ' + xcconfig);			
		}
	});
	// Delete existing build-vso.xcconfig if present
	if(fs.existsSync(buildVsoXcconfig)) {
		fs.unlinkSync(buildVsoXcconfig);
	}
	// Write out build-vso.xcconfig
	tl.debug('Writing config to ' + buildVsoXcconfig + '. Contents:\n' + iosXcConfig);
	fs.writeFileSync(buildVsoXcconfig, iosXcConfig);
}

function writeAntProperties(data) {
	tl.debug('before_compile fired hook writeAntProperties');
	var antFile = path.join(cwd, 'platforms', 'android', 'ant.properties');
	var contents = '\n';
	for(var prop in antProperties) {
		if(prop != 'override') {
			contents += prop + '=' + escapeReservedChars(antProperties[prop]) + '\n'; 
		}
	}
	if(fs.existsSync(antFile)) {
		var origContents = fs.readFileSync(antFile, 'ascii') + '\n'; // \n helps end of file match - properties files are Latin-1
		for(var prop in antProperties) {
			if(prop != 'override') {
				// Remove existing property references
				var reg = new RegExp(prop.trim() + '.?=.*?\\r?\\n\\r?', 'gm')
				origContents=origContents.replace(reg,'');				
			}
		}
		contents = origContents + contents;
		fs.unlinkSync(antFile);
	}
	tl.debug('Writing config to ' + antFile + '. Contents:');
	tl.debug(contents);
	fs.writeFileSync(antFile, contents, 'ascii');
}

function escapeReservedChars(str) {

	str = str.replace(/\\/g,'\\\\');
	str = str.replace(/:/g,'\\:');
	str = str.replace(/!/g,'\\!');
	str = str.replace(/#/g,'\\#');
	str = str.replace(/=/g,'\\=');
	return str;}
