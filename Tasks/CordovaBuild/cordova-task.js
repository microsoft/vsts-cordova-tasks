/*
  Copyright (c) Microsoft. All rights reserved.
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    fs = require('fs'),
    Q = require('q'),
    semver = require('semver'),
    glob = require('glob'),
    xcutils = require('./lib/xcode-task-utils.js'),
    taskLibrary = require('./lib/vso-task-lib-proxy.js'),
    teambuild = require('taco-team-build');


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
    return targetEmulator ? 0 : teambuild.packageProject(platform);		// Package apps if configured
})
    .then(copyToOutputFolder)
    .then(function (code) {												// On success, exit
    taskLibrary.exit(code);
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
    taskLibrary.debug('taskRunner fail');
    taskLibrary.exit(1);
});

// Process VSO task inputs and get ready to build
function processInputs() {
    buildSourceDirectory = taskLibrary.getVariable('build.sourceDirectory') || taskLibrary.getVariable('build.sourcesDirectory');

    //Process working directory
    cwd = taskLibrary.getInput('cwd', /* required */ false) || buildSourceDirectory;
    taskLibrary.cd(cwd);

    // Set the path to the developer tools for this process call if not the default
    var xcodeDeveloperDir = taskLibrary.getInput('xcodeDeveloperDir', /* required */ false);
    if (xcodeDeveloperDir) {
        taskLibrary.debug('DEVELOPER_DIR was ' + origXcodeDeveloperDir)
        taskLibrary.debug('DEVELOPER_DIR for build set to ' + xcodeDeveloperDir);
        process.env['DEVELOPER_DIR'] = xcodeDeveloperDir;
    }

    configuration = taskLibrary.getInput('configuration', /* required */ true).toLowerCase();
    // if configuration is a strange/empty value, assume release
    if (configuration !== "release" && configuration !== "debug") {
        configuration = "debug";
    }

    buildArgs.push('--' + configuration);

    var archs = taskLibrary.getInput('archs', /* required */ false);
    if (archs) {
        buildArgs.push('--archs="' + archs + '"')
    }

    platform = taskLibrary.getInput('platform', /* required */ true).toLowerCase();
    targetEmulator = taskLibrary.getInput('targetEmulator', /* required */ false) == 'true';
    if (targetEmulator) {
        buildArgs.push('--emulator');
    } else {
        buildArgs.push('--device')
    }

    switch (platform) {
        case 'android':
            if (process.platform == 'darwin') {
                console.log('Building Android on OSX. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.')
            }
            return processAndroidInputs();
        case 'ios':
            if (process.platform != 'darwin') {
                console.error('Unable to build ios on ' + process.platform + '. Add "Xcode" as a "Demand" under "General" to your build definition to cause the build to always route to a OSX agent.');
                taskLibrary.exit(1);
            }
            return iosIdentity().then(iosProfile);
        case 'windows':
            if (process.platform == 'darwin' || process.platform == 'linux') {
                console.error('Unable to build windows on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
                taskLibrary.exit(1);
            }
            return processWindowsInputs();
        case 'wp8':
            if (process.platform == 'darwin' || process.platform == 'linux') {
                console.error('Unable to build wp8 on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
                taskLibrary.exit(1);
            }
            return Q(0);
        default:
            return Q(0);
    }
}

// Process VSO task inputs specific to Windows
function processWindowsInputs() {
    var appx = taskLibrary.getInput('windowsAppx', /* required */ false);
    if (appx) {
        buildArgs.push('--appx=' + appx);
    }

    var windowsOnly = taskLibrary.getInput('windowsOnly', /* required */ false) == 'true';
    var windowsPhoneOnly = taskLibrary.getInput('windowsPhoneOnly', /* required */ false) == 'true';
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
        unlockDefaultKeychain: taskLibrary.getInput('unlockDefaultKeychain', /* required */ false) == 'true',
        defaultKeychainPassword: taskLibrary.getInput('defaultKeychainPassword', /* required */ false),
        p12: taskLibrary.getInput('p12', /* required */ false),
        p12pwd: taskLibrary.getInput('p12pwd', /* required */ false),
        iosSigningIdentity: taskLibrary.getInput('iosSigningIdentity', /* required */ false)
    };

    return xcutils.determineIdentity(input)
        .then(function (result) {
        taskLibrary.debug('determineIdentity result ' + JSON.stringify(result));
        if (result.identity) {
            iosXcConfig += 'CODE_SIGN_IDENTITY=' + result.identity + '\n';
            iosXcConfig += 'CODE_SIGN_IDENTITY[sdk=iphoneos*]=' + result.identity + '\n';
        } else {
            taskLibrary.debug('No explicit signing identity specified in task.')
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
        provProfileUuid: taskLibrary.getInput('provProfileUuid', /* required */ false),
        provProfilePath: taskLibrary.getInput('provProfile', /* required */ false),
        removeProfile: taskLibrary.getInput('removeProfile', /* required */ false) == 'true'
    }

    return xcutils.determineProfile(input)
        .then(function (result) {
        taskLibrary.debug('determineProfile result ' + JSON.stringify(result));
        if (result.uuid) {
            iosXcConfig += 'PROVISIONING_PROFILE=' + result.uuid + '\n';
        }
        deleteProfile = result.deleteCommand;
    });
}

// Process VSO task inputs specific to Android
function processAndroidInputs() {
    if (taskLibrary.getInput('antBuild', /* required */ false) == 'true') {
        buildArgs.push('--ant');
    } else {
        buildArgs.push('--gradleArg=--no-daemon');  // Gradle daemon will hang the agent - need to turn it off
    }

    // Pass in args for Android 4.0.0+, modify ant.properties before_compile for < 4.0.0 (event handler added at exec time)
    // Override gradle args
    var keystoreFile = taskLibrary.getInput('keystoreFile', /* required */ false);
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

    var keystorePass = taskLibrary.getInput('keystorePass', /* required */ false);
    if (keystorePass) {
        antProperties['key.store.password'] = keystorePass;
        antProperties.override = true;
        buildArgs.push('--storePassword=' + keystorePass);
    }

    var keystoreAlias = taskLibrary.getInput('keystoreAlias', /* required */ false);
    if (keystoreAlias) {
        antProperties['key.alias'] = keystoreAlias;
        antProperties.override = true;
        buildArgs.push('--alias=' + keystoreAlias);
    }

    var keyPass = taskLibrary.getInput('keyPass', /* required */ false);
    if (keyPass) {
        antProperties['key.alias.password'] = keyPass;
        antProperties.override = true;
        buildArgs.push('--password=' + keyPass);
    }
    return Q(0);
}

// Utility function to copy outputs to appropriate folder if specified in the VSO task
function copyToOutputFolder(code) {
    var outputDirectory = path.resolve(buildSourceDirectory, taskLibrary.getInput('outputPattern', /* required */ true));
    if (outputDirectory == buildSourceDirectory) {
        taskLibrary.debug('No output folder specified. Skipping copy.');
        return (0);
    }

    // Create output directory if not present
    taskLibrary.mkdirP(outputDirectory);
    taskLibrary.mkdirP(path.join(outputDirectory, platform));

    // Create the platform/config-specific output directory if not present
    var configOutputDirectory = path.join(outputDirectory, platform, configuration);
    taskLibrary.rmRF(configOutputDirectory);	// Clean folder out if it was there before - incremental build scenario
    taskLibrary.mkdirP(configOutputDirectory);

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
            taskLibrary.debug('Copying ' + source.fullSource + ' to ' + configOutputDirectory);
            taskLibrary.cp('-Rf', source.fullSource, configOutputDirectory);
        }
    });

    return (0);
}

