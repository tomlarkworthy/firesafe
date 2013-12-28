
/**
 * Test we can read previously written rules.
 * We write rules with some random elementsw to test that exact phrase comes back
 */
exports.testReadRules = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
    var random = Math.random();   //random element to double check our rules are really written
    
    //note, Firebase reformats rule's white space, 
    //so we have to be carfull, the formatter might change unexpectadly Firebase end
    var rules = '{ "rules": { ".read": "data.val() == '+random+'"} }' 
    
    //1st we write our randomly seeded rules
    $.when(firebase_io.setValidationRules(rules))
    .then(function(){
		test.ok(true, "these rules should not have been accepted");
		//once that is ok we read the current rules
		$.when(firebase_io.getValidationRules()).then(function(data){
			test.equals(data, rules) //check the rules match!
			test.done();
		}, function(error){
			test.ok(false, "something when wrong with response to getValidationRules");
			test.done();
		});				
	},function(error){
		test.ok(false, "these rules should not have been rejected");
		test.done();
	});
};

/**
 * Test valid rules can be written to Firebase, this also resets the permissions to read all for subsequent testing
 */
exports.testWriteRulesValid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
       
    $.when(firebase_io.setValidationRules('{ "rules": { ".read": true } }'))
    .then(function(){
		test.ok(true, "these rules should have been accepted");
		test.done();
	},function(error){ //deferred error handler should not be called
		test.ok(false, "these rules should not have been rejected");
		test.done();
	});
};


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
 * Test invalid rules are rejected by Firebase
 */
exports.testWriteRulesInvalid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
       
    $.when(firebase_io.setValidationRules('{ "rules": { ".read": true'))
    .then(function(){
		test.ok(false, "these rules should not have been accepted");
		test.done();
	},function(error){//deferred error handler should be called
		test.ok(true, "these rules should have been rejected");
		test.done();
	});
};


