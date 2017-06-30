import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, {
    EmitterOptions,
    visitNode
} from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {

    // Auto-import XML package. //80pro: added check for IDENTIFIER
    if (
        (node.kind === NodeKind.TYPE || node.kind === NodeKind.IDENTIFIER) &&
        (node.text === "XML" || node.text === "XMLList")
    ) {
        emitter.ensureImportIdentifier("XML, XMLList", "@as3web/flash", false);
        //80pro emitter.ensureImportIdentifier("XML, XMLList", "xml-e4x", false);
    }

    if (node.kind === NodeKind.ARRAY_ACCESSOR) {

        let leftLiteral = node.children[0].findChild(NodeKind.LITERAL);
        let rightNode = node.children[1];

        if (leftLiteral) {
            if (leftLiteral.text.indexOf('@') === 0) {

                leftLiteral.text = "attribute";
                visitNode(emitter, leftLiteral);
                emitter.skipTo(node.children[0].end+1);

                emitter.insert("(");
                visitNode(emitter, rightNode);
                emitter.skipTo(rightNode.end);
                emitter.insert(")");
                emitter.skipTo(node.end);

                return true;
            }
            else {

                visitNode(emitter, leftLiteral);
                visitNode(emitter, rightNode);
                emitter.skipTo(rightNode.end);
                emitter.insert("].nodeValue");
                emitter.skipTo(node.end);

                return true;
            }
        }
    }

    // Converts xml.@myAttribute to xml.attribute('myAttribute')
    if (node.text && node.text.indexOf("@") === 0 &&
        node.parent.kind !== NodeKind.ARRAY_ACCESSOR) {

        console.log('node: ', node.toString());

        if(isNodeLeft(node)) {

            emitter.skipTo(node.start -1);
            emitter.insert(`["${ node.text.substr(1) }"]`);
            emitter.skipTo(node.end);

            return true;
        }
        else {
            node.text = `attribute("${ node.text.substr(1) }")`;
        }
    }

    return false;
}

function isNodeLeft(node:Node):boolean {
    if(node.kind == NodeKind.ASSIGN) { return true; }
    if(node.parent) {
        return isNodeLeft(node.parent);
    }
    return false;
}

export default {
    visit: visit
}
