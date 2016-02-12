/**
 *    Copyright (c) 2009, Adobe Systems, Incorporated
 *    All rights reserved.
 *
 *    Redistribution  and  use  in  source  and  binary  forms, with or without
 *    modification,  are  permitted  provided  that  the  following  conditions
 *    are met:
 *
 *      * Redistributions  of  source  code  must  retain  the  above copyright
 *        notice, this list of conditions and the following disclaimer.
 *      * Redistributions  in  binary  form  must reproduce the above copyright
 *        notice,  this  list  of  conditions  and  the following disclaimer in
 *        the    documentation   and/or   other  materials  provided  with  the
 *        distribution.
 *      * Neither the name of the Adobe Systems, Incorporated. nor the names of
 *        its  contributors  may be used to endorse or promote products derived
 *        from this software without specific prior written permission.
 *
 *    THIS  SOFTWARE  IS  PROVIDED  BY THE  COPYRIGHT  HOLDERS AND CONTRIBUTORS
 *    "AS IS"  AND  ANY  EXPRESS  OR  IMPLIED  WARRANTIES,  INCLUDING,  BUT NOT
 *    LIMITED  TO,  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 *    PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER
 *    OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,  INCIDENTAL,  SPECIAL,
 *    EXEMPLARY,  OR  CONSEQUENTIAL  DAMAGES  (INCLUDING,  BUT  NOT  LIMITED TO,
 *    PROCUREMENT  OF  SUBSTITUTE   GOODS  OR   SERVICES;  LOSS  OF  USE,  DATA,
 *    OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 *    LIABILITY,  WHETHER  IN  CONTRACT,  STRICT  LIABILITY, OR TORT (INCLUDING
 *    NEGLIGENCE  OR  OTHERWISE)  ARISING  IN  ANY  WAY  OUT OF THE USE OF THIS
 *    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import SourceFile from './source-file';
import AS3Scanner from './scanner';
import Token from './token';
import NodeKind from '../syntax/nodeKind';
import * as Operators from '../syntax/operators';
import * as Keywords from '../syntax/keywords';
import Node from '../syntax/node';
import {startsWith} from '../string';


const ASDOC_COMMENT = '/**';
const MULTIPLE_LINES_COMMENT = '/*';
const NEW_LINE = '\n';
const SINGLE_LINE_COMMENT = '//';
const VECTOR = 'Vector';


/**
 * @author xagnetti
 */
export default class AS3Parser {
    sourceFile:SourceFile;

    currentAsDoc:Node;
    currentFunctionNode:Node;
    currentMultiLineComment:Node;
    isInFor:boolean = false;
    scn:AS3Scanner;
    tok:Token;

    buildAst(filePath:string, content:string):Node {
        this.sourceFile = new SourceFile(content, filePath);
        this.scn = new AS3Scanner();
        this.scn.setContent(content);
        return parseCompilationUnit(this);
    }
}


function nextToken(parser:AS3Parser, ignoreDocumentation:boolean = false):void {
    do {
        if (ignoreDocumentation) {
            nextTokenIgnoringDocumentation(parser);
        } else {
            nextTokenAllowNewLine(parser);
        }
    }
    while (parser.tok.text === NEW_LINE);
}

function tryParse<T>(parser:AS3Parser, func:() => T):T {
    let checkPoint = parser.scn.getCheckPoint();
    try {
        return func();
    } catch (e) {
        parser.scn.rewind(checkPoint);
        return null;
    }
}


/**
 * tok is first content token
 *
 * @throws TokenException
 */
function parseClassContent(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.CONTENT, parser.tok.index, -1);
    let modifiers:Token[] = [];
    let meta:Node[] = [];

    while (!tokIs(parser, Operators.RIGHT_CURLY_BRACKET)) {
        if (tokIs(parser, Operators.LEFT_CURLY_BRACKET)) {
            result.children.push(parseBlock(parser));
        }
        if (tokIs(parser, Operators.LEFT_SQUARE_BRACKET)) {
            meta.push(parseMetaData(parser));
        } else if (tokIs(parser, Keywords.VAR)) {
            parseClassField(parser, result, modifiers, meta);
        } else if (tokIs(parser, Keywords.CONST)) {
            parseClassConstant(parser, result, modifiers, meta);
        } else if (tokIs(parser, Keywords.IMPORT)) {
            result.children.push(parseImport(parser));
        } else if (tokIs(parser, Keywords.INCLUDE) || tokIs(parser, Keywords.INCLUDE_AS2)) {
            result.children.push(parseIncludeExpression(parser));
        } else if (tokIs(parser, Keywords.FUNCTION)) {
            parseClassFunctions(parser, result, modifiers, meta);
        } else {
            tryToParseCommentNode(parser, result, modifiers);
        }
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result;
}

