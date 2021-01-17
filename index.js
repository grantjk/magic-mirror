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

showDate()
showPositiveMessage()













