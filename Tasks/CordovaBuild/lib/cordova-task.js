/*
  Copyright (c) Microsoft. All rights reserved.
  Licensed under the MIT license. See LICENSE file in the project root for full license information.
*/

var path = require('path'),
    fs = require('fs'),
    Q = require('q'),
    semver = require('semver'),
    glob = require('glob'),
    xcutils = require('./xcode-task-utils.js'),
    teambuild = require('taco-team-build'),
    shelljs = require('shelljs');


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
    .fail(function (err) {
        var promise = deleteKeychain ? deleteKeychain() : Q(0);	        // Delete temp keychain if created
        if (deleteProfile) {											// Delete installed profile only if flag is set
            promise = promise.then(function (code) {
                return deleteProfile();
            });
        }

        console.error(err);
        return promise.then(function () {
            process.exit(1);
        });
    })
    .done(function (code) {
        process.env['DEVELOPER_DIR'] = origXcodeDeveloperDir;			// Return to original developer dir if set
        var promise = deleteKeychain ? deleteKeychain() : Q(0);	        // Delete temp keychain if created
        if (deleteProfile) {											// Delete installed profile only if flag is set
            promise = promise.then(function (code) {
                return deleteProfile();
            });
        }
        return promise.then(function () {
            process.exit(code);
        });
    });

// Process VSO task inputs and get ready to build
function processInputs() {
    buildSourceDirectory = process.env["BUILD_SOURCEDIRECTORY"] || process.env["BUILD_SOURCESDIRECTORY"];

    //Process working directory
    cwd = process.env["INPUT_CWD"] || buildSourceDirectory;
    process.chdir(cwd);

    // Set the path to the developer tools for this process call if not the default
    var xcodeDeveloperDir = process.env["INPUT_XCODEDEVELOPERDIR"];
    if (xcodeDeveloperDir) {
        console.log('DEVELOPER_DIR was ' + origXcodeDeveloperDir)
        console.log('DEVELOPER_DIR for build set to ' + xcodeDeveloperDir);
        process.env['DEVELOPER_DIR'] = xcodeDeveloperDir;
    }

    configuration = process.env["INPUT_CONFIGURATION"].toLowerCase();
    // if configuration is a strange/empty value, assume release
    if (configuration !== "release" && configuration !== "debug") {
        configuration = "debug";
    }

    buildArgs.push('--' + configuration);

    var archs = process.env["INPUT_ARCHS"];
    if (archs) {
        buildArgs.push('--archs=' + archs);
    }

    platform = process.env["INPUT_PLATFORM"].toLowerCase();
    targetEmulator = process.env["INPUT_TARGETEMULATOR"] == 'true';
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
                process.exit(1);
            }
            return iosIdentity().then(iosProfile);
        case 'windows':
            if (process.platform == 'darwin' || process.platform == 'linux') {
                console.error('Unable to build windows on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
                process.exit(1);
            }
            return processWindowsInputs();
        case 'wp8':
            if (process.platform == 'darwin' || process.platform == 'linux') {
                console.error('Unable to build wp8 on ' + process.platform + '. Add "cmd" as a "Demand" under "General" to your build definition to cause the build to always route to a Windows agent.');
                process.exit(1);
            }
            return Q(0);
        default:
            return Q(0);
    }
}

