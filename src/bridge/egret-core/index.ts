import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter from "../../emit/emitter";

// import translations
let imports = new Map<RegExp, string>();
imports.set(/^flash.[a-z]+\.([A-Za-z]+)/, "egret.$1");

function visitor (emitter: Emitter, node: Node) {

    if (node.kind === NodeKind.ARGUMENTS) {
        if (node.parent.children[0].text === "addEventListener") {
            let children = node.parent.children[1].children;
            let lastNode = children[ children.length - 1 ]

            // children.push(createNode(NodeKind.LITERAL, {
            //     start: lastNode.end,
            //     end: lastNode.end,
            //     text: ","
            // }));
            // emitter.insert(",");

            children.push(createNode(NodeKind.IDENTIFIER, {
                start: lastNode.end,
                // end: lastNode.end + 3,
                end: lastNode.end,
                text: "this"
            }));

        }
    }

}

function postProcessing (contents: string): string {
    contents = contents.replace(/import { ([a-zA-Z]+) } from ".*egret\/([a-zA-Z]+)";/gm, "const $1 = egret.$1;");
    return contents;
}

export default {
    imports: imports,
    visitor: visitor,
    postProcessing: postProcessing,
}
