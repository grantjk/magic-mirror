const moment = require('moment');
const fs = require('fs');
const path = require('path');

const syncFilePath = path.join(__dirname, '..', '..', 'data', 'sync.json');

async function updateData({ identifier, ttlCount, ttlUnit, ttlHook }, updateFunction) {
  let json;
  const filename = path.join(__dirname, '..', '..', 'cache', `${identifier}.json`);

  const nextUpdate = readSyncData(identifier);
  const shouldUpdate = !nextUpdate || moment().isAfter(moment(nextUpdate));
  console.log(
    `[${identifier.toUpperCase()}] Update=${shouldUpdate}. Next update to ${identifier} after ${
      nextUpdate ? moment(nextUpdate).format('YYYY-MM-DD HH:mm:ss') : "now"
    }.`
  );

  let nextRefreshDate = moment().add(1, "minute");
  if (shouldUpdate) {
    console.log(`[${identifier.toUpperCase()}] Requesting update for ${identifier}`);
    try {
      json = await updateFunction();
      console.log(`[${identifier.toUpperCase()}] Saving updated data for ${identifier}`);

      writeJSONFile(filename, json);

      // If we want to use the actual response to set the cache ttl, then use the hook
      nextRefreshDate = ttlHook
        ? ttlHook(json)
        : moment().add(ttlCount, ttlUnit);
      console.log(
        `[${identifier.toUpperCase()}] Updating sync key for ${identifier} to ${nextRefreshDate.format(
          'YYYY-MM-DD HH:mm:ss'
        )}`
      );
      writeSyncData(identifier, nextRefreshDate);
    } catch (err) {
      console.log(`[${identifier.toUpperCase()}] Error getting updated data: ${err}`);
      json = readJSONFile(filename);
    }
  } else {
    if (nextUpdate) {
      nextRefreshDate = moment(nextUpdate);
    }

    console.log(`[${identifier.toUpperCase()}] Loading current data from cache`);
    json = readJSONFile(filename);
  }

  const ttlSeconds = nextRefreshDate.diff(moment(), "seconds") + 10; // add 10 buffer
  return { json, ttlSeconds };
}

function readSyncData(key) {
  const json = readJSONFile(syncFilePath);
  return json[key];
}

function clearSyncData({key}) {
  const json = readJSONFile(syncFilePath);
  delete json[key];
  writeJSONFile(syncFilePath, json);
}

function writeSyncData(key, value) {
  const json = readJSONFile(syncFilePath);
  json[key] = value;
  writeJSONFile(syncFilePath, json);
}

function readJSONFile(filename) {
  console.log(`[READ-FILE] Reading file at ${filename}`);
  try {
    const data = fs.readFileSync(filename, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.log(`[${filename}] ${err}`);
    return {};
  }
}

function writeJSONFile(filename, json) {
  console.log(`[WRITE-FILE] Writing file at ${filename}`);
  fs.writeFileSync(filename, JSON.stringify(json, null, 2));
}

module.exports = { updateData, clearSyncData };
