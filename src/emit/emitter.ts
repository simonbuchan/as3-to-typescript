import NodeKind from '../syntax/nodeKind';
import * as Keywords from '../syntax/keywords';
import Node, {createNode} from '../syntax/node';
import assign = require('object-assign');
import { Bridge } from "../bridge"

const util = require('util');

const GLOBAL_NAMES = [
    'undefined', 'NaN', 'Infinity',
    'Array', 'Boolean', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
    'int', 'isFinite', 'isNaN', 'isXMLName', 'Number', 'Object',
    'parseFloat', 'parseInt', 'String', 'trace', 'uint', 'unescape', 'Vector', 'XML', 'XMLList',
    'ArgumentError', 'arguments', 'Class', 'Date', 'DefinitionError', 'Error', 'EvalError', 'Function', 'Math',
    'Namespace', 'QName', 'RangeError', 'ReferenceError', 'RegExp', 'SecurityError', 'SyntaxError', 'TypeError',
    'URIError', 'VerifyError', 'Error', 'JSON'
];

const TYPE_REMAP: { [id: string]: string } = {
    'Class': 'Object',
    'String': 'string',
    'Boolean': 'boolean',
    'Number': 'number',
    'int': 'number',
    'uint': 'number',
    '*': 'any',
    'Array': 'any[]',
    'Dictionary': 'Map<any, any>',
}

const IDENTIFIER_REMAP: { [id: string]: string } = {
    'Dictionary': 'Map<any, any>'
}

interface Scope {
    parent: Scope;
    declarations: Declaration[];
    className?: string;
}


interface Declaration {
    name: string;
    type?: string;
    bound?: string;
}


export interface EmitterOptions {
    lineSeparator: string;
    useNamespaces: boolean;
    bridge?: Bridge;
    definitionsByNamespace?: {[ns: string]: string[]};
}


interface NodeVisitor {
    (emitter: Emitter, node: Node): void;
}


const VISITORS: {[kind: number]: NodeVisitor} = {
    [NodeKind.PACKAGE]: emitPackage,
    [NodeKind.META]: emitMeta,
    [NodeKind.IMPORT]: emitImport,
    [NodeKind.INCLUDE]: emitInclude,
    [NodeKind.USE]: emitInclude,
    [NodeKind.FUNCTION]: emitFunction,
    [NodeKind.LAMBDA]: emitFunction,
    [NodeKind.FOREACH]: emitForEach,
    [NodeKind.INTERFACE]: emitInterface,
    [NodeKind.CLASS]: emitClass,
    [NodeKind.VECTOR]: emitVector,
    [NodeKind.SHORT_VECTOR]: emitShortVector,
    [NodeKind.TYPE]: emitType,
    [NodeKind.CALL]: emitCall,
    [NodeKind.NEW]: emitNew,
    [NodeKind.RELATION]: emitRelation,
    [NodeKind.OP]: emitOp,
    [NodeKind.IDENTIFIER]: emitIdent,
    [NodeKind.XML_LITERAL]: emitXMLLiteral,
    [NodeKind.CONST_LIST]: emitConstList,
    [NodeKind.VALUE]: emitObjectValue,
    [NodeKind.DOT]: emitDot,
    [NodeKind.LITERAL]: emitLiteral,
    [NodeKind.ARRAY]: emitArray
};


export function visitNodes(emitter: Emitter, nodes: Node[]): void {
    if (nodes) {
        nodes.forEach(node => visitNode(emitter, node));
    }
}


export function visitNode(emitter: Emitter, node: Node): void {
    if (!node) {
        return;
    }

    // use custom bridge visitor. allow custom node manipulation
    if (emitter.hasBridge) {
        if (emitter.options.bridge.visitor(emitter, node) === true) {
            return;
        }
    }

    let visitor = VISITORS[node.kind] || function (emitter: Emitter, node: Node): void {
        emitter.catchup(node.start);
        visitNodes(emitter, node.children);
    };
    visitor(emitter, node);
}


function filterAST(node: Node): Node {
    function isInteresting(child: Node): boolean {
        // we don't care about comment
        return !!child && child.kind !== NodeKind.AS_DOC && child.kind !== NodeKind.MULTI_LINE_COMMENT;
    }

    let newNode = createNode(
        node.kind,
        node,
        ... node.children.filter(isInteresting).map(filterAST));

    newNode.children.forEach(child => child.parent = newNode);

    return newNode;
}


