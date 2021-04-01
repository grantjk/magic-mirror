require('dotenv').config()

const express = require('express')
const app = express()
const fs = require('fs');
const moment = require("moment");

/* =========================== */
/*      Renderer               */
/* =========================== */
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

/* =========================== */
/*      iCloud calendar        */
/* =========================== */
let config = {
    auth: {
        user: process.env.ICLOUD_EMAIL,
        pass: process.env.ICLOUD_PASS,
        sendImmediately: true
    },
    uri: process.env.ICLOUD_URL
};
const Scrapegoat = require("scrapegoat");
const scrapegoat = new Scrapegoat(config);

app.get('/events', (req, res) => {

    const start = moment().format("YYYYMMDD[T]HHmmss[Z]");
    const end = moment().add(1, 'month').format("YYYYMMDD[T]HHmmss[Z]");
    scrapegoat.getEventsByTime(start, end).then(events => {
        const parsedEvents = events.slice(0,5).map(e=> {
            return {
                title: e.data.title,
                start: {
                    raw: e.data.start,
                    month: moment(e.data.start).format('MMMM'),
                    date: moment(e.data.start).format('D'),
                    time: moment(e.data.start).format('h:mm a'),
                },
                end: e.data.end,
                location: e.data.location,
            }
        })
        res.json(parsedEvents)
    });
})

/* =========================== */
/*      Positive Message       */
/* =========================== */
app.get('/message', (req, res) => {
  const messages = fs.readFileSync('./data/messages.txt', 'utf8')
  const messageList = messages.split('\n')
  const messageNumber = Math.floor(Math.random()*messageList.length)
  res.json({message: messageList[messageNumber]})
})

/* =========================== */
/*      Pokemon                */
/* =========================== */
app.get('/pokemon', (req, res) => {
    const pokemons = [
        'bulbasaur',
        'charizard',
        'charmander',
        'pikachu',
        'squirtle'
    ]
    const number = Math.floor(Math.random()*pokemons.length)
    const pokemon = pokemons[number]
    const art = fs.readFileSync(`./data/pokemon/${pokemon}.txt`, 'utf8')
    res.json({art: art})
})

/* =========================== */
/*      Weather                */
/* =========================== */
app.get('/weather', (req, res) => {
    const current = require('./fixtures/toronto_current.json')
    const forecast = require('./fixtures/toronto_5day.json')
    const hourly = require('./fixtures/toronto_12hours.json')
    res.json({
        current, forecast, hourly
    })
})

/* =========================== */
/*      Server                 */
/* =========================== */
app.listen(8000, () => {
    console.log("Alive on http://localhost:8000....")
})



/* Weather routes

curl -X GET "http://dataservice.accuweather.com/currentconditions/v1/55488?apikey=API_KEY&details=true"
curl -X GET "http://dataservice.accuweather.com/forecasts/v1/daily/5day/55488?apikey=API_KEY&details=true&metric=true"
curl -X GET "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/55488?apikey=API_KEY&details=true&metric=true"


*/