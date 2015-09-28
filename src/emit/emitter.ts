import * as NodeKind from '../syntax/nodeKind';
import * as Keywords from '../syntax/keywords';
import Node from '../syntax/node';
import assign = require('object-assign');


const GLOBAL_NAMES = [
    'undefined', 'NaN', 'Infinity',
    'Array', 'Boolean', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
    'int', 'isFinite', 'isNaN', 'isXMLName', 'Number', 'Object',
    'parseFloat', 'parseInt', 'String', 'trace', 'uint', 'unescape', 'Vector', 'XML', 'XMLList',
    'ArgumentError', 'arguments', 'Class', 'Date', 'DefinitionError', 'Error', 'EvalError', 'Function', 'Math', 'Namespace',
    'QName', 'RangeError', 'ReferenceError', 'RegExp', 'SecurityError', 'SyntaxError', 'TypeError', 'URIError', 'VerifyError'
];


interface Scope {
    parent: Scope;
    declarations: Declaration[];
    className?: string;
}


interface Declaration {
    name: string;
    bound?: string;
}


export interface EmitterOptions {
    lineSeparator: string;
}


interface NodeVisitor {
    (emitter: Emitter, node: Node):void
}


const VISITORS: {[kind: string]: NodeVisitor} = {
    [NodeKind.PACKAGE]: emitPackage,
    [NodeKind.META]: emitMeta,
    [NodeKind.IMPORT]: emitImport,
    [NodeKind.INCLUDE]: emitInclude,
    [NodeKind.USE]: emitInclude,
    [NodeKind.FUNCTION]: emitFunction,
    [NodeKind.LAMBDA]: emitFunction,
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
};


function visitNodes(emitter: Emitter, nodes: Node[]) {
    if (nodes) {
        nodes.forEach(node => visitNode(emitter, node));
    }
}


function visitNode(emitter: Emitter, node: Node) {
    if (node) {
        if (VISITORS.hasOwnProperty(node.kind)) {
            VISITORS[node.kind](emitter, node);
        } else {
            emitter.catchup(node.start);
            visitNodes(emitter, node.children);
        }
    }
}


function filterAST(node: Node): Node {
    //we don't care about comment
    function isInteresting(child: Node) {
        return !!child &&
                child.kind !== NodeKind.AS_DOC &&
                child.kind !== NodeKind.MULTI_LINE_COMMENT;
    }

    let newNode = new Node(
            node.kind,
            node.start,
            node.end,
            node.text,
            node.children
                    .filter(isInteresting)
                    .map(filterAST));

    newNode.children.forEach(child => child.parent = newNode);

    return newNode;
}


export default class Emitter {
    private source: string;
    private options: EmitterOptions;

    private output: string = '';

    private index: number = 0;
    private scope: Scope = null;

    public isNew: boolean = false;
    public emitThisForNextIdent: boolean = true;

    constructor(source: string, options?: EmitterOptions) {
        this.source = source;
        this.options = assign({lineSeparator: '\n'}, options || {});
    }

    emit(ast: Node) {
        this.withScope([], () => {
            visitNode(this, filterAST(ast));
            this.catchup(this.source.length - 1);
        });
        return this.output;
    }

    enterScope(declarations: Declaration[]) {
        return this.scope = {parent: this.scope, declarations};
    }

    exitScope(checkScope: Scope = null) {
        if (checkScope && this.scope != checkScope) {
            throw new Error("Mismatched enterScope() / exitScope().");
        }
        if (!this.scope) {
            throw new Error("Unmatched exitScope().");
        }
        this.scope = this.scope.parent;
    }