/**
 * tok is empty, since nextToken has not been called before
 *
 * @throws UnExpectedTokenException
 */
function parseCompilationUnit(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.COMPILATION_UNIT, -1, -1);

    nextTokenIgnoringDocumentation(parser);
    if (tokIs(parser, Keywords.PACKAGE)) {
        result.children.push(parsePackage(parser));
    }
    result.children.push(parsePackageContent(parser));
    return result;
}

/**
 * @return
 * @throws TokenException
 */
function parseExpression(parser:AS3Parser):Node {
    return parseAssignmentExpression(parser);
}

/**
 * tok is first content token
 *
 * @throws TokenException
 */
function parseInterfaceContent(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.CONTENT, parser.tok.index, -1);

    while (!tokIs(parser, Operators.RIGHT_CURLY_BRACKET)) {
        if (tokIs(parser, Keywords.IMPORT)) {
            result.children.push(parseImport(parser));
        } else if (tokIs(parser, Keywords.FUNCTION)) {
            result.children.push(parseFunctionSignature(parser));
        } else if (tokIs(parser, Keywords.INCLUDE) || tokIs(parser, Keywords.INCLUDE_AS2)) {
            result.children.push(parseIncludeExpression(parser));
        } else if (tokIs(parser, Operators.LEFT_SQUARE_BRACKET)) {
            while (!tokIs(parser, Operators.RIGHT_SQUARE_BRACKET)) {
                nextToken(parser);
            }
            nextToken(parser);
        } else {
            tryToParseCommentNode(parser, result, null);
        }
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result;
}

/**
 * tok is first token of content
 *
 * @throws UnExpectedTokenException
 */
function parsePackageContent(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.CONTENT, parser.tok.index, -1);
    let modifiers:Token[] = [];
    let meta:Node[] = [];

    while (!tokIs(parser, Operators.RIGHT_CURLY_BRACKET) && !tokIs(parser, Keywords.EOF)) {
        if (tokIs(parser, Keywords.IMPORT)) {
            result.children.push(parseImport(parser));
        } else if (tokIs(parser, Keywords.USE)) {
            result.children.push(parseUse(parser));
        } else if (tokIs(parser, Keywords.INCLUDE) || tokIs(parser, Keywords.INCLUDE_AS2)) {
            result.children.push(parseIncludeExpression(parser));
        } else if (tokIs(parser, Operators.LEFT_SQUARE_BRACKET)) {
            meta.push(parseMetaData(parser));
        } else if (tokIs(parser, Keywords.CLASS)) {
            result.children.push(parseClass(parser, meta, modifiers));
            modifiers.length = 0;
            meta.length = 0;
        } else if (tokIs(parser, Keywords.INTERFACE)) {
            result.children.push(parseInterface(parser, meta, modifiers));
            modifiers.length = 0;
            meta.length = 0;
        } else if (tokIs(parser, Keywords.FUNCTION)) {
            parseClassFunctions(parser, result, modifiers, meta);
        } else if (startsWith(parser.tok.text, ASDOC_COMMENT)) {
            parser.currentAsDoc = new Node(NodeKind.AS_DOC, parser.tok.index,
                parser.tok.index + parser.tok.index - 1, parser.tok.text);
            nextToken(parser);
        } else if (startsWith(parser.tok.text, MULTIPLE_LINES_COMMENT)) {
            parser.currentMultiLineComment = new Node(NodeKind.MULTI_LINE_COMMENT, parser.tok.index,
                parser.tok.index + parser.tok.index - 1, parser.tok.text);
            nextToken(parser);
        } else {
            modifiers.push(parser.tok);
            nextTokenIgnoringDocumentation(parser);
        }
    }
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    return result;
}

/**
 * @return
 * @throws TokenException
 */
