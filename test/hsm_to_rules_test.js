/**
 * Test we can read previously written rules.
 * We write rules with some random elementsw to test that exact phrase comes back
 */
exports.testSendItem = function(test){
    var converter = require('../src/hsm_to_rules.js');
    var $ = require('jquery-deferred');
    var fs = require('fs');

    //load hsm rules from file
    var hsm_def = fs.readFileSync("./test/test.hsm", "utf8");

    //transform hsm into rules
    try {
        var rules = converter.convert(hsm_def);
    }catch(e){
        console.log("\n", e.message);
        console.log("\n", e);
        console.trace(e);
    }

    test.done()
};