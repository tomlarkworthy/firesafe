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

    console.log("\n", hsm);

    return parser.parser.parse(hsm, "top_block");
};