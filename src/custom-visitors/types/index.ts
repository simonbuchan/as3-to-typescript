/**
 * Created by palebluedot on 4/26/17.
 */

/**
 * Replace specific types that will clash between AS3 and TS
 */

import Node, { createNode } from "../../syntax/node";
import Emitter, { EmitterOptions } from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {
    return false;
}

const identifierMap: { [id: string]: string } = {
    'Date': 'MyDate',
    'Node': 'MyNode',
};

const typeMap: { [id: string]: string } = {
    'Date': 'MyDate',
    'Node': 'MyNode',
};

export default {
    visit: visit,
    identifierMap: identifierMap,
    typeMap: typeMap,
}
