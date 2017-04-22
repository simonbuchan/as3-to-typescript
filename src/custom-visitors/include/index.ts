/**
 * Created by palebluedot on 3/24/17.
 */

/**
 * Perfom include injections
 */

import Node, { createNode } from "../../syntax/node";
import NodeKind from "../../syntax/nodeKind";
import Emitter, { EmitterOptions } from "../../emit/emitter";

function visit (emitter: Emitter, node: Node): boolean {
    return false;
}

function postProcessing (emitterOptions: EmitterOptions, contents: string): string {

    const fs = require('fs-extra');
    const path = require('path');

    const regex:string = /include ([^\n])*/gm;

    // Identify the snippets to import.
    const snippets:Array = contents.match(regex);
    if(!snippets || snippets.length == 0) {
        return contents;
    }

    // For each identified snippet...
    let acumSnippetContents:string = "";
    for(let i = 0; i < snippets.length; i++) {

        // Identify the actual path.
        const snippet:string = snippets[i];
        const pathIncludingQuotes:string = snippet.match(/(["'])(?:(?=(\\?))\2.)*?\1/gm)[0];
        const snpPath = pathIncludingQuotes.substring(1, pathIncludingQuotes.length - 1);
        const tsPath = snpPath.split(".")[0] + ".ts";
        // console.log("snippet: " + tsPath);

        // Load the contents of the snippet.
        let snippetContent:string = "<<< INCLUDE CONTENT NOT FOUND: '" + tsPath + "' >>>";
        const finalPath = path.resolve(emitterOptions.includePath, tsPath);
        try {
            const cont = fs.readFileSync(finalPath);
            snippetContent = cont;
        }
        catch(e) {
            console.log("include visitor - *** WARNING *** Snippet content not converted/loaded yet.");
        }
        // console.log("snippetContent: " + snippetContent);

        // Acumulate the snippets.
        acumSnippetContents = acumSnippetContents.concat(snippetContent + "\n");
    }
    // console.log("result snippets: " + acumSnippetContents);

    // Inject the snippet.
    contents = contents.replace(regex, acumSnippetContents);

    return contents;
}
export default {
    visit: visit,
    postProcessing: postProcessing
}