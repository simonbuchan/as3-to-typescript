import Node = require('./syntax/node');
import Parser = require('./parse/parser');

function parse(filePath: string, content: string): Node {
    var parser = new Parser();
    return parser.buildAst(filePath, content);
}
export = parse;
