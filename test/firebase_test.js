

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
