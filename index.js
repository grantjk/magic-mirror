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
  fetch('messages.txt')
    .then(response => response.text())
    .then(text => {
      const messageList = text.split('\n')
      const messageNumber = Math.floor(Math.random()*messageList.length)
      const messageElement = document.querySelector('#positiveMessage')
      messageElement.textContent = messageList[messageNumber]
    })
}


/* ============ Main ====================== */
showDate()
showPositiveMessage()
showTime()

setInterval(() => {
  showTime()
  showDate()
  updatePositiveMessage()
}, 1000)










