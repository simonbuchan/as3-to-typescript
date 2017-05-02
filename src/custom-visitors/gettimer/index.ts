
/**
 * Replace flash.utils.getTimer with `Date.now`
 */

import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, { EmitterOptions } from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {
    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Remove error imports
    contents = contents.replace(/import \{ getTimer \} from "[.\/@0-9a-zA-Z]+";?/gm, "");

    return contents;
}

const identifierMap: { [id: string]: string } = {
    'getTimer': 'Date.now'
};

export default {
    visit: visit,
    postProcessing: postProcessing,
    identifierMap: identifierMap,
}
