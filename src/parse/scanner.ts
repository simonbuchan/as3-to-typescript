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



import Token = require('./token');
import Keywords = require('../syntax/keywords');
import sax = require('sax');
import objectAssign = require('object-assign');


function startsWith(string: string, prefix: string) {
    return string.substr(0, prefix.length) === prefix;
}


function endsWith(string: string, suffix: string) {
    return string.substr(-suffix.length) === suffix;
}


interface CheckPoint {
    index: number
    inVector: boolean
}


/**
 * convert a actionscript to a stream of tokens
 * 
 * @author rbokel
 * @author xagnetti
 */
class AS3Scanner {
    inVector: boolean;
    index: number;
    content: string = '';

    setContent(content: string = ''): void {
        this.content = content;
        this.index = -1;
    }

    nextToken(): Token {
        return nextToken(this);
    }

    scanRegExp(): Token {
        return scanRegExp(this);
    }

    getCheckPoint(): CheckPoint {
        return { index: this.index, inVector: this.inVector };
    }

    rewind(checkpoint: CheckPoint): void {
        this.index = checkpoint.index;
        this.inVector = checkpoint.inVector;
    }

    createToken(
            text: string,
            options?: {
                index?: number
                isNumeric?: boolean
                isXML?: boolean
                skip?: boolean
            }): Token {
        options = objectAssign({index: this.index, isNumeric: false, isXML: false, skip: true}, options);
        if (options.skip && text.length > 1) {
            this.skipChars(text.length - 1);
        }
        return new Token(text, options.index, options.isNumeric, options.isXML);
    }

    getPreviousCharacter(): string {
        let currentIndex = -1;
        let currentChar: string;
        do {
            currentChar = this.peekChar(currentIndex--);
        }
        while (currentChar == ' ');
        return currentChar;
    }

    nextChar(): string {
        this.index++;
        let currentChar = this.content.charAt(this.index);

        while (currentChar == '\uFEFF') {
            this.index++;
            currentChar = this.content.charAt(this.index);
        }
        return currentChar;
    }

    nextNonWhitespaceCharacter(): string {
        let result: string;
        do {
            result = this.nextChar();
        }
        while (result === ' ' || result === '\t' || result == '\r');
        return result;
    }

    peekChar(offset: number): string {
        let index = this.index + offset;
        if (index == -1) {
            return '\0';
        }
        return this.content.charAt(index);
    }

    skipChars(count: number): void {
        let decrementCount = count;

        while (decrementCount-- > 0) {
            this.nextChar();
        }
    }
}


function nextToken(scanner: AS3Scanner): Token {
    if (scanner.index >= scanner.content.length) {
        return scanner.createToken(Keywords.EOF, { skip: false });
    }

    let currentCharacter = scanner.nextNonWhitespaceCharacter();
    switch (currentCharacter) {
        case '\n':
            return scanner.createToken(currentCharacter);
        case '/':
            return scanCommentRegExpOrOperator(scanner);
        case '"': case '\'':
        return scanUntilDelimiter(scanner, currentCharacter);
        case '<':
            return scanXMLOrOperator(scanner, currentCharacter);
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
        case '.':
            return scanNumberOrDots(scanner, currentCharacter);
        case '{': case '}': case '(': case ')': case '[': case ']':
        case ';': case ',': case '?': case '~':
            return scanner.createToken(currentCharacter);
        case ':':
            return scanCharacterSequence(scanner, currentCharacter, ['::']);
        case '*':
            //UGLY HACK but .... seems working
            if (scanner.getPreviousCharacter() === ':') {
                return scanner.createToken(currentCharacter);
            }
            return scanCharacterSequence(scanner, currentCharacter, ['*=']);
        case '+':
            return scanCharacterSequence(scanner, currentCharacter, ['++', '+=']);
        case '-':
            return scanCharacterSequence(scanner, currentCharacter, ['--', '-=']);
        case '%':
            return scanCharacterSequence(scanner, currentCharacter, ['%=']);
        case '&':
            return scanCharacterSequence(scanner, currentCharacter, ['&&', '&=']);
        case '|':
            return scanCharacterSequence(scanner, currentCharacter, ['||', '|=']);
        case '^':
            return scanCharacterSequence(scanner, currentCharacter, ['^=']);
        case '>':
            if (scanner.inVector) {
                scanner.inVector = false;
                break;
            }
            return scanCharacterSequence(scanner, currentCharacter, ['>>>=', '>>>', '>>=', '>>', '>=']);
        case '=':
            return scanCharacterSequence(scanner, currentCharacter, ['===', '==']);
        case '!':
            return scanCharacterSequence(scanner, currentCharacter, ['!==', '!=']);
    }

    let token = scanWord(scanner, currentCharacter);
    return token.text.length === 0 ? scanner.nextToken() : token;
}


