import Node from '../syntax/node';
import NodeKind from '../syntax/nodeKind';
import * as Keywords from '../syntax/keywords';
import * as Operators from '../syntax/operators';
import AS3Parser, {nextToken, tryParse, skip, consume, tokIs, VECTOR} from './parser';
import {parseParameterList, parseBlock} from './parse-common';
import {parseOptionalType, parseVector} from './parse-types';
import {parseArrayLiteral, parseObjectLiteral, parseShortVector} from './parse-literals';


export function parseExpressionList(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.EXPR_LIST, parser.tok.index, -1, null, [parseAssignmentExpression(parser)]);
    while (tokIs(parser, Operators.COMMA)) {
        nextToken(parser, true);
        result.children.push(parseAssignmentExpression(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result.children.length > 1 ? result : result.children[0];
}


export function parseExpression(parser:AS3Parser):Node {
    return parseAssignmentExpression(parser);
}


export function parsePrimaryExpression(parser:AS3Parser):Node {
    let result:Node;

    if (tokIs(parser, Operators.LEFT_SQUARE_BRACKET)) {
        return parseArrayLiteral(parser);
    } else if (tokIs(parser, Operators.LEFT_CURLY_BRACKET)) {
        return parseObjectLiteral(parser);
    } else if (tokIs(parser, Keywords.FUNCTION)) {
        return parseLambdaExpression(parser);
    } else if (tokIs(parser, Keywords.NEW)) {
        return parseNewExpression(parser);
    } else if (tokIs(parser, Operators.LEFT_PARENTHESIS)) {
        return parseEncapsulatedExpression(parser);
    } else if (parser.tok.text === VECTOR) {
        return parseVector(parser);
    } else if (tokIs(parser, Operators.INFERIOR)) {
        let res = tryParse(parser, () => parseShortVector(parser));
        if (res) {
            return res;
        }
    }

    if (parser.tok.text === '/' || parser.tok.text === '/=') {
        let tok = parser.scn.scanRegExp();
        if (tok) {
            nextToken(parser, true);
            return new Node(NodeKind.LITERAL, tok.index, tok.end, tok.text);
        }
    }

    if (parser.tok.isXML) {
        result = new Node(NodeKind.XML_LITERAL, parser.tok.index, parser.tok.end, parser.tok.text);
    } else if (parser.tok.isNumeric || /('|")/.test(parser.tok.text[0])) {
        result = new Node(NodeKind.LITERAL, parser.tok.index, parser.tok.end, parser.tok.text);
    } else {
        result = new Node(NodeKind.IDENTIFIER, parser.tok.index, parser.tok.end, parser.tok.text);
    }
    nextToken(parser, true);
    return result;
}


function parseLambdaExpression(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.FUNCTION);
    let result:Node;

    if (parser.tok.text === Operators.LEFT_PARENTHESIS) {
        result = new Node(NodeKind.LAMBDA, tok.index, parser.tok.end);
    } else {
        result = new Node(NodeKind.FUNCTION, tok.index, parser.tok.end, parser.tok.text);
        nextToken(parser, true);
    }
    result.children.push(parseParameterList(parser));
    result.children.push(parseOptionalType(parser));
    result.children.push(parseBlock(parser));
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result;
}


function parseNewExpression(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.NEW);

    let result:Node = new Node(NodeKind.NEW, tok.index, -1);
    result.children.push(parseExpression(parser)); // name
    if (tokIs(parser, Operators.VECTOR_START)) {
        let index = parser.tok.index;
        let vec = parseVector(parser);
        result.children.push(new Node(NodeKind.VECTOR, index, vec.end, null, [vec]));
    }
    if (tokIs(parser, Operators.LEFT_PARENTHESIS)) {
        result.children.push(parseArgumentList(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result;
}


function parseEncapsulatedExpression(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_PARENTHESIS);
    let result:Node = new Node(NodeKind.ENCAPSULATED, tok.index, -1);
    result.children.push(parseExpressionList(parser));
    tok = consume(parser, Operators.RIGHT_PARENTHESIS);
    result.end = tok.end;
    return result;
}


function parseAssignmentExpression(parser:AS3Parser):Node {
    let result = new Node(NodeKind.ASSIGN, parser.tok.index, parser.tok.end, null, [parseConditionalExpression(parser)]);
    while (tokIs(parser, Operators.EQUAL)
    || tokIs(parser, Operators.PLUS_EQUAL) || tokIs(parser, Operators.MINUS_EQUAL)
    || tokIs(parser, Operators.TIMES_EQUAL) || tokIs(parser, Operators.DIVIDED_EQUAL)
    || tokIs(parser, Operators.MODULO_EQUAL) || tokIs(parser, Operators.AND_EQUAL) || tokIs(parser, Operators.OR_EQUAL)
    || tokIs(parser, Operators.XOR_EQUAL)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseExpression(parser));
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result.children.length > 1 ? result : result.lastChild;
}


function parseConditionalExpression(parser:AS3Parser):Node {
    let result:Node = parseOrExpression(parser);
    if (tokIs(parser, Operators.QUESTION_MARK)) {
        let conditional:Node = new Node(NodeKind.CONDITIONAL, result.start, -1, null, [result]);
        nextToken(parser, true); // ?
        conditional.children.push(parseExpression(parser));
        nextToken(parser, true); // :
        conditional.children.push(parseExpression(parser));
        conditional.end = conditional.lastChild.start;
        return conditional;
    }
    return result;
}


function parseOrExpression(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.OR, parser.tok.index, -1, null, [parseAndExpression(parser)]);
    while (tokIs(parser, Operators.LOGICAL_OR) || tokIs(parser, Operators.LOGICAL_OR_AS2)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseAndExpression(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result.children.length > 1 ? result : result.children[0];
}


function parseAndExpression(parser:AS3Parser):Node {
    let result = new Node(NodeKind.AND, parser.tok.index, parser.tok.end, null, [parseBitwiseOrExpression(parser)]);
    while (tokIs(parser, Operators.AND) || tokIs(parser, Operators.AND_AS2)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseBitwiseOrExpression(parser));
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result.children.length > 1 ? result : result.lastChild;
}


function parseBitwiseOrExpression(parser:AS3Parser):Node {
    let children = [parseBitwiseXorExpression(parser)];
    let result = new Node(NodeKind.B_OR, parser.tok.index, parser.tok.end, parser.tok.text, children);
    while (tokIs(parser, Operators.B_OR)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseBitwiseXorExpression(parser));
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result.children.length > 1 ? result : result.lastChild;
}


function parseBitwiseXorExpression(parser:AS3Parser):Node {
    let children = [parseBitwiseAndExpression(parser)];
    let result = new Node(NodeKind.B_XOR, parser.tok.index, parser.tok.end, parser.tok.text, children);
    while (tokIs(parser, Operators.B_XOR)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseBitwiseAndExpression(parser));
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result.children.length > 1 ? result : result.lastChild;
}


function parseBitwiseAndExpression(parser:AS3Parser):Node {
    let children = [parseEqualityExpression(parser)];
    let result = new Node(NodeKind.B_AND, parser.tok.index, parser.tok.end, parser.tok.text, children);
    while (tokIs(parser, Operators.B_AND)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseEqualityExpression(parser));
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result.children.length > 1 ? result : result.lastChild;
}


function parseEqualityExpression(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.EQUALITY, parser.tok.index, -1, null, [parseRelationalExpression(parser)]);
    while (
    tokIs(parser, Operators.DOUBLE_EQUAL) || tokIs(parser, Operators.DOUBLE_EQUAL_AS2) ||
    tokIs(parser, Operators.STRICTLY_EQUAL) || tokIs(parser, Operators.NON_EQUAL) ||
    tokIs(parser, Operators.NON_EQUAL_AS2_1) || tokIs(parser, Operators.NON_EQUAL_AS2_2) ||
    tokIs(parser, Operators.NON_STRICTLY_EQUAL)
        ) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseRelationalExpression(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result.children.length > 1 ? result : result.children[0];
}


function parseRelationalExpression(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.RELATION, parser.tok.index, -1, null, [parseShiftExpression(parser)]);
    while (tokIs(parser, Operators.INFERIOR)
    || tokIs(parser, Operators.INFERIOR_AS2) || tokIs(parser, Operators.INFERIOR_OR_EQUAL)
    || tokIs(parser, Operators.INFERIOR_OR_EQUAL_AS2) || tokIs(parser, Operators.SUPERIOR)
    || tokIs(parser, Operators.SUPERIOR_AS2) || tokIs(parser, Operators.SUPERIOR_OR_EQUAL)
    || tokIs(parser, Operators.SUPERIOR_OR_EQUAL_AS2) || tokIs(parser, Keywords.IS) || tokIs(parser, Keywords.IN)
    && !parser.isInFor || tokIs(parser, Keywords.AS) || tokIs(parser, Keywords.INSTANCE_OF)) {
        if (!tokIs(parser, Keywords.AS)) {
            result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        } else {
            result.children.push(new Node(NodeKind.AS, parser.tok.index, parser.tok.end, parser.tok.text));
        }
        nextToken(parser, true);
        result.children.push(parseShiftExpression(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result.children.length > 1 ? result : result.children[0];
}


function parseShiftExpression(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.SHIFT, parser.tok.index, -1, null, [parseAdditiveExpression(parser)]);
    while (tokIs(parser, Operators.DOUBLE_SHIFT_LEFT)
    || tokIs(parser, Operators.TRIPLE_SHIFT_LEFT) || tokIs(parser, Operators.DOUBLE_SHIFT_RIGHT)
    || tokIs(parser, Operators.TRIPLE_SHIFT_RIGHT)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseAdditiveExpression(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result.children.length > 1 ? result : result.children[0];
}


function parseAdditiveExpression(parser:AS3Parser):Node {
    let result = new Node(NodeKind.ADD, parser.tok.index, parser.tok.end, null, [parseMultiplicativeExpression(parser)]);
    while (tokIs(parser, Operators.PLUS) || tokIs(parser, Operators.PLUS_AS2) || tokIs(parser, Operators.MINUS)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseMultiplicativeExpression(parser));
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result.children.length > 1 ? result : result.lastChild;
}


function parseMultiplicativeExpression(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.MULTIPLICATION, parser.tok.index, -1, null, [parseUnaryExpression(parser)]);
    while (tokIs(parser, Operators.TIMES) || tokIs(parser, Operators.SLASH) || tokIs(parser, Operators.MODULO)) {
        result.children.push(new Node(NodeKind.OP, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true);
        result.children.push(parseUnaryExpression(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result.children.length > 1 ? result : result.children[0];
}


function parseUnaryExpression(parser:AS3Parser):Node {
    let result:Node,
        index = parser.tok.index;
    if (tokIs(parser, Operators.INCREMENT)) {
        nextToken(parser);
        result = new Node(NodeKind.PRE_INC, parser.tok.index, index, null, [parseUnaryExpression(parser)]);
    } else if (tokIs(parser, Operators.DECREMENT)) {
        nextToken(parser);
        result = new Node(NodeKind.PRE_DEC, parser.tok.index, index, null, [parseUnaryExpression(parser)]);
    } else if (tokIs(parser, Operators.MINUS)) {
        nextToken(parser);
        result = new Node(NodeKind.MINUS, parser.tok.index, index, null, [parseUnaryExpression(parser)]);
    } else if (tokIs(parser, Operators.PLUS) || tokIs(parser, Operators.PLUS_AS2)) {
        nextToken(parser);
        result = new Node(NodeKind.PLUS, parser.tok.index, index, null, [parseUnaryExpression(parser)]);
    } else {
        return parseUnaryExpressionNotPlusMinus(parser);
    }
    return result;
}


function parseUnaryExpressionNotPlusMinus(parser:AS3Parser):Node {
    let result:Node;
    let index = parser.tok.index;
    if (tokIs(parser, Keywords.DELETE)) {
        nextToken(parser, true);
        let expr = parseExpression(parser);
        result = new Node(NodeKind.DELETE, index, expr.end, null, [expr]);
    } else if (tokIs(parser, Keywords.VOID)) {
        nextToken(parser, true);
        let expr = parseExpression(parser);
        result = new Node(NodeKind.VOID, index, expr.end, null, [expr]);
    } else if (tokIs(parser, Keywords.TYPEOF)) {
        nextToken(parser, true);
        let expr = parseExpression(parser);
        result = new Node(NodeKind.TYPEOF, index, expr.end, null, [expr]);
    } else if (tokIs(parser, '!') || tokIs(parser, 'not')) {
        nextToken(parser, true);
        let expr = parseExpression(parser);
        result = new Node(NodeKind.NOT, index, expr.end, null, [expr]);
    } else if (tokIs(parser, '~')) {
        nextToken(parser, true);
        let expr = parseExpression(parser);
        result = new Node(NodeKind.B_NOT, index, expr.end, null, [expr]);
    } else {
        result = parseUnaryPostfixExpression(parser);
    }
    return result;
}


function parseUnaryPostfixExpression(parser:AS3Parser):Node {
    let node:Node = parseAccessExpression(parser);

    if (tokIs(parser, Operators.INCREMENT)) {
        node = parseIncrement(parser, node);
    } else if (tokIs(parser, Operators.DECREMENT)) {
        node = parseDecrement(parser, node);
    }
    return node;
}


function parseIncrement(parser:AS3Parser, node:Node):Node {
    nextToken(parser, true);
    let result:Node = new Node(NodeKind.POST_INC, node.start, parser.tok.end);
    result.children.push(node);
    return result;
}


function parseDecrement(parser:AS3Parser, node:Node):Node {
    nextToken(parser, true);
    let result:Node = new Node(NodeKind.POST_DEC, node.start, parser.tok.end);
    result.children.push(node);
    result.end = node.end;
    return result;
}


function parseAccessExpression(parser:AS3Parser):Node {
    let node:Node = parsePrimaryExpression(parser);

    while (true) {
        if (tokIs(parser, Operators.LEFT_PARENTHESIS)) {
            node = parseFunctionCall(parser, node);
        }
        if (tokIs(parser, Operators.DOT) || tokIs(parser, Operators.DOUBLE_COLUMN)) {
            node = parseDot(parser, node);
        } else if (tokIs(parser, Operators.LEFT_SQUARE_BRACKET)) {
            node = parseArrayAccessor(parser, node);
        } else {
            break;
        }
    }
    return node;
}


function parseFunctionCall(parser:AS3Parser, node:Node):Node {
    let result:Node = new Node(NodeKind.CALL, node.start, -1);
    result.children.push(node);
    while (tokIs(parser, Operators.LEFT_PARENTHESIS)) {
        result.children.push(parseArgumentList(parser));
    }
    while (tokIs(parser, Operators.LEFT_SQUARE_BRACKET)) {
        result.children.push(parseArrayLiteral(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result;
}


function parseArgumentList(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_PARENTHESIS);
    let result:Node = new Node(NodeKind.ARGUMENTS, tok.index, -1);
    while (!tokIs(parser, Operators.RIGHT_PARENTHESIS)) {
        result.children.push(parseExpression(parser));
        skip(parser, Operators.COMMA);
    }
    tok = consume(parser, Operators.RIGHT_PARENTHESIS);
    result.end = tok.end;
    return result;
}



function parseDot(parser:AS3Parser, node:Node):Node {
    nextToken(parser);
    if (tokIs(parser, Operators.LEFT_PARENTHESIS)) {
        nextToken(parser);
        let result:Node = new Node(NodeKind.E4X_FILTER, parser.tok.index, -1);
        result.children.push(node);
        result.children.push(parseExpression(parser));
        result.end = consume(parser, Operators.RIGHT_PARENTHESIS).end;
        return result;
    } else if (tokIs(parser, Operators.TIMES)) {
        let result:Node = new Node(NodeKind.E4X_STAR, parser.tok.index, -1);
        result.children.push(node);
        result.end = node.end;
        return result;
    }
    let result:Node = new Node(NodeKind.DOT, node.start, -1);
    result.children.push(node);
    result.children.push(new Node(NodeKind.LITERAL, parser.tok.index, parser.tok.end, parser.tok.text));
    nextToken(parser, true);
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result;
}


function parseArrayAccessor(parser:AS3Parser, node:Node):Node {
    let result:Node = new Node(NodeKind.ARRAY_ACCESSOR, node.start, -1);
    result.children.push(node);
    while (tokIs(parser, Operators.LEFT_SQUARE_BRACKET)) {
        nextToken(parser, true);
        result.children.push(parseExpression(parser));
        result.end = consume(parser, Operators.RIGHT_SQUARE_BRACKET).end;
    }
    return result;
}