// Process VSO task inputs specific to Windows
function processWindowsInputs() {
    var appx = process.env["INPUT_WINDOWSAPPX"];
    if (appx) {
        buildArgs.push('--appx=' + appx);
    }

    var windowsOnly = process.env["INPUT_WINDOWSONLY"] == 'true';
    var windowsPhoneOnly = process.env["INPUT_WINDOWSPHONEONLY"] == 'true';
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
        unlockDefaultKeychain: process.env["INPUT_UNLOCKDEFAULTKEYCHAIN"] == 'true',
        defaultKeychainPassword: process.env["INPUT_DEFAULTKEYCHAINPASSWORD"],
        p12: process.env["INPUT_P12"],
        p12pwd: process.env["INPUT_P12PWD"],
        iosSigningIdentity: process.env["INPUT_IOSIGNINGIDENTITY"]
    };

    return xcutils.determineIdentity(input)
        .then(function (result) {
            console.log('determineIdentity result ' + JSON.stringify(result));
            if (result.identity) {
                iosXcConfig += 'CODE_SIGN_IDENTITY=' + result.identity + '\n';
                iosXcConfig += 'CODE_SIGN_IDENTITY[sdk=iphoneos*]=' + result.identity + '\n';
            } else {
                console.log('No explicit signing identity specified in task.')
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
        provProfileUuid: process.env["INPUT_PROVPROFILEUUID"],
        provProfilePath: process.env["INPUT_PROVPROFILE"],
        removeProfile: process.env["INPUT_REMOVEPROFILE"] == 'true'
    }

    return xcutils.determineProfile(input)
        .then(function (result) {
            console.log('determineProfile result ' + JSON.stringify(result));
            if (result.uuid) {
                iosXcConfig += 'PROVISIONING_PROFILE=' + result.uuid + '\n';
            }
            deleteProfile = result.deleteCommand;
        });
}

// Process VSO task inputs specific to Android
function processAndroidInputs() {
    if (process.env["INPUT_ANTBUILD"] == 'true') {
        buildArgs.push('--ant');
    } else {
        buildArgs.push('--gradleArg=--no-daemon');  // Gradle daemon will hang the agent - need to turn it off
    }

    // Pass in args for Android 4.0.0+, modify ant.properties before_compile for < 4.0.0 (event handler added at exec time)
    // Override gradle args
    var keystoreFile = process.env["INPUT_KEYSTOREFILE"];
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

    var keystorePass = process.env["INPUT_KEYSTOREPASS"];
    if (keystorePass) {
        antProperties['key.store.password'] = keystorePass;
        antProperties.override = true;
        buildArgs.push('--storePassword=' + keystorePass);
    }

    var keystoreAlias = process.env["INPUT_KEYSTOREALIAS"];
    if (keystoreAlias) {
        antProperties['key.alias'] = keystoreAlias;
        antProperties.override = true;
        buildArgs.push('--alias=' + keystoreAlias);
    }

    var keyPass = process.env["INPUT_KEYPASS"];
    if (keyPass) {
        antProperties['key.alias.password'] = keyPass;
        antProperties.override = true;
        buildArgs.push('--password=' + keyPass);
    }
    return Q(0);
}

// Utility function to copy outputs to appropriate folder if specified in the VSO task
function copyToOutputFolder(code) {
    var outputDirectory = path.resolve(buildSourceDirectory, process.env["INPUT_OUTPUTPATTERN"]);
    if (outputDirectory == buildSourceDirectory) {
        console.log('No output folder specified. Skipping copy.');
        return (0);
    }

    // Create output directory if not present
    shelljs.mkdir("-p", outputDirectory);
    shelljs.mkdir("-p", path.join(outputDirectory, platform));

    // Create the platform/config-specific output directory if not present
    var configOutputDirectory = path.join(outputDirectory, platform, configuration);
    shelljs.rm("-rf", configOutputDirectory);	// Clean folder out if it was there before - incremental build scenario
    shelljs.mkdir("-p", configOutputDirectory);

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
        var expandedList = glob.sync(source.fullSource);
        console.log('Copying ' + source.fullSource + ' to ' + configOutputDirectory);
        for (var file in expandedList) {
            var testFileOrDirectory = expandedList[file];
            if (fileExistsSync(testFileOrDirectory)) {
                // Workaround for shelljs 0.6.0 bug with cp, wildcards, and recursive option
                // see https://github.com/shelljs/shelljs/issues/376 for more information
                var options = "-" + (fs.existsSync(testFileOrDirectory) && fs.statSync(testFileOrDirectory).isDirectory ? "R" : "") + "f";
                shelljs.cp(options, testFileOrDirectory, configOutputDirectory);
            }
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
    var rawArgs = process.env["INPUT_CORDOVAARGS"];
    var args;
    if (rawArgs) {
        args = rawArgs.match(/([^" ]*("[^"]*")[^" ]*)|[^" ]+/g);
    }

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

    var version = process.env["INPUT_CORDOVAVERSION"];
    if (version) {
        cordovaConfig.moduleVersion = version;
    }

    var updateXcconfig = (iosXcConfig != '');
    return teambuild.setupCordova(cordovaConfig)
        .then(function (cordova) {
            // Add update Xcconfig hook if needed
            if (updateXcconfig) {
                console.log('Adding Xcconfig update hook')
                cordova.on('before_compile', writeVsoXcconfig)
            }

            return teambuild.getNpmVersionFromConfig(cordovaConfig).then(function (cordovaVersion) {
                if (antProperties.override) {
                    if (semver.valid(cordovaVersion) && semver.lt(cordovaVersion, '5.0.0')) {
                        console.log('WARN: Cordova versions < 5.0.0 may see build option warnings when specifying Android signing options. These can be safely ignored and do not affect signing when building with Ant.');
                    }

                    console.log('Adding ant.properties update hook')
                    cordova.on('before_compile', writeAntProperties)
                }

                if (platform === 'android') {
                    // Removes the old temp directory
                    shelljs.rm("-rf", path.join(cordovaConfig.projectPath, 'platforms', 'android', '.gradle'));

                    if (semver.valid(cordovaVersion) && semver.lt(cordovaVersion, '4.0.0')) {
                        // Special case: android on cordova versions earlier than v4.0.0 will
                        // actively fail the build if it encounters unexpected options
                        console.log('Stripping inapplicable arguments for android on cordova ' + cordovaVersion);
                        buildArgs = stripNewerAndroidArgs(buildArgs);
                    }

                    if (semver.valid(cordovaVersion) && semver.lte(cordovaVersion, '3.5.0-0.2.7')) {
                        // Special case: android on cordova versions 3.5.0-0.2.7 need
                        // "android" to be on the path, so make sure it is there
                        var currentPath = process.env['PATH'];
                        var androidHome = process.env['ANDROID_HOME'];
                        if (currentPath && androidHome && currentPath.indexOf(androidHome) === -1) {
                            console.log('Appending ANDROID_HOME to the current PATH');
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
                    console.log('Removing Xcconfig update hook')
                    cordova.off('before_compile', writeVsoXcconfig)
                }
                if (antProperties.override) {
                    console.log('Removing ant.properties update hook')
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
    console.log('before_compile fired hook  writeVsoXcconfig');
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
    console.log('xcconfig files to add include to: ' + JSON.stringify(buildXcconfig));

    // Append build-vso.xcconfig include if needed
    buildXcconfig.forEach(function (xcconfig) {
        var origContents = fs.readFileSync(xcconfig) + '';
        if (origContents.indexOf(includeText) < 0) {
            fs.appendFileSync(xcconfig, includeText);
            console.log('Appended build-vso.xcconfig include to ' + xcconfig);
        } else {
            console.log('build-vso.xcconfig include already present in ' + xcconfig);
        }
    });
    // Delete existing build-vso.xcconfig if present
    if (fs.existsSync(buildVsoXcconfig)) {
        fs.unlinkSync(buildVsoXcconfig);
    }
    // Write out build-vso.xcconfig
    console.log('Writing config to ' + buildVsoXcconfig + '. Contents:\n' + iosXcConfig);
    fs.writeFileSync(buildVsoXcconfig, iosXcConfig);
}

// Event handler for before_compile that adds ant.properties file - done before_compile so res/native doesn't overwrite ant.properties file we need to mod
function writeAntProperties(data) {
    console.log('before_compile fired hook writeAntProperties');
    var antFile = path.join(cwd, 'platforms', 'android', 'ant.properties');
    var contents = '\n';
    for (var prop in antProperties) {
        if (prop != 'override') {
            var escapedValue = escapeReservedChars(antProperties[prop]);
            contents += prop + '=' + escapedValue + '\n';

            var valueString = !isPasswordAntProperty(prop) ? ', with value: ' + escapedValue : '';
            console.log('Writing property ' + prop + ' to ant.properties' + valueString);
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
    console.log('Writing out config to ' + antFile + '.');
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