    withScope(declarations: Declaration[], body: (scope: Scope) => void) {
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

    declareInScope(declaration: Declaration) {
        this.scope.declarations.push(declaration);
    }

    findDefInScope(text: string) {
        var scope = this.scope;
        while (scope) {
            for (var i = 0; i < scope.declarations.length; i++) {
                if (scope.declarations[i].name === text) {
                    return scope.declarations[i];
                }
            }
            scope = scope.parent;
        }
        return null;
    }

    commentNode(node: Node, catchSemi: boolean) {
        this.insert('/*');
        this.catchup(node.end);
        var index = this.index;
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

    catchup(index: number) {
        if (this.index >= index) {
            return;
        }
        var text = this.source.substring(this.index, index);
        this.index = index;
        this.insert(text);
    }

    skipTo(index: number) {
        this.index = index;
    }

    skip(number: number) {
        this.index += number;
    }

    insert(string: string) {
        this.output += string;
    }

    consume(string: string, limit: number) {
        var index = this.source.indexOf(string, this.index) + string.length;
        if (index > limit || index < this.index) {
            throw new Error('invalid consume');
        }
        this.index = index;
    }
}


function emitPackage(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    emitter.skip(NodeKind.PACKAGE.length);
    emitter.insert('module');
    visitNodes(emitter, node.children);
}


function emitMeta(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    emitter.commentNode(node, false);
}


function emitInclude(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    emitter.commentNode(node, true);
}


function emitImport(emitter: Emitter, node: Node) {
    emitter.catchup(node.start + NodeKind.IMPORT.length + 1);
    var split = node.text.split('.');
    var name = split[split.length - 1];
    emitter.insert(name + ' = ');
    emitter.catchup(node.end);

    emitter.declareInScope({name});
}


function emitInterface(emitter: Emitter, node: Node) {
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
                emitter.skip(8);
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
        })
    }
}


