const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const eta = require("eta");

const settings = require('./src/settings.js');
const settingsRoutes = require('./src/routes/settings');
const eventsRoutes = require('./src/routes/events');
const countdownRoutes = require('./src/routes/countdown');
const messageRoutes = require('./src/routes/message');
const pokemonRoutes = require('./src/routes/pokemon');
const weatherRoutes = require('./src/routes/weather');
const mlbRoutes = require('./src/routes/mlb');
const announcementsRoutes = require('./src/routes/announcements');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, "public")));

/* =========================== */
/*      Renderer               */
/* =========================== */
app.engine("eta", eta.renderFile)
app.set("views", path.join(__dirname, 'views'))
app.set('view engine', 'eta');
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================== */
/*     Configure Routes        */
/* =========================== */
app.use('/settings', settingsRoutes);
app.use('/events', eventsRoutes);
app.use('/countdown', countdownRoutes);
app.use('/message', messageRoutes);
app.use('/pokemon', pokemonRoutes);
app.use('/weather', weatherRoutes);
app.use('/mlb', mlbRoutes);
app.use('/announcements', announcementsRoutes);

/* =========================== */
/*      Server                 */
/* =========================== */
app.listen(8000, () => {
  console.log("Alive on http://localhost:8000....");
});