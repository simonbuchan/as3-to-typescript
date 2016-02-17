import Node from '../syntax/node';
import NodeKind from '../syntax/nodeKind';
import * as Keywords from '../syntax/keywords'
import * as Operators from '../syntax/operators'
import Token from './token';
import AS3Parser, {nextToken, nextTokenAllowNewLine, tryParse, consume, skip, tokIs} from './parser';
import {parseExpressionList, parseExpression, parsePrimaryExpression} from './parse-expressions';
import {parseVarList, parseConstList} from './parse-declarations';
import {parseBlock, parseNameTypeInit} from './parse-common';
import {NEW_LINE} from './parser';


export function parseStatement(parser:AS3Parser):Node {
    let result:Node;

    if (tokIs(parser, Keywords.FOR)) {
        result = parseFor(parser);
    } else if (tokIs(parser, Keywords.IF)) {
        result = parseIf(parser);
    } else if (tokIs(parser, Keywords.SWITCH)) {
        result = parseSwitch(parser);
    } else if (tokIs(parser, Keywords.DO)) {
        result = parseDo(parser);
    } else if (tokIs(parser, Keywords.WHILE)) {
        result = parseWhile(parser);
    } else if (tokIs(parser, Keywords.TRY)) {
        result = parseTry(parser);
    } else if (tokIs(parser, Keywords.CATCH)) {
        result = parseCatch(parser);
    } else if (tokIs(parser, Keywords.FINALLY)) {
        result = parseFinally(parser);
    } else if (tokIs(parser, Operators.LEFT_CURLY_BRACKET)) {
        result = parseBlock(parser);
    } else if (tokIs(parser, Keywords.VAR)) {
        result = parseVar(parser);
    } else if (tokIs(parser, Keywords.CONST)) {
        result = parseConst(parser);
    } else if (tokIs(parser, Keywords.RETURN)) {
        result = parseReturnStatement(parser);
    } else if (tokIs(parser, Keywords.THROW)) {
        result = parseThrowStatement(parser);
    } else if (tokIs(parser, Keywords.BREAK) || tokIs(parser, Keywords.CONTINUE)) {
        result = parseBreakOrContinueStatement(parser);
    } else if (tokIs(parser, Operators.SEMI_COLUMN)) {
        result = parseEmptyStatement(parser);
    } else {
        result = parseExpressionList(parser);
        skip(parser, Operators.SEMI_COLUMN);
    }
    return result;
}


function parseFor(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.FOR);

    if (tokIs(parser, Keywords.EACH)) {
        nextToken(parser);
        return parseForEach(parser, tok.index);
    } else {
        return parseTraditionalFor(parser, tok.index);
    }
}


function parseForEach(parser:AS3Parser, index:number):Node {
    consume(parser, Operators.LEFT_PARENTHESIS);

    let result:Node = new Node(NodeKind.FOREACH, index, -1);
    if (tokIs(parser, Keywords.VAR)) {
        let node:Node = new Node(NodeKind.VAR, parser.tok.index, -1);
        nextToken(parser);
        let child = parseNameTypeInit(parser);
        node.children.push(child);
        node.end = child.end;
        result.children.push(node);
    } else {
        result.children.push(new Node(NodeKind.NAME, parser.tok.index, parser.tok.end, parser.tok.text));
        // names allowed?
        nextToken(parser);
    }
    index = parser.tok.index;
    nextToken(parser); // in
    let expr = parseExpression(parser);
    result.children.push(new Node(NodeKind.IN, index, expr.end, null, [expr]));
    consume(parser, Operators.RIGHT_PARENTHESIS);
    let statement = parseStatement(parser);
    result.children.push(statement);
    result.end = statement.end;
    return result;
}


