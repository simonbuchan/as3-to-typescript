var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');


function generate() {


    let content = fs.readFileSync(SOURCE_FILE, 'UTF-8');
    fs.emptyDirSync(OUTPUT_DIR);
    var res = content.match(MY_REGEX);
    var allpackageContent = "";
    if(res!=null){
        var i=res.length;
        while(i>0){
            i--;
            var res2 = res[i].match(MY_REGEX2);
            var name = res2[0].split(".").pop();
            if(name!="*"){
                console.log(res2[0].replace(/[.]/g, "/"));
                var thispath=res2[0].replace(/[.]/g, "/");
                var tspath=thispath.replace(PACKAGE_NAME, "./lib");
                outputFile=path.resolve(OUTPUT_DIR,tspath+".ts");
                allpackageContent+="export { "+name+"} from '"+tspath+"';\n";
                var class_content="export class "+name+" {}";
                fs.outputFileSync(outputFile, class_content);
            }
        }
    }
    outputFile=path.resolve(OUTPUT_DIR,"index.ts");
    fs.outputFileSync(outputFile, allpackageContent);
}

// rough tool. might not work well yet


var SOURCE_FILE = process.argv[2];
console.log("Creating package for all import found in "+SOURCE_FILE);
var OUTPUT_DIR = process.argv[3];
var PACKAGE_NAME = process.argv[4];
console.log("  ↳look for imports wirh packagename: " + PACKAGE_NAME);
var MY_REGEX = new RegExp("import "+PACKAGE_NAME+".+[a-zA-Z*]", "gm");
var MY_REGEX2 = new RegExp(PACKAGE_NAME+".+[a-zA-Z*]", "gm");
var IMPORTS_POOL={};
generate();