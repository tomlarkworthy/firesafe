/**
 * Testing functionality related to Google closure compiler
 */

var compiler = require("closure-compiler");
var fs = require('fs');

exports.call_closure = function(test){
    var options =
    {
        compilation_level    : 'ADVANCED_OPTIMIZATIONS',
        language_in    : 'ECMASCRIPT5_STRICT',
        jscomp_error: "es5Strict"
        //create_source_map: "./test/assets/deadcodemap"
    };

    function post_compile (err, stdout, stderr) {
        console.log(stderr);
        if (err){
            test.ok(false);
        }
        var mycompiledcode = stdout;

        console.log(mycompiledcode);

        test.ok(true);
        test.done();
    }

    compiler.compile(fs.readFileSync('./test/assets/deadcode.js'), options, post_compile)
};