function scanCharacterSequence(scanner: AS3Scanner, currentCharacter: string, possibleMatches: string[]): Token {
    let buffer = currentCharacter;
    let match = buffer;

    let maxLength = Math.max(...possibleMatches.map(m => m.length));
    for (let peekPos = 1; peekPos < maxLength; peekPos++) {
        buffer += scanner.peekChar(peekPos);
        if (possibleMatches.indexOf(buffer) !== -1) {
            match = buffer;
        }
    }

    return scanner.createToken(match);
}


function scanRegExp(scanner: AS3Scanner): Token {
    let currentIndex = scanner.index;
    let token = scanUntilDelimiter(scanner, '/');
    if (token) {
        let flags = '';
        for (let peekPos = 1;;) {
            let currentCharacter = scanner.peekChar(peekPos++);
            if (!/[a-z]/.test(currentCharacter)) {
                break;
            }
            flags += currentCharacter;
        }
        let regExpSource = token.text.substring(1, token.text.length - 1);

        if (flags.length) {
            token.text += flags;
            scanner.index += flags.length
        }

        try {
            new RegExp(regExpSource, flags);
            return token;
        } catch (e) {
        }
    }
    scanner.index = currentIndex;
    return null;
}


/**
 * Something started with a slash This might be a comment, a regexp or a
 * operator
 */
function scanCommentRegExpOrOperator(scanner: AS3Scanner): Token {
    let firstCharacter = scanner.peekChar(1);

    if (firstCharacter == '/') {
        return scanSingleLineComment(scanner);
    }
    if (firstCharacter == '*') {
        return scanMultiLineComment(scanner);
    }
    if (firstCharacter != '=') {
        return scanner.createToken('/');
    }
    return scanner.createToken('/=');
}


/**
 * c is either a dot or a number
 */
function scanDecimal(scanner: AS3Scanner, currentCharacter: string): Token {
    let currentChar = currentCharacter;
    let buffer = '';
    let peekPos = 1;

    while (/\d/.test(currentChar)) {
        buffer += currentChar;
        currentChar = scanner.peekChar(peekPos++);
    }

    if (currentChar == '.') {
        buffer += currentChar;
        currentChar = scanner.peekChar(peekPos++);

        while (/\d/.test(currentChar)) {
            buffer += currentChar;
            currentChar = scanner.peekChar(peekPos++);
        }

        if (currentChar == 'E') {
            buffer += currentChar;
            currentChar = scanner.peekChar(peekPos++);
            while (/\d/.test(currentChar)) {
                buffer += currentChar;
                currentChar = scanner.peekChar(peekPos++);
            }
        }
    }

    return scanner.createToken(buffer, {isNumeric: true});
}


/**
 * The first dot has been scanned Are the next chars dots as well?
 */
function scanDots(scanner: AS3Scanner): Token {
    let secondCharacter = scanner.peekChar(1);

    if (secondCharacter == '.') {
        let thirdCharacter = scanner.peekChar(2);
        let text = thirdCharacter != '.' ? '..' : '...';
        return scanner.createToken(text);
    } else if (secondCharacter == '<') {
        scanner.inVector = true;
        return scanner.createToken('.<');
    }
    return null;
}


/**
 * we have seen the 0x prefix
 */
function scanHex(scanner: AS3Scanner): Token {
    let buffer = '0x';
    for (let peekPos = 2; ;) {
        let character = scanner.peekChar(peekPos++);

        if (!/[\dA-Za-z]/.test(character)) {
            break;
        }
        buffer += character;
    }
    return scanner.createToken(buffer, {isNumeric: true});
}


/**
 * the current string is the first slash plus we know, that a * is following
 */
