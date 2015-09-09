/*jshint node:true*/

import parse = require('./parse');
import emit = require('./emit');
import fs = require('fs-extra');
import path = require('path');


function flatten<T>(arr: any): T[] {
  return arr.reduce(function (result: T[], val: any) {
    if (Array.isArray(val)) {
      result.push.apply(result, flatten(val));
    } else {
      result.push(val);
    }
    return result;
  }, []);
}

function readdir(dir: string, prefix = ''): string[] {
    return flatten<string>(fs.readdirSync(dir).map(function (file) {
        var fileName = path.join(prefix, file);
        var filePath = path.join(dir, file);
        return fs.statSync(filePath).isDirectory() ? <any> readdir(filePath, fileName) : <any> fileName;
    }));
}

function displayHelp() {
    console.log('usage: as3-to-typescript <sourceDir> <outputDir>');
}

export function run() {
    if (process.argv.length === 2) {
        displayHelp();
        process.exit(0);
    }
    if (process.argv.length !== 4) {
        throw new Error('source dir and output dir are mandatory');
    }
    var sourceDir = path.resolve(process.cwd(), process.argv[2]);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
        throw new Error('invalid source dir');
    }
    
    var outputDir = path.resolve(process.cwd(), process.argv[3]);
    if (fs.existsSync(outputDir)) {
        if (!fs.statSync(outputDir).isDirectory()) {
            throw new Error('invalid ouput dir');
        }
        fs.removeSync(outputDir);
    }
    fs.mkdirSync(outputDir);
    
    var files = readdir(sourceDir).filter(file => /.as$/.test(file));
    var number = 0;
    var length = files.length;
    files.forEach(function (file) {
        console.log('compiling \'' + file + '\' ' + number + '/' + length);
        var content = fs.readFileSync(path.resolve(sourceDir, file), 'UTF-8');
        console.log('parsing');
        var ast = parse(path.basename(file), content);
        console.log('emitting');
        fs.outputFileSync(path.resolve(outputDir, file.replace(/.as$/, '.ts')), emit(ast, content));
        number ++;
    });
}

