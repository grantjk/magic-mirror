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
      console.log(filteredEvents)
      const calendarElement = document.querySelector('#event-list')

      // Show a nice prompt if today is a full day event
      const fullDayEvent = filteredEvents.filter(e => e.allDay)?.[0]

      const isToday = fullDayEvent && moment.utc(fullDayEvent.start.raw).isSame(moment(), 'day')
      if (isToday) {
        const todayElement = document.querySelector('#today-description')
        todayElement.textContent = `${fullDayEvent.title}`

        // filter out the first full day event if we are showing it in the title
        filteredEvents = filteredEvents.filter(e => e != fullDayEvent)
      }

      const nextEvent = filteredEvents[0]
      calendarEventLoop(nextEvent)
      document.querySelector('#up-next-event-name').textContent = nextEvent.title
      if (eventCurrentlyHappening(nextEvent)) {
        document.querySelector('#up-next-time-range').textContent = ''
      } else {
        document.querySelector('#up-next-time-range').textContent = eventTimeRange(nextEvent)
      }

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

function recomputeRelativeTime(event) {
  const element = document.querySelector('#up-next-relative')

  if (eventCurrentlyHappening(event)) {
    element.textContent = `Happening now until ${event.end.time}`
  } else {
    element.textContent = `Up next ${eventRelativeTime(event)}`
  }
}

function eventCurrentlyHappening(event) {
  const start = moment(event.start.raw)
  const end = moment(event.end.raw)
  const now = moment()

  return start.isBefore(now) && end.isAfter(now)
}

function eventIsOver(event) {
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
function getWeather({fromCache}) {
  const encoded = encodeURIComponent(fromCache)
  fetch(`/weather?fromCache=${fromCache}`)
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


/* ============ Main ====================== */
configureMoment()
showDate()
showPositiveMessage()
showTime()
showCartoonCharacter()
getCalendarEvents()
getWeather({fromCache: true})


/* Run Loop */
setInterval(() => {
  showTime()
  showDate()
  updatePositiveMessage()
}, 1000) // Update clock every second

setInterval(() => {
  getCalendarEvents()
}, 1000*60*15) // 15 min update for calendar

setInterval(() => {
  getWeather({fromCache: false})
}, 1000*60*60)

setInterval(() => {
  reverseRows()
}, 1000*60*60) // change layout every hour to prevent burn in


let reversed = false
function reverseRows() {
  const elements = document.querySelectorAll('.row')
  if (reversed) {
    elements.forEach(el => el.classList.remove('row-reverse'))
  } else {
    elements.forEach(el => el.classList.add('row-reverse'))
  }
  reversed = !reversed
}

/* Setup */

function configureMoment() {
  moment.relativeTimeThreshold('h', 48); // better than "a day for 36 hours"
  moment.relativeTimeThreshold('w', 4);  // enables weeks
}









