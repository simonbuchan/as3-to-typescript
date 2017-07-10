var fs = require('fs-extra');
var path = require('path');
var parse = require('../lib/parse');
var emit = require('../lib/emit');
var glob = require('glob');
var packageDefintitions = require('./package_definitions');
const utils = require('./utils/conversion.js');

function generate() {

  // make sure destination directory and tmp_dir are empty.
  fs.emptyDirSync(DESTINATION_TS);
  fs.emptyDirSync(TMP_DIR);

  // gather as3-files from all sources in TMP_DIR
  // ignore files from the EXCLUDES directories
  // resolve as3-include statements on the way
  for(var i = 0; i < SOURCE_DIRECTORIES.length; i++) {
    prepareSourceDirectory(SOURCE_DIRECTORIES[i]);
  }

  // convert as3-files in TMP_DIR to ts-files in  DESTINATION_TS
  convert();
}


function prepareSourceDirectory(src) {

  console.log("Collect AS3 files in [" + src + "] for conversion.");

  // Identify all files in source dir, recursively.
  let filesSNP = utils.readdir(src).filter(file => /.snp/.test(file));
  let filesAS = utils.readdir(src).filter(file => /.as$/.test(file));
  let files = filesSNP.concat(filesAS); // NOTE: its imporant that snippets go first

  files.forEach(file => {
    // Ignore excluded files:
    let inputFile = path.resolve(src, file);
    if(EXCLUDED_DIRS.indexOf(inputFile.replace(/\\/g, "/")) != -1){
      return;
    }
    // resolve the includes and write prepared output to tmp directory:
    let content = fs.readFileSync(inputFile, 'UTF-8');
    content = resolveIncludes(content, file, src);
    fs.outputFileSync(path.resolve(TMP_DIR, file), content.replace(/\r\n?/g, '\n'));
  });
  console.log("︎✔✔ done︎\n");
}

function convert() {

  console.log("Converting AS3 files in [" + TMP_DIR + "] to TS files in [" + DESTINATION_TS + "]:");

  // now get a list of as3 files from the tmp folder
  let filesAS = utils.readdir(TMP_DIR).filter(file => /.as$/.test(file));

  // collect class definitions by namespace
  let definitionsByNamespace = {};

  // collect external package definitions ( flash / away3d ) into definitionsByNamespace
  packageDefintitions.createExternalPackageDefinitions(definitionsByNamespace);

  filesAS.forEach(file => {
    let segments = file.match(/([a-zA-Z0-9]+)/g);
    segments.pop();

    let identifier = segments.pop();
    let ns = segments.join(".");

    if (!definitionsByNamespace[ ns ]) {
      definitionsByNamespace[ ns ] = [ ];
    }

    definitionsByNamespace[ ns ].push( identifier );
  });
  emitterOptions.definitionsByNamespace = definitionsByNamespace;

  // Sweep all files. Convert.
  filesAS.forEach(file => {

    let inputFile = path.resolve(TMP_DIR, file);

    // Identify file name.
    let segments = file.match(/([a-zA-Z0-9]+)/g);
    segments.pop();
    let identifier = segments.pop();
    console.log("✔ " + identifier);

    // check if the file is contained directly in the root-directory (output), and not inside any sub-folder
    let isFileInRoot=(segments.length==0);

    // Identify source/target files.
    let fileTs = file.replace(/.as$/, '.ts').replace(/.snp$/, '.ts');
    let outputFile = path.resolve(DESTINATION_TS, fileTs);

    // Convert.
    let content = fs.readFileSync(inputFile, 'UTF-8');
    let ast = parse(path.basename(file), content);
    let contents = emit(ast, content, emitterOptions);

    // Apply custom visitors postprocessing (needed for imports visitor).
    emitterOptions.customVisitors.forEach((visitor) => {

      // if a visitor should only be postProcessing files that are contained directly in the root-directory,
      // it should provide a property called "rootLevelOnly"
      // if this property is present on the visitor, we only execute it for files that are at root-level

      // console.log("    using visitor: " + visitor.name);
      if(visitor.rootLevelOnly!=null){
        if(isFileInRoot){
          //console.log("postProcessing a visitor on a file that exists directly in the root-directory");
          contents = visitor.postProcessing(emitterOptions, contents);
        }
      }
      else{
        if (visitor.postProcessing) {
          contents = visitor.postProcessing(emitterOptions, contents);
        }
      }
    });

    // Write converted output.
    fs.outputFileSync(outputFile, contents.replace(/\r\n?/g, '\n'));
    // fs.outputFileSync(outputFile + ".ast", JSON.stringify(ast, null, 2));
  });

  fs.emptyDirSync(TMP_DIR);
  fs.remove(TMP_DIR);

  console.log("︎✔✔ done︎\n");
}

