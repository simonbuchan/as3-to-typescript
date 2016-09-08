import Node from "../syntax/node";
import Emitter from "../emit/emitter";

export interface Bridge {
    imports: Map<RegExp, string>;
    visitor: (emitter: Emitter, node: Node) => void;
    postProcessing?: (data: string) => string;
}
