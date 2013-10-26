module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
			options: {
				curly: true,
				eqeqeq: true,
				es3: true,
				forin: true,
				immed: true,
				// latedef: 'nofunc',
				newcap: true,
				noarg: true,
				noempty: true,
				nonew: true,
				plusplus: true,
				quotmark: 'single',
				undef: true,
				unused: true,
				strict: true,
				trailing: true,
				globals: {
					define: true,
					module: false,
					require: false
				}
			}
		},
		watch: {
			scripts: {
				files: '<%= jshint.files %>',
				tasks: ['jshint']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jshint', 'watch']);
	grunt.registerTask('test', ['jshint']);
};
