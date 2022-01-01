
/* ========== Date ========== */
export function showDate() {
  const dateElement = document.querySelector("#date")
  dateElement.textContent = moment().format('dddd, MMM D')
}

/* ========== Time ========== */
export function showTime() {
  const timeElement = document.querySelector("#time")
  timeElement.textContent = moment().format('h:mm')
}

