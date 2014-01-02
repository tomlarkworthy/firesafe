/**
 * Test suite for hand-written validation rules for safe sending of an item from a sender to a receiver user
 *
 * We do a normal trade flow, with attacks a we go, and store the firebase into certain checkpoints
 * We then roll back to the state at the checkpoints to investigate alternative execution orders
 */


//the important strictly ordered stages in executing a trade
var IDLE_IDLE_checkpoint,
    TX_IDLE_checkpoint,
    TX_RX_checkpoint,
    ACK_TX_RX_checkpoint,
    ACK_TX_ACK_RX_checkpoint; //after double ack either party should be able to update their inventory, so ordering back to IDLE is indeterminate



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
    var rules = fs.readFileSync("./models/send_item.rules", "utf8");

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
exports.testInitializationInvalidFail = function(test){
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
 * You can't initialize twice
 * @param test
 */
exports.testReInitializationFail = function(test){
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
exports.testIDLE_IDLE_checkpoint = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');
    $.when(IDLE_IDLE_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

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
            tx:"XXX",//don't own!
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
            tx:"GOLD",
            tx_loc:"receiver"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * SENDER IS READY TO SEND
 *********************************************************************************************************************/
exports.testTX_IDLE_checkpoint = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');
    $.when(TX_IDLE_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

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
 * Test a correctly formed ack_rx transition doesn't work before a receive
 * @param test
 */
exports.testAckRXOutOfOrderFail = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/receiver",
        {
            state:"ACK_RX",
            rx:"GOLD",
            rx_loc:"sender"
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
exports.testTX_RX_checkpoint = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');
    $.when(TX_RX_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

/**
 * Test a empty ack_rx fails
 * (note "It's not a bug. Validate rules are only run for non-empty data new data."
 * Andrew Lee (Firebase Developer)
 * https://groups.google.com/forum/#!topic/firebase-talk/TbCK_zHyghg)
 * @param test
 */
exports.testAckRXEmptyFail = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/receiver",
        {
        }, test)).then(test.done);
};

/**
 * Test a incomplete formed ack_rx transition fails
 * @param test
 */
exports.testAckRXIncompleteFail = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/receiver",
        {
            state:"ACK_RX",
            rx:"GOLD"
        }, test)).then(test.done);
};

/**
 * Test a correctly formed ack_rx can't be spoofed by receiver
 * @param test
 */
exports.testAckRXWrongUserFail = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"ACK_RX",
            rx:"GOLD",
            rx_loc:"sender"
        }, test)).then(test.done);
};


/**
 * Test a correctly formed ack_rx transition doesn't work before RX ACK
 * @param test
 */
exports.testAckTXOutOfOrderFail = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/sender",
        {
            state:"ACK_TX",
            item:null,
            tx:"GOLD",
            tx_loc:"receiver"
        }, test)).then(test.done);
};

/**
 * Test a correctly formed ack_rx transition works
 * @param test
 */
exports.testAckRXTransition = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("sender", "/users/receiver",
        {
            state:"ACK_RX",
            rx:"GOLD",
            rx_loc:"sender"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * SENDER has ACK on receiver's data, next step if for receiver to ACK
 *********************************************************************************************************************/
exports.testACK_TX_RX_checkpoint = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');
    $.when(ACK_TX_RX_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

/**
 * Test we cant commit the Tx early
 * @param test
 */
exports.testCommitTxOutOfOrderFail = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"IDLE" //we have sent all our stuff
        }, test)).then(test.done);
};

/**
 * Test we cant commit the Rx early
 * @param test
 */
exports.testCommitRxOutOfOrderFail = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"IDLE",
            item:"GOLD"
        }, test)).then(test.done);
};

/**
 * Test a correctly formed ack_rx transition works
 * @param test
 */
exports.testAckTXTransition = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("receiver", "/users/sender",
        {
            state:"ACK_TX",
            item:null,
            tx:"GOLD",
            tx_loc:"receiver"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * RECEIVER has ACK on sender's data, transaction is complete! Now each can go to the IDLE state after receiving goods
 *********************************************************************************************************************/
exports.testACK_TX_ACK_RX_checkpoint = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');
    $.when(ACK_TX_ACK_RX_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

/**
 * Test we can now null the senders inventory, the trade is complete for the sender
 * @param test
 */
exports.testCommitTxTransition = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("sender", "/users/sender",
        {
            state:"IDLE" //we have sent all our stuff
        }, test)).then(test.done);
};

/**
 * Test we can now add the item to the receiver's inventory, the trade is complete for the receiver
 * @param test
 */
exports.testCommitRxTransition = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("receiver", "/users/receiver",
        {
            state:"IDLE",
            item:"GOLD"
        }, test)).then(test.done);
};


/**********************************************************************************************************************
 * Normal Trade complete!
 *********************************************************************************************************************/

/**
 * double check the receiver has the gold and the sender doesn't
 * @param test
 */
exports.testTradeComplete0 = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_read("receiver", "/users",
        {
            sender:{
                state:"IDLE"
            },
            receiver:{
                state:"IDLE",
                item:"GOLD"
            }
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * Alternative ending, lets check the trade is completed with the different users doing the final transactions
 *********************************************************************************************************************/
exports.testRestoreAlternativeEnding1Checkpoint = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.rollback(ACK_TX_ACK_RX_checkpoint, test)).then(test.done);
};


/**
 * Test the Tx can be committed by the receiver instead of the sender
 * @param test
 */
exports.testCommitTxTransition1 = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("receiver", "/users/sender",
        {
            state:"IDLE" //we have sent all our stuff
        }, test)).then(test.done);
};


/**
 * Test the Rx can commit by the sender instead of the receiver
 * @param test
 */
exports.testCommitRxTransition1 = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_write("sender", "/users/receiver",
        {
            state:"IDLE",
            item:"GOLD"
        }, test)).then(test.done);
};

/**
 * double check the receiver has the gold and the sender doesn't
 * @param test
 */
exports.testTradeComplete1 = function(test){
    var test_utils  = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_can_read("receiver", "/users",
        {
            sender:{
                state:"IDLE"
            },
            receiver:{
                state:"IDLE",
                item:"GOLD"
            }
        }, test)).then(test.done);
};