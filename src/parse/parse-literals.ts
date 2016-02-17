import Node from '../syntax/node';
import NodeKind from '../syntax/nodeKind';
import * as Operators from '../syntax/operators';
import AS3Parser, {nextToken, consume, skip, tokIs} from "./parser";
import {parseExpression} from "./parse-expressions";
import {parseType} from "./parse-types";


export function parseArrayLiteral(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_SQUARE_BRACKET);
    let result:Node = new Node(NodeKind.ARRAY, tok.index, -1);
    while (!tokIs(parser, Operators.RIGHT_SQUARE_BRACKET)) {
        result.children.push(parseExpression(parser));
        skip(parser, Operators.COMMA);
    }
    result.end = consume(parser, Operators.RIGHT_SQUARE_BRACKET).end;
    return result;
}


export function parseObjectLiteral(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_CURLY_BRACKET);
    let result:Node = new Node(NodeKind.OBJECT, tok.index, tok.end);
    while (!tokIs(parser, Operators.RIGHT_CURLY_BRACKET)) {
        result.children.push(parseObjectLiteralPropertyDeclaration(parser));
        skip(parser, Operators.COMMA);
    }
    tok = consume(parser, Operators.RIGHT_CURLY_BRACKET);
    result.end = tok.end;
    return result;
}


function parseObjectLiteralPropertyDeclaration(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.PROP, parser.tok.index, parser.tok.end);
    let name:Node = new Node(NodeKind.NAME, parser.tok.index, parser.tok.end, parser.tok.text);
    result.children.push(name);
    nextToken(parser); // name
    consume(parser, Operators.COLUMN);
    let expr = parseExpression(parser);
    let val = new Node(NodeKind.VALUE, parser.tok.index, expr.end, null, [expr]);
    result.children.push(val);
    result.end = val.end;
    return result;
}


export function parseShortVector(parser:AS3Parser):Node {
    let vector:Node = new Node(NodeKind.VECTOR, parser.tok.index, -1, '');
    consume(parser, Operators.INFERIOR);
    vector.children.push(parseType(parser));
    vector.end = consume(parser, Operators.SUPERIOR).end;

    let arrayLiteral = parseArrayLiteral(parser);

    return new Node(NodeKind.SHORT_VECTOR, vector.start, arrayLiteral.end, null, [vector, arrayLiteral]);
}
