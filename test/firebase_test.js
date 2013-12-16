

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
		test.done();    
	});
};

exports.testSandboxRules = function(test){
    var firebase_io = require('../src/firebase_io.js');
       
    firebase_io.sandbox.child("rules").once('value', function(snapshot) {
		console.log('\nsandbox rules value is ' + snapshot.val());
		test.done();    
	});
};
