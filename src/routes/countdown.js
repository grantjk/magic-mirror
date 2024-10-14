const express = require('express');
const router = express.Router();
const moment = require('moment');
const { updateData } = require('../utils/dataUpdater');
const { useCountdownScrapegoat } = require('../utils/scrapegoat');

router.get("/", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      { identifier: "countdown", ttlCount: 1, ttlUnit: "hour" },
      async () => {
        const start = moment().format("YYYYMMDD[T]HHmmss[Z]");
        const end = moment().add(1, "year").format("YYYYMMDD[T]HHmmss[Z]");
        const goat = useCountdownScrapegoat()
        const events = await goat.getEventsByTime(start, end);
        return events.map((e) => {
          return { title: e.data.title, date: moment(e.data.start).utc().format('YYYY-MM-DD') }
        });
      }
    );

    res.json(json);
  } catch (err) {
    console.log("Countdown", "Error fetching countdown");
    console.log("Countdown", err);

    res.json([]);
  }
});

module.exports = router;
