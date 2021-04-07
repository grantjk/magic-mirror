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

app.get('/events', async (req, res) => {
    console.log('===============CALENDAR===============')

    try {
        const data = await updateData({identifier: 'calendar', ttlCount: 15, ttlUnit: 'minutes'}, async () => {
            const start = moment().subtract(1, 'day').format("YYYYMMDD[T]HHmmss[Z]");
            const end = moment().add(1, 'month').format("YYYYMMDD[T]HHmmss[Z]");
            const events = await scrapegoat.getEventsByTime(start, end)
            return events.map(e=> {
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
        })

        res.json(data)
    } catch (err) {
        console.log("Error fetching calendar")
        console.log(err)

        res.json([])
    }
})


function isFullDayEvent(event) {
    const start = moment.utc(event.data.start)
    const end = moment.utc(event.data.end)
    return start.hour() === 0 && end.isSame(start.endOf('day'), 'second')
}

/* =========================== */
/*      Positive Message       */
/* =========================== */
app.get('/message', async (req, res) => {
    try {
        const data = await updateData({identifier: 'positive-message', ttlHook: () => {
            return moment().endOf('day')
        }}, async () => {
            const messages = fs.readFileSync('./data/messages.txt', 'utf8')
            const messageList = messages.split('\n')
            const messageNumber = Math.floor(Math.random()*messageList.length)
            return { message: messageList[messageNumber] }
        })
        res.json(data)
    } catch (err) {
        console.log("Error fetching positive message")
        console.log(err)

        res.json({})
    }
})

/* =========================== */
/*      Pokemon                */
/* =========================== */
app.get('/pokemon', async (req, res) => {
    try {
        const data = await updateData({identifier: 'pokemon', ttlHook: () => {
            return moment().endOf('day')
        }}, () => {
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
            return { art }
        })
        res.json(data)
    } catch (err) {
        console.log("Error fetching pokemon")
        console.log(err)

        res.json({})
    }
})

/* =========================== */
/*      Weather                */
/* =========================== */
app.get('/weather', async (req, res) => {
    console.log('================= GET WEATHER ==================')
    console.log(`Current Time: ${moment().toString()}`)

    let current, forecast, hourly
    if (moment().hour() < 5) {
        // Don't waste calls when people are sleeping
        console.log("Between 12am and 5am. Everyone is sleeping - reading weather from cache...")
        res.json({})
    } else {
        try {
            const api_key = process.env.ACCUWEATHER_API_KEY

            current = await updateData({identifier: 'current-conditions', ttlCount: 1, ttlUnit: 'hour'}, async () => {
                const response = await got(`http://dataservice.accuweather.com/currentconditions/v1/55488?apikey=${api_key}&details=true`, {json: true})
                return response.body[0]
            })

            hourly = await updateData({identifier: 'hourly-conditions', ttlCount: 1, ttlUnit: 'hour'}, async () => {
                const response = await got(`http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
                return response.body
            })

            forecast = await updateData({identifier: '5day-forecast', ttlCount: 6, ttlUnit: 'hours'}, async () => {
                const response = await got(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/55488?apikey=${api_key}&details=true&metric=true`, {json: true})
                return response.body
            })

            res.json({
                current, 
                forecast, 
                hourly
            })
        } catch(err) {
            // If we get here, then our cache fallback didn't work and we have big troubles
            console.log("Error fetching weather")
            console.log(err)
            res.json({})
        }
        console.log('=============================================')
    }
})


/* =========================== */
/*      MLB                    */
/* =========================== */


// curl -H 'Host: statsapi.mlb.com' -H 'Accept: */*' -H 'Cookie: gpv_v48=ATBAT%3A%20Season-pick-em%3A%20MLB%202021%20Season%20Pick%20%26%23x27%3BEm; s_getNewRepeat=1617637893080-New; s_lv=1617637893081; s_lv_s=More%20than%2030%20days; s_ppn=ATBAT%3A%20Season-pick-em%3A%20MLB%202021%20Season%20Pick%20%26%23x27%3BEm; AMCV_A65F776A5245B01B0A490D44%40AdobeOrg=1687686476%7CMCIDTS%7C18723%7CMCMID%7C16301876984098754232224264368243292811%7CMCAID%7CNONE%7CMCOPTOUT-1617645091s%7CNONE%7CvVersion%7C3.0.0; mbox=session#0f995e8bed99489e90882ba659600b7d#1617639715; __cfduid=dd54ec15c6fb13c9d90e7919893a719261617637848' -H 'User-Agent: MLB/6099 CFNetwork/1237 Darwin/20.4.0' -H 'Accept-Language: en-ca' --compressed 'https://statsapi.mlb.com/api/v1/schedule?startDate=2021-03-28&endDate=2021-04-13&sportId=1&teamId=141,160&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields='
//curl -H 'Host: statsapi.mlb.com' -H 'Accept: */*' -H 'User-Agent: MLB/6099 CFNetwork/1237 Darwin/20.4.0' -H 'Accept-Language: en-ca' --compressed 'https://statsapi.mlb.com/api/v1/schedule?startDate=2021-03-28&endDate=2021-04-13&sportId=1&teamId=141,160&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields='

app.get('/mlb', async (req, res) => {
    try {
        const json = await updateData({identifier: 'mlb', ttlHook: (payload) => {
            const game = payload?.dates?.[0]?.games?.[0]

            console.log(`[MLB] Determining next update...`)

            //TODO: make this better by fetching past and future game schedules
            let nextUpdate
            if (game?.status?.abstractGameState === 'Live') {
                // If game is in progress - use shorter refresh time
                nextUpdate = moment().add(2, 'minutes')
                console.log(`[MLB] Game is Live. Next update at ${nextUpdate}`)
            } else if (game?.status?.abstractGameState === 'Final') {
                // If the game is over, just add reasonable time
                nextUpdate = moment().add(2, 'hours')
                console.log(`[MLB] Game is Final. Next update at ${nextUpdate}`)
            } else if (game?.gameDate) {
                nextUpdate = moment(game.gameDate) 
                console.log(`[MLB] Game is later today. Next update at ${nextUpdate}`)
            } else {
                nextUpdate = game?.gameDate ? moment(game.gameDate) : moment().add(4, 'hours')
                console.log(`[MLB] No game found today. Next update at ${nextUpdate}`)
            }

            return nextUpdate
        }}, async () => {
            console.log(`[MLB] Fetching update....`)
            const today = moment().format('YYYY-MM-DD')
            const url = `https://statsapi.mlb.com/api/v1/schedule?startDate=${today}&endDate=${today}&sportId=1&teamId=141&hydrate=team,game(seriesSummary),decisions,person,stats,linescore(runners,matchup,positions),flags,probablePitcher&fields=`
            const response = await got(url, {json: true})
            return response.body
        })

        res.json(json)
    } catch (err) {
        // This means our cache has failed
        console.log(`[MLB] ERROR fetching mlb scores: ${err}`)
        res.json({})
    }
})


/* ===========SYNC Data ============*/
const syncFilePath = './data/sync.json'

async function updateData({identifier, ttlCount, ttlUnit, ttlHook}, updateFunction) {
    let json
    const filename = `./cache/${identifier}.json`

    const nextUpdate = readSyncData(identifier)

    console.log(`[${identifier.toUpperCase()}] Next update to ${identifier} after ${nextUpdate}.`)
    if (!nextUpdate || moment().isAfter(moment(nextUpdate))) {
        console.log(`[${identifier.toUpperCase()}] Requesting update for ${identifier}`)
        try {
            json = await updateFunction()
            console.log(`[${identifier.toUpperCase()}] Saving updated data for ${identifier}`)

            writeJSONFile({filename, json})

            // If we want to use the actual response to set the cache ttl, then use the hook
            const futureDate = ttlHook ? ttlHook(json) : moment().add(ttlCount, ttlUnit)

            console.log(`[${identifier.toUpperCase()}] Updating sync key for ${identifier} to ${futureDate}`)
            writeSyncData({ key: identifier, value: futureDate })
        } catch (err) {
            console.log(`[${identifier.toUpperCase()}] Error getting updated data: ${err}`)
            json = readJSONFile(filename)
        }
    } else {
        console.log(`[${identifier.toUpperCase()}] Loading current data from cache`)
        json = readJSONFile(filename)
    }

    console.log(`[${identifier.toUpperCase()}] Returning data: ${json}`)
    return json
}

function readSyncData(key) {
    const json = readJSONFile(syncFilePath)
    const value = json[key]
    console.log(`[${key.toUpperCase()}]: Next sync for ${key} at ${value}`)
    return value
}

function writeSyncData({key, value}) {
    console.log(`[${key.toUpperCase()}]: Updating sync log for ${key} ${value}`)
    const json = readJSONFile(syncFilePath)
    json[key] = value

    writeJSONFile({filename: syncFilePath, json})
}

function readJSONFile(filename) {
    console.log(`Reading file at ${filename}`)
    try {
        const data = fs.readFileSync(filename, 'utf8')
        const json = JSON.parse(data)
        return json
    } catch (err) {
        console.log(err)
        return undefined
    }
}

function writeJSONFile({filename, json}) {
    console.log(`Writing file at ${filename}`)
    fs.writeFileSync(filename, JSON.stringify(json, null, 2))
}

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