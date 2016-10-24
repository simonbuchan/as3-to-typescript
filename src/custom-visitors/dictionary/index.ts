/**
 * Replace `Dictionary` to `Map<any, any>`
 */

import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, {
    EmitterOptions,
    visitNode,
    visitNodes,
    emitIdent
} from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {

    //
    // translate `for..in` on Dictionaries into `for...of`
    // Example:
    //      Input:  for (var key:String in dictionary) {}
    //      Output: for (let [ key, _ ] of dictionary) {}
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

            emitter.insert("for (let [ ");

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

            // visit loop target
            visitNodes(emitter, node.children[1].children);

            // visit block
            visitNode(emitter, node.findChild(NodeKind.BLOCK));

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
                emitter.catchup(rightNode.end);
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
                // emitter.skipTo(subsequentNodes[0].start-1);
                // visitNodes(emitter, subsequentNodes);
                // emitter.skipTo(node.end-1);

                emitter.skipTo(subsequentNodes[0].start);
                emitter.insert("[ ");
                visitNodes(emitter, subsequentNodes);
                // emitter.skipTo(subsequentNodes[subsequentNodes.length-1].end);

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

function getMapNodes (emitter: Emitter, node: Node) {
    let nodes: Node[] = [];

    if (node.kind === NodeKind.ARRAY_ACCESSOR) {
        let definition = emitter.findDefInScope(node.children[0].text);

        if (definition && definition.type === "Map<any, any>") {
            nodes = node.children;
        }
    }

    return nodes;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Remove dictionary imports
    contents = contents.replace(/import { Dictionary } from "[^"]+";/gm, "");

    return contents;
}

export default {
    visit: visit,
    postProcessing: postProcessing
}
