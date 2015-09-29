/*
  Copyright (c) Microsoft. All rights reserved.  
  Licensed under the MIT license. See LICENSE file in the project root for full license information.

  Sample Gulp script to compile TypeScript and run tests that can be paired with the Cordova Build VSO task.
*/
var gulp = require("gulp"),
    fs = require("fs"),
    ts = require("gulp-typescript"),
    Server = require('karma').Server;
    
var tsconfigPath = "scripts/tsconfig.json";                                        


/*
 *  Compile TypeScript code - This sample is designed to compile anything under the "scripts" folder using settings
 *  in scripts/tsconfig.json if present or this gulpfile if not.  Adjust as appropriate for your use case.
*/
gulp.task("scripts", function () {
    if (fs.existsSync(tsconfigPath)) {
        // Use settings from scripts/tsconfig.json
        gulp.src("scripts/**/*.ts")
            .pipe(ts(ts.createProject(tsconfigPath)))
            .pipe(gulp.dest("."));
    } else {
        // Otherwise use these default settings
         gulp.src("scripts/**/*.ts")
            .pipe(ts({
                noImplicitAny: false,
                noEmitOnError: true,
                removeComments: false,
                sourceMap: true,
                out: "appBundle.js",
            target: "es5"
            }))
            .pipe(gulp.dest("www/scripts"));        
    }
});

/**
 * Run test once and exit - karma.conf.js should be modified as appropriate for where you've placed your tests
 */
gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('default', ['tdd']);
