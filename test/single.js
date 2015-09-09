/*jshint node:true*/

var parse = require('../lib/parse'),
    emit = require('../lib/emit'),
    fs = require('fs'),
    path = require('path');

var content = fs.readFileSync(path.join(__dirname ,'single', 'file.as'), 'UTF-8' );
var ast = parse('file.as', content);

fs.writeFileSync(path.join(__dirname ,'single', 'file.ast.json'), JSON.stringify(ast, null, 4));
fs.writeFileSync(path.join(__dirname ,'single', 'file.ts'), emit(ast, content));

