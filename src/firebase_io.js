/**
 * This module is for utility functions for Firebase
 * For standard operations you can jsut use require("firebase") directly
 * 
 * This is meant for more complex functions like uploading/downloading a validation/rule set
 */


exports.Firebase = require('firebase');
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
	console.log("\n setValidationRules: ", rules_str)
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
	  console.log("statusCode: ", res.statusCode);
	  console.log("headers: ", res.headers);

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
	
	req.write( rules_str , encoding='utf8' );
	req.end();

	req.on('error', function(e) {
	  console.error(e);
	  def.reject(e)
	});
	
	return def;	 
}

// NOTE: the boolen expression produced is not
// optimal (canonical). In particular, we can deduplicate some
// of the min/max checks produced in PART 2B
exports.generateValidation = function() {
	var spr = require('../node_modules/sprintf/lib/sprintf.js');
	var _ = require('../node_modules/underscore/underscore-min.js');

	var valDefJson = require('./valuablesDef1.json');
	console.log("Json is " + JSON.stringify(valDefJson, null, 4)); 

	var valuables = valDefJson['valuableItemDefs'];
	var valuablesKeys = Object.keys(valuables);
	console.log(valuablesKeys);

	// start build the validation expression
	var part1 = "(";

	// PART1 if there is no change to valuables expressions, it's ok.
	// The code generated here ends up looking like:
	//   	(data.child('sword').val() === newData.child('sword').val()
	//        && data.child('gold').val() === newData.child('gold').val()
	//        && data.child('water').val() === newData.child('water').val()) || (

	_.map(valuablesKeys, function(valuableName) {
		var section = spr.sprintf("data.child('%s').val() === newData.child('%s').val() && ", valuableName, valuableName);
		part1 = part1.concat(section);
	});
	// remove last " && "
	part1 = part1.substring(0, part1.length - 4);
	part1 = part1.concat(')');
	// s = s.concat(') || (');
	console.log("part 1 = " + part1);

	// PART2
	var conversions = valDefJson['conversions'];
	// console.log("conversion = " + conversions);
	// var conversionsKeys = Object.keys(conversions);

	// var conversionFromItems = _.pluck(conversions, 'itemA');
	// var conversionToItems = _.pluck(conversions, 'itemB');
	// console.log("from, to = "+conversionFromItems);

	var part2Collect = '(';
	_.map(conversions, function(conversion) {
		// PART 2A
		// Check for that no valuable values have changed apart from
		// the two named in this conversion
		var valuableFrom = conversion['itemA'];
		var valuableTo = conversion['itemB'];
		var valuableFromName = valuableFrom[1];
		var valuableToName = valuableTo[1];
		var valuableFromCount = valuableFrom[0];
		var valuableToCount = valuableTo[0];
		
		var part2Grouped = '';
		console.log("val from, to = " + valuableFromName + " " + valuableToName);
		
		var valuableKeysNotInvolvedInConversion = _.without(valuablesKeys, valuableFromName, valuableToName);
		console.log(valuableKeysNotInvolvedInConversion);

		// items which need to have changed value
		var part2 = '(';
		var section = spr.sprintf("data.child('%s').val() !== newData.child('%s').val() && ", valuableFromName, valuableFromName);
		part2 = part2.concat(section);
		var section = spr.sprintf("data.child('%s').val() !== newData.child('%s').val() && ", valuableToName, valuableToName);
		part2 = part2.concat(section);

		// items which need to have unchanged value		
		_.map(valuableKeysNotInvolvedInConversion, function(valuableName) {
			var section = spr.sprintf("data.child('%s').val() === newData.child('%s').val() && ", valuableName, valuableName);
			part2 = part2.concat(section);
		});
		// remove last " && "
		part2 = part2.substring(0, part2.length - 4);
		part2 = part2.concat(')');
		// s = s.concat(') && (');

		console.log('part 2 =' +part2);

		// PART2B
		// Check for min/max values if specified
		var part2b = '(';
		var valuableMin = valuables[valuableFromName]['minPerUser'];
		// From item min
		console.log('val min = ' + valuableMin);
		if (typeof valuableMin !== 'undefined') {
			var section = spr.sprintf("newData.child('%s').val() >= %s && ", valuableFromName, valuableMin);
			part2b = part2b.concat(section);
		}
		// From item max
		var valuableMax = valuables[valuableFromName]['maxPerUser'];
		console.log('val max = ' + valuableMax);
		if (typeof valuableMax !== 'undefined') {
			var section = spr.sprintf("newData.child('%s').val() <= %s && ", valuableFromName, valuableMax);
			part2b = part2b.concat(section);
		}
	
		// To item min
		valuableMin = valuables[valuableToName]['minPerUser'];
		console.log('val min = ' + valuableMin);
		if (typeof valuableMin !== 'undefined') {
			var section = spr.sprintf("newData.child('%s').val() >= %s && ", valuableToName, valuableMin);
			part2n = part2b.concat(section);
		}
		// To item max
		valuableMax = valuables[valuableToName]['maxPerUser'];
		console.log('val max = ' + valuableMax);
		if (typeof valuableMax !== 'undefined') {
			var section = spr.sprintf("newData.child('%s').val() <= %s && ", valuableToName, valuableMax);
			part2n = part2b.concat(section);
		}
		part2b = part2b.substring(0, part2b.length - 4);
		part2b = part2b.concat(')');
		// s = s.concat(') && (');
		console.log('part2b = ' + part2b);

		// PART2C
		// Check change of two values in a conversion are valid values

		// var valuableFromCount = valuables[valuableFromName]['minPerUser'];
		var part2c = '(';
		var section = spr.sprintf("(newData.child('%s').val() - data.child('%s').val()) / %s === (newData.child('%s').val() - data.child('%s').val()) / %s)",
			valuableFromName, valuableFromName, valuableFromCount,
			valuableToName, valuableToName, valuableToCount);
		part2c = part2c.concat(section);
		console.log('part2c = '+ part2c);

		var part2Grouped = spr.sprintf("(%s && %s && %s)", part2, part2b, part2c);
		console.log('part2Grouped = ' + part2Grouped);

		part2Collect = part2Collect.concat(part2Grouped);
		part2Collect = part2Collect.concat(' || ');
	});
	//expr:
	part2Collect = part2Collect.substring(0, part2Collect.length - 4);
	part2Collect = part2Collect.concat(')');


	var result = spr.sprintf("%s || (%s)", part1, part2Collect);
	console.log('result = ' + result);
	// part1 || (part2 && part2b && part2c)
}


