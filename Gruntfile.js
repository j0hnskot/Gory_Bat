 /**
 * @author      John Skotiniotis <j0hnskot@gmail.com>
 * @copyright   2014 - John Skotiniotis
 * @license     {@link http://choosealicense.com/licenses/mit/ | MIT License}
 * @version     0.0.2
 * @date        14/11/2014
 */

module.exports = function (grunt) {


    var productionBuild = !!(grunt.cli.tasks.length && grunt.cli.tasks[0] === 'release');

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-execute');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');


    // Configuration goes here
    grunt.initConfig({

           watch:{
            options: {
              livereload: true
            },
            files:['**/*.js','**/*.html', '**/*.css']
        },

        connect : {
            options : {
            hostname : 'localhost',
            port : 8080,
            livereload : 35729
            },
            myserver: {
            }
        },


        execute: {

            src: ['Font/convertFont.js']
        },

        uglify: {
            "testing": {
                options: {
                    mangle: false,
                     compress: {
                        drop_console: productionBuild,
                        drop_debugger: productionBuild
                    }
                },
                files: {
                    'minified/js/game.js': ['dev/js/lib/config.js/','dev/js/states/Boot.js','dev/js/**/*.js','!dev/**/cocoon.min.js' ,'!dev/**/iap.js','!dev/**/shop.js','!dev/**/jsParser.js'],
                    'port/js/game.js': ['dev/js/lib/cocoon.min.js','dev/js/lib/phaser.js','dev/js/lib/config.js/','dev/js/states/Boot.js','dev/js/**/*.js', '!dev/**/editor.js']


                }
            },
            "release": {
                options: {
                    mangle: false,
                     compress: {
                        drop_console: productionBuild,
                        drop_debugger: productionBuild
                    }
                },
                files: {
                    'minified/js/game.js': ['dev/js/lib/config.js/','dev/js/states/Boot.js','dev/js/**/*.js','!dev/**/cocoon.min.js' ,'!dev/**/iap.js','!dev/**/shop.js','!dev/**/jsParser.js' ,'!/dev/**/editor.js'],
                    'port/js/game.js': ['dev/js/lib/cocoon.min.js','dev/js/lib/phaser.js','dev/js/lib/config.js/','dev/js/states/Boot.js','dev/js/**/*.js', '!dev/**/editor.js']

                }
            }
        },

        compress: {
            android: {
                options: {
                    archive: 'port/port.zip',
                    mode: 'zip'
                },
                files: [
                    {
                        src: '**/*',
                        cwd: 'port/',
                        expand: true
                    }
                ]
            }
        },


        copy: {

            font: {

                cwd: 'dev/assets/font',
                src: '*.fnt',
                dest: 'Font/',
                rename: function (dest, src) {
                    return dest + src.replace('.fnt', '.xml');
                },
                expand: true


            },




            main: {
                files: [
                    {
                        cwd: 'dev/',
                        src: ['assets/**','!assets/mobile/**'],
                        dest: 'minified/',
                        expand: true
            },

                    {
                        cwd: 'dev/',
                        src: ['assets/**','!assets/desktop/**'] ,
                        dest: 'port/',
                        expand: true
            },




            {
                        cwd: 'dev/js/',
                        src: 'levels/**',
                        dest: 'minified/js/',
                        expand: true
            },

            {

                cwd: 'dev/js/',
                src: 'levels/**',
                dest: 'port/js/',
                expand: true
            },



            {
                cwd: 'indexFiles/',
                src: 'indexCocoonJS.html',
                dest: 'port/',
                rename: function (dest, src) {
                    return dest + src.replace('indexCocoonJS', 'index');
                },
                expand: true
            },




            {
                cwd: 'indexFiles/',
                src: 'indexWeb.html',
                dest: 'minified/',
                rename: function (dest, src) {
                    return dest + src.replace('indexWeb', 'index');
                },
                expand: true
            },

            {
                cwd: 'Font/',
                src: '*.json',
                dest: 'port/assets/font',
                expand: true
            }



                ]
            }


        },

        clean: ["port/**","minified/**"]





    });


    // Load plugins here




    // Define your tasks here
    grunt.registerTask('default', ['clean', 'copy:font', 'execute', 'uglify:testing', 'copy:main', 'compress']);
    grunt.registerTask('release', ['clean', 'copy:font', 'execute', 'uglify:release', 'copy:main', 'compress']);
    grunt.registerTask('server', ['connect','watch']);


};
