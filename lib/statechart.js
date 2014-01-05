// Copyright (c) 2010 David Durman
//
// The contents of this file are subject to the MIT License (the "License");
// you may not use this file except in compliance with the License. You may obtain a copy of the License at
// http://opensource.org/licenses/MIT.
//
// This hierarchical state machine implementation has been inspired
// by the QP active object framework, see http://www.state-machine.com/


(function(root, factory) {

    if (typeof exports === 'object') {
        
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
        
    } else if (typeof define === 'function' && define.amd) {
        
        // AMD. Register as an anonymous module.
        define(factory);
        
    } else {
        
        // Browser globals (root is window)
        root.Statechart = factory();
    }

}(this, function() {
    
    "use strict";

    var assert = function(assertion){
        if (!assertion)
            throw new Error("Assertion failed.");
    };


    // Statechart.
    // -----------
    
    // `myState` - the current state
    // `mySource` - the source of the current transition
    
    var Statechart = {
        
        run: function(opt){

            opt = opt || {};
            
            this.debug = opt.debug ? opt.debug : function() {};
            
	    this.construct(this.initialState);
	    this.init(null);
        },
        
        construct: function(initialState){
	    this.myState = this.top();
	    this.mySource = this.state("Initial");

            // Initial pseudo-state
	    this.states.Initial = {
	        empty: function(){
		    this.newInitialState(initialState);
	        }
	    };
	    var handled = function(){ return null; };
            // TOP state
	    this.states.TOP = {
	        entry: handled,
	        exit:  handled,
	        init:  handled,
	        empty: handled
	    };
	    this.flatten();
        },

        // Trigger the initial transition and recursively enter the submachine of the top state.
        // Must be called only once for a given Statechart before dispatching any events to it.
        init: function(anEventOrNull){
	    assert(this.myState === this.top() && this.mySource != null);
	    var s = this.myState;	// save top in temp
	    this.mySource.trigger(anEventOrNull);	// topmost initial transition
	    assert(s.equals(this.myState.superstate()));	// verify that we only went one level deep
	    s = this.myState;
	    s.enter();
	    while (s.init() === null){	// while init is handled (i.e. till we reach a leaf node)
	        assert(s.equals(this.myState.superstate()));	// verify that we only went one level deep
	        s = this.myState;
	        s.enter();
	    }
        },
        
        state: function(stateOrName){
	    return (stateOrName && stateOrName instanceof QState)
	        ? stateOrName
	        : new QState(this, stateOrName);
        },
        top: function(stateOrName){
            // create the top state only once and store it to an auxiliary property
            return (this._topState || (this._topState = new QState(this, "TOP")));
        },
        currentState: function(){
	    return this.myState;
        },
        flatten: function(){
	    this.statesTable = this.statesTable || {};
	    this._flatten(this.states, this.top().name);
        },
        _flatten: function(states, parent){
	    if (!states) return;
	    for (var state in states){
	        if (!states.hasOwnProperty(state)) continue;
	        this.statesTable[state] = states[state];
                this.statesTable[state].parent = parent;
	        this._flatten(states[state].states, state);
	    }
        },
        selectState: function(stateName){
	    return this.statesTable[stateName];
        },
        dispatchEvent: function(anEvent, state, act){
	    act = act || state[anEvent.type];

            // Action might also be an array in which case it is assumed that evaluating guards decides
            // which target to enter.
            if (act instanceof Array) {
                for (var i = 0; i < act.length; i++) {
                    this.dispatchEvent(anEvent, state, act[i]);
                }
            }
            
            // @todo This is terrible edge case used just for more fancy Statechart representation
            // It allows using "MyState": { init: "MySubState", ... } intead of
            // "MyState": { init: function(){ this.newInitialState("MySubState"); }, ... }
            // In some cases the latter form can be useful for better control of the Statechart
            if (anEvent.type == "init" && typeof act == "string"){
                this.newInitialState(act);
                return null; // handled
            }

	    if (act instanceof Function){
	        act.call(this, anEvent.args);
	        return null;  // handled
	    } else if (act) {
                // no guard at all or the guard condition is met
	        if (!act.guard || (act.guard && act.guard.call(this, anEvent.args))){
		    if (act.action) act.action.call(this, anEvent.args);
		    if (act.target) this.newState(act.target);
		    return null;  // handled
	        }
	    } else {        // act is undefined (no handler in state for anEvent)
                if (state === this.selectState("TOP")){
                    this.handleUnhandledEvent(anEvent); // not-handled
                    return null;    // handled (TOP state handles all events)
                }
            }
            return this.state(state.parent); // not-handled
        },

        // Override this when needed.
        handleUnhandledEvent: function(anEvent){
            this.debug("Unhandled event: " + anEvent.type);
	    return null;
        },
        
        // Traverse the state hierarchy starting from the currently active state myState.
        // Advance up the state hierarchy (i.e., from substates to superstates), invoking all
        // the state handlers in succession. At each level of state nesting, it intercepts the value
        // returned from a state handler to obtain the superstate needed to advance to the next level.
        dispatch: function(anEvent, args){
	    if (!anEvent || !(anEvent instanceof QEvent))
	        anEvent = new QEvent(anEvent, args);
	    this.mySource = this.myState;
	    while (this.mySource)
	        this.mySource = this.mySource.trigger(anEvent);
        },
        
        // Performs dynamic transition. (macro Q_TRAN_DYN())
        newState: function(aStateName){
	    this.transition(this.state(aStateName));
        },
        
        // Used by handlers only in response to the #init event. (macro Q_INIT())
        // USAGE: return this.newInitialState("whatever");
        // @return null for convenience

        newInitialState: function(aStateOrName){
	    this.myState = this.state(aStateOrName);
	    return null;
        },
        
        // Dynamic transition. (Q_TRAN_DYN())
        transition: function(target){
            
	    assert(!target.equals(this.top()));
            
	    var entry = [];
	    var mySource = this.mySource;
            var s = this.myState;

	    // exit all the nested states between myState and mySource
	    while (!s.equals(mySource)){
	        assert(s != null);
	        s = s.exit() || s.superstate();
	    }

	    // check all seven possible source/target state combinations
	    entry[entry.length] = target;

	    // (a) mySource == target (self transition)
	    if (mySource.equals(target)){
	        mySource.exit();
	        return this.enterVia(target, entry);
	    }

	    // (b) mySource == target.superstate (one level deep)
	    var p = target.superstate();
	    if (mySource.equals(p))
	        return this.enterVia(target, entry);

	    assert(mySource != null);

	    // (c) mySource.superstate == target.superstate (most common - fsa)
	    var q = mySource.superstate();
	    if (q.equals(p)){
	        mySource.exit();
	        return this.enterVia(target, entry);
	    }

	    // (d) mySource.superstate == target (one level up)
	    if (q.equals(target)){
	        mySource.exit();
	        entry.pop();	// do not enter the LCA
	        return this.enterVia(target, entry);
	    }

	    // (e) mySource == target.superstate.superstate... hierarchy (many levels deep)
	    entry[entry.length] = p;
	    s = p.superstate();
	    while (s !== null){
	        if (mySource.equals(s))
		    return this.enterVia(target, entry);
	        entry[entry.length] = s;
	        s = s.superstate();
	    }

	    // otherwise we're definitely exiting mySource
	    mySource.exit();

	    // entry array is complete, save its length to avoid computing it repeatedly
	    var entryLength = entry.length;

	    // (f) mySource.superstate == target.superstate.superstate... hierarchy
	    var lca;
	    for (lca = entryLength - 1; lca > 0; lca--){
	        if (q.equals(entry[lca])){
		    return this.enterVia(target, entry.slice(0, lca)); // do not enter lca
	        }
	    }

	    // (g) each mySource.superstate.superstate... for each target.superstate.superstate...
	    s = q;
	    while (s !== null){
	        for (lca = entryLength - 1; lca > 0; lca--){
		    if (s.equals(entry[lca])){
		        return this.enterVia(target, entry.slice(0, lca - 1)); // do not enter lca
		    }
	        }
	        s.exit();
	        s = s.superstate();
	    }
        },
        
        // tail of transition()
        // We are in the LCA of mySource and target.
        enterVia: function(target, entry){
	    // retrace the entry path in reverse order
	    var idx = entry.length;
	    while (idx--) entry[idx].enter();

	    this.myState = target;
	    while (target.init() == null){
	        // initial transition must go one level deep
	        assert(target.equals(this.myState.superstate()));
	        target = this.myState;
	        target.enter();
	    }
        }
    };

    // QState.
    // -------
    
    function QState(fsm, name){
        this.fsm = fsm;
        this.name = name;
    }

    QState.prototype = {
        equals: function(state){
	    return (this.name === state.name && this.fsm === state.fsm);
        },
        dispatchEvent: function(anEvent, state){
	    return this.fsm.dispatchEvent(anEvent, state);
        },
        trigger: function(anEvent){
	    var evt = anEvent || QEventEmpty;
	    var state = this.fsm.selectState(this.name);
	    return this.dispatchEvent(evt, state);
        },
        enter: function(){
            this.fsm.debug("[" + this.name + "] enter");
	    return this.trigger(QEventEntry);
        },
        exit: function(){
            this.fsm.debug("[" + this.name + "] exit");
	    return this.trigger(QEventExit);
        },
        init: function(){
            this.fsm.debug("[" + this.name + "] init");
	    return this.trigger(QEventInit);
        },
        
        // Answer my superstate. Default is to return fsm top state.
        superstate: function(){
	    var superstate = this.trigger(QEventEmpty);
	    if (superstate && superstate instanceof QState)
	        return superstate;
	    superstate = this.fsm.top();
	    if (this.name === superstate.name)
	        return null;
	    return superstate;
        }
    };

    // QEvent
    // ------

    function QEvent(type, args){
        this.type = type;
        this.args = args;
    }

    // these events are static, they do not carry any arguments
    // -> create them only once
    // moreover, they don't have to be exposed to the outer world
    var QEventEntry = new QEvent("entry");
    var QEventExit = new QEvent("exit");
    var QEventInit = new QEvent("init");
    var QEventEmpty = new QEvent("empty");

    
    return Statechart;

}));