export default class Emitter {
    public isNew: boolean = false;
    public emitThisForNextIdent: boolean = true;

    public source: string;
    public options: EmitterOptions;

    public headOutput: string = "";

    public output: string = '';
    public index: number = 0;

    private scope: Scope = null;

    constructor(source: string, options?: EmitterOptions) {
        this.source = source;
        this.options = assign({lineSeparator: '\n', useNamespaces: false}, options || {});
    }

    emit(ast: Node): string {
        this.withScope([], () => {
            visitNode(this, filterAST(ast));
            this.catchup(this.source.length - 1);
        });
        return this.headOutput + this.output;
    }

    enterScope(declarations: Declaration[]): Scope {
        return this.scope = {parent: this.scope, declarations};
    }

    exitScope(checkScope: Scope = null): void {
        if (checkScope && this.scope !== checkScope) {
            throw new Error('Mismatched enterScope() / exitScope().');
        }
        if (!this.scope) {
            throw new Error('Unmatched exitScope().');
        }
        this.scope = this.scope.parent;
    }

    withScope(declarations: Declaration[], body: (scope: Scope) => void): void {
        let scope = this.enterScope(declarations);
        try {
            body(scope);
        } finally {
            this.exitScope(scope);
        }
    }

    get currentClassName(): string {
        for (var scope = this.scope; scope; scope = scope.parent) {
            if (scope.className) {
                return scope.className;
            }
        }
        return null;
    }

    get hasBridge (): boolean {
        return this.options.bridge !== null;
    }

    declareInScope(declaration: Declaration): void {
        this.scope.declarations.push(declaration);
    }

    findDefInScope(text: string): Declaration {
        let scope = this.scope;
        while (scope) {
            for (let i = 0; i < scope.declarations.length; i++) {
                if (scope.declarations[i].name === text) {
                    return scope.declarations[i];
                }
            }
            scope = scope.parent;
        }
        return null;
    }

    commentNode(node: Node, catchSemi: boolean): void {
        this.insert('/*');
        this.catchup(node.end);
        let index = this.index;
        if (catchSemi) {
            while (true) {
                if (index >= this.source.length) {
                    break;
                }
                if (this.source[index] === '\n') {
                    this.catchup(index);
                    break;
                }
                if (this.source[index] === ';') {
                    this.catchup(index + 1);
                    break;
                }
                index++;
            }
        }
        this.insert('*/');
    }

    catchup(index: number): void {
        if (this.index >= index) {
            return;
        }
        let text = this.sourceBetween(this.index, index);
        this.index = index;
        this.insert(text);
    }

    sourceBetween (start: number, end: number) {
        return this.source.substring(start, end);
    }

    skipTo(index: number): void {
        this.index = index;
    }

    skip(number: number): void {
        this.index += number;
    }

    insert(string: string): void {
        this.output += string;
    }

    consume(string: string, limit: number): void {
        let index = this.source.indexOf(string, this.index) + string.length;
        if (index > limit || index < this.index) {
            throw new Error('invalid consume');
        }
        this.index = index;
    }
}


function emitPackage(emitter: Emitter, node: Node): void {
    if (emitter.options.useNamespaces) {
        emitter.catchup(node.start);
        emitter.skip(Keywords.PACKAGE.length);
        emitter.insert('namespace');
        visitNodes(emitter, node.children);

    } else {
        emitter.catchup(node.start);
        emitter.skip(Keywords.PACKAGE.length + node.children[0].text.length + 4);

        visitNodes(emitter, node.children);
        emitter.catchup(node.end - 1);
        emitter.skip(1);
    }
}


function emitMeta(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    emitter.commentNode(node, false);
}


function emitInclude(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    emitter.commentNode(node, true);
}


