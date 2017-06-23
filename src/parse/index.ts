import Node from '../syntax/node';
import AS3Parser from './parser';
import SourceFile from './source-file';
import AS3Scanner from './scanner';
import {parseCompilationUnit} from './parse-declarations';
import {VERBOSE, WARNINGS} from '../config';

export default function parse(filePath:string, content:string):Node {

    if(VERBOSE >= 1) {
        console.log("parse() ⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣⇣");
    }

    let parser = new AS3Parser();
    parser.sourceFile = new SourceFile(content, filePath);
    parser.scn = new AS3Scanner();
    parser.scn.setContent(content);
    return parseCompilationUnit(parser);
}
