/**
 * A complete test of permissions and authentication
 * The first test uploads the rules (based on API documentation: https://www.firebase.com/docs/security/security-rules.html)
   "rules":{
        "users":{
            "$user":{
                ".read" :"$user == auth.username",
                ".write":"$user == auth.username",
                "public":{
                    ".read":true
                }
            }
        }
    }
 *
 * It then tests admin can ignore rules by loading test data
 * Two people with different values in public and private areas
 * users: {
        bill:{private:1, public:2},
        ted :{private:3, public:4}
   }
 *
 * The test suite then tests bill can't read teds private data etc. for all classes of authenticated user & permission combinations
 */


/**
 * Send the hand crafted rules to Firebase, important this occurs first to setup test suite with the rules we want to test
 */
exports.testWriteAuthenticationRulesValid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
    var fs = require('fs');

    //standard user rules, only authenticated user can read and write to their account,
    //unless the data is in the public portion of their account
    var rules = '{'+
        '   "rules": {'+
        '       "users": {'+
        '           "$user": {'+
        '               ".read": "$user == auth.username",'+
        '                   ".write": "$user == auth.username",'+
        '                   "public":{".read":true}'+
        '           }'+
        '       }'+
        '    }'+
        '}';

    $.when(firebase_io.setValidationRules(rules))
        .then(function(){
            test.ok(true, "these rules should have been accepted");
            test.done();
        },function(error){ //deferred error handler should not be called
            test.ok(false, "these rules should not have been rejected");
            test.done();
        });
};

/**
 * tests that admins ignore normal write rules, by creating two users, bill and ted, with both secret and public numbers
 * @param test
 */
exports.testAdminWrite = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_admin_can_write("/",
        {users:{
            bill:{private:1, public:2},
            ted :{private:3, public:4}
        }}, test)).then(test.done);
};

/**
 * tests that unlogged in people can't write anything
 * @param test
 */
exports.testNonAdminCantWrite = function(test){
    var firebase_io = require('../src/firebase_io.js');

    //logout
    firebase_io.sandbox.unauth();

    firebase_io.sandbox.child("users").set({
        bill:{private:1, public:2},
        ted :{private:3, public:4}
    }, function(error){
        test.ok(error!=null, "there should be a permission error but there isn't");
        test.done();
    });
};

/**
 * tests that a logged in user can read their own data
 * @param test
 */
exports.testAuthReadPrivate = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_read("bill", "users/bill/private", 1, test))
        .then(test.done);
};

/**
 * tests that a logged in user cant read another's private data
 * @param test
 */
exports.testAuthCantReadPrivate = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_read("bill", "users/ted/private", test))
        .then(test.done);
};

/**
 * tests that a logged in user can read another persons public data
 * @param test
 */
exports.testAuthReadPublic = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_read("bill", "users/ted/public", 4, test))
        .then(test.done);
};

/**
 * tests that a logged in user can write to their private data
 * @param test
 */
exports.testAuthWritePrivate = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("bill", "users/bill/private", 1, test))
        .then(test.done);
};

/**
 * tests that a logged in user can write to another's public data
 * @param test
 */
exports.testAuthCantWritePublic = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("ted", "users/bill/public", 1, test))
        .then(test.done);
};

