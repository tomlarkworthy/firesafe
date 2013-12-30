/**
 * Test suite for hand-written validation rules for safe sending of an item from a sender to a reciever user
 */

/**********************************************************************************************************************
 * INITIAL RULES
 *********************************************************************************************************************
 * Send the hand crafted rules to Firebase, important this occurs first to setup test suite with the rules we want to test
 */
exports.testWriteSendXRulesValid = function(test){
    var firebase_io = require('../src/firebase_io.js');
    var $ = require('jquery-deferred');
    var fs = require('fs');

    //load rules from file
    var rules = fs.readFileSync("./models/sent_x.rules", "utf8");

    $.when(firebase_io.setValidationRules(rules))
        .then(function(){
            test.ok(true, "these rules should have been accepted");
            test.done();
        },function(error){ //deferred error handler should not be called
            test.ok(false, "these rules should not have been rejected");
            test.done();
        });
};

/**********************************************************************************************************************
 * INITIAL DATA
 *********************************************************************************************************************/

/**
 * tests that admins ignore normal write rules, by creating two users, sender and receiver,
 * sender is setup ready to send
 * receiver is not setup and is there to test initialization
 * @param test
 */
exports.testAdminWrite = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_admin_can_write("/",
        {users:{
            sender:{
                state:"IDLE",
                item :"GOLD"
            },
            receiver :{

            }
        }}, test)).then(test.done);
};

/**********************************************************************************************************************
 * INITIALIZATION TESTS
 *********************************************************************************************************************/

/**
 * You should not be able to initialize the players file with anything other than an empty inventory
 * @param test
 */
exports.testIllegalInitializationRejection = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"IDLE",
            item :"GOLD"
        }, test)).then(test.done);
};

/**
 * You should able to initialize the a player if they don't have a state
 * @param test
 */
exports.testInitialization = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("receiver", "/users/receiver",
        {
            state:"IDLE"
        }, test)).then(test.done);
};

/**
 * You can't initialize an already initialized player
 * @param test
 */
exports.testReInitializationFailure = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"IDLE"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * BOTH PLAYERS ARE INITIALIZED
 *********************************************************************************************************************/

/**
 * Tests the sender can't miss important information when sending
 * @param test
 */
exports.testSendIncompleteFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"TX"
        }, test)).then(test.done);
};

/**
 * Test the sender can't try and send an item they do not own
 * @param test
 */
exports.testSendSwitchItemFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"TX",
            item:null,
            backup:"GOLD",
            tx:"XXX",//don't own!
            tx_loc:"receiver"
        }, test)).then(test.done);
};

/**
 * Test the sender can't try and backup an item they do not own
 * @param test
 */
exports.testSendSwitchBackupFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"TX",
            item:null,
            backup:"xxx", //don't own!
            tx:"GOLD",
            tx_loc:"receiver"
        }, test)).then(test.done);
};

/**
 * Test the sender can't try and backup an item they do not own
 * @param test
 */
exports.testSendWrongAddressFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"TX",
            item:null,
            backup:"GOLD",
            tx:"GOLD",
            tx_loc:"fsdfs" //not a user!
        }, test)).then(test.done);
};

/**
 * Test a correctly formed rx transition doesn't work before the sender is ready
 * @param test
 */
exports.testReceiveOutOfOrderFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx:"GOLD",
            rx_loc:"sender"
        }, test)).then(test.done);
};


/**
 * Test a correctly formed sender transition cannot be transitioned by an incorrect user
 * @param test
 */
exports.testSendWrongUserFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/sender", //wrong user
        {
            state:"TX",
            item:null,
            backup:"GOLD",
            tx:"GOLD",
            tx_loc:"receiver"
        }, test)).then(test.done);
};

/**
 * Test a correctly formed sender transition works
 * @param test
 */
exports.testSendTransition = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("sender", "/users/sender",
        {
            state:"TX",
            item:null,
            backup:"GOLD",
            tx:"GOLD",
            tx_loc:"receiver"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * SENDER IS READY TO SEND
 *********************************************************************************************************************/

/**
 * Test an object substitution fails on RX
 * @param test
 */
exports.testReceiveCheatFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx:"XXX", //wrong!
            rx_loc:"sender"
        }, test)).then(test.done);
};

/**
 * Test an object substitution fails on RX
 * @param test
 */
exports.testReceivePaddingRxFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx:"GOLD",
            rx_loc:"sender",
            tx_loc:"sender" //extra info
        }, test)).then(test.done);
};

/**
 * Test an object substitution fails on RX
 * @param test
 */
exports.testReceivePaddingItemFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx:"GOLD",
            rx_loc:"sender",
            item:"GOLD" //extra info
        }, test)).then(test.done);
};

/**
 * Test a correctly formed rx transition works
 * @param test
 */
exports.testReceiveTransition = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx:"GOLD",
            rx_loc:"sender"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * RECEIVER IS READY TO RECEIVE
 *********************************************************************************************************************/

/**
 * Test a correctly formed ack_rx transition works
 * @param test
 */
exports.testAckTransition = function(test){
    var test_utils  = require("../test/test_utils.js");
    var firebase_io = require("../src/firebase_io.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("sender", "/users/receiver",
        {
            state:"ACK_RX",
            ack:"sender",
            rx:"GOLD",
            rx_loc:"sender"
        }, test)).then(test.done);
};