function parseTraditionalFor(parser:AS3Parser, index:number):Node {
    consume(parser, Operators.LEFT_PARENTHESIS);

    let result:Node = new Node(NodeKind.FOR, index, -1);
    if (!tokIs(parser, Operators.SEMI_COLUMN)) {
        if (tokIs(parser, Keywords.VAR)) {
            let varList = parseVarList(parser, null, null);
            result.children.push(new Node(NodeKind.INIT, varList.start, varList.end, null, [varList]));
        } else {
            parser.isInFor = true;
            let expr = parseExpression(parser);
            result.children.push(new Node(NodeKind.INIT, expr.start, expr.end, null, [expr]));
            parser.isInFor = false;
        }
        if (tokIs(parser, Keywords.IN)) {
            return parseForIn(parser, result);
        }
    }
    consume(parser, Operators.SEMI_COLUMN);
    if (!tokIs(parser, Operators.SEMI_COLUMN)) {
        let expr = parseExpression(parser);
        result.children.push(new Node(NodeKind.COND, expr.start, expr.end, null, [expr]));
    }
    consume(parser, Operators.SEMI_COLUMN);
    if (!tokIs(parser, Operators.RIGHT_PARENTHESIS)) {
        let expr = parseExpressionList(parser);
        result.children.push(new Node(NodeKind.ITER, expr.start, expr.end, null, [expr]));
    }
    consume(parser, Operators.RIGHT_PARENTHESIS);
    result.children.push(parseStatement(parser));
    return result;
}


function parseForIn(parser:AS3Parser, result:Node):Node {
    let index = parser.tok.index;
    nextToken(parser);
    let expr = parseExpression(parser);
    result.children.push(new Node(NodeKind.IN, index, expr.end, null, [expr]));
    result.kind = NodeKind.FORIN;
    consume(parser, Operators.RIGHT_PARENTHESIS);
    return result;
}


function parseIf(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.IF);
    let result:Node = new Node(NodeKind.IF, tok.index, -1, null, [parseCondition(parser)]);
    result.children.push(parseStatement(parser));
    if (tokIs(parser, Keywords.ELSE)) {
        nextToken(parser, true);
        result.children.push(parseStatement(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result;
}


function parseSwitch(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.SWITCH);
    let result:Node = new Node(NodeKind.SWITCH, tok.index, tok.end, null, [parseCondition(parser)]);
    if (tokIs(parser, Operators.LEFT_CURLY_BRACKET)) {
        nextToken(parser);
        result.children.push(parseSwitchCases(parser));
        result.end = consume(parser, Operators.RIGHT_CURLY_BRACKET).end;
    }
    return result;
}


function parseSwitchCases(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.CASES, parser.tok.index, parser.tok.end);
    while (true) {
        if (tokIs(parser, Operators.RIGHT_CURLY_BRACKET)) {
            break;
        } else if (tokIs(parser, Keywords.CASE)) {
            let index = parser.tok.index;
            nextToken(parser, true); // case
            let expr = parseExpression(parser);
            let caseNode:Node = new Node(NodeKind.CASE, index, expr.end, null, [expr]);
            consume(parser, Operators.COLUMN);
            let block = parseSwitchBlock(parser);
            caseNode.children.push(block);
            caseNode.end = block.end;
            result.children.push(caseNode);
        } else if (tokIs(parser, Keywords.DEFAULT)) {
            let index = parser.tok.index;
            nextToken(parser, true); // default
            consume(parser, Operators.COLUMN);
            let caseNode:Node = new Node(NodeKind.CASE, index, -1, null,
                [new Node(NodeKind.DEFAULT, index, parser.tok.end, Keywords.DEFAULT)]);
            let block = parseSwitchBlock(parser);
            caseNode.end = block.end;
            caseNode.children.push(block);
            result.children.push(caseNode);
        }
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result;
}


function parseSwitchBlock(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.SWITCH_BLOCK, parser.tok.index, parser.tok.end);
    while (!tokIs(parser, Keywords.CASE) && !tokIs(parser, Keywords.DEFAULT) && !tokIs(parser, Operators.RIGHT_CURLY_BRACKET)) {
        result.children.push(parseStatement(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result;
}


function parseDo(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.DO);
    let result:Node = new Node(NodeKind.DO, tok.index, -1, null, [parseStatement(parser)]);
    consume(parser, Keywords.WHILE);
    let cond = parseCondition(parser);
    result.children.push(cond);
    result.end = cond.end;
    if (tokIs(parser, Operators.SEMI_COLUMN)) {
        nextToken(parser, true);
    }
    return result;
}


function parseWhile(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.WHILE);
    let result:Node = new Node(NodeKind.WHILE, tok.index, tok.end);
    result.children.push(parseCondition(parser));
    result.children.push(parseStatement(parser));
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, tok.end);
    return result;
}


