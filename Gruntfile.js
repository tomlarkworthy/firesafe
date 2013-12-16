module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		//see https://github.com/gruntjs/grunt-contrib-nodeunit
		nodeunit: {
			all: ['test/**/*_test.js']
		}

	});

	// Load the plugin that provides the "nodeunit" task.
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	// Default task(s).
	grunt.registerTask('default', ['nodeunit']);

};
