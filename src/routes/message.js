const express = require('express');
const router = express.Router();
const fs = require('fs');
const moment = require('moment');
const { updateData } = require('../utils/dataUpdater');

router.get("/", async (_req, res) => {
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
    res.json(json);
  } catch (err) {
    console.log("postive-message", "Error fetching positive message");
    console.log("positive-message", err);

    res.json({});
  }
});

module.exports = router;
