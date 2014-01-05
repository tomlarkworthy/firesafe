/**
 *This test uses the same HSM topology described in "Practical UML statecharts in C/C++", by Miro Samek, to create
 * a test case that has every class of interesting transition in a HSM.
 *
 * We are not the only people to notice the value in this topology as a test case. We are reuseing the test case
 * developed by David Durman in his "statechart" library which also replicates the very same topology.
 *
 * Thus we can use David's state machine as a controller for testing our implementation of the topology.
 */

Statechart = require('../lib/statechart');
_ = require('underscore');



/**
 * Samek exhaustive case machine taken out of David Durman's repository
 * statechart
 * @type {*}
 */
var machine = _.extend({
    // slots
    myFoo: false,

    // machine
    initialState: "S0",

    states: {
        S0: {
            init: "S1",
            "E": { target: "S211" },
            states: {
                S1: {
                    init: "S11",
                    "A": { target: "S1"   },
                    "B": { target: "S11"  },
                    "C": { target: "S2"   },
                    "D": { target: "S0"   },
                    "F": { target: "S211" },
                    states: {
                        S11: {
                            "G": { target: "S211" },
                            "H": {
                                guard: function() { return this.myFoo; },
                                action: function() { this.myFoo = false; }
                            }
                        }
                    }
                },
                S2: {
                    init: "S21",
                    "C": { target: "S1"  },
                    "F": { target: "S11" },
                    states: {
                        S21: {
                            init: "S211",
                            "B": { target: "S211" },
                            "H": {
                                guard: function() { return !this.myFoo; },
                                action: function() { this.myFoo = true; },
                                target: "S21"
                            },
                            states: {
                                S211: {
                                    "D": { target: "S21" },
                                    "G": { target: "S0"  }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

}, Statechart);


/**
 * Load our version of this statemachine into Firebase
 */
exports.testLoadConvertedHSM = function(test){
    var converter = require('../src/hsm_to_rules.js');
    var $ = require('jquery-deferred');
    var fs = require('fs');
    var firebase_io = require('../src/firebase_io.js');

    //load hsm rules from file
    var hsm_def = fs.readFileSync("./models/exhaustive.hsm", "utf8");

    //transform hsm into rules
    try {
        var rules = converter.convert(hsm_def);
        console.log("\n", rules);
        test.ok(true, "rules did not convert ok");

        //upload to server
        $.when(firebase_io.setValidationRules(rules)).then(function(){
            test.ok(true, "rules did not upload");
            test.done()
        },function(error){
            test.ok(false, "rules did not upload");
            test.done()
        });

    }catch(e){
        console.log("\n", e.message);
        console.log("\n", e.stack);
        test.ok(false, "should not have errors");
        test.done()
    }
};



/**
 * clear database
 */
exports.testAdminWrite = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    $.when(test_utils.assert_admin_can_write("/",{}, test)).then(test.done);
};

/**
 * test initial condition goes in according to spec
 * @param test
 */
exports.testInitialize = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    //use HSM from statechart to determine first state
    var test_machine = _.clone(machine);
    test_machine.run();
    var initial_state = test_machine.myState.name;

    console.log("\ninitial_state=", initial_state);
    $.when(test_utils.assert_can_write("anybody", "/",{
        state:initial_state,
        foo:false
    }, test)).then(test.done);
};

/**
 * tests all outgoing states from S11 match implementation
 * @param test
 */
exports.testS11FooFalseTransition = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    var signals = ["A", "B", "C", "D", "E", "F", "G", "H"];
    var valids  = [true,true,true,true,true,true,true,false];

    var test_tail = $.Deferred().resolve();

    for(var signal_id in signals){
        var signal = signals[signal_id];
        var valid = valids[signal_id];

        //machine starts in S11
        var test_machine = _.clone(machine); test_machine.run();
        test_machine.dispatch(signal);//see what happens next
        var end_state = test_machine.myState.name;

        //we chain our test functions to they run in serial
        test_tail = test_tail.then(getTransitionTestFun(
            {
                state:"S11",
                foo:false
            },{
                state:end_state,
                foo:false,
                signal: signal
            },valid,
            "\ntest S11 -> signal: " + signal + " state: " + test_machine.myState.name + " foo: " + test_machine.myFoo,
            test
        ));
    }
    //finally the test is over once all tests have run
    test_tail.then(test.done);
};

/**
 * tests all outgoing states from S11 match implementation
 * @param test
 */
exports.testS211FooFalseTransition = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    var signals = ["A", "B", "C", "D", "E", "F", "G", "H"];
    var valids   = [false,true,true,true,true,true,true,true];

    var test_tail = $.Deferred().resolve();

    for(var signal_id in signals){
        var signal = signals[signal_id];
        var valid  = valids[signal_id];

        //machine starts in S11
        var test_machine = _.clone(machine); test_machine.run();
        test_machine.dispatch("C"); //goes to state S211
        test_machine.dispatch(signal);//see what happens next

        //we chain our test functions to they run in serial
        test_tail = test_tail.then(getTransitionTestFun(
            {
                state:"S211",
                foo:false
            },{
                state:test_machine.myState.name,
                foo:test_machine.myFoo,
                signal: signal
            },
            valid,
            "\ntest S211 -> signal: " + signal + " state: " + test_machine.myState.name + " foo: " + test_machine.myFoo
            ,test
        ));
    }
    //finally the test is over once all tests have run
    test_tail.then(test.done);
};

/**
 * tests all outgoing states from S11 with foo true match implementation
 * @param test
 */
exports.testS211FooTrueTransition = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    var signals = ["A", "B", "C", "D", "E", "F", "G", "H"];
    var valids   = [false,true,true,true,true,true,true,false];

    var test_tail = $.Deferred().resolve();

    for(var signal_id in signals){
        var signal = signals[signal_id];
        var valid  = valids[signal_id];

        //machine starts in S11
        var test_machine = _.clone(machine); test_machine.run();
        test_machine.dispatch("C"); //goes to state S211
        test_machine.dispatch("H"); //goes to state S211, foo == true
        test_machine.dispatch(signal);//see what happens next

        //we chain our test functions to they run in serial
        test_tail = test_tail.then(getTransitionTestFun(
            {
                state:"S211",
                foo:true
            },{
                state:test_machine.myState.name,
                foo:test_machine.myFoo,
                signal: signal
            },
            valid,
            "\ntest S211 -> signal: " + signal + " state: " + test_machine.myState.name + " foo: " + test_machine.myFoo
            ,test
        ));
    }
    //finally the test is over once all tests have run
    test_tail.then(test.done);
};

/**
 * tests all outgoing states from S11 with foo true match implementation
 * @param test
 */
exports.testS11FooTrueTransition = function(test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    var signals = ["A", "B", "C", "D", "E", "F", "G", "H"];
    var valids   = [true,true,true,true,true,true,true,true];

    var test_tail = $.Deferred().resolve();

    for(var signal_id in signals){
        var signal = signals[signal_id];
        var valid  = valids[signal_id];

        //machine starts in S11
        var test_machine = _.clone(machine); test_machine.run();
        test_machine.dispatch("C"); //goes to state S211
        test_machine.dispatch("H"); //goes to state S211, foo == true
        test_machine.dispatch("C"); //goes to state S11,  foo == true
        test.ok(test_machine.myFoo, "foo should be true");
        test.ok(test_machine.myState.name==="S11", "state should be S11");
        test_machine.dispatch(signal);//see what happens next

        //we chain our test functions to they run in serial
        test_tail = test_tail.then(getTransitionTestFun(
            {
                state:"S11",
                foo:true
            },{
                state:test_machine.myState.name,
                foo:test_machine.myFoo,
                signal: signal
            },
            valid,
            "\ntest S11 -> signal: " + signal + " state: " + test_machine.myState.name + " foo: " + test_machine.myFoo
            ,test
        ));
    }
    //finally the test is over once all tests have run
    test_tail.then(test.done);
};


/**
 * creates a function, that tests from the initial state, can you get to the end_state?
 * the valid parameter sets whether permission shoudl be allowed or not
 * a msg field allow you to decide to debug message anything
 * the function returned works of deferred, so you can chain it in "then"s
 */
var getTransitionTestFun = function(init_state, end_state, valid, msg, test){
    var test_utils = require("../test/test_utils.js");
    var $ = require('jquery-deferred');

    return function(){
        var test_case = $.Deferred();
        $.when(test_utils.assert_admin_can_write("/",
            init_state, test)).then(function(){
                console.log(msg);
                if(valid){
                    $.when(test_utils.assert_can_write("anybody", "/",
                        end_state, test)).then(function(){
                            test_case.resolve();
                        });
                }else{
                    $.when(test_utils.assert_cant_write("anybody", "/",
                        end_state, test)).then(function(){
                            test_case.resolve();
                        });
                }

            });
        return test_case;
    }
};



