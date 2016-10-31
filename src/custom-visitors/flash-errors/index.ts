/**
 * Replace Flash errors (from flash.errors.*) with `Error`
 */

import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, { EmitterOptions, visitNode } from "../../emit/emitter";

const errorIdentifiers = [
    'DRMManagerError',
    'EOFError',
    'IllegalOperationError',
    'InvalidSWFError',
    'IOError',
    'MemoryError',
    'ScriptTimeoutError',
    'SQLError',
    'SQLErrorOperation',
    'StackOverflowError',
];

const importReplacement = new RegExp(`import { (${ errorIdentifiers.join("|") }) } from "[^"]+";`, "gm");

function visit (emitter: Emitter, node: Node): boolean {

    //
    // translate `error.getStackTrace()` into `trace`
    //
    if (node.kind === NodeKind.CALL) {
        let dotNode = node.children[0];
        if (dotNode.kind === NodeKind.DOT) {
            let dotLeftNode = node.children[0].children[0];
            let dotRightNode = node.children[0].children[1];

            if (dotRightNode.text === "getStackTrace") {
                dotRightNode.text = "stack";

                emitter.catchup(node.start);
                emitter.skipTo(node.end);
                visitNode(emitter, dotLeftNode);
                emitter.catchup(dotLeftNode.end);
                emitter.insert(`.${ dotRightNode.text }`);
                emitter.skipTo(node.end);
                return true;
            }
        }
    }

    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Remove error imports
    contents = contents.replace(importReplacement, "");

    return contents;
}

const typeMap: { [id: string]: string } = errorIdentifiers.reduce(function(result: any, currentValue: string, currentIndex: number) {
  result[ currentValue ] = "Error";
  return result;
}, {});

const identifierMap: { [id: string]: string } = typeMap;

export default {
    visit: visit,
    postProcessing: postProcessing,
    typeMap: typeMap,
    identifierMap: identifierMap,
}