function emitImport(emitter: Emitter, node: Node): void {
    let statement = Keywords.IMPORT + " ";

    // emit one import statement for each definition found in that namespace
    if (node.text.indexOf("*") !== -1) {
        let ns = node.text.substring(0, node.text.length - 2);
        let definitions = emitter.options.definitionsByNamespace[ ns ];

        let skipTo = node.end;

        if (definitions && definitions.length > 0) {
            definitions.forEach(definition => {
                let importNode = createNode(node.kind, node);
                importNode.text = `${ ns }.${ definition }`;
                importNode.parent = node.parent;
                emitImport(emitter, importNode);
                emitter.insert(";\n");
            })

            skipTo = node.end + Keywords.IMPORT.length + 2;

        } else {
            let diff = node.text.length - ns.length + 5;
            node.end += diff;
            console.warn(`emitter.ts: emitImport() => : nothing found to import on namespace ${ ns }. (import ${ node.text })`)
        }

        emitter.skipTo(skipTo);
        return;
    }

    let text = node.text;

    // apply "bridge" translation
    if (emitter.hasBridge) {
        text = node.text.concat();
        emitter.options.bridge.imports.forEach((replacement, regexp) => {
            text = text.replace(regexp, replacement);
        });
    }

    if (emitter.options.useNamespaces) {
        emitter.catchup(node.start);
        emitter.insert(statement);

        let split = node.text.split('.');
        let name = split[split.length - 1];
        emitter.insert(name + ' = ');

        // apply "bridge" translation
        if (emitter.hasBridge) {
            let diff = node.text.length - text.length;

            emitter.insert(text);
            emitter.skip(text.length + diff + statement.length);

        } else {
            emitter.catchup(node.end + statement.length);
        }

        emitter.declareInScope({name});

    } else {

        emitter.catchup(node.start);
        emitter.insert(Keywords.IMPORT + " ");

        let split = text.split(".");
        let name = split.pop();

        // Find current module name to output relative import
        let currentModule = "";
        let parentNode = node.parent;
        while (parentNode) {
            if (parentNode.kind === NodeKind.PACKAGE) {
                currentModule = parentNode.children[0].text;
                break;
            }
            parentNode = parentNode.parent;
        }

        text = `{ ${ name } } from "${ getRelativePath(currentModule.split("."), text.split(".")) }"`;
        emitter.insert(text);
        emitter.skipTo(node.end + Keywords.IMPORT.length + 1);
        emitter.declareInScope({name});
    }
}

function getRelativePath (currentPath: string[], targetPath: string[]) {
    while (currentPath.length > 0 && targetPath[0] === currentPath[0]) {
        currentPath.shift();
        targetPath.shift();
    }

    let relative = (currentPath.length === 0)
        ? "."
        : currentPath.map(() => "..").join("/")

    return `${ relative }/${ targetPath.join("/") }`;
}

function getDeclarationType (node: Node): string {
    let declarationType: string = null;
    let typeNode = node && node.findChild(NodeKind.TYPE);

    if (typeNode) {
        declarationType = TYPE_REMAP[ typeNode.text ] || typeNode.text;
    }

    return declarationType;
}

function ensureImportIdentifier (emitter: Emitter, node: Node): void {
    // Ensure this file is not declaring this class
    if (
        emitter.source.indexOf(`class ${ node.text}`) === -1 &&
        !emitter.findDefInScope(node.text)
    ) {
        emitter.headOutput += `import { ${ node.text} } from "./${ node.text }";\n`;
        emitter.declareInScope({ name: node.text });
    }
}

function emitInterface(emitter: Emitter, node: Node): void {
    emitDeclaration(emitter, node);

    //we'll catchup the other part
    emitter.declareInScope({
        name: node.findChild(NodeKind.NAME).text
    });

    let content = node.findChild(NodeKind.CONTENT);
    let contentsNode = content && content.children;
    let foundVariables: { [name: string]: boolean } = {};
    if (contentsNode) {
        contentsNode.forEach(node => {
            visitNode(emitter, node.findChild(NodeKind.META_LIST));
            emitter.catchup(node.start);

            if (node.kind === NodeKind.FUNCTION) {
                emitter.skip(Keywords.FUNCTION.length);
                visitNode(emitter, node.findChild(NodeKind.PARAMETER_LIST));

            } else if (node.kind === NodeKind.GET || node.kind === NodeKind.SET) {
                let name = node.findChild(NodeKind.NAME);
                let parameterList = node.findChild(NodeKind.PARAMETER_LIST);
                if (!foundVariables[name.text]) {
                    emitter.skipTo(name.start);
                    emitter.catchup(name.end);
                    foundVariables[name.text] = true;

                    if (node.kind === NodeKind.GET) {
                        emitter.skipTo(parameterList.end);
                        let type = node.findChild(NodeKind.TYPE);
                        if (type) {
                            emitType(emitter, type);
                        }

                    } else if (node.kind === NodeKind.SET) {
                        let setParam = parameterList.findChild(NodeKind.PARAMETER).children[0];
                        emitter.skipTo(setParam.findChild(NodeKind.NAME).end);
                        let type = setParam.findChild(NodeKind.TYPE);
                        if (type) {
                            emitType(emitter, type);
                        }
                        emitter.skipTo(node.end);
                    }

                } else {
                    emitter.commentNode(node, true);
                }

            } else {
                //include or import in interface content not supported
                emitter.commentNode(node, true);
            }
        });
    }
}


