const fs = require('fs-extra');
const path = require('path');

// Deletes all files within a directory.
function clearDirectory(dir) {
  fs.emptyDirSync(dir);
}

// Receives a string with comma separated visitor names and
// returns an array of instantiated visitors
function instantiateVisitorsFromStr(visitors, baseUrl) {
  return visitors.split(',').map(
    (name) => {
      const visitor = require(`${baseUrl}${name}`).default;
      return visitor
    }
  );
}

// Reads all files and folders within a directory.
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

// Reads the contents of a file, normalizing line breaks.
function readNormalizedSync(path) {
  return fs.readFileSync(path, 'UTF-8').replace(/\r\n?/g, '\n');
}

module.exports = {
  readdir: readdir,
  readNormalizedSync: readNormalizedSync,
  instantiateVisitorsFromStr: instantiateVisitorsFromStr,
  clearDirectory: clearDirectory
};