function parseTry(parser:AS3Parser):Node {
    let result:Node;
    let index = parser.tok.index;
    nextToken(parser, true);
    let block = parseBlock(parser);
    result = new Node(NodeKind.TRY, index, block.end, null, [block]);
    return result;
}


function parseCatch(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.CATCH);
    consume(parser, Operators.LEFT_PARENTHESIS);
    let result:Node = new Node(NodeKind.CATCH, tok.index, tok.end, null, [
        new Node(NodeKind.NAME, parser.tok.index, parser.tok.end, parser.tok.text)
    ]);
    nextToken(parser, true); // name
    if (tokIs(parser, Operators.COLUMN)) {
        nextToken(parser, true); // :
        result.children.push(new Node(NodeKind.TYPE, parser.tok.index, parser.tok.end, parser.tok.text));
        nextToken(parser, true); // type
    }
    consume(parser, Operators.RIGHT_PARENTHESIS);
    let block = parseBlock(parser);
    result.children.push(block);
    result.end = block.end;
    return result;
}


function parseFinally(parser:AS3Parser):Node {
    let result:Node;
    let index = parser.tok.index;
    nextToken(parser, true);
    let block = parseBlock(parser);
    result = new Node(NodeKind.FINALLY, index, block.end, null, [block]);
    return result;
}


function parseVar(parser:AS3Parser):Node {
    let result:Node;
    result = parseVarList(parser, null, null);
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}


function parseConst(parser:AS3Parser):Node {
    let result = parseConstList(parser, null, null);
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}


function parseReturnStatement(parser:AS3Parser):Node {
    let result:Node;

    let index = parser.tok.index,
        end = parser.tok.end;
    nextTokenAllowNewLine(parser);
    if (tokIs(parser, NEW_LINE) || tokIs(parser, Operators.SEMI_COLUMN)) {
        nextToken(parser, true);
        result = new Node(NodeKind.RETURN, index, end, '');
    } else {
        let expr = parseExpression(parser);
        result = new Node(NodeKind.RETURN, index, expr.end, null, [expr]);
        skip(parser, Operators.SEMI_COLUMN);
    }
    return result;
}


function parseThrowStatement(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.THROW);
    let expr = parseExpression(parser);

    return new Node(NodeKind.RETURN, tok.index, expr.end, null, [expr]);
}


function parseBreakOrContinueStatement(parser:AS3Parser):Node {
    let tok:Token = parser.tok;
    let kind:NodeKind;
    if (tokIs(parser, Keywords.BREAK) || tokIs(parser, Keywords.CONTINUE)) {
        kind = tokIs(parser, Keywords.BREAK) ? NodeKind.BREAK : NodeKind.CONTINUE;
        nextToken(parser);
    } else {
        let pos = parser.sourceFile.getLineAndCharacterFromPosition(parser.tok.index);
        throw new Error('unexpected token : ' +
            parser.tok.text + '(' + pos.line + ',' + pos.col + ')' +
            ' in file ' + parser.sourceFile.path +
            'expected: continue or break'
        );
    }
    let result:Node;
    if (tokIs(parser, NEW_LINE) || tokIs(parser, Operators.SEMI_COLUMN)) {
        nextToken(parser, true);
        result = new Node(kind, tok.index, tok.end, '');
    } else {
        let ident = tryParse(parser, () => {
            let expr = parsePrimaryExpression(parser);
            if (expr.kind === NodeKind.IDENTIFIER) {
                return expr;
            } else {
                throw new Error();
            }
        });
        if (!ident) {
            let pos = parser.sourceFile.getLineAndCharacterFromPosition(parser.tok.index);
            throw new Error(
                `unexpected token : ${parser.tok.text}(${pos.line},${pos.col})` +
                ` in file ${ parser.sourceFile.path } expected: ident`
            );
        }
        result = new Node(kind, tok.index, ident.end, null, [ident]);
    }
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}


function parseEmptyStatement(parser:AS3Parser):Node {
    let result:Node;
    result = new Node(NodeKind.STMT_EMPTY, parser.tok.index, parser.tok.end, Operators.SEMI_COLUMN);
    nextToken(parser, true);
    return result;
}


function parseCondition(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_PARENTHESIS);
    let result:Node = new Node(NodeKind.CONDITION, tok.index, -1, null, [parseExpression(parser)]);
    tok = consume(parser, Operators.RIGHT_PARENTHESIS);
    result.end = tok.end;
    return result;
}

