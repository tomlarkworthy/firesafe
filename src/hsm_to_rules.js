/**
 *generator that takes the hsm json language, and outputs a set of validation rules enforcing the semantics
 */


/**
 * main method, reads at hsm block and returns a rule file (synchronous)
 * @param hsm
 */
exports.convert = function(hsm){
    var parser = require('./hsm_to_rules_parser.js');

    //strip comments
    hsm = hsm.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '');

    try{
        //convert into nested json structures, using grammar
        var top_block =  parser.parser.parse(hsm, "block");
    }catch(e){
        console.log(e);
        throw e;
    }

    //generate code
    var code = exports.top_block(top_block, "\n", []);

    //console.log(code);

    return code
};

//helpers
exports.is_string = function(x){
    return x.substring != undefined;
};

exports.replace_prefix = function(x, new_prefix){
    return x.replace(/\n\s*/gm, new_prefix);
};

exports.sortObject = function(o) {
    var sorted = {},
        key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
};



/**
 * top down generator root
 * @param hsm
 */
exports.top_block = function(top_block, prefix, types){
    //console.log("\n", "top_block");
    //console.log("\n", top_block);

    var result =
        prefix + '{' +
        prefix + '\t"rules":'+
        exports.block(top_block['val']['rules'], prefix + "\t", types) +
        prefix + '}';

    return result;

};

exports.block = function(block, prefix, types){
    //console.log("\n", "block");
    //console.log("\n", block);
    //console.log("\n", block["!type"]);

    if(block["!type"] === "OBJ"){
        var lines = [];

        var machine = null;

        if(block['val'][".states"]){
            machine = exports.new_machine();
            machine.process_states(block['val'][".states"], null);
        }

        if(block['val'][".variables"]){
            if(machine == null) machine = exports.new_machine();
            machine.process_variables(block['val'][".variables"])
        }

        if(block['val'][".transitions"]){
            if(machine == null) machine = exports.new_machine();
            machine.process_transitions(block['val'][".transitions"]);
        }

        if(block['val'][".roles"]){
            if(machine == null) machine = exports.new_machine();
            machine.process_roles(block['val'][".roles"])
        }

        for (var key in block['val']) {
            if(key === ".write" && machine){
                //ignore writes when in machine mode
                console.log("\n WARNING: .write ignored when declared in same layer as a state machine")
            }else if(key === ".states"){
            }else if(key === ".variables"){ //ignore all the machine special syntax
            }else if(key === ".transitions"){
            }else if(key === ".roles"){
            }else if(key === ".types"){
            }else{
                lines.push('"'+key +'"'+':' + exports.block(block['val'][key], prefix + "\t", types));
            }
        }

        if(machine){
            machine.flatten_transactions();
            lines.push('".write"'+':' + machine.gen_write(prefix + "\t"));
        }

        return "{"+prefix + "\t" + lines.join("," + prefix + "\t") + prefix + "}";

    }else if(block["!type"] === "STR"){
        return '"'+block.val+'"';
    }else if(block["!type"] === "BOOL"){
        return block.val;
    }else{
        console.log("\n **** UNRECOGNISED TOKEN ***", block["!type"])
    }

};

