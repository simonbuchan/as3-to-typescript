import Node from '../syntax/node';
import NodeKind from '../syntax/nodeKind';
import Token from './token';
import * as Keywords from '../syntax/keywords';
import * as Operators from '../syntax/operators';
import {startsWith} from '../string';
import AS3Parser, {nextToken, nextTokenIgnoringDocumentation, consume, skip, tokIs} from './parser';
import {parseQualifiedName, parseBlock, parseParameterList, parseNameTypeInit} from './parse-common';
import {ASDOC_COMMENT, MULTIPLE_LINES_COMMENT} from './parser';
import {parseExpression} from './parse-expressions';
import {parseOptionalType} from './parse-types';


/**
 * tok is empty, since nextToken has not been called before
 */
export function parseCompilationUnit(parser:AS3Parser):Node {
    let result:Node = new Node(NodeKind.COMPILATION_UNIT, -1, -1);

    nextTokenIgnoringDocumentation(parser);
    if (tokIs(parser, Keywords.PACKAGE)) {
        result.children.push(parsePackage(parser));
    }
    result.children.push(parsePackageContent(parser));
    return result;
}


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


function parseUse(parser:AS3Parser):Node {
    let tok = consume(parser, Keywords.USE);
    consume(parser, Keywords.NAMESPACE);
    let nameIndex = parser.tok.index;
    let namespace = parseNamespaceName(parser);
    let result:Node = new Node(NodeKind.USE, tok.index, nameIndex + namespace.length, namespace);
    skip(parser, Operators.SEMI_COLUMN);
    return result;
}


function parseNamespaceName(parser:AS3Parser):string {
    let name:string = parser.tok.text;
    nextToken(parser); // simple name for now
    return name;
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


function parseClassConstant(parser:AS3Parser, result:Node, modifiers:Token[], meta:Node[]):void {
    result.children.push(parseConstList(parser, meta, modifiers));
    if (tokIs(parser, Operators.SEMI_COLUMN)) {
        nextToken(parser);
    }
    meta.length = 0;
    modifiers.length = 0;
}


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


function parseClassFunctions(parser:AS3Parser, result:Node, modifiers:Token[], meta:Node[]):void {
    result.children.push(parseFunction(parser, meta, modifiers));
    meta.length = 0;
    modifiers.length = 0;
}


function parseFunction(parser:AS3Parser, meta:Node[], modifiers:Token[]):Node {
    let signature:Node[] = doParseSignature(parser);
    let result:Node = new Node(
        findFunctionTypeFromSignature(signature),
        signature[0].start, -1, signature[0].text);

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


function parseFunctionSignature(parser:AS3Parser):Node {
    let signature:Node[] = doParseSignature(parser);
    skip(parser, Operators.SEMI_COLUMN);
    let result:Node = new Node(
        findFunctionTypeFromSignature(signature), signature[0].start,
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


function findFunctionTypeFromSignature(signature:Node[]):NodeKind {
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


function parseFunctionBlock(parser:AS3Parser):Node {
    let block:Node = new Node(NodeKind.BLOCK, parser.tok.index, -1);

    parser.currentFunctionNode = block;

    parseBlock(parser, block);

    return block;
}


export function parseVarList(parser:AS3Parser, meta:Node[], modifiers:Token[]):Node {
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


export function parseConstList(parser:AS3Parser, meta:Node[], modifiers:Token[]):Node {
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


function collectVarListContent(parser:AS3Parser, result:Node):Node {
    result.children.push(parseNameTypeInit(parser));
    while (tokIs(parser, Operators.COMMA)) {
        nextToken(parser, true);
        result.children.push(parseNameTypeInit(parser));
    }
    return result;
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

