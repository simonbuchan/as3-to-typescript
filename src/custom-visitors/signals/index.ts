import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, { EmitterOptions } from "../../emit/emitter";

let lastEmitter: Emitter = null;
let signalAddCalls: string[];

function visit (emitter: Emitter, node: Node): boolean {
    if (lastEmitter !== emitter) {
        lastEmitter = emitter;
        signalAddCalls = [];
    }

    //
    // Check for Signal#add() and keep track of callbacks that need to have
    // arrow functions on postProcessing phase
    //

    if (node.kind === NodeKind.CALL) {
        let dotNode = node.children[0];
        if (dotNode.kind === NodeKind.DOT) {
            let dotLeftNode = node.children[0].children[0];
            let dotRightNode = node.children[0].children[1];

            if (dotRightNode.text === "add") {
                let dotLeftDefinition = emitter.findDefInScope(dotLeftNode.text);
                if (dotLeftDefinition && dotLeftDefinition.type && dotLeftDefinition.type.indexOf('Signal') >= 0) {
                    signalAddCalls.push( node.findChild(NodeKind.ARGUMENTS).children[0].text );
                }
            }
        }
    }

    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Replace
    contents = contents.replace(
        /import { ([A-Za-z0-9]+) } from ".*org.osflash.signals.[A-Za-z]+";/gm,
        "import { $1 } from \"signals.js\";"
    );

    // Replace all signal listeners into arrow functions (to keep class scope)
    if (signalAddCalls.length > 0)
    {
        let regex = new RegExp("(public|private|protected)( static)?[\ ]+("+ signalAddCalls.join("|") +")\(([^\)]+)?\)[^\n]+(void)", "gm");
        contents = contents.replace(regex, "$1$2 $3 = $5): void =>");
    }

    return contents;
}

export default {
    visit: visit,
    postProcessing: postProcessing
}
