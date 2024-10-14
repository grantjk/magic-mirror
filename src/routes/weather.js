const express = require('express');
const router = express.Router();
const moment = require('moment');
const got = require('got');
const settings = require('../settings');
const { updateData } = require('../utils/dataUpdater');
const { readJSONFile } = require('../utils/fileHelpers');

router.get("/", async (_req, res) => {
  const today = moment()
  if (today.hour() >= 2 && today.hour() < 5) {
    // Don't waste calls when people are sleeping
    console.log(
      "weather",
      "Between 2am and 5am. Everyone is sleeping - reading weather from cache..."
    );
    res.json({
      current: readJSONFile('cache/current-conditions.json'),
      forecast: readJSONFile('cache/5day-forecast.json'),
      hourly: readJSONFile('cache/hourly-conditions.json')
    })
  } else {
    try {
      const loadedSettings = settings.readSettings();
      const api_key = loadedSettings.accuweatherApiKey;

      let { json: current, ttlSeconds: currentTtl } = await updateData(
        { identifier: "current-conditions", ttlCount: 1, ttlUnit: "hour" },
        async () => {
          const response = await got(
            `http://dataservice.accuweather.com/currentconditions/v1/${loadedSettings.accuweatherCityKey}?apikey=${api_key}&details=true`,
            { json: true }
          );
          return response.body[0];
        }
      );

      let { json: hourly, ttlSeconds: hourlyTtl } = await updateData(
        { identifier: "hourly-conditions", ttlCount: 1, ttlUnit: "hour" },
        async () => {
          const response = await got(
            `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${loadedSettings.accuweatherCityKey}?apikey=${api_key}&details=true&metric=true`,
            { json: true }
          );
          return response.body;
        }
      );

      let { json: forecast, ttlSeconds: forecastTtl } = await updateData(
        { identifier: "5day-forecast", ttlCount: 6, ttlUnit: "hours" },
        async () => {
          const response = await got(
            `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${loadedSettings.accuweatherCityKey}?apikey=${api_key}&details=true&metric=true`,
            { json: true }
          );
          return response.body;
        }
      );

      res.json({
        current,
        forecast,
        hourly,
      });
    } catch (err) {
      // If we get here, then our cache fallback didn't work and we have big troubles
      console.log("weather", "Error fetching weather");
      console.log("weather", err);
      res.json({});
    }
  }
});

module.exports = router;