function scanMultiLineComment(scanner: AS3Scanner): Token {
    let buffer = '/*';
    let currentCharacter = ' ';
    let previousCharacter = ' ';

    scanner.nextChar();
    do {
        previousCharacter = currentCharacter;
        currentCharacter = scanner.nextChar();
        buffer += currentCharacter;
    }
    while (currentCharacter && (previousCharacter !== '*' || currentCharacter !== '/'));

    return scanner.createToken(buffer, {skip: false});
}


/**
 * Something started with a number or a dot.
 */
function scanNumberOrDots(scanner: AS3Scanner, characterToBeScanned: string): Token {
    if (characterToBeScanned == '.') {
        let result = scanDots(scanner);
        if (result != null) {
            return result;
        }

        if (!/\d/.test(scanner.peekChar(1))) {
            return scanner.createToken('.');
        }
    }

    if (characterToBeScanned == '0' && scanner.peekChar(1) == 'x') {
        return scanHex(scanner);
    }

    return scanDecimal(scanner, characterToBeScanned);
}


/**
 * the current string is the first slash plus we know, that another slash is
 * following
 */
function scanSingleLineComment(scanner: AS3Scanner): Token {
    let buffer = scanner.content[scanner.index];
    let char: string;
    do {
        char = scanner.nextChar();
        buffer += char;
    }
    while (char !== '\n');

    return scanner.createToken(buffer, {skip: false});
}


/**
 * Something started with a quote or number quote consume characters until
 * the quote/double quote shows up again and is not escaped
 */
function scanUntilDelimiter(scanner: AS3Scanner, start: string, delimiter: string = start): Token {
    let buffer = start;
    let inBackslash = false;

    for (let peekPos = 1; scanner.index + peekPos < scanner.content.length; peekPos++) {
        let currentCharacter = scanner.peekChar(peekPos);
        if (currentCharacter === '\n') {
            return null;
        }
        buffer += currentCharacter;
        if (currentCharacter === delimiter && !inBackslash) {
            return scanner.createToken(buffer);
        }
        if (currentCharacter === '\\') {
            inBackslash = !inBackslash;
        }
    }
    return null;

}


function scanWord(scanner: AS3Scanner, startingCharacter: string): Token {
    let buffer = startingCharacter;

    for (let peekPos = 1; ; peekPos++) {
        let currentChar = scanner.peekChar(peekPos);
        if (!/[\w\$]/.test(currentChar)) {
            break;
        }
        buffer += currentChar;
    }

    return scanner.createToken(buffer);
}


/**
 * Try to parse a XML document
 */
function scanXML(scanner: AS3Scanner): Token {
    let currentIndex = scanner.index;
    let level = 0;
    let buffer = '';
    let currentCharacter = '<';

    for (; ;) {
        let currentToken: Token = null;
        do {
            currentToken = scanUntilDelimiter(scanner, '<', '>');
            if (currentToken == null) {
                scanner.index = currentIndex;
                return null;
            }
            buffer += currentToken.text;
            if (startsWith(currentToken.text, '<?')) {
                currentCharacter = scanner.nextChar();
                if (currentCharacter === '\n') {
                    buffer += '\n';
                    scanner.nextChar();
                }
                currentToken = null;
            }
        }
        while (currentToken == null);

        if (startsWith(currentToken.text, '</')) {
            level--;
        } else if (!endsWith(currentToken.text, '/>') &&
                currentToken.text !== '<>') { // NOT operator in AS2
            level++;
        }

        if (level <= 0) {
            return scanner.createToken(buffer, {index: currentIndex, isXML: true, skip: false});
        }

        for (; ;) {
            currentCharacter = scanner.nextChar();
            if (currentCharacter === '<' || scanner.index >= scanner.content.length) {
                break;
            }
            buffer += currentCharacter;
        }
    }
}


function verifyXML(string: string) {
    let parser = sax.parser(true, {});
    try {
        parser.write(string).close();
        return true;
    } catch (e) {
        return false;
    }
}


/**
 * Something started with a lower sign <
 */
function scanXMLOrOperator(scanner: AS3Scanner, startingCharacterc: string): Token {
    let xmlToken = scanXML(scanner);
    if (xmlToken != null && verifyXML(xmlToken.text)) {
        return xmlToken;
    }
    return scanCharacterSequence(scanner, startingCharacterc, ['<<<=', '<<<', '<<=', '<<', '<=']);
}


export = AS3Scanner;
