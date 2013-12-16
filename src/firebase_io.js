/**
 * This module is for utility functions for Firebase
 * For standard operations you can jsut use require("firebase") directly
 * 
 * This is meant for more complex functions like uploading/downloading a validation/rule set
 */


exports.Firebase = require('firebase');

exports.hello = function(){
	console.log("hello from firebase_io")
};



exports.get_rules = function(){
	var rootRef = new Firebase('https://myprojectname.firebaseIO-demo.com/');
	
	console.log("hello from firebase_io")
};


