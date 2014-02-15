/**
 * Test suite for hand-written validation rules for safe sending of an item from a sender to a receiver user
 *
 * We do a normal trade flow, with attacks a we go, and store the firebase into certain checkpoints
 * We then roll back to the state at the checkpoints to investigate alternative execution orders
 */


var firebase_io = require('../src/firebase_io.js');
var test_utils = require("../test/test_utils.js");
var $ = require('jquery-deferred');
var fs = require('fs');

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
    //load rules as hsm file
    var hsm_def = fs.readFileSync("./models/send_item.hsm", "utf8");

    //convert into normal rules
    var converter = require('../src/hsm_to_rules.js');
    var rules = converter.convert(hsm_def);

    $.when(firebase_io.setValidationRules(rules))
        .then(function(){

            fs.writeFileSync("./models/send_item.rules", rules);

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
    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"IDLE"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * BOTH PLAYERS ARE INITIALIZED
 *********************************************************************************************************************/
exports.testIDLE_IDLE_checkpoint = function(test){
    $.when(IDLE_IDLE_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

/**
 * Tests the sender can't miss important information when sending
 * @param test
 */
exports.testSendIncompleteFail = function(test){
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
    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"TX",
            item:null,
            tx_itm:"XXX",//don't own!
            tx_ptr:"receiver"
        }, test)).then(test.done);
};

/**
 * Test the sender can't try and backup an item they do not own
 * @param test
 */
exports.testSendWrongAddressFail = function(test){
    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"TX",
            item:null,
            tx_itm:"GOLD",
            tx_ptr:"fsdfs" //not a user!
        }, test)).then(test.done);
};

/**
 * Test a correctly formed rx transition doesn't work before the sender is ready
 * @param test
 */
exports.testReceiveOutOfOrderFail = function(test){
    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx_itm:"GOLD",
            rx_ptr:"sender"
        }, test)).then(test.done);
};


/**
 * Test a correctly formed sender transition cannot be transitioned by an incorrect user
 * @param test
 */
exports.testSendWrongUserFail = function(test){
    $.when(test_utils.assert_cant_write("receiver", "/users/sender", //wrong user
        {
            state:"TX",
            item:null,
            tx_itm:"GOLD",
            tx_ptr:"receiver"
        }, test)).then(test.done);
};

/**
 * Test user can't sneak an object in during transition to TX
 * @param test
 */
exports.testSendInsertItemFail = function(test){
    $.when(test_utils.assert_cant_write("sender", "/users/sender",
        {
            state:"TX",
            item:"GOLD",
            tx_itm:"GOLD",
            tx_ptr:"receiver"
        }, test)).then(test.done);
};

/**
 * Test a correctly formed sender transition works
 * @param test
 */
exports.testSendTransition = function(test){
    $.when(test_utils.assert_can_write("sender", "/users/sender",
        {
            state:"TX",
            item:null,
            tx_itm:"GOLD",
            tx_ptr:"receiver"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * SENDER IS READY TO SEND
 *********************************************************************************************************************/
exports.testTX_IDLE_checkpoint = function(test){
    $.when(TX_IDLE_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

/**
 * Test an object substitution fails on RX
 * @param test
 */
exports.testReceiveCheatFail = function(test){
    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx_itm:"XXX", //wrong!
            rx_ptr:"sender"
        }, test)).then(test.done);
};

/**
 * Test an object substitution fails on RX
 * @param test
 */
exports.testReceivePaddingRxFail = function(test){
    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx_itm:"GOLD",
            rx_ptr:"sender",
            tx_ptr:"sender" //extra info
        }, test)).then(test.done);
};

/**
 * Test an object substitution fails on RX
 * @param test
 */
exports.testReceivePaddingItemFail = function(test){
    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx_itm:"GOLD",
            rx_ptr:"sender",
            item:"GOLD" //extra info
        }, test)).then(test.done);
};

/**
 * Test a correctly formed ack_rx transition doesn't work before a receive
 * @param test
 */
