#! /usr/bin/env node

console.log(process.argv);

var userArgs = process.argv.slice(2);
var hsm_file = userArgs[0];