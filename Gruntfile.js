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

/*global module:false,require:false */
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        karma: {
            unit: {
                configFile: 'src/test/karma.conf.js',
                autoWatch: true
            },
            continuous: {
                configFile: 'src/test/karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            }
        },
        jshint: {
            // only check BrowserMap files and Gruntfile.js
            files: {
                src: [
                    'Gruntfile.js',
                    'src/main/js/*.js'
                ]
            },
            options: {
                browser: true,
                curly: true,
                forin: true,
                camelcase: true,
                quotmark: true,
                undef: true,
                unused: true,
                trailing: true,
                maxlen: 140,
                multistr: true
            }
        },
        copy: {
            browsermap: {
                files: [
                    {src: ['src/main/js/*.js'], dest: 'target/libs/browsermap/', expand: true, flatten: true},
                    {cwd: 'src/main/resources/demo/', src: ['**'], dest: 'target/demo/', expand: true},
                    {cwd: 'src/main/lib/', src: ['**'], dest: 'target/libs/externals/', expand: true},
                    {src: ['NOTICE'], dest: 'target/', expand: true}
                ]
            },
            minified: {
                files: [
                    {src: ['target/libs/min/browsermap.min.js'], dest: 'target/demo/js/browsermap.min.js'}
                ]
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: {
                    except: ['BrowserMap', 'BrowserMapUtil', 'Modernizr']
                }
            },
            target: {
                files: {
                    'target/libs/min/browsermap.min.js': [
                        'target/libs/browsermap/bmaputil.js',
                        'target/libs/browsermap/bmap.js',
                        'target/libs/externals/modernizr/modernizr.custom.js',
                        'target/libs/externals/matchMedia/matchMedia.js',
                        'target/libs/browsermap/probes.js',
                        'target/libs/browsermap/devicegroups.js'
                    ]
                }
            }
        },
        jsdoc: {
            dist: {
                src: ['src/main/js/*.js', 'README.md'],
                dest: 'target/doc'
            }
        },
        compress: {
            source: {
                options: {
                    archive: 'target/browsermap-<%= pkg.version %>-incubating.tar.gz',
                    mode: 'tgz',
                    pretty: true
                },
                files: [
                    // the following entries provide the source files in the archive
                    {cwd: 'src/', src: ['**/*.js'], dest: 'browsermap-<%= pkg.version %>-incubating/src/', expand: true},
                    {cwd: 'src/', src: ['**/*.css'], dest: 'browsermap-<%= pkg.version %>-incubating/src/', expand: true},
                    {cwd: 'src/', src: ['**/*.html'], dest: 'browsermap-<%= pkg.version %>-incubating/src/', expand: true},
                    {cwd: 'target/', src: ['NOTICE'], dest: 'browsermap-<%= pkg.version %>-incubating/', expand: true},
                    {
                        src: [
                            '.gitignore', '.travis.yml', 'Gruntfile.js', 'package.json', 'README.md', 'LICENSE', 'DISCLAIMER', 'rat.exclude'
                        ],
                        dest: 'browsermap-<%= pkg.version %>-incubating/'
                    },
                    {src: ['ci/**'], dest: 'browsermap-<%= pkg.version %>-incubating/'}
                ]
            },
            dist: {
                options: {
                    archive: 'target/browsermap-<%= pkg.version %>-incubating-dist.tar.gz',
                    mode: 'tgz',
                    pretty: true
                },
                files: [
                    {src: ['LICENSE', 'README.md', 'DISCLAIMER'], dest: 'browsermap-<%= pkg.version %>-incubating-dist/'},
                    {cwd: 'target/demo', src: ['**'], dest: 'browsermap-<%= pkg.version %>-incubating-dist/demo/', expand: true},
                    {cwd: 'target/doc/', src: ['**'], dest: 'browsermap-<%= pkg.version %>-incubating-dist/doc/', expand: true},
                    {cwd: 'target/', src: ['NOTICE'], dest: 'browsermap-<%= pkg.version %>-incubating-dist/', expand: true},
                    {cwd: 'target/libs/min/', src: ['*.js'], dest: 'browsermap-<%= pkg.version %>-incubating-dist/', expand: true}
                ]
            }
        },
        qunit: {
            options: {
                '--web-security': 'no',
                coverage: {
                    disposeCollector: true,
                    src: ['src/main/js/bmap.js', 'src/main/js/bmaputil.js'],
                    instrumentedFiles: 'target/report/ins/',
                    htmlReport: 'target/report/coverage',
                    coberturaReport: 'target/report/',
                    linesThresholdPct: 50
                }
            },
            all: ['src/test/resources/**/*.html']
        },
        clean: ['target/'],
        demo: {
            demoFolder: 'target/demo/',
            templateFile: 'index.html',
            selectors: [
                'browser',
                'highResolutionDisplay',
                'oldBrowser',
                'smartphone.highResolutionDisplay',
                'smartphone',
                'tablet.highResolutionDisplay',
                'tablet'
            ]
        },
        sourcetemplates: {
            files: ['target/libs/browsermap/bmap.js', 'target/NOTICE']
        }
    });

    grunt.registerTask('demo', 'Provides the demo pages', function() {
        grunt.task.requires('clean', 'test', 'copy:browsermap', 'minify', 'copy:minified');
        var data = grunt.config('demo'),
            evaluatedContent,
            path = require('path');
        if (data) {
            if (!data.demoFolder) {
                grunt.log.error('No demo folder has been defined (demo.demoFolder).');
                return;
            }
            if (!data.templateFile) {
                grunt.log.error('No template file has been defined (demo.templateFile).');
                return;
            }
            if (!data.selectors || data.selectors.length < 1) {
                grunt.log.error('No selectors have been defined (demo.selectors).');
                return;
            }
            var templateFile = path.join(data.demoFolder, data.templateFile);
            evaluatedContent = grunt.template.process(grunt.file.read(templateFile));
            grunt.file.write(templateFile, evaluatedContent);
            for (var i = 0; i < data.selectors.length; i++) {
                var fileName = data.templateFile.replace('.html', '.' + data.selectors[i] + '.html');
                grunt.file.write(path.join(data.demoFolder, fileName), evaluatedContent);
            }
            grunt.log.writeln('Generated demo site at ' + data.demoFolder);
        } else {
            grunt.log.error('Cannot find a configuration for the demo task!');
            return;
        }
    });

    grunt.registerTask('sourcetemplates', 'Replaces templates from source files', function() {
        grunt.task.requires('clean', 'test', 'copy:browsermap');
        var data = grunt.config('sourcetemplates'),
            path = require('path'),
            files,
            file,
            content;
        if (data) {
            files = data.files;
            if (!files || !(files instanceof Array)) {
                grunt.log.error('No files array defined.');
                return;
            }
            for (var i = 0; i < files.length; i++) {
                file = path.normalize(files[i]);
                content = grunt.template.process(grunt.file.read(file));
                grunt.file.write(file, content);
                grunt.log.writeln('Replaced template variables at ' + file);
            }
        } else {
            grunt.log.error('Cannot find a configuration for the sourcetemplates task!');
            return;
        }
    });

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-qunit-istanbul');

    grunt.registerTask('minify', ['uglify']);
    grunt.registerTask('coverage', ['qunit-cov']);
    grunt.registerTask('test', ['jshint', 'karma:continuous', 'qunit']);
    grunt.registerTask('package', ['clean', 'test', 'copy:browsermap', 'sourcetemplates', 'minify', 'copy:minified', 'demo', 'jsdoc',
        'compress:source', 'compress:dist']);
};
