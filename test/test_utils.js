/**
 * A number of utilities to test read and write permissions for the sandbox firebase
 * These take a nodeunit test as a parameter, and assert a number of things that should work
 * They DO modify the firebase's data, so you can use them to write specific data into the firebase and it
 * double checks it goes in ok as well
 *
 * All functions return deferred objects as many of the methods are async
 */

/**
 * This tests that admin can write indepedant of wread/write rules by writing to a specific location (can be /)
 * @param where the firebase path e.g. "/" for writing the whole firebase
 * @param value the value to put in the firebase e.g. {users:{tom:{..}, ...}}
 * @param test the nodeunit to check invariants
 * @return {*} Deferred object
 */
exports.assert_admin_can_write = function(where, value, test){
    var $ = require('jquery-deferred');
    var def = $.Deferred();
    var firebase_io = require('../src/firebase_io.js');

    $.when(firebase_io.loginAs("anAdmin", true)).then(function(){
        firebase_io.sandbox.child(where).set(value, function(error){
            test.ok(error==null, "there should not be an error but there was");
            def.resolve();
        });
    }, function(error){
        test.ok(false, "can't login");
        def.resolve();
    });
    return def;
};

exports.assert_can_read = function(who, where, expected, test){
    var $ = require('jquery-deferred');
    var def = $.Deferred();
    var firebase_io = require('../src/firebase_io.js');

    $.when(firebase_io.loginAs(who, false)).then(function(){
        //user is logged in
        firebase_io.sandbox.child(where).once('value', function(data){
            test.equal(data.val(), expected);
            def.resolve();
        }, function(error){
            test.ok(error==null, "the set should be error free but isn't");
            def.resolve();
        });
    }, function(error){
        test.ok(false, "can't login");
        def.resolve();
    });
    return def;
};

exports.assert_cant_read = function(who, where, test){
    var $ = require('jquery-deferred');
    var def = $.Deferred();
    var firebase_io = require('../src/firebase_io.js');

    $.when(firebase_io.loginAs(who, false)).then(function(){
        //user is logged in
        firebase_io.sandbox.child(where).once('value', function(data){
            test.ok(false, "should not be able to read");
            def.resolve();
        }, function(error){
            test.ok(error!=null, "there should be a permission error but there isn't");
            def.resolve();
        });
    }, function(error){
        test.ok(false, "can't login");
        def.resolve();
    });
    return def;
};

exports.assert_can_write = function(who, where, value, test){
    var $ = require('jquery-deferred');
    var def = $.Deferred();
    var firebase_io = require('../src/firebase_io.js');

    $.when(firebase_io.loginAs(who, false)).then(function(){
        firebase_io.sandbox.child(where).set(value, function(error){
            test.ok(error==null, "there should not be an error but there was");
            def.resolve();
        });
    }, function(error){
        test.ok(false, "can't login");
        def.resolve();
    });
    return def;
};

exports.assert_cant_write = function(who, where, value, test){
    var $ = require('jquery-deferred');
    var def = $.Deferred();
    var firebase_io = require('../src/firebase_io.js');

    $.when(firebase_io.loginAs(who, false)).then(function(){
        firebase_io.sandbox.child(where).set(value, function(error){
            test.ok(error!=null, "there should be an error but there was not");
            def.resolve();
        });
    }, function(error){
        test.ok(false, "can't login");
        def.resolve();
    });
    return def;
};
