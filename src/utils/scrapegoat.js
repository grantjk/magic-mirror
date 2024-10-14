const Scrapegoat = require("scrapegoat");
const settings = require('../settings');

let scrapegoat = null;
function useScrapegoat() {
  if (scrapegoat) { return scrapegoat }

  scrapegoat = new Scrapegoat(scrapegoatConfig());
  return scrapegoat
}

let countdownGoat = null;
function useCountdownScrapegoat() {
  if (countdownGoat) { return countdownGoat }

  let countdownConfig = {...scrapegoatConfig(), uri: settings.readSettings().icloudCountdownCalendarUrl }
  countdownGoat = new Scrapegoat(countdownConfig);
  return countdownGoat
}

function scrapegoatConfig() {
  const loadedSettings = settings.readSettings()
  return {
    auth: {
      user: loadedSettings.icloudEmail,
      pass: loadedSettings.icloudAppSpecificPassword,
      sendImmediately: true,
    },
    uri: loadedSettings.icloudCalendarUrl,
  };
}

module.exports = { useScrapegoat, useCountdownScrapegoat };
