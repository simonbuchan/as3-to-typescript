/**
 * Replace Flash errors (from flash.errors.*) with `Error`
 */

import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, { EmitterOptions } from "../../emit/emitter";

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
