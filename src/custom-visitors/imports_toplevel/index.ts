/**
 * Created by 80prozent on 3/31/2017.
 */

/**
 * Fix import statements
 */

import Node, { createNode } from "../../syntax/node";
import Emitter, { EmitterOptions } from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {
    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {

    //fix all import statements by removing ".." from the beginning
    contents = contents.replace(/import { ([a-zA-Z]+) } from "..\//g, "import {$1} from \".\/");
    
    return contents;
}
export default {
    visit: visit,
    rootLevelOnly:"true",
    postProcessing: postProcessing
}
