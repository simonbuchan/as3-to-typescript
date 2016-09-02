import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";

// import translations
let imports = new Map<RegExp, string>();
imports.set(/flash.[a-z]+\.([A-Za-z]+)/, "egret.$1");

function visitor (node: Node) {

    if (node.kind === NodeKind.CALL && node.children[0].text === "addEventListener") {
        // let children = node.children[1].children;
        // let lastNode = children[ children.length - 1 ]
        // let newNode = createNode(NodeKind.IDENTIFIER, {
        //     start: lastNode.end,
        //     end: lastNode.end + 4,
        //     text: ", this"
        // });
        //
        // node.children[1].children.push(newNode);
    }

}

export default {
    imports: imports,
    visitor: visitor
}
