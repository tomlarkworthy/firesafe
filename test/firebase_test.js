

/**
 * This connects to the Firebase provided test firebase and prints out its root element
 * 
 */
exports.testRootRef = function(test){
    var Firebase = require('firebase');
    var rootRef = new Firebase('https://myprojectname.firebaseIO-demo.com/');
        
    rootRef.once('value', function(snapshot) {
		console.log('\nfirebase root value is ' + snapshot.val());
		test.done();    
	});
};

/**
 * This connects to our projects sandbox Firebase and prints the root element
 * 
 */
exports.testSandboxRootRef = function(test){
    var firebase_io = require('../src/firebase_io.js');
       
    firebase_io.sandbox.once('value', function(snapshot) {
		console.log('\nsandbox root value is ' + snapshot.val());
		test.ok(true, "the API should at least returned");
		test.done();    
	});
};

/**
 * Test valid rules can be written to Firebase
 */
exports.testWriteRulesValid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
       
    $.when(firebase_io.setValidationRules('{ "rules": { ".read": true } }'))
    .then(function(){
		test.ok(true, "these rules should have been accepted");
		test.done();
	},function(error){
		test.ok(false, "these rules should not have been rejected");
		test.done();
	});
};

/**
 * Test invalid rules are rejected by Firebase
 */
exports.testWriteRulesInvalid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
       
    $.when(firebase_io.setValidationRules('{ "rules": { ".read": true'))
    .then(function(){
		test.ok(false, "these rules should not have been accepted");
		test.done();
	},function(error){
		test.ok(true, "these rules should have been rejected");
		test.done();
	});
};
