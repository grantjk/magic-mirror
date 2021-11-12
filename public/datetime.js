
/* ========== Date ========== */
export function showDate() {
  const date = new Date(Date.now());
  const dateElement = document.querySelector("#date");
  const displayOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
  };

  dateElement.textContent = date.toLocaleDateString("en-us", displayOptions);
}

/* ========== Time ========== */
export function showTime() {
  const time = new Date();
  const timeElement = document.querySelector("#time");
  let hours = time.getHours();

  if (hours > 12) {
    hours = hours - 12;
  }

  let mins = time.getMinutes();
  if (mins < 10) {
    mins = `0${mins}`;
  }

  const fullTime = `${hours}<span class="colon">:</span>${mins}`;
  timeElement.innerHTML = fullTime;
}

