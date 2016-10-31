import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, { EmitterOptions } from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {
    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Replace
    contents = contents.replace(
        /import { ([A-Za-z0-9]+) } from ".*org.osflash.signals.[A-Za-z]+";/gm,
        "import { $1 } from \"signals.js\";"
    );
    return contents;
}

export default {
    visit: visit,
    postProcessing: postProcessing
}
