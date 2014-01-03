/**
 * Test we create send_item.rules from send_item.hsm and upload to server (which checks syntax)
 */
exports.testSendItemConversion = function(test){
    var converter = require('../src/hsm_to_rules.js');
    var $ = require('jquery-deferred');
    var fs = require('fs');
    var firebase_io = require('../src/firebase_io.js');

    //load hsm rules from file
    var hsm_def = fs.readFileSync("./models/send_item.hsm", "utf8");

    //transform hsm into rules
    try {
        var rules = converter.convert(hsm_def);

        test.ok(true, "rules did not convert ok");

        //upload to server
        $.when(firebase_io.setValidationRules(rules)).then(function(){
            test.ok(true, "rules did not upload");
            test.done()
        });

    }catch(e){
        console.log("\n", e.message);
        console.log("\n", e);
        console.trace(e);
        test.ok(false, "should not have errors");
        test.done()
    }
};