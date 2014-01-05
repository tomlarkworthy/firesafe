#! /usr/bin/env node

var userArgs = process.argv.slice(2);

var argv = process.argv.slice(2);
var help =
    "\nusage: \n    firesafe <srcfile> <dstfile>\n\n" +
    "Generates Firebase validation rules based on a Hierarchical State Machine definition file (.hsm),\n\n" +
    "srcfile : the input hsm description file (.hsm) \n"+
    "dstfile : the file to output firebase validation rules, copy and paste into security section of Firebase webpage \n"+
    "          alternatively setup automatic upload of rules (see firebase_io.js) \n\n"+
    "-h, [--help] # Show this help message and quit\n\n"+
    "Commercial licenses, graphical tools and formal model checking under development\n" +
    "Keep up to date with new features at firesafe-announce@googlegroups.com\n";

var tasks = {};
tasks.help = function(){
    console.log(help);};

if(argv[0] === "--help" || argv[0] === "-h" || argv.length != 2) {
    tasks.help();
}


var hsm_file = userArgs[0];