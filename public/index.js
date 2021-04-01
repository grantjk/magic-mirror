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
      const calendarElement = document.querySelector('#calendar')

      const listElement = document.createElement('ul')
      payload.forEach(event => {
        const itemElement = document.createElement('li')
        itemElement.classList.add('calendar-event')
        listElement.appendChild(itemElement)

        // Date Container
        const datecontainer = document.createElement('div')
        datecontainer.classList.add('datecontainer')
        itemElement.appendChild(datecontainer)

        const monthbox = document.createElement('div')
        monthbox.classList.add('monthbox')
        monthbox.textContent = event.start.month
        datecontainer.appendChild(monthbox)

        const datebox = document.createElement('div')
        datebox.classList.add('datebox')
        datebox.textContent = event.start.date
        datecontainer.appendChild(datebox)

        const timebox = document.createElement('div')
        timebox.classList.add('timebox')
        timebox.textContent = event.start.time
        datecontainer.appendChild(timebox)

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

/* ============= Weather ===================== */
function getWeather() {
  fetch('/weather')
    .then(response => response.json())
    .then(payload => {
      console.log(payload)
    })
}


/* ============ Main ====================== */
showDate()
showPositiveMessage()
showTime()
showCartoonCharacter()
getCalendarEvents()
getWeather()

setInterval(() => {
  showTime()
  showDate()
  updatePositiveMessage()
}, 1000)









 

