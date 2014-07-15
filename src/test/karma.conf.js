/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Testacular configuration
module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '../../',
    frameworks: ['qunit'],
    // list of files / patterns to load in the browser
    files: [
    'src/main/js/bmaputil.js',
    'src/main/js/bmap.js',
    'src/main/lib/matchMedia/matchMedia.js',
    'src/main/lib/modernizr/modernizr.custom.js',
    'src/main/js/probes.js',
    'src/main/js/devicegroups.js',
    'src/test/js/*.js'
    ],
    exclude: [ ],
    reporters: ['progress', 'junit'],
    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    junitReporter: {
        outputFile: 'target/test-results.xml'
    },
    // web server port
    port: 8080,
    // cli runner port
    runnerPort: 9100,
    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome', 'ChromeCanary', 'Firefox'],
    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 30000,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,
    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,
    // report which specs are slower than 500ms
    // CLI --report-slower-than 500
    reportSlowerThan: 500
  });
};









