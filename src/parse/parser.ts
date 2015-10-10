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


const ASDOC_COMMENT = "/**";
const MULTIPLE_LINES_COMMENT = "/*";
const NEW_LINE = "\n";
const SINGLE_LINE_COMMENT = "//";
const VECTOR = "Vector";


/**
 * @author xagnetti
 */
export default class AS3Parser {
    private sourceFile: SourceFile;

    private currentAsDoc: Node;
    private currentFunctionNode: Node;
    private currentMultiLineComment: Node;
    private isInFor: boolean;
    private scn: AS3Scanner;
    private tok: Token;

    constructor() {
        this.isInFor = false;
    }

    public buildAst(filePath: string, content: string): Node {
        this.sourceFile = new SourceFile(content, filePath);
        this.scn = new AS3Scanner();
        this.scn.setContent(content);
        return this.parseCompilationUnit();
    }


    private nextToken(ignoreDocumentation: boolean= false): void {
        do {
            if (ignoreDocumentation) {
                this.nextTokenIgnoringDocumentation();
            }
            else {
                this.nextTokenAllowNewLine();
            }
        }
        while (this.tok.text === NEW_LINE);
    }
    
    private tryParse<T>(func: () => T): T {
        let checkPoint = this.scn.getCheckPoint();
        try {
            return func();
        } catch(e) {
            this.scn.rewind(checkPoint);
            return null;
        }
    }


