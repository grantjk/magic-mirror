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
const { Z_FIXED } = require('zlib');
const scrapegoat = new Scrapegoat(config);

app.get('/events', (req, res) => {
    const start = moment().format("YYYYMMDD[T]HHmmss[Z]");
    const end = moment().add(1, 'month').format("YYYYMMDD[T]HHmmss[Z]");
    scrapegoat.getEventsByTime(start, end).then(events => {
        const parsedEvents = events.map(e=> {
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
    }).catch(err => {
        console.log("Error fetching calendar")
        console.log(err)
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
        // current = require('./fixtures/toronto_current.json')
        // forecast = require('./fixtures/toronto_5day.json')
        // hourly = require('./fixtures/toronto_12hours.json')

        
        // console.log(current.lastUpdated)
        // console.log(moment(current.lastUpdated).isSame(moment(), 'hour'))

        // console.log(hourly.lastUpdated)
        // console.log(moment(hourly.lastUpdated).isSame(moment(), 'hour'))

        // console.log(forecast.lastUpdated)
        // console.log(moment(forecast.lastUpdated).isSame(moment(), 'day'))

        // const syncDate = moment().toISOString()
        // current.lastUpdated = syncDate
        // forecast.lastUpdated = syncDate
        // hourly.lastUpdated = syncDate

        // fs.writeFileSync('./fixtures/toronto_current.json', JSON.stringify(current))
        // fs.writeFileSync('./fixtures/toronto_12hours.json', JSON.stringify(hourly))
        // fs.writeFileSync('./fixtures/toronto_5day.json', JSON.stringify(forecast))

        // console.log("reading weather from cache...")
        // res.json(readWeatherFromCache())
        // return

    if (moment().hour() < 5) {
        // Don't waste calls when people are sleeping
        console.log("Between 12am and 5am. Everyone is sleeping - reading weather from cache...")
        res.json(readWeatherFromCache())
    } else {
        try {
            const syncDate = moment().toISOString()
            const api_key = process.env.ACCUWEATHER_API_KEY

            current = require('./fixtures/toronto_current.json')
            if (moment(current.lastUpdated).isSame(moment(), 'hour')) {
                console.log(`Last updated current: ${current.lastUpdated}. Read from cache`)
            } else {
                currentResponse = await got(`http://dataservice.accuweather.com/currentconditions/v1/55488?apikey=${api_key}&details=true`, {json: true})
                current = currentResponse.body[0]
                current.lastUpdated = syncDate
                fs.writeFileSync('./fixtures/toronto_current.json', JSON.stringify(current))
            }

            hourly = require('./fixtures/toronto_12hours.json')
            if (moment(hourly.lastUpdated).isSame(moment(), 'hour')) {
                console.log(`Last updated current: ${hourly.lastUpdated}. Read from cache`)
            } else {
                hourlyResponse = await got(`http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
                hourly.data = hourlyResponse.body
                hourly.lastUpdated = syncDate
                fs.writeFileSync('./fixtures/toronto_12hours.json', JSON.stringify(hourly))
            }

            forecast = require('./fixtures/toronto_5day.json')
            if (moment(forecast.lastUpdated).isSame(moment(), 'day')) {
                console.log(`Last updated 5day forecast: ${forecast.lastUpdated}. Read from cache`)
            } else {
                forecastResponse = await got(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
                forecast = forecastResponse.body
                forecast.lastUpdated = syncDate
                fs.writeFileSync('./fixtures/toronto_5day.json', JSON.stringify(forecast))
            }

            res.json({
                current, 
                forecast, 
                hourly: hourly.data
            })
        } catch(err) {
            console.log("Error fetching weather")
            console.log(err)
            res.json(readWeatherFromCache())
        }
    }
})


function readWeatherFromCache() {
    // just read from cache to avoid rate limit
    current = require('./fixtures/toronto_current.json')
    forecast = require('./fixtures/toronto_5day.json')
    hourly = require('./fixtures/toronto_12hours.json')
    return {
        current,
        forecast,
        hourly: hourly.data
    }
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