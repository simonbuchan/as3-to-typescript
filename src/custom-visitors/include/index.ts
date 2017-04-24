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

    const regex:RegExp = /include ([^\n])*/gm;

    // Identify the snippets to import.
    const snippets:string[] = contents.match(regex);
    if(!snippets || snippets.length == 0) {
        return contents;
    }
    console.log("-> include visitor - postprocessing()");
    console.log("    include statements: " + snippets);

    // For each identified snippet...
    let acumSnippetContents:string = "";
    for(let i = 0; i < snippets.length; i++) {

        // Identify the actual path.
        const snippet:string = snippets[i];
        const pathsIncludingQuotes:string[] = snippet.match(/(["'])(?:(?=(\\?))\2.)*?\1/gm);
        console.log("    include paths: " + pathsIncludingQuotes);
        if(!pathsIncludingQuotes || pathsIncludingQuotes.length == 0) {
            continue;
        }
        const pathIncludingQuotes = pathsIncludingQuotes[0];
        const snpPath = pathIncludingQuotes.substring(1, pathIncludingQuotes.length - 1);
        console.log("    snp path: " + snpPath);
        const tsPath = snpPath.replace(/.snp$/, '.ts');
        console.log("    ts path: " + tsPath);
        const tsPathNonRelative = tsPath.replace(/^(?:\.\.\/)+/, '');
        console.log("    tsPathNonRelative: " + tsPathNonRelative);

        // Load the contents of the snippet.
        let snippetContent:string = "<<< INCLUDE CONTENT NOT FOUND: '" + tsPathNonRelative + "' >>>";
        try {
            console.log("    (emitterOptions) include path: " + emitterOptions.includePath);
            console.log("    (emitterOptions) file path: " + emitterOptions.filePath);
            console.log("    pwd: " + __dirname);
            const finalPath = path.resolve(emitterOptions.includePath, tsPathNonRelative);
            console.log("    final path: " + finalPath);
            const cont = fs.readFileSync(finalPath);
            snippetContent = cont;
        }
        catch(e) {
            console.log("    include visitor - *** WARNING *** Snippet content not converted/loaded yet.");
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