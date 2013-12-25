/**
 * This module is for utility functions for Firebase
 * For standard operations you can jsut use require("firebase") directly
 * 
 * This is meant for more complex functions like uploading/downloading a validation/rule set
 */


exports.Firebase = require('firebase');
exports.sandbox = new exports.Firebase('https://firesafe-sandbox.firebaseio.com/');

exports.hello = function(){
	console.log("hello from firebase_io")
};



exports.generateValidation = function() {
	var spr = require('../node_modules/sprintf/lib/sprintf.js');
	var _ = require('../node_modules/underscore/underscore-min.js');
       
	var valDefJson = require('./valuablesDef1.json');
	console.log("Json is " + JSON.stringify(valDefJson, null, 4)); 

	console.log("dict = " + valDefJson['valuableItemDefs']);
	var valuables = valDefJson['valuableItemDefs'];
	var keys = Object.keys(valuables);
	console.log(keys);

	// start build the validation expression
	var s = "(";

	// PART1 if there is no change to valuables expressions, it's ok.
	// The code generated here ends up looking like:
	//   	(data.child('sword').val() === newData.child('sword').val()
	//        && data.child('gold').val() === newData.child('gold').val()
	//        && data.child('water').val() === newData.child('water').val()) || (

	_.map(keys, function(valuableName) {
		var section = spr.sprintf("data.child('%s').val() === newData.child('%s').val() && ", valuableName, valuableName);
		s = s.concat(section);
	});
	// remove last " && "
	s = s.substring(0, s.length - 4);
	s = s.concat(') || (');
	console.log(s);

	// PART2

}

// http://stackoverflow.com/questions/18840080/updating-firebase-security-rules-through-firebaseref-set

