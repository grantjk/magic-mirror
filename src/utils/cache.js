const { clearSyncData } = require('./dataUpdater');

function clearSettingsCache() {
  global.scrapegoat = null;
  global.countdownGoat = null;
}

function clearDataCache() {
  clearSyncData({key: 'calendar'});
  clearSyncData({key: 'countdown'});
}

module.exports = { clearSettingsCache, clearDataCache };
