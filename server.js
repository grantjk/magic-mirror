const path = require("path");
const express = require("express");
const app = express();
const fs = require("fs");
const moment = require("moment");
const got = require("got");
const Airtable = require('airtable');
const sanitize = require('sanitize-html');
const bodyParser = require('body-parser');
const eta = require("eta");
const Scrapegoat = require("scrapegoat");

const settings = require('./src/settings.js');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static(filePath("public")));

/* =========================== */
/*      Renderer               */
/* =========================== */
app.engine("eta", eta.renderFile)
app.set("views", path.join(__dirname, 'views'))
app.set('view engine', 'eta');
app.get("/", (_req, res) => {
  const css = settings.readCustomCSS();
  res.render('index', {css});
});

/* =========================== */
/*     Custom CSS              */
/* =========================== */
app.get("/customcss", (_req, res) => {
  const css = settings.readCustomCSS();
  res.render('customcss', {css});
});


app.post("/customcss", (req, res) => {
  const css = req.body.customCss || "";
  settings.writeCustomCSS(css);

  res.redirect('/customcss');
})

/* =========================== */
/*     Configure Settings      */
/* =========================== */
app.get("/settings", (_req, res) => {
  res.render('settings', settings.readSettings());
});

app.post("/settings", (req, res) => {
  // Save the settings
  const settingsData = {...req.body };
  settings.writeSettings(settingsData);

  // Clear the Scrapegoat cache
  clearSettingsCache();

  // Clear data cache?
  clearDataCache()

  // Redirect to home
  res.redirect('/');
});

function clearSettingsCache() {
  scrapegoat = null;
  countdownGoat = null;
}

// Only clearing calendar for now - others dont make sense yet
function clearDataCache() {
  clearSyncData({key: 'calendar'})
  clearSyncData({key: 'countdown'})
}

/* =========================== */
/*      iCloud calendar        */
/* =========================== */

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

let scrapegoat = null;
function useScrapegoat() {
  if (scrapegoat) { return scrapegoat }

  scrapegoat = new Scrapegoat(scrapegoatConfig());
  return scrapegoat
}

let countdownGoat = null;
function useCountdownScrapegoat() {
  if (countdownGoat) { return countdownGoat }

  let countdownConfig = {...config, uri: settings.readSettings().icloudCountdownCalendarUrl }
  countdownGoat = new Scrapegoat(countdownConfig);
  return countdownGoat
}

app.get("/events", async (_req, res) => {
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
        // writeJSONFile({filename: 'calendar-fixture', json: events})
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

    ////res.set("Cache-Countrol", `private, max-age=${ttlSeconds}`);
    res.json(json);
  } catch (err) {
    log("Calendar", "Error fetching calendar");
    log("Calendar", err);

    res.json([]);
  }
});

app.get("/countdown", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      { identifier: "countdown", ttlCount: 1, ttlUnit: "hour" },
      async () => {
        const start = moment()
          .format("YYYYMMDD[T]HHmmss[Z]");
        const end = moment().add(1, "year").format("YYYYMMDD[T]HHmmss[Z]");
        const goat = useCountdownScrapegoat()
        const events = await goat.getEventsByTime(start, end);
        //writeJSONFile({filename: 'countdown-fixture', json: events})
        return events.map((e) => {
          return { title: e.data.title, date: moment(e.data.start).utc().format('YYYY-MM-DD') }
        });
      }
    );

    ////res.set("Cache-Countrol", `private, max-age=${ttlSeconds}`);
    res.json(json);
  } catch (err) {
    log("Countdown", "Error fetching countdown");
    log("Countdown", err);

    res.json([]);
  }
});

function isFullDayEvent(event) {
  if (event?.data?.duration?.days > 0 || event?.data?.duration?.weeks > 0) {
    return true;
  }

  const start = moment.utc(event.data.start);
  const end = moment.utc(event.data.end);
  return start.hour() === 0 && end.isSame(start.endOf("day"), "second");
}

/* =========================== */
/*      Positive Message       */
/* =========================== */
app.get("/message", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      {
        identifier: "positive-message",
        ttlHook: () => {
          return moment().endOf("day");
        },
      },
      async () => {
        const messages = fs.readFileSync("./data/messages.txt", "utf8");
        const messageList = messages.split("\n");
        const messageNumber = Math.floor(Math.random() * messageList.length);
        return { message: messageList[messageNumber] };
      }
    );
    //res.set("Cache-Countrol", `private, max-age=${ttlSeconds}`);
    res.json(json);
  } catch (err) {
    log("postive-message", "Error fetching positive message");
    log("positive-message", err);

    res.json({});
  }
});

