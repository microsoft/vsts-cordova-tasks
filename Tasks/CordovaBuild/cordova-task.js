/*
  Copyright (c) Microsoft. All rights reserved.
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    fs = require('fs'),
    Q = require('q'),
    glob = require('glob'),
    xcutils = require('./lib/xcode-task-utils.js'),
    tl = require('./lib/vso-task-lib-proxy.js'),
    ttb = require('taco-team-build');


// Globals - Easy way to have data available across promises.
var origXcodeDeveloperDir = process.env['DEVELOPER_DIR'], 	// Store original Xcode developer directory so we can restore it after build completes if it's overridden
    configuration, 											// debug or release
    platform, 												// android, ios, windows, wp8
    buildSourceDirectory, 									// Source root. May or may not be working directory.
    cwd, 													// Working directory
    buildArgs = [], 										// Cordova build command arguments
    iosXcConfig = '', 										// Content to put in build-vso.xcconfig
    antProperties = {}, 									// Properties to put in ant.properties
    targetEmulator;											// Build for emulator instead of device

// Commands
var deleteKeychain, 										// Command to delete OSX keychain if needed
    deleteProfile;											// Command to delete Mobile Provisioning Profile if needed

// Main execution chain
processInputs()															// Process inputs to task
    .then(execBuild)													// Run main Cordova build via taco-team-build
    .then(function () {
        return targetEmulator ? 0 : ttb.packageProject(platform);		// Package apps if configured
    })
    .then(copyToOutputFolder)
    .then(function (code) {												// On success, exit
        tl.exit(code);
    })
    .fin(function (code) {
        process.env['DEVELOPER_DIR'] = origXcodeDeveloperDir;			// Return to original developer dir if set
        var promise = deleteKeychain ? deleteKeychain.exec() : Q(0);	// Delete temp keychain if created
        if (deleteProfile) {												// Delete installed profile only if flag is set
            promise = promise.then(function (code) {
                return deleteProfile.exec();
            });
        }
        return promise;
    })
    .fail(function (err) {
        console.error(err.message);
        tl.debug('taskRunner fail');
        tl.exit(1);
    });

// Process VSO task inputs and get ready to build
function processInputs() {
    buildSourceDirectory = tl.getVariable('build.sourceDirectory') || tl.getVariable('build.sourcesDirectory');

    //Process working directory
    cwd = tl.getInput('cwd', /* required */ false) || buildSourceDirectory;
    tl.cd(cwd);

    // Set the path to the developer tools for this process call if not the default
    var xcodeDeveloperDir = tl.getInput('xcodeDeveloperDir', /* required */ false);
    if (xcodeDeveloperDir) {
        tl.debug('DEVELOPER_DIR was ' + origXcodeDeveloperDir)
        tl.debug('DEVELOPER_DIR for build set to ' + xcodeDeveloperDir);
        process.env['DEVELOPER_DIR'] = xcodeDeveloperDir;
    }

    configuration = tl.getInput('configuration', /* required */ true).toLowerCase();
    buildArgs.push('--' + configuration);

    var archs = tl.getInput('archs', /* required */ false);
    if (archs) {
        buildArgs.push('--archs="' + archs + '"')
    }

    targetEmulator = tl.getInput('targetEmulator', /* required */ false) == 'true';
    if (targetEmulator) {
        buildArgs.push('--emulator');
    } else {
        buildArgs.push('--device')
    }

    platform = tl.getInput('platform', /* required */ true).toLowerCase();
    switch (platform) {
        case 'android':
            if (process.platform == 'darwin') {
                console.log('Building Android on OSX. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.')
            }
            return processAndroidInputs();
        case 'ios':
            if (process.platform != 'darwin') {
                console.error('Unable to build ios on ' + process.platform + '. Add "Xcode" as a "Demand" under "General" to your build definition to cause the build to always route to a OSX agent.');
                tl.exit(1);
            }
            return iosIdentity().then(iosProfile);
        case 'windows':
            if (process.platform == 'darwin' || process.platform == 'linux') {
                console.error('Unable to build windows on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
                tl.exit(1);
            }
            return processWindowsInputs();
        case 'wp8':
            if (process.platform == 'darwin' || process.platform == 'linux') {
                console.error('Unable to build wp8 on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
                tl.exit(1);
            }
            return Q(0);
        default:
            return Q(0);
    }
}

// Process VSO task inputs specific to Windows
function processWindowsInputs() {
    var appx = tl.getInput('windowsAppx', /* required */ false);
    if (appx) {
        buildArgs.push('--appx=' + appx);
    }

    var windowsOnly = tl.getInput('windowsOnly', /* required */ false) == 'true';
    var windowsPhoneOnly = tl.getInput('windowsPhoneOnly', /* required */ false) == 'true';
    if (windowsOnly) {
        if (!windowsPhoneOnly) {
            buildArgs.push('--win');
        } else {
            console.warn('WARN: Both Target Windows Only and Target Windows Phone Only were selected. Building both.')
        }
    } else if (windowsPhoneOnly) {
        buildArgs.push('--phone');
    }

    return Q(0);
}

// Process VSO task inputs specific to iOS signing identities and keychains
function iosIdentity(code) {
    var input = {
        cwd: cwd,
        unlockDefaultKeychain: tl.getInput('unlockDefaultKeychain', /* required */ false) == 'true',
        defaultKeychainPassword: tl.getInput('defaultKeychainPassword', /* required */ false),
        p12: tl.getInput('p12', /* required */ false),
        p12pwd: tl.getInput('p12pwd', /* required */ false),
        iosSigningIdentity: tl.getInput('iosSigningIdentity', /* required */ false)
    };

    return xcutils.determineIdentity(input)
        .then(function (result) {
            tl.debug('determineIdentity result ' + JSON.stringify(result));
            if (result.identity) {
                iosXcConfig += 'CODE_SIGN_IDENTITY=' + result.identity + '\n';
                iosXcConfig += 'CODE_SIGN_IDENTITY[sdk=iphoneos*]=' + result.identity + '\n';
            } else {
                tl.debug('No explicit signing identity specified in task.')
            }
            if (result.keychain) {
                iosXcConfig += 'OTHER_CODE_SIGN_FLAGS=--keychain=' + result.keychain + '\n';
            }
            deleteKeychain = result.deleteCommand;
        });
}

// Process VSO task inputs specific to iOS mobile provisioning profiles
function iosProfile(code) {
    var input = {
        cwd: cwd,
        provProfileUuid: tl.getInput('provProfileUuid', /* required */ false),
        provProfilePath: tl.getInput('provProfile', /* required */ false),
        removeProfile: tl.getInput('removeProfile', /* required */ false) == 'true'
    }

    return xcutils.determineProfile(input)
        .then(function (result) {
            tl.debug('determineProfile result ' + JSON.stringify(result));
            if (result.uuid) {
                iosXcConfig += 'PROVISIONING_PROFILE=' + result.uuid + '\n';
            }
            deleteProfile = result.deleteCommand;
        });
}

// Process VSO task inputs specific to Android
function processAndroidInputs() {
    if (tl.getInput('antBuild', /* required */ false) == 'true') {
        buildArgs.push('--ant');
    } else {
        buildArgs.push('--gradleArg=--no-daemon');  // Gradle daemon will hang the agent - need to turn it off
    }

    // Pass in args for Android 4.0.0+, modify ant.properties before_compile for < 4.0.0 (event handler added at exec time)
    // Override gradle args
    var keystoreFile = tl.getInput('keystoreFile', /* required */ false);
    try {
        // lstatSync will throw if the path does not exist, but
        // we don't want to fail the build in that case.
        if (fs.lstatSync(keystoreFile).isFile()) {
            antProperties['key.store'] = keystoreFile;
            antProperties.override = true;                       
            buildArgs.push('--keystore=' + keystoreFile);
        }
    } catch (e) {
        console.warn('WARN: Specified keystoreFile is not valid');
    }

    var keystorePass = tl.getInput('keystorePass', /* required */ false);
    if (keystorePass) {
        antProperties['key.store.password'] = keystorePass;
        antProperties.override = true;
        buildArgs.push('--storePassword=' + keystorePass);
    }

    var keystoreAlias = tl.getInput('keystoreAlias', /* required */ false);
    if (keystoreAlias) {
        antProperties['key.alias'] = keystoreAlias;
        antProperties.override = true;
        buildArgs.push('--alias=' + keystoreAlias);
    }

    var keyPass = tl.getInput('keyPass', /* required */ false);
    if (keyPass) {
        antProperties['key.alias.password'] = keyPass;
        antProperties.override = true;
        buildArgs.push('--password=' + keyPass);
    }
    return Q(0);
}

// Utility function to copy outputs to appropriate folder if specified in the VSO task
function copyToOutputFolder(code) {
    var outputDirectory = path.resolve(buildSourceDirectory, tl.getInput('outputPattern', /* required */ true));
    if (outputDirectory == buildSourceDirectory) {
        tl.debug('No output folder specified. Skipping copy.');
        return (0);
    }

    // Create output directory if not present
    tl.mkdirP(outputDirectory);
    tl.mkdirP(path.join(outputDirectory, platform));

    // Create the platform/config-specific output directory if not present
    var configOutputDirectory = path.join(outputDirectory, platform, configuration);
    tl.rmRF(configOutputDirectory);	// Clean folder out if it was there before - incremental build scenario
    tl.mkdirP(configOutputDirectory);

    function makeSource(directory, fileSpec) {
        return {
            directory: path.join(cwd, directory),
            fullSource: path.join(cwd, directory + (fileSpec || '')),
        };
    };

    var sources = [];
    switch (platform) {
        case 'android':
            sources = [	// Ant Build binary
                        makeSource('platforms/android/ant-build/', '*.apk'),

                        // One possible Gradle landing spot
                        makeSource('platforms/android/bin/', '*.apk'),

                        // Another possible Gralde landing spot
                        makeSource('platforms/android/build/outputs/apk/', '*.apk'),

                        // mapping.txt can land in a few spots or and is needed for HockeyApp w/ProGuard enabled
                        //  See Android documentation on ProGuard for details: http://developer.android.com/tools/help/proguard.html
                        makeSource('platforms/android/ant-build/proguard/', '*.txt'),
                        makeSource('platforms/android/build/outputs/mapping/' + configuration + '/', '*.txt')];
            break;
        case 'ios':
            sources = [makeSource('platforms/ios/build/device/', '*.ipa'), makeSource('platforms/ios/build/device/', '*.dSYM')];
            break;
        case 'windows':
            sources = [makeSource('platforms/windows/AppPackages')];
            break;
        case 'wp8':
            sources = [makeSource('platforms/wp8/bin/' + configuration + '/', '*.xap')];
            break;
    }

    sources.forEach(function (source) {
        if (fileExistsSync(source.directory)) {
            tl.debug('Copying ' + source.fullSource + ' to ' + configOutputDirectory);
            tl.cp('-Rf', source.fullSource, configOutputDirectory);
        }
    });

    return (0);
}

// Main Cordova build exec
function execBuild(code) {
    var cordovaConfig = {
        projectPath: cwd
    }

    // Add optional additional args
    var args = tl.getDelimitedInput('cordovaArgs', ' ', /* required */ false);
    if (args) {
        args.forEach(function (arg) {
            if (arg != '--') {  		// Double-double dash syntax not required when invoking cordova-lib directly
                buildArgs.push(arg);
            }
        });
    }

    var version = tl.getInput('cordovaVersion', /* required */ false);
    if (version) {
        cordovaConfig.moduleVersion = version;
    }

    var updateXcconfig = (iosXcConfig != '')
    return ttb.setupCordova(cordovaConfig)
        .then(function (cordova) {
            // Add update Xcconfig hook if needed
            if (updateXcconfig) {
                tl.debug('Adding Xcconfig update hook')
                cordova.on('before_compile', writeVsoXcconfig)
            }
            if (antProperties.override) {
                console.log('WARN: Cordova versions < 5.0.0 may see build option warnings when specifying Android signing options. These can be safely ignored and do not affect signing when building with Ant.');
                tl.debug('Adding ant.properties update hook')
                cordova.on('before_compile', writeAntProperties)
            }
            return ttb.buildProject(platform, buildArgs)
                .fin(function () {
                    // Remove xcconfig hook
                    if (updateXcconfig) {
                        tl.debug('Removing Xcconfig update hook')
                        cordova.off('before_compile', writeVsoXcconfig)
                    }
                    if (antProperties.override) {
                        tl.debug('Removing ant.properties update hook')
                        cordova.off('before_compile', writeAntProperties)
                    }
                });
        });
}

// Event handler for before_compile that adds xcconfig file - done before_compile so res/native doesn't overwrite xcconfig file we need to mod
function writeVsoXcconfig(data) {
    tl.debug('before_compile fired hook  writeVsoXcconfig');
    var includeText = '\n#include "build-vso.xcconfig"';
    var buildVsoXcconfig = path.join(cwd, 'platforms', 'ios', 'cordova', 'build-vso.xcconfig');
    var buildXcconfig;
    var debugConfig = path.join(cwd, 'platforms', 'ios', 'cordova', 'build-debug.xcconfig');
    if (fileExistsSync(debugConfig)) {
        // Need to update build-debug.xcconfig and build-release.xcconfig as needed
        buildXcconfig = [debugConfig, path.join(cwd, 'platforms', 'ios', 'cordova', 'build-release.xcconfig')];
    } else {
        buildXcconfig = [path.join(cwd, 'platforms', 'ios', 'cordova', 'build.xcconfig')];
    }
    tl.debug('xcconfig files to add include to: ' + JSON.stringify(buildXcconfig));

    // Append build-vso.xcconfig include if needed
    buildXcconfig.forEach(function (xcconfig) {
        var origContents = fs.readFileSync(xcconfig) + '';
        if (origContents.indexOf(includeText) < 0) {
            fs.appendFileSync(xcconfig, includeText);
            tl.debug('Appended build-vso.xcconfig include to ' + xcconfig);
        } else {
            tl.debug('build-vso.xcconfig include already present in ' + xcconfig);
        }
    });
    // Delete existing build-vso.xcconfig if present
    if (fs.existsSync(buildVsoXcconfig)) {
        fs.unlinkSync(buildVsoXcconfig);
    }
    // Write out build-vso.xcconfig
    tl.debug('Writing config to ' + buildVsoXcconfig + '. Contents:\n' + iosXcConfig);
    fs.writeFileSync(buildVsoXcconfig, iosXcConfig);
}

// Event handler for before_compile that adds ant.properties file - done before_compile so res/native doesn't overwrite ant.properties file we need to mod
function writeAntProperties(data) {
    tl.debug('before_compile fired hook writeAntProperties');
    var antFile = path.join(cwd, 'platforms', 'android', 'ant.properties');
    var contents = '\n';
    for (var prop in antProperties) {
        if (prop != 'override') {
            var escapedValue = escapeReservedChars(antProperties[prop]);
            contents += prop + '=' + escapedValue + '\n';

            var valueString = !isPasswordAntProperty(prop) ? ', with value: ' + escapedValue : '';
            tl.debug('Writing property ' + prop + ' to ant.properties' + valueString);
        }
    }
    if (fs.existsSync(antFile)) {
        var origContents = fs.readFileSync(antFile, 'ascii') + '\n'; // \n helps end of file match - properties files are Latin-1
        for (var prop in antProperties) {
            if (prop != 'override') {
                // Remove existing property references
                var reg = new RegExp(prop.trim() + '.?=.*?\\r?\\n\\r?', 'gm')
                origContents = origContents.replace(reg, '');
            }
        }
        contents = origContents + contents;
        fs.unlinkSync(antFile);
    }
    tl.debug('Writing out config to ' + antFile + '.');
    fs.writeFileSync(antFile, contents, 'ascii');
}

// Utility function to escape resrved characters in Java properties files
function escapeReservedChars(str) {

    str = str.replace(/\\/g, '\\\\');
    str = str.replace(/:/g, '\\:');
    str = str.replace(/!/g, '\\!');
    str = str.replace(/#/g, '\\#');
    str = str.replace(/=/g, '\\=');
    return str;
}

function fileExistsSync(path) {
    try {
        fs.accessSync(path);
        return true;
    } catch (e) {
        return false;
    }
}

function isPasswordAntProperty(propName) {
    return propName === 'keystorePassword' || propName === 'keyPassword';
}