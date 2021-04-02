require('dotenv').config()

const express = require('express')
const app = express()
const fs = require('fs');
const moment = require("moment");
const got = require("got");

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
        const parsedEvents = events.slice(0,8).map(e=> {
            let start = moment(e.data.start)
            let end = moment(e.data.end)

            if (isFullDayEvent(e)) {
                start = start.utc()
                end = end.utc()
            }

            return {
                title: e.data.title,
                allDay: isFullDayEvent(e),
                start: {
                    raw: e.data.start,
                    month: start.format('MMMM'),
                    date: start.format('D'),
                    time: start.format('h:mm a'),
                },
                end: {
                    raw: e.data.end,
                    month: end.format('MMMM'),
                    date: end.format('D'),
                    time: end.format('h:mm a'),
                },
                location: e.data.location,
            }
        })
        res.json(parsedEvents)
    });
})


function isFullDayEvent(event) {
    const start = moment.utc(event.data.start)
    const end = moment.utc(event.data.end)
    return start.hour() === 0 && end.isSame(start.endOf('day'), 'second')
}

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
app.get('/weather', async (req, res) => {
    let current, forecast, hourly
    if (process.env.DEV) {
        res.json(readWeatherFromCache())
    } else {
        try {
            const api_key = process.env.ACCUWEATHER_API_KEY
            currentResponse = await got(`http://dataservice.accuweather.com/currentconditions/v1/55488?apikey=${api_key}&details=true`, {json: true})
            current = currentResponse.body[0]

            forecastResponse = await got(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
            forecast = forecastResponse.body

            hourlyResponse = await got(`http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
            hourly = hourlyResponse.body

            // update cache
            fs.writeFileSync('./fixtures/toronto_current.json', JSON.stringify(currentResponse.body))
            fs.writeFileSync('./fixtures/toronto_5day.json', JSON.stringify(forecastResponse.body))
            fs.writeFileSync('./fixtures/toronto_12hours.json', JSON.stringify(hourlyResponse.body))
            res.json({
                current, forecast, hourly
            })
        } catch(err) {
            res.json(readWeatherFromCache())
        }
    }
})

function readWeatherFromCache() {
    // just reach from cache to avoid rate limit
    current = require('./fixtures/toronto_current.json')[0]
    forecast = require('./fixtures/toronto_5day.json')
    hourly = require('./fixtures/toronto_12hours.json')
    return {current, forecast, hourly}
}

/* =========================== */
/*      Server                 */
/* =========================== */
app.listen(8000, () => {
    console.log(`Starting in env: ${process.env.DEV ? 'Dev' : 'Live'}`)
    console.log("Alive on http://localhost:8000....")
})



/* Weather routes

curl -X GET "http://dataservice.accuweather.com/currentconditions/v1/55488?apikey=API_KEY&details=true"
curl -X GET "http://dataservice.accuweather.com/forecasts/v1/daily/5day/55488?apikey=API_KEY&details=true&metric=true"
curl -X GET "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/55488?apikey=API_KEY&details=true&metric=true"


*/