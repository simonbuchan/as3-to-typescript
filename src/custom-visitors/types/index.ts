/**
 * Created by palebluedot on 4/26/17.
 */

/**
 * Replace specific types that will clash between AS3 and TS
 */

import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, { EmitterOptions } from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {

    if (
        (node.kind === NodeKind.TYPE || node.kind === NodeKind.IDENTIFIER) &&
        (node.text === "Date")
    ) {
        emitter.ensureImportIdentifier("AwayDate", "@as3web/flash", false);
    }
    else if (
        (node.kind === NodeKind.TYPE || node.kind === NodeKind.IDENTIFIER) &&
        (node.text === "XMLDocument")
    ) {
        emitter.ensureImportIdentifier("XMLDocumentAway", "@as3web/flash", false);
    }
    return false;
}

const identifierMap: { [id: string]: string } = {
    'Date': 'AwayDate',
    'XMLDocument': 'XMLDocumentAway',
};

const typeMap: { [id: string]: string } = {
    'Date': 'AwayDate',
    'XMLDocument': 'XMLDocumentAway',
};

export default {
    visit: visit,
    identifierMap: identifierMap,
    typeMap: typeMap,
}
