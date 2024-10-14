const express = require('express');
const router = express.Router();
const moment = require('moment');
const { updateData } = require('../utils/dataUpdater');
const { useScrapegoat } = require('../utils/scrapegoat');
const { isFullDayEvent } = require('../utils/eventHelpers');

router.get("/", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      { identifier: "calendar", ttlCount: 15, ttlUnit: "minutes" },
      async () => {
        const start = moment()
          .subtract(1, "day")
          .format("YYYYMMDD[T]HHmmss[Z]");
        const end = moment().add(1, "month").format("YYYYMMDD[T]HHmmss[Z]");
        const goat = useScrapegoat()
        const events = await goat.getEventsByTime(start, end);
        return events.map((e) => {
          let start = moment(e.data.start);
          let end = moment(e.data.end);

          if (isFullDayEvent(e)) {
            start = start.utc();
            end = end.utc();
          }

          return {
            title: e.data.title,
            allDay: isFullDayEvent(e),
            start: {
              raw: e.data.start,
              month: start.format("MMMM"),
              date: start.format("D"),
              time: start.format("h:mm a"),
            },
            end: {
              raw: e.data.end,
              month: end.format("MMMM"),
              date: end.format("D"),
              time: end.format("h:mm a"),
            },
            location: e.data.location,
          };
        });
      }
    );

    res.json(json);
  } catch (err) {
    console.log("Calendar", "Error fetching calendar");
    console.log("Calendar", err);

    res.json([]);
  }
});

module.exports = router;
