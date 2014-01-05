/**
 * This module is for utility functions for Firebase
 * For standard operations you can jsut use require("firebase") directly
 * 
 * This is meant for more complex functions like uploading/downloading a validation/rule set
 */


exports.Firebase = require('firebase');
exports.sandbox = new exports.Firebase('https://firesafe-sandbox.firebaseio.com/');

/* TODO: Bit of a security issue here */
exports.FIREBASE_SECRET = "9MPlKqcjUPZtbvbUuqD8omoK7f4kRU7FDxBIz2fX";

exports.hello = function(){
	console.log("hello from firebase_io")
};

/**
 * uploads the validation rules (representated as a string)
 * returns a deferred object, the error handler is called if the upload is rejected (e.g. invalid rules)
 */
exports.setValidationRules = function(rules_str){
	//console.log("\n setValidationRules: ", rules_str);
	//http://stackoverflow.com/questions/18840080/updating-firebase-security-rules-through-firebaseref-set
	var $ = require('jquery-deferred');	
	var def = $.Deferred();
	var https = require('https');	
	
	//equivelent of curl -X PUT -d '{ "rules": { ".read": true } }' https://SampleChat.firebaseio-demo.com/.settings/rules.json?auth=FIREBASE_SECRET
	var options = {
	  hostname: 'firesafe-sandbox.firebaseio.com',
	  port: 443,
	  path: '/.settings/rules.json?auth='+exports.FIREBASE_SECRET,
	  method: 'PUT'
	};
	
	var req = https.request(options, function(res) {
	  //console.log("statusCode: ", res.statusCode);
	  //console.log("headers: ", res.headers);

	  res.on('data', function(d) {
		process.stdout.write(d);
		var data =  JSON.parse(d); //check the return json's status that Firebase writes
		if (data.status == "ok"){
			def.resolve(data.status); //so Firebase says it uploaded ok
		}else{
			def.reject(data.status); // the rules could be rejected for a variety of reasons
		}		
	  });
	});
	
	req.write( rules_str , 'utf8' );//write the actual rules in the request payload
	req.end();

	req.on('error', function(e) {
	  console.error(e);//the whole request went bad which is not a good
	  def.reject(e)
	});
	
	return def;	 
};

/**
 * retreives the validation rules (representated as a string)
 * returns a deferred object, with the rules being the data payload
 */
exports.getValidationRules = function(rules_str){
	console.log("\n getValidationRules");
	//http://stackoverflow.com/questions/18840080/updating-firebase-security-rules-through-firebaseref-set
	var $ = require('jquery-deferred');	
	var def = $.Deferred();
	var https = require('https');	
	
	//curl https://SampleChat.firebaseio-demo.com/.settings/rules.json?auth=FIREBASE_SECRET
	var options = {
	  hostname: 'firesafe-sandbox.firebaseio.com',
	  port: 443,
	  path: '/.settings/rules.json?auth='+exports.FIREBASE_SECRET,
	  method: 'GET'
	};
	
	var req = https.request(options, function(res) {
	  console.log("statusCode: ", res.statusCode);
	  console.log("headers: ", res.headers);

	  res.on('data', function(d) {
		var data = d.toString();
		console.log("\n", data);
		def.resolve(data); //so Firebase returned the rules ok
	  });
	});
	
	req.end();

	req.on('error', function(e) {
	  console.error(e);//the whole request went bad which is not a good
	  def.reject(e)
	});
	
	return def;	 
};

exports.getAuthToken = function(username, admin){
    var FBTokenGenMod = require('firebase-token-generator');
    var FBTokenGenerator = new FBTokenGenMod(exports.FIREBASE_SECRET);
    return FBTokenGenerator.createToken({ username: username }, {admin: admin});
};

exports.login = function(AUTH_TOKEN){
    var $ = require('jquery-deferred');
    var def = $.Deferred();

    exports.sandbox.auth(AUTH_TOKEN, function(error) {
        if(error) {
            console.log("Login FAILED!");
            def.reject()
        } else {
            console.log("Login Succeeded!");
            def.resolve();
        }
    });
    return def;
};

/**
 * login to sandbox with the given username, and boolean option to be an admin
 * @param username
 * @param admin boolean, should the login be granted blanket read and write access??
 * @return {*}
 */
exports.loginAs = function(username, admin){
    return exports.login(exports.getAuthToken(username, admin));
};