function getFunctionDeclarations(emitter: Emitter, node: Node) {
    let decls: Declaration[] = [];
    let params = node.findChild(NodeKind.PARAMETER_LIST);
    if (params && params.children.length) {
        decls = params.children.map(param => {
            let nameTypeInit = param.findChild(NodeKind.NAME_TYPE_INIT);
            if (nameTypeInit) {
                return {name: nameTypeInit.findChild(NodeKind.NAME).text}
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


function emitFunction(emitter: Emitter, node: Node) {
    emitDeclaration(emitter, node);
    emitter.withScope(getFunctionDeclarations(emitter, node), () => {
        let rest = node.getChildFrom(NodeKind.MOD_LIST);
        visitNodes(emitter, rest);
    });
}


function getClassDeclarations(className: string, contentsNode: Node[]) {
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
            bound: isStatic ? className : 'this'
        };
    }).filter(el => !!el);
}


function emitClass(emitter: Emitter, node: Node) {
    emitDeclaration(emitter, node);

    let name = node.findChild(NodeKind.NAME);

    let content = node.findChild(NodeKind.CONTENT);
    let contentsNode = content && content.children;
    if (!contentsNode) {
        return;
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
}


function emitSet(emitter: Emitter, node: Node) {
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

    emitter.withScope(getFunctionDeclarations(emitter, node), () => {
        visitNodes(emitter, node.getChildFrom(NodeKind.TYPE));
    });
}


function emitConstList(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    let nameTypeInit = node.findChild(NodeKind.NAME_TYPE_INIT);
    emitter.skipTo(nameTypeInit.start);
    emitter.insert('var ');
    visitNode(emitter, nameTypeInit);
}


function emitMethod(emitter: Emitter, node: Node) {
    let name = node.findChild(NodeKind.NAME);
    if (node.kind !== NodeKind.FUNCTION || name.text !== emitter.currentClassName) {
        emitClassField(emitter, node);
        emitter.consume('function', name.start);
        emitter.catchup(name.end)
    } else {
        let mods = node.findChild(NodeKind.MOD_LIST);
        if (mods) {
            emitter.catchup(mods.start);
        }
        emitter.insert('constructor');
        emitter.skipTo(name.end);
    }
    emitter.withScope(getFunctionDeclarations(emitter, node), () => {
        visitNodes(emitter, node.getChildFrom(NodeKind.NAME));
    })
}


function emitPropertyDecl(emitter: Emitter, node: Node, isConst = false) {
    emitClassField(emitter, node);
    let name = node.findChild(NodeKind.NAME_TYPE_INIT);
    emitter.consume(isConst ? 'const' : 'var', name.start);
    visitNode(emitter, name);
}


function emitClassField(emitter: Emitter, node: Node) {
    let mods = node.findChild(NodeKind.MOD_LIST);
    if (mods) {
        emitter.catchup(mods.start);
        mods.children.forEach(node => {
            emitter.catchup(node.start);
            if (node.text !== 'private' && node.text !== 'public' && node.text !== 'protected' && node.text !== 'static') {
                emitter.commentNode(node, false);
            }
            emitter.catchup(node.end);
        });
    }
}


function emitDeclaration(emitter: Emitter, node: Node) {
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


function emitType(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    emitter.skip(node.text.length);
    let type: string;
    switch (node.text) {
        case 'String':
            type = 'string';
            break;
        case 'Boolean':
            type = 'boolean';
            break;
        case 'Number':
        case 'int':
        case 'uint':
            type = 'number';
            break;
        case '*':
            type = 'any';
            break;
        case 'Array':
            type = 'any[]';
            break;
        default:
            type = node.text;
    }
    emitter.insert(type);
}


function emitVector(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    let type = node.findChild(NodeKind.TYPE);
    if (type) {
        emitter.skipTo(type.start);
        emitType(emitter, type);
        emitter.insert('[]');
    } else {
        emitter.insert('any[]');
    }
    emitter.skipTo(node.end);
}


function emitShortVector(emitter: Emitter, node: Node) {
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
    if (arrayLiteral.children && arrayLiteral.children.length) {
        emitter.skipTo(arrayLiteral.children[0].start);
        visitNodes(emitter, arrayLiteral.children);
        emitter.catchup(arrayLiteral.lastChild.end);
    }
    emitter.insert(')');
    emitter.skipTo(node.end);
}


function emitNew(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    emitter.isNew = true;
    emitter.emitThisForNextIdent = false;
    visitNodes(emitter, node.children);
    emitter.isNew = false;
}


function emitCall(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    let isNew = emitter.isNew;
    emitter.isNew = false;
    if (node.children[0].kind === NodeKind.VECTOR) {
        if (isNew) {
            let vector = node.children[0];
            emitter.catchup(vector.start);
            emitter.insert('Array');
            emitter.insert('<');
            let type = vector.findChild(NodeKind.TYPE);
            if (type) {
                emitter.skipTo(type.start);
                emitType(emitter, type);
            } else {
                emitter.insert('any');
            }
            emitter.skipTo(vector.end);
            emitter.insert('>');
            visitNodes(emitter, node.getChildFrom(NodeKind.VECTOR));
            return;
        }

        let args = node.findChild(NodeKind.ARGUMENTS);
        //vector conversion lets just cast to array
        if (args.children.length === 1) {
            emitter.insert('(<');
            emitVector(emitter, node.children[0]);
            emitter.insert('>');
            emitter.skipTo(args.children[0].start);
            visitNode(emitter, args.children[0]);
            emitter.catchup(node.end);
            return;
        }
    }
    visitNodes(emitter, node.children);
}


function emitRelation(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    let as = node.findChild(NodeKind.AS);
    if (as) {
        if (node.lastChild.kind === NodeKind.IDENTIFIER) {
            emitter.insert('<');
            emitter.insert(node.lastChild.text);
            emitter.insert('>');
            visitNodes(emitter, node.getChildUntil(NodeKind.AS));
            emitter.catchup(as.start);
            emitter.skipTo(node.end);
        } else {
            emitter.commentNode(node, false);
        }
        return;
    }
    visitNodes(emitter, node.children);
}


function emitOp(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    if (node.text === "is") {
        emitter.insert('instanceof');
        emitter.skipTo(node.end);
        return;
    }
    emitter.catchup(node.end);
}


function emitIdent(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    if (node.parent && node.parent.kind === NodeKind.DOT) {
        //in case of dot just check the first
        if (node.parent.children[0] !== node) {
            return;
        }
    }

    if (Keywords.isKeyWord(node.text)) {
        return;
    }

    let def = emitter.findDefInScope(node.text);
    if (def && def.bound) {
        emitter.insert(def.bound + '.');
    }
    if (!def &&
            emitter.currentClassName &&
            GLOBAL_NAMES.indexOf(node.text) === -1 &&
            emitter.emitThisForNextIdent &&
            node.text !== emitter.currentClassName) {
        emitter.insert('this.');
    }
    emitter.emitThisForNextIdent = true;
}


function emitXMLLiteral(emitter: Emitter, node: Node) {
    emitter.catchup(node.start);
    emitter.insert(JSON.stringify(node.text));
    emitter.skipTo(node.end);
}


export function emit(ast: Node, source: string, options?: EmitterOptions) {
    let emitter = new Emitter(source, options);
    return emitter.emit(ast);
}
