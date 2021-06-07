/* ========== Date ========== */
function showDate() {
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
function showTime() {
  const time = new Date();
  const timeElement = document.querySelector("#time");
  let ampm = "AM";
  let hours = time.getHours();
  if (hours > 12) {
    hours = hours - 12;
    ampm = "PM";
  }

  let mins = time.getMinutes();
  if (mins < 10) {
    mins = `0${mins}`;
  }

  const fullTime = `${hours}<span class="colon">:</span>${mins}`;
  timeElement.innerHTML = fullTime;
}

/* ========== Positive Message ========== */
function showPositiveMessage() {
  fetch("/message")
    .then((response) => response.json())
    .then((payload) => {
      const messageElement = document.querySelector("#positiveMessage");
      messageElement.textContent = payload.message;
    });
}

/* ============ Cartoon ====================== */
function showCartoonCharacter() {
  fetch("/pokemon")
    .then((response) => response.json())
    .then((payload) => {
      const cartoonElement = document.querySelector("#cartoon");
      cartoonElement.innerHTML = `<pre class='art'>${payload.art}</pre>`;
    });
}

/* ============ Calendar ================== */

function getCalendarEvents() {
  fetch("/events")
    .then((response) => response.json())
    .then((payload) => {
      let filteredEvents = payload.filter((e) => !eventIsOver(e) && isEventToday(e));
      const calendarElement = document.querySelector("#event-list");

      const listElement = document.createElement("ul");
      filteredEvents.forEach((event) => {
        const itemElement = document.createElement("li");
        itemElement.classList.add("calendar-event");
        listElement.appendChild(itemElement);


        if (event.allDay) {
          itemElement.classList.add('row');
          const eventName = document.createElement("div");
          eventName.classList.add("event-name-all-day");
          eventName.textContent = event.title;

          const spacer = document.createElement('div');
          itemElement.appendChild(spacer);
          itemElement.appendChild(eventName);
        } else {
          const timeRow = document.createElement('div');
          timeRow.classList.add('calendar-time-row');
          timeRow.textContent = `${event.start.time} - ${event.end.time}`
          itemElement.appendChild(timeRow);

          const eventName = document.createElement("div");
          eventName.classList.add("event-name");
          eventName.textContent = event.title;
          itemElement.appendChild(eventName);
        }







        // Date Container
        //const datecontainer = document.createElement("div");
        //datecontainer.classList.add("datecontainer");
        //itemElement.appendChild(datecontainer);

        //const monthbox = document.createElement("div");
        //monthbox.classList.add("monthbox");
        //datecontainer.appendChild(monthbox);

        //const datebox = document.createElement("div");
        //datebox.classList.add("datebox");
        //datecontainer.appendChild(datebox);

        //monthbox.textContent = event.start.month;
        //datebox.textContent = event.start.date;

        //// Event Container
        //const eventcontainer = document.createElement("div");
        //eventcontainer.classList.add("eventcontainer");
        //itemElement.appendChild(eventcontainer);


        //const timebox = document.createElement("div");
        //timebox.classList.add("timebox");
        //eventcontainer.appendChild(timebox);
        //if (!event.allDay) {
          //timebox.textContent = event.start.time;
        //}
      });

      calendarElement.innerHTML = "";
      calendarElement.appendChild(listElement);

      const emptyCalendar = document.getElementById('empty-calendar')
      if (filteredEvents.length == 0) {
        emptyCalendar.classList.remove('hidden')
      } else {
        emptyCalendar.classList.add('hidden')
      }
    });

}

/* Event Helpers */

function eventIsOver(event) {
  if (event.allDay) {
    const start = moment.utc(event.start.raw);
    const end = moment.utc(event.end.raw);
    const now = moment();

    return (
      start.isBefore(now) &&
      !moment(end.format("YYYY-MM-DD")).isSame(now, "day")
    );
  }

  const start = moment(event.start.raw);
  const end = moment(event.end.raw);
  const now = moment();
  return start.isBefore(now) && end.isBefore(now);
}

function eventRelativeTime(event) {
  if (event.allDay) {
    // All day events returned in UTC, so need to just get date
    // then convert back to moment for relative dates
    const ugh = moment.utc(event.start.raw).format("yyyy-MM-DD");
    return moment(ugh).fromNow();
  }
  return moment(event.start.raw).fromNow();
}

function eventTimeRange(event) {
  if (event.allDay) {
    return `${event.start.month} ${event.start.date}`;
  }
  return `${event.start.time} - ${event.end.time}`;
}

function isEventToday(event) {
  const startDate = moment(moment.utc(event.start.raw).format("YYYY-MM-DD"))
  return startDate.isSame(moment(), "day");
}

/* ============= Weather ===================== */
function getWeather() {
  fetch(`/weather`)
    .then((response) => response.json())
    .then((payload) => {
      // Weather Icon
      const conditions = payload?.current?.WeatherText;
      const dayTime = payload?.current?.IsDayTime;
      const iconEl = document.querySelector("#weather-icon");
      const iconName = weatherIcon(conditions, dayTime);
      if (iconName) {
        iconEl.className = `weather-icon flaticon-${iconName}`;
      } else {
        iconEl.textContent = conditions;
      }

      // Set Current Temp
      const currentTemp = payload?.current?.Temperature?.Metric?.Value;
      const feelsLike = payload?.current?.RealFeelTemperature?.Metric?.Value;
      document.querySelector("#weather-temp").innerHTML = `${currentTemp}`;

      // Set High / Low
      const high =
        payload?.forecast?.DailyForecasts?.[0]?.Temperature?.Maximum?.Value;
      const low =
        payload?.forecast?.DailyForecasts?.[0]?.Temperature?.Minimum?.Value;
      document.querySelector("#high-low").textContent = `${Math.round(high)} | ${Math.round(low)}`;

      // Set Wind Gust
      const windGustSpeed = payload?.current?.WindGust?.Speed?.Metric?.Value;
      document.querySelector(
        "#wind"
      ).textContent = `${windGustSpeed}km/hr wind`;

      // Precipitation
      const probability =
        payload?.forecast?.DailyForecasts?.[0]?.Day?.PrecipitationProbability;
      if (probability > 40) {
        document.querySelector(
          "#precip-probability"
        ).textContent = `${probability}%`;
        document.querySelector("#precip-icon").classList.remove("hidden");
      } else {
        document.querySelector("#precip-probability").textContent = ``;
        document.querySelector("#precip-icon").classList.add("hidden");
      }

      // Add Weather Forecasts
      const forecastList = document.querySelector("#weather-forecast");
      forecastList.innerHTML = "";

      if (moment().hour() < 20) {
        // Hourly
        payload?.hourly?.slice(0, 12).forEach((f) => {
          const li = buildHourlyListElement(f);
          forecastList.appendChild(li);
        });
      } else {
        // Daily forecasts
        payload?.forecast?.DailyForecasts?.forEach((f) => {
          const li = buildDailyListElement(f);
          forecastList.appendChild(li);
        });
      }
    });
}

function buildHourlyListElement(forecast) {
  if (!forecast) {
    return null;
  }
  const date = moment(forecast.DateTime);
  return buildForecastLiElement({
    datetime: date.format("h a"),
    temp: forecast.Temperature.Value,
    rainProbability: forecast.PrecipitationProbability,
    iconPhrase: forecast.IconPhrase,
    dayTime: forecast.IsDaylight,
  });
}

function buildDailyListElement(forecast) {
  if (!forecast) {
    return null;
  }

  const date = moment(forecast.Date);
  return buildForecastLiElement({
    datetime: date.format("ddd"),
    temp: `${forecast.Temperature.Maximum.Value} | ${forecast.Temperature.Minimum.Value}`,
    rainProbability: forecast.Day.PrecipitationProbability,
    iconPhrase: forecast.Day.IconPhrase,
    dayTime: true,
  });
}

function buildForecastLiElement({
  datetime,
  temp,
  rainProbability,
  iconPhrase,
  dayTime,
}) {
  const li = document.createElement("li");
  li.classList.add("forecast-row");
  li.classList.add("row");

  const timeEl = document.createElement("div");
  timeEl.textContent = datetime;
  li.appendChild(timeEl);

  const tempEl = document.createElement("div");
  tempEl.textContent = Math.round(temp);
  li.appendChild(tempEl);

  const icon = weatherIcon(iconPhrase, dayTime);

  if (icon) {
    const iconEl = document.createElement("i");
    iconEl.classList.add(`flaticon-${icon}`);
    li.appendChild(iconEl);
  } else {
    const iconEl = document.createElement("div");
    iconEl.textContent = iconPhrase;
    li.appendChild(iconEl);
  }

  const probEl = document.createElement("div");
  probEl.textContent = `${rainProbability}%`;
  li.appendChild(probEl);

  return li;
}

function weatherIcon(weatherText, isDayTime) {
  console.log(weatherText);
  switch (weatherText?.toLowerCase()) {
    case "sunny":
    case "clear":
    case "mostly clear":
    case "mostly sunny":
      return isDayTime ? "sun" : "moon-1";
    case "partly sunny":
      return "cloudy";
    case "partly cloudy":
    case "intermittent clouds":
      return isDayTime ? "cloud" : "cloudy-night";
    case "mostly cloudy":
      return isDayTime ? "cloudy-1" : "cloudy-night";
    case "cloudy":
    case "fog":
    case "dreary":
      return "cloudy-2";
    case "light rain":
    case "showers":
    case "drizzle":
    case "rain":
    case "partly sunny w/ showers":
    case "mostly cloudy w/ showers":
      return "rain";
    case "thunderstorms":
    case "partly cloudy w/ t-storms":
    case "mostly cloudy w/ t-storms":
    case "partly sunny w/ t-storms":
    case "mostly sunny w/ t-storms":
      return "thunderstorm";
    case "snow":
    case "flurries":
    case "light snow":
      return "frost";
  }

  return undefined;
}

/* ============== Sports ================= */

function getJaysSchedule() {
  fetch("/mlb")
    .then((response) => response.json())
    .then((payload) => {
      const game = payload.dates?.[0]?.games?.[0];
      if (game) {
        const gameStart = moment(game.gameDate);
        const gameState = game.status.abstractGameState;
        const detailedState = game.status.detailedState;

        console.log(`Start date: ${gameStart.toString()}`);
        console.log(gameState);

        const awayTeam = game.teams.away.team.abbreviation;
        const awayTeamId = game.teams.away.team.id;
        const awayTeamScore = game.teams.away.score;

        const homeTeam = game.teams.home.team.abbreviation;
        const homeTeamId = game.teams.home.team.id;
        const homeTeamScore = game.teams.home.score;

        const awayTeamRecord = game.teams.away.leagueRecord;
        const awayTeamRecordDisplay = `${awayTeamRecord.wins} - ${awayTeamRecord.losses}`;

        const homeTeamRecord = game.teams.home.leagueRecord;
        const homeTeamRecordDisplay = `${homeTeamRecord.wins} - ${homeTeamRecord.losses}`;

        document.querySelector("#away-team-logo").src = teamLogoUrl(awayTeamId);
        document.querySelector("#home-team-logo").src = teamLogoUrl(homeTeamId);

        document.querySelector("#away-team-name").textContent = awayTeam;
        document.querySelector(
          "#away-team-name-detail"
        ).textContent = awayTeamRecordDisplay;
        document.querySelector("#home-team-name").textContent = homeTeam;
        document.querySelector(
          "#home-team-name-detail"
        ).textContent = homeTeamRecordDisplay;

        document.querySelector("#home-team-name").textContent = homeTeam;
        document.querySelector("#home-team-name").textContent = homeTeam;

        document.querySelector("#game-status-text").textContent = detailedState;
        if (gameStart.isAfter(moment())) {
          // upcoming
          document.querySelector("#game-status-text").textContent = "@";
          document.querySelector(
            "#game-status-subtext"
          ).textContent = gameStart.format("h:mm");
          document.querySelector("#home-team-score").textContent = "";
          document.querySelector("#away-team-score").textContent = "";
        } else if (gameState === "Live") {
          // in progress
          document.querySelector(
            "#home-team-score"
          ).textContent = homeTeamScore;
          document.querySelector(
            "#away-team-score"
          ).textContent = awayTeamScore;

          const inning = game.linescore.currentInningOrdinal;
          const state = game.linescore.inningState;
          const outs = game.linescore.outs;
          document.querySelector(
            "#game-status-text"
          ).textContent = `${state} ${inning}`;

          const outText = outs < 3 ? `${outs} out` : "";
          document.querySelector("#game-status-subtext").textContent = outText;
        } else {
          // complete
          document.querySelector(
            "#home-team-score"
          ).textContent = homeTeamScore;
          document.querySelector(
            "#away-team-score"
          ).textContent = awayTeamScore;
          document.querySelector("#game-status-subtext").textContent = "";
        }
      } else {
        console.log("NO GAME!");
      }
    });
}

function teamLogoUrl(teamId) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

/* ============ Main ====================== */
configureMoment();
showDate();
showPositiveMessage();
showTime();
showCartoonCharacter();
getCalendarEvents();
getWeather();
getJaysSchedule();

/* Run Loop */
setInterval(() => {
  showTime();
  showDate();
}, 1000); // Update clock every second

setInterval(() => {
  getWeather(); // controlled on server side, so can request frequently
  showCartoonCharacter();
}, 1000 * 60 * 60); // 5 min updates - 90 for now to get a hold on the rate limit

// setInterval(() => {
//   getCalendarEvents() // no check on server
//   showPositiveMessage()
// }, 1000*60*15)  // 15 min updates

/* Test the TTL on the cache headers */
setInterval(() => {
  getJaysSchedule(); // dynamic timing based on server
  getCalendarEvents(); // no check on server
  showPositiveMessage();
}, 1000 * 60); // every minute

setInterval(() => {
  reverseRows();
}, 1000 * 60 * 60); // change layout every hour to prevent burn in

let reversed = false;
function reverseRows() {
  const rows = document.querySelectorAll(".row");
  const columns = document.querySelectorAll(".column-reversible");
  if (reversed) {
    rows.forEach((el) => el.classList.remove("row-reverse"));
    columns.forEach((el) => el.classList.remove("reversed"));
  } else {
    rows.forEach((el) => el.classList.add("row-reverse"));
    columns.forEach((el) => el.classList.add("reversed"));
  }
  reversed = !reversed;
}

/* Setup */

function configureMoment() {
  moment.relativeTimeThreshold("h", 48); // better than "a day for 36 hours"
  moment.relativeTimeThreshold("w", 4); // enables weeks
}
