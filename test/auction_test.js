var firebase_io = require('../src/firebase_io.js');
var firebase = require('firebase');
var $ = require('jquery-deferred');
var fs = require('fs');
var converter = require('../src/hsm_to_rules.js');
var test_utils = require("../test/test_utils.js");

/**********************************************************************************************************************
 * INITIAL RULES
 *********************************************************************************************************************
 * Send the hand crafted rules to Firebase, important this occurs first to setup test suite with the rules we want to test
 */

exports.testWriteSendXRulesValid = function(test){
    //load rules as hsm file
    var hsm_def = fs.readFileSync("./models/auction.hsm", "utf8");

    try{
        //convert into normal rules
        $.when(converter.convert_async(hsm_def)).then(function(rules){
            fs.writeFileSync("./models/auction.rules", rules);

            $.when(firebase_io.setValidationRules(rules))
                .then(function(){
                    test.ok(true, "these rules should have been accepted");
                    test.done();
                },function(error){ //deferred error handler should not be called
                    test.ok(false, "these rules should not have been rejected");
                    test.done();
                });
        });
    }catch(e){
        console.log(e);
        console.log(e.stack);
    }


};

/**********************************************************************************************************************
* INITIAL DATA
*********************************************************************************************************************/

/*Just initialises the structure of the database
* database has a single table actions
* */
exports.testAdminWrite1 = function(test){
    $.when(test_utils.assert_admin_can_write("/",
        {"auctions":true}, test)).then(test.done); //todo empty actions
};

/**
 * You should not be able to initialize an action without being the seller
 * @param test
 */
exports.testInitializationWrongSeller = function(test){
    $.when(test_utils.assert_cant_write("eric", "/auctions/1",
        {
            name:"car",
            seller:"joe",
            modified:firebase.ServerValue.TIMESTAMP,
            state:"SELLING",
            signal:"sell"
        }, test)).then(test.done);
};

/**
 * You should be able to initialize an action if the seller with the correct timestamp
 * @param test
 */
exports.testInitializationWithEffect = function(test){
    $.when(test_utils.assert_can_write("eric", "/auctions/1",
        {
            name:"car",
            seller:"eric",
            modified:firebase.ServerValue.TIMESTAMP,
            state:"SELLING",
            signal:"SELL"
        }, test)).then(test.done);
};


/*Clear database
 * */
exports.testAdminWrite2 = function(test){
    $.when(test_utils.assert_admin_can_write("/",
        {"auctions":true}, test)).then(test.done); //todo empty actions
};


/**
 * You should be not be able to call the parametrized version of Sell if you omit the parameter instantiation
 * @param test
 */
exports.testInitializationFailWithExecute = function(test){
    $.when(test_utils.assert_cant_write("eric", "/auctions/1",
        {
            name:"car",
            seller:"eric",
            modified:firebase.ServerValue.TIMESTAMP,
            state:"SELLING",
            signal:"SELL(item_name)"
        }, test)).then(test.done);
};

/**
 * You should be able to call the parametrized version of Sell if you include the parameter instantiation
 * @param test
 */
exports.testInitializationWithExecute = function(test){
    $.when(test_utils.assert_can_write("eric", "/auctions/1",
        {
            name:"car",
            seller:"eric",
            modified:firebase.ServerValue.TIMESTAMP,
            state:"SELLING",
            signal:"SELL(item_name)",
            item_name:"car"
        }, test)).then(test.done);
};

/*Clear database
 * */
exports.testAdminWrite3 = function(test){
    $.when(test_utils.assert_admin_can_write("/",
        {"auctions":true}, test)).then(test.done); //todo empty actions
};