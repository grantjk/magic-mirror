/* ========== Date ========== */
function showDate(){
  const date = new Date(Date.now())
  const dateElement = document.querySelector('#date')
  const displayOptions = {
    weekday:'long',
    month:'short',
    day:'numeric'
  }

  dateElement.textContent = date.toLocaleDateString('en-us', displayOptions)
}

/* ========== Time ========== */
function showTime(){
  const time = new Date()
  const timeElement = document.querySelector('#time')
  let ampm = 'AM'
  let hours = time.getHours()
  if (hours > 12){
    hours = hours-12
    ampm = 'PM'
  }

  let mins = time.getMinutes()
  if (mins < 10) {
    mins = `0${mins}`
  }

  const fullTime = `${hours}<span class="colon">:</span>${mins}`
  timeElement.innerHTML = fullTime
}


/* ========== Positive Message ========== */
let messageUpdatedForToday = false
function updatePositiveMessage() {
  const time = new Date()
  if (time.getHours() === 0) {
    messageUpdatedForToday = false
  }

  if (time.getHours() === 1 && messageUpdatedForToday === false) {
    showPositiveMessage()
    messageUpdatedForToday = true
  }
}

function showPositiveMessage(){
  fetch('/message')
    .then(response => response.json())
    .then(payload => {
      const messageElement = document.querySelector('#positiveMessage')
      messageElement.textContent = payload.message
    })
}

/* ============ Cartoon ====================== */
function showCartoonCharacter() {
  fetch('/pokemon')
    .then(response => response.json())
    .then(payload => {
      const cartoonElement = document.querySelector('#cartoon')
      cartoonElement.innerHTML = `<pre class='art'>${payload.art}</pre>`
    })
}

/* ============ Calendar ================== */
function getCalendarEvents() {
  fetch('/events')
    .then(response => response.json())
    .then(payload => {
      let filteredEvents = payload.filter(e => !eventIsOver(e))
      const calendarElement = document.querySelector('#event-list')

      // Show a nice prompt if today is a full day event
      const fullDayEvent = filteredEvents.filter(e => e.allDay)?.[0]

      // ugh  - otherwise full day events disppear from the today-description
      const isToday = fullDayEvent && moment(moment.utc(fullDayEvent.start.raw).format("YYYY-MM-DD")).isSame(moment(), 'day')
      if (isToday) {
        const todayElement = document.querySelector('#today-description')
        todayElement.textContent = `${fullDayEvent.title}`

        // filter out the first full day event if we are showing it in the title
        filteredEvents = filteredEvents.filter(e => e != fullDayEvent)
      }

      calendarEventLoop(filteredEvents)

      const remaining = filteredEvents.slice(1, 6)
      const listElement = document.createElement('ul')
      remaining.forEach(event => {
        const itemElement = document.createElement('li')
        itemElement.classList.add('calendar-event')
        listElement.appendChild(itemElement)

        // Date Container
        const datecontainer = document.createElement('div')
        datecontainer.classList.add('datecontainer')
        itemElement.appendChild(datecontainer)

        const monthbox = document.createElement('div')
        monthbox.classList.add('monthbox')
        datecontainer.appendChild(monthbox)

        const datebox = document.createElement('div')
        datebox.classList.add('datebox')
        datecontainer.appendChild(datebox)


        monthbox.textContent = event.start.month
        datebox.textContent = event.start.date

        // Event Container
        const eventcontainer = document.createElement('div')
        eventcontainer.classList.add('eventcontainer')
        itemElement.appendChild(eventcontainer)

        const eventName = document.createElement('div')
        eventName.classList.add('event-name')
        eventName.textContent = event.title
        eventcontainer.appendChild(eventName)

        const timebox = document.createElement('div')
        timebox.classList.add('timebox')
        eventcontainer.appendChild(timebox)
        if (!event.allDay) {
          timebox.textContent = event.start.time
        }
      })

      calendarElement.innerHTML = ''
      calendarElement.appendChild(listElement)
    })
}

/* Event Helpers */
let eventLoopRef
function calendarEventLoop(event) {
  clearInterval(eventLoopRef)
  eventLoopRef = setInterval(() => {
    recomputeRelativeTime(event)
  }, 1000)
}

function recomputeRelativeTime(events) {
  let nextEvent = events.filter(e => !eventIsOver(e))[0]
  document.querySelector('#up-next-event-name').textContent = nextEvent.title
  if (eventCurrentlyHappening(nextEvent)) {
    document.querySelector('#up-next-time-range').textContent = ''
  } else {
    document.querySelector('#up-next-time-range').textContent = eventTimeRange(nextEvent)
  }

  const element = document.querySelector('#up-next-relative')

  if (eventCurrentlyHappening(nextEvent)) {
    element.textContent = `Happening now until ${nextEvent.end.time}`
  } else {
    element.textContent = `Up next ${eventRelativeTime(nextEvent)}`
  }
}

