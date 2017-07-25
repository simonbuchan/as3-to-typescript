import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, {
    EmitterOptions,
    visitNode,
    visitNodes,
    emitIdent
} from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {

    //
    // translate `StringUtil.trim(str)` into `str.trim()`
    //
    if (node.kind === NodeKind.CALL) {
        let dotNode = node.children[0];
        if (dotNode.kind === NodeKind.DOT) {
            let dotLeftNode = node.children[0].children[0];
            let dotRightNode = node.children[0].children[1];

            if (dotLeftNode.text === "StringUtil") {
                let contentNode = node.children[1].children[0];

                emitter.catchup(node.start);
                emitter.skipTo(node.end);
                visitNode(emitter, contentNode);
                emitter.catchup(contentNode.end);
                emitter.insert(`.${ dotRightNode.text }()`);
                emitter.skipTo(node.end);
                return true;
            }
        }
    }

    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {
    // Remove StringUtil imports (mx.utils.StringUtil)
    contents = contents.replace(/import { StringUtil } from ".*mx\/utils\/StringUtil";/gm, "");

    return contents;
}

export default {
    visit: visit,
    postProcessing: postProcessing
}