/* =========================== */
/*      Pokemon                */
/* =========================== */
app.get("/pokemon", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      {
        identifier: "pokemon",
        ttlHook: () => {
          return moment().endOf("day");
        },
      },
      () => {
        const pokemons = [
          "bulbasaur",
          "charizard",
          "charmander",
          "pikachu",
          "squirtle",
        ];
        const number = Math.floor(Math.random() * pokemons.length);
        const pokemon = pokemons[number];
        const art = fs.readFileSync(`./data/pokemon/${pokemon}.txt`, "utf8");
        return { art };
      }
    );
    //res.set("Cache-Control", `private, max-age=${ttlSeconds}`);
    res.json(json);
  } catch (err) {
    log("pokemon", "Error fetching pokemon");
    log("pokemon", err);

    res.json({});
  }
});

/* =========================== */
/*      Weather                */
/* =========================== */
app.get("/weather", async (_req, res) => {
  const today = moment()
  if (today.hour() >= 2 && today.hour() < 5) {
    // Don't waste calls when people are sleeping
    log(
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

      //res.set(
        //"Cache-Control",
        //`private, max-age=${Math.min(currentTtl, hourlyTtl, forecastTtl)}`
      //);
      res.json({
        current,
        forecast,
        hourly,
      });
    } catch (err) {
      // If we get here, then our cache fallback didn't work and we have big troubles
      log("weather", "Error fetching weather");
      log("weather", err);
      res.json({});
    }
  }
});

/* =========================== */
/*      MLB                    */
/* =========================== */

// curl -H 'Host: statsapi.mlb.com' -H 'Accept: */*' -H 'Cookie: gpv_v48=ATBAT%3A%20Season-pick-em%3A%20MLB%202021%20Season%20Pick%20%26%23x27%3BEm; s_getNewRepeat=1617637893080-New; s_lv=1617637893081; s_lv_s=More%20than%2030%20days; s_ppn=ATBAT%3A%20Season-pick-em%3A%20MLB%202021%20Season%20Pick%20%26%23x27%3BEm; AMCV_A65F776A5245B01B0A490D44%40AdobeOrg=1687686476%7CMCIDTS%7C18723%7CMCMID%7C16301876984098754232224264368243292811%7CMCAID%7CNONE%7CMCOPTOUT-1617645091s%7CNONE%7CvVersion%7C3.0.0; mbox=session#0f995e8bed99489e90882ba659600b7d#1617639715; __cfduid=dd54ec15c6fb13c9d90e7919893a719261617637848' -H 'User-Agent: MLB/6099 CFNetwork/1237 Darwin/20.4.0' -H 'Accept-Language: en-ca' --compressed 'https://statsapi.mlb.com/api/v1/schedule?startDate=2021-03-28&endDate=2021-04-13&sportId=1&teamId=141,160&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields='
//curl -H 'Host: statsapi.mlb.com' -H 'Accept: */*' -H 'User-Agent: MLB/6099 CFNetwork/1237 Darwin/20.4.0' -H 'Accept-Language: en-ca' --compressed 'https://statsapi.mlb.com/api/v1/schedule?startDate=2021-03-28&endDate=2021-04-13&sportId=1&teamId=141,160&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields='