function getFunctionDeclarations(node: Node): Declaration[] {
    let decls: Declaration[] = [];
    let params = node.findChild(NodeKind.PARAMETER_LIST);
    if (params && params.children.length) {
        decls = params.children.map(param => {
            let nameTypeInit = param.findChild(NodeKind.NAME_TYPE_INIT);
            if (nameTypeInit) {
                return {
                    name: nameTypeInit.findChild(NodeKind.NAME).text,
                    type: getDeclarationType(nameTypeInit)
                };
            }
            let rest = param.findChild(NodeKind.REST);
            return {name: rest.text};
        });
    }
    let block = node.findChild(NodeKind.BLOCK);
    if (block) {
        function traverse(node: Node): Declaration[] {
            let result: Declaration[] = [];
            if (node.kind === NodeKind.VAR_LIST || node.kind === NodeKind.CONST_LIST ||
                    node.kind === NodeKind.VAR || node.kind === NodeKind.CONST) {
                result = result.concat(
                    node
                        .findChildren(NodeKind.NAME_TYPE_INIT)
                        .map(node => ({name: node.findChild(NodeKind.NAME).text}))
                );
            }
            if (node.kind !== NodeKind.FUNCTION && node.children && node.children.length) {
                result = Array.prototype.concat.apply(result, node.children.map(traverse));
            }
            return result.filter(decl => !!decl);
        }

        decls = decls.concat(traverse(block));
    }
    return decls;
}


function emitFunction(emitter: Emitter, node: Node): void {
    emitDeclaration(emitter, node);
    emitter.withScope(getFunctionDeclarations(node), () => {
        let rest = node.getChildFrom(NodeKind.MOD_LIST);
        visitNodes(emitter, rest);
    });
}


function emitForEach(emitter: Emitter, node: Node): void {
    let varNode = node.children[0];
    let inNode = node.children[1];
    let blockNode = node.children[2];

    emitter.catchup(node.start + Keywords.FOR.length + 1);
    emitter.skip(4); // "each"

    let nameTypeInitNode = varNode.findChild(NodeKind.NAME_TYPE_INIT);
    if (nameTypeInitNode) {
        // don't emit variable type on for..of statements
        let nameNode = nameTypeInitNode.findChild(NodeKind.NAME);
        emitter.catchup(varNode.start);
        emitter.insert(`let ${ nameNode.text }`);
        emitter.skipTo(varNode.end);
    } else {
        visitNode(emitter, varNode);
    }

    emitter.catchup(inNode.start);
    emitter.skip(Keywords.IN.length + 1); // replace "in " with "of "
    emitter.insert('of ');

    visitNodes(emitter, inNode.children);
    visitNode(emitter, blockNode);
}


function getClassDeclarations(className: string, contentsNode: Node[]): Declaration[] {
    let found: { [name: string]: boolean } = {};

    return contentsNode.map(node => {
        let nameNode: Node;

        switch (node.kind) {
            case NodeKind.SET:
            case NodeKind.GET:
            case NodeKind.FUNCTION:
                nameNode = node.findChild(NodeKind.NAME);
                break;
            case NodeKind.VAR_LIST:
            case NodeKind.CONST_LIST:
                nameNode = node.findChild(NodeKind.NAME_TYPE_INIT).findChild(NodeKind.NAME);
                break;
            default:
                break;
        }
        if (!nameNode || found[nameNode.text]) {
            return null;
        }
        found[nameNode.text] = true;
        if (nameNode.text === className) {
            return;
        }

        let modList = node.findChild(NodeKind.MOD_LIST);
        let isStatic = modList && modList.children.some(mod => mod.text === 'static');
        return {
            name: nameNode.text,
            type: getDeclarationType(node.findChild(NodeKind.NAME_TYPE_INIT)),
            bound: isStatic ? className : 'this'
        };
    }).filter(el => !!el);
}


