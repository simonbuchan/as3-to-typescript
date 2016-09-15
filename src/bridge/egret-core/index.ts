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
imports.set(/^flash.[a-z]+\.([A-Za-z]+)/, "egret.$1");

function visitor (emitter: Emitter, node: Node): boolean {

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
            return;

        // } else if (previousSibling.kind === NodeKind.IDENTIFIER && previousSibling.text === "addEventListener") {
        //     // translate `addEventListener(...)` into `addEventListener(..., this)`
        //     emitter.catchup(node.start);
        //
        //     node.children.forEach((child, i) => {
        //         console.log(i, child)
        //         emitter.catchup(child.start);
        //         emitter.skipTo(child.start);
        //         visitNode(emitter, child);
        //         if (i === 1) {
        //             emitter.skipTo(child.end);
        //             emitter.insert(", this");
        //         }
        //     });
        //
        //     // emitter.skipTo(node.end);
        //
        //     // console.log(node.children.length)
        //     // console.log(util.inspect(previousSibling, { showHidden: true, depth: null }));
        //     return;
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

        let definition = emitter.findDefInScope(identifierNode.text);
        if (definition && definition.type === "Map<any, any>") {

            let arrayAccessorNode = node.findChild(NodeKind.ARRAY_ACCESSOR);
            if (arrayAccessorNode) {

                let [ leftNode, rightNode, ...subsequentNodes ] = getMapNodes(emitter, arrayAccessorNode);

                if (leftNode && rightNode) {
                    let valueNode = node.lastChild;

                    emitter.catchup(node.start);
                    emitter.insert(leftNode.text + ".set(");

                    emitter.skipTo(rightNode.start);
                    visitNode(emitter, rightNode);
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

    // if (node.kind === NodeKind.ARGUMENTS) {
    //     if (node.parent.children[0].text === "addEventListener") {
    //         let children = node.parent.children[1].children;
    //         let lastNode = children[ children.length - 1 ]
    //
    //         // children.push(createNode(NodeKind.LITERAL, {
    //         //     start: lastNode.end,
    //         //     end: lastNode.end,
    //         //     text: ","
    //         // }));
    //         // emitter.insert(",");
    //
    //         children.push(createNode(NodeKind.IDENTIFIER, {
    //             start: lastNode.end,
    //             // end: lastNode.end + 3,
    //             end: lastNode.end,
    //             text: "this"
    //         }));
    //
    //     }
    // }

    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Remove dictionary imports
    contents = contents.replace(/import { Dictionary } from ".*egret\/([a-zA-Z]+)";/gm, "");

    // fix egret imports if using CommonJS
    if (!emitterOptions.useNamespaces) {
        contents = contents.replace(/import { ([a-zA-Z]+) } from ".*egret\/([a-zA-Z]+)";/gm, "const $1 = egret.$1;");
    }

    return contents;
}

export default {
    imports: imports,
    visitor: visitor,
    postProcessing: postProcessing,
}
