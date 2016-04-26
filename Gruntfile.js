module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.loadTasks('tasks');

	var packageConfig = grunt.file.readJSON('package.json');

	grunt.initConfig({
		appName: 'Electern',
		appVersion: packageConfig.version,
		electronVersion: '0.36.12',

		'electron-download': {
			options: {
				out: 'electron',
				version: '<%= electronVersion %>'
			}
		},

		'electron-packager': {
			options: {
				name: '<%= appName %>',
				dir: 'src',
				out: 'dist',
				asar: true,
				prune: true,
				version: '<%= electronVersion %>'
			},
			darwin: {
				options: {
					arch: 'x64',
					platform: 'darwin'
				}
			},
			win32: {
				options: {
					arch: 'ia32',
					platform: 'win32'
				}
			},
			release: {
				options: {
					arch: 'ia32,x64',
					platform: 'darwin,linux,win32'
				}
			}
		},

		clean: {
			css: {
				src: [ 'src/resources/**/*.css' ]
			},
			electron: {
				src: [ 'electron' ]
			},
			release: {
				src: [ 'dist' ]
			}
		},

		stylus: {
			options: {
				atBegin: true,
				compress: true,
				'resolve url': true
			},

			compile: {
				files: {
					'src/resources/main.css': 'src/resources/main.styl'
				}
			}
		},

		watch: {
			stylus: {
				files: [ 'src/resources/**/*.styl' ],
				tasks: [ 'stylus' ]
			}
		}
	});

	grunt.registerTask('default', [ 'stylus', 'watch' ]);
	grunt.registerTask('dev', [ 'electron-download', 'stylus' ]);
	grunt.registerTask('release', [ 'stylus', 'clean:release', 'electron-packager:release' ]);
	grunt.registerTask('release-darwin', [ 'stylus', 'clean:release', 'electron-packager:darwin' ]);
	grunt.registerTask('release-win32', [ 'stylus', 'clean:release', 'electron-packager:win32' ]);
};
