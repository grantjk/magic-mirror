const express = require('express');
const router = express.Router();
const moment = require('moment');
const got = require('got');
const { updateData } = require('../utils/dataUpdater');

router.get("/", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      {
        identifier: "mlb",
        ttlHook: (payload) => {
          const game = payload?.dates?.[0]?.games?.[0];

          console.log("mlb", `Determining next update...`);

          let nextUpdate;
          if (game?.status?.abstractGameState === "Live") {
            nextUpdate = moment().add(2, "minutes");
            console.log(`MLB`, `Game is Live. Next update at ${nextUpdate}`);
          } else if (game?.status?.abstractGameState === "Final") {
            nextUpdate = moment().add(2, "hours");
            console.log(`MLB`, `Game is Final. Next update at ${nextUpdate}`);
          } else if (game?.gameDate) {
            nextUpdate = moment(game.gameDate);
            console.log(`MLB`, `Game is later today. Next update at ${nextUpdate}`);
          } else {
            nextUpdate = game?.gameDate
              ? moment(game.gameDate)
              : moment().add(4, "hours");
            console.log(`MLB`, `No game found today. Next update at ${nextUpdate}`);
          }

          return nextUpdate;
        },
      },
      async () => {
        console.log(`MLB`, `Fetching update....`);
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

    res.json(json);
  } catch (err) {
    // This means our cache has failed
    console.log(`MLB`, `ERROR fetching mlb scores: ${err}`);
    res.json({});
  }
});

router.get("/standings", async (_req, res) => {
  try {
    const { json, ttlSeconds } = await updateData(
      {
        identifier: "mlb-standings",
        ttlHook: (payload) => {
          return moment().add(1, "hour");
        },
      },
      async () => {
        console.log(`MLB`, `Fetching update....`);

        let now = moment();
        const gameDate = now.format("YYYY-MM-DD");
        const url = `https://statsapi.mlb.com/api/v1/standings?hydrate=team(previousSchedule(date%3D${gameDate},limit%3D1,gameType%3D%5BR%5D,inclusive%3Dtrue),nextSchedule(date%3D${gameDate},limit%3D1,gameType%3D%5BR%5D,inclusive%3Dfalse),division)&leagueId=103,104&season=${now.format("YYYY")}&sportId=1&standingsType=wildCardWithLeaders`;
        const response = await got(url, { json: true });
        return response.body;
      }
    );

    res.json(json);
  } catch (err) {
    // This means our cache has failed
    console.log(`MLB`, `ERROR fetching mlb scores: ${err}`);
    res.json({});
  }
});

module.exports = router;
