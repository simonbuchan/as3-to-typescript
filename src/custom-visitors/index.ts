import Node from "../syntax/node";
import Emitter, { EmitterOptions } from "../emit/emitter";

export interface CustomVisitor {
    visit: (emitter: Emitter, node: Node) => boolean;
    imports?: Map<RegExp, string>;
    postProcessing?: (emitterOptions: EmitterOptions, data: string) => string;
    typeMap?: { [id: string]: string };
    identifierMap?: { [id: string]: string };
}
