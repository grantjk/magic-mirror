const express = require('express');
const router = express.Router();
const settings = require('../settings');
const { clearSettingsCache, clearDataCache } = require('../utils/cache');

router.get("/", (_req, res) => {
  res.render('settings', settings.readSettings());
});

router.post("/", (req, res) => {
  // Save the settings
  const settingsData = {...req.body };
  settings.writeSettings(settingsData);

  // Clear the Scrapegoat cache
  clearSettingsCache();

  // Clear data cache?
  clearDataCache();

  // Redirect to home
  res.redirect('/');
});

module.exports = router;
