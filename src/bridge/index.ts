import Node from "../syntax/node";

export interface Bridge {
    imports: Map<RegExp, string>;
    visitor: (node: Node) => void;
}
