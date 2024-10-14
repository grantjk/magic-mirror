const express = require('express');
const router = express.Router();
const fs = require('fs');
const moment = require('moment');
const { updateData } = require('../utils/dataUpdater');

router.get("/", async (_req, res) => {
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
    res.json(json);
  } catch (err) {
    console.log("pokemon", "Error fetching pokemon");
    console.log("pokemon", err);

    res.json({});
  }
});

module.exports = router;