exports.new_machine = function(){
    var machine = {
        states:{}, //map from name -> {parent, init}
        transitions:{},
        variables:{},
        roles:{},
        signals:{},//all possible signals encountered
        initial:null
    };

    /**
     * sets up the state list recursively for the machine, and sets the initial state
     */
    machine.process_states = function(states_parse_obj, parent){
        //console.log("\nstates:", states_parse_obj);

        if(states_parse_obj.val[".init"]){
            var init = states_parse_obj.val[".init"].val;

            if(parent != null){
                machine.states[parent].init = init;
                machine.states[parent].leaf = false;
            }
        }else{
            var init = null;
        }

        for(var name in states_parse_obj.val){

            if(name == ".init"){
            }else{
                machine.states[name] = {parent:parent, leaf:true};
                machine.process_states(states_parse_obj.val[name], name)
            }
        }

        if(parent == null){
            //console.log("\nmachine.states:", machine.states);
        }
    };

    machine.process_variables = function(variables_parse_obj){
        //console.log("\nprocess_variables:", variables_parse_obj);
        for(var name in variables_parse_obj.val){
            machine.process_variable(name, variables_parse_obj.val[name].val);
        }
        //console.log("\nmachine.variables:", machine.variables);
    };

    machine.process_variable = function(name, properties){
        //console.log("\nprocess_variable:", name, properties);
        machine.variables[name] = {}
    };

    machine.process_transitions = function(transitions_parse_obj){
        //console.log("\nprocess_transitions:", transitions_parse_obj);
        for(var name in transitions_parse_obj.val){
            machine.process_transition(name, transitions_parse_obj.val[name].val);
        }
        //console.log("\ntransitions:", machine.transitions);
        machine.signals = exports.sortObject(machine.signals);
        //console.log("\signals:", machine.signals);
    };

    machine.process_transition = function(name, properties){
        //console.log("\nprocess_transition:", name, properties);
        var from, to, guard="", effect="";
        var transition = {};
        if(properties.from){
            transition.from = properties.from.val;
        }else{
            transition.from = null;
        }

        transition.to = properties.to.val;
        if(transition.role){
            transition.role = properties.role.val;
        }else{
            transition.role = null;
        }

        if(properties.signal){
            transition.signal = properties.signal.val;
        }else{
            transition.signal = null;
        }

        if(properties.guard){
            transition.guard = properties.guard.val
        }else{
            transition.guard = null
        }
        if(properties.effect){
            transition.effect = properties.effect.val
        }else{
            transition.effect = null
        }

        machine.signals[transition.signal] = {};
        machine.transitions[name] = transition;

        //console.log("\ntransition:", transition);
    };

    machine.process_roles = function(types_parse_obj){
        //console.log("\ntypes_parse_obj:", types_parse_obj);
        for(var name in types_parse_obj.val){
            machine.roles[name] = types_parse_obj.val[name].val;
        }
        //console.log("\nmachine.types:", machine.types);
    };

    /**
     * This replaces the hierarchical transitions with many explicit flat transformation
     *
     * For example is S is the parent of S1
     * and S has a transition "G" to S2, by the UML spec S1 also should also respond to "G"
     * The process of flattening makes explicit all the inheritance.
     * by creating all the transitions possible from leaf states
     */
    machine.flatten_transactions = function(){
        var flat_transitions = {};
        var uid = 0;

        //find init transitions
        for(var t_id in machine.transitions){
            var transition = machine.transitions[t_id];
            if(transition.from == null){ //its an init transition
                var target = machine.resolve_target(transition.to);
                flat_transitions[uid] = {
                    from:null,
                    to:target,
                    role:transition.role,
                    signal:transition.signal,
                    guard:transition.guard,
                    effect:transition.effect
                };
                uid += 1;
            }
        }

        for(var from in machine.states){
            if(machine.states[from].leaf){
                //we have ancestor transitions that are inherited by this leaf node
                for(var signal in machine.signals){
                    var transitions = machine.resolve_signals(signal, from);
                    for(t_id in transitions){
                        var transition = transitions[t_id];
                        var target = machine.resolve_target(transition.to);

                        flat_transitions[uid] = {
                            from:from,
                            to:target,
                            role:transition.role,
                            signal:signal,
                            guard:transition.guard,
                            effect:transition.effect
                        };
                        uid += 1;
                    }
                }
                //check for null signal too
                var transitions = machine.resolve_signals(null, from);
                for(t_id in transitions){
                    var transition = transitions[t_id];
                    var target = machine.resolve_target(transition.to);

                    flat_transitions[uid] = {
                        from:from,
                        to:target,
                        role:transition.role,
                        signal:null,
                        guard:transition.guard,
                        effect:transition.effect
                    };
                    uid += 1;
                }

            }
        }

        //console.log("\nflat_transitions", flat_transitions)
        machine.transitions = flat_transitions;
    };

    /**
     * calculates where a transition would end up, if starting and pointing to the specific location
     */
    machine.resolve_target = function(to){
        //exit's would fire at current state - from first in normal embedded
        //then the transition takes place to the high level destination
        var current = to;
        //we then recurse until reaching a leaf state
        while(machine.states[current].init){
            current = machine.states[current].init
        }

        return current;
    };

    /**
     * returns a set of transitions.
     * Finds the super transitions with the provided signal, leaving the provided state, (or one of it's ancestors)
     */
    machine.resolve_signals = function(signal, state){
        var matches = [];
        //console.log("\n resolve signal:", signal, "on:", state);
        var current = state;

        while(current != null){
            //look for transition leaving current with right signal
            for(var t_id in machine.transitions){
                if(machine.transitions[t_id].signal === signal && machine.transitions[t_id].from === current){
                    matches.push(machine.transitions[t_id]);
                }
            }

            if(matches.length > 0){
                return matches;
            }

            //no matches, so go up hierarchy
            current = machine.states[current].parent;
        }

        return [];
    };

    /**
     * a specific machine is encoded in a single ".write" clause in the validation rules
     * this encodes all the different transitions, and the initial condition
     * @param prefix
     */
    machine.gen_write = function(prefix){
        var clauses = [];

        for(var name in machine.transitions){
            var transition = machine.transitions[name];

            //first add a comment
            var clause = prefix + "\t( //" + name + ": " + transition.from + " -> " + transition.to + ", " + transition.role

            //add the authentication clause
            if(transition.role!= null){
                clause += prefix +  "\t\t/*role  */("+machine.roles[transition.role] +")";
            }else{
                clause += prefix +  "\t\t/*role  */(true)";
            }

            //then add the from state requirement (if any, could be initial state)
            if(transition.from!= null && transition.from != 'null'){
                clause += prefix + "\t\t/*from  */ && data.child('state').val() == '" + transition.from +"'";
            }else{
                clause += prefix + "\t\t/*from  */ && data.child('state').val() == null";
            }

            //then add the to state requirement
            if(transition.to!= null && transition.to != 'null'){
                clause += prefix + "\t\t/*to    */ && newData.child('state').val() == '" + transition.to+"'";
            }else{
                clause += prefix + "\t\t/*to    */ && newData.child('state').val() == null";
            }

            //then add the signal logic (if any)
            if(transition.signal != null){
                clause += prefix + "\t\t/*signal*/ && newData.child('signal').val() == '"+transition.signal+"'";
            }else{
                clause += prefix + "\t\t/*signal*/ && newData.child('signal').val() == null";
            }

            //then add the guard logic (if any)
            if(transition.guard != null){
                clause += prefix + "\t\t/*guards*/ && (" + exports.replace_prefix(transition.guard, prefix + "\t\t\t");
                clause += prefix + "\t\t)";
            }

            //then add the effect logic (if any)
            if(transition.effect != null){
                clause += prefix + "\t\t/*effect*/ && (" + exports.replace_prefix(transition.effect, prefix + "\t\t\t");
                clause += prefix + "\t\t)";
            }

            //then add the fixings for variables
            for(var variable in machine.variables){
                //look to see whether this variable was already mentioned in the effects
                //todo: should check whether its mentioned as a POST CONDITION
                //we have a security leak here
                if(transition.effect!= null && transition.effect.indexOf(variable) !== -1){
                    //its mentioned in the effects, no need to lock
                }else{
                    clause += prefix + "\t\t&& newData.child('" + variable + "').val() == data.child('"+variable +"').val() //lock for " + variable
                }
            }

            clause += prefix + "\t)";

            clauses.push(clause);
        }

        //or together all the transitions
        return '"' + clauses.join("||") + prefix + '"'
    };

    return machine;

};