var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');

function readNormalizedSync(path) {
    return fs.readFileSync(path, 'UTF-8').replace(/\r\n?/g, '\n');
}

function readdir(dir, prefix, result) {

    if (!prefix) prefix = '';
    if (!result) result = [];

    fs.readdirSync(dir).forEach(file => {
        let fileName = path.join(prefix, file);
        let filePath = path.join(dir, file);
        if (!fs.statSync(filePath).isDirectory()) {
            result.push(fileName);
        } else {
            readdir(filePath, fileName, result);
        }
    });
    return result;
}

function generate() {


    // Convert all sources.
    for(var i = 0; i < SOURCE_DIRECTORIES.length; i++) {
        inspectImports(SOURCE_DIRECTORIES[i]);
    }
    let outputString="";
    if(SHOW_CLASS_USAGE){

        Object.keys(IMPORTS_POOL).sort().forEach(function(v, i) {
                outputString+=v+";\n";
                outputString+="/*"+"\n";
                IMPORTS_POOL[v].sort().forEach(function(e, k) {
                        //console.log("       -",e);
                        outputString+="       -"+e+"\n";
                });
                outputString+="*/"+"\n";
            });
    }
    else{
        Object.keys(IMPORTS_POOL).sort().forEach(function(v, i) {
            //console.log(v, IMPORTS_POOL[v]);
            outputString+=v+";  // "+IMPORTS_POOL[v]+"\n";
        });
    }
    let outputFile = path.resolve(SOURCE_DIRECTORIES[0], "_"+PACKAGE_NAME+"_imports.as");
    fs.outputFileSync(outputFile, outputString);
}

function inspectImports(src) {

    console.log("Inspecting AS3 files in [" + src + "]");

    // Identify all files in source dir, recursively.
    let filesSNP = readdir(src).filter(file => /.snp/.test(file));
    let filesAS = readdir(src).filter(file => /.as$/.test(file));
    let files = filesSNP.concat(filesAS);

    // Filter out excludes.
    let excludedFiles = [];
    for(let i = 0; i < EXCLUDES.length; i++) {
        let pattern = EXCLUDES[i];
        let patternExcludes = glob.sync(pattern, {absolute: true});
        excludedFiles = excludedFiles.concat(patternExcludes);
    }
    //  console.log(excludedFiles)
    console.log("  ↳excludedFiles: " + excludedFiles.length);


    // Sweep all files.
    files.forEach(file => {

        // Identify file name.
        let segments = file.match(/([a-zA-Z]+)/g);
        segments.pop();
        let identifier = segments.pop();
        let ns = segments.join(".");

        // check if the file is contained directly in the root-directory (output), and not inside any sub-folder
        let isFileInRoot=(segments.length==0);

        // Identify source file;
        let inputFile = path.resolve(src, file);

        if(excludedFiles.indexOf(inputFile.replace(/\\/g, "/")) != -1) {
            //console.log("exlude: "+inputFile);
            return;
        }
        console.log("✔ " + identifier);
        // Read File Content.
        let content = fs.readFileSync(inputFile, 'UTF-8');
        var res = content.match(MY_REGEX);
        //var res = content.match(/import flash.+[a-zA-Z]/gm);
        if(res!=null){
            var i=res.length;
            while(i>0){
                i--;
                if(IMPORTS_POOL[res[i]]==null){
                    IMPORTS_POOL[res[i]]=IMPORTS_POOL?[]:0;
                }
                if(SHOW_CLASS_USAGE)
                    IMPORTS_POOL[res[i]][IMPORTS_POOL[res[i]].length]=file;
                else
                    IMPORTS_POOL[res[i]]++;
            }
        }
    });

    console.log("︎✔✔ done︎");
}

console.log("Inspecting AS3 for import statements");

// Parameters.
// first: comma separated as3 sources to convert.
// second: typescript destination directory.

// Define source(AS3) -> target(TS) directories.
var configFile = process.argv[2];
console.log("using config: " + configFile);
var CONFIG = JSON.parse(fs.readFileSync(configFile, 'utf8'));
console.log("CONFIG: " + JSON.stringify(CONFIG));
var SOURCE_DIRECTORIES = CONFIG.sourceDirectories;
var EXCLUDES = CONFIG.excludes;

var PACKAGE_NAME = process.argv[3];
console.log("  ↳look for imports wirh packagename: " + PACKAGE_NAME);
var MY_REGEX = new RegExp("import "+PACKAGE_NAME+".+[a-zA-Z*]", "gm");
var SHOW_CLASS_USAGE = (process.argv[4]!=null);
var IMPORTS_POOL={};
generate();