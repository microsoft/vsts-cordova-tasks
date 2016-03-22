// Monkey patch to get vso-task-lib logging and exit functions to work when calling from PowerShell

var semver = require('semver');
var path = require('path');
var fs = require('fs');
var shelljs = require('shelljs');
var tl;

if (!tl && process.argv.length > 2 && process.argv[3] == '##vso-task-powershell') {
    console.log('Script is running from Windows VSO agent.');

    var logDebug = (process.env['SYSTEM_DEBUG'] == 'true');

    // Monkey patch process.stdout before we get to require
    process.stdout._origWrite = process.stdout.write;
    var modWrite = function (chunk, encoding, callback) {
        chunk = chunk + '';  // Make sure it's a string.
        if (chunk.indexOf('##vso[task.debug]') >= 0) {
            if (logDebug) {
                chunk = 'DEBUG: ' + chunk.replace('##vso[task.debug]', '');
            } else {
                chunk = '';
            }
        }
        this._origWrite(chunk, encoding, callback);
    };
    process.stdout.write = modWrite.bind(process.stdout);

    setupTL();

    var warn = console.warn;
    console.warn = function (message) {
        warn('WARN: ' + message);
    }
    tl.warning = console.warn;
    tl.error = console.err;
    tl.exit = process.exit;
} else {
    setupTL();
}

function setupTL() {
    if (semver.lt(process.version, '4.0.0')) {
        tl = {};
        tl.getInput = function (name, required) {
            var inval = process.env['INPUT_' + name.replace(' ', '_').toUpperCase()];
            if (inval) {
                inval = inval.trim();
            }

            if (required && !inval) {
                console.error("failed");
                process.exit(1);
            }

            return inval;
        };

        tl.getVariable = function (name) {
            var varval = process.env[name.replace(/\./g, '_').toUpperCase()];
            return varval;
        };

        tl.getPathInput = tl.getInput;

        tl.exit = process.exit;
        tl.debug = console.log;
        tl.cd = process.chdir;

        tl.mkdirP = function (directory) {
            var pathList = directory.split(path.sep);
            var outPath;
            pathList.forEach(function (relPath) {
                // Make sure to reappend the root if we need to
                if (relPath === '') relPath = path.sep; // *NIX root
                if (relPath.indexOf(':') >= 0) relPath += path.sep; // Windows root

                if (!outPath) {
                    outPath = relPath;
                } else {
                    outPath = path.resolve(outPath, relPath);
                }

                try {
                    var stats = fs.statSync(path);
                    if (!(stats && (stats.isFile() || stats.isDirectory()))) {
                        fs.mkdirSync(outPath);
                    }
                } catch (e) {
                    return false;
                }
            });
            return outPath;
        };
        
        tl.rmRf = function (path) {
            
        };
    } else {
        tl = require('vsts-task-lib');
    }
}

module.exports = tl;
