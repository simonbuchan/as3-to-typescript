/*jshint node: true */

var fs = require('fs-extra');
var path = require('path');
var diff = require('diff');
var parse = require('../lib/parse');
var emit = require('../lib/emit');


var FIXTURES_DIR = path.join(__dirname, 'fixtures');
var EXPECTED_DIR = path.join(FIXTURES_DIR, 'expected');
var GENERATED_DIR = path.join(FIXTURES_DIR, 'generated');


function fixturePaths() {
  return fs.readdirSync(FIXTURES_DIR)
    .filter(function (name) {
      return path.extname(name) === '.as';
    }).map(function (name) {
      var basename = path.basename(name, '.as');
      return {
        name: name,
        source: path.join(FIXTURES_DIR, name),
        expectedTs: path.join(EXPECTED_DIR, basename + '.ts'),
        expectedAst: path.join(EXPECTED_DIR, basename + '.ast.json'),
        generatedTs: path.join(GENERATED_DIR, basename + '.ts'),
        generatedAst: path.join(GENERATED_DIR, basename + '.ast.json')
      };
    });
}

function readNormalizedSync(path) {
  return fs.readFileSync(path, 'UTF-8').replace(/\r\n?/g, '\n');
}

function generate() {
  fs.emptyDirSync(GENERATED_DIR);
  fixturePaths().forEach(function (fixture) {
    console.log('compiling : ' + fixture.name);
    var source = readNormalizedSync(fixture.source);
    var ast = parse(fixture.source, source);
    fs.outputFileSync(fixture.generatedAst, JSON.stringify(ast, null, 2));
    var output = emit(ast, source, {});
    fs.outputFileSync(fixture.generatedTs, output.replace(/\r\n?/g, '\n'));
  });
}

function acceptGenerated() {
  fs.removeSync(EXPECTED_DIR);
  fs.copySync(GENERATED_DIR, EXPECTED_DIR);
}

function printDiff(expectedPath, generatedPath) {
  var expected = readNormalizedSync(expectedPath);
  var generated = readNormalizedSync(generatedPath);
  if (expected === generated) {
    return false;
  }
  var patch = diff.createTwoFilesPatch(
    expectedPath,
    generatedPath,
    expected,
    generated);
  console.log(patch);
  return true;
}

function compare() {
  var exitCode = 0;
  fixturePaths().forEach(function (fixture) {
    if (printDiff(fixture.expectedAst, fixture.generatedAst) ||
        printDiff(fixture.expectedTs, fixture.generatedTs)) {
      exitCode = 1;
    }
  });
  process.exit(exitCode);
}

var command = process.argv[2];
switch (command) {
  case 'generate':
    generate();
    break;
  case 'accept':
    acceptGenerated();
    break;
  case 'compare':
    compare();
    break;
  default:
    throw new Error('unknown command :' + command);
}
