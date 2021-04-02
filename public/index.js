/* ========== Date ========== */
function showDate(){
  const date = new Date(Date.now())
  const dateElement = document.querySelector('#date')
  const displayOptions = {
    weekday:'long',
    month:'long',
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

  const fullTime = `${hours}<span class="colon">:</span>${mins} ${ampm}`
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
      const calendarElement = document.querySelector('#event-list')

      // Show a nice prompt if today is a full day event
      const fullDayEvent = payload.filter(e => e.allDay)?.[0]
      const isToday = fullDayEvent && moment(fullDayEvent).isSame(moment(), 'day')
      if (isToday) {
        const todayElement = document.querySelector('#today-description')
        todayElement.textContent = `Today is ${fullDayEvent.title}`
      }


      // Show The Up Next block, or for events that are happening now
      let events = payload
      if (fullDayEvent) {
        events = events.filter(e => e != fullDayEvent) 
      }

      const nextEvent = events[0]
      calendarEventLoop(nextEvent)
      document.querySelector('#up-next-event-name').textContent = nextEvent.title 
      document.querySelector('#up-next-time-range').textContent = eventTimeRange(nextEvent)




      const remaining = events.slice(1)
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

        const timebox = document.createElement('div')
        timebox.classList.add('timebox')
        datecontainer.appendChild(timebox)

        monthbox.textContent = event.start.month
        datebox.textContent = event.start.date
        if (!event.allDay) {
          timebox.textContent = event.start.time
        }

        // Event Container
        const eventcontainer = document.createElement('div')
        eventcontainer.classList.add('eventcontainer')
        itemElement.appendChild(eventcontainer)

        const eventName = document.createElement('div')
        eventName.classList.add('event-name')
        eventName.textContent = event.title
        eventcontainer.appendChild(eventName)

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

function eventRelativeTime(event) {
  if (event.allDay) {
    return moment.utc(event.start.raw).fromNow()
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
  fetch('/weather')
    .then(response => response.json())
    .then(payload => {
      // Weather Icon
      const conditions = payload?.current?.WeatherText
      const dayTime = payload?.current?.IsDayTime
      const iconEl = document.querySelector('#weather-icon')
      iconEl.className = `weather-icon flaticon-${weatherIcon(conditions, dayTime)}`

      // Set Current Temp
      const currentTemp = payload?.current?.Temperature?.Metric?.Value
      document.querySelector('#weather-temp').textContent = currentTemp

      // Set Prompt
      const prompt = payload?.forecast?.Headline?.Text
      document.querySelector('#weather-prompt').textContent = `${conditions}. ${prompt}`

      // Set Feels Like
      const feelsLike = payload?.current?.RealFeelTemperature?.Metric?.Value
      document.querySelector('#feels-like').textContent = `Feels like ${feelsLike}`

      // Set High / Low
      const high = payload?.forecast?.DailyForecasts?.[0]?.Temperature?.Maximum?.Value
      const low = payload?.forecast?.DailyForecasts?.[0]?.Temperature?.Minimum?.Value
      document.querySelector('#high-low').textContent = `${high} / ${low}`

      // Set Wind Gust
      const windGustSpeed = payload?.current?.WindGust?.Speed?.Metric?.Value
      const windSpeedDirection = payload?.current?.Wind?.Direction?.English
      document.querySelector('#wind').textContent = `Wind ${windGustSpeed} km/h (${windSpeedDirection})`
    })
}

function weatherIcon(weatherText, isDayTime) {
  if (!isDayTime) {
    return 'moon'
  }

  if (weatherText === 'Sunny') {
    return 'sun-1'
  }
  return weatherText
}


/* ============ Main ====================== */
configureMoment()
showDate()
showPositiveMessage()
showTime()
showCartoonCharacter()
getCalendarEvents()
getWeather()


/* Run Loop */
setInterval(() => {
  showTime()
  showDate()
  updatePositiveMessage()
}, 1000) // Update clock every second

setInterval(() => {
  getCalendarEvents()
}, 1000*60*15) // 15 min update for calendar

/* Setup */

function configureMoment() {
  moment.relativeTimeThreshold('h', 48); // better than "a day for 36 hours"
  moment.relativeTimeThreshold('w', 4);  // enables weeks
}







 

