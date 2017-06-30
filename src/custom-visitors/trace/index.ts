/**
 * Created by palebluedot on 3/24/17.
 */

/**
 * Replace trace() for console.log()
 */

import Node, { createNode } from "../../syntax/node";
import Emitter, { EmitterOptions } from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {
    return false;
}

const identifierMap: { [id: string]: string } = {
    'trace': 'console.log'
};

export default {
    visit: visit,
    identifierMap: identifierMap,
}