    /**
     * tok is first content token
     * 
     * @throws TokenException
     */
    private parseClassContent(): Node {
        let result: Node = new Node(NodeKind.CONTENT, this.tok.index, -1);
        let modifiers: Token[] = [];
        let meta: Node[] = [];

        while (!this.tokIs(Operators.RIGHT_CURLY_BRACKET)) {
            if (this.tokIs(Operators.LEFT_CURLY_BRACKET)) {
                result.children.push(this.parseBlock());
            }
            if (this.tokIs(Operators.LEFT_SQUARE_BRACKET)) {
                meta.push(this.parseMetaData());
            }
            else if (this.tokIs(Keywords.VAR)) {
                this.parseClassField(result, modifiers, meta);
            }
            else if (this.tokIs(Keywords.CONST)) {
                this.parseClassConstant(result, modifiers, meta);
            }
            else if (this.tokIs(Keywords.IMPORT)) {
                result.children.push(this.parseImport());
            }
            else if (this.tokIs(Keywords.INCLUDE) || this.tokIs(Keywords.INCLUDE_AS2)) {
                result.children.push(this.parseIncludeExpression());
            }
            else if (this.tokIs(Keywords.FUNCTION)) {
                this.parseClassFunctions(result, modifiers, meta);
            }
            else {
                this.tryToParseCommentNode(result, modifiers);
            }
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result;
    }

    /**
     * tok is empty, since nextToken has not been called before
     * 
     * @throws UnExpectedTokenException
     */
    private parseCompilationUnit(): Node {
        let result: Node = new Node(NodeKind.COMPILATION_UNIT, -1, -1);

        this.nextTokenIgnoringDocumentation();
        if (this.tokIs(Keywords.PACKAGE)) {
            result.children.push(this.parsePackage());
        }
        result.children.push(this.parsePackageContent());
        return result;
    }

    /**
     * @return
     * @throws TokenException
     */
    private parseExpression(): Node {
        return this.parseAssignmentExpression();
    }

    /**
     * tok is first content token
     * 
     * @throws TokenException
     */
    private parseInterfaceContent(): Node {
        let result: Node = new Node(NodeKind.CONTENT, this.tok.index, -1);

        while (!this.tokIs(Operators.RIGHT_CURLY_BRACKET)) {
            if (this.tokIs(Keywords.IMPORT)) {
                result.children.push(this.parseImport());
            }
            else if (this.tokIs(Keywords.FUNCTION)) {
                result.children.push(this.parseFunctionSignature());
            }
            else if (this.tokIs(Keywords.INCLUDE) || this.tokIs(Keywords.INCLUDE_AS2)) {
                result.children.push(this.parseIncludeExpression());
            }
            else if (this.tokIs(Operators.LEFT_SQUARE_BRACKET)) {
                while (!this.tokIs(Operators.RIGHT_SQUARE_BRACKET)) {
                    this.nextToken();
                }
                this.nextToken();
            }
            else {
                this.tryToParseCommentNode(result, null);
            }
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result;
    }

    /**
     * tok is first token of content
     * 
     * @throws UnExpectedTokenException
     */
    private parsePackageContent(): Node {
        let result: Node = new Node(NodeKind.CONTENT, this.tok.index, -1);
        let modifiers: Token[] = [];
        let meta: Node[] = [];

        while (!this.tokIs(Operators.RIGHT_CURLY_BRACKET) && !this.tokIs(Keywords.EOF)) {
            if (this.tokIs(Keywords.IMPORT)) {
                result.children.push(this.parseImport());
            }
            else if (this.tokIs(Keywords.USE)) {
                result.children.push(this.parseUse());
            }
            else if (this.tokIs(Keywords.INCLUDE) || this.tokIs(Keywords.INCLUDE_AS2)) {
                result.children.push(this.parseIncludeExpression());
            }
            else if (this.tokIs(Operators.LEFT_SQUARE_BRACKET)) {
                meta.push(this.parseMetaData());
            }
            else if (this.tokIs(Keywords.CLASS)) {
                result.children.push(this.parseClass(meta, modifiers));
                modifiers.length = 0;
                meta.length = 0;
            }
            else if (this.tokIs(Keywords.INTERFACE)) {
                result.children.push(this.parseInterface(meta, modifiers));
                modifiers.length = 0;
                meta.length = 0;
            }
            else if (this.tokIs(Keywords.FUNCTION)) {
                this.parseClassFunctions(result, modifiers, meta);
            }
            else if (startsWith(this.tok.text, ASDOC_COMMENT)) {
                this.currentAsDoc = new Node(NodeKind.AS_DOC, this.tok.index,
                    this.tok.index + this.tok.index - 1, this.tok.text);
                this.nextToken();
            }
            else if (startsWith(this.tok.text, MULTIPLE_LINES_COMMENT)) {
                this.currentMultiLineComment = new Node(NodeKind.MULTI_LINE_COMMENT, this.tok.index,
                    this.tok.index + this.tok.index - 1, this.tok.text);
                this.nextToken();
            }
            else {
                modifiers.push(this.tok);
                this.nextTokenIgnoringDocumentation();
            }
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result;
    }

    /**
     * @return
     * @throws TokenException
     */
    private parsePrimaryExpression(): Node {
        let result:Node;
        
        if (this.tokIs(Operators.LEFT_SQUARE_BRACKET)) {
            return this.parseArrayLiteral();
        } else if (this.tokIs(Operators.LEFT_CURLY_BRACKET)) {
            return this.parseObjectLiteral();
        } else if (this.tokIs(Keywords.FUNCTION)) {
            return this.parseLambdaExpression();
        } else if (this.tokIs(Keywords.NEW)) {
            return this.parseNewExpression();
        } else if (this.tokIs(Operators.LEFT_PARENTHESIS)) {
            return this.parseEncapsulatedExpression();
        } else if (this.tok.text === 'Vector') {
            return this.parseVector();
        } else if (this.tokIs(Operators.INFERIOR)) {
            let res = this.tryParse(() => this.parseShortVector());
            if (res) {
                return res;
            }
        }
        
        if (this.tok.text === '/' || this.tok.text === '/=') {
            let tok = this.scn.scanRegExp();
            if (tok) {
                this.nextToken(true);
                return new Node(NodeKind.LITERAL, tok.index, tok.end, tok.text)
            }
        }

        if (this.tok.isXML) {
            result = new Node(NodeKind.XML_LITERAL, this.tok.index, this.tok.end, this.tok.text);
        }
        else if (this.tok.isNumeric || /('|")/.test(this.tok.text[0])) {
            result = new Node(NodeKind.LITERAL, this.tok.index, this.tok.end, this.tok.text);
        } else {
            result = new Node(NodeKind.IDENTIFIER,  this.tok.index, this.tok.end, this.tok.text);
        }
        this.nextToken(true);
        return result;
    }

    /**
     * tok is the first token of a statement
     * 
     * @throws TokenException
     */
    private parseStatement(): Node {
        let result: Node;

        if (this.tokIs(Keywords.FOR)) {
            result = this.parseFor();
        }
        else if (this.tokIs(Keywords.IF)) {
            result = this.parseIf();
        }
        else if (this.tokIs(Keywords.SWITCH)) {
            result = this.parseSwitch();
        }
        else if (this.tokIs(Keywords.DO)) {
            result = this.parseDo();
        }
        else if (this.tokIs(Keywords.WHILE)) {
            result = this.parseWhile();
        }
        else if (this.tokIs(Keywords.TRY)) {
            result = this.parseTry();
        }
        else if (this.tokIs(Keywords.CATCH)) {
            result = this.parseCatch();
        }
        else if (this.tokIs(Keywords.FINALLY)) {
            result = this.parseFinally();
        }
        else if (this.tokIs(Operators.LEFT_CURLY_BRACKET)) {
            result = this.parseBlock();
        }
        else if (this.tokIs(Keywords.VAR)) {
            result = this.parseVar();
        }
        else if (this.tokIs(Keywords.CONST)) {
            result = this.parseConst();
        }
        else if (this.tokIs(Keywords.RETURN)) {
            result = this.parseReturnStatement();
        }
        else if (this.tokIs(Keywords.THROW)) {
            result = this.parseThrowStatement();
        }
        else if (this.tokIs(Keywords.BREAK) || this.tokIs(Keywords.CONTINUE)) {
            result = this.parseBreakOrContinueStatement();
        }
        else if (this.tokIs(Operators.SEMI_COLUMN)) {
            result = this.parseEmptyStatement();
        }
        else {
            result = this.parseExpressionList();
            this.skip(Operators.SEMI_COLUMN);
        }
        return result;
    }

    /**
     * @return
     * @throws TokenException
     */
    private parseUnaryExpression(): Node {
        let result: Node,
            index = this.tok.index;
        if (this.tokIs(Operators.INCREMENT)) {
            this.nextToken();
            result = new Node(NodeKind.PRE_INC, this.tok.index, index, null, [this.parseUnaryExpression()]);
        }
        else if (this.tokIs(Operators.DECREMENT)) {
            this.nextToken();
            result = new Node(NodeKind.PRE_DEC, this.tok.index, index, null, [this.parseUnaryExpression()]);
        }
        else if (this.tokIs(Operators.MINUS)) {
            this.nextToken();
            result = new Node(NodeKind.MINUS, this.tok.index, index, null, [this.parseUnaryExpression()]);
        }
        else if (this.tokIs(Operators.PLUS) || this.tokIs(Operators.PLUS_AS2)) {
            this.nextToken();
            result = new Node(NodeKind.PLUS, this.tok.index, index, null, [this.parseUnaryExpression()]);
        }
        else {
            return this.parseUnaryExpressionNotPlusMinus();
        }
        return result;
    }

    private collectVarListContent(result: Node): Node {
        result.children.push(this.parseNameTypeInit());
        while (this.tokIs(Operators.COMMA)) {
            this.nextToken(true);
            result.children.push(this.parseNameTypeInit());
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
    consume(text: string): Token {
        while (startsWith(this.tok.text, "//")) {
            this.nextToken();
        }

        if (!this.tokIs(text)) {
            /*throw new UnExpectedTokenException(this.tok.text,
                new Position(this.tok.index, this.tok.getColumn()),
                fileName,
                text);*/
            
            let pos = this.sourceFile.getLineAndCharacterFromPosition(this.tok.index);
            let msg = `unexpected token : ${this.tok.text}(${pos.line},${pos.col}) in file ${this.sourceFile.path} expected: ${text}`;
            throw new Error(msg);
        }
        let result = this.tok;
        this.nextToken();
        return result;
    }

    private convertMeta(metadataList: Node[]): Node {
        if (metadataList == null || metadataList.length === 0) {
            return null;
        }

        let result: Node = new Node(NodeKind.META_LIST, this.tok.index, -1);
        result.children = metadataList ? metadataList.slice(0) : [];
        if (result.lastChild) { result.end = result.lastChild.end }
        result.start = result.children.reduce((index: number, child: Node) => {
            return Math.min(index, child ? child.start : Infinity);
        }, result.start);
        return result;
    }

    private convertModifiers(modifierList: Token[]): Node {
        if (modifierList == null) {
            return null;
        }

        let result: Node = new Node(NodeKind.MOD_LIST, this.tok.index, -1);

        let end = this.tok.index;
        result.children = modifierList.map(tok => {
            end = tok.index + tok.text.length;
            return new Node(NodeKind.MODIFIER, tok.index, end, tok.text)
        });
        result.end = end;
        result.start = result.children.reduce((index: number, child: Node) => {
            return Math.min(index, child ? child.start : Infinity);
        }, result.start);
        return result;
    }

    private doParseSignature(): Node[] {
        let tok = this.consume(Keywords.FUNCTION);
        let type: Node = new Node(NodeKind.TYPE, tok.index, tok.end, Keywords.FUNCTION);
        if (this.tokIs(Keywords.SET) || this.tokIs(Keywords.GET)) {
            type = new Node(NodeKind.TYPE, tok.index, this.tok.end, this.tok.text);
            this.nextToken(); // set or get
        }
        let name: Node = new Node(NodeKind.NAME, this.tok.index, this.tok.end, this.tok.text);
        this.nextToken(); // name
        let params: Node = this.parseParameterList();
        let returnType: Node = this.parseOptionalType();
        return [type, name, params, returnType];
    }

    private findFunctionTypeFromSignature(signature: Node[]): NodeKind {
        for (let i = 0; i < signature.length; i++) {
            let node = signature[i];
            if (node.kind === NodeKind.TYPE) {
                if (node.text === "set") {
                    return NodeKind.SET;
                }
                if (node.text === "get") {
                    return NodeKind.GET;
                }
                return NodeKind.FUNCTION;
            }
        }
        return NodeKind.FUNCTION;
    }

    /**
     * Get the next token Skip comments but keep newlines We need this method for
     * beeing able to decide if a returnStatement has an expression
     * 
     * @throws UnExpectedTokenException
     */
    private nextTokenAllowNewLine(): void {
        do {
            this.tok = this.scn.nextToken();

            if (this.tok == null) {
                throw new Error(this.sourceFile.path); //TODO NullTokenException(fileName);

            }
            if (this.tok.text == null) {
                 throw new Error(this.sourceFile.path); //TODO throw new NullTokenException(fileName);
            }
        }
        while (startsWith(this.tok.text, SINGLE_LINE_COMMENT));
    }

    private nextTokenIgnoringDocumentation(): void {
        do {
            this.nextToken();
        }
        while (startsWith(this.tok.text, MULTIPLE_LINES_COMMENT));
    }

    private parseAdditiveExpression(): Node {
        let result: Node = new Node(NodeKind.ADD, this.tok.index, this.tok.end, null, [this.parseMultiplicativeExpression()]);
        while (this.tokIs(Operators.PLUS) || this.tokIs(Operators.PLUS_AS2) || this.tokIs(Operators.MINUS)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseMultiplicativeExpression());
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result.children.length > 1 ? result : result.lastChild;
    }

    // ------------------------------------------------------------------------
    // language specific recursive descent parsing
    // ------------------------------------------------------------------------

    private parseAndExpression(): Node {
        let result: Node = new Node(NodeKind.AND, this.tok.index, this.tok.end, null, [this.parseBitwiseOrExpression()]);
        while (this.tokIs(Operators.AND) || this.tokIs(Operators.AND_AS2)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseBitwiseOrExpression());
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result.children.length > 1 ? result : result.lastChild;
    }

    /**
     * tok is ( exit tok is first token after )
     */
    private parseArgumentList(): Node {
        let tok = this.consume(Operators.LEFT_PARENTHESIS);
        let result: Node = new Node(NodeKind.ARGUMENTS, tok.index, -1);
        while (!this.tokIs(Operators.RIGHT_PARENTHESIS)) {
            result.children.push(this.parseExpression());
            this.skip(Operators.COMMA);
        }
        tok = this.consume(Operators.RIGHT_PARENTHESIS);
        result.end = tok.end;
        return result;
    }

    private parseArrayAccessor(node: Node): Node {
        let result: Node = new Node(NodeKind.ARRAY_ACCESSOR, node.start, -1);
        result.children.push(node);
        while (this.tokIs(Operators.LEFT_SQUARE_BRACKET)) {
            this.nextToken(true);
            result.children.push(this.parseExpression());
            result.end = this.consume(Operators.RIGHT_SQUARE_BRACKET).end;
        }
        return result;
    }

    /**
     * tok is [
     */
    private parseArrayLiteral(): Node {
        let tok = this.consume(Operators.LEFT_SQUARE_BRACKET);
        let result: Node = new Node(NodeKind.ARRAY, tok.index, -1);
        while (!this.tokIs(Operators.RIGHT_SQUARE_BRACKET)) {
            result.children.push(this.parseExpression());
            this.skip(Operators.COMMA);
        }
        result.end = this.consume(Operators.RIGHT_SQUARE_BRACKET).end;
        return result;
    }

    private parseAssignmentExpression(): Node {
        let result: Node = new Node(NodeKind.ASSIGN, this.tok.index, this.tok.end, null, [this.parseConditionalExpression()]);
        while (this.tokIs(Operators.EQUAL)
            || this.tokIs(Operators.PLUS_EQUAL) || this.tokIs(Operators.MINUS_EQUAL)
            || this.tokIs(Operators.TIMES_EQUAL) || this.tokIs(Operators.DIVIDED_EQUAL)
            || this.tokIs(Operators.MODULO_EQUAL) || this.tokIs(Operators.AND_EQUAL) || this.tokIs(Operators.OR_EQUAL)
            || this.tokIs(Operators.XOR_EQUAL)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseExpression());
        }
        if (result.lastChild) { 
            result.end = result.lastChild.end;
        }
        return result.children.length > 1 ? result : result.lastChild;
    }

    private parseBitwiseAndExpression(): Node {
        let result: Node = new Node(NodeKind.B_AND, this.tok.index, this.tok.end, this.tok.text, [this.parseEqualityExpression()]);
        while (this.tokIs(Operators.B_AND)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseEqualityExpression());
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result.children.length > 1 ? result : result.lastChild;
    }

    private parseBitwiseOrExpression(): Node {
        let result: Node = new Node(NodeKind.B_OR, this.tok.index, this.tok.end, this.tok.text, [this.parseBitwiseXorExpression()]);
        while (this.tokIs(Operators.B_OR)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseBitwiseXorExpression());
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result.children.length > 1 ? result : result.lastChild;
    }

    private parseBitwiseXorExpression(): Node {
        let result: Node = new Node(NodeKind.B_XOR, this.tok.index, this.tok.end, this.tok.text, [this.parseBitwiseAndExpression()]);
        while (this.tokIs(Operators.B_XOR)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseBitwiseAndExpression());
        }
        if (result.lastChild) { result.end = result.lastChild.end }
        return result.children.length > 1 ? result : result.lastChild;
    }


    private parseBlock(result?: Node): Node {

        let tok = this.consume(Operators.LEFT_CURLY_BRACKET);
        if (!result) {
            result = new Node(NodeKind.BLOCK, tok.index, this.tok.end)
        } else {
            result.start = tok.index;
        }
        while (!this.tokIs(Operators.RIGHT_CURLY_BRACKET)) {
            if (startsWith(this.tok.text, MULTIPLE_LINES_COMMENT)) {
                this.currentFunctionNode.children.push(
                    new Node(NodeKind.MULTI_LINE_COMMENT, this.tok.index, this.tok.end, this.tok.text)
                    );
                this.nextToken();
            }
            else {
                result.children.push(this.parseStatement());
            }
        }
        result.end = this.consume(Operators.RIGHT_CURLY_BRACKET).end;
        return result;
    }

    /**
     * tok is catch
     * 
     * @throws TokenException
     */
    private parseCatch(): Node {
        let tok = this.consume(Keywords.CATCH);
        this.consume(Operators.LEFT_PARENTHESIS);
        let result: Node = new Node(NodeKind.CATCH, tok.index, tok.end, null, [
            new Node(NodeKind.NAME, this.tok.index, this.tok.end, this.tok.text)
        ]);
        this.nextToken(true); // name
        if (this.tokIs(Operators.COLUMN)) {
            this.nextToken(true); // :
            result.children.push(new Node(NodeKind.TYPE, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true); // type
        }
        this.consume(Operators.RIGHT_PARENTHESIS);
        let parseBlock = this.parseBlock();
        result.children.push(parseBlock);
        result.end = parseBlock.end;
        return result;
    }

    /**
     * tok is class
     * 
     * @param meta
     * @param modifier
     * @throws TokenException
     */
    private parseClass(meta: Node[], modifier: Token[]): Node {
        let tok = this.consume(Keywords.CLASS);
        let result: Node = new Node(NodeKind.CLASS, tok.index, tok.end);

        if (this.currentAsDoc != null) {
            result.children.push(this.currentAsDoc);
            this.currentAsDoc = null;
        }
        if (this.currentMultiLineComment != null) {
            result.children.push(this.currentMultiLineComment);
            this.currentMultiLineComment = null;
        }

        let index = this.tok.index,
            name = this.parseQualifiedName(true);
        result.children.push(new Node(NodeKind.NAME, index, index + name.length, name));

        result.children.push(this.convertMeta(meta));
        result.children.push(this.convertModifiers(modifier));

        // this.nextToken( true ); // name

        do {
            if (this.tokIs(Keywords.EXTENDS)) {
                this.nextToken(true); // extends
                index = this.tok.index;
                name = this.parseQualifiedName(false);
                result.children.push(new Node(NodeKind.EXTENDS, index, index + name.length, name));
            }
            else if (this.tokIs(Keywords.IMPLEMENTS)) {
                result.children.push(this.parseImplementsList());
            }
        }
        while (!this.tokIs(Operators.LEFT_CURLY_BRACKET));
        this.consume(Operators.LEFT_CURLY_BRACKET);
        result.children.push(this.parseClassContent());
        tok = this.consume(Operators.RIGHT_CURLY_BRACKET);

        result.end = tok.end;
        result.start = result.children.reduce((index: number, child: Node) => {
            return Math.min(index, child ? child.start : Infinity);
        }, index);

        return result;
    }

    private parseClassConstant(result: Node, modifiers: Token[], meta: Node[]): void {
        result.children.push(this.parseConstList(meta, modifiers));
        if (this.tokIs(Operators.SEMI_COLUMN)) {
            this.nextToken();
        }
        meta.length = 0;
        modifiers.length = 0;
    }

    private parseClassField(result: Node, modifiers: Token[], meta: Node[]): void {
        let varList: Node = this.parseVarList(meta, modifiers);
        result.children.push(varList);
        if (this.currentAsDoc != null) {
            varList.children.push(this.currentAsDoc);
            this.currentAsDoc = null;
        }
        if (this.currentMultiLineComment != null) {
            result.children.push(this.currentMultiLineComment);
            this.currentMultiLineComment = null;
        }
        if (this.tokIs(Operators.SEMI_COLUMN)) {
            this.nextToken();
        }
        meta.length = 0;
        modifiers.length = 0;
    }

    private parseClassFunctions(result: Node, modifiers: Token[], meta: Node[]): void {
        result.children.push(this.parseFunction(meta, modifiers));
        meta.length = 0;
        modifiers.length = 0;
        
    }

    /**
     * tok is (
     * 
     * @throws TokenException
     */
    private parseCondition(): Node {
        let tok = this.consume(Operators.LEFT_PARENTHESIS);
        let result: Node = new Node(NodeKind.CONDITION, tok.index, -1, null, [this.parseExpression()]);
        tok = this.consume(Operators.RIGHT_PARENTHESIS);
        result.end = tok.end;
        return result;
    }

    private parseConditionalExpression(): Node {
        let result: Node = this.parseOrExpression();
        if (this.tokIs(Operators.QUESTION_MARK)) {
            let conditional: Node = new Node(NodeKind.CONDITIONAL, result.start, -1, null, [result]);
            this.nextToken(true); // ?
            conditional.children.push(this.parseExpression());
            this.nextToken(true); // :
            conditional.children.push(this.parseExpression());
            conditional.end = conditional.lastChild.start;
            return conditional;
        }
        return result;
    }

    private parseConst(): Node {
        let result = this.parseConstList(null, null);
        this.skip(Operators.SEMI_COLUMN);
        return result;
    }

    /**
     * tok is const
     * 
     * @param modifiers
     * @param meta
     * @throws TokenException
     */
    private parseConstList(meta: Node[], modifiers: Token[]): Node {
        let tok = this.consume(Keywords.CONST);
        let result: Node = new Node(NodeKind.CONST_LIST, tok.index, -1);
        result.children.push(this.convertMeta(meta));
        result.children.push(this.convertModifiers(modifiers));
        this.collectVarListContent(result);

        result.start = result.children.reduce((index: number, child: Node) => {
            return Math.min(index, child ? child.start : Infinity);
        }, tok.index);
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, 0);

        return result;
    }

    private parseDecrement(node: Node): Node {
        this.nextToken(true);
        let result: Node = new Node(NodeKind.POST_DEC, node.start, this.tok.end);
        result.children.push(node);
        result.end = node.end;
        return result;
    }

    /**
     * tok is do
     * 
     * @throws TokenException
     */
    private parseDo(): Node {
        let tok = this.consume(Keywords.DO);
        let result: Node = new Node(NodeKind.DO, tok.index, -1, null, [this.parseStatement()]);
        this.consume(Keywords.WHILE);
        let cond = this.parseCondition();
        result.children.push(cond);
        result.end = cond.end;
        if (this.tokIs(Operators.SEMI_COLUMN)) {
            this.nextToken(true);
        }
        return result;
    }

    private parseDot(node: Node): Node {
        this.nextToken();
        if (this.tokIs(Operators.LEFT_PARENTHESIS)) {
            this.nextToken();
            let result: Node = new Node(NodeKind.E4X_FILTER, this.tok.index, -1);
            result.children.push(node);
            result.children.push(this.parseExpression());
            result.end = this.consume(Operators.RIGHT_PARENTHESIS).end;
            return result;
        }
        else if (this.tokIs(Operators.TIMES)) {
            let result: Node = new Node(NodeKind.E4X_STAR, this.tok.index, -1);
            result.children.push(node);
            result.end = node.end;
            return result;
        }
        let result: Node = new Node(NodeKind.DOT, node.start, -1);
        result.children.push(node);
        result.children.push(new Node(NodeKind.LITERAL, this.tok.index, this.tok.end, this.tok.text));
        this.nextToken(true);
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, 0);
        return result;
    }

    private parseEmptyStatement(): Node {
        let result: Node;
        result = new Node(NodeKind.STMT_EMPTY, this.tok.index, this.tok.end, Operators.SEMI_COLUMN);
        this.nextToken(true);
        return result;
    }

    private parseEncapsulatedExpression(): Node {
        let tok = this.consume(Operators.LEFT_PARENTHESIS);
        let result: Node = new Node(NodeKind.ENCAPSULATED, tok.index, -1);
        result.children.push(this.parseExpressionList());
        tok = this.consume(Operators.RIGHT_PARENTHESIS);
        result.end = tok.end;
        return result;
    }

    private parseEqualityExpression(): Node {
        let result: Node = new Node(NodeKind.EQUALITY, this.tok.index, -1, null, [this.parseRelationalExpression()]);
        while (
            this.tokIs(Operators.DOUBLE_EQUAL) || this.tokIs(Operators.DOUBLE_EQUAL_AS2) ||
            this.tokIs(Operators.STRICTLY_EQUAL) || this.tokIs(Operators.NON_EQUAL) ||
            this.tokIs(Operators.NON_EQUAL_AS2_1) || this.tokIs(Operators.NON_EQUAL_AS2_2) ||
            this.tokIs(Operators.NON_STRICTLY_EQUAL)
            ) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseRelationalExpression());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, 0);
        return result.children.length > 1 ? result : result.children[0];
    }

    private parseExpressionList(): Node {
        let result: Node = new Node(NodeKind.EXPR_LIST, this.tok.index, -1, null, [this.parseAssignmentExpression()]);
        while (this.tokIs(Operators.COMMA)) {
            this.nextToken(true);
            result.children.push(this.parseAssignmentExpression());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, 0);
        return result.children.length > 1 ? result : result.children[0];
    }

    private parseFinally(): Node {
        let result: Node;
        let index = this.tok.index;
        this.nextToken(true);
        let block = this.parseBlock();
        result = new Node(NodeKind.FINALLY, index, block.end, null, [block]);
        return result;
    }

    /**
     * tok is for
     * 
     * @throws TokenException
     */
    private parseFor(): Node {
        let tok = this.consume(Keywords.FOR);

        if (this.tokIs(Keywords.EACH)) {
            this.nextToken();
            return this.parseForEach(tok.index);
        }
        else {
            return this.parseTraditionalFor(tok.index);
        }
    }

    /**
     * tok is ( for each( var obj : Type in List )
     * 
     * @throws TokenException
     */
    private parseForEach(index: number): Node {
        this.consume(Operators.LEFT_PARENTHESIS);

        let result: Node = new Node(NodeKind.FOREACH, index, -1);
        if (this.tokIs(Keywords.VAR)) {
            let node: Node = new Node(NodeKind.VAR, this.tok.index, -1);
            this.nextToken();
            let child = this.parseNameTypeInit();
            node.children.push(child);
            node.end = child.end;
            result.children.push(node);
        }
        else {
            result.children.push(new Node(NodeKind.NAME, this.tok.index, this.tok.end, this.tok.text));
            // names allowed?
            this.nextToken();
        }
        index = this.tok.index;
        this.nextToken(); // in
        let expr = this.parseExpression();
        result.children.push(new Node(NodeKind.IN, index, expr.end, null, [expr]));
        this.consume(Operators.RIGHT_PARENTHESIS);
        let statement = this.parseStatement();
        result.children.push(statement);
        result.end = statement.end;
        return result;
    }

    private parseForIn(result: Node): Node {
        let index = this.tok.index;
        this.nextToken();
        let expr = this.parseExpression();
        result.children.push(new Node(NodeKind.IN, index, expr.end, null, [expr]));
        result.kind = NodeKind.FORIN;
        this.consume(Operators.RIGHT_PARENTHESIS);
        return result;
    }

    /**
     * tok is function
     * 
     * @param modifiers
     * @param meta
     * @throws TokenException
     */
    private parseFunction(meta: Node[], modifiers: Token[]): Node {
        let signature: Node[] = this.doParseSignature();
        let result: Node = new Node(
            this.findFunctionTypeFromSignature(signature), signature[0].start,
            -1, signature[0].text
        );

        if (this.currentAsDoc != null) {
            result.children.push(this.currentAsDoc);
            this.currentAsDoc = null;
        }
        if (this.currentMultiLineComment != null) {
            result.children.push(this.currentMultiLineComment);
            this.currentMultiLineComment = null;
        }
        result.children.push(this.convertMeta(meta));
        result.children.push(this.convertModifiers(modifiers));
        result.children.push(signature[1]);
        result.children.push(signature[2]);
        result.children.push(signature[3]);
        if (this.tokIs(Operators.SEMI_COLUMN)) {
            this.consume(Operators.SEMI_COLUMN);
        }
        else {
            result.children.push(this.parseFunctionBlock());
        }
        this.currentFunctionNode = null;
        result.start = result.children.reduce((index: number, child: Node) => {
            return Math.min(index, child ? child.start : Infinity);
        }, result.start);
        result.end = result.children.reduce((index: number, child: Node) => {
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

    private parseFunctionBlock(): Node {
        let block: Node = new Node(NodeKind.BLOCK, this.tok.index, -1);

        this.currentFunctionNode = block;

        this.parseBlock(block);

        return block;
    }

    private parseFunctionCall(node: Node): Node {
        let result: Node = new Node(NodeKind.CALL, node.start, -1);
        result.children.push(node);
        while (this.tokIs(Operators.LEFT_PARENTHESIS)) {
            result.children.push(this.parseArgumentList());
        }
        while (this.tokIs(Operators.LEFT_SQUARE_BRACKET)) {
            result.children.push(this.parseArrayLiteral());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, 0);
        return result;
    }

    /**
     * tok is function exit tok is the first token after the optional ;
     * 
     * @throws TokenException
     */
    private parseFunctionSignature(): Node {
        let signature: Node[] = this.doParseSignature();
        this.skip(Operators.SEMI_COLUMN);
        let result: Node = new Node(
            this.findFunctionTypeFromSignature(signature), signature[0].start,
            -1, signature[0].text
            );
        result.children.push(signature[1]);
        result.children.push(signature[2]);
        result.children.push(signature[3]);
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, 0);
        return result;
    }

    /**
     * tok is if
     * 
     * @throws TokenException
     */
    private parseIf(): Node {
        let tok = this.consume(Keywords.IF);
        let result: Node = new Node(NodeKind.IF, tok.index, -1, null, [this.parseCondition()]);
        result.children.push(this.parseStatement());
        if (this.tokIs(Keywords.ELSE)) {
            this.nextToken(true);
            result.children.push(this.parseStatement());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
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
    private parseImplementsList(): Node {
        this.consume(Keywords.IMPLEMENTS);
        let result: Node = new Node(NodeKind.IMPLEMENTS_LIST, this.tok.index, -1);
        let index = this.tok.index;
        let name = this.parseQualifiedName(true);
        result.children.push(new Node(NodeKind.IMPLEMENTS, index, index + name.length, name));
        while (this.tokIs(Operators.COMMA)) {
            this.nextToken(true);
            let index = this.tok.index;
            let name = this.parseQualifiedName(true);
            result.children.push(new Node(NodeKind.IMPLEMENTS, index, index + name.length, name));
        }
        return result;
    }

    /**
     * tok is import
     * 
     * @throws TokenException
     */
    private parseImport(): Node {
        let tok = this.consume(Keywords.IMPORT);
        let name = this.parseImportName();
        let result: Node = new Node(NodeKind.IMPORT, tok.index, tok.index + name.length, name);
        this.skip(Operators.SEMI_COLUMN);
        return result;
    }

    /**
     * tok is the first part of a name the last part can be a star exit tok is
     * the first token, which doesn't belong to the name
     * 
     * @throws TokenException
     */
    private parseImportName(): string {
        let result = '';

        result += this.tok.text;
        this.nextToken();
        while (this.tokIs(Operators.DOT)) {
            result += Operators.DOT;
            this.nextToken(); // .
            result += this.tok.text;
            this.nextToken(); // part of name
        }
        return result;
    }

    private parseIncludeExpression(): Node {
        let result: Node = new Node(NodeKind.INCLUDE, this.tok.index, -1);
        let tok: Token;
        if (this.tokIs(Keywords.INCLUDE)) {
            tok = this.consume(Keywords.INCLUDE);
        }
        else if (this.tokIs(Keywords.INCLUDE_AS2)) {
            tok = this.consume(Keywords.INCLUDE_AS2);
        }
        if (tok) {
            result.start = tok.index;
        }
        result.children.push(this.parseExpression());
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, 0);
        return result;
    }

    private parseIncrement(node: Node): Node {
        this.nextToken(true);
        let result: Node = new Node(NodeKind.POST_INC, node.start, this.tok.end);
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
    private parseInterface(meta: Node[], modifier: Token[]): Node {
        let tok = this.consume(Keywords.INTERFACE);
        let result: Node = new Node(NodeKind.INTERFACE, tok.index, -1);

        if (this.currentAsDoc != null) {
            result.children.push(this.currentAsDoc);
            this.currentAsDoc = null;
        }
        if (this.currentMultiLineComment != null) {
            result.children.push(this.currentMultiLineComment);
            this.currentMultiLineComment = null;
        }
        let name = this.parseQualifiedName(true);
        result.children.push(new Node(NodeKind.NAME, this.tok.index, this.tok.index + name.length, name));

        result.children.push(this.convertMeta(meta));
        result.children.push(this.convertModifiers(modifier));

        if (this.tokIs(Keywords.EXTENDS)) {
            this.nextToken(); // extends
            name = this.parseQualifiedName(false);
            result.children.push(new Node(NodeKind.EXTENDS, this.tok.index, this.tok.index + name.length, name));
        }
        while (this.tokIs(Operators.COMMA)) {
            this.nextToken(); // comma
            name = this.parseQualifiedName(false);
            result.children.push(new Node(NodeKind.EXTENDS, this.tok.index, this.tok.index + name.length, name));
        }
        this.consume(Operators.LEFT_CURLY_BRACKET);
        result.children.push(this.parseInterfaceContent());
        tok = this.consume(Operators.RIGHT_CURLY_BRACKET);
        result.end = tok.end;
        result.start = result.children.reduce((index: number, child: Node) => {
            return Math.min(index, child ? child.start : Infinity);
        }, tok.index);
        return result;
    }

    /**
     * tok is function
     * 
     * @throws TokenException
     */
    private parseLambdaExpression(): Node {
        let tok = this.consume(Keywords.FUNCTION);
        let result: Node;

        //if (this.tok.text.compareTo("(") == 0) {
        if (this.tok.text === "(") {
            result = new Node(NodeKind.LAMBDA, tok.index, this.tok.end);
        }
        else {
            result = new Node(NodeKind.FUNCTION, tok.index, this.tok.end, this.tok.text);
            this.nextToken(true);
        }
        result.children.push(this.parseParameterList());
        result.children.push(this.parseOptionalType());
        result.children.push(this.parseBlock());
        result.end = result.children.reduce((index: number, child: Node) => {
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
    private parseMetaData(): Node {
        let buffer = '';

        let index = this.consume(Operators.LEFT_SQUARE_BRACKET).index;
        while (!this.tokIs(Operators.RIGHT_SQUARE_BRACKET)) {
            buffer += this.tok.text;
            this.nextToken();
        }
        let end = this.tok.end;
        this.skip(Operators.RIGHT_SQUARE_BRACKET);
        return new Node(NodeKind.META, index, end, '[' + buffer + ']');
    }

    private parseMultiplicativeExpression(): Node {
        let result: Node = new Node(NodeKind.MULTIPLICATION, this.tok.index, -1, null, [this.parseUnaryExpression()]);
        while (this.tokIs(Operators.TIMES) || this.tokIs(Operators.SLASH) || this.tokIs(Operators.MODULO)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseUnaryExpression());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result.children.length > 1 ? result : result.children[0];
    }

    private parseNamespaceName(): string {
        let name: string = this.tok.text;
        this.nextToken(); // simple name for now
        return name;
    }

    private parseNameTypeInit(): Node {
        let result: Node = new Node(NodeKind.NAME_TYPE_INIT, this.tok.index, -1);
        result.children.push(new Node(NodeKind.NAME, this.tok.index, this.tok.end, this.tok.text));
        this.nextToken(true); // name
        result.children.push(this.parseOptionalType());
        result.children.push(this.parseOptionalInit());
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result;
    }

    private parseNewExpression(): Node {
        let tok = this.consume(Keywords.NEW);

        let result: Node = new Node(NodeKind.NEW, tok.index, -1);
        result.children.push(this.parseExpression()); // name
        if (this.tokIs(Operators.VECTOR_START)) {
            let index = this.tok.index;
            let vec = this.parseVector();
            result.children.push(new Node(NodeKind.VECTOR, index, vec.end, null, [vec]));
        }
        if (this.tokIs(Operators.LEFT_PARENTHESIS)) {
            result.children.push(this.parseArgumentList());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result;
    }

    /**
     * tok is {
     */
    private parseObjectLiteral(): Node {
        let tok = this.consume(Operators.LEFT_CURLY_BRACKET);
        let result: Node = new Node(NodeKind.OBJECT, tok.index, tok.end);
        while (!this.tokIs(Operators.RIGHT_CURLY_BRACKET)) {
            result.children.push(this.parseObjectLiteralPropertyDeclaration());
            this.skip(Operators.COMMA);
        }
        tok = this.consume(Operators.RIGHT_CURLY_BRACKET);
        result.end = tok.end;
        return result;
    }

    /*
     * tok is name
     */
    private parseObjectLiteralPropertyDeclaration(): Node {
        let result: Node = new Node(NodeKind.PROP, this.tok.index, this.tok.end);
        let name: Node = new Node(NodeKind.NAME, this.tok.index, this.tok.end, this.tok.text);
        result.children.push(name);
        this.nextToken(); // name
        this.consume(Operators.COLUMN);
        let expr = this.parseExpression();
        let val = new Node(NodeKind.VALUE, this.tok.index, expr.end, null, [expr]);
        result.children.push(val);
        result.end = val.end;
        return result;
    }

    /**
     * if tok is "=" parse the expression otherwise do nothing
     * 
     * @return
     */
    private parseOptionalInit(): Node {
        let result: Node = null;
        if (this.tokIs(Operators.EQUAL)) {
            this.nextToken(true);
            let index = this.tok.index;
            let expr = this.parseExpression();
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
    private parseOptionalType(): Node {
        let result: Node = new Node(NodeKind.TYPE, this.tok.index, this.tok.index, "");
        if (this.tokIs(Operators.COLUMN)) {
            this.nextToken(true);
            result = this.parseType();
        }
        return result;
    }

    private parseOrExpression(): Node {
        let result: Node = new Node(NodeKind.OR, this.tok.index, -1, null, [this.parseAndExpression()]);
        while (this.tokIs(Operators.LOGICAL_OR) || this.tokIs(Operators.LOGICAL_OR_AS2)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseAndExpression());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result.children.length > 1 ? result : result.children[0];
    }

    /**
     * tok is package
     * 
     * @throws UnExpectedTokenException
     */
    private parsePackage(): Node {
        let tok = this.consume(Keywords.PACKAGE);
        let result: Node = new Node(NodeKind.PACKAGE, tok.index, -1);
        let nameBuffer = '';

        let index = this.tok.index;
        while (!this.tokIs(Operators.LEFT_CURLY_BRACKET)) {
            nameBuffer += this.tok.text;
            this.nextToken();
        }
        result.children.push(new Node(NodeKind.NAME, index, index + nameBuffer.length, nameBuffer));
        this.consume(Operators.LEFT_CURLY_BRACKET);
        result.children.push(this.parsePackageContent());
        tok = this.consume(Operators.RIGHT_CURLY_BRACKET);
        result.end = tok.end;
        return result;
    }

    /**
     * tok is the name of a parameter or ...
     */
    private parseParameter(): Node {
        let result: Node = new Node(NodeKind.PARAMETER, this.tok.index, -1);
        if (this.tokIs(Operators.REST_PARAMETERS)) {
            let index = this.tok.index;
            this.nextToken(true); // ...
            let rest: Node = new Node(NodeKind.REST, index, this.tok.end, this.tok.text);
            this.nextToken(true); // rest
            result.children.push(rest);
        }
        else {
            result.children.push(this.parseNameTypeInit());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result;
    }

    /**
     * tok is (
     * 
     * @throws TokenException
     */
    private parseParameterList(): Node {
        let tok = this.consume(Operators.LEFT_PARENTHESIS);

        let result: Node = new Node(NodeKind.PARAMETER_LIST, tok.index, -1);
        while (!this.tokIs(Operators.RIGHT_PARENTHESIS)) {
            result.children.push(this.parseParameter());
            if (this.tokIs(Operators.COMMA)) {
                this.nextToken(true);
            }
            else {
                break;
            }
        }
        tok = this.consume(Operators.RIGHT_PARENTHESIS);
        result.end = tok.end;
        return result;
    }

    /**
     * tok is first part of the name exit tok is the first token after the name
     * 
     * @throws TokenException
     */
    private parseQualifiedName(skipPackage: boolean): string {
        let buffer = '';

        buffer += this.tok.text;
        this.nextToken();
        while (this.tokIs(Operators.DOT) || this.tokIs(Operators.DOUBLE_COLUMN)) {
            buffer += this.tok.text;
            this.nextToken();
            buffer += this.tok.text;
            this.nextToken(); // name
        }

        if (skipPackage) {
            return buffer.substring(buffer.lastIndexOf(Operators.DOT) + 1);
        }
        return buffer;
    }

    private parseRelationalExpression(): Node {
        let result: Node = new Node(NodeKind.RELATION, this.tok.index, -1, null, [this.parseShiftExpression()]);
        while (this.tokIs(Operators.INFERIOR)
            || this.tokIs(Operators.INFERIOR_AS2) || this.tokIs(Operators.INFERIOR_OR_EQUAL)
            || this.tokIs(Operators.INFERIOR_OR_EQUAL_AS2) || this.tokIs(Operators.SUPERIOR)
            || this.tokIs(Operators.SUPERIOR_AS2) || this.tokIs(Operators.SUPERIOR_OR_EQUAL)
            || this.tokIs(Operators.SUPERIOR_OR_EQUAL_AS2) || this.tokIs(Keywords.IS) || this.tokIs(Keywords.IN)
            && !this.isInFor || this.tokIs(Keywords.AS) || this.tokIs(Keywords.INSTANCE_OF)) {
            if (!this.tokIs(Keywords.AS)) {
                result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            }
            else {
                result.children.push(new Node(NodeKind.AS, this.tok.index, this.tok.end, this.tok.text));
            }
            this.nextToken(true);
            result.children.push(this.parseShiftExpression());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result.children.length > 1 ? result : result.children[0];
    }

    private parseReturnStatement(): Node {
        let result: Node;

        let index = this.tok.index,
            end = this.tok.end;
        this.nextTokenAllowNewLine();
        if (this.tokIs(NEW_LINE) || this.tokIs(Operators.SEMI_COLUMN)) {
            this.nextToken(true);
            result = new Node(NodeKind.RETURN, index, end, "");
        }
        else {
            let expr = this.parseExpression();
            result = new Node(NodeKind.RETURN, index, expr.end, null, [expr]);
            this.skip(Operators.SEMI_COLUMN);
        }
        return result;
    }
    
    private parseThrowStatement(): Node {
        let tok = this.consume(Keywords.THROW);
        let expr = this.parseExpression();
        
        return  new Node(NodeKind.RETURN, tok.index, expr.end, null, [expr]);
    }
    
    private parseBreakOrContinueStatement(): Node {
        let tok: Token = this.tok;
        let kind: NodeKind;
        if (this.tokIs(Keywords.BREAK) || this.tokIs(Keywords.CONTINUE)) {
            kind = this.tokIs(Keywords.BREAK)? NodeKind.BREAK : NodeKind.CONTINUE;
            this.nextToken();
        } else {
            let pos = this.sourceFile.getLineAndCharacterFromPosition(this.tok.index);
            throw new Error('unexpected token : ' +
                this.tok.text + '(' + pos.line + ',' + pos.col + ')' +
                ' in file ' + this.sourceFile.path +
                'expected: continue or break'
            );
        }
        let result: Node;
        if (this.tokIs(NEW_LINE) || this.tokIs(Operators.SEMI_COLUMN)) {
            this.nextToken(true);
            result = new Node(kind, tok.index, tok.end, "");
        } else {
            let ident = this.tryParse(() => {
                let expr = this.parsePrimaryExpression();
                if (expr.kind === NodeKind.IDENTIFIER) {
                    return expr;
                } else {
                    throw new Error();
                }
            });
            if (!ident) {
                let pos = this.sourceFile.getLineAndCharacterFromPosition(this.tok.index);
                throw new Error('unexpected token : ' +
                    this.tok.text + '(' + pos.line + ',' + pos.col + ')' +
                    ' in file ' + this.sourceFile.path +
                    'expected: ident'
                );
            }
            result = new Node(kind, tok.index, ident.end, null, [ident]);
        }
        this.skip(Operators.SEMI_COLUMN);
        return result;
    }

    private parseShiftExpression(): Node {
        let result: Node = new Node(NodeKind.SHIFT, this.tok.index, -1, null, [this.parseAdditiveExpression()]);
        while (this.tokIs(Operators.DOUBLE_SHIFT_LEFT)
            || this.tokIs(Operators.TRIPLE_SHIFT_LEFT) || this.tokIs(Operators.DOUBLE_SHIFT_RIGHT)
            || this.tokIs(Operators.TRIPLE_SHIFT_RIGHT)) {
            result.children.push(new Node(NodeKind.OP, this.tok.index, this.tok.end, this.tok.text));
            this.nextToken(true);
            result.children.push(this.parseAdditiveExpression());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result.children.length > 1 ? result : result.children[0];
    }

    /**
     * tok is switch
     * 
     * @throws TokenException
     */
    private parseSwitch(): Node {
        let tok = this.consume(Keywords.SWITCH);
        let result: Node = new Node(NodeKind.SWITCH, tok.index, tok.end, null, [this.parseCondition()]);
        if (this.tokIs(Operators.LEFT_CURLY_BRACKET)) {
            this.nextToken();
            result.children.push(this.parseSwitchCases());
            result.end = this.consume(Operators.RIGHT_CURLY_BRACKET).end;
        }
        return result;
    }

    /**
     * tok is case, default or the first token of the first statement
     * 
     * @throws TokenException
     */
    private parseSwitchBlock(): Node {
        let result: Node = new Node(NodeKind.SWITCH_BLOCK, this.tok.index, this.tok.end);
        while (!this.tokIs(Keywords.CASE) && !this.tokIs(Keywords.DEFAULT) && !this.tokIs(Operators.RIGHT_CURLY_BRACKET)) {
            result.children.push(this.parseStatement());
        }
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, result.end);
        return result;
    }

    /**
     * tok is { exit tok is }
     * 
     * @throws TokenException
     */
    private parseSwitchCases(): Node {
        let result: Node = new Node(NodeKind.CASES, this.tok.index, this.tok.end);
        for (; ;) {
            if (this.tokIs(Operators.RIGHT_CURLY_BRACKET)) {
                break;
            }
            else if (this.tokIs(Keywords.CASE)) {
                let index = this.tok.index;
                this.nextToken(true); // case
                let expr = this.parseExpression();
                let caseNode: Node = new Node(NodeKind.CASE, index, expr.end, null, [expr]);
                this.consume(Operators.COLUMN);
                let block = this.parseSwitchBlock();
                caseNode.children.push(block);
                caseNode.end = block.end;
                result.children.push(caseNode);
            }
            else if (this.tokIs(Keywords.DEFAULT)) {
                let index = this.tok.index;
                this.nextToken(true); // default
                this.consume(Operators.COLUMN);
                let caseNode: Node = new Node(NodeKind.CASE, index, -1, null,
                    [new Node(NodeKind.DEFAULT, index, this.tok.end, Keywords.DEFAULT)]);
                let block = this.parseSwitchBlock();
                caseNode.end = block.end;
                caseNode.children.push(block);
                result.children.push(caseNode);
            }
        }
        result.end = result.children.reduce((index: number, child: Node) => {
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
    private parseTraditionalFor(index: number): Node {
        this.consume(Operators.LEFT_PARENTHESIS);

        let result: Node = new Node(NodeKind.FOR, index, -1);
        if (!this.tokIs(Operators.SEMI_COLUMN)) {
            if (this.tokIs(Keywords.VAR)) {
                let varList = this.parseVarList(null, null);
                result.children.push(new Node(NodeKind.INIT, varList.start, varList.end, null, [varList]));
            }
            else {
                this.isInFor = true;
                let expr = this.parseExpression();
                result.children.push(new Node(NodeKind.INIT, expr.start, expr.end, null, [expr]));
                this.isInFor = false;
            }
            if (this.tokIs(Keywords.IN)) {
                return this.parseForIn(result);
            }
        }
        this.consume(Operators.SEMI_COLUMN);
        if (!this.tokIs(Operators.SEMI_COLUMN)) {
            let expr = this.parseExpression();
            result.children.push(new Node(NodeKind.COND, expr.start, expr.end, null, [expr]));
        }
        this.consume(Operators.SEMI_COLUMN);
        if (!this.tokIs(Operators.RIGHT_PARENTHESIS)) {
            let expr = this.parseExpressionList();
            result.children.push(new Node(NodeKind.ITER, expr.start, expr.end, null, [expr]));
        }
        this.consume(Operators.RIGHT_PARENTHESIS);
        result.children.push(this.parseStatement());
        return result;
    }

    private parseTry(): Node {
        let result: Node;
        let index = this.tok.index;
        this.nextToken(true);
        let block = this.parseBlock();
        result = new Node(NodeKind.TRY, index, block.end, null, [block]);
        return result;
    }

    private parseType(): Node {
        let result: Node;
        if (this.tok.text === VECTOR) {
            result = this.parseVector();
        }
        else {
            let index = this.tok.index,
                name = this.parseQualifiedName(true);
            result = new Node(NodeKind.TYPE, index, index + name.length, name);
            // this.nextToken( true );
        }
        return result;
    }

    private parseUnaryExpressionNotPlusMinus(): Node {
        let result: Node;
        let index = this.tok.index;
        if (this.tokIs(Keywords.DELETE)) {
            this.nextToken(true);
            let expr = this.parseExpression();
            result = new Node(NodeKind.DELETE, index, expr.end, null, [expr]);
        }
        else if (this.tokIs(Keywords.VOID)) {
            this.nextToken(true);
            let expr = this.parseExpression();
            result = new Node(NodeKind.VOID, index, expr.end, null, [expr]);
        }
        else if (this.tokIs(Keywords.TYPEOF)) {
            this.nextToken(true);
            let expr = this.parseExpression();
            result = new Node(NodeKind.TYPEOF, index, expr.end, null, [expr]);
        }
        else if (this.tokIs("!") || this.tokIs("not")) {
            this.nextToken(true);
            let expr = this.parseExpression();
            result = new Node(NodeKind.NOT, index, expr.end, null, [expr]);
        }
        else if (this.tokIs("~")) {
            this.nextToken(true);
            let expr = this.parseExpression();
            result = new Node(NodeKind.B_NOT, index, expr.end, null, [expr]);
        }
        else {
            result = this.parseUnaryPostfixExpression();
        }
        return result;
    }

    private parseUnaryPostfixExpression(): Node {
        let node: Node = this.parseAccessExpresion();

        if (this.tokIs(Operators.INCREMENT)) {
            node = this.parseIncrement(node);
        }
        else if (this.tokIs(Operators.DECREMENT)) {
            node = this.parseDecrement(node);
        }
        return node;
    }
    
    private parseAccessExpresion(): Node {
        let node: Node = this.parsePrimaryExpression();

        while (true) {
            if (this.tokIs(Operators.LEFT_PARENTHESIS)) {
                node = this.parseFunctionCall(node);
            }
            if (this.tokIs(Operators.DOT) || this.tokIs(Operators.DOUBLE_COLUMN)) {
                node = this.parseDot(node);
            } else if (this.tokIs(Operators.LEFT_SQUARE_BRACKET)) {
                node = this.parseArrayAccessor(node);
            } else {
                break;
            }
        }
        return node;
    }

    private parseUse(): Node {
        let tok = this.consume(Keywords.USE);
        this.consume(Keywords.NAMESPACE);
        let nameIndex = this.tok.index;
        let namespace = this.parseNamespaceName();
        let result: Node = new Node(NodeKind.USE, tok.index, nameIndex + namespace.length, namespace);
        this.skip(Operators.SEMI_COLUMN);
        return result;
    }

    private parseVar(): Node {
        let result: Node;
        result = this.parseVarList(null, null);
        this.skip(Operators.SEMI_COLUMN);
        return result;
    }

    /**
     * tok is var x, y : String, z : number = 0;
     * 
     * @param modifiers
     * @param meta
     * @throws TokenException
     */
    private parseVarList(meta: Node[], modifiers: Token[]): Node {
        let tok = this.consume(Keywords.VAR);
        let result: Node = new Node(NodeKind.VAR_LIST, tok.index, tok.end);
        result.children.push(this.convertMeta(meta));
        result.children.push(this.convertModifiers(modifiers));
        this.collectVarListContent(result);
        result.start = result.children.reduce((index: number, child: Node) => {
            return Math.min(index, child ? child.start : Infinity);
        }, tok.index);
        result.end = result.children.reduce((index: number, child: Node) => {
            return Math.max(index, child ? child.end : 0);
        }, tok.end);
        return result;
    }

    private parseVector(): Node {
        let result: Node = new Node(NodeKind.VECTOR, this.tok.index, -1, "");
        if (this.tok.text === "Vector") {
            this.nextToken();
        }
        this.consume(Operators.VECTOR_START);

        result.children.push(this.parseType());

        result.end = this.consume(Operators.SUPERIOR).end;

        return result;
    }
    
    private parseShortVector(): Node {
        let vector: Node = new Node(NodeKind.VECTOR, this.tok.index, -1, "");
        this.consume(Operators.INFERIOR);
        vector.children.push(this.parseType());
        vector.end = this.consume(Operators.SUPERIOR).end;
        
        let arrayLiteral = this.parseArrayLiteral();
        
        return new Node(NodeKind.SHORT_VECTOR, vector.start, arrayLiteral.end, null, [vector, arrayLiteral]);
    }

    /**
     * tok is while
     * 
     * @throws TokenException
     */
    private parseWhile(): Node {
        let tok = this.consume(Keywords.WHILE);
        let result: Node = new Node(NodeKind.WHILE, tok.index, tok.end);
        result.children.push(this.parseCondition());
        result.children.push(this.parseStatement());
        result.end = result.children.reduce((index: number, child: Node) => {
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
    private skip(text: string): void {
        if (this.tokIs(text)) {
            this.nextToken();
        }
    }

    /**
     * Compare the current token to the parameter
     * 
     * @param text
     * @return true, if tok's text property equals the parameter
     */
    private tokIs(text: string): boolean {
        return this.tok.text === text;
    }

    private tryToParseCommentNode(result: Node, modifiers: Token[]): void {
        if (startsWith(this.tok.text, ASDOC_COMMENT)) {
            this.currentAsDoc = new Node(NodeKind.AS_DOC, this.tok.index, -1, this.tok.text);
            this.nextToken();
        }
        else if (startsWith(this.tok.text, MULTIPLE_LINES_COMMENT)) {
            result.children.push(new Node(NodeKind.MULTI_LINE_COMMENT, this.tok.index, -1, this.tok.text));
            this.nextToken();
        }
        else {
            if (modifiers != null) {
                modifiers.push(this.tok);
            }
            this.nextTokenIgnoringDocumentation();
        }
    }
}

export function parse(filePath: string, content: string): Node {
    let parser = new AS3Parser();
    return parser.buildAst(filePath, content);
}
