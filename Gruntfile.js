module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		//see https://github.com/gruntjs/grunt-contrib-nodeunit
		//only files ending in _test.js in directory and subdirectories of test are run
		nodeunit: {
			all: ['test/**/*_test.js']
		}

	});

	// Load the plugin that provides the "nodeunit" task.
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	// Default task(s).
	grunt.registerTask('default', ['nodeunit']);
	
	//some basic tasks
	grunt.registerTask('hello', function(){
		console.log("hello");
	});
	
	grunt.registerTask('hellofirebase', function(){
		firebase = require("./src/firebase_io.js");
		firebase.hello();
	});

	grunt.registerTask('generateValidation', function(){
		firebase = require("./src/firebase_io.js");
		firebase.generateValidation();
	});

};
