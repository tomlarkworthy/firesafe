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

    //convert into nested json structures, using grammar
    var top_block =  parser.parser.parse(hsm, "block");

    //generate code
    var code = exports.top_block(top_block, "\n", []);

    console.log(code);

    return code
};

exports.is_string = function(x){
    return x.substring != undefined;
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
            machine.process_states(block['val'][".states"])
        }

        if(block['val'][".variables"]){
            if(machine == null) machine = exports.new_machine();
            machine.process_variables(block['val'][".variables"])
        }

        if(block['val'][".transitions"]){
            if(machine == null) machine = exports.new_machine();
            machine.process_transitions(block['val'][".transitions"])
        }

        for (var key in block['val']) {
            if(key === ".write" && machine){
                //ignore writes when in machine mode
                console.log("\n WARNING: .write ignored when declared in same layer as a state machine")
            }else if(key === ".states"){
            }else if(key === ".variables"){ //ignore all the machine special syntax
            }else if(key === ".transitions"){
            }else if(key === ".types"){
            }else{
                lines.push('"'+key +'"'+':' + exports.block(block['val'][key], prefix + "\t", types));
            }
        }

        if(machine){
            lines.push('".write"'+':' + machine.gen_write(prefix + "\t"));
        }

        return "{"+prefix + "\t" + lines.join("," + prefix + "\t") + prefix + "}";

    }else if(block["!type"] === "STR"){
        return block.val;
    }else if(block["!type"] === "BOOL"){
        return block.val;
    }else{
        console.log("\n **** UNRECOGNISED TOKEN ***", block["!type"])
    }

};

exports.new_machine = function(){
    var machine = {
        states:{},
        transitions:[],
        variables:{},
        types:{},
        initial:null
    };

    /**
     * sets up the state list for the machine, and sets the initial state
     * todo: a whole state machine might be a substate
     {
          '!type': 'OBJ',
          val: {
             IDLE: { '!type': 'OBJ', val: [Object] },
             TX: { '!type': 'OBJ', val: {} },
             RX: { '!type': 'OBJ', val: {} },
             ACK_TX: { '!type': 'OBJ', val: {} },
             ACK_RX: { '!type': 'OBJ', val: {} } }
     }

     * @param states_parse_obj
     */
    machine.process_states = function(states_parse_obj){
        //console.log("\nstates:", states_parse_obj);
        for(var name in states_parse_obj.val){
            machine.states[name] = {};
            if(states_parse_obj.val[name].initial == true){
                machine.initial = name;
            }
        }

    };
    /**
     {
          '!type': 'OBJ',
          val:
           { item: { '!type': 'OBJ', val: [Object] },
             tx_loc: { '!type': 'OBJ', val: [Object] },
             tx: { '!type': 'OBJ', val: [Object] },
             rx_loc: { '!type': 'OBJ', val: [Object] },
             rx: { '!type': 'OBJ', val: [Object] } }
     }

     * @param variables_parse_obj
     */
    machine.process_variables = function(variables_parse_obj){
        //console.log("\nprocess_variables:", variables_parse_obj);
        for(var name in variables_parse_obj.val){
            machine.process_variable(name, variables_parse_obj.val[name].val);
        }
        //console.log("\nmachine.variables:", machine.variables);
    };

    machine.process_variable = function(name, properties){
        //console.log("\nprocess_variable:", name, properties);
        var initial = "null";
        if(properties.initial){
            initial = properties.initial.val
        }
        machine.variables[name] = {type: properties.type.val, initial:initial}
    };

    machine.process_transitions = function(transitions_parse_obj){
        //console.log("\nprocess_transitions:", transitions_parse_obj);
        for(var name in transitions_parse_obj.val){
            if(name == ".types"){
                machine.process_types(transitions_parse_obj.val[".types"]);
            }else{
                machine.process_transition(name, transitions_parse_obj.val[name].val);
            }
        }
        //console.log("\ntransitions:", machine.transitions);
    };

    machine.process_transition = function(name, properties){
        //console.log("\nprocess_transition:", name, properties);
        var from, to, guard="", effect="";
        var transition = {};
        transition.from = properties.from.val;
        transition.to = properties.to.val;
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

        //console.log("\ntransition:", transition);
        machine.transitions.push(transition);
    };

    machine.process_types = function(types_parse_obj){
        //console.log("\ntypes_parse_obj:", types_parse_obj);
        for(var name in types_parse_obj.val){
            machine.types[name] = types_parse_obj.val[name].val;
        }
        //console.log("\nmachine.types:", machine.types);
    };

    machine.gen_write = function(prefix){

    };
    return machine;

};