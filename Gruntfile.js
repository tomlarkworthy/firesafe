module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		//see https://github.com/gruntjs/grunt-contrib-nodeunit
		//only files ending in _test.js in directory and subdirectories of test are run
		nodeunit: {
			all: ['test/**/*_test.js'],
            send_item: ['test/send_item_test.js'],
            firebase: ['test/firebase_test.js'],
            authentication: ['test/authentication_test.js']
		},
        pandoc: {
            toHtml: {
                configs: {
                    "publish"   : 'HTML'       // Publish File Format.
                },
                files: {
                    "from": [
                        "firesafe.md"
                    ]
                }
            }
        }

	});

	// Load the plugin that provides the "nodeunit" task.
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-pandoc');

	// Default task(s).
	grunt.registerTask('default', ['nodeunit']);


    grunt.registerTask('doc', ['pandoc']);
	
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