function emitClass(emitter: Emitter, node: Node): void {
    emitDeclaration(emitter, node);

    let name = node.findChild(NodeKind.NAME);

    let content = node.findChild(NodeKind.CONTENT);
    let contentsNode = content && content.children;
    if (!contentsNode) {
        return;
    }

    // ensure extends identifier is being imported
    let extendsNode = node.findChild(NodeKind.EXTENDS);
    if (extendsNode) {
        ensureImportIdentifier(emitter, extendsNode);
    }

    // ensure implements identifiers are being imported
    let implementsNode = node.findChild(NodeKind.IMPLEMENTS_LIST);
    if (implementsNode) {
        implementsNode.children.forEach((node) => ensureImportIdentifier(emitter, node))
    }

    emitter.withScope(getClassDeclarations(name.text, contentsNode), scope => {
        scope.className = name.text;

        contentsNode.forEach(node => {
            visitNode(emitter, node.findChild(NodeKind.META_LIST));
            emitter.catchup(node.start);
            switch (node.kind) {
                case NodeKind.SET:
                    emitSet(emitter, node);
                    break;
                case NodeKind.GET:
                case NodeKind.FUNCTION:
                    emitMethod(emitter, node);
                    break;
                case NodeKind.VAR_LIST:
                    emitPropertyDecl(emitter, node);
                    break;
                case NodeKind.CONST_LIST:
                    emitPropertyDecl(emitter, node, true);
                    break;
                default:
                    visitNode(emitter, node);
            }
        });
    });

    emitter.catchup(node.end);
}

function emitSet(emitter: Emitter, node: Node): void {
    emitClassField(emitter, node);

    let name = node.findChild(NodeKind.NAME);
    emitter.consume('function', name.start);

    let params = node.findChild(NodeKind.PARAMETER_LIST);
    visitNode(emitter, params);
    emitter.catchup(params.end);

    let type = node.findChild(NodeKind.TYPE);
    if (type) {
        emitter.skipTo(type.end);
    }

    emitter.withScope(getFunctionDeclarations(node), () => {
        visitNodes(emitter, node.getChildFrom(NodeKind.TYPE));
    });
}


function emitConstList(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    let nameTypeInit = node.findChild(NodeKind.NAME_TYPE_INIT);
    emitter.skipTo(nameTypeInit.start);
    emitter.insert('var ');
    visitNode(emitter, nameTypeInit);
}

function emitObjectValue(emitter: Emitter, node: Node): void {
    visitNodes(emitter, node.children);
}

function emitMethod(emitter: Emitter, node: Node): void {
    let name = node.findChild(NodeKind.NAME);
    if (node.kind !== NodeKind.FUNCTION || name.text !== emitter.currentClassName) {
        emitClassField(emitter, node);
        emitter.consume('function', name.start);
        emitter.catchup(name.end);
    } else {
        let mods = node.findChild(NodeKind.MOD_LIST);
        if (mods) {
            emitter.catchup(mods.start);
        }
        emitter.insert('constructor');
        emitter.skipTo(name.end);

        // // find "super" on constructor and move it to the beginning of the
        // // block
        // let blockNode = node.findChild(NodeKind.BLOCK);
        // let blockSuperIndex = -1;
        // for (var i = 0, len = blockNode.children.length; i < len; i++) {
        //     let blockChildNode = blockNode.children[i];
        //     if (blockChildNode.kind === NodeKind.CALL
        //         && blockChildNode.children[0].text === "super") {
        //         blockSuperIndex = i;
        //         break;
        //     }
        // }
        //
        // if (childCalls.length > 0) {
        //     console.log(childCalls)
        //     let superIndex = -1;
        //     childCalls.forEach((child, i) => {
        //         if (child.children[0].text === "super") superIndex = blockNode.children.indexOf(child);
        //     })
        //     console.log("super index:", superIndex)
        // }

    }
    emitter.withScope(getFunctionDeclarations(node), () => {
        visitNodes(emitter, node.getChildFrom(NodeKind.NAME));
    });
}


function emitPropertyDecl(emitter: Emitter, node: Node, isConst = false): void {
    emitClassField(emitter, node);
    let name = node.findChild(NodeKind.NAME_TYPE_INIT);
    emitter.consume(isConst ? Keywords.CONST : Keywords.VAR, name.start);
    visitNode(emitter, name);
}