// Main Cordova build exec
function execBuild(code) {
    var cordovaConfig = {
        projectPath: cwd,
        nodePackageName: 'cordova'
    };

    // Add optional additional args
    var rawArgs = taskLibrary.getInput('cordovaArgs', /* required */ false);
    var args = rawArgs.match(/([^" ]*("[^"]*")[^" ]*)|[^" ]+/g);

    
    if (args) {
        //remove double quotes from each string in args as child_process.spawn() cannot handle literal quotes as part of arguments
        for (var i = 0; i < args.length; i++) {
            args[i] = args[i].replace(/"/g, "");
        }

        args.forEach(function (arg) {
            if (arg != '--') {  		// Double-double dash syntax not required when invoking cordova-lib directly
                buildArgs.push(arg);
            }
        });
    }

    var version = taskLibrary.getInput('cordovaVersion', /* required */ false);
    if (version) {
        cordovaConfig.moduleVersion = version;
    }

    var updateXcconfig = (iosXcConfig != '')
    return teambuild.setupCordova(cordovaConfig)
        .then(function (cordova) {
        // Add update Xcconfig hook if needed
        if (updateXcconfig) {
            taskLibrary.debug('Adding Xcconfig update hook')
            cordova.on('before_compile', writeVsoXcconfig)
        }

        return teambuild.getNpmVersionFromConfig(cordovaConfig).then(function (cordovaVersion) {
            if (antProperties.override) {
                if (semver.valid(cordovaVersion) && semver.lt(cordovaVersion, '5.0.0')) {
                    console.log('WARN: Cordova versions < 5.0.0 may see build option warnings when specifying Android signing options. These can be safely ignored and do not affect signing when building with Ant.');
                }

                taskLibrary.debug('Adding ant.properties update hook')
                cordova.on('before_compile', writeAntProperties)
            }

            if (platform === 'android') {
                if (semver.valid(cordovaVersion) && semver.lt(cordovaVersion, '4.0.0')) {
                    // Special case: android on cordova versions earlier than v4.0.0 will
                    // actively fail the build if it encounters unexpected options
                    taskLibrary.debug('Stripping inapplicable arguments for android on cordova ' + cordovaVersion);
                    buildArgs = stripNewerAndroidArgs(buildArgs);
                }

                if (semver.valid(cordovaVersion) && semver.lte(cordovaVersion, '3.5.0-0.2.7')) {
                    // Special case: android on cordova versions 3.5.0-0.2.7 need
                    // "android" to be on the path, so make sure it is there
                    var currentPath = process.env['PATH'];
                    var androidHome = process.env['ANDROID_HOME'];
                    if (currentPath && androidHome && currentPath.indexOf(androidHome) === -1) {
                        taskLibrary.debug('Appending ANDROID_HOME to the current PATH');
                        process.env['PATH'] = currentPath + ';' + path.join(androidHome, 'tools');
                    }
                }
            }

            if (platform !== 'ios') {
                if (semver.valid(cordovaVersion) && semver.lt(cordovaVersion, '3.6.0')) {
                    // For cordova 3.5.0-0.2.7 or lower, we should remove the --device and --emulator
                    // flag on non-ios platforms, since they were otherwise unsupported
                    buildArgs = buildArgs.filter(function (arg) { return arg !== '--device' && arg !== '--emulator'; })
                }
            }

            return Q();
        }).then(function () {
            return teambuild.buildProject(platform, buildArgs)
        }).fin(function () {
            // Remove xcconfig hook
            if (updateXcconfig) {
                taskLibrary.debug('Removing Xcconfig update hook')
                cordova.off('before_compile', writeVsoXcconfig)
            }
            if (antProperties.override) {
                taskLibrary.debug('Removing ant.properties update hook')
                cordova.off('before_compile', writeAntProperties)
            }
        });
    });
}

function stripNewerAndroidArgs(args) {
    // For versions of cordova earlier than 4.0.0, the android build will reject all args except:
    // --debug, --release, --ant, --gradle, and --nobuild
    var acceptableArgs = ['--debug', '--release', '--ant', '--gradle', '--nobuild'];
    return args.filter(function (arg) {
        return acceptableArgs.indexOf(arg) != -1;
    });
}

// Event handler for before_compile that adds xcconfig file - done before_compile so res/native doesn't overwrite xcconfig file we need to mod
function writeVsoXcconfig(data) {
    taskLibrary.debug('before_compile fired hook  writeVsoXcconfig');
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
    taskLibrary.debug('xcconfig files to add include to: ' + JSON.stringify(buildXcconfig));

    // Append build-vso.xcconfig include if needed
    buildXcconfig.forEach(function (xcconfig) {
        var origContents = fs.readFileSync(xcconfig) + '';
        if (origContents.indexOf(includeText) < 0) {
            fs.appendFileSync(xcconfig, includeText);
            taskLibrary.debug('Appended build-vso.xcconfig include to ' + xcconfig);
        } else {
            taskLibrary.debug('build-vso.xcconfig include already present in ' + xcconfig);
        }
    });
    // Delete existing build-vso.xcconfig if present
    if (fs.existsSync(buildVsoXcconfig)) {
        fs.unlinkSync(buildVsoXcconfig);
    }
    // Write out build-vso.xcconfig
    taskLibrary.debug('Writing config to ' + buildVsoXcconfig + '. Contents:\n' + iosXcConfig);
    fs.writeFileSync(buildVsoXcconfig, iosXcConfig);
}

// Event handler for before_compile that adds ant.properties file - done before_compile so res/native doesn't overwrite ant.properties file we need to mod
function writeAntProperties(data) {
    taskLibrary.debug('before_compile fired hook writeAntProperties');
    var antFile = path.join(cwd, 'platforms', 'android', 'ant.properties');
    var contents = '\n';
    for (var prop in antProperties) {
        if (prop != 'override') {
            var escapedValue = escapeReservedChars(antProperties[prop]);
            contents += prop + '=' + escapedValue + '\n';

            var valueString = !isPasswordAntProperty(prop) ? ', with value: ' + escapedValue : '';
            taskLibrary.debug('Writing property ' + prop + ' to ant.properties' + valueString);
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
    taskLibrary.debug('Writing out config to ' + antFile + '.');
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