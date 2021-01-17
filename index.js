const date = new Date(Date.now())
const dateElement = document.querySelector('#date')
const displayOptions = {
  weekday:'long',
  month:'long',
  day:'numeric'
}

dateElement.textContent = date.toLocaleDateString('en-us', displayOptions)

/*
*/















