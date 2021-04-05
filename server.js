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
    const start = moment().subtract(1, 'day').format("YYYYMMDD[T]HHmmss[Z]");
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
    console.log('================= GET WEATHER ==================')
    let current, forecast, hourly
    if (moment().hour() < 5) {
        // Don't waste calls when people are sleeping
        console.log("Between 12am and 5am. Everyone is sleeping - reading weather from cache...")
        res.json(readWeatherFromCache())
    } else {
        try {
            const syncDate = moment().toISOString()
            const api_key = process.env.ACCUWEATHER_API_KEY

            current = require('./fixtures/toronto_current.json')
            console.log(`Last updated current: ${moment(current.lastUpdated).toString()}.`)
            if (moment(current.lastUpdated).isSame(moment(), 'hour')) {
                console.log('Loading current data from cache. Only update once an hour.')
            } else {
                console.log('Requesting update to current data')
                currentResponse = await got(`http://dataservice.accuweather.com/currentconditions/v1/55488?apikey=${api_key}&details=true`, {json: true})
                current = currentResponse.body[0]
                current.lastUpdated = syncDate
                console.log('Saving current conditions to cache')
                fs.writeFileSync('./fixtures/toronto_current.json', JSON.stringify(current))
            }

            console.log('-----')

            hourly = require('./fixtures/toronto_12hours.json')
            console.log(`Last updated hourly: ${moment(hourly.lastUpdated).toString()}`)
            if (moment(hourly.lastUpdated).isSame(moment(), 'hour')) {
                console.log('Loading hourly data from cache. Only update once an hour.')
            } else {
                console.log('Requesting update to hourly data')
                hourlyResponse = await got(`http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
                hourly.data = hourlyResponse.body
                hourly.lastUpdated = syncDate
                console.log('Saving hourly forecast to cache')
                fs.writeFileSync('./fixtures/toronto_12hours.json', JSON.stringify(hourly))
            }

            console.log('-----')

            forecast = require('./fixtures/toronto_5day.json')
            console.log(`Last updated 5 day forecast: ${moment(forecast.lastUpdated).toString()}`)
            if (moment(forecast.lastUpdated).isAfter(moment().subtract(4, 'hour'))) {
                console.log('Loading 5 day forecast from cache. Only update every 4 hours.')
            } else {
                console.log('Requesting update to 5 day forecast')
                forecastResponse = await got(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
                forecast = forecastResponse.body
                forecast.lastUpdated = syncDate
                console.log('Saving 5 day forecast to cache')
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
        console.log('=============================================')
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
/*      MLB                    */
/* =========================== */


// curl -H 'Host: statsapi.mlb.com' -H 'Accept: */*' -H 'Cookie: gpv_v48=ATBAT%3A%20Season-pick-em%3A%20MLB%202021%20Season%20Pick%20%26%23x27%3BEm; s_getNewRepeat=1617637893080-New; s_lv=1617637893081; s_lv_s=More%20than%2030%20days; s_ppn=ATBAT%3A%20Season-pick-em%3A%20MLB%202021%20Season%20Pick%20%26%23x27%3BEm; AMCV_A65F776A5245B01B0A490D44%40AdobeOrg=1687686476%7CMCIDTS%7C18723%7CMCMID%7C16301876984098754232224264368243292811%7CMCAID%7CNONE%7CMCOPTOUT-1617645091s%7CNONE%7CvVersion%7C3.0.0; mbox=session#0f995e8bed99489e90882ba659600b7d#1617639715; __cfduid=dd54ec15c6fb13c9d90e7919893a719261617637848' -H 'User-Agent: MLB/6099 CFNetwork/1237 Darwin/20.4.0' -H 'Accept-Language: en-ca' --compressed 'https://statsapi.mlb.com/api/v1/schedule?startDate=2021-03-28&endDate=2021-04-13&sportId=1&teamId=141,160&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields='
//curl -H 'Host: statsapi.mlb.com' -H 'Accept: */*' -H 'User-Agent: MLB/6099 CFNetwork/1237 Darwin/20.4.0' -H 'Accept-Language: en-ca' --compressed 'https://statsapi.mlb.com/api/v1/schedule?startDate=2021-03-28&endDate=2021-04-13&sportId=1&teamId=141,160&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields='


app.get('/mlb', async (req, res) => {
    // const mlbResponse = require('./fixtures/mlb-upcoming.json')
    // res.json(mlbResponse)

    console.log("==============MLB==============")

    const cached = require('./cache/mlb.json')
    const nextUpdate = moment(cached.nextUpdate)

    console.log(`Next update for MLB after: ${nextUpdate.toString()}`)
    if (moment().isAfter(nextUpdate)) {
        console.log("Updating mlb scores:")
        try {
            const today = moment().format('YYYY-MM-DD')
            const url = `https://statsapi.mlb.com/api/v1/schedule?startDate=${today}&endDate=${today}&sportId=1&teamId=141&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields=`
            const response = await got(url, {json: true})

            const game = response.body.dates?.[0]?.games?.[0]

            // use game start date, or 4 hours
            const nextGameDate = game?.gameDate ? moment(game.gameDate) : moment().add(4, 'hour')

            // TODO: Check in-progress games and make it 5-10mins?

            const data = {
                nextUpdate: nextGameDate.toISOString(),
                data: response.body
            }

            // Save file to cache
            fs.writeFileSync('./cache/mlb.json', JSON.stringify(data))
            res.json(response.body)
        } catch (err) {
            console.log(`ERROR fetching mlb scores: ${err}`)
        }
    } else {
        console.log("Read game data from the cache")
        res.json(cached.data)
    }


})

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