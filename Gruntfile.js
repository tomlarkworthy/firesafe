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
            authentication: ['test/authentication_test.js'],
            hsm_to_rules: ['test/hsm_to_rules_test.js'],
            exhaustive: ['test/exhaustive_hsm_test.js']
		},pandoc: {
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
        },peg: {
            hsm_to_rules: {
                src: "doc/hsm.grammar",
                dest: "src/hsm_to_rules_parser.js",
                options: { exportVar: "exports.parser" }
            }
        }

	});

	// Load the plugins for this project
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-pandoc');
    grunt.loadNpmTasks('grunt-peg');

	// Default task(s).
	grunt.registerTask('default', ['nodeunit']);

    // generate documentation
    grunt.registerTask('doc', ['pandoc']);

    // generate parsers
    grunt.registerTask('parser', ['peg']);

    grunt.registerTask('test_parser',     ['peg', "nodeunit:hsm_to_rules"]);
    grunt.registerTask('test_exhaustive', ['peg', "nodeunit:exhaustive"]);
};
