/**
 * Tests certain weird things
 */


/**********************************************************************************************************************
 * INITIAL RULES
 *********************************************************************************************************************
 * Send the hand crafted rules to Firebase, important this occurs first to setup test suite with the rules we want to test
 */
exports.testWriteSendXRulesValid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
    var fs = require('fs');

    var rules =  fs.readFileSync("./models/injection.rules", "utf8");

    $.when(firebase_io.setValidationRules(rules))
        .then(function(){
            test.ok(true, "these rules should have been accepted");
            test.done();
        },function(error){ //deferred error handler should not be called
            test.ok(false, "these rules should not have been rejected");
            test.done();
        });
};

/**********************************************************************************************************************
 * INITIAL DATA
 *********************************************************************************************************************/

/**
 * tests you can't put weird keys in data base
 * @param test
 */
/*
exports.testAdminUnescapedKeysWrite = function(test){
    try{
        var test_utils = require("../test/test_utils.js");
        var $ = require('jquery-deferred');
        var fs = require('fs');

        var data =  JSON.parse(fs.readFileSync("./models/injection.data", "utf8"));
        $.when(test_utils.assert_admin_can_write("/", data, test)).then(test.done, test.done);
    }catch(e){
        test.done()
    }
};
*/

/**
 * tests you can put weird values in data base
 * @param test
 */
exports.testAdminUnescapedValueWrite = function(test){
    try{
        var test_utils = require("../test/test_utils.js");
        var $ = require('jquery-deferred');
        var fs = require('fs');

        var data =  JSON.parse(fs.readFileSync("./models/injection.data", "utf8"));
        $.when(test_utils.assert_admin_can_write("/", {
            "key":"fred/secret"
        }, test)).then(test.done, test.done);
    }catch(e){
        test.done()
    }
};