function emitClassField(emitter: Emitter, node: Node): void {
    let mods = node.findChild(NodeKind.MOD_LIST);
    if (mods) {
        emitter.catchup(mods.start);
        mods.children.forEach(node => {
            emitter.catchup(node.start);
            if (node.text !== Keywords.PRIVATE &&
                    node.text !== Keywords.PUBLIC &&
                    node.text !== Keywords.PROTECTED &&
                    node.text !== Keywords.STATIC) {
                emitter.commentNode(node, false);
            }
            emitter.catchup(node.end);
        });
    }
}


function emitDeclaration(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    visitNode(emitter, node.findChild(NodeKind.META_LIST));
    let mods = node.findChild(NodeKind.MOD_LIST);
    if (mods && mods.children.length) {
        emitter.catchup(mods.start);
        let insertExport = false;
        mods.children.forEach(node => {
            if (node.text !== 'private') {
                insertExport = true;
            }
            emitter.skipTo(node.end);
        });
        if (insertExport) {
            emitter.insert('export');
        }
    }
}


function emitType(emitter: Emitter, node: Node): void {
    // Don't emit type on 'constructor' functions.
    if (node.parent.kind === NodeKind.FUNCTION) {
        let name = node.parent.findChild(NodeKind.NAME);
        if (name && name.text === emitter.currentClassName) {
            emitter.catchup(node.previousSibling.end);
            emitter.skipTo(node.end);
            return;
        }
    }

    emitter.catchup(node.start);

    if (!node.text) {
        return;
    }

    emitter.skipTo(node.end);

    let typeName = node.text;

    if (TYPE_REMAP[node.text]) {
        typeName = TYPE_REMAP[node.text];
    }

    emitter.insert(typeName);
}


function emitVector(emitter: Emitter, node: Node): void {
    if (!emitter.isNew) {
        emitter.catchup(node.start);
    }

    let type = node.findChild(NodeKind.TYPE);
    if (!type) {
        type = createNode(NodeKind.TYPE, {
            text: 'any',
            start: node.start,
            end: node.end
        });
        type.parent = node;
    }

    emitter.skipTo(type.start);

    if (!emitter.isNew) {
        emitType(emitter, type);
    }

    emitter.insert('[]');

    emitter.skipTo(node.end);
}


function emitShortVector(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    let vector = node.findChild(NodeKind.VECTOR);
    emitter.insert('Array');
    let type = vector.findChild(NodeKind.TYPE);
    if (type) {
        emitType(emitter, type);
    } else {
        emitter.insert('any');
    }
    emitter.catchup(vector.end);
    emitter.insert('(');
    let arrayLiteral = node.findChild(NodeKind.ARRAY);
    emitArray(emitter, arrayLiteral);
    emitter.insert(')');
    emitter.skipTo(node.end);
}


function emitNew(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    emitter.isNew = true;
    emitter.emitThisForNextIdent = false;
    visitNodes(emitter, node.children);
    emitter.isNew = false;
}


function emitCall(emitter: Emitter, node: Node): void {
    let isNew = emitter.isNew;
    emitter.isNew = false;
    if (node.children[0].kind === NodeKind.VECTOR) {
        if (isNew) {
            let vector = node.children[0];
            let args = node.children[1];

            emitter.insert('[');

            if (args.children.length > 0) {
                console.warn("emitter.ts: emitCall() => NodeKind.VECTOR with arguments not implemented.");
            }

            emitter.insert(']');

            // emitter.insert('Array');
            // emitter.insert('<');
            // let type = vector.findChild(NodeKind.TYPE);
            // if (type) {
            //     emitter.skipTo(type.start);
            //     emitType(emitter, type);
            // } else {
            //     emitter.insert('any');
            // }

            emitter.skipTo(args.end);

            // emitter.insert('>');
            // let vectorNode = node.getChildFrom(NodeKind.VECTOR)
            // visitNodes(emitter, vectorNode);

            return;
        }

        // let args = node.findChild(NodeKind.ARGUMENTS);
        // //vector conversion lets just cast to array
        // if (args.children.length === 1) {
        //     emitter.insert('(<');
        //     emitVector(emitter, node.children[0]);
        //     emitter.insert('>');
        //     emitter.skipTo(args.children[0].start);
        //     visitNode(emitter, args.children[0]);
        //     emitter.catchup(node.end);
        //     return;
        // }

    } else {
        emitter.catchup(node.start);
    }

    visitNodes(emitter, node.children);
}


