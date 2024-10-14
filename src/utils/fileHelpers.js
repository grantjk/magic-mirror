const fs = require('fs');
const path = require('path');

function readJSONFile(filename) {
  console.log("read-file", `Reading file at ${filePath(filename)}`);
  try {
    const data = fs.readFileSync(filePath(filename), "utf8");
    const json = JSON.parse(data);
    return json;
  } catch (err) {
    console.log(filename, err);
    return undefined;
  }
}

function filePath(filename) {
  return path.join(__dirname, '..', '..', filename);
}

module.exports = { readJSONFile };