exports.testAckRXOutOfOrderFail = function(test){
    $.when(test_utils.assert_cant_write("sender", "/users/receiver",
        {
            state:"ACK_RX",
            rx_itm:"GOLD",
            rx_ptr:"sender"
        }, test)).then(test.done);
};

/**
 * Test a user can't sneak it an alteration to tx while Rxing
 * @param test
 */

/* TODO: broken, need to fix lock code
exports.testReceiveInsertTxFail = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx_itm:"GOLD",
            tx_itm:"GOLD",
            rx_ptr:"sender"
        }, test)).then(test.done);
};*/

/**
 * Test a correctly formed rx transition works
 * @param test
 */
exports.testReceiveTransition = function(test){
    $.when(test_utils.assert_can_write("receiver", "/users/receiver",
        {
            state:"RX",
            rx_itm:"GOLD",
            rx_ptr:"sender"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * RECEIVER IS READY TO RECEIVE
 *********************************************************************************************************************/
exports.testTX_RX_checkpoint = function(test){
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
    $.when(test_utils.assert_cant_write("sender", "/users/receiver",
        {
        }, test)).then(test.done);
};

/**
 * Test a incomplete formed ack_rx transition fails
 * @param test
 */
exports.testAckRXIncompleteFail = function(test){
    $.when(test_utils.assert_cant_write("sender", "/users/receiver",
        {
            state:"ACK_RX",
            rx_itm:"GOLD"
        }, test)).then(test.done);
};

/**
 * Test a correctly formed ack_rx can't be spoofed by receiver
 * @param test
 */
exports.testAckRXWrongUserFail = function(test){
    $.when(test_utils.assert_cant_write("receiver", "/users/receiver",
        {
            state:"ACK_RX",
            rx_itm:"GOLD",
            rx_ptr:"sender"
        }, test)).then(test.done);
};


/**
 * Test a correctly formed ack_rx transition doesn't work before RX ACK
 * @param test
 */
exports.testAckTXOutOfOrderFail = function(test){
    $.when(test_utils.assert_cant_write("receiver", "/users/sender",
        {
            state:"ACK_TX",
            item:null,
            tx_itm:"GOLD",
            tx_ptr:"receiver"
        }, test)).then(test.done);
};

/**
 * Test a correctly formed ack_rx transition works
 * @param test
 */
exports.testAckRXTransition = function(test){
    $.when(test_utils.assert_can_write("sender", "/users/receiver",
        {
            state:"ACK_RX",
            rx_itm:"GOLD",
            rx_ptr:"sender"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * SENDER has ACK on receiver's data, next step if for receiver to ACK
 *********************************************************************************************************************/
exports.testACK_TX_RX_checkpoint = function(test){
    $.when(ACK_TX_RX_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

/**
 * Test we cant commit the Tx early
 * @param test
 */
exports.testCommitTxOutOfOrderFail = function(test){
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
    $.when(test_utils.assert_can_write("receiver", "/users/sender",
        {
            state:"ACK_TX",
            item:null,
            tx_itm:"GOLD",
            tx_ptr:"receiver"
        }, test)).then(test.done);
};

/**********************************************************************************************************************
 * RECEIVER has ACK on sender's data, transaction is complete! Now each can go to the IDLE state after receiving goods
 *********************************************************************************************************************/
exports.testACK_TX_ACK_RX_checkpoint = function(test){
    $.when(ACK_TX_ACK_RX_checkpoint = test_utils.checkpoint(test)).then(function(){
        test.done();
    });
};

/**
 * Test we can now null the senders inventory, the trade is complete for the sender
 * @param test
 */
exports.testCommitTxTransition = function(test){
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
    $.when(test_utils.rollback(ACK_TX_ACK_RX_checkpoint, test)).then(test.done);
};


/**
 * Test the Tx can be committed by the receiver instead of the sender
 * @param test
 */
exports.testCommitTxTransition1 = function(test){
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