function eventCurrentlyHappening(event) {
  const start = moment(event.start.raw)
  const end = moment(event.end.raw)
  const now = moment()

  return start.isBefore(now) && end.isAfter(now)
}

function eventIsOver(event) {
  if (event.allDay) {
    const start = moment.utc(event.start.raw)
    const end = moment.utc(event.end.raw)
    const now = moment()

    return start.isBefore(now) && !moment(end.format('YYYY-MM-DD')).isSame(now, 'day')
  }

  const start = moment(event.start.raw)
  const end = moment(event.end.raw)
  const now = moment()
  return start.isBefore(now) && end.isBefore(now)
}

function eventRelativeTime(event) {
  if (event.allDay) {
    // All day events returned in UTC, so need to just get date
    // then convert back to moment for relative dates
    const ugh = moment.utc(event.start.raw).format('yyyy-MM-DD')
    return moment(ugh).fromNow()
  }
  return moment(event.start.raw).fromNow()
}

function eventTimeRange(event) {
  if (event.allDay) {
    return `${event.start.month} ${event.start.date}`
  }
  return `${event.start.time} - ${event.end.time}`
}


/* ============= Weather ===================== */
function getWeather() {
  fetch(`/weather`)
    .then(response => response.json())
    .then(payload => {
      // Weather Icon
      const conditions = payload?.current?.WeatherText
      const dayTime = payload?.current?.IsDayTime
      const iconEl = document.querySelector('#weather-icon')
      const iconName = weatherIcon(conditions, dayTime)
      if (iconName) {
        iconEl.className = `weather-icon flaticon-${iconName}`
      } else {
        iconEl.textContent = conditions
      }

      // Set Current Temp
      const currentTemp = payload?.current?.Temperature?.Metric?.Value
      const feelsLike = payload?.current?.RealFeelTemperature?.Metric?.Value
      document.querySelector('#weather-temp').innerHTML = `${currentTemp}`

      // Set High / Low
      const high = payload?.forecast?.DailyForecasts?.[0]?.Temperature?.Maximum?.Value
      const low = payload?.forecast?.DailyForecasts?.[0]?.Temperature?.Minimum?.Value
      document.querySelector('#high-low').textContent = `${high} | ${low}`

      // Set Wind Gust
      const windGustSpeed = payload?.current?.WindGust?.Speed?.Metric?.Value
      document.querySelector('#wind').textContent = `${windGustSpeed}km/hr wind`

      // Precipitation
      const probability = payload?.forecast?.DailyForecasts?.[0]?.Day?.PrecipitationProbability
      if (probability > 40) {
        document.querySelector('#precip-probability').textContent = `${probability}%`
        document.querySelector('#precip-icon').classList.remove('hidden')
      } else {
        document.querySelector('#precip-probability').textContent = ``
        document.querySelector('#precip-icon').classList.add('hidden')
      }

      // Add Weather Forecasts
      const forecastList = document.querySelector('#weather-forecast')
      forecastList.innerHTML = ""
      payload?.hourly?.slice(0,6).forEach(f => {
        const li = buildForecastLiElement(f)
        forecastList.appendChild(li)
      })
    })
}

function buildForecastLiElement(forecast) {
  const li = document.createElement('li')
  li.classList.add('forecast-row')
  li.classList.add('row')

  const timeEl = document.createElement('div')
  const date = moment(forecast.DateTime)
  timeEl.textContent = date.format('h a')
  li.appendChild(timeEl)

  const tempEl = document.createElement('div')
  tempEl.textContent = `${forecast.Temperature.Value}`
  li.appendChild(tempEl)

  const rainProbability = forecast?.PrecipitationProbability
  const conditions = forecast?.IconPhrase
  const isDayTime = forecast?.IsDaylight
  const icon = weatherIcon(conditions, isDayTime)

  if (icon) {
    const iconEl = document.createElement('i')
    iconEl.classList.add(`flaticon-${icon}`)
    li.appendChild(iconEl)
  } else {
    const iconEl = document.createElement('div')
    iconEl.textContent = conditions
    li.appendChild(iconEl)
  }

  const probEl = document.createElement('div')
  probEl.textContent = `${rainProbability}%`
  li.appendChild(probEl)

  return li
}

