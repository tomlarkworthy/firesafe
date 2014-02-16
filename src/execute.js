var closure = require("closure-compiler");
var fs = require("fs");
var handlebars = require("handlebars");
var template = handlebars.compile(fs.readFileSync('./src/execute.template').toString());
var $ = require('jquery-deferred');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var falafel = require('falafel');




function assert(condition, msg) {
    if(!condition){
        console.log("error ", msg);
    }
}

/**
 * extracts parameters from a signal name like go(x,y)
 * returns ["x","y"]
 * @param signal_name
 */
var extract_parameters = function(signal_name){
    console.log("signal_name", signal_name)
    var args = /\(([^)]+)/.exec(signal_name);
    if (args[1]) {
        args = args[1].split(/\s*,\s*/);
    }

    return args;
};

var extern_statement = handlebars.compile("/** @type {string} */\nvar {{{param}}};\n");


/**
 * returns an deferred that expands to an object that represents a generate clause from a snippet of src code
 */
exports.new_execute = function(signal, src){
    var def = $.Deferred();

    /*
        We run the src through the closue compiler to remove redundant code and rearrange the function so
        that all the arithmatic occurs in the funal ruturn statement
     */

    try{

        //the paramaters for the signal are encoded in the name
        var params = extract_parameters(signal);

        console.log("params ", params);

        //we build a function out of our information, and deed this to closure
        var function_src = template({
                src:src,
                params:params
            }
        );

        //console.log("closure input: ", function_src)

        var options =
        {
            compilation_level    : 'ADVANCED_OPTIMIZATIONS',
            language_in    : 'ECMASCRIPT5_STRICT',
            jscomp_error: "es5Strict",
            externs: "./src/execute_externs.js"
        };


        //the callback for processing the results of the closure compiler
        function post_compile (err, code, stderr) {
            console.log(stderr);
            if (err){
                test.ok(false);
            }

            //code contains our closure compiled snippit, now we have to extract the
            //object built after the return
            console.log(code);
            //convert to AST
            var ast = esprima.parse(code);

            var return_expr = null;

            //find the return {value}
            estraverse.traverse(ast, {
                enter: function (node) {
                    if (node.type == 'ReturnStatement'){
                        return_expr = node;
                        this.break();
                    }
                }
            });
            assert(return_expr != null, "there was no return in the execute clause");
                        var object_exp = return_expr.argument;
            assert(object_exp.type == "ObjectExpression", "return was not followed by an object definition");

            var assignments = {};

            for(var p_id in object_exp.properties){
                var property = object_exp.properties[p_id];
                assert(property.type == "Property", "Object was not filled with properties");
                assert(property.key.type == "Identifier", "Kay in object was not an Identifier");
                var key = property.key.name;
                var value_ast = property.value;
                var value = escodegen.generate(value_ast); //convert expressions or whatever back into src code

                assignments[key] = value;
            }

            //this is the passback of the enclosing function, delivered via a Deferred
            //it contains the intermediate representations and a function (rules()) for generating
            //serverside logic
            var execute = {
                src:src,
                assignments: assignments,
                params:params,
                //this should generate the security clause for enforcing the execute logic server side (as best possible)
                rules: function(){
                    var clauses = [];

                    for (var variable in this.assignments){
                        var clause = "newData.child('" + variable + "').val() == " + this.assignments[variable];

                        //final tidy up is to replace all the symbols with the correct ones
                        var replace_symbols = function(node){

                            if(node.type === "Identifier"){
                                //console.log("\nidentifier",  node.name);
                                //check to see if its a parameter, and replace it with a lookup
                                for(var param_id in params){
                                    var param = params[param_id];
                                    if(param === node.name){
                                        console.log("param", param);
                                        node.update("newData.child('" + param + "').val()");
                                        break;
                                    }
                                }
                                /*
                                if(node.name == "now"){
                                    node.update("Firebase.server.TIMESTAMP");
                                }*/
                            }
                        };

                        //program_state gets filled in, indirectly, with a C_VAR
                        clause = falafel(clause, {}, replace_symbols);
                        clauses.push(clause);
                    }
                    console.log("rules: ", clauses.join(" &&\n"))
                    return clauses.join(" &&\n");
                }
            };

            def.resolve(execute);
        }

        closure.compile(function_src, options, post_compile);

    }catch(e){
        console.log(e);
        console.log(e.stack);
        def.reject(data.status);
    }

    return def;
};