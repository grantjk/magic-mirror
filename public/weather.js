/* ============= Weather ===================== */
export function getWeather() {
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
    temp: Math.round(forecast.Temperature.Value),
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
    temp: `${Math.round(forecast.Temperature.Maximum.Value)} | ${Math.round(forecast.Temperature.Minimum.Value)}`,
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
  tempEl.textContent = temp;
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
    case "partly cloudy w/ showers":
    case "heavy rain":
      return "rain";
    case "thunderstorms":
    case "thunderstorm":
    case "partly cloudy w/ t-storms":
    case "mostly cloudy w/ t-storms":
    case "partly sunny w/ t-storms":
    case "mostly sunny w/ t-storms":
      return "thunderstorm";
    case "snow":
    case "rain and snow":
    case "flurries":
    case "light snow":
    case "partly sunny w/ flurries":
    case "partly cloudy w/ flurries":
    case "mostly cloudy w/ flurries":
      return "frost";
  }

  return undefined;
}