function parsePrimaryExpression(parser:AS3Parser):Node {
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

/**
 * tok is the first token of a statement
 *
 * @throws TokenException
 */
function parseStatement(parser:AS3Parser):Node {
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

/**
 * @return
 * @throws TokenException
 */
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

function collectVarListContent(parser:AS3Parser, result:Node):Node {
    result.children.push(parseNameTypeInit(parser));
    while (tokIs(parser, Operators.COMMA)) {
        nextToken(parser, true);
        result.children.push(parseNameTypeInit(parser));
    }
    return result;
}


/**
 * Compare the current token to the parameter. If it equals, get the next
 * token. If not, throw a runtime exception.
 *
 * @param text
 * @throws UnExpectedTokenException
 */
function consume(parser:AS3Parser, text:string):Token {
    while (startsWith(parser.tok.text, '//')) {
        nextToken(parser);
    }

    if (!tokIs(parser, text)) {
        /*throw new UnExpectedTokenException(parser.tok.text,
         new Position(parser.tok.index, parser.tok.getColumn()),
         fileName,
         text);*/

        let pos = parser.sourceFile.getLineAndCharacterFromPosition(parser.tok.index);
        let msg =
            `unexpected token : ${parser.tok.text}(${pos.line},${pos.col}) ` +
            `in file ${parser.sourceFile.path} expected: ${text}`;
        throw new Error(msg);
    }
    let result = parser.tok;
    nextToken(parser);
    return result;
}

function convertMeta(parser:AS3Parser, metadataList:Node[]):Node {
    if (!metadataList || metadataList.length === 0) {
        return null;
    }

    let result:Node = new Node(NodeKind.META_LIST, parser.tok.index, -1);
    result.children = metadataList ? metadataList.slice(0) : [];
    if (result.lastChild) {
        result.end = result.lastChild.end;
    }
    result.start = result.children.reduce((index:number, child:Node) => {
        return Math.min(index, child ? child.start : Infinity);
    }, result.start);
    return result;
}

function convertModifiers(parser:AS3Parser, modifierList:Token[]):Node {
    if (!modifierList) {
        return null;
    }

    let result:Node = new Node(NodeKind.MOD_LIST, parser.tok.index, -1);

    let end = parser.tok.index;
    result.children = modifierList.map(tok => {
        end = tok.index + tok.text.length;
        return new Node(NodeKind.MODIFIER, tok.index, end, tok.text);
    });
    result.end = end;
    result.start = result.children.reduce((index:number, child:Node) => {
        return Math.min(index, child ? child.start : Infinity);
    }, result.start);
    return result;
}

function doParseSignature(parser:AS3Parser):Node[] {
    let tok = consume(parser, Keywords.FUNCTION);
    let type:Node = new Node(NodeKind.TYPE, tok.index, tok.end, Keywords.FUNCTION);
    if (tokIs(parser, Keywords.SET) || tokIs(parser, Keywords.GET)) {
        type = new Node(NodeKind.TYPE, tok.index, parser.tok.end, parser.tok.text);
        nextToken(parser); // set or get
    }
    let name:Node = new Node(NodeKind.NAME, parser.tok.index, parser.tok.end, parser.tok.text);
    nextToken(parser); // name
    let params:Node = parseParameterList(parser);
    let returnType:Node = parseOptionalType(parser);
    return [type, name, params, returnType];
}

function findFunctionTypeFromSignature(parser:AS3Parser, signature:Node[]):NodeKind {
    for (let i = 0; i < signature.length; i++) {
        let node = signature[i];
        if (node.kind === NodeKind.TYPE) {
            if (node.text === Keywords.SET) {
                return NodeKind.SET;
            }
            if (node.text === Keywords.GET) {
                return NodeKind.GET;
            }
            return NodeKind.FUNCTION;
        }
    }
    return NodeKind.FUNCTION;
}

/**
 * Get the next token Skip comments but keep newlines We need parser method for
 * beeing able to decide if a returnStatement has an expression
 *
 * @throws UnExpectedTokenException
 */
function nextTokenAllowNewLine(parser:AS3Parser):void {
    do {
        let lastTok = parser.tok;
        parser.tok = parser.scn.nextToken();

        if (!parser.tok) {
            let {line, col} = parser.sourceFile.getLineAndCharacterFromPosition(lastTok.index);
            throw new Error(`failed to parse token after ${parser.sourceFile.path}:(${line},${col})`);

        }
        if (parser.tok.text === null) {
            throw new Error(parser.sourceFile.path); //TODO throw new NullTokenException(fileName);
        }
    }
    while (startsWith(parser.tok.text, SINGLE_LINE_COMMENT));
}

function nextTokenIgnoringDocumentation(parser:AS3Parser):void {
    do {
        nextToken(parser);
    }
    while (startsWith(parser.tok.text, MULTIPLE_LINES_COMMENT));
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

// ------------------------------------------------------------------------
// language specific recursive descent parsing
// ------------------------------------------------------------------------

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

/**
 * tok is ( exit tok is first token after )
 */
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

/**
 * tok is [
 */
function parseArrayLiteral(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_SQUARE_BRACKET);
    let result:Node = new Node(NodeKind.ARRAY, tok.index, -1);
    while (!tokIs(parser, Operators.RIGHT_SQUARE_BRACKET)) {
        result.children.push(parseExpression(parser));
        skip(parser, Operators.COMMA);
    }
    result.end = consume(parser, Operators.RIGHT_SQUARE_BRACKET).end;
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


function parseBlock(parser:AS3Parser, result?:Node):Node {
    let tok = consume(parser, Operators.LEFT_CURLY_BRACKET);
    if (!result) {
        result = new Node(NodeKind.BLOCK, tok.index, parser.tok.end);
    } else {
        result.start = tok.index;
    }
    while (!tokIs(parser, Operators.RIGHT_CURLY_BRACKET)) {
        if (startsWith(parser.tok.text, MULTIPLE_LINES_COMMENT)) {
            parser.currentFunctionNode.children.push(
                new Node(NodeKind.MULTI_LINE_COMMENT, parser.tok.index, parser.tok.end, parser.tok.text)
            );
            nextToken(parser);
        } else {
            result.children.push(parseStatement(parser));
        }
    }
    result.end = consume(parser, Operators.RIGHT_CURLY_BRACKET).end;
    return result;
}

/**
 * tok is catch
 *
 * @throws TokenException
 */
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

/**
 * tok is class
 *
 * @param meta
 * @param modifier
 * @throws TokenException
 */
function parseClass(parser:AS3Parser, meta:Node[], modifier:Token[]):Node {
    let tok = consume(parser, Keywords.CLASS);
    let result:Node = new Node(NodeKind.CLASS, tok.index, tok.end);

    if (parser.currentAsDoc) {
        result.children.push(parser.currentAsDoc);
        parser.currentAsDoc = null;
    }
    if (parser.currentMultiLineComment) {
        result.children.push(parser.currentMultiLineComment);
        parser.currentMultiLineComment = null;
    }

    let index = parser.tok.index,
        name = parseQualifiedName(parser, true);
    result.children.push(new Node(NodeKind.NAME, index, index + name.length, name));

    result.children.push(convertMeta(parser, meta));
    result.children.push(convertModifiers(parser, modifier));

    // nextToken(parser,  true ); // name

    do {
        if (tokIs(parser, Keywords.EXTENDS)) {
            nextToken(parser, true); // extends
            index = parser.tok.index;
            name = parseQualifiedName(parser, false);
            result.children.push(new Node(NodeKind.EXTENDS, index, index + name.length, name));
        } else if (tokIs(parser, Keywords.IMPLEMENTS)) {
            result.children.push(parseImplementsList(parser));
        }
    }
    while (!tokIs(parser, Operators.LEFT_CURLY_BRACKET));
    consume(parser, Operators.LEFT_CURLY_BRACKET);
    result.children.push(parseClassContent(parser));
    tok = consume(parser, Operators.RIGHT_CURLY_BRACKET);

    result.end = tok.end;
    result.start = result.children.reduce((index:number, child:Node) => {
        return Math.min(index, child ? child.start : Infinity);
    }, index);

    return result;
}

function parseClassConstant(parser:AS3Parser, result:Node, modifiers:Token[], meta:Node[]):void {
    result.children.push(parseConstList(parser, meta, modifiers));
    if (tokIs(parser, Operators.SEMI_COLUMN)) {
        nextToken(parser);
    }
    meta.length = 0;
    modifiers.length = 0;
}

function parseClassField(parser:AS3Parser, result:Node, modifiers:Token[], meta:Node[]):void {
    let varList:Node = parseVarList(parser, meta, modifiers);
    result.children.push(varList);
    if (parser.currentAsDoc) {
        varList.children.push(parser.currentAsDoc);
        parser.currentAsDoc = null;
    }
    if (parser.currentMultiLineComment) {
        result.children.push(parser.currentMultiLineComment);
        parser.currentMultiLineComment = null;
    }
    if (tokIs(parser, Operators.SEMI_COLUMN)) {
        nextToken(parser);
    }
    meta.length = 0;
    modifiers.length = 0;
}

function parseClassFunctions(parser:AS3Parser, result:Node, modifiers:Token[], meta:Node[]):void {
    result.children.push(parseFunction(parser, meta, modifiers));
    meta.length = 0;
    modifiers.length = 0;
}

/**
 * tok is (
 *
 * @throws TokenException
 */
function parseCondition(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_PARENTHESIS);
    let result:Node = new Node(NodeKind.CONDITION, tok.index, -1, null, [parseExpression(parser)]);
    tok = consume(parser, Operators.RIGHT_PARENTHESIS);
    result.end = tok.end;
    return result;
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

function parseConst(parser:AS3Parser):Node {
    let result = parseConstList(parser, null, null);
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}

/**
 * tok is const
 *
 * @param modifiers
 * @param meta
 * @throws TokenException
 */
function parseConstList(parser:AS3Parser, meta:Node[], modifiers:Token[]):Node {
    let tok = consume(parser, Keywords.CONST);
    let result:Node = new Node(NodeKind.CONST_LIST, tok.index, -1);
    result.children.push(convertMeta(parser, meta));
    result.children.push(convertModifiers(parser, modifiers));
    collectVarListContent(parser, result);

    result.start = result.children.reduce((index:number, child:Node) => {
        return Math.min(index, child ? child.start : Infinity);
    }, tok.index);
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);

    return result;
}

function parseDecrement(parser:AS3Parser, node:Node):Node {
    nextToken(parser, true);
    let result:Node = new Node(NodeKind.POST_DEC, node.start, parser.tok.end);
    result.children.push(node);
    result.end = node.end;
    return result;
}

/**
 * tok is do
 *
 * @throws TokenException
 */
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

function parseEmptyStatement(parser:AS3Parser):Node {
    let result:Node;
    result = new Node(NodeKind.STMT_EMPTY, parser.tok.index, parser.tok.end, Operators.SEMI_COLUMN);
    nextToken(parser, true);
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

function parseExpressionList(parser:AS3Parser):Node {
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

function parseFinally(parser:AS3Parser):Node {
    let result:Node;
    let index = parser.tok.index;
    nextToken(parser, true);
    let block = parseBlock(parser);
    result = new Node(NodeKind.FINALLY, index, block.end, null, [block]);
    return result;
}

/**
 * tok is for
 *
 * @throws TokenException
 */
function parseFor(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.FOR);

    if (tokIs(parser, Keywords.EACH)) {
        nextToken(parser);
        return parseForEach(parser, tok.index);
    } else {
        return parseTraditionalFor(parser, tok.index);
    }
}

/**
 * tok is ( for each( var obj : Type in List )
 *
 * @throws TokenException
 */
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

function parseForIn(parser:AS3Parser, result:Node):Node {
    let index = parser.tok.index;
    nextToken(parser);
    let expr = parseExpression(parser);
    result.children.push(new Node(NodeKind.IN, index, expr.end, null, [expr]));
    result.kind = NodeKind.FORIN;
    consume(parser, Operators.RIGHT_PARENTHESIS);
    return result;
}

/**
 * tok is function
 *
 * @param modifiers
 * @param meta
 * @throws TokenException
 */
function parseFunction(parser:AS3Parser, meta:Node[], modifiers:Token[]):Node {
    let signature:Node[] = doParseSignature(parser);
    let result:Node = new Node(
        findFunctionTypeFromSignature(parser, signature), signature[0].start,
        -1, signature[0].text
    );

    if (parser.currentAsDoc) {
        result.children.push(parser.currentAsDoc);
        parser.currentAsDoc = null;
    }
    if (parser.currentMultiLineComment) {
        result.children.push(parser.currentMultiLineComment);
        parser.currentMultiLineComment = null;
    }
    result.children.push(convertMeta(parser, meta));
    result.children.push(convertModifiers(parser, modifiers));
    result.children.push(signature[1]);
    result.children.push(signature[2]);
    result.children.push(signature[3]);
    if (tokIs(parser, Operators.SEMI_COLUMN)) {
        consume(parser, Operators.SEMI_COLUMN);
    } else {
        result.children.push(parseFunctionBlock(parser));
    }
    parser.currentFunctionNode = null;
    result.start = result.children.reduce((index:number, child:Node) => {
        return Math.min(index, child ? child.start : Infinity);
    }, result.start);
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result;
}

/**
 * tok is { exit tok is the first tok after }
 *
 * @throws TokenException
 * @throws TokenException
 */

function parseFunctionBlock(parser:AS3Parser):Node {
    let block:Node = new Node(NodeKind.BLOCK, parser.tok.index, -1);

    parser.currentFunctionNode = block;

    parseBlock(parser, block);

    return block;
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

/**
 * tok is function exit tok is the first token after the optional ;
 *
 * @throws TokenException
 */
function parseFunctionSignature(parser:AS3Parser):Node {
    let signature:Node[] = doParseSignature(parser);
    skip(parser, Operators.SEMI_COLUMN);
    let result:Node = new Node(
        findFunctionTypeFromSignature(parser, signature), signature[0].start,
        -1, signature[0].text
    );
    result.children.push(signature[1]);
    result.children.push(signature[2]);
    result.children.push(signature[3]);
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result;
}

/**
 * tok is if
 *
 * @throws TokenException
 */
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

/**
 * tok is implements implements a,b,c exit tok is the first token after the
 * list of qualfied names
 *
 * @throws TokenException
 */
function parseImplementsList(parser:AS3Parser):Node {
    consume(parser, Keywords.IMPLEMENTS);
    let result:Node = new Node(NodeKind.IMPLEMENTS_LIST, parser.tok.index, -1);
    let index = parser.tok.index;
    let name = parseQualifiedName(parser, true);
    result.children.push(new Node(NodeKind.IMPLEMENTS, index, index + name.length, name));
    while (tokIs(parser, Operators.COMMA)) {
        nextToken(parser, true);
        let index = parser.tok.index;
        let name = parseQualifiedName(parser, true);
        result.children.push(new Node(NodeKind.IMPLEMENTS, index, index + name.length, name));
    }
    return result;
}

/**
 * tok is import
 *
 * @throws TokenException
 */
function parseImport(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.IMPORT);
    let name = parseImportName(parser);
    let result:Node = new Node(NodeKind.IMPORT, tok.index, tok.index + name.length, name);
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}

/**
 * tok is the first part of a name the last part can be a star exit tok is
 * the first token, which doesn't belong to the name
 *
 * @throws TokenException
 */
function parseImportName(parser:AS3Parser):string {
    let result = '';

    result += parser.tok.text;
    nextToken(parser);
    while (tokIs(parser, Operators.DOT)) {
        result += Operators.DOT;
        nextToken(parser); // .
        result += parser.tok.text;
        nextToken(parser); // part of name
    }
    return result;
}

function parseIncludeExpression(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.INCLUDE, parser.tok.index, -1);
    let tok:Token;
    if (tokIs(parser, Keywords.INCLUDE)) {
        tok = consume(parser, Keywords.INCLUDE);
    } else if (tokIs(parser, Keywords.INCLUDE_AS2)) {
        tok = consume(parser, Keywords.INCLUDE_AS2);
    }
    if (tok) {
        result.start = tok.index;
    }
    result.children.push(parseExpression(parser));
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, 0);
    return result;
}

function parseIncrement(parser:AS3Parser, node:Node):Node {
    nextToken(parser, true);
    let result:Node = new Node(NodeKind.POST_INC, node.start, parser.tok.end);
    result.children.push(node);
    return result;
}

/**
 * tok is interface
 *
 * @param meta
 * @param modifier
 * @throws TokenException
 */
function parseInterface(parser:AS3Parser, meta:Node[], modifier:Token[]):Node {
    let tok = consume(parser, Keywords.INTERFACE);
    let result:Node = new Node(NodeKind.INTERFACE, tok.index, -1);

    if (parser.currentAsDoc) {
        result.children.push(parser.currentAsDoc);
        parser.currentAsDoc = null;
    }
    if (parser.currentMultiLineComment) {
        result.children.push(parser.currentMultiLineComment);
        parser.currentMultiLineComment = null;
    }
    let name = parseQualifiedName(parser, true);
    result.children.push(new Node(NodeKind.NAME, parser.tok.index, parser.tok.index + name.length, name));

    result.children.push(convertMeta(parser, meta));
    result.children.push(convertModifiers(parser, modifier));

    if (tokIs(parser, Keywords.EXTENDS)) {
        nextToken(parser); // extends
        name = parseQualifiedName(parser, false);
        result.children.push(new Node(NodeKind.EXTENDS, parser.tok.index, parser.tok.index + name.length, name));
    }
    while (tokIs(parser, Operators.COMMA)) {
        nextToken(parser); // comma
        name = parseQualifiedName(parser, false);
        result.children.push(new Node(NodeKind.EXTENDS, parser.tok.index, parser.tok.index + name.length, name));
    }
    consume(parser, Operators.LEFT_CURLY_BRACKET);
    result.children.push(parseInterfaceContent(parser));
    tok = consume(parser, Operators.RIGHT_CURLY_BRACKET);
    result.end = tok.end;
    result.start = result.children.reduce((index:number, child:Node) => {
        return Math.min(index, child ? child.start : Infinity);
    }, tok.index);
    return result;
}

/**
 * tok is function
 *
 * @throws TokenException
 */
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

/**
 * tok is [ [id] [id ("test")] [id (name="test",type="a.b.c.Event")] exit
 * token is the first token after ]
 *
 * @throws TokenException
 */
function parseMetaData(parser:AS3Parser):Node {
    let buffer = '';

    let index = consume(parser, Operators.LEFT_SQUARE_BRACKET).index;
    while (!tokIs(parser, Operators.RIGHT_SQUARE_BRACKET)) {
        buffer += parser.tok.text;
        nextToken(parser);
    }
    let end = parser.tok.end;
    skip(parser, Operators.RIGHT_SQUARE_BRACKET);
    return new Node(NodeKind.META, index, end, '[' + buffer + ']');
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

function parseNamespaceName(parser:AS3Parser):string {
    let name:string = parser.tok.text;
    nextToken(parser); // simple name for now
    return name;
}

function parseNameTypeInit(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.NAME_TYPE_INIT, parser.tok.index, -1);
    result.children.push(new Node(NodeKind.NAME, parser.tok.index, parser.tok.end, parser.tok.text));
    nextToken(parser, true); // name
    result.children.push(parseOptionalType(parser));
    result.children.push(parseOptionalInit(parser));
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

/**
 * tok is {
     */
function parseObjectLiteral(parser:AS3Parser):Node {
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

/*
 * tok is name
 */
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

/**
 * if tok is "=" parse the expression otherwise do nothing
 *
 * @return
 */
function parseOptionalInit(parser:AS3Parser):Node {
    let result:Node = null;
    if (tokIs(parser, Operators.EQUAL)) {
        nextToken(parser, true);
        let index = parser.tok.index;
        let expr = parseExpression(parser);
        result = new Node(NodeKind.INIT, index, expr.end, null, [expr]);
    }
    return result;
}

/**
 * if tok is ":" parse the type otherwise do nothing
 *
 * @return
 * @throws TokenException
 */
function parseOptionalType(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.TYPE, parser.tok.index, parser.tok.index, '');
    if (tokIs(parser, Operators.COLUMN)) {
        nextToken(parser, true);
        result = parseType(parser);
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

/**
 * tok is package
 *
 * @throws UnExpectedTokenException
 */
function parsePackage(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.PACKAGE);
    let result:Node = new Node(NodeKind.PACKAGE, tok.index, -1);
    let nameBuffer = '';

    let index = parser.tok.index;
    while (!tokIs(parser, Operators.LEFT_CURLY_BRACKET)) {
        nameBuffer += parser.tok.text;
        nextToken(parser);
    }
    result.children.push(new Node(NodeKind.NAME, index, index + nameBuffer.length, nameBuffer));
    consume(parser, Operators.LEFT_CURLY_BRACKET);
    result.children.push(parsePackageContent(parser));
    tok = consume(parser, Operators.RIGHT_CURLY_BRACKET);
    result.end = tok.end;
    return result;
}

/**
 * tok is the name of a parameter or ...
 */
function parseParameter(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.PARAMETER, parser.tok.index, -1);
    if (tokIs(parser, Operators.REST_PARAMETERS)) {
        let index = parser.tok.index;
        nextToken(parser, true); // ...
        let rest:Node = new Node(NodeKind.REST, index, parser.tok.end, parser.tok.text);
        nextToken(parser, true); // rest
        result.children.push(rest);
    } else {
        result.children.push(parseNameTypeInit(parser));
    }
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, result.end);
    return result;
}

/**
 * tok is (
 *
 * @throws TokenException
 */
function parseParameterList(parser:AS3Parser):Node {
    let tok = consume(parser, Operators.LEFT_PARENTHESIS);

    let result:Node = new Node(NodeKind.PARAMETER_LIST, tok.index, -1);
    while (!tokIs(parser, Operators.RIGHT_PARENTHESIS)) {
        result.children.push(parseParameter(parser));
        if (tokIs(parser, Operators.COMMA)) {
            nextToken(parser, true);
        } else {
            break;
        }
    }
    tok = consume(parser, Operators.RIGHT_PARENTHESIS);
    result.end = tok.end;
    return result;
}

/**
 * tok is first part of the name exit tok is the first token after the name
 *
 * @throws TokenException
 */
function parseQualifiedName(parser:AS3Parser, skipPackage:boolean):string {
    let buffer = '';

    buffer += parser.tok.text;
    nextToken(parser);
    while (tokIs(parser, Operators.DOT) || tokIs(parser, Operators.DOUBLE_COLUMN)) {
        buffer += parser.tok.text;
        nextToken(parser);
        buffer += parser.tok.text;
        nextToken(parser); // name
    }

    if (skipPackage) {
        return buffer.substring(buffer.lastIndexOf(Operators.DOT) + 1);
    }
    return buffer;
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

/**
 * tok is switch
 *
 * @throws TokenException
 */
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

/**
 * tok is case, default or the first token of the first statement
 *
 * @throws TokenException
 */
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

/**
 * tok is { exit tok is }
 *
 * @throws TokenException
 */
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

/**
 * tok is ( for( var x : number = 0; i < length; i++ ) for( var s : string in
 * Object )
 *
 * @throws TokenException
 */
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

function parseTry(parser:AS3Parser):Node {
    let result:Node;
    let index = parser.tok.index;
    nextToken(parser, true);
    let block = parseBlock(parser);
    result = new Node(NodeKind.TRY, index, block.end, null, [block]);
    return result;
}

function parseType(parser:AS3Parser):Node {
    let result:Node;
    if (parser.tok.text === VECTOR) {
        result = parseVector(parser);
    } else {
        let index = parser.tok.index,
            name = parseQualifiedName(parser, true);
        result = new Node(NodeKind.TYPE, index, index + name.length, name);
        // nextToken(parser,  true );
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
    let node:Node = parseAccessExpresion(parser);

    if (tokIs(parser, Operators.INCREMENT)) {
        node = parseIncrement(parser, node);
    } else if (tokIs(parser, Operators.DECREMENT)) {
        node = parseDecrement(parser, node);
    }
    return node;
}

function parseAccessExpresion(parser:AS3Parser):Node {
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

function parseUse(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.USE);
    consume(parser, Keywords.NAMESPACE);
    let nameIndex = parser.tok.index;
    let namespace = parseNamespaceName(parser);
    let result:Node = new Node(NodeKind.USE, tok.index, nameIndex + namespace.length, namespace);
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}

function parseVar(parser:AS3Parser):Node {
    let result:Node;
    result = parseVarList(parser, null, null);
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}

/**
 * tok is var x, y : String, z : number = 0;
 *
 * @param modifiers
 * @param meta
 * @throws TokenException
 */
function parseVarList(parser:AS3Parser, meta:Node[], modifiers:Token[]):Node {
    let tok = consume(parser, Keywords.VAR);
    let result:Node = new Node(NodeKind.VAR_LIST, tok.index, tok.end);
    result.children.push(convertMeta(parser, meta));
    result.children.push(convertModifiers(parser, modifiers));
    collectVarListContent(parser, result);
    result.start = result.children.reduce((index:number, child:Node) => {
        return Math.min(index, child ? child.start : Infinity);
    }, tok.index);
    result.end = result.children.reduce((index:number, child:Node) => {
        return Math.max(index, child ? child.end : 0);
    }, tok.end);
    return result;
}

function parseVector(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.VECTOR, parser.tok.index, -1, '');
    if (parser.tok.text === VECTOR) {
        nextToken(parser);
    }
    consume(parser, Operators.VECTOR_START);

    result.children.push(parseType(parser));

    result.end = consume(parser, Operators.SUPERIOR).end;

    return result;
}

function parseShortVector(parser:AS3Parser):Node {
    let vector:Node = new Node(NodeKind.VECTOR, parser.tok.index, -1, '');
    consume(parser, Operators.INFERIOR);
    vector.children.push(parseType(parser));
    vector.end = consume(parser, Operators.SUPERIOR).end;

    let arrayLiteral = parseArrayLiteral(parser);

    return new Node(NodeKind.SHORT_VECTOR, vector.start, arrayLiteral.end, null, [vector, arrayLiteral]);
}

/**
 * tok is while
 *
 * @throws TokenException
 */
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


/**
 * Skip the current token, if it equals to the parameter
 *
 * @param text
 * @throws UnExpectedTokenException
 */
function skip(parser:AS3Parser, text:string):void {
    if (tokIs(parser, text)) {
        nextToken(parser);
    }
}

/**
 * Compare the current token to the parameter
 *
 * @param text
 * @return true, if tok's text property equals the parameter
 */
function tokIs(parser:AS3Parser, text:string):boolean {
    return parser.tok.text === text;
}

function tryToParseCommentNode(parser:AS3Parser, result:Node, modifiers:Token[]):void {
    if (startsWith(parser.tok.text, ASDOC_COMMENT)) {
        parser.currentAsDoc = new Node(NodeKind.AS_DOC, parser.tok.index, -1, parser.tok.text);
        nextToken(parser);
    } else if (startsWith(parser.tok.text, MULTIPLE_LINES_COMMENT)) {
        result.children.push(new Node(NodeKind.MULTI_LINE_COMMENT, parser.tok.index, -1, parser.tok.text));
        nextToken(parser);
    } else {
        if (modifiers) {
            modifiers.push(parser.tok);
        }
        nextTokenIgnoringDocumentation(parser);
    }
}

export function parse(filePath:string, content:string):Node {
    let parser = new AS3Parser();
    return parser.buildAst(filePath, content);
}