app.get("/mlb", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      {
        identifier: "mlb",
        ttlHook: (payload) => {
          const game = payload?.dates?.[0]?.games?.[0];

          log("mlb", `Determining next update...`);

          //TODO: make this better by fetching past and future game schedules
          let nextUpdate;
          if (game?.status?.abstractGameState === "Live") {
            // If game is in progress - use shorter refresh time
            nextUpdate = moment().add(2, "minutes");
            log(`MLB`, `Game is Live. Next update at ${nextUpdate}`);
          } else if (game?.status?.abstractGameState === "Final") {
            // If the game is over, just add reasonable time
            nextUpdate = moment().add(2, "hours");
            log(`MLB`, `Game is Final. Next update at ${nextUpdate}`);
          } else if (game?.gameDate) {
            nextUpdate = moment(game.gameDate);
            log(`MLB`, `Game is later today. Next update at ${nextUpdate}`);
          } else {
            nextUpdate = game?.gameDate
              ? moment(game.gameDate)
              : moment().add(4, "hours");
            log(`MLB`, `No game found today. Next update at ${nextUpdate}`);
          }

          return nextUpdate;
        },
      },
      async () => {
        log(`MLB`, `Fetching update....`);
        let now = moment();

        // If before 11, show yesterday's game
        if (now.hour() < 11) {
          now = moment().subtract(1, "day");
        }

        const gameDate = now.format("YYYY-MM-DD");
        const url = `https://statsapi.mlb.com/api/v1/schedule?startDate=${gameDate}&endDate=${gameDate}&sportId=1&teamId=141&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields=`;
        const response = await got(url, { json: true });
        return response.body;
      }
    );

    //res.set("Cache-Control", `private, max-age=${ttlSeconds}`);
    res.json(json);
  } catch (err) {
    // This means our cache has failed
    log(`MLB`, `ERROR fetching mlb scores: ${err}`);
    res.json({});
  }
});

// ============= Messages =========== */
app.get('/announcements', (_req, res) => {
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


/* ===========SYNC Data ============*/
const syncFilePath = "data/sync.json";

async function updateData(
  { identifier, ttlCount, ttlUnit, ttlHook },
  updateFunction
) {
  let json;
  const filename = `cache/${identifier}.json`;

  const nextUpdate = readSyncData(identifier);
  const shouldUpdate = !nextUpdate || moment().isAfter(moment(nextUpdate));
  log(
    identifier,
    `Update=${shouldUpdate}. Next update to ${identifier} after ${
      nextUpdate ? moment(nextUpdate).format(logDateFormat) : "now"
    }.`
  );

  let nextRefreshDate = moment().add(1, "minute");
  if (shouldUpdate) {
    log(identifier, `Requesting update for ${identifier}`);
    try {
      json = await updateFunction();
      log(identifier, `Saving updated data for ${identifier}`);

      writeJSONFile({ filename, json });

      // If we want to use the actual response to set the cache ttl, then use the hook
      nextRefreshDate = ttlHook
        ? ttlHook(json)
        : moment().add(ttlCount, ttlUnit);
      log(
        identifier,
        `Updating sync key for ${identifier} to ${nextRefreshDate.format(
          logDateFormat
        )}`
      );
      writeSyncData({ key: identifier, value: nextRefreshDate });
    } catch (err) {
      log(identifier, `Error getting updated data: ${err}`);
      json = readJSONFile(filename);
    }
  } else {
    if (nextUpdate) {
      nextRefreshDate = moment(nextUpdate);
    }

    log(identifier, `Loading current data from cache`);
    json = readJSONFile(filename);
  }

  const ttlSeconds = nextRefreshDate.diff(moment(), "seconds") + 10; // add 10 buffer
  return { json, ttlSeconds };
}

function readSyncData(key) {
  const json = readJSONFile(syncFilePath);
  const value = json[key];
  return value;
}

function clearSyncData({key}) {
  const json = readJSONFile(syncFilePath);
  delete json[key]

  writeJSONFile({ filename: syncFilePath, json });
}

function writeSyncData({ key, value }) {
  const json = readJSONFile(syncFilePath);
  json[key] = value;

  writeJSONFile({ filename: syncFilePath, json });
}

function readJSONFile(filename) {
  log("read-file", `Reading file at ${filePath(filename)}`);
  try {
    const data = fs.readFileSync(filePath(filename), "utf8");
    const json = JSON.parse(data);
    return json;
  } catch (err) {
    log(filename, err);
    return undefined;
  }
}

function writeJSONFile({ filename, json }) {
  log("write-file", `Writing file at ${filePath(filename)}`);
  fs.writeFileSync(filePath(filename), JSON.stringify(json, null, 2));
}

function filePath(filename) {
  return __dirname + "/" + filename;
}

function log(key, message) {
  console.log(
    `[${moment().format(logDateFormat)}] [${key.toUpperCase()}]: ${message}`
  );
}

const logDateFormat = "YYYY-MM-DD HH:mm:ss";

/* =========================== */
/*      Server                 */
/* =========================== */
app.listen(8000, () => {
  console.log("Alive on http://localhost:8000....");
});
