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
 * test we can pull the Samek machine out of David Durman's repository
 * @param test
 */
exports.testLoadSamek = function(test){
    var test_machine = _.clone(machine);
    test_machine.run();

    console.log("\n", test_machine.myState.name);
    test_machine.dispatch("G");
    console.log("\n", test_machine.myState.name);


    console.log("\n", test_machine.myState.name);
    test.ok(false);

    test.done()
};