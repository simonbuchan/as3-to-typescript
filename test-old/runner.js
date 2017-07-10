/*jshint node: true */
var fs = require('fs-extra');
var path = require('path');
var diff = require('diff');
var parse = require('../lib/parse');
var emit = require('../lib/emit');

let sourceDir = path.resolve(__dirname, "as3");
let outputDir = path.resolve(__dirname, "generated");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// let bridge = require('../lib/bridge/createjs').default;
let bridge = undefined;
let overwrite = true;
let commonjs = true;

function printDiff (expectedPath, generatedPath, expected, generated) {
  console.log(diff.createTwoFilesPatch(
    expectedPath,
    generatedPath,
    expected,
    generated
  ));
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

let files = readdir(sourceDir).filter(file => /.as$/.test(file));
let number = 0;
let length = files.length;

// get class definitions by namespace
let definitionsByNamespace = {};
files.forEach(file => {
    let segments = file.match(/([a-zA-Z]+)/g);
    segments.pop();

    let identifier = segments.pop();
    let ns = segments.join(".");

    if (!definitionsByNamespace[ ns ]) {
        definitionsByNamespace[ ns ] = [ ];
    }

    definitionsByNamespace[ ns ].push( identifier );
});

let emitterOptions = {
    lineSeparator: '\n',
    useNamespaces: !commonjs,
    bridge: bridge,
    definitionsByNamespace: definitionsByNamespace
};

files.forEach(file => {

    let fileTs = file.replace(/.as$/, '.ts');
    let inputFile = path.resolve(sourceDir, file);
    let outputFile = path.resolve(outputDir, fileTs);
    let expectedOutputFile = outputFile.replace("/generated/", "/ts/");

    if (!overwrite && fs.existsSync(outputFile)) {
        let stat = fs.statSync(outputFile)
        if (previousLockTimestamp.getTime() !== stat.mtime.getTime()) {
            if (interactive && !readlineSync.keyInYN(`"${ fileTs }" has been modified. Overwrite it?`)) {
                return;
            }
        }
    }

    let content = fs.readFileSync(inputFile, 'UTF-8');
    let ast = parse(path.basename(file), content);
    let contents = emit(ast, content, emitterOptions);

    if (bridge && bridge.postProcessing) {
        contents = bridge.postProcessing(emitterOptions, contents);
    }

    let generatedContents = contents.replace(/\r\n/g, "\n");
    let expectedContents = fs.readFileSync(expectedOutputFile).toString();
    let isOK = expectedContents === generatedContents;

    if (!isOK) {
      printDiff(outputFile, expectedOutputFile, expectedContents, generatedContents);
    }

    console.log(((isOK) ? 'OK' : 'MISMATCH') + ' - (' + ( number + 1 ) + '/' + length + ') \'' + file + '\'');
    number++;
});
