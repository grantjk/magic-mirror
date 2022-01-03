const fs = require('fs');
const sanitize = require('sanitize-html');
const configPath =  __dirname + '/../config';
const settingsPath = configPath + '/settings.json';
const cssPath = configPath + '/customcss.css';

function readSettings() {
  try {
    const data = fs.readFileSync(settingsPath, 'utf8')
    return JSON.parse(data);
  } catch (err) {
    // if the file doesn't exist, write an empty file
    console.log('error reading settings file');
    console.log(err);
    if (err.code === 'ENOENT') {
      writeSettings({});
    }
  }
}

/*
  icloudEmail:
  icloudAppSpecificPassword:
  icloudCalendarUrl:
  icloudCountdownCalendarUrl:
  accuweatherApiKey:
  accuweatherCityKey:
  airtableKey:
  airtableBase:
*/

function writeSettings(settings) {
  // Create directory if it doesn't exist yet
  fs.mkdirSync(configPath, {recursive: true});

  const data = JSON.stringify(settings, null, 2);
  fs.writeFileSync(settingsPath, data);
}

function writeCustomCSS(css) {

  //const cleanCSS = sanitize(css, {
    //allowedAttributes: {
  //})


  fs.mkdirSync(configPath, {recursive: true});
  fs.writeFileSync(cssPath, css);
}

function readCustomCSS() {
  try {
    return fs.readFileSync(cssPath, 'utf8')
  } catch (err) {
    // if the file doesn't exist, write an empty file
    console.log('error reading css file');
    console.log(err);
    if (err.code === 'ENOENT') {
      writeCustomCSS('');
    }
  }
}

exports.readSettings = readSettings;
exports.writeSettings = writeSettings;
exports.readCustomCSS = readCustomCSS;
exports.writeCustomCSS = writeCustomCSS;