// function readVisitors() {
//
//   var visitors = [];
//   visitors.push("dictionary");
//   visitors.push("flash-errors");
//   visitors.push("gettimer");
//   visitors.push("stringutil");
//   visitors.push("trace");
//   visitors.push("xml");
//   visitors.push("imports");
//   visitors.push("imports_toplevel");
//   visitors.push("types");
//
//   let visitorsStr = visitors.join(",");
//   console.log("  ↳visitors: [" + visitorsStr + "]\n");
//
//   return visitorsStr;
// }

function resolveIncludes(contents, filePath, rootPath) {

  const fs = require('fs-extra');
  const path = require('path');
  const regex = /include "([^\n])*/gm;

  // Identify the snippets to import.
  const snippets = contents.match(regex);
  if (!snippets || snippets.length == 0) {
    return contents;
  }
  console.log("Resolve includes for: ", filePath);
  let allImports=[];
  // For each identified snippet...
  for (let i = 0; i < snippets.length; i++) {

    const snippet = snippets[i];
    let relativePathToSnp = snippet.split('"')[1];

    // Load the contents of the snippet.
    let snippetContent = "<<< INCLUDE CONTENT NOT FOUND: '" + relativePathToSnp + "' >>>";
    try {
      //console.log("rootPath: ", rootPath);
      //console.log("filePath: ", filePath);
      //console.log("relativePathToSnp: ", relativePathToSnp);
      let finalPath = path.resolve(rootPath, filePath, "../", relativePathToSnp);
      //console.log("finalPath: ", finalPath);
      let cont = fs.readFileSync(finalPath, 'utf8');

      console.log("    ✔ resolved: ", snippet);
      // filter our the imports:
      const regex2 = /import ([a-zA-Z0-9.;])*/gm;
      allImports=allImports.concat(cont.match(regex2));
      cont = cont.replace(regex2, "");

      // remove empty lines from remaining content
      cont = cont.replace( /^\s*[\r\n]/gm, "");

      // replace the include-statement with the non-import code copied from the snipped
      contents = contents.replace(snippet, cont);
    }
    catch (e) {
      console.log("include visitor - *** WARNING *** Snippet content not converted/loaded yet.");
      console.log("snipped path: ", relativePathToSnp);
      console.log("file path: ", filePath);
    }
  }
  if(allImports.length>0){

    // if we found any imports, we need to inject them into the as3 file
    // they need to be the correct position, after the first "{"

    let all_content=contents.split("{");
    let i=0;
    let newcontent=all_content[0]+"{\n";

    for (i=0; i<allImports.length; i++){
      if(contents.indexOf(allImports[i])==-1){
        newcontent+=allImports[i]+"\n";
      }
    }
    for (i=1; i<all_content.length; i++){
      newcontent+=all_content[i];
      if(i!=(all_content.length-1)){
        newcontent+="{";
      }
    }
    contents=newcontent;
  }
  return contents;
}

console.log("Converting AS3 -> TS");

// First parameter is the path to a config file.
var configFile = process.argv[2];
console.log("using config: " + configFile);

// Read settings from config:
var CONFIG = JSON.parse(fs.readFileSync(configFile, 'utf8'));
console.log("CONFIG: " + JSON.stringify(CONFIG));
var SOURCE_DIRECTORIES = CONFIG.sourceDirectories;
var DESTINATION_TS = CONFIG.destionationTS;
var TMP_DIR = DESTINATION_TS+"_tmp";

// Create a list with all excluded directories
var EXCLUDES = CONFIG.excludes;
var EXCLUDED_DIRS = [];
for(let i = 0; i < EXCLUDES.length; i++) {
  let pattern = EXCLUDES[i];
  let patternExcludes = glob.sync(pattern, {absolute: true});
  EXCLUDED_DIRS = EXCLUDED_DIRS.concat(patternExcludes);
}
console.log("  ↳excludedFiles: " + EXCLUDED_DIRS.length);

// as3-to-ts CLI options.
let emitterOptions = {
  lineSeparator: '\n',
  customVisitors: utils.instantiateVisitorsFromStr(
    "dictionary," +
    "flash-errors," +
    "gettimer," +
    "stringutil," +
    "trace," +
    "xml," +
    "imports," +
    "imports_toplevel," +
    "types,"
    , '../lib/custom-visitors/'
  )
};

generate();