import Node from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter from "../../emit/emitter";

export function getMapNodes (emitter: Emitter, node: Node) {
    let nodes: Node[] = [];

    if (node.kind === NodeKind.ARRAY_ACCESSOR) {
        let definition = emitter.findDefInScope(node.children[0].text);

        if (definition && definition.type === "Map<any, any>") {
            nodes = node.children;
        }
    }

    return nodes;
}