function weatherIcon(weatherText, isDayTime) {
  console.log(weatherText)
  switch (weatherText?.toLowerCase()) {
    case 'sunny':
    case 'mostly clear':
    case 'mostly sunny':
      return isDayTime ? 'sun' : 'moon-1';
    case 'partly sunny':
      return 'cloudy';
    case 'partly cloudy':
    case 'intermittent clouds':
      return 'cloud';
    case 'mostly cloudy':
      return 'cloudy-1';
    case 'cloudy':
      return 'cloudy-2'
    case 'showers':
      return 'rain';
  }

  return undefined
}

/* ============== Sports ================= */

function getJaysSchedule() {
  fetch('/mlb')
    .then(response => response.json())
    .then(payload => {
      console.log(payload)

      const game = payload.dates?.[0]?.games?.[0]
      console.log(game)
      if (game) {
        const gameStart = moment(game.gameDate)
        const gameState = game.status.abstractGameState
        console.log(`Start date: ${gameStart.toString()}`)
        console.log(gameState)


        const awayTeam = game.teams.away.team.abbreviation
        const awayTeamId = game.teams.away.team.id
        const awayTeamScore = game.teams.away.score

        const homeTeam = game.teams.home.team.abbreviation
        const homeTeamId = game.teams.home.team.id
        const homeTeamScore = game.teams.home.score

        const awayTeamRecord = game.teams.away.leagueRecord
        const awayTeamRecordDisplay = `${awayTeamRecord.wins} - ${awayTeamRecord.losses}`

        const homeTeamRecord = game.teams.home.leagueRecord
        const homeTeamRecordDisplay = `${homeTeamRecord.wins} - ${homeTeamRecord.losses}`


        document.querySelector('#away-team-logo').src = teamLogoUrl(awayTeamId)
        document.querySelector('#home-team-logo').src = teamLogoUrl(homeTeamId)


        document.querySelector('#away-team-name').textContent = awayTeam
        document.querySelector('#away-team-name-detail').textContent = awayTeamRecordDisplay
        document.querySelector('#home-team-name').textContent = homeTeam
        document.querySelector('#home-team-name-detail').textContent = homeTeamRecordDisplay

        document.querySelector('#home-team-name').textContent = homeTeam
        document.querySelector('#home-team-name').textContent = homeTeam

        document.querySelector('#game-status-text').textContent = gameState
        if (gameStart.isAfter(moment())) { // upcoming
          document.querySelector('#game-status-text').textContent = '@'
          document.querySelector('#game-status-subtext').textContent = gameStart.format('h:mm')
        } else if (gameState === 'Live') { // in progress
          document.querySelector('#home-team-score').textContent = homeTeamScore
          document.querySelector('#away-team-score').textContent = awayTeamScore

          const inning = game.linescore.currentInningOrdinal
          const state = game.linescore.inningState
          const outs = game.linescore.outs
          document.querySelector('#game-status-text').textContent = `${state} ${inning}`

          const outText = outs < 3 ? `${outs} out` : ''
          document.querySelector('#game-status-subtext').textContent = outText
        } else { // complete
          document.querySelector('#home-team-score').textContent = homeTeamScore
          document.querySelector('#away-team-score').textContent = awayTeamScore
          document.querySelector('#game-status-subtext').textContent = ""
        }
      } else {
        console.log("NO GAME!")
      }
  })
}


function teamLogoUrl(teamId) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`
}


/* ============ Main ====================== */
configureMoment()
showDate()
showPositiveMessage()
showTime()
showCartoonCharacter()
getCalendarEvents()
getWeather()
getJaysSchedule()


/* Run Loop */
setInterval(() => {
  showTime()
  showDate()
  updatePositiveMessage() // can probably change this logic now
}, 1000) // Update clock every second

setInterval(() => {
  getWeather() // controlled on server side, so can request frequently
}, 1000*60*5)  // 5 min updates

setInterval(() => {
  getCalendarEvents() // no check on server
  getJaysSchedule() // controlled on server side
}, 1000*60*15)  // 15 min updates

setInterval(() => {
  reverseRows()
}, 1000*60*60) // change layout every hour to prevent burn in


let reversed = false
function reverseRows() {
  const rows = document.querySelectorAll('.row')
  const columns = document.querySelectorAll('.column-reversible')
  if (reversed) {
    rows.forEach(el => el.classList.remove('row-reverse'))
    columns.forEach(el => el.classList.remove('reversed'))
  } else {
    rows.forEach(el => el.classList.add('row-reverse'))
    columns.forEach(el => el.classList.add('reversed'))
  }
  reversed = !reversed
}

/* Setup */

function configureMoment() {
  moment.relativeTimeThreshold('h', 48); // better than "a day for 36 hours"
  moment.relativeTimeThreshold('w', 4);  // enables weeks
}









