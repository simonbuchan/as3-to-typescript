import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, {
    EmitterOptions,
    visitNode,
    visitNodes,
    emitIdent
} from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {
    // Auto-import XML package.
    if (
        node.kind === NodeKind.TYPE &&
        (node.text === "XML" || node.text === "XMLList")
    ) {
        emitter.ensureImportIdentifier("XML", "xml-e4x", false);
    }

    // Converts
    // xml.@[ "attribute" ]
    // xml.@[ attribute ]
    if (node.kind === NodeKind.ARRAY_ACCESSOR) {
        let leftLiteral = node.children[0].findChild(NodeKind.LITERAL);
        let rightNode = node.children[1];

        if (leftLiteral.text.indexOf('@') === 0) {
            leftLiteral.text = "attribute"
            visitNode(emitter, leftLiteral);
            emitter.skipTo(node.children[0].end+1);

            emitter.insert("(");
            visitNode(emitter, rightNode);
            emitter.skipTo(rightNode.end);
            emitter.insert(")");
            emitter.skipTo(node.end);

            return true;
        }
    }

    if (node.text && node.text.indexOf("@") === 0 &&
        node.parent.kind !== NodeKind.ARRAY_ACCESSOR) {
        node.text = `attribute("${ node.text.substr(1) }")`;
    }

    return false;
}

const typeMap: { [id: string]: string } = {
    'XMLList': 'XML'
};

export default {
    visit: visit,
    typeMap: typeMap,
}