function emitRelation(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    let as = node.findChild(NodeKind.AS);
    if (as) {
        // TODO: implement relation with type cast to vectors
        //       e.g. (myVector as Vector.<Boolean>)
        if (node.lastChild.kind === NodeKind.IDENTIFIER) {
            emitter.insert('(<');
            emitter.insert(node.lastChild.text);
            emitter.insert('>');
            visitNodes(emitter, node.getChildUntil(NodeKind.AS));
            emitter.catchup(as.start);
            emitter.insert(')');
            emitter.skipTo(node.end);

        } else if (node.lastChild.kind === NodeKind.VECTOR) {
            visitNodes(emitter, node.children);

        } else {
            emitter.commentNode(node, false);
        }
        return;
    }
    visitNodes(emitter, node.children);
}


function emitOp(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    if (node.text === Keywords.IS) {
        emitter.insert(Keywords.INSTANCE_OF);
        emitter.skipTo(node.end);
        return;
    }
    emitter.catchup(node.end);
}


export function emitIdent(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);

    if (node.parent && node.parent.kind === NodeKind.DOT) {
        //in case of dot just check the first
        if (node.parent.children[0] !== node) {
            return;
        }
    }

    if (Keywords.isKeyWord(node.text)) {
        emitter.insert(node.text);
        emitter.skipTo(node.end);
        return;
    }

    let def = emitter.findDefInScope(node.text);
    if (def && def.bound) {
        emitter.insert(def.bound + '.');
    }

    if (!def &&
        emitter.currentClassName &&
        GLOBAL_NAMES.indexOf(node.text) === -1 &&
        TYPE_REMAP[ node.text ] === undefined &&
        node.text !== emitter.currentClassName
    ) {
        if (node.text.match(/^[A-Z]/)) {
            // Import missing identifier from this namespace
            if (!emitter.options.useNamespaces) {
                ensureImportIdentifier(emitter, node);
            }

        } else if (emitter.emitThisForNextIdent) {
            // Identifier belongs to `this.` scope.
            emitter.insert('this.');
        }
    }

    if (IDENTIFIER_REMAP[node.text]) {
        node.text = IDENTIFIER_REMAP[node.text];
    }

    emitter.insert(node.text);
    emitter.skipTo(node.end);
    emitter.emitThisForNextIdent = true;
}

function emitDot (emitter: Emitter, node: Node) {
    let dotSibling = node.nextSibling;
    let isConditionalCompilation = (dotSibling && dotSibling.kind === NodeKind.BLOCK);
    let template = "if ($1)";

    if (!isConditionalCompilation && node.parent.kind === NodeKind.CONDITION) {
        let separator = emitter.sourceBetween(node.children[0].end, node.children[0].end + 2);
        isConditionalCompilation = (separator === "::");
        template = "$1";
    }

    // wrap conditional compilation into Node.js conditional for
    // `process.env.VARIABLE`
    //
    // More info about Flex conditional compilation:
    // http://help.adobe.com/en_US/flex/using/WS2db454920e96a9e51e63e3d11c0bf69084-7abd.html

    if (isConditionalCompilation) {
        emitter.catchup(node.start);
        emitter.insert(template.replace("$1", `process.env.${ node.children[1].text.toUpperCase() }`));
        emitter.skipTo(node.end);
        return;

    } else {
        // TODO: allow conditional compilation for function/class definitions

    }

    visitNodes(emitter, node.children);
}

function emitXMLLiteral(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    emitter.insert(JSON.stringify(node.text));
    emitter.skipTo(node.end);
}

function emitLiteral(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    emitter.insert(node.text);
    emitter.skipTo(node.end);
}

function emitArray(emitter: Emitter, node: Node): void {
    emitter.catchup(node.start);
    emitter.insert('[');
    if (node.children.length > 0) {
        emitter.skipTo(node.children[0].start);
        visitNodes(emitter, node.children);
        emitter.catchup(node.lastChild.end);
    }
    emitter.insert(']');
    emitter.skipTo(node.end);
}

export function emit(ast: Node, source: string, options?: EmitterOptions): string {
    let emitter = new Emitter(source, options);
    return emitter.emit(ast);
}
