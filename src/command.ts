/*jshint node:true*/
/// <reference path="../typings/index.d.ts" />

import parse from './parse/index';
import { emit, EmitterOptions } from './emit/emitter';
import fs = require('fs-extra');
import path = require('path');
import parseArgs = require('minimist');

const util = require('util');

function readdir(dir: string, prefix = '', result: string[] = []): string[] {
    fs.readdirSync(dir).forEach(file => {
        let fileName = path.join(prefix, file);
        let filePath = path.join(dir, file);
        if (!fs.statSync(filePath).isDirectory()) {
            result.push(fileName);
        } else {
            readdir(filePath, fileName, result);
        }
    });
    return result;
}


function displayHelp(): void {
    console.log('usage: as3-to-typescript <sourceDir> <outputDir> [--commonjs] [--bridge name]');
}

export function run(): void {
    let args = parseArgs(process.argv);

    let emitterOptions: EmitterOptions = {
        lineSeparator: '\n',
        useNamespaces: (!args['commonjs']),
        bridge: (args['bridge'] && require("./bridge/" + args['bridge']).default) || null,
    };

    if (args._.length === 2) {
        displayHelp();
        process.exit(0);
    }

    if (args._.length !== 4) {
        throw new Error('source dir and output dir are mandatory');
    }

    let sourceDir = path.resolve(process.cwd(), args._[2]);
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
        throw new Error('invalid source dir');
    }

    let outputDir = path.resolve(process.cwd(), args._[3]);
    if (fs.existsSync(outputDir)) {
        if (!fs.statSync(outputDir).isDirectory()) {
            throw new Error('invalid ouput dir');
        }
        fs.removeSync(outputDir);
    }
    fs.mkdirSync(outputDir);

    let files = readdir(sourceDir).filter(file => /.as$/.test(file));
    let number = 0;
    let length = files.length;
    files.forEach(file => {
        console.log('(' + number + '/' + length + ') \'' + file + '\'');
        let content = fs.readFileSync(path.resolve(sourceDir, file), 'UTF-8');
        // console.log('parsing');
        let ast = parse(path.basename(file), content);
        // console.log(util.inspect(ast, false, null));
        // console.log('emitting');
        fs.outputFileSync(path.resolve(outputDir, file.replace(/.as$/, '.ts')), emit(ast, content, emitterOptions));
        number ++;
    });
}

