
/**
 * Send the hand crafted rules to Firebase, important this occurs first to setup test suite with the rules we want to test
 */
exports.testWriteSendXRulesValid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
    var fs = require('fs');

    //load rules from file
    var rules = fs.readFileSync("./models/sent_x.rules", "utf8");

    $.when(firebase_io.setValidationRules(rules))
        .then(function(){
            test.ok(true, "these rules should have been accepted");
            test.done();
        },function(error){ //deferred error handler should not be called
            test.ok(false, "these rules should not have been rejected");
            test.done();
        });
};

