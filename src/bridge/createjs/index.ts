import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, {
    EmitterOptions,
    visitNode,
    visitNodes,
    emitIdent
} from "../../emit/emitter";

import { getMapNodes } from "./utils";

const util = require('util');

// import translations
let imports = new Map<RegExp, string>();
imports.set(/^flash.[a-z]+\.([A-Za-z]+)/, "createjs.$1");

function visitor (emitter: Emitter, node: Node): boolean {

    //
    // translate `MouseEvent.EVENT_NAME` to `"eventname"`
    //
    if (node.kind === NodeKind.DOT) {
        if (node.children[0].text === "MouseEvent") {
            emitter.catchup(node.start);
            emitter.insert("\"" + node.children[1].text.replace("_", "").toLowerCase() + "\"");
            emitter.skipTo(node.end);

            return true;
        }
    }

    //
    // translate `StringUtil.trim(str)` into `str.trim()`
    //
    if (node.kind === NodeKind.CALL) {
        let dotNode = node.children[0];
        if (dotNode.kind === NodeKind.DOT) {
            let dotLeftNode = node.children[0].children[0];
            let dotRightNode = node.children[0].children[1];

            if (dotLeftNode.text === "StringUtil") {
                emitter.catchup(node.start);
                emitter.skipTo(node.end);
                visitNode(emitter, node.children[1].children[0]);
                emitter.insert(`.${ dotRightNode.text }()`);
                emitter.skipTo(node.end);
                return true;
            }
        }
    }

    //
    // translate `for..in` on Dictionaries into `for...of`
    // Example:
    //      Input:  for (var key:String in dictionary) {}
    //      Output: for ([ key, _ ] of dictionary) {}
    //
    //
    if (node.kind === NodeKind.FORIN || node.kind === NodeKind.FOREACH) {
        let lookInTarget = node.findChild(NodeKind.IN).findChild(NodeKind.IDENTIFIER);
        let definition = lookInTarget && emitter.findDefInScope(lookInTarget.text);
        if (definition && definition.type === "Map<any, any>") {

            emitter.catchup(node.start);

            let deepestFirstNode = node;
            do {
                deepestFirstNode = deepestFirstNode.children[0]
            } while (deepestFirstNode.children.length > 0);

            emitter.insert("for ([ ");

            if (node.kind === NodeKind.FORIN) {
                // Named argument is the KEY on FORIN statements
                emitter.insert(deepestFirstNode.text);
                emitter.insert(", _");

            } else if (node.kind === NodeKind.FOREACH) {
                // Named argument is the VALUE on FOREACH statements
                emitter.insert("_, ");
                emitter.insert(deepestFirstNode.text);

            }

            emitter.insert(" ] of ");

            emitter.skipTo(lookInTarget.end);
            visitNodes(emitter, node.children[1].children);
            // emitter.insert(")");

            return true;
        }
    }

    //
    // translate `new Dictionary(true)` into `new Map()`
    //
    if (node.kind === NodeKind.ARGUMENTS) {
        let previousSibling = node.previousSibling;
        if (previousSibling.kind === NodeKind.IDENTIFIER && previousSibling.text === "Map<any, any>") {
            // translate `new Dictionary(true)` into `new Map()`
            emitter.catchup(node.start);
            emitter.insert("()");
            emitter.skipTo(node.end);
            return true;
        }
    }

    //
    // translate `delete map['key']` into `map.delete('key')`
    //
    if (node.kind === NodeKind.DELETE) {
        let arrayAccessorNode = node.findChild(NodeKind.ARRAY_ACCESSOR);

        if (arrayAccessorNode) {
            let [ leftNode, rightNode ] = getMapNodes(emitter, arrayAccessorNode);

            if (leftNode && rightNode) {
                emitter.catchup(node.start);

                emitter.skipTo(leftNode.start);
                emitIdent(emitter, leftNode);
                emitter.insert(".delete(");

                emitter.skipTo(rightNode.start);
                visitNode(emitter, rightNode);
                emitter.insert(")");
                emitter.skipTo(node.end);

                return true;
            }
        }
    }

    //
    // translate `map['key']` into `map.get('key')`
    //
    if (node.kind === NodeKind.ARRAY_ACCESSOR) {
        let [ leftNode, rightNode, ...subsequentNodes ] = getMapNodes(emitter, node);

        if (leftNode && rightNode) {

            emitter.catchup(node.start);
            emitIdent(emitter, leftNode);
            emitter.insert(".get(");
            emitter.skipTo(rightNode.start);
            visitNode(emitter, rightNode);
            emitter.catchup(rightNode.end);
            emitter.insert(")");

            if (subsequentNodes.length > 0) {
                emitter.skipTo(subsequentNodes[0].start-1);
                visitNodes(emitter, subsequentNodes);
                emitter.skipTo(node.end-1);
            } else {

                emitter.skipTo(node.end);
            }

            return true;
        }
    }

    //
    // translate `map['key'] = 'value'` into `map.set('key', value)`
    //
    if (node.kind === NodeKind.ASSIGN) {
        let identifierNode = (node.children[0].kind === NodeKind.IDENTIFIER)
            ? node.children[0]
            : node.children[0].findChild(NodeKind.IDENTIFIER);

        let definition = identifierNode && emitter.findDefInScope(identifierNode.text);
        if (definition && definition.type === "Map<any, any>") {

            let arrayAccessorNode = node.findChild(NodeKind.ARRAY_ACCESSOR);
            if (arrayAccessorNode) {

                let [ leftNode, rightNode, ...subsequentNodes ] = getMapNodes(emitter, arrayAccessorNode);

                if (leftNode && rightNode) {
                    let valueNode = node.lastChild;

                    emitter.catchup(node.start);
                    emitIdent(emitter, leftNode);
                    emitter.insert(".set(");

                    emitter.skipTo(rightNode.start);
                    visitNode(emitter, rightNode);
                    emitter.catchup(rightNode.end);

                    emitter.insert(", ");

                    emitter.skipTo(valueNode.start);
                    visitNode(emitter, valueNode);

                    emitter.catchup(valueNode.end);
                    emitter.insert(")");

                    emitter.skipTo(node.end);

                    return true;
                }
            }

        }
    }

    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Remove dictionary imports
    contents = contents.replace(/import { Dictionary } from ".*createjs\/([a-zA-Z]+)";/gm, "");

    // Remove StringUtil imports (mx.utils.StringUtil)
    contents = contents.replace(/import { StringUtil } from ".*mx\/utils\/StringUtil";/gm, "");

    // fix createjs imports if using CommonJS
    if (!emitterOptions.useNamespaces) {
        contents = contents.replace(/import { ([a-zA-Z]+) } from ".*createjs\/([a-zA-Z]+)";/gm, "import $1 = createjs.$1;");
    }

    // Replace all 'var' to block-scoped 'let'
    contents = contents.replace(/\b(var)\b/gm, "let");

    // 1. Replace all listeners callbacks into arrow functions (to keep class scope)
    contents = contents.replace(
        /(public|private|protected)( static)?[^\w]+(\w+).*\(([^:]+.*Event.*)\).*(void)/g,
        "$1$2 $3 = ($4) =>"
    );

    // 2. Replace all `super.on{CallbackName}` calls.
    let overridesRegExp = /^(.*)\/\*override\*\/.*(public|private|protected)[^\w]+(\w+).*\([^:]+.*Event.*\)/gm;
    let callbackOverrides = contents.match(overridesRegExp);
    if (callbackOverrides && callbackOverrides.length > 0) {
        for (let i = 0, len = callbackOverrides.length; i < len; i++) {
            let matches = overridesRegExp.exec(callbackOverrides[i]);
            if (matches) {
                contents = contents.replace(matches.input, `${matches[1]}protected super_${matches[3]} = this.${matches[3]};\n${matches.input}`);
                // 3. Replace occurrences of super calls on callbacks
                contents = contents.replace(`super.${ matches[3] }`, `this.super_${ matches[3] }`);
            }
        }
    }

    return contents;
}

const typeMap: { [id: string]: string } = {
    'Sprite': 'Container'
}

const identifierMap: { [id: string]: string } = {
    'Sprite': 'Container'
}

export default {
    imports: imports,
    visitor: visitor,
    postProcessing: postProcessing,
    typeMap: typeMap,
    identifierMap: identifierMap,
}
