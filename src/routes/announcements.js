const express = require('express');
const router = express.Router();
const Airtable = require('airtable');
const sanitize = require('sanitize-html');
const settings = require('../settings');

router.get('/', (_req, res) => {
  const loadedSettings = settings.readSettings();
  var base = new Airtable({apiKey: loadedSettings.airtableKey}).base(loadedSettings.airtableBase);
  base('announcements')
    .select({ view: 'Grid view'})
    .firstPage()
    .then((records) => {
      res.json(records.map((r) => {
        return { ...r.fields, title: sanitize(r.fields.title), content: sanitize(r.fields.content) }
      }))
    })
    .catch((err) => {
      console.error(err);
      res.json({});
  });
});

module.exports = router;
